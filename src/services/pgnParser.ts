import { Chess } from 'chess.js';
import { Puzzle, PuzzleTheme, DifficultyLevel } from '../types/chess';

export interface ParsedPGNGame {
  headers: Record<string, string>;
  fen: string;
  solutionMoves: string[];
  solutionUCI: string[];
  comments: string[];
  sideToMove: 'w' | 'b';
}

/**
 * Analyzes moves to automatically tag tactical themes
 */
export function detectThemes(gameMoves: string[], startFen: string): PuzzleTheme[] {
  const themes: Set<PuzzleTheme> = new Set();
  const chess = new Chess(startFen);

  let pieceSacrificed = false;

  for (let i = 0; i < gameMoves.length; i++) {
    const moveSan = gameMoves[i];
    
    // Check for Promotion
    if (moveSan.includes('=')) {
      themes.add('Promotion');
    }

    // Check for Check / Checkmate
    if (moveSan.includes('#')) {
      themes.add('Mate');
      if (moveSan.startsWith('N')) {
        themes.add('Smothered Mate');
      }
    }

    try {
      const moveObj = chess.move(moveSan);
      if (moveObj) {
        if (moveObj.captured && ['q', 'r', 'b', 'n'].includes(moveObj.captured)) {
          if (['p', 'b', 'n'].includes(moveObj.piece) && ['q', 'r'].includes(moveObj.captured)) {
            pieceSacrificed = true;
          }
        }

        if (chess.inCheck()) {
          if (moveObj.piece === 'n' || moveObj.piece === 'p') {
            themes.add('Fork');
          }
        }
      }
    } catch {
      // Ignore move errors
    }
  }

  if (pieceSacrificed) {
    themes.add('Sacrifice');
  }

  const pieceCount = (startFen.match(/[rnbqRNBQ]/g) || []).length;
  if (pieceCount <= 6) {
    themes.add('Endgame');
  }

  if (themes.size === 0) {
    themes.add('Double Attack');
  }

  return Array.from(themes);
}

/**
 * Robust Multi-Game & Chapter PGN Splitter
 */
