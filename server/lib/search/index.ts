import fastLevenshtein from 'fast-levenshtein';

export interface SearchResult {
  id: string;
  source: string;
  score: number;
  matchedTerms: string[];
  highlights: string[];
  context: string;
  index: string;
}

/**
 * Normalize a phone number by removing non-digit characters
 */
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Check if a query looks like a phone number
 */
function isPhoneNumber(query: string): boolean {
  const digits = query.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 && /^\d+$/.test(digits);
}

/**
 * Perform fuzzy search using Elasticsearch
 */
export async function performFuzzySearch(query: string, elasticsearchUri: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    throw new Error('Search query is required');
  }

  console.log('Starting fuzzy search for:', query);

  // Determine if query is a phone number and normalize if it is
  const isPhone = isPhoneNumber(query);
  const searchQuery = isPhone ? normalizePhoneNumber(query) : query;

  // Indices we want to search in
  const searchIndices = ['fs_chunks_index', 'filesearchdb.fs.chunks'].join(',');
  console.log('Using Elasticsearch endpoint:', elasticsearchUri);
  console.log('Searching indices:', searchIndices);

  // Build search query with improved matching
  const searchBody = {
    size: 100,
    track_total_hits: true,
    _source: ["data", "content", "data.content"],
    highlight: {
      fields: {
        "data": {
          "type": "unified",
          "number_of_fragments": 3,
          "fragment_size": 150,
          "pre_tags": ["<mark>"],
          "post_tags": ["</mark>"]
        },
        "content": {
          "type": "unified",
          "number_of_fragments": 3,
          "fragment_size": 150,
          "pre_tags": ["<mark>"],
          "post_tags": ["</mark>"]
        },
        "data.content": {
          "type": "unified",
          "number_of_fragments": 3,
          "fragment_size": 150,
          "pre_tags": ["<mark>"],
          "post_tags": ["</mark>"]
        }
      }
    },
    query: {
      bool: {
        should: [
          // Exact phrase match with highest boost
          {
            match_phrase: {
              "content": {
                "query": searchQuery,
                "boost": 3
              }
            }
          },
          // Multi-field match for better coverage
          {
            multi_match: {
              "query": searchQuery,
              "fields": ["data", "content", "data.content"],
              "type": "best_fields",
              "operator": "or",
              "boost": 2
            }
          },
          // Fuzzy match for non-phone queries
          ...(!isPhone ? [{
            multi_match: {
              "query": searchQuery,
              "fields": ["data", "content", "data.content"],
              "operator": "or",
              "fuzziness": "AUTO",
              "prefix_length": 2,
              "boost": 1
            }
          }] : [])
        ],
        minimum_should_match: 1,
        filter: [
          {
            terms: {
              "_index": [
                "fs_chunks_index",
                "filesearchdb.fs.chunks"
              ]
            }
          }
        ]
      }
    }
  };

  // Add request timeout and error handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    console.log('Sending search request to Elasticsearch...');
    const searchResponse = await fetch(`${elasticsearchUri}/${searchIndices}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Elasticsearch error response:', errorText);
      throw new Error(`Search request failed: ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Elasticsearch response metadata:', {
      took: searchData.took,
      total: searchData.hits?.total,
      numHits: searchData.hits?.hits?.length
    });

    const hits = searchData.hits?.hits || [];
    if (hits.length === 0) {
      console.log('No results found');
      return [];
    }

    // Process and enhance search results
    const results = hits.map((hit: any) => {
      const source = hit._source?.data || '';
      const fileName = hit._source?.file_name || '';
      const filePath = hit._source?.file_path || '';
      const fileType = hit._source?.file_type || '';
      const filesId = hit._source?.files_id || '';
      const n = hit._source?.n || null;
      const highlights = Object.values(hit.highlight || {})
        .flat()
        .map((h: unknown) => h?.toString() || '');
      
      // Extract matched terms from highlights
      const matchedTerms = new Set<string>();
      highlights.forEach((highlight: string) => {
        const terms = highlight.match(/<mark>([^<]+)<\/mark>/g) || [];
        terms.forEach(term => {
          const cleanTerm = term.replace(/<\/?mark>/g, '');
          if (cleanTerm && cleanTerm.length > 2) {
            matchedTerms.add(cleanTerm);
          }
        });
      });

      if (matchedTerms.size === 0) {
        const terms = source.split(/[\,\s]+/);
        terms.forEach((term: string) => {
          const normalizedTerm = term.toLowerCase();
          const normalizedQuery = searchQuery.toLowerCase();
          if (
            normalizedTerm.includes(normalizedQuery) ||
            normalizedQuery.includes(normalizedTerm) ||
            (normalizedTerm.length > 3 &&
             fastLevenshtein.get(normalizedTerm, normalizedQuery) <= 2)
          ) {
            matchedTerms.add(term.trim());
          }
        });
      }

      const context = highlights.length > 0 ?
        highlights.map((h: string) => h.replace(/<\/?mark>/g, '')).join(' ... ') :
        source.length > 400 ? `${source.slice(0, 400)}...` : source;
      
      // Map to frontend-expected fields
      return matchedTerms.size > 0 ? {
        id: hit._id,
        score: hit._score,
        index: hit._index,
        source, // main content
        content: source, // alias for frontend
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
        files_id: filesId,
        n,
        context,
        highlights,
        matchedTerms: Array.from(matchedTerms)
      } : null;
    })
    .filter((result: any) => result !== null);

    // Sort results by score
    results.sort((a: SearchResult, b: SearchResult) => b.score - a.score);

    console.log(`Found ${results.length} relevant results`);
    return results;
  } catch (error) {
    console.error('Search error:', error);
    if (error instanceof Error) {
      throw new Error(`Search failed: ${error.message}`);
    }
    throw new Error('Search failed with an unknown error');
  }
}

/**
 * Perform local search (backup implementation)
 */
export async function performLocalSearch(query: string): Promise<SearchResult[]> {
  // Implementation of local search as a fallback
  // This would search through any locally cached data
  return [];
}
