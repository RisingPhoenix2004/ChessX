import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Puzzle, UserStats } from '../../types/chess';
import { Settings as UserSettings } from '../../services/storage';
import { soundEngine } from '../../services/soundEngine';
import { LichessNotationView } from '../library/LichessNotationView';
import { LichessPromotionOverlay } from '../library/LichessPromotionOverlay';
import {
  RotateCcw,
  Lightbulb,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  XCircle,
  CheckCircle2,
  Flame,
  LogOut,
  ArrowRight,
  Copy,
  Check,
  FileText,
} from 'lucide-react';

interface PuzzleSolverProps {
  puzzle: Puzzle;
  collectionName?: string;
  onPuzzleCompleted: (
    puzzleId: string,
    solved: boolean,
    solveTimeMs: number,
    mistakes: number,
    xpGain: number,
    coinsGain: number
  ) => void;
  onNextPuzzle: () => void;
  onExit?: () => void;
  userStats: UserStats;
  comboCount: number;
  sessionPuzzleCount: number;
  triggerPraise?: (text: string, xp: number) => void;
  settings?: UserSettings;
}

interface PromotionState {
  from: Square;
  to: Square;
  fileIdx: number;
  rankIdx: number;
}

const BOARD_THEME_COLORS: Record<string, { dark: string; light: string }> = {
  dark: { dark: '#262626', light: '#404040' },
  emerald: { dark: '#769656', light: '#eeeee8' },
  wood: { dark: '#b58863', light: '#f0d9b5' },
  cyberpunk: { dark: '#2b1b54', light: '#4f228d' },
  glass: { dark: '#1e293b', light: '#475569' },
  blue: { dark: '#4b7399', light: '#eae9d2' },
  light: { dark: '#8ca2ad', light: '#dee3e6' },
  sand: { dark: '#b88b4a', light: '#e3c18f' },
  tournament: { dark: '#52697a', light: '#cfd8dc' },
};

