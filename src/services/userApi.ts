import { UserProfile, UserStats, Puzzle } from '../types/chess';
import { Settings } from './storage';
import { getAuthToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message) errorMsg = parsed.message;
    } catch {
      if (errorText) errorMsg = errorText;
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export async function updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const res = await requestJson<{ user: UserProfile }>('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
  return res.user;
}

export async function uploadAvatar(imageDataUrl: string): Promise<{ avatar: string }> {
  return requestJson<{ avatar: string }>('/api/user/avatar', {
    method: 'POST',
    body: JSON.stringify({ avatarData: imageDataUrl }),
  });
}

export async function getUserPreferences(): Promise<Settings> {
  const res = await requestJson<{ preferences: Settings }>('/api/user/preferences');
  return res.preferences;
}

export async function saveUserPreferences(preferences: Settings): Promise<void> {
  await requestJson<{ ok: boolean }>('/api/user/preferences', {
    method: 'PUT',
    body: JSON.stringify({ preferences }),
  });
}

export async function recordPuzzleAttempt(
  puzzleId: string,
  payload: {
    solved: boolean;
    solveTimeMs: number;
    mistakes: number;
    xpEarned: number;
    coinsEarned: number;
    collectionId?: string;
  }
): Promise<{ puzzle: Puzzle; userStats: UserStats }> {
  return requestJson<{ puzzle: Puzzle; userStats: UserStats }>(`/api/puzzles/${puzzleId}/attempt`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getUserStats(): Promise<UserStats> {
  const res = await requestJson<{ userStats: UserStats }>('/api/user/stats');
  return res.userStats;
}
