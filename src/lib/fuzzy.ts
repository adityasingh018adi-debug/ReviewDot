/**
 * Subsequence fuzzy score: higher is better, null means no match.
 * Rewards consecutive runs and word-boundary hits.
 */
export function fuzzyScore(query: string, text: string): number | null {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (!q) return 0
  let score = 0
  let ti = 0
  let streak = 0
  for (const ch of q) {
    const found = t.indexOf(ch, ti)
    if (found === -1) return null
    streak = found === ti ? streak + 1 : 1
    score += streak * 2 + (found === 0 || t[found - 1] === ' ' ? 3 : 0)
    ti = found + 1
  }
  return score - t.length * 0.01
}
