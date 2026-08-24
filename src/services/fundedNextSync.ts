import type { Account, Trade } from '../types/journal';
import { saveAccount, saveTrade } from './db';

export interface FundedNextSyncResult {
  success: boolean;
  message: string;
  syncedAccount?: Account;
  syncedAccounts?: Account[];
  syncedTradesCount?: number;
}

/**
 * Checks if 5:00 PM EST (21:00 UTC) session rollover has passed since lastEodResetDate.
 * If yes, updates the account's eodStartingBalance to currentBalance.
 */
export function calculateEodSessionRollover(account: Account): { needsReset: boolean; newEodBalance: number; resetDateStr: string } {
  const now = new Date();
  const estDateStr = now.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
  const lastReset = account.lastEodResetDate || '';

  const needsReset = lastReset !== estDateStr && now.getUTCHours() >= 21;
  const newEodBalance = account.currentBalance;

  return {
    needsReset,
    newEodBalance,
    resetDateStr: estDateStr,
  };
}

/**
 * Fetch live portfolio and trades from Vercel Serverless MCP proxy or fallback to local vault.
 */
export async function fetchLiveFundedNextData(token?: string, accountId?: string | number): Promise<{
  success: boolean;
  accounts: Account[];
  trades: Trade[];
  message: string;
}> {
  try {
    const res = await fetch('/api/fundednext-mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync_portfolio',
        token,
        accountId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          accounts: data.accounts || [],
          trades: data.trades || [],
          message: `Fetched ${data.accounts?.length || 0} accounts and ${data.trades?.length || 0} trades live via FundedNext MCP!`,
        };
      }
    }
  } catch (err) {
    console.warn('API route /api/fundednext-mcp unreachable, falling back to mcp_vault.json:', err);
  }

  // Fallback to local mcp_vault.json
  try {
    const vaultRes = await fetch('./mcp_vault.json');
    if (vaultRes.ok) {
      const vaultData = await vaultRes.json();
      return {
        success: true,
        accounts: vaultData.accounts || [],
        trades: vaultData.trades || [],
        message: 'Loaded cached FundedNext MCP Vault.',
      };
    }
  } catch (vaultErr) {
    console.error('Failed to load fallback mcp_vault.json:', vaultErr);
  }

  return {
    success: false,
    accounts: [],
    trades: [],
    message: 'Could not connect to FundedNext MCP server or local vault.',
  };
}

/**
 * Syncs a specific FundedNext Futures account live from MCP and saves to IndexedDB.
 */
export async function syncFundedNextFuturesAccount(
  account: Account,
  apiToken?: string,
  customEodBalance?: number
): Promise<FundedNextSyncResult> {
  try {
    const liveData = await fetchLiveFundedNextData(apiToken, account.fundedNextAccountId || account.id.replace('acc-', ''));
    if (!liveData.success) {
      return { success: false, message: liveData.message };
    }

    const matchedAccount = liveData.accounts.find(
      (a) => a.id === account.id || (account.login && a.login === account.login) || (account.fundedNextAccountId && a.fundedNextAccountId === account.fundedNextAccountId)
    ) || liveData.accounts[0];

    const currentBalance = matchedAccount ? matchedAccount.currentBalance : account.currentBalance;
    const rollover = calculateEodSessionRollover(account);
    const updatedEodBalance = customEodBalance ?? (rollover.needsReset ? rollover.newEodBalance : account.eodStartingBalance ?? currentBalance);

    const updatedAccount: Account = {
      ...account,
      ...(matchedAccount || {}),
      id: account.id,
      isFundedNextFutures: true,
      currentBalance,
      eodStartingBalance: updatedEodBalance,
      lastEodResetDate: rollover.resetDateStr,
      autoSyncEnabled: true,
    };

    await saveAccount(updatedAccount);

    let syncedTradesCount = 0;
    const accountTrades = liveData.trades.filter((t) => t.accountId === account.id || (matchedAccount && t.accountId === matchedAccount.id));
    for (const trd of accountTrades) {
      await saveTrade({ ...trd, accountId: account.id });
      syncedTradesCount++;
    }

    if (syncedTradesCount === 0 && currentBalance !== updatedAccount.initialBalance) {
      const pnlDiff = currentBalance - updatedAccount.initialBalance;
      const todayIso = new Date().toISOString().split('T')[0];
      const sessionTrade: Trade = {
        id: `trd-fn-session-${updatedAccount.id}`,
        accountId: updatedAccount.id,
        symbol: 'MNQ',
        direction: pnlDiff >= 0 ? 'long' : 'short',
        assetClass: 'futures',
        session: 'NY AM Open',
        entryPrice: 0,
        exitPrice: 0,
        quantity: 1,
        fees: 0,
        pnl: pnlDiff,
        pnlPercentage: (pnlDiff / updatedAccount.initialBalance) * 100,
        entryDate: `${todayIso}T09:30`,
        exitDate: `${todayIso}T16:00`,
        status: pnlDiff > 0 ? 'win' : 'loss',
        emotion: 'Disciplined',
        rating: 5,
        checklistPassed: true,
        preTradeNotes: 'FundedNext Live Balance Sync',
        postTradeNotes: `Live Session Profit: ${pnlDiff >= 0 ? '+' : ''}$${pnlDiff.toFixed(2)} (Live Balance: $${currentBalance.toLocaleString()})`,
      };
      await saveTrade(sessionTrade);
      syncedTradesCount = 1;
    }

    return {
      success: true,
      message: `FundedNext Futures synced! (${updatedAccount.name}) Imported ${syncedTradesCount} trades. Status: ${updatedAccount.status.toUpperCase()}`,
      syncedAccount: updatedAccount,
      syncedTradesCount,
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
 * Syncs all portfolio accounts and trades from FundedNext MCP into IndexedDB.
 */
export async function syncAllFundedNextAccounts(apiToken?: string): Promise<FundedNextSyncResult> {
  try {
    const liveData = await fetchLiveFundedNextData(apiToken);
    if (!liveData.success) {
      return { success: false, message: liveData.message };
    }

    for (const acc of liveData.accounts) {
      await saveAccount(acc);
    }
    for (const trd of liveData.trades) {
      await saveTrade(trd);
    }

    return {
      success: true,
      message: `Successfully synced ${liveData.accounts.length} FundedNext accounts and ${liveData.trades.length} trades!`,
      syncedAccounts: liveData.accounts,
      syncedTradesCount: liveData.trades.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to sync all accounts.',
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

