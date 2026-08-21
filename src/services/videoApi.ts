import { VideoLibraryItem } from '../types/chess';
import { storage } from './storage';
import { getAuthToken } from './authApi';

const getAuthHeader = (): Record<string, string> => {
  const token = getAuthToken() || localStorage.getItem('tactix_jwt_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export async function getVideos(params?: {
  category?: string;
  search?: string;
  sort?: string;
}): Promise<VideoLibraryItem[]> {
  try {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);

    const url = `/api/videos${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to load videos: ${res.statusText}`);
    }

    const data = await res.json();
    if (Array.isArray(data.videos)) {
      if (!params?.category && !params?.search) {
        storage.saveVideos(data.videos);
      }
      return data.videos;
    }
  } catch (error) {
    console.warn('Video API unreachable, using local storage fallback.', error);
  }

  let local = storage.getVideos();
  if (params?.category && params.category !== 'All') {
    local = local.filter((v) => v.category?.toLowerCase() === params.category?.toLowerCase());
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    local = local.filter(
      (v) => v.title.toLowerCase().includes(q) || v.notes?.toLowerCase().includes(q)
    );
  }
  if (params?.sort === 'oldest') {
    local.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (params?.sort === 'alphabetical') {
    local.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return local;
}

export async function addVideo(payload: {
  youtubeUrl: string;
  title?: string;
  category?: string;
  notes?: string;
}): Promise<VideoLibraryItem> {
  try {
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to add video.');
    }

    const newVideo: VideoLibraryItem = data.video;
    const currentVideos = storage.getVideos();
    storage.saveVideos([newVideo, ...currentVideos]);
    return newVideo;
  } catch (error) {
    // Local fallback creation
    const extractId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    };

    const videoId = extractId(payload.youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL format.');
    }

    const fallbackVideo: VideoLibraryItem = {
      id: `local_vid_${Date.now()}`,
      userId: 'local_user',
      youtubeUrl: payload.youtubeUrl,
      youtubeVideoId: videoId,
      title: payload.title?.trim() || `Chess Video (${videoId})`,
      category: payload.category?.trim() || null,
      notes: payload.notes?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentVideos = storage.getVideos();
    storage.saveVideos([fallbackVideo, ...currentVideos]);
    return fallbackVideo;
  }
}

export async function deleteVideo(videoId: string): Promise<void> {
  try {
    const res = await fetch(`/api/videos/${videoId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete video.');
    }
  } catch (error) {
    console.warn('Backend delete video call failed, updating local state.', error);
  }

  const currentVideos = storage.getVideos();
  const updated = currentVideos.filter((v) => v.id !== videoId);
  storage.saveVideos(updated);
}
