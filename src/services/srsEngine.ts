import { Puzzle } from '../types/chess';

/**
 * Calculates updated SuperMemo-2 (SM-2) spaced repetition parameters for a puzzle
 * @param puzzle Target puzzle
 * @param solved Whether user solved it correctly
 * @param mistakes Number of mistakes
 * @param solveTimeMs Time spent in ms
 */
export function updatePuzzleSRS(
  puzzle: Puzzle,
  solved: boolean,
  mistakes: number,
  solveTimeMs: number
): Partial<Puzzle> {
  // Determine SM-2 quality rating q (0 to 5)
  let quality = 0;
  if (!solved) {
    quality = mistakes > 2 ? 0 : 1;
  } else {
    if (mistakes > 0) {
      quality = 2;
    } else if (solveTimeMs > 25000) {
      quality = 3;
    } else if (solveTimeMs > 10000) {
      quality = 4;
    } else {
      quality = 5; // Perfect fast solve
    }
  }

  let { srsRepetitions = 0, srsEaseFactor = 2.5, srsIntervalDays = 0 } = puzzle;

  if (quality >= 3) {
    if (srsRepetitions === 0) {
      srsIntervalDays = 1;
    } else if (srsRepetitions === 1) {
      srsIntervalDays = 6;
    } else {
      srsIntervalDays = Math.round(srsIntervalDays * srsEaseFactor);
    }
    srsRepetitions += 1;
  } else {
    srsRepetitions = 0;
    srsIntervalDays = 1;
  }

  // Update Ease Factor (EF)
  srsEaseFactor = srsEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (srsEaseFactor < 1.3) srsEaseFactor = 1.3;

  // Calculate next due date
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + srsIntervalDays);

  const attempts = (puzzle.attempts || 0) + 1;
  const solvedCount = (puzzle.solvedCount || 0) + (solved ? 1 : 0);
  const failedCount = (puzzle.failedCount || 0) + (solved ? 0 : 1);
  const hasFailed = Boolean(puzzle.hasFailed || !solved || failedCount > 0);
  const avgSolveTimeMs = puzzle.avgSolveTimeMs
    ? Math.round((puzzle.avgSolveTimeMs * (attempts - 1) + solveTimeMs) / attempts)
    : solveTimeMs;

  const personalBestMs =
    solved && (puzzle.personalBestMs === null || solveTimeMs < puzzle.personalBestMs)
      ? solveTimeMs
      : puzzle.personalBestMs;

  return {
    hasFailed,
    attempts,
    solvedCount,
    failedCount,
    avgSolveTimeMs,
    personalBestMs,
    lastAttemptDate: new Date().toISOString(),
    srsDueDate: nextDueDate.toISOString(),
    srsRepetitions,
    srsEaseFactor,
    srsIntervalDays,
  };
}
