/**
 * Smart Answer Validator
 *
 * Pipeline:
 *  1. Normalize  → trim + lowercase + collapse whitespace
 *  2. Exact match → score 1.0
 *  3. Levenshtein distance → score by relative edit distance
 *  4. Phonetic (metaphone) → catch "their/there" style mistakes
 *
 * Thresholds:
 *   score >= 0.85  → 'correct'  (minor typo forgiven)
 *   score >= 0.60  → 'close'    (hint shown, counted as wrong)
 *   score <  0.60  → 'incorrect'
 */

import { ValidationStatus } from '../../shared/types/index.js';

const CORRECT_THRESHOLD = 0.85;
const CLOSE_THRESHOLD   = 0.60;

// ── Normalization ────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')          // collapse multiple spaces
    .replace(/['']/g, "'")         // smart quotes → straight
    .replace(/[–—]/g, '-');        // em/en dash → hyphen
}

// ── Levenshtein distance (iterative, O(n*m) space optimised to O(m)) ────────

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,           // insertion
        prev[j] + 1,               // deletion
        prev[j - 1] + cost         // substitution
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

function similarityScore(submitted: string, accepted: string): number {
  const maxLen = Math.max(submitted.length, accepted.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(submitted, accepted);
  return 1 - dist / maxLen;
}

// ── Double Metaphone (simplified) – catches phonetic near-matches ────────────
// Full double-metaphone is ~400 lines; this covers the most common English patterns.

function metaphone(s: string): string {
  return s
    .replace(/^kn/, 'n')
    .replace(/^gn/, 'n')
    .replace(/^ae/, 'e')
    .replace(/ck/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/[aeiou]+/g, 'a')   // collapse vowels to single 'a'
    .replace(/([^aeiou])\1+/g, '$1') // deduplicate consonants
    .toUpperCase();
}

function phoneticMatch(a: string, b: string): boolean {
  return metaphone(a) === metaphone(b);
}

// ── Core export ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  status: ValidationStatus;
  matchScore: number;
  matchedAnswer?: string;
}

export function validateAnswer(
  submitted: string,
  acceptedAnswers: string[]
): ValidationResult {
  const norm = normalize(submitted);

  let bestScore = 0;
  let bestAnswer: string | undefined;

  for (const raw of acceptedAnswers) {
    const accepted = normalize(raw);

    // Exact match after normalization
    if (norm === accepted) {
      return { status: 'correct', matchScore: 1.0, matchedAnswer: raw };
    }

    const score = similarityScore(norm, accepted);
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = raw;
    }

    // Phonetic fallback – only for short words where Levenshtein is harsh
    if (score < CORRECT_THRESHOLD && norm.length <= 10 && phoneticMatch(norm, accepted)) {
      // Phonetic matches get a floor score so they appear as 'close'
      const phoneticScore = Math.max(score, CLOSE_THRESHOLD);
      if (phoneticScore > bestScore) {
        bestScore = phoneticScore;
        bestAnswer = raw;
      }
    }
  }

  const status: ValidationStatus =
    bestScore >= CORRECT_THRESHOLD ? 'correct' :
    bestScore >= CLOSE_THRESHOLD   ? 'close'   : 'incorrect';

  return { status, matchScore: parseFloat(bestScore.toFixed(3)), matchedAnswer: bestAnswer };
}
