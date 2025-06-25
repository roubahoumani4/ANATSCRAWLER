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
    // Only search the 'darkweb_structured' index
    const indexName = 'darkweb_structured';
    const searchResponse = await fetch(`${elasticsearchUri}/${indexName}/_search`, {
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
                  fields: [
                    "content",
                    "fileName",
                    "source",
                    "context",
                    "name",
                    "first_name",
                    "last_name",
                    "phone",
                    "email",
                    "location",
                    "link",
                    "fileType",
                    "extractionConfidence"
                  ],
                  fuzziness: "AUTO",
                  prefix_length: 2,
                  boost: 1.0
                }
              },
              {
                multi_match: {
                  query,
                  fields: [
                    "content",
                    "fileName",
                    "source",
                    "context",
                    "name",
                    "first_name",
                    "last_name",
                    "phone",
                    "email",
                    "location",
                    "link",
                    "fileType",
                    "extractionConfidence"
                  ],
                  type: "phrase_prefix",
                  boost: 1.5
                }
              },
              {
                multi_match: {
                  query,
                  fields: [
                    "content^2",
                    "fileName^3",
                    "source^1.5",
                    "context^2",
                    "name^2",
                    "first_name^2",
                    "last_name^2",
                    "phone^2",
                    "email^2",
                    "location^2",
                    "link^2",
                    "fileType^2",
                    "extractionConfidence^2"
                  ],
                  type: "best_fields",
                  tie_breaker: 0.3,
                  boost: 2.0
                }
              },
              // Add a wildcard search for the link.keyword field for substring matching
              {
                wildcard: {
                  "link": {
                    value: `*${query}*`,
                    case_insensitive: true,
                    boost: 3.0
                  }
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
        _source: [
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
          { _score: "desc" },
          { timestamp: { order: "desc" }}
        ]
      })
    });

    const searchData = await searchResponse.json();
    if (!searchResponse.ok) {
      throw new Error(searchData.error?.reason || 'Search failed');
    }

    return searchData.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
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
      fileType: hit._source.fileType || '',
      extractionConfidence: hit._source.extractionConfidence || '',
      exposed: hit._source.exposed || [],
    }));
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export async function performLocalSearch(items: any[], query: string, searchFields: string[]): Promise<any[]> {
  return fuzzySearch(items, query, searchFields);
}
