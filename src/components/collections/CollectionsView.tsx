import React, { useState } from 'react';
import { Collection, Puzzle } from '../../types/chess';
import { parsePGNToPuzzles } from '../../services/pgnParser';
import {
  Layers,
  Upload,
  Trash2,
  Download,
  Zap,
  FileText,
  X,
  Sparkles,
  Tag
} from 'lucide-react';

interface CollectionsViewProps {
  collections: Collection[];
  puzzles: Puzzle[];
  onStartCollectionSession: (collectionId: string) => void;
  onSaveCollection: (collection: Collection) => void;
  onDeleteCollection: (collectionId: string) => void;
  onImportPuzzles: (newPuzzles: Puzzle[], newCollection: Collection) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  puzzles,
  onStartCollectionSession,
  onSaveCollection,
  onDeleteCollection,
  onImportPuzzles,
}) => {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [pgnText, setPgnText] = useState<string>('');
  const [collectionName, setCollectionName] = useState<string>('');
  const [category, setCategory] = useState<string>('Tactics');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [collectionDesc, setCollectionDesc] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const categories = ['Calculation', 'Endgames', 'Tactics', 'Strategy', 'Positional', 'Opening', 'Custom'];

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setPgnText(content);
        if (!collectionName) {
          setCollectionName(file.name.replace('.pgn', ''));
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = () => {
    if (!pgnText.trim()) return;

    const newColId = `col_custom_${Date.now()}`;
    const newPuzzles = parsePGNToPuzzles(pgnText, newColId);

    if (newPuzzles.length === 0) {
      alert('No valid tactical puzzles could be parsed from this PGN file.');
      return;
    }

    const selectedCategory = category === 'Custom' ? customCategory.trim() || 'Custom' : category;

    // Attach user selected category to all parsed puzzles
    const updatedPuzzles = newPuzzles.map((p) => ({
      ...p,
      userCategory: selectedCategory,
    }));

    const newCol: Collection = {
      id: newColId,
      name: collectionName || 'Uploaded PGN Collection',
      category: selectedCategory,
      description: collectionDesc || `${updatedPuzzles.length} ${selectedCategory.toLowerCase()} positions extracted from PGN file.`,
      icon: '📂',
      color: 'from-emerald-500 to-teal-700',
      puzzleIds: updatedPuzzles.map((p) => p.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false,
    };

    onImportPuzzles(updatedPuzzles, newCol);
    setShowUploadModal(false);
    setPgnText('');
    setCollectionName('');
    setCustomCategory('');
    setCollectionDesc('');
  };

  const handleExportPGN = (collection: Collection) => {
    const puzzleIds = collection.puzzleIds || [];
    const colPuzzles = (puzzles || []).filter((p) => puzzleIds.includes(p.id));
    let pgnOutput = '';

    colPuzzles.forEach((p) => {
      pgnOutput += `[Event "${p.description || collection.name}"]\n`;
      pgnOutput += `[Category "${collection.category}"]\n`;
      pgnOutput += `[FEN "${p.fen}"]\n`;
      pgnOutput += `[SetUp "1"]\n\n`;
      pgnOutput += `${p.solutionMoves.join(' ')}\n\n`;
    });

    const blob = new Blob([pgnOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collection.name.replace(/\s+/g, '_')}.pgn`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-emerald-400" />
            <span>My PGN Collections</span>
          </h1>
          <p className="text-sm text-slate-400">
            Upload your PGN files, specify tactical categories, and start training.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>Upload PGN Collection</span>
        </button>
      </div>

      {/* Collections Grid or Empty State */}
      {collections.length === 0 ? (
        <div className="bg-[#121824] border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Upload className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-white">No PGN Collections Uploaded</h3>
            <p className="text-xs text-slate-400">
              Upload your PGN course, book, or trainer files to generate your interactive training session.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>UPLOAD YOUR FIRST PGN</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(collections || []).map((col) => {
            const puzzleIds = col.puzzleIds || [];
            const colPuzzles = (puzzles || []).filter((p) => puzzleIds.includes(p.id));
            const solvedPuzzles = colPuzzles.filter((p) => p.solvedCount > 0);
            const completionRate =
              colPuzzles.length > 0
                ? Math.round((solvedPuzzles.length / colPuzzles.length) * 100)
                : 0;

            return (
              <div
                key={col.id}
                className="bg-[#121824] border border-border rounded-3xl p-6 space-y-5 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
                      {col.icon}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleExportPGN(col)}
                        title="Export PGN"
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-border"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteCollection(col.id)}
                        title="Delete Collection"
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-border"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold mb-2">
                      <Tag className="w-3 h-3" />
                      <span>{col.category}</span>
                    </div>

                    <h3 className="text-xl font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                      {col.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{col.description}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Completion</span>
                      <span className="text-emerald-400">{completionRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-border/50">
                  <div className="flex justify-between text-xs text-slate-400 font-semibold">
                    <span>{colPuzzles.length} Total Puzzles</span>
                    <span>{solvedPuzzles.length} Solved</span>
                  </div>

                  <button
                    onClick={() => onStartCollectionSession(col.id)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>TRAIN COLLECTION</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PGN Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121824] border border-border rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Upload className="w-6 h-6 text-emerald-400" />
                <span>Upload Custom PGN</span>
              </h2>
              <p className="text-xs text-slate-400">
                Specify your collection details and PGN code.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
              }`}
            >
              <input
                type="file"
                accept=".pgn"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="pgnFileInput"
              />
              <label htmlFor="pgnFileInput" className="cursor-pointer space-y-2 block">
                <FileText className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="font-bold text-sm text-slate-200">
                  Click to select or drag & drop a .PGN file
                </p>
              </label>
            </div>

            {/* Collection Metadata Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  1. Collection Name
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g. Woodpecker Tactics Part 1"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-border text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  2. Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-border text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  {categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {category === 'Custom' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category"
                    className="mt-2 w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-border text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  3. PGN Text Content
                </label>
                <textarea
                  rows={4}
                  value={pgnText}
                  onChange={(e) => setPgnText(e.target.value)}
                  placeholder="Paste raw PGN text here..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleImportSubmit}
              disabled={!pgnText.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-40"
            >
              IMPORT PGN COLLECTION
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
