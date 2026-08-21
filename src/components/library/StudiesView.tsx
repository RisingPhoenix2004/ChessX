import React, { useState, useRef } from 'react';
import { Collection, Puzzle } from '../../types/chess';
import { parsePGNToPuzzles } from '../../services/pgnParser';
import {
  BookOpen,
  Upload,
  Trash2,
  Download,
  Zap,
  Search,
  Plus,
  Play,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Camera,
  Layers,
  Edit2,
  X,
  FileText
} from 'lucide-react';

interface StudiesViewProps {
  collections: Collection[];
  puzzles: Puzzle[];
  onStartCollectionSession: (collectionId: string) => void;
  onOpenStudyDetails: (studyId: string) => void;
  onOpenPgnViewer?: (collection: Collection) => void;
  onSaveCollection: (collection: Collection) => void;
  onDeleteCollection: (collectionId: string) => void;
  onImportPuzzles: (newPuzzles: Puzzle[], newCollection: Collection) => void;
}

export const StudiesView: React.FC<StudiesViewProps> = ({
  collections,
  puzzles,
  onStartCollectionSession,
  onOpenStudyDetails,
  onOpenPgnViewer,
  onSaveCollection,
  onDeleteCollection,
  onImportPuzzles,
}) => {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterShow, setFilterShow] = useState<'Active' | 'All' | 'Completed'>('Active');
  const [sortBy, setSortBy] = useState<'reviews' | 'name' | 'progress' | 'recent'>('reviews');

  // Custom Cover Image Upload State
  const [editingCoverStudyId, setEditingCoverStudyId] = useState<string | null>(null);
  const [coverImageUrlInput, setCoverImageUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload PGN Modal States
  const [pgnText, setPgnText] = useState<string>('');
  const [collectionName, setCollectionName] = useState<string>('');
  const [category, setCategory] = useState<string>('Tactics');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [collectionDesc, setCollectionDesc] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Three dots menu open state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const categories = ['Calculation', 'Endgames', 'Tactics', 'Strategy', 'Positional', 'Opening', 'Combinations'];

  // Default rich fallback cover images
  const DEFAULT_COVERS = [
    'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=300&auto=format&fit=crop&q=80',
  ];

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsProcessing(true);
    setProcessingStatus(`Reading ${file.name}...`);
    setProcessingProgress(10);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setPgnText(content);
        if (!collectionName) {
          setCollectionName(file.name.replace(/\.pgn$/i, ''));
        }
        setProcessingProgress(100);
        setProcessingStatus('File loaded ready to import.');
      }
      setIsProcessing(false);
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read file.');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!pgnText.trim()) return;

    setIsProcessing(true);
    setProcessingStatus('Parsing PGN games & positions...');
    setProcessingProgress(20);
    setErrorMessage('');

    setTimeout(() => {
      try {
        setProcessingProgress(50);
        const newColId = `study_pgn_${Date.now()}`;
        const newPuzzles = parsePGNToPuzzles(pgnText, newColId);

        if (newPuzzles.length === 0) {
          setErrorMessage('No valid chess positions or puzzles could be extracted from this PGN.');
          setIsProcessing(false);
          return;
        }

        setProcessingProgress(80);
        setProcessingStatus(`Extracted ${newPuzzles.length} positions. Saving study...`);

        const colCat = category === 'Custom' ? customCategory.trim() || 'Custom' : category;

        const updatedPuzzles = newPuzzles.map((p) => ({
          ...p,
          userCategory: colCat,
        }));

        const newCol: Collection = {
          id: newColId,
          name: collectionName.trim() || 'Uploaded Chess Study',
          category: colCat,
          description: collectionDesc.trim() || `${updatedPuzzles.length} positions extracted from PGN.`,
          icon: 'BookOpen',
          color: 'from-[#171717] to-[#262626]',
          coverImage: coverUrl.trim() || DEFAULT_COVERS[collections.length % DEFAULT_COVERS.length],
          puzzleIds: updatedPuzzles.map((p) => p.id),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isCompleted: false,
        };

        onImportPuzzles(updatedPuzzles, newCol);
        setProcessingProgress(100);

        setTimeout(() => {
          setIsProcessing(false);
          setShowUploadModal(false);
          setPgnText('');
          setCollectionName('');
          setCategory('Tactics');
          setCollectionDesc('');
          setCoverUrl('');
        }, 300);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Error parsing PGN file.');
        setIsProcessing(false);
      }
    }, 100);
  };

  // Handle Cover Photo Upload for existing study
  const handleSaveCoverImage = (studyId: string, newCoverUrl: string) => {
    const target = collections.find((c) => c.id === studyId);
    if (target) {
      const updated: Collection = {
        ...target,
        coverImage: newCoverUrl,
      };
      onSaveCollection(updated);
    }
    setEditingCoverStudyId(null);
    setCoverImageUrlInput('');
  };

  const handleCustomImageFile = (e: React.ChangeEvent<HTMLInputElement>, studyId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleSaveCoverImage(studyId, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filter & Sort Studies
  const processedCollections = collections
    .filter((col) => {
      const colPuzzles = puzzles.filter((p) => (col.puzzleIds || []).includes(p.id));
      const totalCol = colPuzzles.length || 1;
      const solvedCol = colPuzzles.filter((p) => p.solvedCount > 0).length;
      const isCompleted = solvedCol >= totalCol && totalCol > 0;

      if (filterShow === 'Active' && isCompleted) return false;
      if (filterShow === 'Completed' && !isCompleted) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return col.name.toLowerCase().includes(q) || col.category.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const aPuzzles = puzzles.filter((p) => (a.puzzleIds || []).includes(p.id));
      const bPuzzles = puzzles.filter((p) => (b.puzzleIds || []).includes(p.id));
      const aDue = aPuzzles.filter((p) => p.hasFailed || p.solvedCount === 0).length;
      const bDue = bPuzzles.filter((p) => p.hasFailed || p.solvedCount === 0).length;

      if (sortBy === 'reviews') return bDue - aDue;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'progress') {
        const aPct = aPuzzles.length ? aPuzzles.filter((p) => p.solvedCount > 0).length / aPuzzles.length : 0;
        const bPct = bPuzzles.length ? bPuzzles.filter((p) => p.solvedCount > 0).length / bPuzzles.length : 0;
        return bPct - aPct;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 font-sans">
      {/* Top Header Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Studies & Repertoires
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Structured chess courses, tactical repertoires, and custom PGN collections.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Import PGN Study</span>
        </button>
      </div>

      {/* Chessable-Inspired Centric Filter Bar (Image 3) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#0c1017] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Left Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
          {/* Show Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Show</span>
            <select
              value={filterShow}
              onChange={(e) => setFilterShow(e.target.value as any)}
              className="bg-slate-50 dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700/70 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="All">All</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700/70 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="reviews">Reviews / Due</option>
              <option value="recent">Recently Added</option>
              <option value="name">Course Name</option>
              <option value="progress">Mastery Progress</option>
            </select>
          </div>
        </div>

        {/* Right Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find courses..."
            className="w-full bg-slate-50 dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700/70 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Studies List (Chessable Design Card Rows - Image 3) */}
      <div className="space-y-4">
        {processedCollections.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#141c2c] flex items-center justify-center mx-auto text-slate-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">No Studies Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Import PGN files or games to create custom structured calculation courses.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Import PGN Study</span>
            </button>
          </div>
        ) : (
          processedCollections.map((col, index) => {
            const colPuzzles = puzzles.filter((p) => (col.puzzleIds || []).includes(p.id));
            const totalVariations = colPuzzles.length || 1;
            const solvedVariations = colPuzzles.filter((p) => p.solvedCount > 0).length;
            const dueReviews = colPuzzles.filter((p) => p.hasFailed || p.solvedCount === 0).length;
            const progressPercent = Math.min(100, Math.round((solvedVariations / totalVariations) * 100));

            const coverSrc = col.coverImage || DEFAULT_COVERS[index % DEFAULT_COVERS.length];

            return (
              <div
                key={col.id}
                className="bg-white dark:bg-[#0f1523] rounded-3xl border border-slate-200 dark:border-slate-800/90 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all relative group"
              >
                {/* Left: Square Cover Image & Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Course Cover Image with Upload Trigger */}
                  <div
                    onClick={() => setEditingCoverStudyId(col.id)}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-900 group/img cursor-pointer shadow-sm"
                    title="Click to change course cover image"
                  >
                    <img
                      src={coverSrc}
                      alt={col.name}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Course Text Details & Progress */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        onClick={() => onOpenStudyDetails(col.id)}
                        className="font-black text-base sm:text-lg text-slate-900 dark:text-white truncate cursor-pointer hover:text-emerald-500 transition-colors"
                      >
                        {col.name}
                      </h3>
                    </div>

                    <div className="space-y-1.5 max-w-sm">
                      <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <span>
                          {solvedVariations} / {totalVariations} variations
                        </span>
                        {progressPercent === 100 && (
                          <span className="text-[10px] uppercase font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            Mastered
                          </span>
                        )}
                      </div>

                      {/* Clean Blue Progress Bar (Image 3 style) */}
                      <div className="w-full h-2 bg-slate-100 dark:bg-[#182236] rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-800">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions (View, Solve with badge, Three dots menu - Image 3) */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                  {/* VIEW Button (Opens PGN Viewer / Analysis) */}
                  <button
                    onClick={() => onOpenStudyDetails(col.id)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  {/* SOLVE Button with Review count badge */}
                  <div className="relative">
                    <button
                      onClick={() => onStartCollectionSession(col.id)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>Solve</span>
                    </button>

                    {dueReviews > 0 && (
                      <span className="absolute -top-2 -right-1.5 px-1.5 py-0.5 bg-emerald-500 text-white font-mono font-black text-[10px] rounded-full border-2 border-white dark:border-[#0f1523] shadow-md animate-pulse">
                        {dueReviews}
                      </span>
                    )}
                  </div>

                  {/* Options Menu Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === col.id ? null : col.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#172134] transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === col.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 py-2 divide-y divide-slate-100 dark:divide-slate-800/80 animate-in fade-in duration-100">
                        <div className="py-1 px-1">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setEditingCoverStudyId(col.id);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Change Cover Image</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onOpenStudyDetails(col.id);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Open Chapters Analysis</span>
                          </button>
                        </div>

                        <div className="py-1 px-1">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDeleteCollection(col.id);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Study</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Change Cover Image Modal */}
      {editingCoverStudyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>Upload Custom Course Cover</span>
              </h3>
              <button
                onClick={() => setEditingCoverStudyId(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                  Upload Image File from Computer
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCustomImageFile(e, editingCoverStudyId)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
              </div>

              <div className="text-center text-xs text-slate-400 font-bold">OR</div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                  Image Web URL
                </label>
                <input
                  type="url"
                  value={coverImageUrlInput}
                  onChange={(e) => setCoverImageUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingCoverStudyId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveCoverImage(editingCoverStudyId, coverImageUrlInput.trim())}
                disabled={!coverImageUrlInput.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-40 cursor-pointer shadow-md"
              >
                Save Cover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import PGN Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" />
                <span>Import PGN Study</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Study Name
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g. Master Tactical Combinations"
                  className="w-full bg-slate-50 dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Cover Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  PGN File or Raw Text
                </label>
                <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2 bg-slate-50 dark:bg-[#131b2b]">
                  <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                  <input
                    type="file"
                    accept=".pgn,.txt"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer"
                  />
                </div>

                <textarea
                  rows={4}
                  value={pgnText}
                  onChange={(e) => setPgnText(e.target.value)}
                  placeholder="Or paste PGN notation directly here..."
                  className="w-full mt-2 bg-slate-50 dark:bg-[#131b2b] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-bold">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={isProcessing || !pgnText.trim()}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black disabled:opacity-40 cursor-pointer shadow-md flex items-center gap-2"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isProcessing ? 'Importing...' : 'Create Study'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