function splitPgnGames(pgnText: string): string[] {
  const normalized = pgnText.trim();
  if (!normalized) return [];

  // Match game boundary starting with standard bracketed tag pairs
  const tagStartRegex = /(?:^|\n\s*\n)(?=\[\s*(?:Event|Site|Date|Round|White|Black|Result|FEN|SetUp|Chapter|ChapterName|Title|Section|Annotator|Variant)\s+"[^"]*"\])/gi;
  const parts = normalized.split(tagStartRegex).map(p => p.trim()).filter(p => p.length > 0);

  if (parts.length > 1) {
    return parts;
  }

  // Fallback: split on any double newline preceding a bracket tag
  const bracketSplit = normalized.split(/\n\s*\n(?=\[)/g).map(p => p.trim()).filter(p => p.length > 0);
  if (bracketSplit.length > 1) {
    return bracketSplit;
  }

  // Single game/chapter fallback
  return [normalized];
}

/**
 * Parses raw PGN string into array of Puzzles / Chapters with rich move annotations & commentary
 */
export function parsePGNToPuzzles(pgnText: string, collectionId: string = 'custom'): Puzzle[] {
  const puzzles: Puzzle[] = [];
  const rawGames = splitPgnGames(pgnText);

  rawGames.forEach((rawGame, index) => {
    try {
      // Extract headers
      const headers: Record<string, string> = {};
      const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
      let match;
      while ((match = headerRegex.exec(rawGame)) !== null) {
        headers[match[1]] = match[2];
      }

      // Determine starting FEN
      let fen = headers['FEN'] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      // Extract move text (strip out headers)
      const movesText = rawGame.replace(/\[[^\]]+\]/g, '').trim();

      // Extract all comments inside {...}
      const allComments: string[] = [];
      const commentRegex = /\{([^}]+)\}/g;
      let commentMatch;
      while ((commentMatch = commentRegex.exec(movesText)) !== null) {
        allComments.push(commentMatch[1].trim());
      }

      // Tokenize moves while preserving comments
      const movesData: { san: string; moveNumber?: number; isWhite?: boolean; comment?: string }[] = [];
      const solutionMoves: string[] = [];

      // Regex matching move numbers, SAN moves, comments, or results
      const tokenRegex = /(\d+)\s*(\.{1,3})|([a-zA-Z0-9+#=O\-]+)|\{([^}]+)\}/g;
      let tokenMatch;
      let currentMoveNum: number | undefined;
      let currentIsWhite = true;

      while ((tokenMatch = tokenRegex.exec(movesText)) !== null) {
        const [, num, dots, san, comment] = tokenMatch;
        if (num) {
          currentMoveNum = parseInt(num, 10);
          currentIsWhite = dots !== '...';
        } else if (san) {
          if (['1-0', '0-1', '1/2-1/2', '*'].includes(san)) continue;
          if (san.startsWith('$')) continue; // Ignore NAGs

          solutionMoves.push(san);
          movesData.push({
            san,
            moveNumber: currentMoveNum,
            isWhite: currentIsWhite,
            comment: '',
          });
          currentIsWhite = !currentIsWhite;
        } else if (comment) {
          if (movesData.length > 0) {
            const lastMove = movesData[movesData.length - 1];
            lastMove.comment = (lastMove.comment ? lastMove.comment + ' ' : '') + comment.trim();
          }
        }
      }

      if (solutionMoves.length === 0) return;

      const sideToMove: 'w' | 'b' = fen.includes(' b ') ? 'b' : 'w';

      // Convert solution to UCI
      const tempChess = new Chess(fen);
      const solutionUCI: string[] = [];
      solutionMoves.forEach((san) => {
        try {
          const moveRes = tempChess.move(san);
          if (moveRes) {
            solutionUCI.push(moveRes.from + moveRes.to + (moveRes.promotion || ''));
          }
        } catch {
          // move fallback
        }
      });

      const tags = detectThemes(solutionMoves, fen);
      const moveCount = solutionMoves.length;
      let difficulty: DifficultyLevel = 'Medium';
      let rating = 1400;

      if (moveCount <= 2) {
        difficulty = 'Easy';
        rating = 1200;
      } else if (moveCount >= 5) {
        difficulty = 'Hard';
        rating = 1800;
      } else if (tags.includes('Sacrifice') || tags.includes('Smothered Mate')) {
        difficulty = 'Master';
        rating = 2100;
      }

      // Prioritize clean chapter name/title rather than move comments
      const rawEvent = headers['Event'] && headers['Event'] !== '?' && !headers['Event'].toLowerCase().includes('untitled') ? headers['Event'] : '';
      const rawChapter = headers['Chapter'] || headers['ChapterName'] || headers['Title'] || headers['Section'] || headers['Study'] || '';
      const rawPlayers = (headers['White'] && headers['Black'] && headers['White'] !== '?') ? `${headers['White']} vs ${headers['Black']}` : (headers['White'] && headers['White'] !== '?' ? headers['White'] : '');

      const chapterName = rawChapter || rawEvent || rawPlayers || `Chapter ${index + 1}`;

      const puzzleId = `puzzle_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`;

      puzzles.push({
        id: puzzleId,
        collectionId,
        fen,
        sideToMove,
        solutionMoves,
        solutionUCI,
        description: chapterName,
        event: rawEvent || chapterName,
        white: headers['White'],
        black: headers['Black'],
        tags,
        difficulty,
        rating,
        comments: allComments.join('\n') || headers['Annotator'] || undefined,
        rawPgn: rawGame.trim(),
        movesData,
        hasFailed: false,
        attempts: 0,
        solvedCount: 0,
        failedCount: 0,
        avgSolveTimeMs: 0,
        personalBestMs: null,
        lastAttemptDate: null,
        srsDueDate: null,
        srsRepetitions: 0,
        srsEaseFactor: 2.5,
        srsIntervalDays: 0,
        isFavorite: false,
      });
    } catch (e) {
      console.warn(`Failed to parse game #${index}:`, e);
    }
  });

  return puzzles;
}
