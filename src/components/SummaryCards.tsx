import React from 'react';
import type { TradingStats } from '../types/journal';
import { DollarSign, Percent, Scale, TrendingUp, ArrowDownRight, Zap } from 'lucide-react';


interface SummaryCardsProps {
  stats: TradingStats;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  const isPnlPositive = stats.totalPnl >= 0;

  const cardItems = [
    {
      title: 'TOTAL PnL',
      value: `${isPnlPositive ? '+' : ''}$${stats.totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `Net after $${stats.totalFees.toFixed(2)} fees`,
      color: isPnlPositive ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]',
      borderColor: isPnlPositive ? 'hover:border-[var(--gruv-green)]/40' : 'hover:border-[var(--gruv-red)]/40',
      icon: DollarSign,
    },
    {
      title: 'WIN RATE',
      value: `${stats.winRate.toFixed(1)}%`,
      subtitle: `${stats.winCount}W - ${stats.lossCount}L - ${stats.breakevenCount}BE`,
      color: stats.winRate >= 50 ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-orange)]',
      borderColor: 'hover:border-[var(--gruv-yellow)]/40',
      icon: Percent,
    },
    {
      title: 'PROFIT FACTOR',
      value: stats.profitFactor >= 99 ? '∞' : stats.profitFactor.toFixed(2),
      subtitle: stats.profitFactor >= 1.5 ? 'Strong Expectancy' : 'Needs Optimization',
      color: stats.profitFactor >= 1.5 ? 'text-[var(--gruv-green)]' : stats.profitFactor >= 1.0 ? 'text-[var(--gruv-yellow)]' : 'text-[var(--gruv-red)]',
      borderColor: 'hover:border-[var(--gruv-yellow)]/40',
      icon: Scale,
    },
    {
      title: 'AVG WIN / LOSS',
      value: `$${stats.avgWin.toFixed(0)} / $${stats.avgLoss.toFixed(0)}`,
      subtitle: `Ratio: ${stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : '1.00'}x`,
      color: 'text-[var(--gruv-blue)]',
      borderColor: 'hover:border-[var(--gruv-blue)]/40',
      icon: TrendingUp,
    },
    {
      title: 'AVG R-MULTIPLE',
      value: `${stats.avgRMultiple >= 0 ? '+' : ''}${stats.avgRMultiple.toFixed(2)}R`,
      subtitle: `Expectancy: $${stats.expectancy.toFixed(2)} / trade`,
      color: stats.avgRMultiple >= 1.0 ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-fg)]',
      borderColor: 'hover:border-[var(--gruv-yellow)]/40',
      icon: Zap,
    },
    {
      title: 'MAX DRAWDOWN',
      value: `$${stats.maxDrawdownAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${stats.maxDrawdownPercent.toFixed(2)}% peak decline`,
      color: stats.maxDrawdownAmount > 0 ? 'text-[var(--gruv-red)]' : 'text-[var(--gruv-muted)]',
      borderColor: 'hover:border-[var(--gruv-red)]/40',
      icon: ArrowDownRight,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {cardItems.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`glass-panel glass-panel-hover p-4 flex flex-col justify-between ${card.borderColor}`}
          >
            <div className="flex items-center justify-between text-[var(--gruv-muted)] mb-2">
              <span className="text-[10px] md:text-xs font-mono font-bold tracking-wider uppercase">
                {card.title}
              </span>
              <IconComponent className="w-4 h-4 opacity-70" />
            </div>

            <div className={`text-base md:text-lg lg:text-xl font-bold font-mono ${card.color} truncate`}>
              {card.value}
            </div>

            <div className="text-[10px] md:text-xs font-mono text-[var(--gruv-muted)] mt-1 truncate">
              {card.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
};
