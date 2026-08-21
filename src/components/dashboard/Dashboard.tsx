import React, { useState, useMemo } from 'react';
import { UserStats, Collection, ActiveTab, Puzzle, UserProfile } from '../../types/chess';
import { ActivityHeatmap } from '../common/ActivityHeatmap';
import {
  Zap,
  RotateCcw,
  BookOpen,
  Plus,
  Flame,
  Target,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Settings,
  ChevronRight,
  Play,
  Eye,
  Activity,
  Layers,
  Award,
  Sparkles,
  ArrowRight,
  Clock,
  X
} from 'lucide-react';

interface DashboardProps {
  userProfile: UserProfile;
  userStats: UserStats;
  collections: Collection[];
  puzzles: Puzzle[];
  onNavigate: (path: string, tab?: ActiveTab) => void;
  onStartSession: (collectionId?: string) => void;
  onStartReplaySession?: (replayPuzzles: Puzzle[]) => void;
  onUpdateDailyGoal: (newGoal: number) => void;
  onOpenStudyDetails?: (studyId: string) => void;
  onOpenPgnViewer?: (collection: Collection) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userProfile,
  userStats,
  collections,
  puzzles,
  onNavigate,
  onStartSession,
  onStartReplaySession,
  onUpdateDailyGoal,
  onOpenStudyDetails,
  onOpenPgnViewer,
}) => {
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = userStats.heatmapData[today];
  const solvesToday = typeof todayEntry === 'number' ? todayEntry : todayEntry?.solved || 0;
  const goalTarget = userStats.dailyGoal || 10;
  const remainingToday = Math.max(0, goalTarget - solvesToday);
  const goalPercent = Math.min(Math.round((solvesToday / goalTarget) * 100), 100);

  // Solved & Failed calculation
  const totalPlayed = userStats.totalAttempts || puzzles.reduce((sum, p) => sum + (p.attempts || 0), 0);
  const totalSolved = userStats.totalSolved || puzzles.reduce((sum, p) => sum + (p.solvedCount || 0), 0);
  const accuracy = totalPlayed > 0 ? Math.round((totalSolved / totalPlayed) * 100) : userStats.accuracy || 100;

  // Filter all failed puzzles waiting for replay
  const failedAtLeastOncePuzzles = useMemo(() => {
    return puzzles.filter((p) => Boolean(p.hasFailed || (p.failedCount || 0) > 0));
  }, [puzzles]);

  const toReplayCount = failedAtLeastOncePuzzles.length;

  const handleGoalSelect = (goal: number) => {
    onUpdateDailyGoal(goal);
    setShowGoalModal(false);
  };

  const handleCustomGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customGoalInput, 10);
    if (!isNaN(val) && val > 0 && val <= 500) {
      onUpdateDailyGoal(val);
      setShowGoalModal(false);
      setCustomGoalInput('');
    }
  };

  const handleStartReplay = () => {
    if (onStartReplaySession && failedAtLeastOncePuzzles.length > 0) {
      onStartReplaySession(failedAtLeastOncePuzzles);
    } else if (onStartSession) {
      onStartSession();
    }
  };

  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = userProfile.name?.split(' ')[0] || userProfile.username || 'Player';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-8 font-sans">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-[#1d1610] border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{userStats.currentStreak}-Day Training Streak</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {getDynamicGreeting()}, {firstName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Build pattern recognition, master tactical calculation, and hit your daily goals.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onStartSession()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xl transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>QUICK SOLVE</span>
          </button>

          <button
            onClick={() => onNavigate('/studies', 'studies')}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-[#131b2e] hover:bg-slate-200 dark:hover:bg-[#1c2742] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            title="Browse Studies"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Browse Studies</span>
          </button>
        </div>
      </div>

      {/* Daily Goal Progress Card */}
      <div className="bg-white dark:bg-[#0f1523] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Daily Training Goal
                </h3>
                {solvesToday >= goalTarget && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                    Completed!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {solvesToday >= goalTarget
                  ? `Goal completed! You solved ${solvesToday} positions today.`
                  : `${remainingToday} more ${remainingToday === 1 ? 'position' : 'positions'} needed to achieve your goal.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-xl text-slate-900 dark:text-white">
              {solvesToday} <span className="text-slate-400 text-sm font-normal">/ {goalTarget}</span>
            </span>
            <button
              onClick={() => setShowGoalModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Daily Goal"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-[#151c2e] h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${goalPercent}%` }}
          />
        </div>
      </div>

      {/* Primary 2-Column Section: Continue Training & Failed Puzzles Replay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Continue Training Studies (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0f1523] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <span>Continue Training</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick up where you left off in your tactical repertoire studies.
              </p>
            </div>

            <button
              onClick={() => onNavigate('/studies', 'studies')}
              className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {collections.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No studies added yet. Create a study or import PGN puzzles to start structured training.
              </p>
              <button
                onClick={() => onNavigate('/studies', 'studies')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Import PGN Study</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {collections.slice(0, 3).map((col) => {
                const colPuzzles = puzzles.filter((p) => (col.puzzleIds || []).includes(p.id));
                const totalCol = colPuzzles.length || 1;
                const solvedCol = colPuzzles.filter((p) => p.solvedCount > 0).length;
                const progressPct = Math.round((solvedCol / totalCol) * 100);

                return (
                  <div
                    key={col.id}
                    className="p-4 bg-slate-50 dark:bg-[#141b2b] rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-4 hover:border-emerald-500/50 transition-colors"
                  >
                    <div
                      onClick={() => onOpenStudyDetails && onOpenStudyDetails(col.id)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {col.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>{solvedCol}/{colPuzzles.length} positions</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{progressPct}% mastered</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartSession(col.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Continue</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Failed Puzzles & Replay Queue (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0f1523] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Failed Puzzles Replay
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Spaced repetition queue
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-black text-xs border border-rose-500/20">
                {toReplayCount} waiting
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Whenever you make a mistake on a position, it enters your replay queue. Solving it successfully clears it immediately from the failed list.
            </p>

            <div className="p-4 bg-slate-50 dark:bg-[#141b2b] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Queue Status</div>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-between">
                <span>{toReplayCount === 0 ? 'Queue Clean' : `${toReplayCount} Positions Need Replay`}</span>
                <span className="text-xs text-emerald-500 font-bold">{toReplayCount === 0 ? 'All Mastered' : 'Action Required'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartReplay}
            disabled={toReplayCount === 0}
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-wider shadow-lg transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Failed Puzzles</span>
          </button>
        </div>
      </div>

      {/* Activity Heatmap Section */}
      <ActivityHeatmap
        heatmapData={userStats.heatmapData}
        title="Training Activity Heatmap"
        subtitle="52-week contribution workout representing your daily tactical calculation habit."
      />

      {/* Goal Edit Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                <span>Adjust Daily Goal</span>
              </h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15, 20, 25, 30].map((val) => (
                <button
                  key={val}
                  onClick={() => handleGoalSelect(val)}
                  className={`py-2.5 rounded-xl font-mono font-bold text-xs border transition-all cursor-pointer ${
                    goalTarget === val
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#141b2b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  {val} / day
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomGoalSubmit} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[11px] font-bold uppercase text-slate-400">
                Custom Target
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={customGoalInput}
                  onChange={(e) => setCustomGoalInput(e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
                >
                  Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
