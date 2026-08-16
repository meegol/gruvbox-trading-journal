/**
 * Standalone FundedNext 30-Minute Cloud Sync Script
 * Designed to run via GitHub Actions cron (no local PC required).
 */

const https = require('https');

// Replace these values directly if you want to hardcode credentials for your personal project!
const FUNDEDNEXT_API_TOKEN = process.env.FUNDEDNEXT_API_TOKEN || 'YOUR_FUNDEDNEXT_BEARER_TOKEN_HERE';
const FUNDEDNEXT_ACCOUNT_ID = process.env.FUNDEDNEXT_ACCOUNT_ID || 'FN-FUTURES-50K-MIGO';
const MIGO_SYNC_KEY = process.env.MIGO_SYNC_KEY || 'migol_futures_vault';
const MIGO_BIN_ID = process.env.MIGO_BIN_ID || '';

if (!FUNDEDNEXT_API_TOKEN || FUNDEDNEXT_API_TOKEN === 'YOUR_FUNDEDNEXT_BEARER_TOKEN_HERE') {
  console.log('[NOTE] FUNDEDNEXT_API_TOKEN not set or using placeholder. Running session rollover & local EOD calculation sync.');
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

async function callFundedNextMcp(token, method, params = {}) {
  return makeHttpRequest('https://mcp.fundednext.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'migo-nq-mcp-client/1.0',
    },
  }, {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  });
}

async function runCloudSync() {
  console.log(`[${new Date().toISOString()}] Initiating 30-min FundedNext MCP Cloud Sync (https://mcp.fundednext.com)...`);

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

    // 2. Query official FundedNext MCP Server (https://mcp.fundednext.com)
    let currentBalance = 50000;
    let eodStartingBalance = 50000;

    if (FUNDEDNEXT_API_TOKEN && FUNDEDNEXT_API_TOKEN !== 'YOUR_FUNDEDNEXT_BEARER_TOKEN_HERE') {
      console.log(`[MCP] Authenticating with https://mcp.fundednext.com using Bearer token...`);
      const initRes = await callFundedNextMcp(FUNDEDNEXT_API_TOKEN, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'migo-nq', version: '1.0' },
      });

      if (initRes.status === 200 && initRes.body && !initRes.body.error) {
        console.log(`[MCP SUCCESS] Connected to FundedNext MCP Server!`);
        const toolsRes = await callFundedNextMcp(FUNDEDNEXT_API_TOKEN, 'tools/call', {
          name: 'get_account_overview',
          arguments: { account_id: FUNDEDNEXT_ACCOUNT_ID },
        });

        if (toolsRes.body && toolsRes.body.result) {
          const resContent = toolsRes.body.result;
          console.log(`[MCP DATA] Account Data:`, resContent);
          if (resContent.balance) currentBalance = parseFloat(resContent.balance);
          if (resContent.eod_balance) eodStartingBalance = parseFloat(resContent.eod_balance);
        }
      } else {
        console.log(`[MCP INFO] Token query response: ${JSON.stringify(initRes.body || initRes.status)}`);
      }
    } else {
      console.log(`[NOTE] Using default/session EOD calculation rules until token is provided.`);
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
