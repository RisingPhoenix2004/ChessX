import React, { useState, useEffect } from 'react';
import { VideoLibraryItem, VideoCategory } from '../../types/chess';
import { getVideos, addVideo, deleteVideo } from '../../services/videoApi';
import {
  Plus,
  Play,
  Trash2,
  X,
  Search,
  Loader2,
  ExternalLink,
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
      {/* Header Section (Image 2 Redesign) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
            Video Library
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Curate and train with essential chess lessons, masterclasses, and tactical ideas.
          </p>
        </div>

        {/* Button: + Add Video (Fixing Image 2) */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? 'Close' : 'Add Video'}</span>
        </button>
      </div>

      {/* Add Video Dropdown Form Modal */}
      {showAddForm && (
        <form
          onSubmit={handleAddVideo}
          className="bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-xs space-y-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Add YouTube Lesson</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase">
                YouTube URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase">
                Title <span className="text-neutral-400 font-normal">(Leave empty to auto-retrieve)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Auto-detected from YouTube if left empty"
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key ideas, timestamps..."
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {formError && (
            <div className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !youtubeUrl.trim()}
              className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs shadow-xs disabled:opacity-40 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Video</span>
            </button>
          </div>
        </form>
      )}

      {/* Category Pills & Search Toolbar (Image 2) */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Videos
          </button>

          {DEFAULT_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                selectedCategory === c
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Add or search videos by title..."
              className="w-full bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 w-full sm:w-auto justify-end">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer"
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
        <div className="py-16 text-center text-neutral-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading video library...</span>
        </div>
      ) : videos.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#111520] rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            No videos found in this category. Add your favorite YouTube chess masterclasses to build your library.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs shadow-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Video</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((vid) => {
            const thumbnailUrl = vid.youtubeVideoId
              ? `https://img.youtube.com/vi/${vid.youtubeVideoId}/hqdefault.jpg`
              : 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&auto=format&fit=crop&q=80';

            return (
              <div
                key={vid.id}
                className="bg-white dark:bg-[#111520] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between group"
              >
                {/* Thumbnail with Play Overlay */}
                <div
                  onClick={() => setActiveVideo(vid)}
                  className="relative aspect-video bg-neutral-950 overflow-hidden cursor-pointer group/thumb"
                >
                  <img
                    src={thumbnailUrl}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/thumb:bg-black/40 transition-colors">
                    <div className="w-11 h-11 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Category Badge */}
                  {vid.category && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                      {vid.category}
                    </span>
                  )}
                </div>

                {/* Video Info & Delete Button */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3
                      onClick={() => setActiveVideo(vid)}
                      className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white line-clamp-2 cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    >
                      {vid.title}
                    </h3>
                    {vid.notes && (
                      <p className="text-[11px] text-neutral-500 line-clamp-1">{vid.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
                    <span>{formatDate(vid.createdAt)}</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveVideo(vid)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                        title="Watch Video"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        onClick={() => handleDeleteVideo(vid.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded YouTube Playback Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate max-w-lg">
                {activeVideo.title}
              </h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Iframe */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeVideoId}?autoplay=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
              <span>Category: <strong className="text-neutral-900 dark:text-white">{activeVideo.category || 'General'}</strong></span>
              <a
                href={activeVideo.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:underline"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
