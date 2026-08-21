import { CommunityUser, PublicProfile, LeaderboardItem, LeaderboardPeriod, LeaderboardFilter } from '../types/chess';
import { getAuthToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || '';

function getHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}`, 'x-auth-token': token } : {}),
  };
}

export async function searchUsers(query: string): Promise<CommunityUser[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${API_BASE}/api/community/search?q=${encodeURIComponent(query.trim())}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.users) ? data.users : [];
  } catch (error) {
    console.warn('Failed to search users:', error);
    return [];
  }
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  if (!username.trim()) return null;
  try {
    const res = await fetch(`${API_BASE}/api/community/profile/${encodeURIComponent(username.trim())}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (error) {
    console.warn('Failed to load public profile:', error);
    return null;
  }
}

export async function followUser(userId: string): Promise<{ isFollowing: boolean; followersCount?: number }> {
  try {
    const res = await fetch(`${API_BASE}/api/community/follow/${userId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to follow user');
    return await res.json();
  } catch (error) {
    console.warn('Failed to follow user:', error);
    return { isFollowing: false };
  }
}

export async function unfollowUser(userId: string): Promise<{ isFollowing: boolean; followersCount?: number }> {
  try {
    const res = await fetch(`${API_BASE}/api/community/follow/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to unfollow user');
    return await res.json();
  } catch (error) {
    console.warn('Failed to unfollow user:', error);
    return { isFollowing: true };
  }
}

export async function getLeaderboard(
  period: LeaderboardPeriod = 'weekly',
  filter: LeaderboardFilter = 'global'
): Promise<{ leaderboard: LeaderboardItem[]; currentUserRank: LeaderboardItem | null }> {
  try {
    const res = await fetch(`${API_BASE}/api/community/leaderboard?period=${period}&filter=${filter}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return { leaderboard: [], currentUserRank: null };
    const data = await res.json();
    return {
      leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [],
      currentUserRank: data.currentUserRank || null,
    };
  } catch (error) {
    console.warn('Failed to load leaderboard:', error);
    return { leaderboard: [], currentUserRank: null };
  }
}

export async function getSuggestedLearners(): Promise<CommunityUser[]> {
  try {
    const res = await fetch(`${API_BASE}/api/community/discover`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.users) ? data.users : [];
  } catch (error) {
    console.warn('Failed to load suggested learners:', error);
    return [];
  }
}
