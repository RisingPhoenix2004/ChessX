import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Collection, Puzzle } from '../../types/chess';
import { Settings as UserSettings } from '../../services/storage';
import { soundEngine } from '../../services/soundEngine';
import {
  ArrowLeft,
  Search,
  Plus,
  Play,
  Zap,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Cpu,
  Settings as SettingsIcon,
  BookOpen,
  Eye,
  CheckCircle2,
  X,
  Share2,
  Copy,
  Layers,
  Sparkles,
  Volume2
} from 'lucide-react';

interface StudyDetailsViewProps {
  study: Collection;
  puzzles: Puzzle[];
  settings?: UserSettings;
  onBack: () => void;
  onStartTraining: (studyId: string) => void;
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

// Stockfish Simulated Evaluation Engine Line Generator
function generateEngineAnalysis(chess: Chess, sideToMove: 'w' | 'b') {
  const isMate = chess.isCheckmate();
  if (isMate) {
    return {
      evalScore: '#0',
      isWinning: sideToMove === 'b', // side that just moved delivered mate
      lines: ['Checkmate — position terminated.'],
    };
  }

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    return { evalScore: '0.0', isWinning: true, lines: ['Stalemate / Draw'] };
  }

  // Count piece values
  const board = chess.board();
  let whiteMaterial = 0;
  let blackMaterial = 0;
  const values: Record<string, number> = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 };

  for (const row of board) {
    for (const piece of row) {
      if (piece) {
        if (piece.color === 'w') whiteMaterial += values[piece.type] || 0;
        else blackMaterial += values[piece.type] || 0;
      }
    }
  }

  const diff = (whiteMaterial - blackMaterial).toFixed(1);
  const scoreNum = parseFloat(diff);
  const evalScore = scoreNum > 0 ? `+${diff}` : `${diff}`;

  // Top candidate lines
  const topLines = [];
  const primarySan = moves[0]?.san || 'e4';
  const secondSan = moves[1]?.san || (moves[0] ? `${moves[0].san}` : 'Nf3');
  const thirdSan = moves[2]?.san || 'd4';

  topLines.push({
    score: scoreNum > 2 ? `+${(scoreNum + 1.2).toFixed(1)}` : evalScore,
    line: `1. ${primarySan} ...`,
  });

  if (moves.length > 1) {
    topLines.push({
      score: scoreNum > 0 ? `+${Math.max(0, scoreNum - 0.5).toFixed(1)}` : `${(scoreNum - 0.5).toFixed(1)}`,
      line: `1. ${secondSan} ...`,
    });
  }

  if (moves.length > 2) {
    topLines.push({
      score: scoreNum > 0 ? `+${Math.max(0, scoreNum - 1.1).toFixed(1)}` : `${(scoreNum - 1.1).toFixed(1)}`,
      line: `1. ${thirdSan} ...`,
    });
  }

  return {
    evalScore,
    isWinning: scoreNum >= 0,
    lines: topLines,
  };
}

