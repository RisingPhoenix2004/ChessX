import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Collection, Puzzle } from '../../types/chess';
import { Settings as UserSettings, storage } from '../../services/storage';
import { soundEngine } from '../../services/soundEngine';
import { LichessNotationView } from './LichessNotationView';
import { LichessPromotionOverlay } from './LichessPromotionOverlay';
import {
  ArrowLeft,
  Search,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  RotateCw,
  Volume2,
  VolumeX,
  Scaling,
  SkipForward,
} from 'lucide-react';

interface StudyDetailsViewProps {
  study: Collection;
  puzzles: Puzzle[];
  settings?: UserSettings;
  onBack: () => void;
  onStartTraining: (studyId: string) => void;
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

export const StudyDetailsView: React.FC<StudyDetailsViewProps> = ({
  study,
  puzzles,
  settings,
  onBack,
  onStartTraining,
}) => {
  // Collect all puzzles/chapters belonging to this study
  const studyPuzzles = useMemo(() => {
    const list = (puzzles || []).filter(
      (p) => (study.puzzleIds || []).includes(p.id) || p.collectionId === study.id
    );
    if (list.length > 0) return list;
    return (puzzles || []).slice(0, 5); // Fallback if standalone
  }, [puzzles, study]);

  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [chapterSearch, setChapterSearch] = useState<string>('');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [soundMuted, setSoundMuted] = useState<boolean>(!settings?.soundEnabled);
  const [autoNext, setAutoNext] = useState<boolean>(settings?.autoNext || false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  const currentPuzzle = studyPuzzles[activeChapterIdx] || studyPuzzles[0] || puzzles[0];

  // Helper to extract clean chapter title (ignoring comments)
  const getChapterTitle = (p: Puzzle, idx: number) => {
    if (p.event && p.event !== '?' && !p.event.toLowerCase().includes('untitled')) {
      return p.event;
    }
    if (p.white && p.black && p.white !== '?') {
      return `${p.white} vs ${p.black}`;
    }
    if (p.description && !p.description.includes('\n') && p.description.length < 50) {
      return p.description;
    }
    return `Chapter ${idx + 1}`;
  };

  // Chess Game State
  const [game, setGame] = useState<Chess>(
    () => new Chess(currentPuzzle?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  );
  const [fenHistory, setFenHistory] = useState<string[]>([]);
  const [moveList, setMoveList] = useState<{ san: string; moveNum: number; isWhite: boolean; comment?: string }[]>([]);
  const [currentMoveStep, setCurrentMoveStep] = useState<number>(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const boardThemeKey = settings?.boardTheme || 'dark';
  const activeColors = BOARD_THEME_COLORS[boardThemeKey] || BOARD_THEME_COLORS.dark;

  // Initialize chapter FEN & solution variation when switching chapters
  useEffect(() => {
    if (!currentPuzzle) return;

    const startFen = currentPuzzle.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const simGame = new Chess(startFen);
    const history = [startFen];
    const moves: { san: string; moveNum: number; isWhite: boolean; comment?: string }[] = [];

    const solutionMoves = currentPuzzle.solutionMoves || [];
    solutionMoves.forEach((san, idx) => {
      try {
        const moveRes = simGame.move(san);
        if (moveRes) {
          history.push(simGame.fen());
          moves.push({
            san,
            moveNum: Math.floor(idx / 2) + 1,
            isWhite: idx % 2 === 0,
            comment: currentPuzzle.movesData?.[idx]?.comment,
          });
        }
      } catch {
        // move parse fallback
      }
    });

    setFenHistory(history);
    setMoveList(moves);
    setCurrentMoveStep(0);
    setGame(new Chess(startFen));
    setSelectedSquare(null);
    setIsPlaying(false);
    setPendingPromotion(null);
    setBoardOrientation(currentPuzzle.sideToMove === 'b' ? 'black' : 'white');
  }, [currentPuzzle, activeChapterIdx]);

  // Autoplay handler
  useEffect(() => {
    if (isPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentMoveStep((prev) => {
          if (prev < fenHistory.length - 1) {
            const next = prev + 1;
            setGame(new Chess(fenHistory[next]));
            if (!soundMuted) soundEngine.playMove();
            return next;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 900);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlaying, fenHistory, soundMuted]);

  const jumpToMove = (targetStep: number) => {
    if (targetStep < 0 || targetStep >= fenHistory.length) return;
    setCurrentMoveStep(targetStep);
    setGame(new Chess(fenHistory[targetStep]));
    if (!soundMuted) soundEngine.playMove();
  };

  // Execute promotion move when piece is selected
  const handleExecutePromotion = (promotionPiece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    setPendingPromotion(null);
    executeMove(from, to, promotionPiece);
  };

  const executeMove = (sourceSquare: Square, targetSquare: Square, promotionPiece: 'q' | 'r' | 'b' | 'n' = 'q'): boolean => {
    try {
      const tempChess = new Chess(game.fen());
      const move = tempChess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: promotionPiece,
      });

      if (!move) return false;

      if (!soundMuted) {
        if (move.captured) soundEngine.playCapture();
        else soundEngine.playMove();
      }

      const newFen = tempChess.fen();
      setGame(tempChess);
      setSelectedSquare(null);

      // Update Move list and Fen History
      const nextStep = currentMoveStep + 1;
      const updatedHistory = [...fenHistory.slice(0, currentMoveStep + 1), newFen];
      const updatedMoveList = [
        ...moveList.slice(0, currentMoveStep),
        {
          san: move.san,
          moveNum: Math.floor(currentMoveStep / 2) + 1,
          isWhite: currentMoveStep % 2 === 0,
        },
      ];

      setFenHistory(updatedHistory);
      setMoveList(updatedMoveList);
      setCurrentMoveStep(nextStep);

      // Persist moves into puzzle object so user's moves are saved in PGN
      if (currentPuzzle) {
        currentPuzzle.solutionMoves = updatedMoveList.map((m) => m.san);
        currentPuzzle.movesData = updatedMoveList.map((m) => ({
          san: m.san,
          moveNumber: m.moveNum,
          isWhite: m.isWhite,
          comment: m.comment,
        }));
        storage.savePuzzles(puzzles);
      }

      return true;
    } catch {
      return false;
    }
  };

  // Interactive move support in PGN viewer
  const onPieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    const tempChess = new Chess(game.fen());
    const piece = tempChess.get(sourceSquare);

    // Check for promotion requirement
    if (
      piece &&
      piece.type === 'p' &&
      ((piece.color === 'w' && targetSquare[1] === '8') ||
        (piece.color === 'b' && targetSquare[1] === '1'))
    ) {
      setPendingPromotion({ from: sourceSquare, to: targetSquare });
      return false;
    }

    return executeMove(sourceSquare, targetSquare);
  };

  const handleSquareClick = (square: Square) => {
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      const moved = onPieceDrop(selectedSquare, square);
      if (moved) return;
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  // Filter chapters by search
  const filteredChapters = useMemo(() => {
    if (!chapterSearch.trim()) return studyPuzzles;
    const q = chapterSearch.toLowerCase();
    return studyPuzzles.filter((p, i) => {
      const title = getChapterTitle(p, i).toLowerCase();
      return title.includes(q) || (p.tags || []).some((t) => t.toLowerCase().includes(q));
    });
  }, [studyPuzzles, chapterSearch]);

  const currentChapterTitle = currentPuzzle ? getChapterTitle(currentPuzzle, activeChapterIdx) : `Chapter ${activeChapterIdx + 1}`;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#111520] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
            title="Back to Studies"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-neutral-950 dark:text-white truncate max-w-md">
                {study.name}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                {study.category}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
              Chapter {activeChapterIdx + 1} of {studyPuzzles.length}: {currentChapterTitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => onStartTraining(study.id)}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>SOLVE STUDY</span>
          </button>
        </div>
      </div>

      {/* 3-Column Layout: Reduced Left Column to lg:col-span-3, Expanded Board Column to lg:col-span-5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Chapters Navigation (Reduced Width to lg:col-span-3 per Image 1 annotation) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#111520] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col h-[580px] overflow-hidden">
          {/* Chapters Header */}
          <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-white">
              <span>{studyPuzzles.length} Chapters</span>
              <span className="text-[10px] text-neutral-400 font-medium">Study</span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Chapter List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/40 p-1 space-y-0.5 scrollbar-thin">
            {filteredChapters.map((p) => {
              const originalIdx = studyPuzzles.indexOf(p);
              const isActive = originalIdx === activeChapterIdx;
              const title = getChapterTitle(p, originalIdx);

              return (
                <button
                  key={p.id}
                  onClick={() => setActiveChapterIdx(originalIdx)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`font-mono text-[10px] ${
                        isActive ? 'text-neutral-400 dark:text-neutral-600' : 'text-neutral-400'
                      }`}
                    >
                      {originalIdx + 1}
                    </span>
                    <span className="truncate text-xs">{title}</span>
                  </div>

                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Column: Expanded Chessboard & Exact Icon-Only Action Bar (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-3">
          {/* Sharp Square Chessboard Container */}
          <div className="w-full aspect-square rounded-none overflow-hidden border border-neutral-300 dark:border-neutral-700 shadow-md relative bg-neutral-900">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onPieceDrop}
              onSquareClick={handleSquareClick}
              boardOrientation={boardOrientation}
              showBoardNotation={settings?.showCoordinates !== false}
              showPromotionDialog={false}
              animationDuration={150}
              customDarkSquareStyle={{ backgroundColor: activeColors.dark }}
              customLightSquareStyle={{ backgroundColor: activeColors.light }}
            />

            {/* Resize Handle Icon at Bottom Right Corner */}
            <div
              className="absolute bottom-1 right-1 p-1 bg-black/70 hover:bg-black text-neutral-300 hover:text-white rounded-none cursor-se-resize z-10 transition-colors"
              title="Resize Chessboard"
            >
              <Scaling className="w-3.5 h-3.5" />
            </div>

            {/* Authentic Lichess Vertical Column Promotion Overlay (Image 5 style) */}
            {pendingPromotion && (
              <LichessPromotionOverlay
                targetSquare={pendingPromotion.to}
                orientation={boardOrientation}
                color={game.turn()}
                onSelectPiece={handleExecutePromotion}
                onCancel={() => setPendingPromotion(null)}
              />
            )}
          </div>

          {/* Exact Action Bar under Board (Image 1 requested order: Flip, Sound, AutoNext, Color Circle. NO TEXT!) */}
          <div className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-[#111520] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center gap-3">
              {/* 1. Flip Board Icon Button */}
              <button
                onClick={() => setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white')}
                className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white transition-colors cursor-pointer"
                title={`Flip Board (Current: ${boardOrientation})`}
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* 2. Sound Toggle Icon Button */}
              <button
                onClick={() => setSoundMuted(!soundMuted)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  soundMuted
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white'
                }`}
                title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
              >
                {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* 3. AutoNext Toggle Icon Button (Image 1 requirement) */}
              <button
                onClick={() => setAutoNext(!autoNext)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  autoNext
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40'
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400'
                }`}
                title={autoNext ? 'AutoNext ON (Advances on solve)' : 'AutoNext OFF'}
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* 4. Color to Move Circle Icon (Image 1 requirement) */}
            <div className="flex items-center">
              <span
                className={`w-4 h-4 rounded-full border shrink-0 transition-all ${
                  game.turn() === 'w'
                    ? 'bg-white border-neutral-400 shadow-xs'
                    : 'bg-black border-neutral-600 shadow-xs'
                }`}
                title={game.turn() === 'w' ? 'White to move' : 'Black to move'}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Lichess PGN Inline Move Sequence & Annotations (lg:col-span-4) */}
        <div className="lg:col-span-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between h-[580px] space-y-3 p-1">
          <div className="flex-1 overflow-hidden">
            <LichessNotationView
              currentFen={game.fen()}
              currentMoveIdx={currentMoveStep}
              moveHistory={moveList}
              comments={currentPuzzle?.comments}
              onSelectMove={jumpToMove}
            />
          </div>

          {/* Bottom Step & Playback Navigation Controls */}
          <div className="flex items-center justify-between gap-1.5 p-2 bg-white dark:bg-[#111520] rounded-xl border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => jumpToMove(0)}
              disabled={currentMoveStep <= 0}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
              title="First move (Home)"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => jumpToMove(currentMoveStep - 1)}
              disabled={currentMoveStep <= 0}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
              title="Previous move (Left arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={() => jumpToMove(currentMoveStep + 1)}
              disabled={currentMoveStep >= fenHistory.length - 1}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
              title="Next move (Right arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => jumpToMove(fenHistory.length - 1)}
              disabled={currentMoveStep >= fenHistory.length - 1}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
              title="Last move (End)"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

