import type { Note } from '../types/index.js';

export interface Suggestion {
  broken: string;
  suggested: string;
  similarity: number;
  source: string;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[0]![i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j]![0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j]![i] = matrix[j - 1]![i - 1]!;
      } else {
        matrix[j]![i] = Math.min(
          matrix[j]![i - 1]! + 1,
          matrix[j - 1]![i]! + 1,
          matrix[j - 1]![i - 1]! + 1,
        );
      }
    }
  }

  return matrix[b.length]![a.length]!;
}

function calculateSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(
    a.toLowerCase(),
    b.toLowerCase(),
  );
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, 1 - distance / maxLen);
}

export function generateSuggestions(
  brokenTargets: string[],
  allNotes: Note[],
  threshold = 0.6,
): Suggestion[] {
  const availableNotes = allNotes.map((n) => ({
    name: n.relativePath.replace(/\.(md|canvas)$/, ''),
    basename: n.relativePath.split('/').pop()?.replace(/\.(md|canvas)$/, '') || '',
    aliases: n.aliases,
  }));

  const suggestions: Suggestion[] = [];

  for (const broken of brokenTargets) {
    const brokenBasename = broken.split('/').pop() || broken;
    const candidates: Array<{ suggestion: string; similarity: number }> = [];

    for (const note of availableNotes) {
      const basenameScore = calculateSimilarity(brokenBasename, note.basename);
      const fullScore = calculateSimilarity(broken, note.name);

      // Check aliases too
      for (const alias of note.aliases) {
        const aliasScore = calculateSimilarity(broken, alias);
        if (aliasScore > basenameScore && aliasScore > fullScore) {
          candidates.push({ suggestion: note.name, similarity: aliasScore });
        }
      }

      if (basenameScore >= fullScore && basenameScore > threshold) {
        candidates.push({ suggestion: note.name, similarity: basenameScore });
      } else if (fullScore > threshold) {
        candidates.push({ suggestion: note.name, similarity: fullScore });
      }
    }

    // Sort by similarity and take top suggestion
    if (candidates.length > 0) {
      const best = candidates.sort((a, b) => b.similarity - a.similarity)[0]!;
      suggestions.push({
        broken,
        suggested: best.suggestion,
        similarity: best.similarity,
        source: broken,
      });
    }
  }

  return suggestions.sort((a, b) => b.similarity - a.similarity);
}
