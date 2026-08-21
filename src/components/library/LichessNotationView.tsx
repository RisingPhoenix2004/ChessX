import React from 'react';

export interface MoveItem {
  san: string;
  moveNumber?: number;
  isWhite?: boolean;
  comment?: string;
  variation?: string;
}

interface LichessNotationViewProps {
  currentFen?: string;
  currentMoveIdx: number; // 0 for start position, 1 for move 1, etc.
  moveHistory: MoveItem[];
  comments?: string;
  onSelectMove: (moveIdx: number) => void;
}

export function formatSanWithFigurine(san: string): string {
  if (!san) return '';
  return san
    .replace(/^K/, '♔')
    .replace(/^Q/, '♛')
    .replace(/^R/, '♜')
    .replace(/^B/, '♗')
    .replace(/^N/, '♘')
    .replace(/K/g, '♔')
    .replace(/Q/g, '♛')
    .replace(/R/g, '♜')
    .replace(/B/g, '♗')
    .replace(/N/g, '♘');
}

export const LichessNotationView: React.FC<LichessNotationViewProps> = ({
  currentMoveIdx,
  moveHistory,
  comments,
  onSelectMove,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#16171a] text-neutral-200 rounded-none border border-neutral-800 shadow-inner overflow-hidden font-sans select-none">
      {/* Header Bar */}
      <div className="px-3 py-2 bg-[#1f2126] border-b border-neutral-800 flex items-center justify-between">
        <h3 className="text-xs font-bold text-neutral-300 tracking-wider uppercase">PGN Move Notation</h3>
        <span className="text-[11px] font-mono text-neutral-500">{moveHistory.length} moves</span>
      </div>

      {/* Main Inline Flowing Notation View (Image 2 Lichess Style) */}
      <div className="flex-1 overflow-y-auto p-3 text-xs leading-relaxed scrollbar-thin scrollbar-thumb-neutral-700">
        {moveHistory.length === 0 && !comments ? (
          <div className="py-12 text-center text-xs text-neutral-500 font-mono">
            No moves recorded for this PGN position.
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-1 font-mono text-xs">
            {moveHistory.map((item, idx) => {
              const stepIdx = idx + 1;
              const isActive = currentMoveIdx === stepIdx;
              const moveNum = item.moveNumber || Math.floor(idx / 2) + 1;
              const showNum = idx % 2 === 0 || item.isWhite;

              return (
                <React.Fragment key={idx}>
                  {/* Move Number Prefix */}
                  {showNum && (
                    <span className="text-neutral-500 font-bold ml-1 text-[11px]">
                      {moveNum}.
                    </span>
                  )}

                  {/* Inline Move Button */}
                  <button
                    onClick={() => onSelectMove(stepIdx)}
                    className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer inline-flex items-center gap-0.5 ${
                      isActive
                        ? 'bg-blue-600 text-white font-black shadow-xs ring-1 ring-blue-400'
                        : 'bg-[#252830] text-neutral-200 hover:bg-[#323642] hover:text-white'
                    }`}
                  >
                    <span>{formatSanWithFigurine(item.san)}</span>
                    {item.san.includes('!') && <span className="text-emerald-400 text-[10px]">!</span>}
                    {item.san.includes('?') && <span className="text-amber-400 text-[10px]">?</span>}
                  </button>

                  {/* Mixed Inline Comment attached right next to move (Image 2 style) */}
                  {item.comment && (
                    <span className="text-neutral-400 font-sans italic px-1 py-0.5 bg-[#202228] border border-neutral-700/50 rounded text-[11px] mx-0.5">
                      {item.comment}
                    </span>
                  )}

                  {/* Sub-variation branch inline if present */}
                  {item.variation && (
                    <div className="w-full my-1.5 pl-3 border-l-2 border-neutral-600 text-[11px] text-neutral-300 font-mono italic bg-[#1c1e24] p-1.5 rounded">
                      <span className="text-neutral-500 font-bold mr-1">Var:</span>
                      {formatSanWithFigurine(item.variation)}
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Global Chapter Commentary rendered directly inline inside move stream (no separate card) */}
            {comments && (
              <span className="text-neutral-400 font-sans italic text-xs ml-2 leading-relaxed">
                {comments}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
