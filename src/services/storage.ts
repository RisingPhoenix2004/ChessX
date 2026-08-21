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

export const storage = {
  // --- User Profile ---
  getUserProfile(): UserProfile {
    const raw = localStorage.getItem(KEYS.USER_PROFILE);
    if (!raw) {
      this.saveUserProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    return JSON.parse(raw);
  },

  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  // --- User Stats ---
  getUserStats(): UserStats {
    const raw = localStorage.getItem(KEYS.USER_STATS);
    if (!raw) {
      this.saveUserStats(DEFAULT_USER_STATS);
      return DEFAULT_USER_STATS;
    }
    const stats: UserStats = JSON.parse(raw);
    if (!stats.dailyGoal) stats.dailyGoal = 10;
    stats.level = Math.max(1, stats.completedCollectionsCount || 0);
    return stats;
  },

  saveUserStats(stats: UserStats): void {
    stats.level = Math.max(1, stats.completedCollectionsCount || 0);
    localStorage.setItem(KEYS.USER_STATS, JSON.stringify(stats));
  },

  // --- Collections (Start empty - user uploads custom PGNs) ---
  getCollections(): Collection[] {
    const raw = localStorage.getItem(KEYS.COLLECTIONS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  },

  saveCollections(collections: Collection[]): void {
    localStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(collections));
  },

  // --- Puzzles ---
  getPuzzles(): Puzzle[] {
    const raw = localStorage.getItem(KEYS.PUZZLES);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  },

  savePuzzles(puzzles: Puzzle[]): void {
    localStorage.setItem(KEYS.PUZZLES, JSON.stringify(puzzles));
  },

  // --- Video Library ---
  getVideos(): VideoLibraryItem[] {
    const raw = localStorage.getItem(KEYS.VIDEOS);
    return raw ? JSON.parse(raw) : [];
  },

  saveVideos(videos: VideoLibraryItem[]): void {
    localStorage.setItem(KEYS.VIDEOS, JSON.stringify(videos));
  },

  // --- Sessions ---
  getSessions(): SessionStats[] {
    const raw = localStorage.getItem(KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  },

  saveSession(session: SessionStats): void {
    const sessions = this.getSessions();
    sessions.unshift(session);
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },

  // --- Achievements ---
  getAchievements(): Achievement[] {
    const raw = localStorage.getItem(KEYS.ACHIEVEMENTS);
    if (!raw) {
      localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(INITIAL_ACHIEVEMENTS));
      return INITIAL_ACHIEVEMENTS;
    }
    return JSON.parse(raw);
  },

  saveAchievements(achievements: Achievement[]): void {
    localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  },

  // --- Settings ---
  getSettings(): Settings {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  },

  saveSettings(settings: Settings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },
};
