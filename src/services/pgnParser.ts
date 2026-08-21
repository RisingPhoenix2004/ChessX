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
      // Smothered mate check: Knight delivers mate while King is surrounded by own pieces
      if (moveSan.startsWith('N')) {
        themes.add('Smothered Mate');
      }
    }

    // Attempt to make move in chess.js
    try {
      const moveObj = chess.move(moveSan);
      if (moveObj) {
        // Sacrifice detection: capturing piece of lower value or giving up piece
        if (moveObj.captured && ['q', 'r', 'b', 'n'].includes(moveObj.captured)) {
          if (['p', 'b', 'n'].includes(moveObj.piece) && ['q', 'r'].includes(moveObj.captured)) {
            pieceSacrificed = true;
          }
        }

        // Fork or Double attack: check if piece attacks > 1 opponent piece or king+piece
        if (chess.inCheck()) {
          // If knight or pawn checks king
          if (moveObj.piece === 'n' || moveObj.piece === 'p') {
            themes.add('Fork');
          }
        }
      }
    } catch {
      // Ignore move parsing errors if non-standard
    }
  }

  if (pieceSacrificed) {
    themes.add('Sacrifice');
  }

  // Count total pieces to determine Endgame
  const pieceCount = (startFen.match(/[rnbqRNBQ]/g) || []).length;
  if (pieceCount <= 6) {
    themes.add('Endgame');
  }

  // Default theme if none detected
  if (themes.size === 0) {
    themes.add('Double Attack');
  }

  return Array.from(themes);
}

/**
 * Parses raw PGN string into array of Puzzles with rich move annotations & commentary
 */
export function parsePGNToPuzzles(pgnText: string, collectionId: string = 'custom'): Puzzle[] {
  const puzzles: Puzzle[] = [];
  
  // Split multiple PGN games by double newlines before [Event header or game delimiter
  const rawGames = pgnText.split(/\n\s*\n(?=\[Event|\[FEN|1\.)/g).filter(g => g.trim().length > 0);

  rawGames.forEach((rawGame, index) => {
    try {
      // Extract headers
      const headers: Record<string, string> = {};
      const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
      let match;
      while ((match = headerRegex.exec(rawGame)) !== null) {
        headers[match[1]] = match[2];
      }

      // Determine FEN
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

      // Tokenize movesText while preserving comments with moves
      const movesData: { san: string; moveNumber?: number; isWhite?: boolean; comment?: string }[] = [];
      const solutionMoves: string[] = [];

      // Regex matching move number, SAN move, comment, or result
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
          // Ignore result tokens like 1-0, 0-1, 1/2-1/2, *
          if (['1-0', '0-1', '1/2-1/2', '*'].includes(san)) continue;
          // Ignore NAGs
          if (san.startsWith('$')) continue;

          solutionMoves.push(san);
          movesData.push({
            san,
            moveNumber: currentMoveNum,
            isWhite: currentIsWhite,
            comment: '',
          });
          // Alternate turn for next move if in the same move number pair
          currentIsWhite = !currentIsWhite;
        } else if (comment) {
          if (movesData.length > 0) {
            const lastMove = movesData[movesData.length - 1];
            lastMove.comment = (lastMove.comment ? lastMove.comment + ' ' : '') + comment.trim();
          }
        }
      }

      if (solutionMoves.length === 0) return;

      // Extract side to move
      const sideToMove: 'w' | 'b' = fen.includes(' b ') ? 'b' : 'w';

      // Convert solution to UCI if possible using chess.js
      const tempChess = new Chess(fen);
      const solutionUCI: string[] = [];
      solutionMoves.forEach((san) => {
        try {
          const moveRes = tempChess.move(san);
          if (moveRes) {
            solutionUCI.push(moveRes.from + moveRes.to + (moveRes.promotion || ''));
          }
        } catch {
          // move failure fallback
        }
      });

      // Detect themes and difficulty
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

      const puzzleId = `puzzle_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`;

      puzzles.push({
        id: puzzleId,
        collectionId,
        fen,
        sideToMove,
        solutionMoves,
        solutionUCI,
        description: allComments[0] || headers['Event'] || `Tactical Puzzle #${index + 1}`,
        event: headers['Event'],
        white: headers['White'],
        black: headers['Black'],
        tags,
        difficulty,
        rating,
        comments: allComments.join('\n'),
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
