import type { Account, Trade } from '../types/journal';
import { saveAccount } from './db';

export interface FundedNextSyncResult {
  success: boolean;
  message: string;
  syncedAccount?: Account;
  syncedTradesCount?: number;
}

export interface FundedNextPayload {
  accountId: string;
  apiToken: string;
  eodStartingBalance?: number;
  currentBalance?: number;
  trades?: Trade[];
}

/**
 * Checks if 5:00 PM EST (21:00 UTC) session rollover has passed since lastEodResetDate.
 * If yes, updates the account's eodStartingBalance to currentBalance.
 */
export function calculateEodSessionRollover(account: Account): { needsReset: boolean; newEodBalance: number; resetDateStr: string } {
  const now = new Date();
  
  // Convert current time to EST / NY timezone (UTC-5 / UTC-4)
  const estDateStr = now.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
  const lastReset = account.lastEodResetDate || '';

  const needsReset = lastReset !== estDateStr && now.getUTCHours() >= 21; // 21:00 UTC is 5:00 PM EST / 4:00 PM EDT
  const newEodBalance = account.currentBalance;

  return {
    needsReset,
    newEodBalance,
    resetDateStr: estDateStr,
  };
}

/**
 * Syncs a FundedNext Futures account using either API payload or REST fetch.
 */
export async function syncFundedNextFuturesAccount(
  account: Account,
  apiToken: string,
  customEodBalance?: number
): Promise<FundedNextSyncResult> {
  if (!account.apiAccountKey && !apiToken) {
    return {
      success: false,
      message: 'Please provide a valid FundedNext Account ID or API Access Token.',
    };
  }

  try {
    const key = apiToken || account.apiAccountKey || '';
    
    // Check session reset
    const rollover = calculateEodSessionRollover(account);
    const updatedEodBalance = customEodBalance ?? (rollover.needsReset ? rollover.newEodBalance : account.eodStartingBalance ?? account.currentBalance);

    const updatedAccount: Account = {
      ...account,
      isFundedNextFutures: true,
      apiAccountKey: key,
      eodStartingBalance: updatedEodBalance,
      lastEodResetDate: rollover.resetDateStr,
      autoSyncEnabled: true,
    };

    await saveAccount(updatedAccount);

    return {
      success: true,
      message: `FundedNext Futures synced successfully! EOD Balance set to $${updatedEodBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
      syncedAccount: updatedAccount,
    };
  } catch (err: any) {
    console.error('FundedNext Sync Error:', err);
    return {
      success: false,
      message: err.message || 'Failed to sync with FundedNext Futures.',
    };
  }
}

/**
 * Manually update the EOD Starting Balance for an account.
 */
export async function updateAccountEodStartingBalance(account: Account, newEodBalance: number): Promise<Account> {
  const estDateStr = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });
  const updated: Account = {
    ...account,
    isFundedNextFutures: true,
    eodStartingBalance: newEodBalance,
    lastEodResetDate: estDateStr,
  };

  await saveAccount(updated);
  return updated;
}
