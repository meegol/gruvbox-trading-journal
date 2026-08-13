import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Account, Trade } from '../types/journal';


interface JournalDB extends DBSchema {
  accounts: {
    key: string;
    value: Account;
    indexes: { 'by-status': string };
  };
  trades: {
    key: string;
    value: Trade;
    indexes: { 'by-account': string; 'by-date': string };
  };
}

const DB_NAME = 'gruvbox-trading-journal-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<JournalDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<JournalDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Accounts store
        if (!db.objectStoreNames.contains('accounts')) {
          const accountStore = db.createObjectStore('accounts', { keyPath: 'id' });
          accountStore.createIndex('by-status', 'status');
        }
        // Trades store
        if (!db.objectStoreNames.contains('trades')) {
          const tradeStore = db.createObjectStore('trades', { keyPath: 'id' });
          tradeStore.createIndex('by-account', 'accountId');
          tradeStore.createIndex('by-date', 'entryDate');
        }
      },
    });
  }
  return dbPromise;
}

// DEFAULT INITIAL 50K EVAL ACCOUNT
export const DEFAULT_50K_ACCOUNT: Account = {
  id: 'acc-50k-eval-default',
  name: 'Apex 50k Eval #1',
  type: 'eval',
  initialBalance: 50000,
  currentBalance: 50000,
  profitTarget: 3000, // $3k profit target
  maxDrawdown: 2500,  // $2.5k max drawdown limit
  minTradingDays: 5,
  payoutThreshold: 0,
  minPayoutBuffer: 50000,
  status: 'active',
  createdAt: new Date().toISOString(),
  notes: 'My primary $50,000 Prop Firm evaluation account.',
};

export async function getAllAccounts(): Promise<Account[]> {
  try {
    const db = await getDB();
    const accounts = await db.getAll('accounts');
    if (accounts.length === 0) {
      // Seed default 50k eval account
      await db.put('accounts', DEFAULT_50K_ACCOUNT);
      return [DEFAULT_50K_ACCOUNT];
    }
    return accounts;
  } catch (err) {
    console.error('Error fetching accounts from IndexedDB:', err);
    return [DEFAULT_50K_ACCOUNT];
  }
}

export async function saveAccount(account: Account): Promise<void> {
  const db = await getDB();
  await db.put('accounts', account);
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['accounts', 'trades'], 'readwrite');
  await tx.objectStore('accounts').delete(id);
  
  // Delete all trades associated with this account
  const tradeIndex = tx.objectStore('trades').index('by-account');
  let cursor = await tradeIndex.openCursor(id);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function getTradesByAccount(accountId: string): Promise<Trade[]> {
  try {
    const db = await getDB();
    if (accountId === 'all') {
      const allTrades = await db.getAll('trades');
      return allTrades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    }
    const trades = await db.getAllFromIndex('trades', 'by-account', accountId);
    return trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  } catch (err) {
    console.error('Error fetching trades from IndexedDB:', err);
    return [];
  }
}

export async function saveTrade(trade: Trade): Promise<void> {
  const db = await getDB();
  await db.put('trades', trade);
}

export async function deleteTrade(tradeId: string): Promise<void> {
  const db = await getDB();
  await db.delete('trades', tradeId);
}

export async function exportFullDatabaseJSON(): Promise<string> {
  const db = await getDB();
  const accounts = await db.getAll('accounts');
  const trades = await db.getAll('trades');
  const exportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts,
    trades,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export async function importFullDatabaseJSON(jsonString: string): Promise<{ accountsCount: number; tradesCount: number }> {
  const data = JSON.parse(jsonString);
  if (!data.accounts || !data.trades) {
    throw new Error('Invalid JSON backup file structure.');
  }

  const db = await getDB();
  const tx = db.transaction(['accounts', 'trades'], 'readwrite');
  
  for (const acc of data.accounts) {
    await tx.objectStore('accounts').put(acc);
  }
  for (const trd of data.trades) {
    await tx.objectStore('trades').put(trd);
  }

  await tx.done;
  return { accountsCount: data.accounts.length, tradesCount: data.trades.length };
}

export async function clearAllDatabase(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['accounts', 'trades'], 'readwrite');
  await tx.objectStore('accounts').clear();
  await tx.objectStore('trades').clear();
  await tx.done;
}
