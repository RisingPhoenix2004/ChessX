import React, { useState, useRef, useMemo } from 'react';
import { Collection, Puzzle } from '../../types/chess';
import { parsePGNToPuzzles } from '../../services/pgnParser';
import {
  Search,
  Plus,
  Play,
  Eye,
  Trash2,
  FileText,
  X,
  Camera,
  Loader2,
  MoreVertical,
  BookOpen,
  Upload,
  ImageIcon,
} from 'lucide-react';

interface StudiesViewProps {
  collections: Collection[];
  puzzles: Puzzle[];
  onStartCollectionSession: (collectionId: string) => void;
  onOpenStudyDetails: (studyId: string) => void;
  onOpenPgnViewer: (collection: Collection) => void;
  onSaveCollection: (collection: Collection) => void;
  onDeleteCollection: (collectionId: string) => void;
  onImportPuzzles: (puzzles: Puzzle[], newCollection: Collection) => void;
}

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=600&auto=format&fit=crop&q=80',
];

export const StudiesView: React.FC<StudiesViewProps> = ({
  collections,
  puzzles,
  onStartCollectionSession,
  onOpenStudyDetails,
  onSaveCollection,
  onDeleteCollection,
  onImportPuzzles,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterShow, setFilterShow] = useState<'All' | 'Active' | 'Completed'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'progress'>('recent');

  // Upload PGN Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [pgnText, setPgnText] = useState<string>('');
  const [collectionName, setCollectionName] = useState<string>('');
  const [collectionDesc, setCollectionDesc] = useState<string>('');
  const [category, setCategory] = useState<string>('Opening Repertoire');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Edit Cover Modal State
  const [editingCoverStudyId, setEditingCoverStudyId] = useState<string | null>(null);
  const [coverImageUrlInput, setCoverImageUrlInput] = useState<string>('');

  // Dropdown action menus
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverDeviceInputRef = useRef<HTMLInputElement>(null);
  const importCoverDeviceInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Opening Repertoire',
    'Tactics & Combinations',
    'Endgame Technique',
    'Master Games',
    'Custom',
  ];

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPgnText(content);
      if (!collectionName) {
        const inferredName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setCollectionName(inferredName);
      }
    };
    reader.readAsText(file);
  };

  const handleCoverDeviceUpload = (files: FileList | null, isForImport = false) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (isForImport) {
        setCoverUrl(base64Data);
      } else {
        setCoverImageUrlInput(base64Data);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportSubmit = () => {
    if (!pgnText.trim()) {
      setErrorMessage('Please paste or upload a valid PGN string.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const newColId = `study_pgn_${Date.now()}`;
      const newPuzzles = parsePGNToPuzzles(pgnText, newColId);

      if (newPuzzles.length === 0) {
        setErrorMessage('No valid chess positions or puzzles could be extracted from this PGN.');
        setIsProcessing(false);
        return;
      }

      const colCat = category === 'Custom' ? customCategory.trim() || 'Custom' : category;

      const updatedPuzzles = newPuzzles.map((p) => ({
        ...p,
        collectionId: newColId,
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
      setShowUploadModal(false);
      setPgnText('');
      setCollectionName('');
      setCollectionDesc('');
      setCoverUrl('');
      setIsProcessing(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Import failed.');
      setIsProcessing(false);
    }
  };

  const handleCoverSave = (studyId: string) => {
    if (!coverImageUrlInput.trim()) {
      setEditingCoverStudyId(null);
      return;
    }
    const target = collections.find((c) => c.id === studyId);
    if (target) {
      onSaveCollection({ ...target, coverImage: coverImageUrlInput.trim() });
    }
    setEditingCoverStudyId(null);
    setCoverImageUrlInput('');
  };

  // Filtered & Sorted Collections
  const processedCollections = useMemo(() => {
    let result = [...collections];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (filterShow === 'Active') {
      result = result.filter((c) => !c.isCompleted);
    } else if (filterShow === 'Completed') {
      result = result.filter((c) => c.isCompleted);
    }

    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'progress') {
      result.sort((a, b) => {
        const getPct = (col: Collection) => {
          const colPuzzles = puzzles.filter(
            (p) => (col.puzzleIds || []).includes(p.id) || p.collectionId === col.id
          );
          if (colPuzzles.length === 0) return 0;
          return colPuzzles.filter((p) => p.solvedCount > 0).length / colPuzzles.length;
        };
        return getPct(b) - getPct(a);
      });
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [collections, puzzles, searchQuery, filterShow, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
      {/* Top Header: Studies Title & Import Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
            Studies
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Structured chess courses, tactical repertoires, and custom PGN collections.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Import PGN Study</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white dark:bg-[#111520] rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-300">
            <span className="text-neutral-400">Show</span>
            <select
              value={filterShow}
              onChange={(e) => setFilterShow(e.target.value as any)}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-bold px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-300">
            <span className="text-neutral-400">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-bold px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>

        {/* Right Search Input: Find Studies */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find Studies"
            className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {/* Studies List */}
      <div className="space-y-3">
        {processedCollections.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#111520] rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">No Studies Found</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Import PGN files or games to create custom structured calculation courses.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Import PGN Study</span>
            </button>
          </div>
        ) : (
          processedCollections.map((col, index) => {
            const colPuzzles = puzzles.filter(
              (p) => (col.puzzleIds || []).includes(p.id) || p.collectionId === col.id
            );
            const totalVariations = colPuzzles.length;
            const solvedVariations = colPuzzles.filter((p) => p.solvedCount > 0).length;
            const progressPercent =
              totalVariations > 0 ? Math.min(100, Math.round((solvedVariations / totalVariations) * 100)) : 0;

            const coverSrc = col.coverImage || DEFAULT_COVERS[index % DEFAULT_COVERS.length];

            return (
              <div
                key={col.id}
                className="bg-white dark:bg-[#111520] rounded-2xl border border-neutral-200 dark:border-neutral-800/90 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all relative group"
              >
                {/* Left: Square Cover Image & Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    onClick={() => {
                      setEditingCoverStudyId(col.id);
                      setCoverImageUrlInput(col.coverImage || '');
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden relative shrink-0 border border-neutral-200 dark:border-neutral-700 bg-neutral-900 group/img cursor-pointer shadow-xs"
                    title="Change study cover (Upload from device or URL)"
                  >
                    <img
                      src={coverSrc}
                      alt={col.name}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Course Details & Clean Progress Bar */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h3
                      onClick={() => onOpenStudyDetails(col.id)}
                      className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    >
                      {col.name}
                    </h3>

                    <div className="space-y-1.5 max-w-xs sm:max-w-sm">
                      <div className="text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <span>
                          {solvedVariations} / {totalVariations} {totalVariations === 1 ? 'variation' : 'variations'}
                        </span>
                        {progressPercent === 100 && (
                          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            Mastered
                          </span>
                        )}
                      </div>

                      {/* Clean Progress Bar */}
                      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions (View, Solve, More Options) */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
                  <button
                    onClick={() => onOpenStudyDetails(col.id)}
                    className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => onStartCollectionSession(col.id)}
                    className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Solve</span>
                  </button>

                  {/* Options Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === col.id ? null : col.id)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === col.id && (
                      <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-30 py-1 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onDeleteCollection(col.id);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Study</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cover Image Edit Modal (Device Upload + URL + Preview) */}
      {editingCoverStudyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Change Cover Image</h3>
              <button
                onClick={() => {
                  setEditingCoverStudyId(null);
                  setCoverImageUrlInput('');
                }}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Preview */}
            {coverImageUrlInput && (
              <div className="w-full h-32 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 relative bg-neutral-900">
                <img
                  src={coverImageUrlInput}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Device Upload Drag-and-Drop / Button */}
            <div
              onClick={() => coverDeviceInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-4 text-center hover:border-neutral-500 transition-colors cursor-pointer bg-neutral-50 dark:bg-neutral-800/40 space-y-1"
            >
              <input
                ref={coverDeviceInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleCoverDeviceUpload(e.target.files, false)}
                className="hidden"
              />
              <Upload className="w-5 h-5 text-neutral-500 mx-auto" />
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Upload image from your device
              </p>
              <p className="text-[10px] text-neutral-400">PNG, JPG, WEBP</p>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase">Or Enter Image URL</label>
              <input
                type="url"
                value={coverImageUrlInput}
                onChange={(e) => setCoverImageUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingCoverStudyId(null);
                  setCoverImageUrlInput('');
                }}
                className="px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCoverSave(editingCoverStudyId)}
                className="px-4 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs shadow-xs cursor-pointer"
              >
                Save Cover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload PGN Modal (with Device Cover Upload) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-neutral-900 dark:text-white" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">Import PGN Study</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PGN File Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-5 text-center hover:border-neutral-500 transition-colors cursor-pointer bg-neutral-50 dark:bg-neutral-800/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pgn,.txt"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Click to upload a .PGN file or drag here
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">Supports multi-game PGNs and Lichess studies</p>
            </div>

            {/* Study Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Study Title</label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g. Caro-Kann Classical Repertoire"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Cover Upload from Device */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                  Cover Image (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => importCoverDeviceInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload From Device</span>
                  </button>
                  <input
                    ref={importCoverDeviceInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverDeviceUpload(e.target.files, true)}
                    className="hidden"
                  />
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="Or paste image URL..."
                    className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
                {coverUrl && (
                  <div className="mt-2 w-20 h-16 rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700">
                    <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Raw PGN Text</label>
                <textarea
                  rows={4}
                  value={pgnText}
                  onChange={(e) => setPgnText(e.target.value)}
                  placeholder="Paste PGN here..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={isProcessing || !pgnText.trim()}
                className="px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs shadow-xs disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Import Study</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
