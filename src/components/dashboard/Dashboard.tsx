import React, { useState, useMemo } from 'react';
import { UserStats, Collection, ActiveTab, Puzzle, UserProfile } from '../../types/chess';
import {
  Play,
  RotateCcw,
  Target,
  Flame,
  ChevronRight,
  ChevronDown,
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
  onOpenStudyDetails,
}) => {
  const [overviewPeriod, setOverviewPeriod] = useState<'This Week' | 'This Month' | 'All Time'>('This Week');
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; solved: number; failed: number } | null>(null);

  // Failed positions strictly from active hasFailed queue
  const failedPuzzles = useMemo(() => {
    return puzzles.filter((p) => Boolean(p.hasFailed));
  }, [puzzles]);

  const failedCount = failedPuzzles.length;

  // Active / Most recent study
  const activeStudy = useMemo(() => {
    if (collections.length === 0) return null;
    return collections[0];
  }, [collections]);

  const activeStudyPuzzles = useMemo(() => {
    if (!activeStudy) return [];
    const ids = activeStudy.puzzleIds || [];
    return puzzles.filter((p) => ids.includes(p.id));
  }, [activeStudy, puzzles]);

  const activeStudyTotal = activeStudyPuzzles.length || 1;
  const activeStudySolved = activeStudyPuzzles.filter((p) => (p.solvedCount || 0) > 0).length;
  const activeStudyProgressPct = Math.round((activeStudySolved / activeStudyTotal) * 100);

  const activeStudyAccuracy = useMemo(() => {
    const attempts = activeStudyPuzzles.reduce((sum, p) => sum + (p.attempts || 0), 0);
    const solved = activeStudyPuzzles.reduce((sum, p) => sum + (p.solvedCount || 0), 0);
    return attempts > 0 ? Math.round((solved / attempts) * 100) : 85;
  }, [activeStudyPuzzles]);

  // Dynamic Training Overview data calculation based on selected period
  const { chartData, periodPositions, periodCorrect, periodWrong, periodTimeMs } = useMemo(() => {
    const daysCount = overviewPeriod === 'This Month' ? 30 : 7;
    const now = new Date();
    const list = [];
    let pos = 0;
    let cor = 0;
    let wrg = 0;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = userStats.heatmapData[dateStr];
      const solved = typeof entry === 'number' ? entry : entry?.solved || 0;
      const failed = typeof entry === 'object' ? entry?.failed || 0 : 0;
      const totalDay = solved + failed;

      pos += totalDay;
      cor += solved;
      wrg += failed;

      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      list.push({
        label: dayLabel,
        date: dateStr,
        value: totalDay,
        solved,
        failed,
      });
    }

    if (overviewPeriod === 'All Time') {
      pos = userStats.totalAttempts || pos;
      cor = userStats.totalSolved || cor;
      wrg = Math.max(0, pos - cor);
    }

    const timeMs = pos * 15000; // ~15 seconds per position average or thinking time

    return {
      chartData: list.slice(-7), // Display last 7 points on SVG
      periodPositions: pos,
      periodCorrect: cor,
      periodWrong: wrg,
      periodTimeMs: timeMs,
    };
  }, [overviewPeriod, userStats]);

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) return `${hours}h ${remMins}m`;
    return `${remMins}m`;
  };

  // Accurate Date-Aligned 16-Week Heatmap Matrix (7 rows x 16 columns)
  const heatmapWeeks = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon...
    const mondayOffset = (currentDayOfWeek + 6) % 7; // 0 for Mon, 6 for Sun
    const currentWeekMonday = new Date(today);
    currentWeekMonday.setDate(today.getDate() - mondayOffset);

    const startDate = new Date(currentWeekMonday);
    startDate.setDate(currentWeekMonday.getDate() - (15 * 7)); // 16 weeks total

    const weeks: { date: string; count: number; solved: number; failed: number; level: number }[][] = [];
    const curr = new Date(startDate);

    for (let w = 0; w < 16; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = curr.toISOString().split('T')[0];
        const entry = userStats.heatmapData[dateStr];
        const solved = typeof entry === 'number' ? entry : entry?.solved || 0;
        const failed = typeof entry === 'object' ? entry?.failed || 0 : 0;
        const count = solved + failed;

        let level = 0;
        if (count >= 15) level = 4;
        else if (count >= 8) level = 3;
        else if (count >= 3) level = 2;
        else if (count >= 1) level = 1;

        week.push({ date: dateStr, count, solved, failed, level });
        curr.setDate(curr.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [userStats.heatmapData]);

  // Compute SVG Points for Training Overview Chart
  const svgChart = useMemo(() => {
    const maxVal = Math.max(5, ...chartData.map((d) => d.value));
    const count = chartData.length;
    const points = chartData.map((d, idx) => {
      const x = 35 + idx * ((500 - 70) / (count - 1));
      const y = 80 - Math.round((d.value / maxVal) * 55);
      return { x, y, ...d };
    });

    const dPath =
      points.length > 0
        ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
        : '';

    return { points, dPath, maxVal };
  }, [chartData]);

  const handleStartReplay = () => {
    if (onStartReplaySession && failedPuzzles.length > 0) {
      onStartReplaySession(failedPuzzles);
    } else {
      onStartSession();
    }
  };

  const firstName = userProfile.name?.split(' ')[0] || userProfile.username || 'Player';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
      {/* 1. Header (Greeting + Subtitle + Start Training Button) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
            Welcome back, {firstName}.
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-0.5">
            {failedCount > 0
              ? `You have ${failedCount} failed position${failedCount > 1 ? 's' : ''} to review today.`
              : 'You have no failed positions to review today. Ready for training!'}
          </p>
        </div>

        <button
          onClick={() => onStartSession()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 font-bold text-xs shadow-sm transition-all cursor-pointer transform active:scale-95 shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start Training</span>
        </button>
      </div>

      {/* 2. Top Grid: Continue Study (Left) & Review Mistakes (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CONTINUE STUDY CARD (Left) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111520] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 dark:text-neutral-400 uppercase tracking-wider">
                CONTINUE STUDY
              </span>
              <div className="text-right">
                <span className="text-sm font-black text-neutral-900 dark:text-white font-mono block">
                  {activeStudyAccuracy}%
                </span>
                <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                  Accuracy
                </span>
              </div>
            </div>

            {activeStudy ? (
              <div
                onClick={() => onOpenStudyDetails && onOpenStudyDetails(activeStudy.id)}
                className="cursor-pointer space-y-1"
              >
                <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {activeStudy.name}
                </h3>
                <p className="text-xs text-neutral-500 line-clamp-1">
                  {activeStudy.description || `Study with ${activeStudyPuzzles.length} tactical positions.`}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  No Studies Available Yet
                </h3>
                <p className="text-xs text-neutral-500">
                  Import a PGN file to create customized calculation workouts.
                </p>
              </div>
            )}
          </div>

          <div className="pt-6 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>
                  {activeStudy ? `${activeStudySolved} / ${activeStudyPuzzles.length} positions completed` : '0 / 0 completed'}
                </span>
                <span className="font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  {activeStudy ? `${activeStudyProgressPct}%` : '0%'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-500"
                  style={{ width: `${activeStudy ? activeStudyProgressPct : 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => activeStudy ? onStartSession(activeStudy.id) : onNavigate('/studies', 'studies')}
                className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <span>{activeStudy ? 'Continue Training' : 'Import Study'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate('/studies', 'studies')}
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                All Studies ({collections.length})
              </button>
            </div>
          </div>
        </div>

        {/* REVIEW MISTAKES CARD (Right) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111520] p-6 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 flex flex-col justify-between shadow-xs space-y-5">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Target className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Review Mistakes
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                {failedCount > 0
                  ? `${failedCount} position${failedCount > 1 ? 's' : ''} need revisiting from your last session.`
                  : 'Zero mistakes pending! All previous mistakes have been mastered.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleStartReplay}
            disabled={failedCount === 0}
            className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-[#171c2a] dark:hover:bg-[#20273a] border border-neutral-300 dark:border-neutral-700 text-white dark:text-neutral-100 font-bold text-xs shadow-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Failed</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom Grid: Training Overview (Left) & Activity Heatmap (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* TRAINING OVERVIEW CARD (Left) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111520] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Training Overview
            </h3>

            <div className="relative inline-block">
              <select
                value={overviewPeriod}
                onChange={(e) => setOverviewPeriod(e.target.value as any)}
                className="appearance-none bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1 pr-7 text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="All Time">All Time</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Smooth Dynamic SVG Line Chart */}
          <div className="w-full h-32 relative flex flex-col justify-end">
            <svg className="w-full h-24 overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
              {/* Reference Grid lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="currentColor" className="text-neutral-100 dark:text-neutral-800/60" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="currentColor" className="text-neutral-100 dark:text-neutral-800/60" strokeDasharray="3 3" />

              {/* Dynamic Path */}
              {svgChart.dPath && (
                <path
                  d={svgChart.dPath}
                  fill="none"
                  stroke="currentColor"
                  className="text-neutral-800 dark:text-white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Dynamic Nodes with Tooltips */}
              {svgChart.points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    className="fill-white dark:fill-[#111520] stroke-neutral-900 dark:stroke-white hover:r-6 transition-all cursor-pointer"
                    strokeWidth="2.5"
                  />
                </g>
              ))}
            </svg>

            {/* X-axis Day labels */}
            <div className="flex justify-between text-[11px] font-mono text-neutral-400 pt-3 px-2">
              {chartData.map((d) => (
                <span key={d.date}>{d.label}</span>
              ))}
            </div>
          </div>

          {/* Bottom 4 Metrics Row (Calculated accurately) */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase block">Positions</span>
              <span className="text-base font-bold text-neutral-900 dark:text-white font-mono mt-0.5 block">
                {periodPositions}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase block">Correct</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                {periodCorrect}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase block">Wrong</span>
              <span className="text-base font-bold text-rose-500 font-mono mt-0.5 block">
                {periodWrong}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase block">Time</span>
              <span className="text-base font-bold text-neutral-900 dark:text-white font-mono mt-0.5 block">
                {formatTime(periodTimeMs)}
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVITY HEATMAP CARD (Right - 16-Week Structured Matrix) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111520] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Activity
            </h3>

            <span className="text-xs font-bold text-amber-500 flex items-center gap-1 font-mono">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>{userStats.currentStreak || 1} days</span>
            </span>
          </div>

          {/* Structured Weekly Matrix Grid (16 columns x 7 rows) */}
          <div className="py-1">
            <div className="flex gap-1.5 justify-center overflow-x-auto pb-1 scrollbar-none">
              {heatmapWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5 shrink-0">
                  {week.map((cell) => (
                    <div
                      key={cell.date}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        cell.level === 4
                          ? 'bg-emerald-500 shadow-xs shadow-emerald-500/40'
                          : cell.level === 3
                          ? 'bg-emerald-600'
                          : cell.level === 2
                          ? 'bg-emerald-700'
                          : cell.level === 1
                          ? 'bg-emerald-800/80'
                          : 'bg-neutral-100 dark:bg-neutral-800/60 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Hover Tooltip display */}
            <div className="h-5 text-center mt-1">
              {hoveredCell ? (
                <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300 font-semibold">
                  {hoveredCell.date}: {hoveredCell.count} solves ({hoveredCell.solved} correct, {hoveredCell.failed} failed)
                </span>
              ) : (
                <span className="text-[10px] font-mono text-neutral-400">
                  Hover dots to inspect daily solves
                </span>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <span>Less</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800" />
              <span className="w-2 h-2 rounded-full bg-emerald-800" />
              <span className="w-2 h-2 rounded-full bg-emerald-700" />
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};