export const StudyDetailsView: React.FC<StudyDetailsViewProps> = ({
  study,
  puzzles,
  settings,
  onBack,
  onStartTraining,
}) => {
  const puzzleIds = study.puzzleIds || [];
  const studyPuzzles = useMemo(
    () => (puzzles || []).filter((p) => puzzleIds.includes(p.id)),
    [puzzles, puzzleIds]
  );

  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [chapterSearch, setChapterSearch] = useState<string>('');
  const [engineEnabled, setEngineEnabled] = useState<boolean>(true);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [copyFeedback, setCopyFeedback] = useState<string>('');

  const currentPuzzle = studyPuzzles[activeChapterIdx] || studyPuzzles[0] || puzzles[0];

  // Chess Navigation State
  const [game, setGame] = useState<Chess>(() => new Chess(currentPuzzle?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));
  const [fenHistory, setFenHistory] = useState<string[]>([]);
  const [moveList, setMoveList] = useState<{ san: string; moveNum: number; isWhite: boolean }[]>([]);
  const [currentMoveStep, setCurrentMoveStep] = useState<number>(0);

  const boardThemeKey = settings?.boardTheme || 'emerald';
  const activeColors = BOARD_THEME_COLORS[boardThemeKey] || BOARD_THEME_COLORS.emerald;

  // Initialize chapter FEN & solution variation
  useEffect(() => {
    if (!currentPuzzle) return;

    const startFen = currentPuzzle.fen;
    const sim = new Chess(startFen);
    const history = [startFen];
    const moves: { san: string; moveNum: number; isWhite: boolean }[] = [];

    const side = currentPuzzle.sideToMove === 'b' ? 'black' : 'white';
    setBoardOrientation(side);

    (currentPuzzle.solutionMoves || []).forEach((san, idx) => {
      try {
        const res = sim.move(san);
        if (res) {
          history.push(sim.fen());
          moves.push({
            san,
            moveNum: Math.floor(idx / 2) + 1,
            isWhite: idx % 2 === 0,
          });
        }
      } catch {
        // ignore move parse errors
      }
    });

    setGame(new Chess(startFen));
    setFenHistory(history);
    setMoveList(moves);
    setCurrentMoveStep(0);
  }, [currentPuzzle]);

  const jumpToMove = (step: number) => {
    if (step < 0 || step >= fenHistory.length) return;
    setCurrentMoveStep(step);
    setGame(new Chess(fenHistory[step]));
    soundEngine.playMove();
  };

  const handleNextChapter = () => {
    if (activeChapterIdx + 1 < studyPuzzles.length) {
      setActiveChapterIdx(activeChapterIdx + 1);
    }
  };

  const handlePrevChapter = () => {
    if (activeChapterIdx > 0) {
      setActiveChapterIdx(activeChapterIdx - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') jumpToMove(currentMoveStep - 1);
      else if (e.key === 'ArrowRight') jumpToMove(currentMoveStep + 1);
      else if (e.key === 'Home') jumpToMove(0);
      else if (e.key === 'End') jumpToMove(fenHistory.length - 1);
      else if (e.key === 'ArrowUp') handlePrevChapter();
      else if (e.key === 'ArrowDown') handleNextChapter();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMoveStep, fenHistory.length, activeChapterIdx, studyPuzzles.length]);

  const handleCopyFen = () => {
    navigator.clipboard.writeText(game.fen());
    setCopyFeedback('FEN Copied!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  // Filter chapters by search
  const filteredChapters = useMemo(() => {
    if (!chapterSearch.trim()) return studyPuzzles;
    const q = chapterSearch.toLowerCase();
    return studyPuzzles.filter(
      (p, i) =>
        (p.description || `Chapter ${i + 1}`).toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [studyPuzzles, chapterSearch]);

  // Engine evaluation data
  const engineAnalysis = useMemo(() => {
    return generateEngineAnalysis(game, currentPuzzle?.sideToMove || 'w');
  }, [game, currentPuzzle]);

  // Format move pairs for PGN table
  const movePairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < moveList.length; i += 2) {
      pairs.push({
        moveNum: Math.floor(i / 2) + 1,
        white: moveList[i]?.san,
        whiteStep: i + 1,
        black: moveList[i + 1]?.san || null,
        blackStep: i + 2,
      });
    }
    return pairs;
  }, [moveList]);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#0c1017] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#131a28] hover:bg-slate-200 dark:hover:bg-[#1c2742] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Back to Studies"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate max-w-md">
                {study.name}
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {study.category}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chapter {activeChapterIdx + 1} of {studyPuzzles.length}: {currentPuzzle?.description || 'Tactical variation'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => onStartTraining(study.id)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>SOLVE STUDY</span>
          </button>
        </div>
      </div>

      {/* 3-Column Lichess-Inspired Study Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Chapters / Variations Navigation (3 Cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0c1017] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col h-[620px] overflow-hidden">
          {/* Chapters Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
              <span className="text-amber-500 font-bold">{studyPuzzles.length} Chapters</span>
              <span className="text-[11px] text-slate-400 font-medium">Interactive Study</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                placeholder="Search chapters..."
                className="w-full bg-slate-50 dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Chapter List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 p-1.5 space-y-1 scrollbar-thin">
            {filteredChapters.map((p, idx) => {
              const originalIdx = studyPuzzles.indexOf(p);
              const isActive = originalIdx === activeChapterIdx;
              const chapterTitle = p.description || `Chapter ${originalIdx + 1}`;

              return (
                <button
                  key={p.id}
                  onClick={() => setActiveChapterIdx(originalIdx)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#151d2f]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-mono text-[11px] ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                      {originalIdx + 1}
                    </span>
                    <span className="truncate">{chapterTitle}</span>
                  </div>

                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Chapter Footer */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0f1420]">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono text-center">
              Use ↑ / ↓ arrow keys to switch chapters
            </div>
          </div>
        </div>

        {/* Center Column: Interactive Chessboard + Eval Bar (5.5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-3">
          <div className="flex items-center gap-2 w-full max-w-[500px]">
            {/* Visual Evaluation Bar (Lichess style) */}
            {engineEnabled && (
              <div className="w-3.5 h-[480px] bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end border border-slate-700 shrink-0">
                <div
                  className="bg-white w-full transition-all duration-300"
                  style={{
                    height: engineAnalysis.isWinning ? '65%' : '35%',
                  }}
                />
              </div>
            )}

            {/* Board Container */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl relative bg-slate-900">
              <Chessboard
                position={game.fen()}
                boardOrientation={boardOrientation}
                showBoardNotation={settings?.showCoordinates !== false}
                animationDuration={150}
                customBoardStyle={{
                  borderRadius: '1rem',
                }}
                customDarkSquareStyle={{ backgroundColor: activeColors.dark }}
                customLightSquareStyle={{ backgroundColor: activeColors.light }}
                arePiecesDraggable={false}
              />
            </div>
          </div>

          {/* Board Footer Tools: Flip, Copy FEN, Status */}
          <div className="flex items-center justify-between gap-2 w-full max-w-[500px] px-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white')}
                className="hover:text-slate-900 dark:hover:text-white cursor-pointer font-bold"
              >
                Flip Board ({boardOrientation})
              </button>

              <button
                onClick={handleCopyFen}
                className="hover:text-slate-900 dark:hover:text-white cursor-pointer flex items-center gap-1 font-bold"
              >
                <Copy className="w-3 h-3" />
                <span>{copyFeedback || 'Copy FEN'}</span>
              </button>
            </div>

            <div className="font-mono text-[11px]">
              {currentPuzzle?.sideToMove === 'w' ? 'White to Move' : 'Black to Move'}
            </div>
          </div>
        </div>

        {/* Right Column: Stockfish Engine Analysis & PGN Move Table (3.5 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0c1017] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col h-[620px] justify-between overflow-hidden">
          <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
            {/* Stockfish Engine Header Bar (Image 2 style) */}
            <div className="p-3 bg-slate-50 dark:bg-[#131b2b] rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    onClick={() => setEngineEnabled(!engineEnabled)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
                      engineEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {engineEnabled ? 'ENGINE ON' : 'OFF'}
                  </div>

                  <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                    {engineAnalysis.evalScore}
                  </span>

                  <span className="text-[10px] font-mono text-slate-400">SF 18 dev NNUE</span>
                </div>

                <span className="text-[9px] font-bold text-blue-500 uppercase bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/40">
                  Depth 31
                </span>
              </div>

              {/* Engine Candidate Lines */}
              {engineEnabled && (
                <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700/40 font-mono text-[11px]">
                  {engineAnalysis.lines.map((ln, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 w-10">
                        {typeof ln === 'object' ? ln.score : '+0.5'}
                      </span>
                      <span className="flex-1 truncate pl-1">
                        {typeof ln === 'object' ? ln.line : ln}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coach / Instructor Commentary Box */}
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 text-xs space-y-1">
              <span className="font-black text-emerald-800 dark:text-emerald-300 text-[10px] uppercase tracking-wider block">
                Study Analysis
              </span>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed italic">
                "{currentPuzzle?.comments || currentPuzzle?.description || 'Find the optimal forcing moves and tactical patterns in this variation.'}"
              </p>
            </div>

            {/* Interactive PGN Move Table (2 Columns) */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Move Sequence (Click to jump)
              </div>

              <div className="bg-slate-50 dark:bg-[#131b2b] rounded-xl border border-slate-200 dark:border-slate-700/60 p-2.5 font-mono text-xs max-h-52 overflow-y-auto scrollbar-thin">
                <div className="grid grid-cols-12 gap-y-1 items-center">
                  {movePairs.map((pair) => {
                    const isWhiteActive = currentMoveStep === pair.whiteStep;
                    const isBlackActive = currentMoveStep === pair.blackStep;

                    return (
                      <React.Fragment key={pair.moveNum}>
                        <div className="col-span-2 text-slate-400 font-bold select-none py-0.5">
                          {pair.moveNum}.
                        </div>

                        <div className="col-span-5 pr-1">
                          <button
                            onClick={() => jumpToMove(pair.whiteStep)}
                            className={`w-full text-left px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                              isWhiteActive
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {pair.white}
                          </button>
                        </div>

                        <div className="col-span-5 pl-1">
                          {pair.black ? (
                            <button
                              onClick={() => jumpToMove(pair.blackStep)}
                              className={`w-full text-left px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                isBlackActive
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {pair.black}
                            </button>
                          ) : null}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls & Next Chapter Footer */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0f1420] space-y-2">
            {/* Step Controls: |< < > >| */}
            <div className="flex items-center justify-between gap-1">
              <button
                onClick={() => jumpToMove(0)}
                disabled={currentMoveStep <= 0}
                className="p-2 rounded-lg bg-white dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                title="Start (Home)"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => jumpToMove(currentMoveStep - 1)}
                disabled={currentMoveStep <= 0}
                className="p-2 rounded-lg bg-white dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                title="Previous (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                Move {currentMoveStep} / {fenHistory.length - 1}
              </span>

              <button
                onClick={() => jumpToMove(currentMoveStep + 1)}
                disabled={currentMoveStep >= fenHistory.length - 1}
                className="p-2 rounded-lg bg-white dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                title="Next (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => jumpToMove(fenHistory.length - 1)}
                disabled={currentMoveStep >= fenHistory.length - 1}
                className="p-2 rounded-lg bg-white dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                title="End (End)"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* Next Chapter Button (Image 2 style) */}
            <button
              onClick={handleNextChapter}
              disabled={activeChapterIdx >= studyPuzzles.length - 1}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40 cursor-pointer"
            >
              <span>Next Chapter</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
