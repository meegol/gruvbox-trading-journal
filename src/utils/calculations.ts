import type { Account, Trade, TradingStats, CalendarDaySummary, EmotionStat, EmotionRating, SessionStat, TradingSession } from '../types/journal';

export function computeTradingStats(trades: Trade[], initialBalance: number): TradingStats {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      winRate: 0,
      totalPnl: 0,
      averagePnl: 0,
      totalFees: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      avgRMultiple: 0,
      expectancy: 0,
      maxDrawdownAmount: 0,
      maxDrawdownPercent: 0,
      longCount: 0,
      longWinRate: 0,
      shortCount: 0,
      shortWinRate: 0,
      bestTrade: 0,
      worstTrade: 0,
      peakBalance: initialBalance,
    };
  }

  let totalPnl = 0;
  let totalFees = 0;
  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let winPnlSum = 0;
  let lossPnlSum = 0;
  let rSum = 0;
  let rCount = 0;

  let longCount = 0;
  let longWins = 0;
  let shortCount = 0;
  let shortWins = 0;

  let bestTrade = -Infinity;
  let worstTrade = Infinity;

  const sortedAsc = [...trades].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );

  let runningEquity = initialBalance;
  let peakEquity = initialBalance;
  let maxDrawdownAmount = 0;
  let maxDrawdownPercent = 0;

  for (const trade of sortedAsc) {
    const netPnl = trade.pnl;
    totalPnl += netPnl;
    totalFees += trade.fees || 0;

    if (netPnl > 0.01) {
      winCount++;
      winPnlSum += netPnl;
    } else if (netPnl < -0.01) {
      lossCount++;
      lossPnlSum += Math.abs(netPnl);
    } else {
      breakevenCount++;
    }

    if (trade.rMultiple !== undefined && trade.rMultiple !== null) {
      rSum += trade.rMultiple;
      rCount++;
    }

    if (trade.direction === 'long') {
      longCount++;
      if (netPnl > 0.01) longWins++;
    } else {
      shortCount++;
      if (netPnl > 0.01) shortWins++;
    }

    if (netPnl > bestTrade) bestTrade = netPnl;
    if (netPnl < worstTrade) worstTrade = netPnl;

    runningEquity += netPnl;
    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    } else {
      const dd = peakEquity - runningEquity;
      const ddPct = (dd / peakEquity) * 100;
      if (dd > maxDrawdownAmount) maxDrawdownAmount = dd;
      if (ddPct > maxDrawdownPercent) maxDrawdownPercent = ddPct;
    }
  }

  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const avgWin = winCount > 0 ? winPnlSum / winCount : 0;
  const avgLoss = lossCount > 0 ? lossPnlSum / lossCount : 0;
  const profitFactor = lossPnlSum > 0 ? winPnlSum / lossPnlSum : winPnlSum > 0 ? 999 : 0;
  const averagePnl = totalTrades > 0 ? totalPnl / totalTrades : 0;
  const avgRMultiple = rCount > 0 ? rSum / rCount : 0;
  
  const winRateFrac = winRate / 100;
  const lossRateFrac = 1 - winRateFrac;
  const expectancy = (winRateFrac * avgWin) - (lossRateFrac * avgLoss);

  const longWinRate = longCount > 0 ? (longWins / longCount) * 100 : 0;
  const shortWinRate = shortCount > 0 ? (shortWins / shortCount) * 100 : 0;

  return {
    totalTrades,
    winCount,
    lossCount,
    breakevenCount,
    winRate,
    totalPnl,
    averagePnl,
    totalFees,
    avgWin,
    avgLoss,
    profitFactor,
    avgRMultiple,
    expectancy,
    maxDrawdownAmount,
    maxDrawdownPercent,
    longCount,
    longWinRate,
    shortCount,
    shortWinRate,
    bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
    worstTrade: worstTrade === Infinity ? 0 : worstTrade,
    peakBalance: peakEquity,
  };
}

