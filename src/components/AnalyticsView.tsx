import React from 'react';
import type { Trade } from '../types/journal';
import { computeTagStats, computeEmotionStats } from '../utils/calculations';
import { Tag, Brain } from 'lucide-react';


interface AnalyticsViewProps {
  trades: Trade[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ trades }) => {
  const tagStats = computeTagStats(trades);
  const emotionStats = computeEmotionStats(trades);

  if (trades.length === 0) {
    return (
      <div className="glass-panel p-6 text-center text-[var(--gruv-muted)] font-mono text-xs">
        Log trades to view strategy &amp; psychological performance analytics.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
      
      {/* 1. Strategy & Tag Performance */}
      <div className="glass-panel p-5 md:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[var(--gruv-bg)] text-[var(--gruv-yellow)] border border-[var(--gruv-border)]">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[var(--gruv-fg)]">SETUP &amp; TAG PROFITABILITY</h2>
            <p className="text-[11px] text-[var(--gruv-muted)]">Performance breakdown by strategy tag</p>
          </div>
        </div>

        <div className="space-y-3">
          {tagStats.map((stat, idx) => {
            const isPos = stat.pnl >= 0;
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[var(--gruv-bg)]/60 border border-[var(--gruv-border)] flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-sm text-[var(--gruv-yellow)]">#{stat.tag}</span>
                  <div className="text-[10px] text-[var(--gruv-muted)] mt-0.5">
                    {stat.count} trades • {stat.winRate.toFixed(1)}% Win Rate
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold text-sm ${isPos ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                    {isPos ? '+' : ''}${stat.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Psychological & Emotional Cost Analysis */}
      <div className="glass-panel p-5 md:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[var(--gruv-bg)] text-[var(--gruv-orange)] border border-[var(--gruv-border)]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[var(--gruv-fg)]">PSYCHOLOGY &amp; EMOTION ANALYSIS</h2>
            <p className="text-[11px] text-[var(--gruv-muted)]">Quantifying the impact of discipline vs FOMO</p>
          </div>
        </div>

        <div className="space-y-3">
          {emotionStats.map((stat, idx) => {
            const isPos = stat.pnl >= 0;
            const isNegativeEmotion = stat.emotion === 'FOMO' || stat.emotion === 'Revenge' || stat.emotion === 'Hesitant';
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between ${
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
                  <div className={`font-bold text-sm ${isPos ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                    {isPos ? '+' : ''}${stat.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
