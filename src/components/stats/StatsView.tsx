import React, { useState, useMemo } from 'react';
import { Puzzle, Collection, UserStats } from '../../types/chess';
import {
  Flame,
  Filter,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { ActivityHeatmap } from '../common/ActivityHeatmap';

interface StatsViewProps {
  puzzles: Puzzle[];
  collections: Collection[];
  userStats: UserStats;
  onStartReplaySession?: (replayPuzzles: Puzzle[]) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  puzzles,
  collections,
  userStats,
  onStartReplaySession,
}) => {
  const [selectedStudyId, setSelectedStudyId] = useState<string>('all');

  const filteredPuzzles = selectedStudyId === 'all'
    ? puzzles
    : puzzles.filter((p) => p.collectionId === selectedStudyId);

  const totalAttempts = filteredPuzzles.reduce((acc, p) => acc + (p.attempts || 0), 0) || userStats.totalAttempts || 0;
  const totalCorrect = filteredPuzzles.reduce((acc, p) => acc + (p.solvedCount || 0), 0) || userStats.totalSolved || 0;
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : userStats.accuracy || 100;
  
  // Failed puzzles queue (strictly hasFailed === true)
  const failedPuzzles = useMemo(() => {
    return filteredPuzzles.filter((p) => Boolean(p.hasFailed));
  }, [filteredPuzzles]);

  const toReplayCount = failedPuzzles.length;
  const performanceRating = userStats.performanceRating || 2006;

  // Activity chart data (last 7 days)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const activityData = days.map((dayStr) => {
    const dateLabel = new Date(dayStr).toLocaleDateString('en-US', { weekday: 'short' });
    const dayEntry = userStats.heatmapData[dayStr];
    const solved = typeof dayEntry === 'number' ? dayEntry : dayEntry?.solved || 0;
    const failed = typeof dayEntry === 'object' ? dayEntry?.failed || 0 : 0;
    return {
      day: dateLabel,
      solved,
      failed,
    };
  });

  // Category Radar Chart
  const targetCategories = [
    'Tactics',
    'Calculation',
    'Strategy',
    'Positional',
    'Opening',
    'Endgame',
    'Sacrifice',
  ];

  const radarData = targetCategories.map((cat) => {
    const catPuzzles = filteredPuzzles.filter(
      (p) => p.userCategory === cat || (p.tags && p.tags.includes(cat as any))
    );
    const catAttempts = catPuzzles.reduce((acc, p) => acc + (p.attempts || 0), 0);
    const catSolved = catPuzzles.reduce((acc, p) => acc + (p.solvedCount || 0), 0);
    const accuracyPct = catAttempts > 0 ? Math.round((catSolved / catAttempts) * 100) : 0;

    return {
      category: cat,
      accuracy: accuracyPct,
      solved: catSolved,
      attempts: catAttempts,
    };
  });

  const handleStartReplay = (singlePuzzle?: Puzzle) => {
    if (onStartReplaySession) {
      if (singlePuzzle) {
        onStartReplaySession([singlePuzzle]);
      } else if (failedPuzzles.length > 0) {
        onStartReplaySession(failedPuzzles);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
      {/* Header & Study Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
            Analytics & Performance
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Detailed calculation statistics, solved ratios, and replay management.
          </p>
        </div>

        {/* Study Filter Dropdown */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#111520] border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 shadow-xs w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-neutral-400 ml-1" />
          <select
            value={selectedStudyId}
            onChange={(e) => setSelectedStudyId(e.target.value)}
            className="bg-transparent text-neutral-900 dark:text-white font-bold text-xs px-2 py-0.5 focus:outline-none cursor-pointer w-full sm:w-48"
          >
            <option value="all" className="bg-white dark:bg-[#111520]">All Studies</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id} className="bg-white dark:bg-[#111520]">
                {col.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3 STAT CARDS (PLAYED, SOLVED, TO REPLAY) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: PLAYED (Charcoal / Dark Grey) */}
        <div className="bg-[#2a2b2e] dark:bg-[#202226] p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-md transition-transform hover:-translate-y-0.5">
          <div className="text-4xl sm:text-5xl font-black text-neutral-200 font-mono tracking-tight">
            {totalAttempts}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-neutral-400 tracking-widest uppercase mt-2">
            PLAYED
          </div>
        </div>

        {/* Card 2: SOLVED (Split Green & Red background) */}
        <div className="relative rounded-2xl overflow-hidden shadow-md transition-transform hover:-translate-y-0.5 flex flex-col items-center justify-center p-6 select-none">
          {/* Split background: 50% Green (#5a8e38), 50% Red (#9e3a36) */}
          <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full bg-[#5a8e38]" />
            <div className="w-1/2 h-full bg-[#9e3a36]" />
          </div>

          {/* Content overlay */}
          <div className="relative z-10 text-center">
            <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight drop-shadow-sm">
              {overallAccuracy}%
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-white tracking-widest uppercase mt-2 drop-shadow-sm">
              SOLVED
            </div>
          </div>
        </div>

        {/* Card 3: TO REPLAY (Vibrant Blue with Play Icon) */}
        <div
          onClick={() => handleStartReplay()}
          className={`p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-md transition-all ${
            toReplayCount > 0
              ? 'bg-[#2563eb] hover:bg-[#1d4ed8] cursor-pointer hover:-translate-y-0.5 group'
              : 'bg-[#3b82f6]/70 dark:bg-[#2563eb]/60 cursor-default'
          }`}
          title={toReplayCount > 0 ? 'Click to replay failed positions' : 'No failed positions'}
        >
          <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight flex items-center justify-center gap-2">
            <span>{toReplayCount}</span>
            <span className="text-3xl sm:text-4xl text-blue-200 group-hover:translate-x-1 transition-transform">▶</span>
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-blue-100 tracking-widest uppercase mt-2">
            TO REPLAY
          </div>
        </div>
      </div>

      {/* REPLAY & FAILED PUZZLES RESOLUTION SECTION */}
      <div className="bg-white dark:bg-[#111520] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                Replay & Review Failed Positions
              </h2>
              <p className="text-xs text-neutral-500">
                Solve these positions to reinforce tactical memory. Solving automatically removes them from this queue.
              </p>
            </div>
          </div>

          {toReplayCount > 0 && (
            <button
              onClick={() => handleStartReplay()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Practice All ({toReplayCount})</span>
            </button>
          )}
        </div>

        {failedPuzzles.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-neutral-900 dark:text-white">All Clear!</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              You have no active failed positions pending review. Great calculation accuracy!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {failedPuzzles.slice(0, 6).map((p, idx) => (
              <div
                key={p.id}
                className="p-3.5 bg-neutral-50 dark:bg-[#171c2a] rounded-xl border border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between gap-3 group hover:border-blue-400 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">#{idx + 1}</span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {p.description || 'Tactical Position'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                    <span>{p.difficulty || 'Medium'}</span>
                    <span>•</span>
                    <span className="text-red-500 font-medium">{p.failedCount || 1} fail{(p.failedCount || 1) > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartReplay(p)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer shrink-0 transition-colors"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Solve</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Solved vs Failed Activity */}
        <div className="bg-white dark:bg-[#111520] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
              Daily Training Activity (Last 7 Days)
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Solved
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Failed
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="solved" fill="#10b981" radius={[4, 4, 0, 0]} name="Solved" />
                <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tactical Competencies Radar Chart */}
        <div className="bg-white dark:bg-[#111520] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
            Tactical Theme Performance Radar
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#3f3f46" opacity={0.3} />
                <PolarAngleAxis dataKey="category" stroke="#a1a1aa" fontSize={10} />
                <PolarRadiusAxis stroke="#71717a" domain={[0, 100]} />
                <Radar
                  name="Accuracy %"
                  dataKey="accuracy"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap
        heatmapData={userStats.heatmapData}
        title="Training Consistency Heatmap"
        subtitle="52-week activity log representing daily calculation habits."
      />
    </div>
  );
};
