import React from 'react';

interface LichessPromotionOverlayProps {
  targetSquare?: string;
  orientation?: 'white' | 'black';
  color?: 'w' | 'b';
  onSelectPiece: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel?: () => void;
}

const PIECE_SYMBOLS: Record<string, Record<string, string>> = {
  w: {
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
  },
  b: {
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
  },
};

export const LichessPromotionOverlay: React.FC<LichessPromotionOverlayProps> = ({
  color = 'w',
  onSelectPiece,
  onCancel,
}) => {
  const pieces: ('q' | 'r' | 'b' | 'n')[] = ['q', 'r', 'b', 'n'];
  const symbols = PIECE_SYMBOLS[color] || PIECE_SYMBOLS.w;

  return (
    <div className="absolute inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      {/* Clickable Backdrop */}
      <div className="absolute inset-0" onClick={onCancel} />

      {/* Single Horizontal Row aligned inside the board */}
      <div className="relative z-50 bg-[#1a1c23] border border-neutral-600 p-3 rounded-2xl shadow-2xl space-y-2 max-w-sm w-full text-center">
        <span className="text-[11px] font-extrabold text-neutral-300 uppercase tracking-wider block">
          Select Promotion Piece
        </span>

        {/* 4 Pieces Aligned in 1 Horizontal Row */}
        <div className="grid grid-cols-4 gap-2">
          {pieces.map((piece) => (
            <button
              key={piece}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece(piece);
              }}
              className="h-14 rounded-xl bg-[#282a36] hover:bg-[#2563eb] border border-neutral-600 text-white font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer flex flex-col items-center justify-center shadow-lg group"
              title={`Promote to ${piece.toUpperCase()}`}
            >
              <span className="text-2xl drop-shadow select-none group-hover:scale-110 transition-transform">
                {symbols[piece]}
              </span>
              <span className="text-[9px] font-mono uppercase text-neutral-400 group-hover:text-white mt-0.5">
                {piece}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
