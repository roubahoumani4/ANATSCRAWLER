/**
 * Lightweight fuzzy search utility used by server search helpers.
 * Provides a simple substring + score match across specified fields.
 */
export interface FuzzySearchOptions {
  minScore?: number;
}

export function fuzzyScore(hay: string, needle: string): number {
  if (!needle) return 0;
  const h = hay.toLowerCase();
  const n = needle.toLowerCase();
  if (h === n) return 100;
  if (h.includes(n)) return 80;
  // simple length-normalized prefix/similarity fallback
  const common = n.split('').filter(c => h.includes(c)).length;
  return Math.min(60, Math.floor((common / Math.max(1, n.length)) * 60));
}

export function fuzzySearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: string[],
  options: FuzzySearchOptions = {}
): T[] {
  if (!query || !query.trim()) return [];
  const results: Array<{ item: T; score: number }> = [];

  for (const item of items) {
    let best = 0;
    for (const f of fields) {
      const v = String(item[f] ?? '');
      const s = fuzzyScore(v, query);
      if (s > best) best = s;
    }
    if (best > (options.minScore ?? 0)) results.push({ item, score: best });
  }

  return results.sort((a, b) => b.score - a.score).map(r => r.item);
}

export default fuzzySearch;
