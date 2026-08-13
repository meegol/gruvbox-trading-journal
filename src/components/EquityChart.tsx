import React from 'react';
import type { Trade } from '../types/journal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';


interface EquityChartProps {
  trades: Trade[];
  initialBalance: number;
}

export const EquityChart: React.FC<EquityChartProps> = ({ trades, initialBalance }) => {
  if (trades.length === 0) {
    return (
      <div className="glass-panel p-6 text-center text-[var(--gruv-muted)] font-mono text-xs">
        No trade history available yet to render equity curve.
      </div>
    );
  }

  // Sort trades chronologically
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );

  let runningEquity = initialBalance;
  let peakEquity = initialBalance;

  const chartData = [
    {
      date: 'Start',
      equity: initialBalance,
      drawdown: 0,
      pnl: 0,
    },
    ...sortedTrades.map((t, idx) => {
      runningEquity += t.pnl;
      if (runningEquity > peakEquity) peakEquity = runningEquity;
      const drawdown = peakEquity - runningEquity;
      const d = new Date(t.entryDate);
      const dateLabel = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

      return {
        tradeIndex: idx + 1,
        date: dateLabel,
        symbol: t.symbol,
        equity: runningEquity,
        drawdown: -drawdown, // negative for visual bottom fill
        pnl: t.pnl,
      };
    }),
  ];

  return (
    <div className="glass-panel p-5 md:p-6 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[var(--gruv-bg)] border border-[var(--gruv-border)] text-[var(--gruv-green)]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-[var(--gruv-fg)] font-mono tracking-tight">
              EQUITY &amp; DRAWDOWN TRAJECTORY
            </h2>
            <p className="text-xs text-[var(--gruv-muted)] font-mono">
              Account Growth over time (${initialBalance.toLocaleString()} starting capital)
            </p>
          </div>
        </div>
      </div>

      <div className="h-64 md:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b8bb26" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#b8bb26" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb4934" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#fb4934" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(60, 56, 54, 0.4)" vertical={false} />

            <XAxis 
              dataKey="date" 
              stroke="#a89984" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
            />

            <YAxis 
              stroke="#a89984" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              domain={['auto', 'auto']}
              tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
            />

            <Tooltip 
              contentStyle={{
                backgroundColor: '#282828',
                borderColor: '#3c3836',
                borderRadius: '0.75rem',
                color: '#ebdbb2',
                fontFamily: 'monospace',
                fontSize: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              }}
              formatter={(value: any, name: any) => {
                if (name === 'equity') return [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Account Equity'];
                if (name === 'drawdown') return [`$${Math.abs(Number(value)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Drawdown'];
                return [value, name];
              }}
            />

            <Area
              type="monotone"
              dataKey="equity"
              stroke="#b8bb26"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
