import type { Account, Trade } from '../types/journal';

// Empty default dataset container - project starts 100% clean with zero mock trades
export const INITIAL_ACCOUNT: Account = {
  id: 'acc-50k-eval-default',
  name: 'Apex 50k Eval #1',
  type: 'eval',
  initialBalance: 50000,
  currentBalance: 50000,
  profitTarget: 3000,
  maxDrawdown: 2500,
  minTradingDays: 5,
  payoutThreshold: 0,
  minPayoutBuffer: 50000,
  status: 'active',
  createdAt: new Date().toISOString(),
  notes: '50k Futures evaluation account',
};

export const INITIAL_TRADES: Trade[] = [];
