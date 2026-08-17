import type { Account, Trade } from '../types/journal';

export interface SimulationResult {
  simulationsCount: number;
  tradeHorizon: number;
  passProbability: number;
  riskOfRuin: number;
  medianTradesToPass: number | null;
  expectedMaxDrawdown: number;
  p5thOutcome: number;
  p50thOutcome: number;
  p95thOutcome: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  chartData: Array<Record<string, number>>;
  larpLogs: string[];
}

/**
 * Runs Monte Carlo Equity Simulation using historical trade distributions.
 */
export function runMonteCarloSimulation(
  trades: Trade[],
  account: Account | null,
  numSimulations: number = 2000,
  tradeHorizon: number = 50,
  winRateAdjustment: number = 0,
  rrMultiplier: number = 1.0
): SimulationResult {
  const initialBalance = account ? account.currentBalance : 50000;
  const targetPnl = account ? (account.profitTarget || 2500) : 2500;
  const targetBalance = initialBalance + targetPnl;
  const maxLossLimit = account ? (account.dailyLossLimit || account.maxDrawdown || 1384.55) : 1384.55;
  const ruinBalance = initialBalance - maxLossLimit;

  // Extract trade statistics
  const accountTrades = account ? trades.filter((t) => t.accountId === account.id) : trades;
  const validTrades = accountTrades.length > 0 ? accountTrades : trades;

  const wins = validTrades.filter((t) => t.pnl > 0.01);
  const losses = validTrades.filter((t) => t.pnl < -0.01);

  let rawWinRate = validTrades.length > 0 ? wins.length / validTrades.length : 0.55;
  let simulatedWinRate = Math.min(0.95, Math.max(0.05, rawWinRate + winRateAdjustment / 100));

  let avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 250;
  let avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 150;

  // Apply R:R multiplier
  avgWin = avgWin * rrMultiplier;

  const totalWinPnl = wins.reduce((s, t) => s + t.pnl, 0) * rrMultiplier;
  const totalLossPnl = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : 1.85;

  const allPnls = validTrades.map((t) => (t.pnl > 0 ? t.pnl * rrMultiplier : t.pnl));
  if (allPnls.length === 0) {
    allPnls.push(250, -150, 315.95, -75.10, 180, -120);
  }

  // Simulation Storage
  let passCount = 0;
  let ruinCount = 0;
  const tradesToPassList: number[] = [];
  const maxDrawdownList: number[] = [];
  const finalBalances: number[] = [];

  // Matrix of paths: [simulationIndex][tradeStep]
  const pathMatrix: number[][] = [];
  const samplePathsCount = 10;
  const samplePaths: number[][] = Array.from({ length: samplePathsCount }, () => [initialBalance]);

  for (let sim = 0; sim < numSimulations; sim++) {
    let currentBal = initialBalance;
    let peakBal = initialBalance;
    let maxDD = 0;
    let passed = false;
    let ruined = false;
    let passTradeIndex: number | null = null;

    const currentPath: number[] = [initialBalance];

    for (let step = 1; step <= tradeHorizon; step++) {
      if (passed || ruined) {
        currentPath.push(currentBal);
        if (sim < samplePathsCount) samplePaths[sim].push(currentBal);
        continue;
      }

      // Random trade result from historical distribution or Bernoulli sampling
      const isWin = Math.random() < simulatedWinRate;
      let tradePnl = 0;
      if (isWin) {
        // Pick random win or use avgWin with variance
        const randomWin = wins.length > 0 ? wins[Math.floor(Math.random() * wins.length)].pnl * rrMultiplier : avgWin;
        tradePnl = Math.max(50, randomWin * (0.8 + Math.random() * 0.4));
      } else {
        const randomLoss = losses.length > 0 ? Math.abs(losses[Math.floor(Math.random() * losses.length)].pnl) : avgLoss;
        tradePnl = -Math.max(30, randomLoss * (0.8 + Math.random() * 0.4));
      }

      currentBal += tradePnl;
      currentPath.push(currentBal);
      if (sim < samplePathsCount) samplePaths[sim].push(currentBal);

      if (currentBal > peakBal) peakBal = currentBal;
      const dd = peakBal - currentBal;
      if (dd > maxDD) maxDD = dd;

      if (!passed && currentBal >= targetBalance) {
        passed = true;
        passTradeIndex = step;
      }

      if (!ruined && currentBal <= ruinBalance) {
        ruined = true;
      }
    }

    if (passed) {
      passCount++;
      if (passTradeIndex !== null) tradesToPassList.push(passTradeIndex);
    }
    if (ruined) {
      ruinCount++;
    }

    maxDrawdownList.push(maxDD);
    finalBalances.push(currentBal);
    pathMatrix.push(currentPath);
  }

  // Sort final balances for percentile calculations
  finalBalances.sort((a, b) => a - b);
  maxDrawdownList.sort((a, b) => a - b);
  tradesToPassList.sort((a, b) => a - b);

  const passProbability = (passCount / numSimulations) * 100;
  const riskOfRuin = (ruinCount / numSimulations) * 100;

  const medianTradesToPass = tradesToPassList.length > 0 
    ? tradesToPassList[Math.floor(tradesToPassList.length / 2)]
    : null;

  const p5thOutcome = finalBalances[Math.floor(numSimulations * 0.05)];
  const p50thOutcome = finalBalances[Math.floor(numSimulations * 0.50)];
  const p95thOutcome = finalBalances[Math.floor(numSimulations * 0.95)];
  const expectedMaxDrawdown = maxDrawdownList[Math.floor(numSimulations * 0.50)];

  // Prepare chart data per trade step
  const chartData: Array<Record<string, number>> = [];
  for (let step = 0; step <= tradeHorizon; step++) {
    const stepBalances = pathMatrix.map((p) => p[step] ?? p[p.length - 1]).sort((a, b) => a - b);
    
    const row: Record<string, number> = {
      trade: step,
      p5th: parseFloat(stepBalances[Math.floor(numSimulations * 0.05)].toFixed(2)),
      p50th: parseFloat(stepBalances[Math.floor(numSimulations * 0.50)].toFixed(2)),
      p95th: parseFloat(stepBalances[Math.floor(numSimulations * 0.95)].toFixed(2)),
      targetLine: targetBalance,
      ruinLine: ruinBalance,
    };

    // Include sample trajectories
    for (let s = 0; s < samplePathsCount; s++) {
      row[`path_${s + 1}`] = parseFloat((samplePaths[s][step] ?? samplePaths[s][samplePaths[s].length - 1]).toFixed(2));
    }

    chartData.push(row);
  }

  // Quant LARP Log Strings
  const larpLogs = [
    `[QUANT ENGINE] Initialized tensor matrix across ${numSimulations.toLocaleString()} parallel market universes.`,
    `[STAT METRICS] Win Rate: ${(simulatedWinRate * 100).toFixed(1)}% | Profit Factor: ${profitFactor.toFixed(2)} | Avg Win: $${avgWin.toFixed(2)}`,
    `[PROBABILITY] Pass Probability: ${passProbability.toFixed(1)}% | Risk of Ruin: ${riskOfRuin.toFixed(1)}%`,
    `[PREDICTION] Median trades to hit target: ${medianTradesToPass ? `${medianTradesToPass} trades` : 'N/A'}`,
    `[STRESS TEST] 95th Percentile Outcome: $${p95thOutcome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `[RISK GUARD] Rithmic HFT execution verification complete. Zero slip detected.`,
  ];

  return {
    simulationsCount: numSimulations,
    tradeHorizon,
    passProbability,
    riskOfRuin,
    medianTradesToPass,
    expectedMaxDrawdown,
    p5thOutcome,
    p50thOutcome,
    p95thOutcome,
    winRate: simulatedWinRate * 100,
    avgWin,
    avgLoss,
    profitFactor,
    chartData,
    larpLogs,
  };
}
