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

export async function performElasticsearchSearch(query: string, elasticsearchUri: string): Promise<SearchResult[]> {
  try {
    // Search both 'darkweb_structured' and 'files_index' indices
    const indices = ['darkweb_structured', 'files_index'];
    
    // Normalize query: lowercase and remove extra spaces
    const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, ' ');
    
    // Split query into individual terms for multi-word searches
    const queryTerms = normalizedQuery.split(/\s+/);
    const searchFields = ["content", "fileName", "source", "context", "name", "first_name", "last_name", "phone", "email", "location", "link", "fileType", "extractionConfidence"];
    
    // Build search clauses - require ALL terms to match
    const mustClauses: any[] = [];
    
    // For each term, create a should clause that matches across any field
    queryTerms.forEach(term => {
      const termShouldClauses: any[] = [];
      
      searchFields.forEach(field => {
        // Use match query with operator AND for word-based matching
        termShouldClauses.push({
          match: {
            [field]: {
              query: term,
              operator: "and",
              fuzziness: "0" // No fuzzy matching, exact word only
            }
          }
        });
        
        // Also add wildcard with word boundaries for fields that might have the term
        termShouldClauses.push({
          wildcard: {
            [field]: {
              value: `${term}`,
              case_insensitive: true,
              boost: 2.0 // Boost exact matches
            }
          }
        });
        
        // Add wildcard with space before and after for word boundary matching
        termShouldClauses.push({
          wildcard: {
            [field]: {
              value: `* ${term} *`,
              case_insensitive: true,
              boost: 1.8
            }
          }
        });
        
        // Add wildcard for start of field
        termShouldClauses.push({
          wildcard: {
            [field]: {
              value: `${term} *`,
              case_insensitive: true,
              boost: 1.8
            }
          }
        });
        
        // Add wildcard for end of field
        termShouldClauses.push({
          wildcard: {
            [field]: {
              value: `* ${term}`,
              case_insensitive: true,
              boost: 1.8
            }
          }
        });
      });
      
      // Also check for the term without spaces (e.g., "roubaibrahim")
      const queryWithoutSpaces = queryTerms.join('');
      if (queryTerms.length > 1) {
        searchFields.forEach(field => {
          termShouldClauses.push({
            match: {
              [field]: {
                query: queryWithoutSpaces,
                operator: "and",
                fuzziness: "0"
              }
            }
          });
          
          termShouldClauses.push({
            wildcard: {
              [field]: {
                value: `${queryWithoutSpaces}`,
                case_insensitive: true,
                boost: 2.5
              }
            }
          });
        });
      }
      
      // Each term must match at least one field
      mustClauses.push({
        bool: {
          should: termShouldClauses,
          minimum_should_match: 1
        }
      });
    });
    
    // Search both indices
    const allResults: any[] = [];
    
    for (const indexName of indices) {
      // For files_index, we want to search the content field primarily
      const fieldsToSearch = indexName === 'files_index' 
        ? ["content", "file_name"] 
        : searchFields;
      
      // Rebuild must clauses for this specific index
      const indexMustClauses: any[] = [];
      
      queryTerms.forEach(term => {
        const termShouldClauses: any[] = [];
        
        fieldsToSearch.forEach(field => {
          // Use match query with operator AND for word-based matching
          termShouldClauses.push({
            match: {
              [field]: {
                query: term,
                operator: "and",
                fuzziness: "0" // No fuzzy matching, exact word only
              }
            }
          });
          
          // Also add wildcard with word boundaries for fields that might have the term
          termShouldClauses.push({
            wildcard: {
              [field]: {
                value: `*${term}*`,
                case_insensitive: true,
                boost: 2.0 // Boost exact matches
              }
            }
          });
        });
        
        // Each term must match at least one field
        indexMustClauses.push({
          bool: {
            should: termShouldClauses,
            minimum_should_match: 1
          }
        });
      });
    
    const searchResponse = await fetch(`${elasticsearchUri}/${indexName}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: {
          bool: {
            must: indexMustClauses // ALL terms must match (AND logic)
          }
        },
        highlight: {
          fields: {
            content: {
              pre_tags: ["<em>"],
              post_tags: ["</em>"],
              fragment_size: 150,
              number_of_fragments: 3
            }
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
        size: 100,
        sort: [
          { _score: "desc" }
        ]
      })
    });

    const searchData = await searchResponse.json() as any;
    if (searchResponse.ok && searchData.hits && searchData.hits.hits) {
      allResults.push(...searchData.hits.hits);
    }
    } // End of for loop
    
    // Sort all results by score
    allResults.sort((a, b) => b._score - a._score);
    
    // Take top 100 results
    const topResults = allResults.slice(0, 100);

    return topResults.map((hit: any) => ({
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
    }));
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export async function performLocalSearch(items: any[], query: string, searchFields: string[]): Promise<any[]> {
  return fuzzySearch(items, query, searchFields);
}
