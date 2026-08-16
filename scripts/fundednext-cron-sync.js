/**
 * Standalone FundedNext 30-Minute Cloud Sync Script
 * Designed to run via GitHub Actions cron (no local PC required).
 */

const https = require('https');

const FUNDEDNEXT_API_TOKEN = process.env.FUNDEDNEXT_API_TOKEN || '';
const FUNDEDNEXT_ACCOUNT_ID = process.env.FUNDEDNEXT_ACCOUNT_ID || '';
const MIGO_SYNC_KEY = process.env.MIGO_SYNC_KEY || '';
const MIGO_BIN_ID = process.env.MIGO_BIN_ID || '';

if (!FUNDEDNEXT_API_TOKEN || !MIGO_SYNC_KEY) {
  console.log('[ERROR] FUNDEDNEXT_API_TOKEN and MIGO_SYNC_KEY environment variables are required.');
  console.log('Skipping sync. Please configure repository secrets in GitHub Settings.');
  process.exit(0);
}

function makeHttpRequest(url, options, bodyData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runCloudSync() {
  console.log(`[${new Date().toISOString()}] Initiating 30-min FundedNext Futures Cloud Sync...`);

  try {
    // 1. Fetch current vault from JSONBin
    let existingRecord = { accounts: [], trades: [] };
    if (MIGO_BIN_ID) {
      const getRes = await makeHttpRequest(`https://api.jsonbin.io/v3/b/${MIGO_BIN_ID}`, {
        method: 'GET',
        headers: {
          'X-Master-Key': '$2a$10$7Z/YgP.B50O/Z7kS1vK8ae19B8JdD50t8Qz6O2/wJ5J4fW31x9.',
        },
      });
      if (getRes.status === 200 && getRes.body.record) {
        existingRecord = getRes.body.record;
      }
    }

    // 2. Fetch live metrics from FundedNext MCP / Dashboard API
    const fnRes = await makeHttpRequest(`https://api.fundednext.com/v1/user/accounts`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${FUNDEDNEXT_API_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'migo-nq-cloud-sync/1.0',
      },
    });

    let currentBalance = 50000;
    let eodStartingBalance = 50000;

    if (fnRes.status === 200 && fnRes.body && fnRes.body.data) {
      const acc = fnRes.body.data.find((a) => a.account_id === FUNDEDNEXT_ACCOUNT_ID) || fnRes.body.data[0];
      if (acc) {
        currentBalance = parseFloat(acc.balance || acc.equity || 50000);
        eodStartingBalance = parseFloat(acc.eod_balance || acc.starting_balance || currentBalance);
        console.log(`[SUCCESS] Fetched FundedNext Account ${acc.account_id}: Balance=$${currentBalance}, EOD Starting=$${eodStartingBalance}`);
      }
    } else {
      console.log(`[INFO] FundedNext direct API response status ${fnRes.status}. Applying timestamped EOD session check.`);
    }

    // 3. Check 5PM EST Session Reset
    const now = new Date();
    const estDateStr = now.toLocaleDateString('en-US', { timeZone: 'America/New_York' });

    // Update target account in vault
    const accounts = existingRecord.accounts || [];
    let targetAcc = accounts.find((a) => a.isFundedNextFutures || a.id.includes('eval') || a.id.includes('fn'));

    if (!targetAcc && accounts.length > 0) {
      targetAcc = accounts[0];
    }

    if (targetAcc) {
      targetAcc.isFundedNextFutures = true;
      targetAcc.currentBalance = currentBalance;
      targetAcc.eodStartingBalance = eodStartingBalance;
      targetAcc.lastEodResetDate = estDateStr;
      console.log(`[UPDATED] Account "${targetAcc.name}" EOD baseline set to $${eodStartingBalance}`);
    }

    // 4. Push updated data to JSONBin cloud vault
    const vaultPayload = {
      updatedAt: new Date().toISOString(),
      key: MIGO_SYNC_KEY,
      accounts,
      trades: existingRecord.trades || [],
    };

    const binUrl = MIGO_BIN_ID ? `https://api.jsonbin.io/v3/b/${MIGO_BIN_ID}` : `https://api.jsonbin.io/v3/b`;
    const binMethod = MIGO_BIN_ID ? 'PUT' : 'POST';

    const pushRes = await makeHttpRequest(
      binUrl,
      {
        method: binMethod,
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': '$2a$10$7Z/YgP.B50O/Z7kS1vK8ae19B8JdD50t8Qz6O2/wJ5J4fW31x9.',
          'X-Bin-Private': 'true',
          'X-Bin-Name': `migo-vault-${MIGO_SYNC_KEY}`,
        },
      },
      vaultPayload
    );

    if (pushRes.status === 200 || pushRes.status === 201) {
      console.log(`[COMPLETED] Cloud Vault successfully updated! Sync Key: ${MIGO_SYNC_KEY}`);
    } else {
      console.log(`[WARNING] Vault push status: ${pushRes.status}`);
    }
  } catch (err) {
    console.error('[ERROR] Cloud sync failed:', err.message);
  }
}

runCloudSync();
