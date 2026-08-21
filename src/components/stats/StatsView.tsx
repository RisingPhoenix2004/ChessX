import React, { useState } from 'react';
import { Puzzle, Collection, UserStats } from '../../types/chess';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Trophy,
  Filter,
  Layers,
  Sparkles,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface StatsViewProps {
  puzzles: Puzzle[];
  collections: Collection[];
  userStats: UserStats;
}

export const StatsView: React.FC<StatsViewProps> = ({
  puzzles,
  collections,
  userStats,
}) => {
  const [selectedStudyId, setSelectedStudyId] = useState<string>('all');

  // Filter puzzles based on selected study
  const filteredPuzzles = selectedStudyId === 'all'
    ? puzzles
    : puzzles.filter((p) => p.collectionId === selectedStudyId);

  const totalPositions = filteredPuzzles.length;
  const totalAttempts = filteredPuzzles.reduce((acc, p) => acc + p.attempts, 0);
  const totalCorrect = filteredPuzzles.reduce((acc, p) => acc + p.solvedCount, 0);
  const totalWrong = filteredPuzzles.reduce((acc, p) => acc + p.failedCount, 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 100;
  const totalThinkingTimeMs = filteredPuzzles.reduce((acc, p) => acc + (p.avgSolveTimeMs * p.attempts), 0);

  const formatThinkingTime = (timeMs: number) => {
    const totalMinutes = Math.floor(timeMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

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

  // Accuracy progression dataset
  const accuracyProgressionData = [
    { session: 'S1', accuracy: Math.max(50, overallAccuracy - 15) },
    { session: 'S2', accuracy: Math.max(60, overallAccuracy - 10) },
    { session: 'S3', accuracy: Math.max(65, overallAccuracy - 5) },
    { session: 'S4', accuracy: Math.max(70, overallAccuracy - 2) },
    { session: 'S5', accuracy: overallAccuracy },
  ];

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
    const catAttempts = catPuzzles.reduce((acc, p) => acc + p.attempts, 0);
    const catSolved = catPuzzles.reduce((acc, p) => acc + p.solvedCount, 0);
    const accuracyPct = catAttempts > 0 ? Math.round((catSolved / catAttempts) * 100) : 0;

    return {
      category: cat,
      accuracy: accuracyPct,
      solved: catSolved,
      attempts: catAttempts,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header & Study Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-emerald-500" />
            <span>Tactical Analytics</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Calculation performance, accuracy metrics, and study breakdowns.
          </p>
        </div>

        {/* Study Filter Dropdown */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={selectedStudyId}
            onChange={(e) => setSelectedStudyId(e.target.value)}
            className="bg-transparent text-slate-800 dark:text-white font-bold text-xs px-2 py-1 focus:outline-none cursor-pointer w-full sm:w-52"
          >
            <option value="all" className="bg-white dark:bg-[#0f1523]">All Studies</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id} className="bg-white dark:bg-[#0f1523]">
                {col.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-[#0f1523] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SOLVED</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{totalCorrect}</div>
        </div>

        <div className="bg-white dark:bg-[#0f1523] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">WRONG</span>
          <div className="text-2xl font-black text-rose-500 font-mono">{totalWrong}</div>
        </div>

        <div className="bg-white dark:bg-[#0f1523] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ACCURACY</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{overallAccuracy}%</div>
        </div>

        <div className="bg-white dark:bg-[#0f1523] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TRAINING TIME</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatThinkingTime(totalThinkingTimeMs)}</div>
        </div>

        <div className="bg-white dark:bg-[#0f1523] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CURRENT STREAK</span>
          <div className="text-2xl font-black text-amber-500 font-mono flex items-center gap-1.5">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            <span>{userStats.currentStreak}d</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1523] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MAX STREAK</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>{userStats.bestStreak}d</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Solved vs Failed Activity */}
        <div className="bg-white dark:bg-[#0f1523] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Daily Training Activity (Last 7 Days)</span>
            </h3>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Solved
              </span>
              <span className="flex items-center gap-1 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Failed
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1523',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="solved" fill="#10b981" radius={[6, 6, 0, 0]} name="Solved" />
                <Bar dataKey="failed" fill="#ef4444" radius={[6, 6, 0, 0]} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tactical Competencies Radar Chart */}
        <div className="bg-white dark:bg-[#0f1523] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-md">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Tactical Theme Performance Radar</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" opacity={0.4} />
                <PolarAngleAxis dataKey="category" stroke="#94a3b8" fontSize={10} />
                <PolarRadiusAxis stroke="#64748b" domain={[0, 100]} />
                <Radar
                  name="Accuracy %"
                  dataKey="accuracy"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1523',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
