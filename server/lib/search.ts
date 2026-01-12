import { fuzzySearch } from '../utils/search';

interface SearchResult {
  id: string;
  score: number;
  source: string;
  fileName?: string;
  content: string;
  timestamp?: string;
  collection?: string;
}

interface ElasticsearchHit {
  _id: string;
  _score: number;
  _index: string;
  _source: {
    source?: string;
    fileName?: string;
    content: string;
    timestamp?: string;
  };
  highlight?: {
    content?: string[];
  };
}

interface MatchedEntry {
  username: string;
  password: string;
  content: string;
  context: string;
}

/**
 * Infer database source from file path or database_source field
 */
function inferDatabaseSource(filePath: string | undefined, databaseSource: string | undefined): string {
  // If database_source is explicitly set in Elasticsearch, use it
  if (databaseSource) {
    return databaseSource;
  }
  
  // Otherwise, try to infer from file path
  if (!filePath) {
    return 'Unknown';
  }
  
  const pathLower = filePath.toLowerCase();
  
  // Check for database indicators in the path
  if (pathLower.includes('naz.api') || pathLower.includes('nazapi') || pathLower.includes('naz_api')) {
    return 'naz.api';
  }
  
  if (pathLower.includes('compilationofmanybreaches') || 
      pathLower.includes('compilation_of_many_breaches') ||
      pathLower.includes('compilationbreaches')) {
    return 'CompilationOfManyBreaches';
  }
  
  // If no pattern matched, return the file path as source
  return 'Unknown';
}

/**
 * Extract individual matching email:password entries from file content
 */
