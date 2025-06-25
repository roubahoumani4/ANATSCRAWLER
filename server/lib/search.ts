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

export async function performFuzzySearch(query: string, elasticsearchUri: string): Promise<SearchResult[]> {
  try {
    // Get all available indices
    const indicesResponse = await fetch(`${elasticsearchUri}/_cat/indices?format=json`);
    const indicesData = await indicesResponse.json();
    
    if (!Array.isArray(indicesData)) {
      throw new Error('Invalid indices response');
    }

    const indicesList = indicesData
      .filter((idx: { index: string }) => !idx.index.startsWith('.'))
      .map((idx: { index: string }) => idx.index)
      .join(',');

    if (!indicesList) {
      return [];
    }

    // Perform fuzzy search
    const searchResponse = await fetch(`${elasticsearchUri}/${indicesList}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query,
                  fields: ["content", "fileName", "source"],
                  fuzziness: "AUTO",
                  prefix_length: 2,
                  boost: 1.0
                }
              },
              {
                multi_match: {
                  query,
                  fields: ["content", "fileName", "source"],
                  type: "phrase_prefix",
                  boost: 1.5
                }
              },
              {
                multi_match: {
                  query,
                  fields: ["content^2", "fileName^3", "source^1.5"],
                  type: "best_fields",
                  tie_breaker: 0.3,
                  boost: 2.0
                }
              }
            ],
            minimum_should_match: 1
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
        _source: ["content", "fileName", "timestamp", "source"],
        size: 100,
        sort: [
          { _score: "desc" },
          { timestamp: { order: "desc" }}
        ]
      })
    });

    const searchData = await searchResponse.json();
    
    if (!searchResponse.ok) {
      throw new Error(searchData.error?.reason || 'Search failed');
    }

    return searchData.hits.hits.map((hit: ElasticsearchHit) => ({
      id: hit._id,
      score: hit._score,
      source: hit._source.source || 'Unknown',
      fileName: hit._source.fileName || '',
      content: hit.highlight?.content?.[0] || hit._source.content || '',
      timestamp: hit._source.timestamp || '',
      collection: hit._index || '',
      // Add all fields expected by the frontend ResultsTable, with defaults
      matchedTerms: [],
      highlights: hit.highlight?.content || [],
      context: '',
      index: hit._index || '',
      name: '',
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
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
      fileType: '',
      extractionConfidence: '',
      exposed: [],
    }));
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export async function performLocalSearch(items: any[], query: string, searchFields: string[]): Promise<any[]> {
  return fuzzySearch(items, query, searchFields);
}
