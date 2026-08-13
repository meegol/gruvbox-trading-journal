import React, { useState } from 'react';
import type { Trade } from '../types/journal';
import { groupTradesByCalendarMonth } from '../utils/calculations';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';


interface CalendarGridProps {
  trades: Trade[];
  onSelectDay: (dateStr: string, trades: Trade[]) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({ trades, onSelectDay }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Compute map of daily summaries for current month
  const monthMap = groupTradesByCalendarMonth(trades, currentYear, currentMonth);

  // Calendar math
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Monthly aggregated totals
  let monthlyTotalPnl = 0;
  let monthlyTradeCount = 0;
  let monthlyWinCount = 0;
  let monthlyLossCount = 0;
  let bestDayPnl = -Infinity;
  let worstDayPnl = Infinity;

  monthMap.forEach((summary) => {
    monthlyTotalPnl += summary.pnl;
    monthlyTradeCount += summary.tradeCount;
    monthlyWinCount += summary.winCount;
    monthlyLossCount += summary.lossCount;
    if (summary.pnl > bestDayPnl) bestDayPnl = summary.pnl;
    if (summary.pnl < worstDayPnl) worstDayPnl = summary.pnl;
  });

  const activeDaysCount = monthMap.size;
  const monthlyWinRate = monthlyTradeCount > 0 ? (monthlyWinCount / monthlyTradeCount) * 100 : 0;
  const isMonthlyPositive = monthlyTotalPnl >= 0;

  // Build grid calendar cells array
  const calendarCells = [];
  // Empty leading cells
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
    calendarCells.push({
      dayNumber: day,
      dateStr,
      summary: monthMap.get(dateStr) || null,
    });
  }

  return (
    <div className="glass-panel p-5 md:p-6 transition-all">
      {/* Calendar Header & Month Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[var(--gruv-bg)] border border-[var(--gruv-border)] text-[var(--gruv-yellow)]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-[var(--gruv-fg)] font-ndot tracking-wider">
              PnL CALENDAR
            </h2>
            <p className="text-xs text-[var(--gruv-muted)] font-mono">
              Daily Profit &amp; Loss breakdown
            </p>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center space-x-2 bg-[var(--gruv-surface)] p-1 rounded-xl border border-[var(--gruv-border)]">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-[var(--gruv-bg)] text-[var(--gruv-fg)] transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-ndot font-bold text-sm text-[var(--gruv-fg)] px-3 min-w-[140px] text-center tracking-wider">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>


          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-[var(--gruv-bg)] text-[var(--gruv-fg)] transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleGoToday}
            className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-[var(--gruv-bg)] text-[var(--gruv-yellow)] hover:bg-[var(--gruv-yellow)]/10 transition-colors border border-[var(--gruv-border)]"
          >
            Today
          </button>
        </div>
      </div>

      {/* Monthly Performance Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-3 bg-[var(--gruv-bg)]/60 rounded-xl border border-[var(--gruv-border)] font-mono text-xs">
        <div>
          <span className="text-[var(--gruv-muted)] block text-[10px] uppercase">Monthly PnL</span>
          <span className={`font-bold text-sm md:text-base ${isMonthlyPositive ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
            {isMonthlyPositive ? '+' : ''}${monthlyTotalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div>
          <span className="text-[var(--gruv-muted)] block text-[10px] uppercase">Win Rate &amp; Trades</span>
          <span className="font-bold text-sm md:text-base text-[var(--gruv-fg)]">
            {monthlyWinRate.toFixed(1)}% <span className="text-[var(--gruv-muted)] font-normal">({monthlyTradeCount} trades)</span>
          </span>
        </div>

        <div>
          <span className="text-[var(--gruv-muted)] block text-[10px] uppercase">Active Trading Days</span>
          <span className="font-bold text-sm md:text-base text-[var(--gruv-yellow)]">
            {activeDaysCount} Days
          </span>
        </div>

        <div>
          <span className="text-[var(--gruv-muted)] block text-[10px] uppercase">Best / Worst Day</span>
          <span className="font-bold text-xs text-[var(--gruv-fg)]">
            <span className="text-[var(--gruv-green)]">+{bestDayPnl === -Infinity ? '$0' : `$${bestDayPnl.toFixed(0)}`}</span>
            {' / '}
            <span className="text-[var(--gruv-red)]">{worstDayPnl === Infinity ? '$0' : `$${worstDayPnl.toFixed(0)}`}</span>
          </span>
        </div>
      </div>

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 text-center font-mono text-xs font-bold text-[var(--gruv-muted)] mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="py-1 uppercase tracking-wider text-[10px] md:text-xs">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
        {calendarCells.map((cell, idx) => {
          if (!cell) {
            return (
              <div
                key={`empty-${idx}`}
                className="h-20 md:h-24 rounded-xl bg-[var(--gruv-bg)]/20 border border-transparent"
              />
            );
          }

          const { dayNumber, dateStr, summary } = cell;
          const isTodayCell =
            today.getFullYear() === currentYear &&
            today.getMonth() === currentMonth &&
            today.getDate() === dayNumber;

          const hasTrades = summary && summary.tradeCount > 0;
          const isWinDay = hasTrades && summary.pnl > 0.01;
          const isLossDay = hasTrades && summary.pnl < -0.01;

          return (
            <div
              key={dateStr}
              onClick={() => {
                if (hasTrades) {
                  onSelectDay(dateStr, summary.trades);
                }
              }}
              className={`h-20 md:h-24 rounded-xl p-2 font-mono flex flex-col justify-between transition-all duration-200 border relative ${
                hasTrades ? 'cursor-pointer hover:scale-[1.03] shadow-md' : 'opacity-60'
              } ${
                isWinDay
                  ? 'bg-[var(--gruv-green)]/15 border-[var(--gruv-green)]/40 hover:border-[var(--gruv-green)] hover:shadow-[var(--gruv-green)]/20'
                  : isLossDay
                  ? 'bg-[var(--gruv-red)]/15 border-[var(--gruv-red)]/40 hover:border-[var(--gruv-red)] hover:shadow-[var(--gruv-red)]/20'
                  : hasTrades
                  ? 'bg-[var(--gruv-surface)] border-[var(--gruv-border)]'
                  : 'bg-[var(--gruv-bg)]/40 border-[var(--gruv-border)]/50'
              } ${isTodayCell ? 'ring-2 ring-[var(--gruv-yellow)]' : ''}`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isTodayCell ? 'text-[var(--gruv-yellow)] font-extrabold' : 'text-[var(--gruv-fg)]'}`}>
                  {dayNumber}
                </span>
                {hasTrades && (
                  <span className="text-[9px] md:text-[10px] px-1.5 py-0.2 rounded font-bold bg-[var(--gruv-bg)] text-[var(--gruv-muted)] border border-[var(--gruv-border)]">
                    {summary.tradeCount}T
                  </span>
                )}
              </div>

              {/* Day Content */}
              {hasTrades ? (
                <div className="my-auto text-right">
                  <div className={`text-xs md:text-sm font-bold font-ndot tracking-wider truncate ${isWinDay ? 'text-[var(--gruv-green)]' : isLossDay ? 'text-[var(--gruv-red)]' : 'text-[var(--gruv-fg)]'}`}>
                    {summary.pnl >= 0 ? '+' : ''}${summary.pnl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>


                  {summary.netR !== 0 && (
                    <div className="text-[9px] text-[var(--gruv-muted)] font-mono">
                      {summary.netR > 0 ? '+' : ''}{summary.netR.toFixed(1)}R
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-[var(--gruv-muted)]/40 text-center my-auto font-mono">
                  -
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
