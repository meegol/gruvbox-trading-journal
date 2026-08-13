export type AccountType = 'eval' | 'funded' | 'personal';
export type AccountStatus = 'active' | 'passed' | 'failed' | 'archived';
export type AssetClass = 'futures';
export type FuturesSymbol = 'NQ' | 'MNQ' | 'ES' | 'MES' | 'YM' | 'MYM' | 'RTY' | 'M2K' | 'CL' | 'GC';
export type TradeDirection = 'long' | 'short';
export type TradeResultStatus = 'win' | 'loss' | 'breakeven';
export type EmotionRating = 'Disciplined' | 'FOMO' | 'Revenge' | 'Hesitant' | 'Calm' | 'Greedy' | 'Patient';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  profitTarget: number;
  maxDrawdown: number;
  minTradingDays?: number;
  payoutThreshold?: number;
  minPayoutBuffer?: number;
  status: AccountStatus;
  createdAt: string;
  notes?: string;
}

export interface Trade {
  id: string;
  accountId: string;
  symbol: FuturesSymbol | string;
  direction: TradeDirection;
  assetClass: 'futures';
  entryPrice?: number;
  exitPrice?: number;
  quantity?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  stopLoss?: number;
  takeProfit?: number;
  fees: number;
  pnl: number;
  pnlPercentage: number;
  rMultiple?: number;
  entryDate: string;
  exitDate: string;
  status: TradeResultStatus;
  emotion: EmotionRating;
  rating: number; // 1-5 stars
  preTradeNotes?: string; // Pre-trade setup plan
  postTradeNotes?: string; // Post-trade review
  screenshot?: string; // Data URL Base64 image
}

export interface TradingStats {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  totalFees: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  avgRMultiple: number;
  expectancy: number;
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  longCount: number;
  longWinRate: number;
  shortCount: number;
  shortWinRate: number;
  bestTrade: number;
  worstTrade: number;
  peakBalance: number;
}

export interface CalendarDaySummary {
  dateStr: string;
  pnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  netR: number;
  trades: Trade[];
}

export interface EmotionStat {
  emotion: EmotionRating;
  count: number;
  pnl: number;
  winRate: number;
}
