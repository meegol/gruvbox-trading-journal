import type { Trade, TradeDirection, TradeResultStatus, TradingSession } from '../types/journal';

export interface BundledTrade {
  id: string;
  isPyramidBundle: boolean;
  legsCount: number;
  accountId: string;
  symbol: string;
  direction: TradeDirection;
  session?: TradingSession;
  totalQuantity: number;
  totalPnl: number;
  totalFees: number;
  avgEntryPrice?: number;
  avgExitPrice?: number;
  entryDate: string;
  exitDate: string;
  status: TradeResultStatus;
  emotion?: string;
  rating?: number;
  preTradeNotes?: string;
  postTradeNotes?: string;
  screenshot?: string;
  legs: Trade[];
}

/**
 * Groups individual scale-in / pyramid trades into aggregated BundledTrade objects.
 * Trades are bundled if:
 * 1. They explicitly share a pyramidGroupId
 * 2. OR they occur within maxWindowMinutes (default 15 mins) on the same account, symbol & direction.
 */
export function groupPyramidTrades(trades: Trade[], maxWindowMinutes: number = 15): BundledTrade[] {
  if (!trades || trades.length === 0) return [];

  // Sort trades chronologically by entry date
  const sorted = [...trades].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );

  const bundledResult: BundledTrade[] = [];
  const processedTradeIds = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (processedTradeIds.has(current.id)) continue;

    // Find all trades that belong to the same pyramid group
    const cluster: Trade[] = [current];
    processedTradeIds.add(current.id);

    const currentMs = new Date(current.entryDate).getTime();

    for (let j = i + 1; j < sorted.length; j++) {
      const candidate = sorted[j];
      if (processedTradeIds.has(candidate.id)) continue;

      const isSameGroup = current.pyramidGroupId && candidate.pyramidGroupId && current.pyramidGroupId === candidate.pyramidGroupId;
      const isSameSession =
        current.accountId === candidate.accountId &&
        current.symbol.toUpperCase() === candidate.symbol.toUpperCase() &&
        current.direction === candidate.direction;

      const candidateMs = new Date(candidate.entryDate).getTime();
      const diffMinutes = Math.abs(candidateMs - currentMs) / (1000 * 60);

      if (isSameGroup || (isSameSession && diffMinutes <= maxWindowMinutes)) {
        cluster.push(candidate);
        processedTradeIds.add(candidate.id);
      }
    }

    if (cluster.length === 1) {
      // Single trade, non-pyramid
      const t = cluster[0];
      bundledResult.push({
        id: t.id,
        isPyramidBundle: false,
        legsCount: 1,
        accountId: t.accountId,
        symbol: t.symbol,
        direction: t.direction,
        session: t.session,
        totalQuantity: t.quantity || 1,
        totalPnl: t.pnl,
        totalFees: t.fees || 0,
        avgEntryPrice: t.entryPrice,
        avgExitPrice: t.exitPrice,
        entryDate: t.entryDate,
        exitDate: t.exitDate,
        status: t.status,
        emotion: t.emotion,
        rating: t.rating,
        preTradeNotes: t.preTradeNotes,
        postTradeNotes: t.postTradeNotes,
        screenshot: t.screenshot,
        legs: cluster,
      });
    } else {
      // Pyramid Bundle with multiple legs
      const totalQty = cluster.reduce((sum, leg) => sum + (leg.quantity || 1), 0);
      const totalPnl = cluster.reduce((sum, leg) => sum + leg.pnl, 0);
      const totalFees = cluster.reduce((sum, leg) => sum + (leg.fees || 0), 0);

      let weightedEntrySum = 0;
      let weightedExitSum = 0;
      let hasEntryPrices = true;

      cluster.forEach((leg) => {
        if (leg.entryPrice !== undefined && leg.exitPrice !== undefined) {
          const qty = leg.quantity || 1;
          weightedEntrySum += leg.entryPrice * qty;
          weightedExitSum += leg.exitPrice * qty;
        } else {
          hasEntryPrices = false;
        }
      });

      const avgEntryPrice = hasEntryPrices && totalQty > 0 ? weightedEntrySum / totalQty : undefined;
      const avgExitPrice = hasEntryPrices && totalQty > 0 ? weightedExitSum / totalQty : undefined;

      const status: TradeResultStatus = totalPnl > 0.01 ? 'win' : totalPnl < -0.01 ? 'loss' : 'breakeven';

      bundledResult.push({
        id: `pyramid-${current.id}`,
        isPyramidBundle: true,
        legsCount: cluster.length,
        accountId: current.accountId,
        symbol: current.symbol,
        direction: current.direction,
        session: current.session,
        totalQuantity: totalQty,
        totalPnl,
        totalFees,
        avgEntryPrice,
        avgExitPrice,
        entryDate: current.entryDate,
        exitDate: cluster[cluster.length - 1].exitDate || current.entryDate,
        status,
        emotion: current.emotion,
        rating: current.rating,
        preTradeNotes: cluster.map((l, idx) => `[Leg ${idx + 1}] ${l.preTradeNotes || ''}`).filter(Boolean).join('\n'),
        postTradeNotes: cluster.map((l, idx) => `[Leg ${idx + 1}] ${l.postTradeNotes || ''}`).filter(Boolean).join('\n'),
        screenshot: cluster.find((l) => l.screenshot)?.screenshot,
        legs: cluster,
      });
    }
  }

  // Return sorted descending (newest first for table view)
  return bundledResult.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
}
