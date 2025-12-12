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
 * Extract individual matching email:password entries from file content
 */
function extractMatchingEntries(content: string, query: string): MatchedEntry[] {
  const matches: MatchedEntry[] = [];
  const queryLower = query.toLowerCase();
  
  try {
    // Clean the content: remove trailing commas before closing braces/brackets
    const cleanedContent = content.replace(/,(\s*[}\]])/g, '$1');
    
    // Try to parse as JSON first
    const parsed = JSON.parse(cleanedContent);
    
    // Check if it has a content array (structured format)
    if (parsed.content && Array.isArray(parsed.content)) {
      parsed.content.forEach((entry: any) => {
        // Extract all possible fields
        const username = entry.username || '';
        const password = entry.password || '';
        const email = entry.email || username;
        const hash = entry.hash || password;
        
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
        matches.push({
          username: email,
          password: hash,
          content: `${email}:${hash}`,
          context: JSON.stringify(parsed)
        });
      }
    }
  } catch (e) {
    // If not JSON, try to extract email:password patterns from plain text
    const lines = content.split('\n');
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      if (lineLower.includes(queryLower)) {
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
  }
  
  return matches;
}

export async function performElasticsearchSearch(query: string, elasticsearchUri: string): Promise<SearchResult[]> {
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
          ? ["content", "file_name", "file_path", "file_type", "file_size"]
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
            "exposed"
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
