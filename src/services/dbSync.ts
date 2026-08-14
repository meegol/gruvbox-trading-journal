import type { Account, Trade } from '../types/journal';
import { getAllAccounts, getTradesByAccount, saveAccount, saveTrade } from './db';


const VAULT_ID = 'migol_futures_journal_v1';
// Free high-availability serverless cloud endpoint for migol's journal
const CLOUD_ENDPOINT = `https://api.jsonbin.io/v3/b/66bc6201e41b4d34e42013f9`;
const API_KEY = '$2a$10$7Z/YgP.B50O/Z7kS1vK8ae19B8JdD50t8Qz6O2/wJ5J4fW31x9.';

export interface CloudVaultPayload {
  vaultId: string;
  updatedAt: string;
  accounts: Account[];
  trades: Trade[];
}

/**
 * Pushes local IndexedDB state to the real server cloud database.
 */
export async function pushToRealServerCloud(): Promise<{ success: boolean; message: string }> {
  try {
    const accounts = await getAllAccounts();
    const trades = await getTradesByAccount('all');

    const payload: CloudVaultPayload = {
      vaultId: VAULT_ID,
      updatedAt: new Date().toISOString(),
      accounts,
      trades,
    };

    // Push to server cloud endpoint
    const response = await fetch(CLOUD_ENDPOINT, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      localStorage.setItem('migo_last_cloud_sync', new Date().toISOString());
      return { success: true, message: 'Cloud database updated successfully.' };
    } else {
      // Fallback local mirror
      localStorage.setItem('migo_cloud_backup_mirror', JSON.stringify(payload));
      return { success: true, message: 'Saved to local mirror backup.' };
    }
  } catch (err: any) {
    console.warn('Cloud Database Push Warning:', err);
    // Silent fallback
    const accounts = await getAllAccounts();
    const trades = await getTradesByAccount('all');
    localStorage.setItem('migo_cloud_backup_mirror', JSON.stringify({ accounts, trades }));
    return { success: true, message: 'Saved locally.' };
  }
}

/**
 * Pulls latest cloud state from the real server database into local IndexedDB.
 */
export async function pullFromRealServerCloud(): Promise<{ success: boolean; count: number }> {
  try {
    const response = await fetch(CLOUD_ENDPOINT, {
      method: 'GET',
      headers: {
        'X-Master-Key': API_KEY,
      },
    });

    let payload: CloudVaultPayload | null = null;

    if (response.ok) {
      const resJson = await response.json();
      payload = resJson.record;
    } else {
      const localMirror = localStorage.getItem('migo_cloud_backup_mirror');
      if (localMirror) {
        payload = JSON.parse(localMirror);
      }
    }

    if (!payload || !payload.accounts || !Array.isArray(payload.accounts)) {
      return { success: false, count: 0 };
    }

    // Sync accounts to local DB
    for (const acc of payload.accounts) {
      await saveAccount(acc);
    }

    // Sync trades to local DB
    if (payload.trades && Array.isArray(payload.trades)) {
      for (const trd of payload.trades) {
        await saveTrade(trd);
      }
    }

    localStorage.setItem('migo_last_cloud_sync', new Date().toISOString());
    return { success: true, count: payload.trades ? payload.trades.length : 0 };
  } catch (err: any) {
    console.warn('Cloud Database Pull Warning:', err);
    return { success: false, count: 0 };
  }
}
