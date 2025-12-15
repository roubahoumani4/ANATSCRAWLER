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
}export async function performElasticsearchSearch(query: string, elasticsearchUri: string): Promise<SearchResult[]> {
  try {
    // Search both 'darkweb_structured' and 'files_index' indices
    const indices = ['darkweb_structured', 'files_index'];
    
    // Normalize query: trim whitespace
    const normalizedQuery = query.trim();
    
    console.log(`[ES Search] Normalized query: "${normalizedQuery}"`);
    
    // Search both indices
    const allResults: any[] = [];
    
    for (const indexName of indices) {
      console.log(`[ES Search] Searching index: ${indexName}`);
      
      // Use a simple match_phrase query for exact matching (handles special characters like @ and .)
      const searchBody: any = {
        query: {
          bool: {
            should: [
              // Match phrase for exact sequences
              {
                match_phrase: {
                  content: {
                    query: normalizedQuery,
                    slop: 0
                  }
                }
              },
              // Wildcard for partial matching
              {
                wildcard: {
                  content: {
                    value: `*${normalizedQuery}*`,
                    case_insensitive: true
                  }
                }
              },
              // Regular match for token-based search
              {
                match: {
                  content: {
                    query: normalizedQuery,
                    operator: "or"
                  }
                }
              }
            ],
            minimum_should_match: 1
          }
        },
        _source: indexName === 'files_index'
          ? ["content", "file_name", "file_path", "file_type", "file_size", "database_source"]
          : [
            "content",
            "fileName",
            "timestamp",
            "source",
            "context",
            "name",
            "first_name",
            "last_name",
            "phone",
            "email",
            "birthdate",
            "gender",
            "locale",
            "city",
            "location",
            "location2",
            "link",
            "link2",
            "protocol",
            "social_link",
            "fileType",
            "extractionConfidence",
            "exposed",
            "database_source"
          ],
        size: 50,
        sort: [
          { _score: "desc" }
        ]
      };

      // Only enable highlighting for the structured index to avoid hitting
      // index.highlight.max_analyzed_offset limits on very large file contents.
      if (indexName !== 'files_index') {
        searchBody.highlight = {
          fields: {
            content: {
              pre_tags: ["<em>"],
              post_tags: ["</em>"],
              fragment_size: 150,
              number_of_fragments: 3
            }
          }
        };
      }
      
      const searchResponse = await fetch(`${elasticsearchUri}/${indexName}/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchBody)
      });

      const searchData = await searchResponse.json() as any;
      console.log(`[ES Search] ${indexName} response status: ${searchResponse.status}`);
      console.log(`[ES Search] ${indexName} hits:`, searchData.hits?.total?.value || 0);
      
      if (searchResponse.ok && searchData.hits && searchData.hits.hits) {
        console.log(`[ES Search] Adding ${searchData.hits.hits.length} results from ${indexName}`);
        allResults.push(...searchData.hits.hits);
      } else {
        console.log(`[ES Search] No results from ${indexName}:`, searchData.error || 'Unknown error');
      }
    } // End of for loop
    
    console.log(`[ES Search] Total results from all indices: ${allResults.length}`);
    
    // Sort all results by score
    allResults.sort((a, b) => b._score - a._score);
    
    // Take top 100 results
    const topResults = allResults.slice(0, 100);

    // Process results and extract individual matches from files_index
    const processedResults: any[] = [];
    
    console.log(`[ES Search] Processing ${topResults.length} top results`);
    
    for (const hit of topResults) {
      // Infer database source from file path or database_source field
      const databaseSource = inferDatabaseSource(
        hit._source.file_path || hit._source.source,
        hit._source.database_source
      );
      
      // If this is from files_index, parse the content and extract matching entries
      if (hit._index === 'files_index' && hit._source.content) {
        const content = hit._source.content;
        const matches = extractMatchingEntries(content, normalizedQuery);
        
        // Create a separate result for each matching entry (up to 10 per file)
        matches.slice(0, 10).forEach((match, index) => {
          console.log(`[ES Search] Match extracted:`, {
            username: match.username,
            password: match.password,
            context: match.context
          });
          
          processedResults.push({
            id: `${hit._id}_${index}`,
            score: hit._score,
            source: hit._source.file_path || hit._index,
            fileName: hit._source.file_name || '',
            content: match.content,
            timestamp: hit._source.timestamp || '',
            collection: hit._index,
            matchedTerms: hit.matchedTerms || [],
            highlights: [match.content],
            context: match.context || '',
            index: hit._index || '',
            name: match.username || '',
            first_name: '',
            last_name: '',
            phone: '',
            email: match.username || '',
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
            exposed: match.password ? ['password'] : [],
            file_size: hit._source.file_size || 0,
            file_path: hit._source.file_path || '',
            password: match.password || '',
            database_source: databaseSource,
          });
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
          matchedTerms: hit.matchedTerms || [],
          highlights: hit.highlight?.content || [],
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
          fileType: hit._source.fileType || hit._source.file_type || '',
          extractionConfidence: hit._source.extractionConfidence || '',
          exposed: hit._source.exposed || [],
          file_size: hit._source.file_size || 0,
          file_path: hit._source.file_path || '',
          database_source: databaseSource,
        });
      }
    }

    console.log(`[ES Search] Final processed results: ${processedResults.length}`);
    return processedResults.slice(0, 100);
  } catch (error) {
    console.error('[ES Search] Error:', error);
    throw error;
  }
}

export async function performLocalSearch(items: any[], query: string, searchFields: string[]): Promise<any[]> {
  return fuzzySearch(items, query, searchFields);
}
