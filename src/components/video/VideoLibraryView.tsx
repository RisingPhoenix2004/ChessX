import React, { useState, useEffect } from 'react';
import { VideoLibraryItem, VideoCategory } from '../../types/chess';
import { getVideos, addVideo, deleteVideo } from '../../services/videoApi';
import {
  Video,
  Plus,
  Play,
  Trash2,
  X,
  AlertCircle,
  Clock,
  Tag,
  ExternalLink,
  Film,
  Search,
  Filter,
  Sparkles,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';

const DEFAULT_CATEGORIES: VideoCategory[] = [
  'Opening',
  'Endgame',
  'Calculation',
  'Middlegame',
  'Strategy',
  'Fun',
];

export const VideoLibraryView: React.FC = () => {
  const [videos, setVideos] = useState<VideoLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeVideo, setActiveVideo] = useState<VideoLibraryItem | null>(null);

  // Filter & Search & Sort State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'alphabetical'>('recent');

  // Add Video Form State
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('Opening');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const loadLibrary = async () => {
    try {
      setIsLoading(true);
      const data = await getVideos({
        category: selectedCategory,
        search: searchQuery,
        sort: sortBy,
      });
      setVideos(data);
    } catch (err) {
      console.warn('Failed to load video library', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, [selectedCategory, searchQuery, sortBy]);

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (!youtubeUrl.trim()) {
        throw new Error('Please enter a YouTube video URL.');
      }

      const newVideo = await addVideo({
        youtubeUrl: youtubeUrl.trim(),
        title: title.trim() || undefined,
        category: category.trim() || 'Opening',
        notes: notes.trim() || undefined,
      });

      setVideos((prev) => [newVideo, ...prev]);
      setYoutubeUrl('');
      setTitle('');
      setCategory('Opening');
      setNotes('');
      setShowAddForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add video.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      if (activeVideo?.id === id) {
        setActiveVideo(null);
      }
    } catch (err) {
      console.error('Failed to delete video', err);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Video className="w-8 h-8 text-emerald-500" />
            <span>Video Library</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Curate and train with essential chess lessons, masterclasses, and tactical ideas.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? 'Close Form' : 'Save YouTube Video'}</span>
        </button>
      </div>

      {/* Add Video Form Drawer */}
      {showAddForm && (
        <div className="bg-white dark:bg-[#0f1523] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Add New Video to Library</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Auto-fetches video title if omitted</span>
          </div>

          <form onSubmit={handleAddVideo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  YouTube URL *
                </label>
                <input
                  type="url"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-50 dark:bg-[#161f32] border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Title (Optional - Auto extracted from YouTube)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Leave blank to retrieve actual title automatically"
                  className="w-full bg-slate-50 dark:bg-[#161f32] border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#161f32] border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-8">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Personal Study Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key concepts, move variations, timestamps..."
                  className="w-full bg-slate-50 dark:bg-[#161f32] border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 rounded-2xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !youtubeUrl.trim()}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Extracting & Saving...' : 'Save Video'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter, Search & Sort Control Bar */}
      <div className="bg-white dark:bg-[#0f1523] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-[#161f32] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            All Videos
          </button>

          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#161f32] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos by title or notes..."
              className="w-full bg-slate-50 dark:bg-[#161f32] border border-slate-200 dark:border-slate-700/70 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 dark:bg-[#161f32] border border-slate-200 dark:border-slate-700/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="recent">Recently Added</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400 font-medium">Loading videos...</div>
      ) : videos.length === 0 ? (
        <div className="bg-white dark:bg-[#0f1523] p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-md">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Video className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No Videos Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Save your favorite chess training videos and masterclass tutorials to study distraction-free.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Video</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid) => {
            const thumbnailUrl = `https://img.youtube.com/vi/${vid.youtubeVideoId}/hqdefault.jpg`;

            return (
              <div
                key={vid.id}
                className="bg-white dark:bg-[#0f1523] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  {/* Video Thumbnail Preview */}
                  <div
                    onClick={() => setActiveVideo(vid)}
                    className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={thumbnailUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {vid.category && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white font-extrabold text-[10px] tracking-wider uppercase border border-white/20">
                        {vid.category}
                      </div>
                    )}
                  </div>

                  {/* Video Info Content */}
                  <div className="p-5 space-y-2">
                    <h3
                      onClick={() => setActiveVideo(vid)}
                      className="font-black text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug cursor-pointer hover:text-emerald-500 transition-colors"
                    >
                      {vid.title}
                    </h3>

                    {vid.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic bg-slate-50 dark:bg-[#141b2b] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        "{vid.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-5 pt-0 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px] font-mono">{formatDate(vid.createdAt)}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveVideo(vid)}
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold transition-colors cursor-pointer"
                      title="Play Video"
                    >
                      <Play className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-400" />
                    </button>

                    <button
                      onClick={() => handleDeleteVideo(vid.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Remove Video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-3xl w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white max-w-xl truncate">
                  {activeVideo.title}
                </h3>
                {activeVideo.category && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                    {activeVideo.category}
                  </span>
                )}
              </div>

              <button
                onClick={() => setActiveVideo(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Embedded YouTube Frame */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xl">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeVideoId}?autoplay=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {activeVideo.notes && (
              <div className="p-4 bg-slate-50 dark:bg-[#141b2b] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Study Notes</span>
                <p className="text-xs text-slate-700 dark:text-slate-300">{activeVideo.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
