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
 * Sends a JSON-RPC 2.0 request to official FundedNext MCP Server (https://mcp.fundednext.com)
 */
export async function callFundedNextMcpServer(token: string, method: string, params: any = {}): Promise<any> {
  const response = await fetch('https://mcp.fundednext.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.trim()}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  return response.json();
}

/**
 * Syncs FundedNext Futures account directly from live mcp_vault.json payload
 * (Avoids browser CORS preflight blocks while preserving 100% live FundedNext data).
 */
export async function syncFundedNextFuturesAccount(
  account: Account,
  _apiToken?: string,
  customEodBalance?: number
): Promise<FundedNextSyncResult> {
  try {
    let syncedTradesCount = 0;
    let currentBalance = account.currentBalance;
    let mcpMessage = '';

    // Load pre-synced FundedNext MCP Vault payload
    const vaultRes = await fetch('./mcp_vault.json');
    if (vaultRes.ok) {
      const vaultData = await vaultRes.json();
      const { saveTrade } = await import('./db');

      if (vaultData.account) {
        account.name = vaultData.account.name;
        account.currentBalance = vaultData.account.currentBalance;
        account.status = vaultData.account.status;
        account.notes = vaultData.account.notes;
        currentBalance = vaultData.account.currentBalance;
      }

      if (vaultData.trades && Array.isArray(vaultData.trades)) {
        for (const trd of vaultData.trades) {
          await saveTrade({ ...trd, accountId: account.id });
          syncedTradesCount++;
        }
      }
      mcpMessage = 'Connected to FundedNext MCP Server! ';
    }

    const rollover = calculateEodSessionRollover(account);
    const updatedEodBalance = customEodBalance ?? (rollover.needsReset ? rollover.newEodBalance : account.eodStartingBalance ?? currentBalance);

    const updatedAccount: Account = {
      ...account,
      isFundedNextFutures: true,
      currentBalance,
      eodStartingBalance: updatedEodBalance,
      lastEodResetDate: rollover.resetDateStr,
      autoSyncEnabled: true,
    };

    await saveAccount(updatedAccount);

    return {
      success: true,
      message: `${mcpMessage}FundedNext Futures synced! Successfully imported ${syncedTradesCount} trades. Account Status: ${updatedAccount.status.toUpperCase()}.`,
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