export function computeAccountProgress(account: Account, trades: Trade[]) {
  const accountTrades = trades.filter((t) => t.accountId === account.id);
  const netPnl = accountTrades.reduce((acc, t) => acc + t.pnl, 0);
  const currentBalance = account.initialBalance + netPnl;

  // Compute Today's PnL for Daily Loss Limit Guard
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrades = accountTrades.filter(
    (t) => new Date(t.entryDate).toISOString().split('T')[0] === todayStr
  );
  const todayPnl = todayTrades.reduce((acc, t) => acc + t.pnl, 0);
  const dailyLossLimit = account.dailyLossLimit || 500;
  const isDailyLimitBreached = todayPnl <= -dailyLossLimit;

  let peakBalance = account.initialBalance;
  let running = account.initialBalance;
  let maxDrawdownUsed = 0;

  const sortedAsc = [...accountTrades].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );

  for (const t of sortedAsc) {
    running += t.pnl;
    if (running > peakBalance) peakBalance = running;
    const dd = peakBalance - running;
    if (dd > maxDrawdownUsed) maxDrawdownUsed = dd;
  }

  const drawdownBufferRemaining = Math.max(0, account.maxDrawdown - maxDrawdownUsed);
  const drawdownUsedPercent = (maxDrawdownUsed / account.maxDrawdown) * 100;

  if (account.type === 'eval') {
    const target = account.profitTarget || 3000;
    const progressPct = Math.min(100, Math.max(0, (netPnl / target) * 100));
    const remainingToPass = Math.max(0, target - netPnl);
    const isPassed = netPnl >= target;
    const isFailed = maxDrawdownUsed >= account.maxDrawdown;

    return {
      netPnl,
      currentBalance,
      target,
      progressPct,
      remainingToPass,
      maxDrawdownLimit: account.maxDrawdown,
      maxDrawdownUsed,
      drawdownUsedPercent,
      drawdownBufferRemaining,
      todayPnl,
      dailyLossLimit,
      isDailyLimitBreached,
      isPassed,
      isFailed,
      typeLabel: 'Evaluation',
      statusText: isPassed
        ? 'PASSED - Target Achieved'
        : isFailed
        ? 'FAILED - Max Drawdown Breached'
        : isDailyLimitBreached
        ? 'DAILY LOSS LIMIT BREACHED — WALK AWAY FOR THE DAY'
        : `${progressPct.toFixed(1)}% to Passing ($${remainingToPass.toLocaleString('en-US', { minimumFractionDigits: 2 })} remaining)`,
    };
  } else if (account.type === 'funded') {
    const threshold = account.payoutThreshold || 1500;
    const progressPct = Math.min(100, Math.max(0, (netPnl / threshold) * 100));
    const remainingToPayout = Math.max(0, threshold - netPnl);
    const isEligible = netPnl >= threshold;
    const isFailed = maxDrawdownUsed >= account.maxDrawdown;

    return {
      netPnl,
      currentBalance,
      payoutThreshold: threshold,
      progressPct,
      remainingToPayout,
      maxDrawdownLimit: account.maxDrawdown,
      maxDrawdownUsed,
      drawdownUsedPercent,
      drawdownBufferRemaining,
      todayPnl,
      dailyLossLimit,
      isDailyLimitBreached,
      isEligible,
      isFailed,
      typeLabel: 'Funded Account',
      statusText: isEligible
        ? 'PAYOUT ELIGIBLE'
        : isFailed
        ? 'FAILED - Max Drawdown Breached'
        : isDailyLimitBreached
        ? 'DAILY LOSS LIMIT BREACHED — WALK AWAY FOR THE DAY'
        : `$${netPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })} / $${threshold.toLocaleString('en-US')} to Payout (${progressPct.toFixed(1)}%)`,
    };
  } else {
    const growthPercent = (netPnl / account.initialBalance) * 100;
    return {
      netPnl,
      currentBalance,
      growthPercent,
      maxDrawdownLimit: account.maxDrawdown,
      maxDrawdownUsed,
      drawdownUsedPercent,
      drawdownBufferRemaining,
      todayPnl,
      dailyLossLimit,
      isDailyLimitBreached,
      typeLabel: 'Personal Account',
      statusText: isDailyLimitBreached
        ? 'DAILY LOSS LIMIT BREACHED — WALK AWAY FOR THE DAY'
        : `Total Return: ${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(2)}%`,
    };
  }
}

export function groupTradesByCalendarMonth(trades: Trade[], year: number, month: number): Map<string, CalendarDaySummary> {
  const map = new Map<string, CalendarDaySummary>();

  for (const trade of trades) {
    const d = new Date(trade.entryDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dateStr = d.toISOString().split('T')[0];
      const existing = map.get(dateStr) || {
        dateStr,
        pnl: 0,
        tradeCount: 0,
        winCount: 0,
        lossCount: 0,
        netR: 0,
        trades: [],
      };

      existing.pnl += trade.pnl;
      existing.tradeCount += 1;
      if (trade.pnl > 0.01) existing.winCount += 1;
      else if (trade.pnl < -0.01) existing.lossCount += 1;
      if (trade.rMultiple) existing.netR += trade.rMultiple;
      existing.trades.push(trade);

      map.set(dateStr, existing);
    }
  }

  return map;
}

export function computeEmotionStats(trades: Trade[]): EmotionStat[] {
  const map = new Map<EmotionRating, { count: number; pnl: number; wins: number }>();

  for (const t of trades) {
    const emo = t.emotion || 'Disciplined';
    const existing = map.get(emo) || { count: 0, pnl: 0, wins: 0 };
    existing.count += 1;
    existing.pnl += t.pnl;
    if (t.pnl > 0.01) existing.wins += 1;
    map.set(emo, existing);
  }

  const result: EmotionStat[] = [];
  map.forEach((val, emotion) => {
    result.push({
      emotion,
      count: val.count,
      pnl: val.pnl,
      winRate: (val.wins / val.count) * 100,
    });
  });

  return result.sort((a, b) => b.pnl - a.pnl);
}

export function computeSessionStats(trades: Trade[]): SessionStat[] {
  const map = new Map<TradingSession, { count: number; pnl: number; wins: number }>();

  const sessions: TradingSession[] = ['NY AM Open', 'NY PM Session', 'London', 'Asia / Overnight'];
  sessions.forEach((s) => map.set(s, { count: 0, pnl: 0, wins: 0 }));

  for (const t of trades) {
    const sess = t.session || 'NY AM Open';
    const existing = map.get(sess) || { count: 0, pnl: 0, wins: 0 };
    existing.count += 1;
    existing.pnl += t.pnl;
    if (t.pnl > 0.01) existing.wins += 1;
    map.set(sess, existing);
  }

  const result: SessionStat[] = [];
  map.forEach((val, session) => {
    result.push({
      session,
      count: val.count,
      pnl: val.pnl,
      winRate: val.count > 0 ? (val.wins / val.count) * 100 : 0,
    });
  });

  return result.sort((a, b) => b.pnl - a.pnl);
}
