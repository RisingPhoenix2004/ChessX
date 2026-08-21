import React, { useState, useMemo } from 'react';

interface ActivityHeatmapProps {
  heatmapData?: Record<string, { solved: number; failed: number } | number>;
  title?: string;
  subtitle?: string;
}

interface DayData {
  date: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ...
  solved: number;
  failed: number;
  total: number;
  accuracy: number;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  heatmapData = {},
  title = 'Training Activity Heatmap',
  subtitle = '52-week activity representing your daily calculation consistency.',
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  const { weeks, monthLabels, totalSolvedYear, activeDaysCount } = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    
    // We want the grid to end on the current week (Sunday)
    // Find the end date of current week (Saturday) or today
    const endDate = new Date(today);
    
    // Calculate start date: exactly 52 weeks (364 days) back from the start of the current week (Monday)
    // Monday as start of week
    const mondayOffset = (currentDayOfWeek + 6) % 7; // 0 for Mon, 6 for Sun
    const currentWeekMonday = new Date(today);
    currentWeekMonday.setDate(today.getDate() - mondayOffset);
    
    const startDate = new Date(currentWeekMonday);
    startDate.setDate(currentWeekMonday.getDate() - (51 * 7)); // 52 weeks total

    const weeksList: DayData[][] = [];
    const months: { label: string; weekIdx: number }[] = [];
    let lastMonth = -1;
    let totalSolvedYear = 0;
    let activeDaysCount = 0;

    const curr = new Date(startDate);
    for (let w = 0; w < 52; w++) {
      const week: DayData[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = curr.toISOString().split('T')[0];
        const month = curr.getMonth();

        // Register month label at the start of a month or first week
        if (month !== lastMonth && d === 0) {
          months.push({
            label: curr.toLocaleDateString('en-US', { month: 'short' }),
            weekIdx: w,
          });
          lastMonth = month;
        }

        const rawVal = heatmapData[dateStr];
        let solved = 0;
        let failed = 0;

        if (typeof rawVal === 'number') {
          solved = rawVal;
        } else if (rawVal && typeof rawVal === 'object') {
          solved = rawVal.solved || 0;
          failed = rawVal.failed || 0;
        }

        const total = solved + failed;
        const accuracy = total > 0 ? Math.round((solved / total) * 100) : 100;

        if (solved > 0) {
          totalSolvedYear += solved;
          activeDaysCount += 1;
        }

        week.push({
          date: dateStr,
          dayOfWeek: curr.getDay(),
          solved,
          failed,
          total,
          accuracy,
        });

        curr.setDate(curr.getDate() + 1);
      }
      weeksList.push(week);
    }

    // Filter month labels so they don't crowd each other (at least 3 weeks apart)
    const spacedMonths: { label: string; weekIdx: number }[] = [];
    let lastRecordedWeek = -4;
    for (const m of months) {
      if (m.weekIdx - lastRecordedWeek >= 3 && m.weekIdx < 50) {
        spacedMonths.push(m);
        lastRecordedWeek = m.weekIdx;
      }
    }

    return { weeks: weeksList, monthLabels: spacedMonths, totalSolvedYear, activeDaysCount };
  }, [heatmapData]);

  const getIntensityClass = (solved: number) => {
    if (solved === 0) {
      return 'bg-slate-100 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/50 hover:border-emerald-400';
    }
    if (solved <= 3) {
      return 'bg-emerald-200 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:scale-125';
    }
    if (solved <= 7) {
      return 'bg-emerald-400 dark:bg-emerald-800 border-emerald-500 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 hover:scale-125';
    }
    if (solved <= 14) {
      return 'bg-emerald-500 dark:bg-emerald-600 border-emerald-600 dark:border-emerald-400 text-white hover:scale-125';
    }
    return 'bg-emerald-600 dark:bg-emerald-400 border-emerald-700 dark:border-emerald-300 text-white dark:text-black font-bold hover:scale-125';
  };

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0f1523] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800/90 space-y-5 shadow-lg transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/60">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{totalSolvedYear}</span> solved past year
          </div>
          <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{activeDaysCount}</span> active days
          </div>
        </div>
      </div>

      {/* Heatmap Grid View */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[760px] space-y-2">
          {/* Month Labels Bar */}
          <div className="relative h-4 ml-8 text-[11px] font-bold text-slate-400 dark:text-slate-400 select-none">
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                className="absolute transform -translate-x-1"
                style={{ left: `${(m.weekIdx / 52) * 100}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid + Weekday Labels */}
          <div className="flex items-start gap-2">
            {/* Weekday indicators (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[10px] font-bold text-slate-400 dark:text-slate-400 pr-1 h-[104px] select-none py-1">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* 52 columns of 7 squares */}
            <div className="flex gap-[3.5px] flex-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3.5px]">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredDay(day)}
                      onClick={() => setHoveredDay(day)}
                      className={`w-3 h-3 sm:w-[13px] sm:h-[13px] rounded-[3px] border transition-all duration-150 cursor-pointer ${getIntensityClass(
                        day.solved
                      )}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip & Legend Bar */}
      <div className="p-3.5 bg-slate-50 dark:bg-[#151c2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        {/* Dynamic Hover Status */}
        <div className="min-h-[22px] flex items-center">
          {hoveredDay ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                {formatDate(hoveredDay.date)}:
              </span>
              {hoveredDay.total === 0 ? (
                <span className="text-slate-500 dark:text-slate-400 font-medium">No training recorded</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    {hoveredDay.solved} solved
                  </span>
                  {hoveredDay.failed > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                      {hoveredDay.failed} failed
                    </span>
                  )}
                  <span className="text-slate-500 dark:text-slate-400 font-semibold font-mono">
                    ({hoveredDay.accuracy}% accuracy)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-400 font-medium">
              Hover over or tap any day to inspect positions solved and accuracy.
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-400 select-none">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-200 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 dark:bg-emerald-800 border border-emerald-500 dark:border-emerald-600" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-400" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600 dark:bg-emerald-400 border border-emerald-700 dark:border-emerald-300" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