export const PuzzleSolver: React.FC<PuzzleSolverProps> = ({
  puzzle,
  collectionName = 'Tactical Collection',
  onPuzzleCompleted,
  onNextPuzzle,
  onExit,
  userStats,
  comboCount,
  sessionPuzzleCount,
  settings,
}) => {
  const [game, setGame] = useState<Chess>(new Chess(puzzle.fen));
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [finalSolveTimeMs, setFinalSolveTimeMs] = useState<number>(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [squareStyles, setSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const [pendingPromotion, setPendingPromotion] = useState<PromotionState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedPgn, setCopiedPgn] = useState<boolean>(false);

  // Post-solve interactive replay navigation history
  const [replayFenHistory, setReplayFenHistory] = useState<string[]>([]);
  const [replayIdx, setReplayIdx] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const boardThemeKey = settings?.boardTheme || 'dark';
  const activeColors = BOARD_THEME_COLORS[boardThemeKey] || BOARD_THEME_COLORS.dark;

  const formatDuration = (durationMs: number) => {
    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    return `${seconds}s`;
  };

  useEffect(() => {
    const newGame = new Chess(puzzle.fen);
    setGame(newGame);
    setCurrentMoveIndex(0);
    setMistakes(0);
    setIsCompleted(false);
    setIsFailed(false);
    setStartTime(Date.now());
    setElapsedMs(0);
    setFinalSolveTimeMs(0);
    setSelectedSquare(null);
    setSquareStyles({});
    setPendingPromotion(null);
    setStatusMessage('');
    setCopiedPgn(false);

    // Precompute replay fen history
    const hist = [puzzle.fen];
    const simGame = new Chess(puzzle.fen);
    for (const moveSan of puzzle.solutionMoves) {
      try {
        simGame.move(moveSan);
        hist.push(simGame.fen());
      } catch {
        break;
      }
    }
    setReplayFenHistory(hist);
    setReplayIdx(0);
  }, [puzzle]);

  useEffect(() => {
    if (!isCompleted && !isFailed) {
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted, isFailed, startTime]);

  const completeSolveFlow = useCallback(
    (finalTime: number, totalMistakes: number) => {
      setIsCompleted(true);
      setFinalSolveTimeMs(finalTime);
      setReplayIdx(replayFenHistory.length - 1);
      soundEngine.playSuccess();
      onPuzzleCompleted(puzzle.id, true, finalTime, totalMistakes, 15, 2);
    },
    [puzzle.id, onPuzzleCompleted, replayFenHistory.length]
  );

  const makeAMove = useCallback(
    (moveInput: { from: Square; to: Square; promotion?: string }) => {
      if (isCompleted || isFailed) return false;

      try {
        const tempGame = new Chess(game.fen());
        const expectedSan = puzzle.solutionMoves[currentMoveIndex];

        // Check for pawn promotion requirement
        const piece = tempGame.get(moveInput.from);
        const isPromotionMove =
          piece &&
          piece.type === 'p' &&
          ((piece.color === 'w' && moveInput.to[1] === '8') ||
            (piece.color === 'b' && moveInput.to[1] === '1'));

        if (isPromotionMove && !moveInput.promotion) {
          const fileIdx = 'abcdefgh'.indexOf(moveInput.to[0]);
          const rankIdx = parseInt(moveInput.to[1], 10);
          setPendingPromotion({
            from: moveInput.from,
            to: moveInput.to,
            fileIdx,
            rankIdx,
          });
          return false;
        }

        const moveResult = tempGame.move(moveInput);
        if (!moveResult) return false;

        const isCorrectMove =
          moveResult.san === expectedSan ||
          (puzzle.solutionUCI && puzzle.solutionUCI[currentMoveIndex] === moveResult.from + moveResult.to);

        if (isCorrectMove) {
          if (moveResult.captured) soundEngine.playCapture();
          else soundEngine.playMove();

          setGame(tempGame);
          const nextIndex = currentMoveIndex + 1;
          setCurrentMoveIndex(nextIndex);
          setSelectedSquare(null);
          setSquareStyles({});
          setStatusMessage('');

          if (nextIndex >= puzzle.solutionMoves.length) {
            const totalTime = Date.now() - startTime;
            completeSolveFlow(totalTime, mistakes);
          } else {
            // Opponent automatic reply move
            setTimeout(() => {
              const replySan = puzzle.solutionMoves[nextIndex];
              const replyGame = new Chess(tempGame.fen());
              const replyResult = replyGame.move(replySan);
              if (replyResult) {
                if (replyResult.captured) soundEngine.playCapture();
                else soundEngine.playMove();

                setGame(replyGame);
                const afterReplyIndex = nextIndex + 1;
                setCurrentMoveIndex(afterReplyIndex);

                if (afterReplyIndex >= puzzle.solutionMoves.length) {
                  const totalTime = Date.now() - startTime;
                  completeSolveFlow(totalTime, mistakes);
                }
              }
            }, 250);
          }
          return true;
        } else {
          // 2-MISTAKE LIMIT: First wrong try gives feedback; second wrong try fails puzzle & adds to Replay Queue
          soundEngine.playMistake();
          const newMistakes = mistakes + 1;
          setMistakes(newMistakes);

          setSquareStyles({
            [moveInput.to]: {
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 40%, transparent 80%)',
            },
          });

          if (newMistakes >= 2) {
            setIsFailed(true);
            setStatusMessage('Incorrect move (2/2 attempts used). Puzzle failed & added to Replay Queue.');
            onPuzzleCompleted(puzzle.id, false, Date.now() - startTime, 2, 0, 0);
          } else {
            setStatusMessage('Incorrect move (1/2 attempts used). Try again!');
            setTimeout(() => {
              setSquareStyles({});
            }, 1200);
          }
          return false;
        }
      } catch {
        return false;
      }
    },
    [game, puzzle, currentMoveIndex, mistakes, isCompleted, isFailed, startTime, completeSolveFlow, onPuzzleCompleted]
  );

  const handleSquareClick = (square: Square) => {
    if (isCompleted || isFailed) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setSquareStyles({});
        return;
      }

      const moveSuccess = makeAMove({
        from: selectedSquare,
        to: square,
      });

      if (moveSuccess) return;
    }

    const piece = game.get(square);
    if (piece && piece.color === puzzle.sideToMove) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      const newStyles: Record<string, React.CSSProperties> = {
        [square]: {
          background: 'rgba(16, 185, 129, 0.35)',
        },
      };

      if (settings?.showLegalMoves !== false) {
        moves.forEach((m) => {
          const isCapture = Boolean(game.get(m.to as Square));
          newStyles[m.to] = {
            background: isCapture
              ? 'radial-gradient(circle, transparent 55%, rgba(16, 185, 129, 0.6) 60%)'
              : 'radial-gradient(circle, rgba(16, 185, 129, 0.5) 20%, transparent 25%)',
            borderRadius: '50%',
          };
        });
      }

      setSquareStyles(newStyles);
    } else {
      setSelectedSquare(null);
      setSquareStyles({});
    }
  };

  const onDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    return makeAMove({
      from: sourceSquare,
      to: targetSquare,
    });
  };

  const handleSelectPromotion = (pieceType: string) => {
    if (!pendingPromotion) return;
    makeAMove({
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: pieceType,
    });
    setPendingPromotion(null);
  };

  const handleShowHint = () => {
    if (isCompleted || isFailed) return;
    const nextSan = puzzle.solutionMoves[currentMoveIndex];
    if (!nextSan) return;

    const tempGame = new Chess(game.fen());
    const validMoves = tempGame.moves({ verbose: true });
    const match = validMoves.find((m) => m.san === nextSan);

    if (match) {
      setSquareStyles({
        [match.from]: {
          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.7) 35%, transparent 75%)',
        },
      });
      setStatusMessage(`Hint: Look at the piece on ${match.from.toUpperCase()}`);
    }
  };

  const handleRetry = () => {
    const newGame = new Chess(puzzle.fen);
    setGame(newGame);
    setCurrentMoveIndex(0);
    setMistakes(0);
    setIsCompleted(false);
    setIsFailed(false);
    setStartTime(Date.now());
    setElapsedMs(0);
    setSelectedSquare(null);
    setSquareStyles({});
    setPendingPromotion(null);
    setStatusMessage('');
  };

  const handleRevealSolution = () => {
    if (isCompleted || isFailed) return;
    setIsFailed(true);
    setStatusMessage('Solution revealed.');
    onPuzzleCompleted(puzzle.id, false, Date.now() - startTime, 1, 0, 0);

    const endFen = replayFenHistory[replayFenHistory.length - 1];
    if (endFen) {
      setGame(new Chess(endFen));
      setReplayIdx(replayFenHistory.length - 1);
    }
  };

  const handleStepReplay = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= replayFenHistory.length) return;
    setReplayIdx(targetIdx);
    setGame(new Chess(replayFenHistory[targetIdx]));
    soundEngine.playMove();
  };

  // Build the formatted Annotated PGN String with moves and comments
  const formattedAnnotatedPgn = useMemo(() => {
    if (puzzle.rawPgn && puzzle.rawPgn.trim()) {
      return puzzle.rawPgn.trim();
    }

    // Generate from movesData
    const tokens: string[] = [];
    const moves = puzzle.movesData || [];
    if (moves.length > 0) {
      moves.forEach((m) => {
        if (m.moveNumber && m.isWhite) {
          tokens.push(`${m.moveNumber}.`);
        } else if (m.moveNumber && !m.isWhite && tokens.length === 0) {
          tokens.push(`${m.moveNumber}...`);
        }
        tokens.push(m.san);
        if (m.comment) {
          tokens.push(`{ ${m.comment} }`);
        }
      });
      return tokens.join(' ');
    }

    // Fallback: solution moves with annotation
    const solTokens: string[] = [];
    puzzle.solutionMoves.forEach((san, idx) => {
      if (idx % 2 === 0) {
        solTokens.push(`${Math.floor(idx / 2) + 1}.`);
      }
      solTokens.push(san);
    });
    if (puzzle.comments) {
      solTokens.push(`{ ${puzzle.comments} }`);
    }
    return solTokens.join(' ');
  }, [puzzle]);

  const handleCopyPgnText = () => {
    navigator.clipboard.writeText(formattedAnnotatedPgn);
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  // Structured move pairs for step navigation table
  const movePairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < puzzle.solutionMoves.length; i += 2) {
      pairs.push({
        moveNum: Math.floor(i / 2) + 1,
        whiteSan: puzzle.solutionMoves[i],
        whiteIdx: i + 1,
        blackSan: puzzle.solutionMoves[i + 1] || null,
        blackIdx: i + 2,
      });
    }
    return pairs;
  }, [puzzle.solutionMoves]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5 font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#111520] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {puzzle.description || puzzle.event || collectionName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 font-mono">
              <span className="font-bold text-neutral-700 dark:text-neutral-300">
                {puzzle.sideToMove === 'w' ? 'White to Move' : 'Black to Move'}
              </span>
              <span>•</span>
              <span className="capitalize">{puzzle.difficulty || 'Medium'}</span>
              <span>•</span>
              <span>{puzzle.rating || 1400} ELO</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>{formatDuration(isCompleted || isFailed ? finalSolveTimeMs : elapsedMs)}</span>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Exit"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chessboard & Interactive PGN / Analysis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Chessboard */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[500px] aspect-square rounded-none overflow-hidden border border-neutral-300 dark:border-neutral-700 shadow-md relative bg-neutral-900">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={handleSquareClick}
              boardOrientation={puzzle.sideToMove === 'w' ? 'white' : 'black'}
              customSquareStyles={squareStyles}
              showBoardNotation={settings?.showCoordinates !== false}
              showPromotionDialog={false}
              animationDuration={150}
              customDarkSquareStyle={{ backgroundColor: activeColors.dark }}
              customLightSquareStyle={{ backgroundColor: activeColors.light }}
            />

            {/* Authentic Lichess Vertical Column Promotion Overlay (Image 5 style) */}
            {pendingPromotion && (
              <LichessPromotionOverlay
                targetSquare={pendingPromotion.to}
                orientation={puzzle.sideToMove === 'w' ? 'white' : 'black'}
                color={game.turn()}
                onSelectPiece={handleSelectPromotion}
                onCancel={() => setPendingPromotion(null)}
              />
            )}
          </div>

          {/* Quick Pre-Solve Action Controls */}
          {!isCompleted && !isFailed && (
            <div className="flex items-center justify-center gap-2 mt-4 w-full max-w-[500px]">
              <button
                onClick={handleShowHint}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white dark:bg-[#111520] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Hint</span>
              </button>

              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white dark:bg-[#111520] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                <span>Retry</span>
              </button>

              <button
                onClick={handleRevealSolution}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white dark:bg-[#111520] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                <span>Reveal</span>
              </button>
            </div>
          )}

          {statusMessage && !isCompleted && (
            <div className="mt-3 text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 px-4 py-2 rounded-xl text-center shadow-xs">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Right Column: Lichess PGN View & Solve Details */}
        <div className="lg:col-span-5 border border-neutral-200 dark:border-neutral-800 rounded-none shadow-xs flex flex-col justify-between min-h-[500px] h-[500px] overflow-hidden">
          {isCompleted || isFailed ? (
            /* Post-Solve Full Lichess PGN View & Replay Controls */
            <div className="space-y-2 flex-1 flex flex-col justify-between p-2">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 px-2">
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                      {isCompleted ? 'Puzzle Solved' : 'Puzzle Failed'}
                    </h3>
                    <p className="text-[10px] text-neutral-500">
                      {isCompleted ? 'Completed in ' + formatDuration(finalSolveTimeMs) : 'Solution revealed'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCopyPgnText}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedPgn ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPgn ? 'Copied' : 'Copy PGN'}</span>
                </button>
              </div>

              {/* Lichess PGN Tree View */}
              <div className="flex-1 overflow-hidden">
                <LichessNotationView
                  currentFen={game.fen()}
                  currentMoveIdx={replayIdx}
                  moveHistory={puzzle.solutionMoves.map((san, i) => ({
                    san,
                    moveNumber: Math.floor(i / 2) + 1,
                    isWhite: i % 2 === 0,
                    comment: puzzle.movesData?.[i]?.comment,
                  }))}
                  comments={puzzle.comments}
                  onSelectMove={handleStepReplay}
                />
              </div>

              {/* Bottom Navigation & Actions */}
              <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={onNextPuzzle}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <span>Next Puzzle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleRetry}
                  className="w-full py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Replay Position
                </button>
              </div>
            </div>
          ) : (
            /* Active Solving Card (No Tags or Themes Shown) */
            <div className="flex-1 flex flex-col justify-between space-y-4 p-5">
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white">
                  Find the winning sequence
                </h3>

                <p className="text-xs text-neutral-500 leading-relaxed">
                  Evaluate all forcing candidate moves. Play your move directly on the board.
                </p>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60 rounded-xl space-y-0.5">
                <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Streak: {comboCount} in a row</span>
                </div>
                <div className="text-[11px] text-neutral-500">
                  {sessionPuzzleCount} solved this session
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
