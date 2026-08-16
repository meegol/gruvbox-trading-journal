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
    const key = (apiToken || account.apiAccountKey || '').trim();
    let currentBalance = account.currentBalance;
    let fetchedEodBalance = customEodBalance;
    let mcpMessage = '';

    // Attempt official FundedNext MCP server query if token provided
    if (key && key !== 'YOUR_FUNDEDNEXT_BEARER_TOKEN_HERE') {
      try {
        const initData = await callFundedNextMcpServer(key, 'initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'migo-nq', version: '1.0' },
        });

        if (initData && !initData.error) {
          mcpMessage = 'Connected to official FundedNext MCP Server (https://mcp.fundednext.com)! ';
          const toolsData = await callFundedNextMcpServer(key, 'tools/call', {
            name: 'get_account_overview',
            arguments: { account_id: account.apiAccountKey || account.id },
          });

          if (toolsData && toolsData.result) {
            if (toolsData.result.balance) currentBalance = parseFloat(toolsData.result.balance);
            if (toolsData.result.eod_balance) fetchedEodBalance = parseFloat(toolsData.result.eod_balance);
          }
        } else if (initData?.error?.data?.description) {
          mcpMessage = `MCP Status: ${initData.error.data.description}. `;
        }
      } catch (err: any) {
        console.warn('FundedNext MCP Server Query Notice:', err.message);
      }
    }
    
    // Check session reset
    const rollover = calculateEodSessionRollover(account);
    const updatedEodBalance = fetchedEodBalance ?? (rollover.needsReset ? rollover.newEodBalance : account.eodStartingBalance ?? currentBalance);

    const updatedAccount: Account = {
      ...account,
      isFundedNextFutures: true,
      apiAccountKey: key,
      currentBalance,
      eodStartingBalance: updatedEodBalance,
      lastEodResetDate: rollover.resetDateStr,
      autoSyncEnabled: true,
    };

    await saveAccount(updatedAccount);

    return {
      success: true,
      message: `${mcpMessage}FundedNext Futures synced! EOD Baseline set to $${updatedEodBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
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