function extractMatchingEntries(content: string, query: string): MatchedEntry[] {
  const matches: MatchedEntry[] = [];
  const queryLower = query.toLowerCase();
  
  // Limit content size to prevent memory issues (max 5MB of content to parse)
  const MAX_CONTENT_SIZE = 5 * 1024 * 1024;
  const contentToProcess = content.length > MAX_CONTENT_SIZE ? content.substring(0, MAX_CONTENT_SIZE) : content;
  
  console.log(`[ES Search] extractMatchingEntries called with content size:`, content.length, 'bytes (processing', contentToProcess.length, 'bytes)');
  
  try {
    // Only try to parse as JSON if content is reasonably small (< 1MB)
    if (contentToProcess.length < 1024 * 1024) {
      // Clean the content: remove trailing commas
      let cleanedContent = contentToProcess.trim();
      // Remove trailing comma at the end
      if (cleanedContent.endsWith(',')) {
        cleanedContent = cleanedContent.slice(0, -1);
      }
      // Remove trailing commas before closing braces/brackets
      cleanedContent = cleanedContent.replace(/,(\s*[}\]])/g, '$1');
      
      // Try to parse as JSON first
      const parsed = JSON.parse(cleanedContent);
      
      console.log(`[ES Search] Successfully parsed small JSON`);
      
      // Check if it has a content array (structured format)
      if (parsed.content && Array.isArray(parsed.content)) {
        console.log(`[ES Search] Found content array with ${parsed.content.length} entries`);
        parsed.content.forEach((entry: any) => {
          // Extract all possible fields - prioritize email over username, hash over password
          const email = entry.email || entry.username || '';
          const hash = entry.hash || entry.password || '';
          
          const combined = `${email}:${hash}`.toLowerCase();
          
          // Check if the query matches any field
          if (combined.includes(queryLower) || 
              email.toLowerCase().includes(queryLower) ||
              hash.toLowerCase().includes(queryLower)) {
            matches.push({
              username: email,
              password: hash,
              content: `${email}:${hash}`,
              context: JSON.stringify(entry) // Pass the full entry as JSON context
            });
          }
        });
      } else if (parsed.email || parsed.username) {
        // Handle single JSON object (not an array)
        const email = parsed.email || parsed.username || '';
        const hash = parsed.hash || parsed.password || '';
        
        const combined = `${email}:${hash}`.toLowerCase();
        
        // Check if the query matches any field
        if (combined.includes(queryLower) || 
            email.toLowerCase().includes(queryLower) ||
            hash.toLowerCase().includes(queryLower)) {
          console.log(`[ES Search] Adding match with email="${email}" and hash="${hash}"`);
          matches.push({
            username: email,
            password: hash,
            content: `${email}:${hash}`,
            context: JSON.stringify(parsed)
          });
        }
      }
      
      // If we found matches in the parsed JSON, return them
      if (matches.length > 0) {
        return matches;
      }
    }
  } catch (e) {
    console.log(`[ES Search] JSON parsing failed or content too large, using line-by-line extraction`);
  }
  
  // Fall back to line-by-line processing (more memory efficient)
  console.log(`[ES Search] Processing content line-by-line`);
  const lines = contentToProcess.split('\n');
  let processedLines = 0;
  const MAX_MATCHES = 50; // Limit to 50 matches per file to prevent memory issues
  
  // Debug: show first few lines
  console.log(`[ES Search] Total lines in content: ${lines.length}`);
  console.log(`[ES Search] First 5 lines sample:`, lines.slice(0, 5).map(l => l.substring(0, 100)));
  console.log(`[ES Search] Looking for query: "${queryLower}"`);
  
  // If content is a single line and contains the query, try to extract from it
  if (lines.length === 1 && lines[0].toLowerCase().includes(queryLower)) {
    console.log(`[ES Search] Single-line content contains query, attempting extraction`);
    
    // Try to find email:password or email:hash patterns in the content
    const emailPasswordPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)[:\s]+([^\s,}\]]+)/gi;
    const contentStr = lines[0];
    let match;
    
    while ((match = emailPasswordPattern.exec(contentStr)) !== null && matches.length < MAX_MATCHES) {
      const email = match[1];
      const password = match[2];
      
      // Only add if the email or password matches the query
      if (email.toLowerCase().includes(queryLower) || password.toLowerCase().includes(queryLower)) {
        console.log(`[ES Search] Extracted match via regex: ${email}:${password.substring(0, 10)}...`);
        matches.push({
          username: email,
          password: password,
          content: `${email}:${password}`,
          context: `Found in single-line content`
        });
      }
    }
    
    // If we found matches, return them
    if (matches.length > 0) {
      console.log(`[ES Search] Found ${matches.length} matches via regex extraction`);
      return matches;
    }
  }
  
  for (const line of lines) {
    if (matches.length >= MAX_MATCHES) {
      console.log(`[ES Search] Reached max matches limit (${MAX_MATCHES}), stopping`);
      break;
    }
    
    const lineLower = line.toLowerCase();
    if (lineLower.includes(queryLower)) {
      processedLines++;
      
      // First, try to parse the line as JSON
      try {
        let cleanedLine = line.trim();
        if (cleanedLine.endsWith(',')) {
          cleanedLine = cleanedLine.slice(0, -1);
        }
        const lineJson = JSON.parse(cleanedLine);
        
        // Extract email and hash from the parsed JSON line
        const email = lineJson.email || lineJson.username || '';
        const hash = lineJson.hash || lineJson.password || '';
        
        if (email || hash) {
          matches.push({
            username: email,
            password: hash,
            content: `${email}:${hash}`,
            context: cleanedLine
          });
          continue;
        }
      } catch (jsonError) {
        // Line is not JSON, continue with regex matching
      }
      
      // Try to extract email:password pattern
      const emailPasswordMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}):(.+)/);
      if (emailPasswordMatch) {
        const username = emailPasswordMatch[1];
        const password = emailPasswordMatch[2].trim();
        matches.push({
          username,
          password,
          content: `${username}:${password}`,
          context: line.trim()
        });
      } else {
        // Just include the matching line
        matches.push({
          username: '',
          password: '',
          content: line.trim(),
          context: line.trim()
        });
      }
    }
  }
  
  console.log(`[ES Search] Extracted ${matches.length} matches from content`);
  return matches;
}

