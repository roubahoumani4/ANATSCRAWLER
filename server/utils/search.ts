export function calculateFuzzyScore(str1: string, str2: string): number {
  const str1Lower = str1.toLowerCase();
  const str2Lower = str2.toLowerCase();
  
  if (str1Lower === str2Lower) return 1;
  if (str1Lower.includes(str2Lower) || str2Lower.includes(str1Lower)) return 0.8;
  
  const len1 = str1Lower.length;
  const len2 = str2Lower.length;
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1Lower[i - 1] === str2Lower[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  const similarity = 1 - distance / maxLength;
  
  return similarity;
}

export function fuzzySearch<T>(items: T[], searchTerm: string, keys: (keyof T)[]): T[] {
  const threshold = 0.4; // Minimum similarity score to include in results
  
  return items
    .map(item => {
      let maxScore = 0;
      
      for (const key of keys) {
        const value = String(item[key] || '');
        const score = calculateFuzzyScore(value, searchTerm);
        maxScore = Math.max(maxScore, score);
      }
      
      return {
        item,
        score: maxScore
      };
    })
    .filter(result => result.score > threshold)
    .sort((a, b) => b.score - a.score)
    .map(result => ({
      ...result.item,
      score: result.score
    })) as T[];
}
