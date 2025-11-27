// Embedded OSINT imports removed

// Global console declaration for Node.js environment
declare const console: {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
};

// Simple Levenshtein distance implementation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

export interface OsintSearchResult {
  id: string;
  scanId: string;
  dataType: string;
  value: string;
  module: string;
  risk: string;
  confidence: number;
  timestamp: number;
  source: string;
  context: string;
  highlights: string[];
  matchedTerms: string[];
  score: number;
  // Additional OSINT-specific fields
  correlationData?: any;
  relatedEntities?: string[];
  threatLevel?: string;
}

/**
 * Perform OSINT search - simplified version after embedded OSINT removal
 */
export async function performOsintSearch(
  query: string,
): Promise<OsintSearchResult[]> {
  if (!query.trim()) {
    throw new Error('Search query is required');
  }

  console.log('Starting OSINT search for:', query);

  try {
  // Return empty results since the embedded OSINT engine was removed
    return [];
  } catch (error) {
    console.error('OSINT search failed:', error);
    throw new Error(`OSINT search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate search relevance score for OSINT data
 */
function calculateOsintSearchScore(
  query: string,
  value: string,
  dataType: string,
  module: string,
  risk: number,
): number {
  const queryLower = query.toLowerCase();
  const valueLower = value.toLowerCase();
  const dataTypeLower = dataType.toLowerCase();
  const moduleLower = module.toLowerCase();

  let score = 0;

  // Exact match gets highest score
  if (valueLower === queryLower) {
    score += 100;
  }

  // Contains query gets high score
  if (valueLower.includes(queryLower)) {
    score += 80;
  }

  // Fuzzy matching for similar terms
  const similarity = 1 - levenshteinDistance(queryLower, valueLower) / Math.max(queryLower.length, valueLower.length);
  if (similarity > 0.7) {
    score += Math.floor(similarity * 40);
  }

  // Data type relevance
  if (dataTypeLower.includes(queryLower) || queryLower.includes(dataTypeLower)) {
    score += 30;
  }

  // Module relevance
  if (moduleLower.includes(queryLower) || queryLower.includes(moduleLower)) {
    score += 20;
  }

  // Risk-based scoring (higher risk items get slight boost)
  if (risk > 0) {
    score += Math.min(10, risk);
  }

  return Math.max(0, score);
}

/**
 * Extract search highlights and matched terms
 */
function extractSearchHighlights(
  query: string,
  value: string,
  dataType: string,
): { highlights: string[]; matchedTerms: string[] } {
  const queryLower = query.toLowerCase();
  const valueLower = value.toLowerCase();
  const highlights: string[] = [];
  const matchedTerms = new Set<string>();

  // Highlight exact matches
  if (valueLower.includes(queryLower)) {
    const index = valueLower.indexOf(queryLower);
    const before = value.substring(0, index);
    const match = value.substring(index, index + query.length);
    const after = value.substring(index + query.length);

    highlights.push(`${before}<mark>${match}</mark>${after}`);
    matchedTerms.add(match);
  }

  // Highlight data type matches
  if (dataType.toLowerCase().includes(queryLower)) {
    highlights.push(`Data Type: <mark>${dataType}</mark>`);
    matchedTerms.add(dataType);
  }

  // Add the full value as context if no highlights
  if (highlights.length === 0) {
    highlights.push(value);
  }

  return {
    highlights,
    matchedTerms: Array.from(matchedTerms),
  };
}

/**
 * Determine threat level based on risk score
 */
function getThreatLevel(risk: number): string {
  if (risk >= 8) return 'CRITICAL';
  if (risk >= 6) return 'HIGH';
  if (risk >= 4) return 'MEDIUM';
  if (risk >= 2) return 'LOW';
  return 'INFO';
}

/**
 * Perform local OSINT search (backup implementation)
 */
export async function performLocalOsintSearch(query: string): Promise<OsintSearchResult[]> {
  // Implementation of local OSINT search as a fallback
  // This would search through any locally cached OSINT engine data
  return [];
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use performOsintSearch instead
 */
export async function performFuzzySearch(query: string, elasticsearchUri: string): Promise<any[]> {
  console.warn('performFuzzySearch is deprecated. Use performOsintSearch for OSINT data.');
  return performOsintSearch(query);
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use performOsintSearch instead
 */
export async function performLocalSearch(query: string): Promise<any[]> {
  console.warn('performLocalSearch is deprecated. Use performLocalOsintSearch for OSINT data.');
  return performLocalOsintSearch(query);
}
