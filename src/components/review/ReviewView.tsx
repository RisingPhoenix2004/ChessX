import React from 'react';
import { Puzzle, Collection } from '../../types/chess';
import { RotateCcw, AlertCircle, Zap, CheckCircle2 } from 'lucide-react';

interface ReviewViewProps {
  puzzles: Puzzle[];
  collections: Collection[];
  onStartReviewSession: (reviewPuzzles: Puzzle[]) => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  puzzles,
  onStartReviewSession,
}) => {
  const failedPuzzles = puzzles.filter((p) => Boolean(p.hasFailed));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
          <RotateCcw className="w-7 h-7 text-red-500" />
          <span>Practice Failed Puzzles</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Replay positions where calculation errors occurred to solidify pattern recognition.
        </p>
      </div>

      {/* Overview Card */}
      <div className="bg-white dark:bg-[#111520] p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white">{failedPuzzles.length} Failed Positions</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Ready for practice and replay</p>
          </div>
        </div>

        <button
          onClick={() => onStartReviewSession(failedPuzzles.length > 0 ? failedPuzzles : puzzles)}
          disabled={failedPuzzles.length === 0}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>REPLAY FAILED PUZZLES ({failedPuzzles.length})</span>
        </button>
      </div>

      {/* List of Failed Puzzles */}
      {failedPuzzles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {failedPuzzles.map((p, idx) => (
            <div
              key={p.id}
              className="bg-white dark:bg-[#111520] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between shadow-xs"
            >
              <div>
                <span className="text-[11px] font-bold text-neutral-400">Position #{idx + 1}</span>
                <h4 className="font-bold text-neutral-900 dark:text-white text-sm truncate max-w-[200px]">
                  {p.description || 'Tactical Position'}
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                  Category: {p.userCategory || p.tags[0] || 'General'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs border border-red-200 dark:border-red-800">
                {p.failedCount || 1} Fail{(p.failedCount || 1) > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">No Failed Puzzles!</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            You currently have no recorded failed puzzles in your training queue.
          </p>
        </div>
      )}
    </div>
  );
};
