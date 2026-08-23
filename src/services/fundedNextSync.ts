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
    let syncedTradesCount = 0;
    if (key && key !== 'YOUR_FUNDEDNEXT_BEARER_TOKEN_HERE') {
      try {
        const initData = await callFundedNextMcpServer(key, 'initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'migo-nq', version: '1.0' },
        });

        if (initData && !initData.error) {
          mcpMessage = 'Connected to official FundedNext MCP Server (https://mcp.fundednext.com)! ';

          // Query live account overview dynamically
          const overviewData = await callFundedNextMcpServer(key, 'tools/call', {
            name: 'get_account_overview',
            arguments: { account_id: 1 },
          });

          if (overviewData?.result?.content?.[0]?.text) {
            try {
              const parsedOverview = JSON.parse(overviewData.result.content[0].text);
              const details = parsedOverview.account_details || {};
              if (details.type) {
                account.name = `${details.type} (${details.login || 'FN'})`;
              }
              if (details.breached === 1) {
                account.status = 'failed';
                account.notes = `Breached on FundedNext: ${details.breached_by || 'Loss Limit'}`;
              }
            } catch (err: any) {
              console.warn('Overview parse warning:', err.message);
            }
          }

          // Fetch trading calendar month for current month
          const currentMonthStr = new Date().toISOString().slice(0, 7);
          const calData = await callFundedNextMcpServer(key, 'tools/call', {
            name: 'get_trading_calendar_month',
            arguments: { account_id: 1, month: currentMonthStr },
          });

          if (calData?.result?.content?.[0]?.text) {
            try {
              const parsedCal = JSON.parse(calData.result.content[0].text);
              const tradeDays = (parsedCal.days || []).filter((d: any) => d.has_trade || d.total_trades > 0);
              const { saveTrade } = await import('./db');

              let runningBalance = 50000;
              for (const day of tradeDays) {
                const dayData = await callFundedNextMcpServer(key, 'tools/call', {
                  name: 'get_trading_calendar_day',
                  arguments: { account_id: 1, date: day.date },
                });

                if (dayData?.result?.content?.[0]?.text) {
                  const parsedDay = JSON.parse(dayData.result.content[0].text);
                  const dayTrades = parsedDay.trades || [];
                  for (const t of dayTrades) {
                    const pnl = t.pnl || 0;
                    const balanceBefore = runningBalance;
                    runningBalance += pnl;

                    let cleanSymbol = (t.symbol || 'MNQ').toUpperCase();
                    if (cleanSymbol.includes('MES')) cleanSymbol = 'MES';
                    else if (cleanSymbol.includes('MNQ')) cleanSymbol = 'MNQ';
                    else if (cleanSymbol.includes('NQ')) cleanSymbol = 'NQ';
                    else if (cleanSymbol.includes('ES')) cleanSymbol = 'ES';

                    const direction = (t.type || 'buy').toLowerCase() === 'buy' ? 'long' : 'short';
                    const openTime = t.open_time ? t.open_time.replace(' ', 'T').slice(0, 16) : new Date().toISOString().slice(0, 16);
                    const closeTime = t.close_time ? t.close_time.replace(' ', 'T').slice(0, 16) : openTime;

                    const newTrade: Trade = {
                      id: 'trd-fn-' + (t.ticket || Date.now()),
                      accountId: account.id,
                      symbol: cleanSymbol,
                      direction,
                      assetClass: 'futures',
                      session: 'NY AM Open',
                      entryPrice: t.open_price,
                      exitPrice: t.close_price,
                      quantity: t.lots || t.volume || 1,
                      balanceBefore: parseFloat(balanceBefore.toFixed(2)),
                      balanceAfter: parseFloat(runningBalance.toFixed(2)),
                      fees: t.commission || 0,
                      pnl: parseFloat(pnl.toFixed(2)),
                      pnlPercentage: parseFloat(((pnl / 50000) * 100).toFixed(3)),
                      entryDate: openTime,
                      exitDate: closeTime,
                      status: pnl > 0.01 ? 'win' : pnl < -0.01 ? 'loss' : 'breakeven',
                      emotion: 'Disciplined',
                      rating: 5,
                      checklistPassed: true,
                      preTradeNotes: 'Auto-synced via FundedNext MCP',
                      postTradeNotes: `Ticket #${t.ticket || ''}`,
                    };

                    await saveTrade(newTrade);
                    syncedTradesCount++;
                  }
                }
              }
              if (runningBalance > 0) currentBalance = parseFloat(runningBalance.toFixed(2));
            } catch (err: any) {
              console.warn('Calendar parse warning:', err.message);
            }
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
      message: `${mcpMessage}FundedNext Futures synced! Successfully imported ${syncedTradesCount} trades automatically. EOD Baseline: $${updatedEodBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
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
