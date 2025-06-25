import fastLevenshtein from 'fast-levenshtein';

export interface SearchResult {
  id: string;
  source: string;
  score: number;
  matchedTerms: string[];
  highlights: string[];
  context: string;
  index: string;
  content?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  birthdate?: string;
  gender?: string;
  locale?: string;
  city?: string;
  location?: string;
  location2?: string;
  link?: string;
  link2?: string;
  protocol?: string;
  social_link?: string;
  timestamp?: string;
  fileType?: string;
  fileName?: string;
  extractionConfidence?: string;
  exposed?: string[];
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
 * Perform fuzzy search using Elasticsearch (for structured data)
 */
export async function performFuzzySearch(query: string, elasticsearchUri: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    throw new Error('Search query is required');
  }

  console.log('Starting fuzzy search for:', query);

  // Determine if query is a phone number and normalize if it is
  const isPhone = isPhoneNumber(query);
  const searchQuery = isPhone ? normalizePhoneNumber(query) : query;

  // Use the new structured index
  const searchIndices = ['darkweb_structured'].join(',');
  console.log('Using Elasticsearch endpoint:', elasticsearchUri);
  console.log('Searching indices:', searchIndices);

  // Build search query with improved matching for structured fields
  const searchBody = {
    size: 100,
    track_total_hits: true,
    _source: [
      "user_id", "phone", "name", "email", "username", "full_name", "dob", "gender",
      "location", "city", "country", "profile_url", "link", "password", "password_hash",
      "ip_address", "device", "source", "breach_date", "timestamp", "fileType", "fileName", "extractionConfidence"
    ],
    highlight: {
      fields: {
        "name": { "type": "unified", "number_of_fragments": 3, "fragment_size": 150, "pre_tags": ["<mark>"], "post_tags": ["</mark>"] },
        "phone": { "type": "unified", "number_of_fragments": 3, "fragment_size": 150, "pre_tags": ["<mark>"], "post_tags": ["</mark>"] },
        "location": { "type": "unified", "number_of_fragments": 3, "fragment_size": 150, "pre_tags": ["<mark>"], "post_tags": ["</mark>"] },
        "link": { "type": "unified", "number_of_fragments": 3, "fragment_size": 150, "pre_tags": ["<mark>"], "post_tags": ["</mark>"] }
      }
    },
    query: {
      bool: {
        should: [
          // Exact phrase match with highest boost
          {
            match_phrase: {
              "name": {
                "query": searchQuery,
                "boost": 3
              }
            }
          },
          {
            match_phrase: {
              "phone": {
                "query": searchQuery,
                "boost": 3
              }
            }
          },
          {
            match_phrase: {
              "location": {
                "query": searchQuery,
                "boost": 2
              }
            }
          },
          {
            match_phrase: {
              "link": {
                "query": searchQuery,
                "boost": 2
              }
            }
          },
          // Multi-field match for better coverage
          {
            multi_match: {
              "query": searchQuery,
              "fields": ["name", "phone", "location", "link"],
              "type": "best_fields",
              "operator": "or",
              "fuzziness": "AUTO",
              "prefix_length": 2,
              "boost": 1
            }
          }
        ],
        minimum_should_match: 1
      }
    }
  };

  // Add request timeout and error handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    console.log('Sending search request to Elasticsearch...');
    console.log('Elasticsearch search body:', JSON.stringify(searchBody, null, 2));
    const searchResponse = await fetch(`${elasticsearchUri}/${searchIndices}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Log the raw response text for debugging
    const rawResponseText = await searchResponse.clone().text();
    console.log('Raw Elasticsearch response:', rawResponseText);

    if (!searchResponse.ok) {
      const errorText = rawResponseText;
      console.error('Elasticsearch error response:', errorText);
      // Try to parse the error and check for index_not_found_exception
      try {
        const errorJson = JSON.parse(errorText);
        if (
          errorJson?.error?.type === 'index_not_found_exception' ||
          (errorJson?.error?.root_cause && errorJson.error.root_cause.some((e: any) => e.type === 'index_not_found_exception'))
        ) {
          throw new Error('No search data available. Please contact your administrator.');
        }
      } catch {}
      throw new Error(`Search request failed: ${errorText}`);
    }

    const searchData = JSON.parse(rawResponseText);
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
      // Extract all possible breach fields
      const {
        name, phone, email, username, full_name, dob, gender, location, city, country,
        profile_url, link, password, password_hash, ip_address, device, source, breach_date,
        timestamp, fileType, fileName, extractionConfidence,
        first_name, last_name, birthdate, locale, location2, link2, protocol, social_link
      } = hit._source || {};
      const highlights = Object.values(hit.highlight || {})
        .flat()
        .map((h: unknown) => h?.toString() || '');
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
      // Compose context from highlights or fields
      const context = highlights.length > 0 ?
        highlights.map((h: string) => h.replace(/<\/?mark>/g, '')).join(' ... ') :
        [email, username, phone, name, full_name, location, city, country, link, profile_url].filter(Boolean).join(' | ').slice(0, 400);
      // Determine exposed fields
      const exposed = [
        email && 'email', username && 'username', phone && 'phone',
        password && 'password', password_hash && 'password_hash',
        dob && 'dob', gender && 'gender', location && 'location',
        city && 'city', country && 'country', ip_address && 'ip_address',
        device && 'device', profile_url && 'profile_url'
      ].filter(Boolean);
      // Map to HIBP-style result
      const result = {
        id: hit._id,
        source: source || 'Unknown',
        breach_date: breach_date || timestamp || 'N/A',
        email,
        username,
        full_name,
        first_name,
        last_name,
        phone,
        birthdate,
        gender,
        locale,
        city,
        location: location || city || country || '',
        location2,
        link,
        link2,
        protocol,
        social_link,
        password,
        password_hash,
        dob,
        profile_url: profile_url || link || '',
        ip_address,
        device,
        fileType,
        fileName,
        extractionConfidence,
        exposed,
        highlights,
        matchedTerms: Array.from(matchedTerms),
        context,
        score: hit._score,
        index: hit._index
      };
      return result;
    }).filter((result: any) => result !== null);

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
