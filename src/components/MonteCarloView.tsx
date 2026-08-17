import React, { useState, useMemo } from 'react';
import type { Account, Trade } from '../types/journal';
import { runMonteCarloSimulation } from '../utils/monteCarlo';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Target,
  Zap,
  Sliders,
  Terminal,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface MonteCarloViewProps {
  account: Account | null;
  trades: Trade[];
}

export const MonteCarloView: React.FC<MonteCarloViewProps> = ({ account, trades }) => {
  const [numSimulations, setNumSimulations] = useState<number>(2000);
  const [tradeHorizon, setTradeHorizon] = useState<number>(50);
  const [winRateAdjustment, setWinRateAdjustment] = useState<number>(0);
  const [rrMultiplier, setRrMultiplier] = useState<number>(1.0);
  const [showSamplePaths, setShowSamplePaths] = useState<boolean>(true);

  // Run Monte Carlo simulation in real-time
  const simResult = useMemo(() => {
    return runMonteCarloSimulation(
      trades,
      account,
      numSimulations,
      tradeHorizon,
      winRateAdjustment,
      rrMultiplier
    );
  }, [trades, account, numSimulations, tradeHorizon, winRateAdjustment, rrMultiplier]);

  const targetPnl = account?.profitTarget || 2500;
  const initialBal = account?.currentBalance || 50000;
  const targetBal = initialBal + targetPnl;
  const ruinBal = initialBal - (account?.dailyLossLimit || account?.maxDrawdown || 1384.55);

  const resetSliders = () => {
    setNumSimulations(2000);
    setTradeHorizon(50);
    setWinRateAdjustment(0);
    setRrMultiplier(1.0);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 border border-[var(--gruv-yellow)]/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Activity className="w-36 h-36 text-[var(--gruv-yellow)]" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--gruv-green)] animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gruv-yellow)] bg-[var(--gruv-yellow)]/15 px-2 py-0.5 rounded border border-[var(--gruv-yellow)]/30">
                QUANTUM RISK MATRIX v4.2
              </span>
            </div>
            <h2 className="font-bold text-2xl text-[var(--gruv-fg)] font-ndot tracking-wider mt-1">
              LIVE MONTE CARLO SIMULATOR
            </h2>
            <p className="text-xs text-[var(--gruv-muted)] mt-0.5">
              Simulating {simResult.simulationsCount.toLocaleString()} parallel market trajectories using Rithmic HFT trade distribution models.
            </p>
          </div>

          <button
            onClick={resetSliders}
            className="px-3 py-2 rounded-xl bg-[var(--gruv-bg)] border border-[var(--gruv-border)] hover:border-[var(--gruv-yellow)] text-[var(--gruv-fg)] flex items-center space-x-2 font-bold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Controls</span>
          </button>
        </div>
      </div>

      {/* Top 4 Quant LARP Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pass Probability */}
        <div className="glass-panel p-4 border-l-4 border-l-[var(--gruv-green)]">
          <div className="flex items-center justify-between text-[var(--gruv-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">PASS PROBABILITY</span>
            <Target className="w-4 h-4 text-[var(--gruv-green)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--gruv-green)]">
            {simResult.passProbability.toFixed(1)}%
          </div>
          <div className="text-[10px] text-[var(--gruv-muted)] mt-1">
            Reaching +${targetPnl.toLocaleString()} before breaching EOD limit
          </div>
          <div className="w-full bg-[var(--gruv-bg-soft)] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[var(--gruv-green)] h-full transition-all duration-500"
              style={{ width: `${Math.min(100, simResult.passProbability)}%` }}
            />
          </div>
        </div>

        {/* Risk of Ruin */}
        <div className="glass-panel p-4 border-l-4 border-l-[var(--gruv-red)]">
          <div className="flex items-center justify-between text-[var(--gruv-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">RISK OF RUIN</span>
            {simResult.riskOfRuin < 5 ? (
              <ShieldCheck className="w-4 h-4 text-[var(--gruv-green)]" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-[var(--gruv-red)]" />
            )}
          </div>
          <div className={`text-2xl font-bold font-mono ${simResult.riskOfRuin < 5 ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
            {simResult.riskOfRuin.toFixed(1)}%
          </div>
          <div className="text-[10px] text-[var(--gruv-muted)] mt-1">
            {simResult.riskOfRuin < 5 ? 'Low Breach Risk (Institutional Level)' : 'High Volatility Warning'}
          </div>
          <div className="w-full bg-[var(--gruv-bg-soft)] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${simResult.riskOfRuin < 5 ? 'bg-[var(--gruv-green)]' : 'bg-[var(--gruv-red)]'}`}
              style={{ width: `${Math.min(100, simResult.riskOfRuin)}%` }}
            />
          </div>
        </div>

        {/* Median Trades to Pass */}
        <div className="glass-panel p-4 border-l-4 border-l-[var(--gruv-yellow)]">
          <div className="flex items-center justify-between text-[var(--gruv-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">EXPECTED TRADES</span>
            <Zap className="w-4 h-4 text-[var(--gruv-yellow)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--gruv-yellow)]">
            {simResult.medianTradesToPass ? `${simResult.medianTradesToPass} Trades` : 'N/A'}
          </div>
          <div className="text-[10px] text-[var(--gruv-muted)] mt-1">
            Median velocity to target completion
          </div>
        </div>

        {/* 95th Percentile Moonshot Outcome */}
        <div className="glass-panel p-4 border-l-4 border-l-[var(--gruv-blue)]">
          <div className="flex items-center justify-between text-[var(--gruv-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">95TH PERCENTILE OUTCOME</span>
            <TrendingUp className="w-4 h-4 text-[var(--gruv-blue)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--gruv-blue)]">
            ${simResult.p95thOutcome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-[var(--gruv-muted)] mt-1">
            Top 5% bullish path target projection
          </div>
        </div>

      </div>

      {/* Main Graph & Control Sliders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Recharts Multi-Path Equity Visualizer (2 Cols) */}
        <div className="glass-panel p-5 lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--gruv-border)] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[var(--gruv-fg)] flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[var(--gruv-yellow)]" />
                <span>PARALLEL EQUITY TRAJECTORIES ({simResult.tradeHorizon} TRADES FORWARD)</span>
              </h3>
              <p className="text-[11px] text-[var(--gruv-muted)]">
                Showing 5th, 50th (Median), 95th Percentile outcomes &amp; 10 live sampled trader paths
              </p>
            </div>

            <button
              onClick={() => setShowSamplePaths(!showSamplePaths)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                showSamplePaths
                  ? 'bg-[var(--gruv-yellow)]/20 text-[var(--gruv-yellow)] border-[var(--gruv-yellow)]'
                  : 'bg-[var(--gruv-bg)] text-[var(--gruv-muted)] border-[var(--gruv-border)]'
              }`}
            >
              {showSamplePaths ? 'Hide Sample Trajectories' : 'Show Sample Trajectories'}
            </button>
          </div>

          <div className="h-[360px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simResult.chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <XAxis
                  dataKey="trade"
                  stroke="var(--gruv-muted)"
                  fontSize={10}
                  tickFormatter={(val) => `T+${val}`}
                />
                <YAxis
                  stroke="var(--gruv-muted)"
                  fontSize={10}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1d2021',
                    borderColor: 'var(--gruv-border)',
                    borderRadius: '12px',
                    color: 'var(--gruv-fg)',
                    fontSize: '11px',
                  }}
                  formatter={(value: any, name: any) => [
                    `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    name === 'p50th'
                      ? '50th Percentile (Median)'
                      : name === 'p95th'
                      ? '95th Percentile (Bull)'
                      : name === 'p5th'
                      ? '5th Percentile (Bear)'
                      : name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  formatter={(value) =>
                    value === 'p50th'
                      ? 'Median Path (50th %ile)'
                      : value === 'p95th'
                      ? 'Bull Path (95th %ile)'
                      : value === 'p5th'
                      ? 'Bear Path (5th %ile)'
                      : value
                  }
                />

                {/* Target & Drawdown Reference Lines */}
                <ReferenceLine
                  y={targetBal}
                  stroke="var(--gruv-green)"
                  strokeDasharray="4 4"
                  label={{ value: `Target +$${targetPnl.toLocaleString()}`, fill: 'var(--gruv-green)', fontSize: 10, position: 'top' }}
                />
                <ReferenceLine
                  y={ruinBal}
                  stroke="var(--gruv-red)"
                  strokeDasharray="4 4"
                  label={{ value: `Ruin Floor`, fill: 'var(--gruv-red)', fontSize: 10, position: 'bottom' }}
                />

                {/* Sample Trader Trajectories */}
                {showSamplePaths &&
                  Array.from({ length: 10 }).map((_, idx) => (
                    <Line
                      key={`path_${idx + 1}`}
                      type="monotone"
                      dataKey={`path_${idx + 1}`}
                      stroke="#83a598"
                      strokeWidth={1}
                      strokeOpacity={0.25}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}

                {/* Percentile Trajectories */}
                <Line type="monotone" dataKey="p5th" stroke="var(--gruv-red)" strokeWidth={2} dot={false} name="p5th" />
                <Line type="monotone" dataKey="p50th" stroke="var(--gruv-yellow)" strokeWidth={3} dot={false} name="p50th" />
                <Line type="monotone" dataKey="p95th" stroke="var(--gruv-green)" strokeWidth={2} dot={false} name="p95th" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quant LARP Controls & Parameter Tweaker (1 Col) */}
        <div className="glass-panel p-5 space-y-5">
          <div className="flex items-center space-x-2 border-b border-[var(--gruv-border)] pb-3">
            <Sliders className="w-4 h-4 text-[var(--gruv-yellow)]" />
            <h3 className="font-bold text-sm text-[var(--gruv-fg)]">SIMULATION CONTROLS</h3>
          </div>

          <div className="space-y-4">
            {/* Simulations Count */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--gruv-muted)] font-bold">Simulations Count</span>
                <span className="text-[var(--gruv-yellow)] font-bold">{numSimulations.toLocaleString()} paths</span>
              </div>
              <input
                type="range"
                min={100}
                max={5000}
                step={100}
                value={numSimulations}
                onChange={(e) => setNumSimulations(Number(e.target.value))}
                className="w-full accent-[var(--gruv-yellow)] bg-[var(--gruv-bg-soft)] rounded-lg h-2"
              />
            </div>

            {/* Trade Horizon */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--gruv-muted)] font-bold">Trade Horizon (Trades Forward)</span>
                <span className="text-[var(--gruv-yellow)] font-bold">{tradeHorizon} trades</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={tradeHorizon}
                onChange={(e) => setTradeHorizon(Number(e.target.value))}
                className="w-full accent-[var(--gruv-yellow)] bg-[var(--gruv-bg-soft)] rounded-lg h-2"
              />
            </div>

            {/* Win Rate Stress Test */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--gruv-muted)] font-bold">Win Rate Stress Shift</span>
                <span className={`font-bold ${winRateAdjustment >= 0 ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                  {winRateAdjustment > 0 ? '+' : ''}{winRateAdjustment}% ({(simResult.winRate).toFixed(1)}%)
                </span>
              </div>
              <input
                type="range"
                min={-20}
                max={20}
                step={1}
                value={winRateAdjustment}
                onChange={(e) => setWinRateAdjustment(Number(e.target.value))}
                className="w-full accent-[var(--gruv-yellow)] bg-[var(--gruv-bg-soft)] rounded-lg h-2"
              />
            </div>

            {/* R:R Multiplier */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--gruv-muted)] font-bold">Risk/Reward Multiplier</span>
                <span className="text-[var(--gruv-yellow)] font-bold">{rrMultiplier.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={rrMultiplier}
                onChange={(e) => setRrMultiplier(Number(e.target.value))}
                className="w-full accent-[var(--gruv-yellow)] bg-[var(--gruv-bg-soft)] rounded-lg h-2"
              />
            </div>
          </div>

          {/* Statistical Breakdown Box */}
          <div className="p-3 rounded-xl bg-[var(--gruv-bg)]/80 border border-[var(--gruv-border)] space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[var(--gruv-muted)]">Historical Win Rate:</span>
              <span className="font-bold text-[var(--gruv-fg)]">{simResult.winRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--gruv-muted)]">Simulated Profit Factor:</span>
              <span className="font-bold text-[var(--gruv-fg)]">{simResult.profitFactor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--gruv-muted)]">Average Win / Loss:</span>
              <span className="font-bold text-[var(--gruv-fg)]">${simResult.avgWin.toFixed(0)} / -${simResult.avgLoss.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--gruv-muted)]">Expected Max DD:</span>
              <span className="font-bold text-[var(--gruv-red)]">-${simResult.expectedMaxDrawdown.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Quant LARP Terminal Output Window */}
      <div className="glass-panel p-5 space-y-3 font-mono">
        <div className="flex items-center space-x-2 border-b border-[var(--gruv-border)] pb-2 text-[var(--gruv-yellow)] font-bold text-xs">
          <Terminal className="w-4 h-4" />
          <span>QUANTUM TENSOR EXECUTION LOGS</span>
        </div>

        <div className="p-4 rounded-xl bg-[#1d2021] text-[var(--gruv-yellow)] space-y-1.5 text-[11px] font-mono overflow-x-auto border border-[var(--gruv-border)]">
          {simResult.larpLogs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-[var(--gruv-muted)] flex-shrink-0">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
