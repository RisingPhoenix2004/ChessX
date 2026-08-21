import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Collection, Puzzle } from '../../types/chess';
import { Settings as UserSettings } from '../../services/storage';
import { soundEngine } from '../../services/soundEngine';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Layers,
  Clock,
  User,
  Award
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
  const collectionPuzzles = puzzles.filter((p) => (collection.puzzleIds || []).includes(p.id));
  const [selectedPuzzleIdx, setSelectedPuzzleIdx] = useState<number>(0);
  const currentPuzzle = collectionPuzzles[selectedPuzzleIdx] || puzzles[0];

  const [currentFen, setCurrentFen] = useState<string>(currentPuzzle?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [fenHistory, setFenHistory] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<{ san: string; moveNumber?: number; isWhite?: boolean; comment?: string }[]>([]);
  const [currentMoveIdx, setCurrentMoveIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const boardThemeKey = settings?.boardTheme || 'dark';
  const activeColors = BOARD_THEME_COLORS[boardThemeKey] || BOARD_THEME_COLORS.dark;

  // Build FEN and Move history when puzzle changes
  useEffect(() => {
    if (!currentPuzzle) return;

    const startFen = currentPuzzle.fen;
    const hist = [startFen];
    const movesList: { san: string; moveNumber?: number; isWhite?: boolean; comment?: string }[] = [];

    const simChess = new Chess(startFen);
    const sourceMoves = currentPuzzle.solutionMoves || [];

    sourceMoves.forEach((san, idx) => {
      try {
        const moveRes = simChess.move(san);
        if (moveRes) {
          hist.push(simChess.fen());
          movesList.push({
            san,
            moveNumber: Math.floor(idx / 2) + 1,
            isWhite: idx % 2 === 0,
            comment: currentPuzzle.movesData?.[idx]?.comment || (idx === sourceMoves.length - 1 ? currentPuzzle.comments : undefined),
          });
        }
      } catch {
        // ignore move errors
      }
    });

    setFenHistory(hist);
    setMoveHistory(movesList);
    setCurrentMoveIdx(0);
    setCurrentFen(startFen);
    setIsPlaying(false);
    setOrientation(currentPuzzle.sideToMove === 'b' ? 'black' : 'white');
  }, [currentPuzzle]);

  // Autoplay handler
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentMoveIdx((prev) => {
          if (prev < fenHistory.length - 1) {
            const next = prev + 1;
            setCurrentFen(fenHistory[next]);
            soundEngine.playMove();
            return next;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1000);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, fenHistory]);

  const jumpToMove = (idx: number) => {
    if (idx < 0 || idx >= fenHistory.length) return;
    setCurrentMoveIdx(idx);
    setCurrentFen(fenHistory[idx]);
    soundEngine.playMove();
  };

  const handleStart = () => jumpToMove(0);
  const handlePrev = () => jumpToMove(currentMoveIdx - 1);
  const handleNext = () => jumpToMove(currentMoveIdx + 1);
  const handleEnd = () => jumpToMove(fenHistory.length - 1);
  const handleFlip = () => setOrientation(orientation === 'white' ? 'black' : 'white');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0f0f0f] border border-neutral-800 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#171717] border border-neutral-800 text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">{collection.name}</h2>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#171717] text-neutral-400 border border-neutral-800">
                  {collection.category}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Position {selectedPuzzleIdx + 1} of {collectionPuzzles.length || 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onStartTraining && (
              <button
                onClick={() => {
                  onClose();
                  onStartTraining(collection.id);
                }}
                className="px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs shadow-md hover:bg-neutral-200 cursor-pointer hidden sm:block"
              >
                Train This Study
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6 overflow-y-auto flex-1 items-start">
          {/* Left Column: Board & Navigation Controls */}
          <div className="lg:col-span-7 flex flex-col items-center space-y-4">
            <div className="w-full max-w-[440px] aspect-square rounded-2xl overflow-hidden border border-neutral-800 shadow-xl bg-[#121212]">
              <Chessboard
                position={currentFen}
                arePiecesDraggable={false}
                boardOrientation={orientation}
                showBoardNotation={settings?.showCoordinates !== false}
                customDarkSquareStyle={{ backgroundColor: activeColors.dark }}
                customLightSquareStyle={{ backgroundColor: activeColors.light }}
                customBoardStyle={{ borderRadius: '1rem' }}
              />
            </div>

            {/* Navigation Controls Bar */}
            <div className="flex items-center justify-between w-full max-w-[440px] bg-[#171717] p-2 rounded-2xl border border-neutral-800">
              <button
                onClick={handleStart}
                disabled={currentMoveIdx <= 0}
                className="p-2.5 rounded-xl text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="First move"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrev}
                disabled={currentMoveIdx <= 0}
                className="p-2.5 rounded-xl text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Previous move"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-white hover:text-black text-white font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentMoveIdx >= fenHistory.length - 1}
                className="p-2.5 rounded-xl text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Next move"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleEnd}
                disabled={currentMoveIdx >= fenHistory.length - 1}
                className="p-2.5 rounded-xl text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Last move"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleFlip}
                className="p-2.5 rounded-xl text-neutral-400 hover:text-white cursor-pointer"
                title="Flip board"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Positions List & Moves Tree with Commentary */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between h-full">
            {/* Position Selector Tabs if multiple puzzles */}
            {collectionPuzzles.length > 1 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Select Position
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {collectionPuzzles.map((_, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => setSelectedPuzzleIdx(pIdx)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedPuzzleIdx === pIdx
                          ? 'bg-white text-black'
                          : 'bg-[#171717] text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      #{pIdx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Game / Position Details Card */}
            <div className="bg-[#171717] p-4 rounded-2xl border border-neutral-800 space-y-2">
              <h4 className="text-sm font-extrabold text-white">
                {currentPuzzle?.description || currentPuzzle?.event || 'Tactical Study Position'}
              </h4>
              {(currentPuzzle?.white || currentPuzzle?.black) && (
                <div className="text-xs text-neutral-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>{currentPuzzle.white || 'White'} vs {currentPuzzle.black || 'Black'}</span>
                </div>
              )}
            </div>

            {/* Moves List with Comments */}
            <div className="bg-[#171717] p-4 rounded-2xl border border-neutral-800 space-y-3 flex-1 max-h-[300px] overflow-y-auto">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Move Sequence
              </span>

              <div className="space-y-2">
                {moveHistory.map((m, idx) => {
                  const isActive = currentMoveIdx === idx + 1;
                  return (
                    <div
                      key={idx}
                      onClick={() => jumpToMove(idx + 1)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white/10 border-white/40 text-white shadow-md'
                          : 'bg-[#121212] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-mono font-bold text-xs">
                        <span className="text-neutral-500">
                          {m.moveNumber ? `${m.moveNumber}.` : `#${idx + 1}`}
                        </span>
                        <span className="text-white">{m.san}</span>
                      </div>

                      {m.comment && (
                        <p className="text-[11px] text-neutral-300 mt-1 pl-1 border-l-2 border-amber-400 font-sans">
                          {m.comment}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
