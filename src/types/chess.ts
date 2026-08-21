export type PuzzleTheme =
  | 'Pin'
  | 'Fork'
  | 'Skewer'
  | 'Double Attack'
  | 'Mate'
  | 'Smothered Mate'
  | 'Discovered Attack'
  | 'Clearance'
  | 'Decoy'
  | 'Deflection'
  | 'Zwischenzug'
  | 'Endgame'
  | 'Promotion'
  | 'Sacrifice'
  | 'Attraction'
  | 'Checkmate'
  | 'Middlegame'
  | 'Quiet move'
  | 'Trapped piece';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Master';

export type ThemeMode = 'dark' | 'light';

export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  friendsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isLoggedIn: boolean;
}

export interface MoveAnnotation {
  san: string;
  moveNumber?: number;
  isWhite?: boolean;
  comment?: string;
  from?: string;
  to?: string;
}

export interface Puzzle {
  id: string;
  collectionId: string;
  userCategory?: string;
  fen: string;
  sideToMove: 'w' | 'b';
  solutionMoves: string[]; // SAN notation
  solutionUCI?: string[];
  description?: string;
  event?: string;
  white?: string;
  black?: string;
  tags: PuzzleTheme[];
  difficulty: DifficultyLevel;
  rating: number;
  comments?: string;
  rawPgn?: string;
  movesData?: MoveAnnotation[];
  hasFailed?: boolean;

  attempts: number;
  solvedCount: number;
  failedCount: number;
  avgSolveTimeMs: number;
  personalBestMs: number | null;
  lastAttemptDate: string | null;
  srsDueDate: string | null;
  srsRepetitions: number;
  srsEaseFactor: number;
  srsIntervalDays: number;
  isFavorite?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  coverImage?: string;
  puzzleIds: string[];
  createdAt: string;
  updatedAt: string;
  isCompleted?: boolean;
}

export type Study = Collection;

export interface SessionStats {
  id: string;
  date: string;
  totalPuzzles: number;
  solved: number;
  failed: number;
  accuracy: number;
  totalThinkingTimeMs: number;
  avgSolveTimeMs: number;
  fastestSolveMs: number | null;
  longestSolveMs: number | null;
  xpEarned: number;
  coinsEarned: number;
  maxCombo: number;
  enduranceThreshold: number;
}

export interface UserStats {
  totalSolved: number;
  totalAttempts: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalThinkingTimeMs: number;
  dailyGoal: number;
  xp: number;
  level: number;
  completedCollectionsCount: number;
  levelTitle: string;
  coins: number;
  performanceRating: number;
  streakFreezeAvailable: number;
  friendsCount?: number;
  heatmapData: Record<string, { solved: number; failed: number }>;
}

export type VideoCategory = 'Opening' | 'Endgame' | 'Calculation' | 'Middlegame' | 'Strategy' | 'Fun';

export interface VideoLibraryItem {
  id: string;
  userId: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  title: string;
  category?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'solves' | 'streaks' | 'accuracy' | 'special';
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  currentValue: number;
  xpReward?: number;
  coinReward?: number;
}

export interface CommunityUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  currentStreak: number;
  bestStreak: number;
  totalSolved: number;
  accuracy: number;
  friendsCount?: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf?: boolean;
}

export interface PublicProfile extends CommunityUser {
  totalAttempts: number;
  heatmapData?: Record<string, { solved: number; failed: number }>;
}

export interface LeaderboardItem {
  rank: number;
  id: string;
  username: string;
  name: string;
  avatar: string;
  currentStreak: number;
  score: number;
  metricLabel: string;
  isSelf?: boolean;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'streak';
export type LeaderboardFilter = 'global' | 'friends';

export type ActiveTab =
  | 'dashboard'
  | 'studies'
  | 'study-details'
  | 'videolibrary'
  | 'stats'
  | 'community'
  | 'profile'
  | 'settings'
  | 'solver'
  | 'review'
  | 'library'; // legacy redirect to studies
