import React, { useState } from 'react';
import { Collection, Puzzle } from '../../types/chess';
import { parsePGNToPuzzles } from '../../services/pgnParser';
import {
  BookOpen,
  Upload,
  Trash2,
  Download,
  Zap,
  FileText,
  X,
  Search,
  Tag
} from 'lucide-react';

interface LibraryViewProps {
  collections: Collection[];
  puzzles: Puzzle[];
  onStartCollectionSession: (collectionId: string) => void;
  onSaveCollection: (collection: Collection) => void;
  onDeleteCollection: (collectionId: string) => void;
  onImportPuzzles: (newPuzzles: Puzzle[], newCollection: Collection) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  collections,
  puzzles,
  onStartCollectionSession,
  onSaveCollection,
  onDeleteCollection,
  onImportPuzzles,
}) => {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [pgnText, setPgnText] = useState<string>('');
  const [collectionName, setCollectionName] = useState<string>('');
  const [category, setCategory] = useState<string>('Tactics');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [collectionDesc, setCollectionDesc] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const categories = ['All', 'Calculation', 'Endgames', 'Tactics', 'Strategy', 'Positional', 'Opening'];

  const filteredCollections = collections.filter((col) => {
    const matchesSearch =
      col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || col.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

    const colCat = category === 'Custom' ? customCategory.trim() || 'Custom' : category;

    const updatedPuzzles = newPuzzles.map((p) => ({
      ...p,
      userCategory: colCat,
    }));

    const newCol: Collection = {
      id: newColId,
      name: collectionName || 'Uploaded PGN Collection',
      category: colCat,
      description: collectionDesc || `${updatedPuzzles.length} tactical positions extracted from PGN file.`,
      icon: '📂',
      color: 'from-[#171717] to-[#262626]',
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-white" />
            <span>Training Library</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Personal chess training library, PGN sets, and courses.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-sm shadow-xl transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload PGN Collection</span>
        </button>
      </div>

      {/* Filter & Search Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0f0f0f] p-4 rounded-2xl border border-neutral-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections..."
            className="w-full bg-[#171717] border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-black font-extrabold'
                  : 'bg-[#171717] text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Collections Grid */}
      {filteredCollections.length === 0 ? (
        <div className="bg-[#0f0f0f] border border-neutral-800 rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto shadow-xl">
          <Upload className="w-10 h-10 text-neutral-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white">No PGN Collections Found</h3>
            <p className="text-xs text-neutral-400">
              Upload PGN course files or tactical studies to populate your training library.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload PGN File</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((col) => {
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
                className="bg-[#0f0f0f] border border-neutral-800 rounded-3xl p-6 space-y-5 hover:border-neutral-700 transition-all flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#171717] border border-neutral-800 flex items-center justify-center text-2xl">
                      {col.icon}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleExportPGN(col)}
                        title="Export PGN"
                        className="p-2 rounded-xl bg-[#171717] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCollection(col.id)}
                        title="Delete Collection"
                        className="p-2 rounded-xl bg-[#171717] hover:bg-rose-950 text-neutral-400 hover:text-rose-400 border border-neutral-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#171717] border border-neutral-800 text-neutral-300 text-[10px] font-semibold mb-2">
                      <Tag className="w-3 h-3" />
                      <span>{col.category}</span>
                    </div>

                    <h3 className="text-lg font-extrabold text-white group-hover:text-neutral-200 transition-colors">
                      {col.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{col.description}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-neutral-400">Completion</span>
                      <span className="text-white">{completionRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#171717] rounded-full overflow-hidden border border-neutral-800">
                      <div
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                  <div className="flex justify-between text-[11px] text-neutral-400 font-semibold">
                    <span>{colPuzzles.length} Total Puzzles</span>
                    <span>{solvedPuzzles.length} Solved</span>
                  </div>

                  <button
                    onClick={() => onStartCollectionSession(col.id)}
                    className="w-full py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
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
          <div className="bg-[#0f0f0f] border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#171717] text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-white" />
                <span>Upload PGN Collection</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Import raw PGN tactical studies into your library.
              </p>
            </div>

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
                isDragOver ? 'border-white bg-neutral-900' : 'border-neutral-800 hover:border-neutral-600 bg-[#171717]'
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
                <FileText className="w-8 h-8 text-neutral-400 mx-auto" />
                <p className="font-bold text-xs text-neutral-200">
                  Click to select or drag & drop a .PGN file
                </p>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g. Tactical Calculation Studies"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#171717] border border-neutral-800 text-white text-xs focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#171717] border border-neutral-800 text-white text-xs focus:outline-none focus:border-neutral-500"
                >
                  {categories.filter((c) => c !== 'All').concat(['Custom']).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  PGN Text Content
                </label>
                <textarea
                  rows={4}
                  value={pgnText}
                  onChange={(e) => setPgnText(e.target.value)}
                  placeholder="Paste raw PGN text here..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#171717] border border-neutral-800 text-white text-xs font-mono focus:outline-none focus:border-neutral-500"
                />
              </div>
            </div>

            <button
              onClick={handleImportSubmit}
              disabled={!pgnText.trim()}
              className="w-full py-3 rounded-2xl bg-white text-black font-extrabold text-xs shadow-lg transition-all disabled:opacity-40 cursor-pointer"
            >
              IMPORT PGN COLLECTION
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
