import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Puzzle, UserStats } from '../../types/chess';
import { Settings as UserSettings } from '../../services/storage';
import { soundEngine } from '../../services/soundEngine';
import {
  RotateCcw,
  Lightbulb,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  XCircle,
  CheckCircle2,
  Zap,
  Flame,
  Volume2,
  VolumeX,
  Maximize2,
  LogOut,
  Sparkles,
  ArrowRight,
  Check
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
  dark: { dark: '#2b3548', light: '#4b5b78' },
  emerald: { dark: '#4e7837', light: '#dee3c8' },
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

  // Post-solve interactive replay navigation history
  const [replayFenHistory, setReplayFenHistory] = useState<string[]>([]);
  const [replayIdx, setReplayIdx] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const boardThemeKey = settings?.boardTheme || 'emerald';
  const activeColors = BOARD_THEME_COLORS[boardThemeKey] || BOARD_THEME_COLORS.emerald;

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
            }, 300);
          }
          return true;
        } else {
          // 1-MISTAKE MAXIMUM LIMIT:
          // First incorrect move immediately fails the puzzle!
          soundEngine.playMistake();
          setMistakes(1);
          setIsFailed(true);
          setStatusMessage('Incorrect move! Puzzle failed (1 mistake limit).');

          setSquareStyles({
            [moveInput.to]: {
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 40%, transparent 80%)',
            },
          });

          onPuzzleCompleted(puzzle.id, false, Date.now() - startTime, 1, 0, 0);
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
    const { from, to } = pendingPromotion;
    setPendingPromotion(null);
    makeAMove({ from, to, promotion: pieceType });
  };

  const handleShowHint = () => {
    if (isCompleted || isFailed || currentMoveIndex >= puzzle.solutionMoves.length) return;
    soundEngine.playMove();

    const expectedSan = puzzle.solutionMoves[currentMoveIndex];
    const tempGame = new Chess(game.fen());
    const validMoves = tempGame.moves({ verbose: true });
    const targetMove = validMoves.find((m) => m.san === expectedSan);

    if (targetMove) {
      setSquareStyles({
        [targetMove.from]: {
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.45) 30%, transparent 70%)',
        },
        [targetMove.to]: {
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.55) 25%, transparent 30%)',
        },
      });
    }
  };

  const handleRevealSolution = () => {
    setIsFailed(true);
    onPuzzleCompleted(puzzle.id, false, Date.now() - startTime, 1, 0, 0);

    let tempChess = new Chess(puzzle.fen);
    let step = 0;
    const interval = setInterval(() => {
      if (step < puzzle.solutionMoves.length) {
        tempChess.move(puzzle.solutionMoves[step]);
        setGame(new Chess(tempChess.fen()));
        step++;
      } else {
        clearInterval(interval);
      }
    }, 400);
  };

  const handleRetry = () => {
    setGame(new Chess(puzzle.fen));
    setCurrentMoveIndex(0);
    setMistakes(0);
    setIsCompleted(false);
    setIsFailed(false);
    setStartTime(Date.now());
    setSelectedSquare(null);
    setSquareStyles({});
    setPendingPromotion(null);
    setStatusMessage('');
  };

  const handleStepReplay = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= replayFenHistory.length) return;
    setReplayIdx(targetIdx);
    setGame(new Chess(replayFenHistory[targetIdx]));
    soundEngine.playMove();
  };

  // Keyboard navigation for PGN move step
  useEffect(() => {
    if (!isCompleted && !isFailed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleStepReplay(replayIdx - 1);
      } else if (e.key === 'ArrowRight') {
        handleStepReplay(replayIdx + 1);
      } else if (e.key === 'Home') {
        handleStepReplay(0);
      } else if (e.key === 'End') {
        handleStepReplay(replayFenHistory.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompleted, isFailed, replayIdx, replayFenHistory.length]);

  const sideToMoveText = puzzle.sideToMove === 'w' ? 'White to Play' : 'Black to Play';

  // Group moves into pairs (White move, Black move)
  const movePairs = [];
  for (let i = 0; i < puzzle.solutionMoves.length; i += 2) {
    movePairs.push({
      moveNum: Math.floor(i / 2) + 1,
      whiteSan: puzzle.solutionMoves[i],
      whiteIdx: i + 1,
      blackSan: puzzle.solutionMoves[i + 1] || null,
      blackIdx: i + 2,
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 font-sans space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0f1523] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-[#162238] border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>{collectionName}</span>
              {puzzle.userCategory && (
                <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                  {puzzle.userCategory}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {puzzle.description || 'Find the best tactical sequence.'}
            </p>
          </div>
        </div>

        {/* Indicators & Clock */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border ${
              puzzle.sideToMove === 'w'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                : 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700'
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                puzzle.sideToMove === 'w' ? 'bg-white dark:bg-black' : 'bg-black dark:bg-white'
              }`}
            />
            <span>{sideToMoveText}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#141b2b] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 font-semibold">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDuration(isCompleted ? finalSolveTimeMs : elapsedMs)}</span>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Exit Training"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chessboard & Interactive PGN / Analysis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Chessboard */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[540px] aspect-square rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl relative bg-slate-200 dark:bg-[#121824]">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={handleSquareClick}
              boardOrientation={puzzle.sideToMove === 'w' ? 'white' : 'black'}
              customSquareStyles={squareStyles}
              showBoardNotation={settings?.showCoordinates !== false}
              animationDuration={160}
              customBoardStyle={{
                borderRadius: '1.5rem',
              }}
              customDarkSquareStyle={{ backgroundColor: activeColors.dark }}
              customLightSquareStyle={{ backgroundColor: activeColors.light }}
            />

            {/* Smart Responsive Promotion Selector Overlay */}
            {pendingPromotion && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
                <div className="bg-white dark:bg-[#0f1523] border-2 border-emerald-500 rounded-3xl p-5 shadow-2xl space-y-4 max-w-xs w-full text-center">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Promote Pawn
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select your promotion piece:
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { type: 'q', label: 'Queen', icon: '♛' },
                      { type: 'r', label: 'Rook', icon: '♜' },
                      { type: 'b', label: 'Bishop', icon: '♝' },
                      { type: 'n', label: 'Knight', icon: '♞' },
                    ].map((p) => (
                      <button
                        key={p.type}
                        onClick={() => handleSelectPromotion(p.type)}
                        className="h-14 rounded-2xl bg-slate-100 dark:bg-[#192338] hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white text-slate-900 dark:text-white font-black text-2xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center shadow-md group"
                      >
                        <span>{p.icon}</span>
                        <span className="text-[9px] font-bold tracking-tight uppercase group-hover:text-white mt-0.5">
                          {p.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setPendingPromotion(null)}
                    className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Pre-Solve Action Controls */}
          {!isCompleted && (
            <div className="flex items-center justify-center gap-3 mt-4 w-full max-w-[540px]">
              <button
                onClick={handleShowHint}
                disabled={isCompleted || isFailed}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-[#0f1523] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Hint</span>
              </button>

              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-[#0f1523] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Retry</span>
              </button>

              <button
                onClick={handleRevealSolution}
                disabled={isCompleted || isFailed}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-[#0f1523] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
              >
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>Reveal</span>
              </button>
            </div>
          )}

          {statusMessage && !isCompleted && (
            <div className="mt-3 text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 px-4 py-2.5 rounded-2xl text-center shadow-sm">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Right Column: Lichess-Inspired Interactive PGN / Move Analysis Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[480px] space-y-6">
          {isCompleted || isFailed ? (
            /* Post-Solve Interactive Variation & Step Analysis */
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Result Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {isCompleted ? (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                        <XCircle className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {isCompleted ? 'Puzzle Solved!' : 'Puzzle Failed'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isCompleted ? 'Mastered variation sequence' : 'Solution revealed'}
                      </p>
                    </div>
                  </div>

                  {puzzle.tags && puzzle.tags.length > 0 && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] border border-emerald-500/20">
                      {puzzle.tags[0]}
                    </span>
                  )}
                </div>

                {/* Interactive PGN Move List Table */}
                <div className="space-y-2">
                  <div className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    Move Sequence (Click to inspect)
                  </div>

                  <div className="bg-slate-50 dark:bg-[#141b2b] rounded-2xl border border-slate-200 dark:border-slate-800/80 p-3 max-h-52 overflow-y-auto font-mono text-xs">
                    <div className="grid grid-cols-12 gap-y-1 items-center">
                      {movePairs.map((pair) => {
                        const isWhiteActive = replayIdx === pair.whiteIdx;
                        const isBlackActive = replayIdx === pair.blackIdx;

                        return (
                          <React.Fragment key={pair.moveNum}>
                            {/* Move number */}
                            <div className="col-span-2 text-slate-400 font-bold py-1 select-none">
                              {pair.moveNum}.
                            </div>

                            {/* White Move */}
                            <div className="col-span-5 pr-1">
                              <button
                                onClick={() => handleStepReplay(pair.whiteIdx)}
                                className={`w-full text-left px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                  isWhiteActive
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                              >
                                {pair.whiteSan}
                              </button>
                            </div>

                            {/* Black Move */}
                            <div className="col-span-5 pl-1">
                              {pair.blackSan ? (
                                <button
                                  onClick={() => handleStepReplay(pair.blackIdx)}
                                  className={`w-full text-left px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                    isBlackActive
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  {pair.blackSan}
                                </button>
                              ) : null}
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Step Navigation Controls (< > |< >|) */}
                <div className="flex items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-[#162033] rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => handleStepReplay(0)}
                    disabled={replayIdx <= 0}
                    className="p-2 rounded-xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                    title="First Move (Home)"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleStepReplay(replayIdx - 1)}
                    disabled={replayIdx <= 0}
                    className="p-2 rounded-xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                    title="Previous Move (Left Arrow)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 select-none">
                    Move {replayIdx} / {replayFenHistory.length - 1}
                  </span>

                  <button
                    onClick={() => handleStepReplay(replayIdx + 1)}
                    disabled={replayIdx >= replayFenHistory.length - 1}
                    className="p-2 rounded-xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                    title="Next Move (Right Arrow)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleStepReplay(replayFenHistory.length - 1)}
                    disabled={replayIdx >= replayFenHistory.length - 1}
                    className="p-2 rounded-xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                    title="Final Move (End)"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>

                {puzzle.comments && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-emerald-200">
                    <span className="font-bold">Note: </span>
                    {puzzle.comments}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={onNextPuzzle}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <span>Next Puzzle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleRetry}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Replay Position
                </button>
              </div>
            </div>
          ) : (
            /* Active Solving Instructions Card */
            <div className="flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Calculation Mode</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Find the winning sequence
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Evaluate all forcing moves (checks, captures, threats). You have <span className="font-bold text-rose-500">1 mistake maximum</span>.
                </p>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Tags & Theme</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(puzzle.tags || ['Tactics']).map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-[#0c1c18] border border-emerald-200 dark:border-emerald-900/50 rounded-2xl space-y-1">
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Current Combo: {comboCount} in a row</span>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
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
