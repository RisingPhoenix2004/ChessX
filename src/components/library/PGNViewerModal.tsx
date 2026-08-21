import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Collection, Puzzle } from '../../types/chess';
import { Settings as UserSettings } from '../../services/storage';
import { soundEngine } from '../../services/soundEngine';
import { LichessNotationView } from './LichessNotationView';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  BookOpen,
} from 'lucide-react';

interface PGNViewerModalProps {
  collection: Collection;
  puzzles: Puzzle[];
  settings?: UserSettings;
  onClose: () => void;
  onStartTraining?: (collectionId: string) => void;
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

export const PGNViewerModal: React.FC<PGNViewerModalProps> = ({
  collection,
  puzzles,
  settings,
  onClose,
  onStartTraining,
}) => {
  const collectionPuzzles = (puzzles || []).filter(
    (p) => (collection.puzzleIds || []).includes(p.id) || p.collectionId === collection.id
  );
  const activePuzzles = collectionPuzzles.length > 0 ? collectionPuzzles : puzzles.slice(0, 5);

  const [selectedPuzzleIdx, setSelectedPuzzleIdx] = useState<number>(0);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(!settings?.soundEnabled);

  const currentPuzzle = activePuzzles[selectedPuzzleIdx] || activePuzzles[0];

  const [currentMoveIdx, setCurrentMoveIdx] = useState<number>(0);
  const [fenHistory, setFenHistory] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<
    { san: string; moveNumber: number; isWhite: boolean }[]
  >([]);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const boardThemeKey = settings?.boardTheme || 'dark';
  const activeColors = BOARD_THEME_COLORS[boardThemeKey] || BOARD_THEME_COLORS.dark;

  // Initialize active puzzle history
  useEffect(() => {
    if (!currentPuzzle) return;

    const startFen = currentPuzzle.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const simGame = new Chess(startFen);
    const history = [startFen];
    const moves: { san: string; moveNumber: number; isWhite: boolean }[] = [];

    const solutionMoves = currentPuzzle.solutionMoves || [];
    solutionMoves.forEach((san, idx) => {
      try {
        const moveRes = simGame.move(san);
        if (moveRes) {
          history.push(simGame.fen());
          moves.push({
            san,
            moveNumber: Math.floor(idx / 2) + 1,
            isWhite: idx % 2 === 0,
          });
        }
      } catch {
        // move parse fallback
      }
    });

    setFenHistory(history);
    setMoveHistory(moves);
    setCurrentMoveIdx(0);
    setIsPlaying(false);
    setOrientation(currentPuzzle.sideToMove === 'b' ? 'black' : 'white');
  }, [currentPuzzle, selectedPuzzleIdx]);

  // Autoplay effect
  useEffect(() => {
    if (isPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentMoveIdx((prev) => {
          if (prev < fenHistory.length - 1) {
            if (!soundMuted) soundEngine.playMove();
            return prev + 1;
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

  const currentFen = fenHistory[currentMoveIdx] || currentPuzzle?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const jumpToMove = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= fenHistory.length) return;
    setCurrentMoveIdx(targetIdx);
    if (!soundMuted) soundEngine.playMove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 bg-neutral-50 dark:bg-[#171b26] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-950 dark:text-white truncate max-w-md">
                {collection.name}
              </h2>
              <p className="text-xs text-neutral-500 font-semibold">
                {activePuzzles.length} Chapters • Interactive PGN Viewer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onStartTraining && (
              <button
                onClick={() => onStartTraining(collection.id)}
                className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                Solve Chapter
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Column Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 overflow-y-auto flex-1 items-start">
          {/* Chapter Selector Sidebar */}
          <div className="md:col-span-3 bg-neutral-50 dark:bg-[#161a24] p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 space-y-2 max-h-[480px] flex flex-col">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
              Select Chapter
            </h3>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {activePuzzles.map((p, idx) => (
                <button
                  key={p.id || idx}
                  onClick={() => setSelectedPuzzleIdx(idx)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                    selectedPuzzleIdx === idx
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {p.description || `Chapter ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>

          {/* Chessboard Column */}
          <div className="md:col-span-5 flex flex-col items-center gap-3">
            <div className="w-full max-w-[380px] aspect-square rounded-none overflow-hidden border border-neutral-300 dark:border-neutral-700 shadow-md relative bg-neutral-900">
              <Chessboard
                position={currentFen}
                boardOrientation={orientation}
                showPromotionDialog={false}
                customDarkSquareStyle={{ backgroundColor: activeColors.dark }}
                customLightSquareStyle={{ backgroundColor: activeColors.light }}
              />
            </div>

            {/* Exact Action Bar under Board (Image 1 requested order: Flip, Sound, Color Circle. NO TEXT!) */}
            <div className="flex items-center justify-between w-full max-w-[380px] px-3 py-2 bg-white dark:bg-[#111520] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center gap-3">
                {/* 1. Flip Board Icon Button */}
                <button
                  onClick={() => setOrientation(orientation === 'white' ? 'black' : 'white')}
                  className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white transition-colors cursor-pointer"
                  title={`Flip Board (Current: ${orientation})`}
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
              </div>

              {/* 3. Color to Move Circle Icon */}
              <div className="flex items-center">
                <span
                  className={`w-4 h-4 rounded-full border shrink-0 transition-all ${
                    currentFen.includes(' w ')
                      ? 'bg-white border-neutral-400 shadow-xs'
                      : 'bg-black border-neutral-600 shadow-xs'
                  }`}
                  title={currentFen.includes(' w ') ? 'White to move' : 'Black to move'}
                />
              </div>
            </div>
          </div>

          {/* Moves & Analysis Column (Lichess Notation Tree View) */}
          <div className="md:col-span-4 flex flex-col justify-between space-y-3 h-[480px]">
            <div className="flex-1 overflow-hidden">
              <LichessNotationView
                currentFen={currentFen}
                currentMoveIdx={currentMoveIdx}
                moveHistory={moveHistory}
                comments={currentPuzzle?.comments}
                onSelectMove={jumpToMove}
              />
            </div>

            {/* Navigation Stepper Bar */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => jumpToMove(0)}
                disabled={currentMoveIdx <= 0}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer"
                title="First Move"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => jumpToMove(currentMoveIdx - 1)}
                disabled={currentMoveIdx <= 0}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer"
                title="Previous Move"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={() => jumpToMove(currentMoveIdx + 1)}
                disabled={currentMoveIdx >= fenHistory.length - 1}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer"
                title="Next Move"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => jumpToMove(fenHistory.length - 1)}
                disabled={currentMoveIdx >= fenHistory.length - 1}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 disabled:opacity-30 cursor-pointer"
                title="Last Move"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
