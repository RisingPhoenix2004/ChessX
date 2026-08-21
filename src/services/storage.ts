import { Collection, Puzzle, UserStats, Achievement, SessionStats, UserProfile, VideoLibraryItem } from '../types/chess';
import { INITIAL_ACHIEVEMENTS } from './gamification';

const KEYS = {
  USER_PROFILE: 'tactix_user_profile',
  USER_STATS: 'tactix_user_stats',
  COLLECTIONS: 'tactix_collections',
  PUZZLES: 'tactix_puzzles',
  SESSIONS: 'tactix_sessions',
  ACHIEVEMENTS: 'tactix_achievements',
  SETTINGS: 'tactix_settings',
  VIDEOS: 'tactix_videos',
};

export interface Settings {
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  moveSound: boolean;
  captureSound: boolean;
  checkSound: boolean;
  errorSound: boolean;
  autoNext: boolean;
  autoNextDelaySec: number;
  boardTheme: 'dark' | 'emerald' | 'wood' | 'cyberpunk' | 'glass' | 'blue' | 'light' | 'sand' | 'tournament';
  pieceSet: 'standard' | 'neo' | 'vintage' | 'alpha' | 'modern';
  showCoordinates: boolean;
  coordinateStyle: 'inside' | 'outside' | 'none';
  highlightLastMove: boolean;
  showLegalMoves: boolean;
  showMoveHints: boolean;
  streakFreezeActive: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  soundEnabled: true,
  moveSound: true,
  captureSound: true,
  checkSound: true,
  errorSound: true,
  autoNext: false,
  autoNextDelaySec: 2,
  boardTheme: 'dark',
  pieceSet: 'standard',
  showCoordinates: true,
  coordinateStyle: 'inside',
  highlightLastMove: true,
  showLegalMoves: true,
  showMoveHints: true,
  streakFreezeActive: true,
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'guest_101',
  username: 'guest',
  name: 'Grandmaster Solver',
  email: 'tactix.player@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Tactix chess training enthusiast.',
  isLoggedIn: false,
};

const DEFAULT_USER_STATS: UserStats = {
  totalSolved: 0,
  totalAttempts: 0,
  accuracy: 100,
  currentStreak: 1,
  bestStreak: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  totalThinkingTimeMs: 0,
  dailyGoal: 10,
  xp: 0,
  level: 1,
  completedCollectionsCount: 0,
  levelTitle: 'Novice Solver',
  coins: 50,
  performanceRating: 2006,
  streakFreezeAvailable: 1,
  heatmapData: {
    [new Date().toISOString().split('T')[0]]: { solved: 0, failed: 0 },
  },
};

function getScopedKey(baseKey: string, userId?: string): string {
  if (userId && userId !== 'guest' && userId !== 'guest_101') {
    return `${baseKey}_${userId}`;
  }
  return baseKey;
}

export const storage = {
  // --- User Profile ---
  getUserProfile(): UserProfile {
    const raw = localStorage.getItem(KEYS.USER_PROFILE);
    if (!raw) {
      this.saveUserProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  // --- User Stats ---
  getUserStats(userId?: string): UserStats {
    const key = getScopedKey(KEYS.USER_STATS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { ...DEFAULT_USER_STATS };
    }
    try {
      const stats: UserStats = JSON.parse(raw);
      if (!stats.dailyGoal) stats.dailyGoal = 10;
      stats.level = Math.max(1, stats.completedCollectionsCount || 0);
      return stats;
    } catch {
      return { ...DEFAULT_USER_STATS };
    }
  },

  saveUserStats(stats: UserStats, userId?: string): void {
    const key = getScopedKey(KEYS.USER_STATS, userId);
    const copy = { ...stats };
    copy.level = Math.max(1, copy.completedCollectionsCount || 0);
    localStorage.setItem(key, JSON.stringify(copy));
  },

  // --- Collections (Start empty - user uploads custom PGNs) ---
  getCollections(userId?: string): Collection[] {
    const key = getScopedKey(KEYS.COLLECTIONS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCollections(collections: Collection[], userId?: string): void {
    const key = getScopedKey(KEYS.COLLECTIONS, userId);
    localStorage.setItem(key, JSON.stringify(collections));
  },

  // --- Puzzles ---
  getPuzzles(userId?: string): Puzzle[] {
    const key = getScopedKey(KEYS.PUZZLES, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  savePuzzles(puzzles: Puzzle[], userId?: string): void {
    const key = getScopedKey(KEYS.PUZZLES, userId);
    localStorage.setItem(key, JSON.stringify(puzzles));
  },

  // --- Video Library ---
  getVideos(userId?: string): VideoLibraryItem[] {
    const key = getScopedKey(KEYS.VIDEOS, userId);
    const raw = localStorage.getItem(key);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveVideos(videos: VideoLibraryItem[], userId?: string): void {
    const key = getScopedKey(KEYS.VIDEOS, userId);
    localStorage.setItem(key, JSON.stringify(videos));
  },

  // --- Sessions ---
  getSessions(userId?: string): SessionStats[] {
    const key = getScopedKey(KEYS.SESSIONS, userId);
    const raw = localStorage.getItem(key);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveSession(session: SessionStats, userId?: string): void {
    const key = getScopedKey(KEYS.SESSIONS, userId);
    const sessions = this.getSessions(userId);
    sessions.unshift(session);
    localStorage.setItem(key, JSON.stringify(sessions));
  },

  // --- Achievements ---
  getAchievements(userId?: string): Achievement[] {
    const key = getScopedKey(KEYS.ACHIEVEMENTS, userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(INITIAL_ACHIEVEMENTS));
      return INITIAL_ACHIEVEMENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ACHIEVEMENTS;
    }
  },

  saveAchievements(achievements: Achievement[], userId?: string): void {
    const key = getScopedKey(KEYS.ACHIEVEMENTS, userId);
    localStorage.setItem(key, JSON.stringify(achievements));
  },

  // --- Settings ---
  getSettings(): Settings {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    try {
      return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Settings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- Reset all cache to guest ---
  clearGuestCache(): void {
    localStorage.removeItem(KEYS.USER_STATS);
    localStorage.removeItem(KEYS.COLLECTIONS);
    localStorage.removeItem(KEYS.PUZZLES);
    localStorage.removeItem(KEYS.SESSIONS);
  },
};
