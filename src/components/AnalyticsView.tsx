import React from 'react';
import type { Trade } from '../types/journal';
import { computeEmotionStats, computeSessionStats } from '../utils/calculations';
import { Brain, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

interface AnalyticsViewProps {
  trades: Trade[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ trades }) => {
  const emotionStats = computeEmotionStats(trades);
  const sessionStats = computeSessionStats(trades);

  const longTrades = trades.filter((t) => t.direction === 'long');
  const shortTrades = trades.filter((t) => t.direction === 'short');

  const longWins = longTrades.filter((t) => t.pnl > 0.01).length;
  const shortWins = shortTrades.filter((t) => t.pnl > 0.01).length;

  const longWinRate = longTrades.length > 0 ? (longWins / longTrades.length) * 100 : 0;
  const shortWinRate = shortTrades.length > 0 ? (shortWins / shortTrades.length) * 100 : 0;

  const longPnl = longTrades.reduce((sum, t) => sum + t.pnl, 0);
  const shortPnl = shortTrades.reduce((sum, t) => sum + t.pnl, 0);

  if (trades.length === 0) {
    return (
      <div className="glass-panel p-6 text-center text-[var(--gruv-muted)] font-mono text-xs">
        Log trades to view psychological mindset, session, and direction execution analytics.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
      
      {/* 1. Trading Session Breakdown */}
      <div className="glass-panel p-5 md:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[var(--gruv-bg)] text-[var(--gruv-yellow)] border border-[var(--gruv-border)]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[var(--gruv-fg)] font-mono tracking-wider">SESSION PROFITABILITY</h2>
            <p className="text-[11px] text-[var(--gruv-muted)]">NY AM vs NY PM vs London</p>
          </div>
        </div>

        <div className="space-y-3">
          {sessionStats.map((stat, idx) => {
            const isPos = stat.pnl >= 0;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[var(--gruv-bg)]/60 border border-[var(--gruv-border)] flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-sm text-[var(--gruv-yellow)]">{stat.session}</span>
                  <div className="text-[10px] text-[var(--gruv-muted)] mt-0.5">
                    {stat.count} trades • {stat.winRate.toFixed(1)}% Win Rate
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold text-sm font-mono ${isPos ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                    {isPos ? '+' : ''}${stat.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Psychological & Execution Mindset Analysis */}
      <div className="glass-panel p-5 md:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[var(--gruv-bg)] text-[var(--gruv-orange)] border border-[var(--gruv-border)]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[var(--gruv-fg)] font-mono tracking-wider">PSYCHOLOGY &amp; MINDSET</h2>
            <p className="text-[11px] text-[var(--gruv-muted)]">Discipline vs FOMO or revenge trading</p>
          </div>
        </div>

        <div className="space-y-3">
          {emotionStats.map((stat, idx) => {
            const isPos = stat.pnl >= 0;
            const isNegativeEmotion = stat.emotion === 'FOMO' || stat.emotion === 'Revenge' || stat.emotion === 'Hesitant';
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isNegativeEmotion
                    ? 'bg-[var(--gruv-red)]/10 border-[var(--gruv-red)]/40'
                    : 'bg-[var(--gruv-bg)]/60 border-[var(--gruv-border)]'
                }`}
              >
                <div>
                  <span className={`font-bold text-sm ${isNegativeEmotion ? 'text-[var(--gruv-red)]' : 'text-[var(--gruv-green)]'}`}>
                    {stat.emotion}
                  </span>
                  <div className="text-[10px] text-[var(--gruv-muted)] mt-0.5">
                    {stat.count} trades • {stat.winRate.toFixed(1)}% Win Rate
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold text-sm font-mono ${isPos ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                    {isPos ? '+' : ''}${stat.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Long vs Short Direction Comparison */}
      <div className="glass-panel p-5 md:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[var(--gruv-bg)] text-[var(--gruv-blue)] border border-[var(--gruv-border)]">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[var(--gruv-fg)] font-mono tracking-wider">LONG VS SHORT</h2>
            <p className="text-[11px] text-[var(--gruv-muted)] font-mono">Directional performance</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--gruv-bg)]/60 border border-[var(--gruv-border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[var(--gruv-blue)] flex items-center space-x-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>LONG TRADES ({longTrades.length})</span>
              </span>
              <span className={`font-bold text-sm font-mono ${longPnl >= 0 ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                {longPnl >= 0 ? '+' : ''}${longPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-[11px] text-[var(--gruv-muted)] flex justify-between">
              <span>Win Rate: {longWinRate.toFixed(1)}% ({longWins}W)</span>
              <span>Avg PnL: ${longTrades.length > 0 ? (longPnl / longTrades.length).toFixed(2) : '0.00'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--gruv-bg)]/60 border border-[var(--gruv-border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[var(--gruv-purple)] flex items-center space-x-1">
                <ArrowDownRight className="w-4 h-4" />
                <span>SHORT TRADES ({shortTrades.length})</span>
              </span>
              <span className={`font-bold text-sm font-mono ${shortPnl >= 0 ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                {shortPnl >= 0 ? '+' : ''}${shortPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-[11px] text-[var(--gruv-muted)] flex justify-between">
              <span>Win Rate: {shortWinRate.toFixed(1)}% ({shortWins}W)</span>
              <span>Avg PnL: ${shortTrades.length > 0 ? (shortPnl / shortTrades.length).toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};
