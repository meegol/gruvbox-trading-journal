import https from "https";

const DEFAULT_MCP_TOKEN = process.env.FUNDEDNEXT_API_TOKEN || "64000143|E2Ojwy1trtD4Vx6QXPbfsJOQtAhuweUOHIh5OMtn0616401e";

function callMcpRaw(token: string, method: string, params: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    });

    const req = https.request("https://mcp.fundednext.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "User-Agent": "migo-trading-journal/1.0",
        "Content-Length": Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

function cleanFuturesSymbol(sym: string): string {
  if (!sym) return "NQ";
  const s = sym.toUpperCase();
  if (s.startsWith("MNQ")) return "MNQ";
  if (s.startsWith("NQ")) return "NQ";
  if (s.startsWith("MES")) return "MES";
  if (s.startsWith("ES")) return "ES";
  if (s.startsWith("MYM")) return "MYM";
  if (s.startsWith("YM")) return "YM";
  if (s.startsWith("M2K")) return "M2K";
  if (s.startsWith("RTY")) return "RTY";
  if (s.startsWith("CL")) return "CL";
  if (s.startsWith("GC")) return "GC";
  return s;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  let body: any = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  if (!body) body = {};

  const token = (body.token || (req.headers && req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, "") : "") || DEFAULT_MCP_TOKEN).trim();
  const action = body.action || "sync_portfolio";

  try {
    if (action === "raw_rpc") {
      const { method, params } = body;
      const rpcRes = await callMcpRaw(token, method || "initialize", params || {});
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(rpcRes.body));
      return;
    }

    if (action === "get_portfolio" || action === "sync_portfolio") {
      let switchItems: any[] = [];
      try {
        const switchRes = await callMcpRaw(token, "tools/call", {
          name: "get_account_switch_list",
          arguments: { account_id: 3984627 },
        });
        switchItems = switchRes.body?.result?.structuredContent?.items || [];
      } catch (err) {
        console.warn("Failed to get switch list:", err);
      }

      if (switchItems.length === 0) {
        const portRes = await callMcpRaw(token, "tools/call", {
          name: "get_customer_portfolio_rollup",
          arguments: {},
        });
        const portData = portRes.body?.result?.structuredContent?.data || [];
        switchItems = portData.map((p: any) => ({
          id: p.account_id,
          login: p.login,
          starting_balance: p.starting_balance,
          plan_title: p.plan,
          status: p.status,
          tradovate_account_name: p.login ? `...FN${p.login}` : "",
        }));
      }

      const formattedAccounts: any[] = [];
      const allTrades: any[] = [];

      for (const item of switchItems) {
        let curBal = item.starting_balance || 50000;
        let pTarget = (item.starting_balance || 50000) * 0.05;
        let minLoss = (item.starting_balance || 50000) * 0.04;
        let dLoss = (item.starting_balance || 50000) * 0.02;

        try {
          const ov = await callMcpRaw(token, "tools/call", {
            name: "get_account_overview",
            arguments: { account_id: item.id },
          });
          const ovData = ov.body?.result?.structuredContent || {};
          const stats = ovData.stats || {};
          const obj = ovData.objectives || {};

          if (typeof stats.balance === "number") curBal = stats.balance;
          if (obj.overall_loss?.permitted_loss) minLoss = obj.overall_loss.permitted_loss;
          if (obj.profit?.profit_target) pTarget = obj.profit.profit_target;
        } catch (e) {
          console.warn(`Could not fetch overview for account ${item.id}:`, e);
        }

        const isFunded = (item.plan_title || "").toLowerCase().includes("funded");
        const tradovateSuffix = item.tradovate_account_name ? item.tradovate_account_name.slice(-5) : "";
        const displayName = tradovateSuffix ? `${item.plan_title} (${item.login} - ${tradovateSuffix})` : `${item.plan_title} (${item.login})`;

        formattedAccounts.push({
          id: `acc-${item.login || item.id}`,
          fundedNextAccountId: item.id,
          login: item.login,
          tradovateAccountName: item.tradovate_account_name,
          name: displayName,
          type: isFunded ? "funded" : "eval",
          initialBalance: item.starting_balance || 50000,
          currentBalance: curBal,
          profitTarget: pTarget,
          maxDrawdown: minLoss,
          dailyLossLimit: dLoss,
          isFundedNextFutures: true,
          eodStartingBalance: item.starting_balance || 50000,
          peakEodBalance: Math.max(curBal, item.starting_balance || 50000),
          status: item.status === "active" ? "active" : "failed",
          createdAt: new Date().toISOString(),
          notes: `${item.tradovate_account_name || ""} | Status: ${(item.status || "").toUpperCase()}`,
        });

        // Fetch trades
        const shouldFetchTrades = !body.accountId || body.accountId == item.id || `acc-${item.login}` === body.accountId;
        if (shouldFetchTrades) {
          try {
            const trRpc = await callMcpRaw(token, "tools/call", {
              name: "get_futures_trade_history",
              arguments: {
                account_id: item.id,
                per_page: 100,
              },
            });

            const trData = trRpc.body?.result?.structuredContent?.trades?.data || [];
            const mappedTrades = trData.map((t: any) => {
              const netPnl = parseFloat(t.net_pnl || "0");
              const fees = parseFloat(t.commission || "0");
              const openPrice = parseFloat(t.open_price || "0");
              const closePrice = parseFloat(t.close_price || "0");
              const qty = parseInt(t.qty || "1", 10);
              const dir = (t.type || "").toLowerCase() === "buy" ? "long" : "short";

              return {
                id: `trd-fn-${t.id || t.open_ticket}`,
                accountId: `acc-${item.login || item.id}`,
                symbol: cleanFuturesSymbol(t.symbol),
                rawSymbol: t.symbol,
                direction: dir,
                assetClass: "futures",
                session: "NY AM Open",
                entryPrice: openPrice,
                exitPrice: closePrice,
                quantity: qty,
                fees: fees,
                pnl: netPnl,
                pnlPercentage: t.pnl_percentage ? parseFloat(t.pnl_percentage) : 0,
                entryDate: t.open_time ? t.open_time.replace(" ", "T") : new Date().toISOString(),
                exitDate: t.close_time ? t.close_time.replace(" ", "T") : new Date().toISOString(),
                status: netPnl > 0 ? "win" : netPnl < 0 ? "loss" : "breakeven",
                emotion: "Disciplined",
                rating: 5,
                checklistPassed: true,
                preTradeNotes: "Auto-synced via FundedNext MCP",
                postTradeNotes: `Ticket #${t.open_ticket || t.close_ticket || t.id}`,
              };
            });
            allTrades.push(...mappedTrades);
          } catch (trErr) {
            console.warn(`Failed to fetch trades for account ${item.id}:`, trErr);
          }
        }
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        success: true,
        accounts: formattedAccounts,
        trades: allTrades,
        totalAccounts: formattedAccounts.length,
        totalTrades: allTrades.length,
        syncedAt: new Date().toISOString(),
      }));
      return;
    }

    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, message: `Unknown action: ${action}` }));
  } catch (err: any) {
    console.error("MCP Handler Error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, message: err.message || "Internal Server Error" }));
  }
}