export async function performElasticsearchSearch(query: string, elasticsearchUri: string): Promise<SearchResult[]> {
  try {
    // Search across multiple indices
    const indices = ['darkweb_structured', 'files_index', 'collection1'];
    
    // Normalize query: trim whitespace
    const normalizedQuery = query.trim();
    
    console.log(`[ES Search] Starting optimized search for: "${normalizedQuery}"`);
    const searchStartTime = Date.now();
    
    // Use match_phrase for fast, exact matching (optimized for your curl command)
    // NOTE: we intentionally avoid returning the full `content` field here to keep network
    // payloads small. If callers need the full file content, fetch it on demand via a
    // separate endpoint.
    const minimalSourceFields = ["file_name", "file_path", "fileName", "timestamp", "source", "database_source", "file_type", "file_size", "name", "email", "password"];

    const searchBody: any = {
      query: {
        match_phrase: {
          content: {
            query: normalizedQuery,
            slop: 0
          }
        }
      },
      _source: minimalSourceFields,
      size: 50,
      sort: [
        { _score: "desc" }
      ]
    };

    // Per-index request timeout (ms)
    const REQUEST_TIMEOUT_MS = 3000;

    // Search all indices in parallel with per-index timeouts
    const searchPromises = indices.map(async indexName => {
      console.log(`[ES Search] Searching index: ${indexName}`);
      const indexStart = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(`${elasticsearchUri}/${indexName}/_search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchBody),
          signal: controller.signal
        });

        clearTimeout(timer);
        const searchData = await response.json();
        const indexEnd = Date.now();
        console.log(`[ES Search] ${indexName} completed in ${indexEnd - indexStart}ms - hits:`, searchData.hits?.total?.value || 0);

        if (searchData.hits && searchData.hits.hits) {
          return searchData.hits.hits.map((hit: any) => ({
            ...hit,
            _index: indexName // Ensure index name is preserved
          }));
        }

        return [];
      } catch (error: any) {
        clearTimeout(timer);
        if (error && error.name === 'AbortError') {
          console.log(`[ES Search] ${indexName} request timed out after ${REQUEST_TIMEOUT_MS}ms`);
        } else {
          console.log(`[ES Search] Error searching ${indexName}:`, error && error.message ? error.message : error);
        }
        return [];
      }
    });

    // Wait for all searches to complete
    const allIndexResults = await Promise.all(searchPromises);
    const allResults = allIndexResults.flat();
    
    const searchEndTime = Date.now();
    console.log(`[ES Search] All indices completed in ${searchEndTime - searchStartTime}ms - Total results: ${allResults.length}`);
    
    // Sort all results by score
    allResults.sort((a, b) => b._score - a._score);
    
    // Take top 50 results (optimized limit)
    const topResults = allResults.slice(0, 50);

    // Process results - for collection1 and files_index, return directly without complex parsing
    const processedResults: any[] = [];
    
    console.log(`[ES Search] Processing ${topResults.length} results`);
    
    for (const hit of topResults) {
      // Infer database source from file path or database_source field
      const databaseSource = inferDatabaseSource(
        hit._source.file_path || hit._source.source,
        hit._source.database_source
      );
      
      // For collection1 and files_index, return results directly with minimal parsing
      if ((hit._index === 'files_index' || hit._index === 'collection1')) {
        processedResults.push({
          id: hit._id,
          score: hit._score,
          source: hit._source.file_path || hit._source.source || hit._index,
          fileName: hit._source.file_name || hit._source.fileName || '',
          content: hit._source.content || '',
          timestamp: hit._source.timestamp || '',
          collection: hit._index,
          matchedTerms: [],
          highlights: [],
          context: hit._source.context || '',
          index: hit._index || '',
          name: hit._source.name || hit._source.email || '',
          first_name: '',
          last_name: '',
          phone: '',
          email: hit._source.email || '',
          birthdate: '',
          gender: '',
          locale: '',
          city: '',
          location: '',
          location2: '',
          link: '',
          link2: '',
          protocol: '',
          social_link: '',
          fileType: hit._source.file_type || '',
          extractionConfidence: '',
          exposed: hit._source.password ? ['password'] : [],
          file_size: hit._source.file_size || 0,
          file_path: hit._source.file_path || '',
          password: hit._source.password || '',
          database_source: databaseSource,
        });
      } else {
        // For darkweb_structured index, return as-is
        processedResults.push({
          id: hit._id,
          score: hit._score,
          source: hit._source.source || hit._source.file_path || hit._index,
          fileName: hit._source.fileName || hit._source.file_name || '',
          content: hit._source.content || '',
          timestamp: hit._source.timestamp || '',
          collection: hit._index,
          matchedTerms: [],
          highlights: [],
          context: hit._source.context || '',
          index: hit._index || '',
          name: hit._source.name || '',
          first_name: hit._source.first_name || '',
          last_name: hit._source.last_name || '',
          phone: hit._source.phone || '',
          email: hit._source.email || '',
          birthdate: hit._source.birthdate || '',
          gender: hit._source.gender || '',
          locale: hit._source.locale || '',
          city: hit._source.city || '',
          location: hit._source.location || '',
          location2: hit._source.location2 || '',
          link: hit._source.link || '',
          link2: hit._source.link2 || '',
          protocol: hit._source.protocol || '',
          social_link: hit._source.social_link || '',
        });
      }
    }

    // Enrich top results by fetching document content for hits that are missing email/password
    // Limited to a small number of documents to avoid large payloads / performance regressions.
    const MAX_DETAIL_FETCH = 10;
    const candidates = processedResults
      .filter(r => (r.collection === 'collection1' || r.collection === 'files_index') && (!r.email || r.email === ''))
      .slice(0, MAX_DETAIL_FETCH);

    if (candidates.length > 0) {
      console.log(`[ES Search] Enriching ${candidates.length} hits by fetching document content to extract credentials`);

      const enrichPromises = candidates.map(async (res) => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

          const response = await fetch(`${elasticsearchUri}/${encodeURIComponent(res.collection)}/_doc/${encodeURIComponent(res.id)}?_source_includes=content`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          });

          clearTimeout(timer);

          if (!response.ok) {
            console.log(`[ES Search] Failed to fetch document ${res.id} from ${res.collection} - status: ${response.status}`);
            return;
          }

          const body = await response.json();
          const content = body._source?.content || '';

          if (!content) return;

          // Run the existing extraction routine on this document's content
          const matches = extractMatchingEntries(content, normalizedQuery);
          if (matches && matches.length > 0) {
            const m = matches[0];
            res.email = m.username || res.email;
            res.password = m.password || res.password;
            res.context = res.context ? `${res.context} | extracted` : m.context;
            res.exposed = res.exposed && res.exposed.length > 0 ? res.exposed : (m.password ? ['password'] : []);
          }
        } catch (err: any) {
          if (err && err.name === 'AbortError') {
            console.log(`[ES Search] Document fetch ${res.id} timed out after ${REQUEST_TIMEOUT_MS}ms`);
          } else {
            console.log(`[ES Search] Error fetching document ${res.id}:`, err && err.message ? err.message : err);
          }
        }
      });

      await Promise.all(enrichPromises);
      console.log('[ES Search] Enrichment complete');
    }

    const processingEndTime = Date.now();
    console.log(`[ES Search] Final results: ${processedResults.length} - Total time: ${processingEndTime - searchStartTime}ms`);
    return processedResults.slice(0, 100);
  } catch (error) {
    console.error('[ES Search] Error:', error);
    throw error;
  }
}

export async function performLocalSearch(items: any[], query: string, searchFields: string[]): Promise<any[]> {
  return fuzzySearch(items, query, searchFields);
}
