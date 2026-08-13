export type AccountType = 'eval' | 'funded' | 'personal';
export type AccountStatus = 'active' | 'passed' | 'failed' | 'archived';
export type AssetClass = 'futures' | 'crypto' | 'forex' | 'stocks' | 'options';
export type TradeDirection = 'long' | 'short';
export type TradeResultStatus = 'win' | 'loss' | 'breakeven';
export type EmotionRating = 'Disciplined' | 'FOMO' | 'Revenge' | 'Hesitant' | 'Calm' | 'Greedy' | 'Patient';


export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  profitTarget: number; // e.g. 3000 for 50k eval
  maxDrawdown: number;  // e.g. 2500 max trailing/static drawdown limit
  minTradingDays?: number; // e.g. 5 days
  payoutThreshold?: number; // e.g. 1500 profit buffer needed for payout
  minPayoutBuffer?: number; // e.g. 50100 min balance to request payout
  status: AccountStatus;
  createdAt: string;
  notes?: string;
}

export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  direction: TradeDirection;
  assetClass: AssetClass;
  entryPrice?: number;
  exitPrice?: number;
  quantity?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  stopLoss?: number;
  takeProfit?: number;
  fees: number;
  pnl: number; // Net PnL after fees
  pnlPercentage: number;
  rMultiple?: number;
  entryDate: string; // ISO format: YYYY-MM-DDTHH:mm
  exitDate: string;
  status: TradeResultStatus;
  tags: string[];
  emotion: EmotionRating;
  rating: number; // 1-5
  preTradeNotes?: string;
  postTradeNotes?: string;
  screenshot?: string; // Data URL Base64 image
}


export interface TradingStats {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number; // %
  totalPnl: number;
  averagePnl: number;
  totalFees: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  avgRMultiple: number;
  expectancy: number; // $ per trade
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
  dateStr: string; // YYYY-MM-DD
  pnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  netR: number;
  trades: Trade[];
}

export interface TagStat {
  tag: string;
  count: number;
  pnl: number;
  winRate: number;
}

export interface EmotionStat {
  emotion: EmotionRating;
  count: number;
  pnl: number;
  winRate: number;
}
