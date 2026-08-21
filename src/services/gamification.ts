import { UserStats, Achievement, DifficultyLevel } from '../types/chess';

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  icon: string;
}

export const LEVEL_TIERS: LevelInfo[] = [
  { level: 1, title: 'Novice Solver', minXp: 0, maxXp: 200, icon: '♟️' },
  { level: 2, title: 'Tactical Beginner', minXp: 200, maxXp: 500, icon: '🐣' },
  { level: 3, title: 'Club Player', minXp: 500, maxXp: 1000, icon: '🛡️' },
  { level: 4, title: 'Intermediate Tactician', minXp: 1000, maxXp: 1800, icon: '⚔️' },
  { level: 5, title: 'Advanced Calculator', minXp: 1800, maxXp: 3000, icon: '🏹' },
  { level: 6, title: 'Expert Analyst', minXp: 3000, maxXp: 4800, icon: '🔮' },
  { level: 7, title: 'Candidate Master', minXp: 4800, maxXp: 7200, icon: '🎖️' },
  { level: 8, title: 'FIDE Master', minXp: 7200, maxXp: 10500, icon: '🏅' },
  { level: 9, title: 'International Master', minXp: 10500, maxXp: 15000, icon: '👑' },
  { level: 10, title: 'Grandmaster', minXp: 15000, maxXp: 22000, icon: '⚡' },
  { level: 11, title: 'Super Grandmaster', minXp: 22000, maxXp: 32000, icon: '🔥' },
  { level: 12, title: 'World Champion', minXp: 32000, maxXp: 100000, icon: '🏆' },
];

export function getLevelInfo(xp: number): LevelInfo {
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TIERS[i].minXp) {
      return LEVEL_TIERS[i];
    }
  }
  return LEVEL_TIERS[0];
}

// Motivational dynamic messages on puzzle solve
const PRAISE_LIST = [
  '✔ Brilliant!',
  '✔ Tactical Monster!',
  '✔ Perfect Calculation!',
  '✔ You Saw Everything!',
  '✔ Crushing Finish!',
  '✔ Beautiful!',
  '✔ Genius!',
  '✔ Pure Masterclass!',
  '✔ Unstoppable!',
  '✔ Mind-Blowing Move!',
];

export function getRandomPraise(): string {
  const index = Math.floor(Math.random() * PRAISE_LIST.length);
  return PRAISE_LIST[index];
}

// Calculate XP earned for solving a puzzle
export function calculateXpGain(
  difficulty: DifficultyLevel,
  solveTimeMs: number,
  mistakes: number,
  combo: number
): { xp: number; coins: number } {
  let base = 50;
  if (difficulty === 'Easy') base = 30;
  if (difficulty === 'Medium') base = 50;
  if (difficulty === 'Hard') base = 85;
  if (difficulty === 'Master') base = 120;

  // Speed Bonus (< 10 seconds)
  const speedMultiplier = solveTimeMs < 10000 ? 1.5 : solveTimeMs < 20000 ? 1.2 : 1.0;

  // Accuracy Bonus
  const accuracyMultiplier = mistakes === 0 ? 2.0 : mistakes === 1 ? 1.2 : 0.8;

  // Combo Multiplier (up to 3x)
  const comboMultiplier = Math.min(1 + (combo - 1) * 0.25, 3.0);

  const xp = Math.round(base * speedMultiplier * accuracyMultiplier * comboMultiplier);
  const coins = Math.round(xp * 0.4);

  return { xp, coins };
}

// Consistency & Training Habit Badges
export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_goal',
    title: 'First Step',
    description: 'Complete your daily puzzle goal for the first time.',
    icon: '🎯',
    category: 'streaks',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    currentValue: 0,
  },
  {
    id: 'streak_3',
    title: '3-Day Consistency',
    description: 'Maintain a 3-day training streak.',
    icon: '🔥',
    category: 'streaks',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    currentValue: 0,
  },
  {
    id: 'streak_7',
    title: '7-Day Consistency',
    description: 'Maintain a 7-day training streak.',
    icon: '⚡',
    category: 'streaks',
    unlocked: false,
    progress: 0,
    maxProgress: 7,
    currentValue: 0,
  },
  {
    id: 'streak_30',
    title: '30-Day Master Habit',
    description: 'Maintain a 30-day training streak.',
    icon: '🛡️',
    category: 'streaks',
    unlocked: false,
    progress: 0,
    maxProgress: 30,
    currentValue: 0,
  },
  {
    id: 'streak_100',
    title: '100-Day Centurion',
    description: 'Reach a 100-day unbroken chess training streak.',
    icon: '👑',
    category: 'streaks',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    currentValue: 0,
  },
  {
    id: 'daily_goal_master',
    title: 'Goal Master',
    description: 'Complete 10 daily goals.',
    icon: '🏆',
    category: 'special',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    currentValue: 0,
  },
  {
    id: 'flawless_session',
    title: 'Flawless Training',
    description: 'Solve 10 puzzles without a single mistake.',
    icon: '✨',
    category: 'accuracy',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    currentValue: 0,
  },
];
