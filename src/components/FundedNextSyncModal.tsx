import React, { useState } from 'react';
import type { Account } from '../types/journal';
import { syncFundedNextFuturesAccount, syncAllFundedNextAccounts, updateAccountEodStartingBalance } from '../services/fundedNextSync';
import { X, RefreshCw, Key, ShieldCheck, HelpCircle, CheckCircle, AlertTriangle, Layers } from 'lucide-react';

interface FundedNextSyncModalProps {
  isOpen: boolean;
  accounts: Account[];
  activeAccountId: string;
  onClose: () => void;
  onAccountUpdated: (account: Account) => void;
}

export const FundedNextSyncModal: React.FC<FundedNextSyncModalProps> = ({
  isOpen,
  accounts,
  activeAccountId,
  onClose,
  onAccountUpdated,
}) => {
  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];
  const [selectedAccountId, setSelectedAccountId] = useState<string>(currentAccount?.id || '');
  const targetAccount = accounts.find((a) => a.id === selectedAccountId) || currentAccount;

  const [apiAccountKey, setApiAccountKey] = useState<string>(targetAccount?.apiAccountKey || '');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [customEodBalance, setCustomEodBalance] = useState<string>(
    (targetAccount?.eodStartingBalance ?? targetAccount?.currentBalance ?? 50000).toString()
  );
  
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'api' | 'manual' | 'guide'>('api');

  const handleSyncNow = async () => {
    if (!targetAccount) return;
    setIsSyncing(true);
    setStatusMessage(null);

    const parsedEod = parseFloat(customEodBalance);
    const eodVal = isNaN(parsedEod) ? undefined : parsedEod;

    const res = await syncFundedNextFuturesAccount(targetAccount, sessionToken || apiAccountKey, eodVal);
    setIsSyncing(false);

    if (res.success && res.syncedAccount) {
      setStatusMessage({ type: 'success', text: res.message });
      onAccountUpdated(res.syncedAccount);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setStatusMessage(null);

    const res = await syncAllFundedNextAccounts(sessionToken || apiAccountKey);
    setIsSyncing(false);

    if (res.success && res.syncedAccounts) {
      setStatusMessage({ type: 'success', text: res.message });
      if (res.syncedAccounts.length > 0) {
        onAccountUpdated(res.syncedAccounts[0]);
      }
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleSaveEodManual = async () => {
    if (!targetAccount) return;
    const parsed = parseFloat(customEodBalance);
    if (isNaN(parsed)) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid dollar balance.' });
      return;
    }

    const updated = await updateAccountEodStartingBalance(targetAccount, parsed);
    onAccountUpdated(updated);
    setStatusMessage({
      type: 'success',
      text: `EOD Starting Balance set to $${parsed.toLocaleString('en-US', { minimumFractionDigits: 2 })}!`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 border-2 border-[var(--gruv-border)] relative text-[var(--gruv-fg)] font-mono">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-[var(--gruv-border)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--gruv-yellow)]/15 border border-[var(--gruv-yellow)]/40 flex items-center justify-center text-[var(--gruv-yellow)]">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wider text-[var(--gruv-fg)]">
              FundedNext Futures Sync & EOD Engine
            </h2>
            <p className="text-xs text-[var(--gruv-muted)]">
              Automatic data fetching & EOD balance-based drawdown tracking
            </p>
          </div>
        </div>

        {/* Account Selector */}
        <div className="mb-5 bg-[var(--gruv-bg)] p-3.5 rounded-xl border border-[var(--gruv-border)]">
          <label className="block text-xs font-bold text-[var(--gruv-muted)] uppercase mb-1">
            Target Journal Account
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => {
              setSelectedAccountId(e.target.value);
              const acc = accounts.find((a) => a.id === e.target.value);
              if (acc) {
                setApiAccountKey(acc.apiAccountKey || '');
                setCustomEodBalance((acc.eodStartingBalance ?? acc.currentBalance).toString());
              }
            }}
            className="w-full bg-[var(--gruv-bg-soft)] border border-[var(--gruv-border)] rounded-lg px-3 py-2 text-sm text-[var(--gruv-fg)] focus:outline-none focus:border-[var(--gruv-yellow)]"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.type.toUpperCase()} - ${acc.currentBalance.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--gruv-border)] mb-5">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 text-xs font-bold font-mono border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'api'
                ? 'border-[var(--gruv-yellow)] text-[var(--gruv-yellow)]'
                : 'border-transparent text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Dashboard API Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 text-xs font-bold font-mono border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'manual'
                ? 'border-[var(--gruv-yellow)] text-[var(--gruv-yellow)]'
                : 'border-transparent text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>EOD Baseline Override</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 text-xs font-bold font-mono border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'guide'
                ? 'border-[var(--gruv-yellow)] text-[var(--gruv-yellow)]'
                : 'border-transparent text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>API & Webhook Guide</span>
          </button>
        </div>

        {/* Tab 1: API Sync */}
        {activeTab === 'api' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--gruv-muted)] mb-1">
                FundedNext Account ID / Key
              </label>
              <input
                type="text"
                placeholder="e.g. FN-FUTURES-884920"
                value={apiAccountKey}
                onChange={(e) => setApiAccountKey(e.target.value)}
                className="w-full bg-[var(--gruv-bg-soft)] border border-[var(--gruv-border)] rounded-lg px-3 py-2 text-sm text-[var(--gruv-fg)] focus:outline-none focus:border-[var(--gruv-yellow)] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--gruv-muted)] mb-1">
                Dashboard Bearer Token (Optional for live API fetch)
              </label>
              <input
                type="password"
                placeholder="Paste Bearer eyJhbGciOi..."
                value={sessionToken}
                onChange={(e) => setSessionToken(e.target.value)}
                className="w-full bg-[var(--gruv-bg-soft)] border border-[var(--gruv-border)] rounded-lg px-3 py-2 text-sm text-[var(--gruv-fg)] focus:outline-none focus:border-[var(--gruv-yellow)] font-mono text-xs"
              />
              <p className="text-[11px] text-[var(--gruv-muted)] mt-1">
                Found in DevTools Network tab when logged into <span className="text-[var(--gruv-yellow)]">dashboard.fundednext.com</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--gruv-muted)] mb-1">
                Today's EOD Starting Balance ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={customEodBalance}
                onChange={(e) => setCustomEodBalance(e.target.value)}
                className="w-full bg-[var(--gruv-bg-soft)] border border-[var(--gruv-border)] rounded-lg px-3 py-2 text-sm text-[var(--gruv-fg)] focus:outline-none focus:border-[var(--gruv-yellow)] font-mono"
              />
              <p className="text-[11px] text-[var(--gruv-muted)] mt-1">
                Used to calculate your exact 5:00 PM EST daily loss floor cushion.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="w-full py-3 px-4 rounded-xl bg-[var(--gruv-yellow)] text-[var(--gruv-bg)] font-bold hover:brightness-110 transition-all flex items-center justify-center space-x-2 shadow"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'SYNCING WITH FUNDEDNEXT...' : 'FETCH & SYNC SELECTED ACCOUNT'}</span>
              </button>

              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--gruv-bg-soft)] border border-[var(--gruv-border)] hover:border-[var(--gruv-yellow)] text-[var(--gruv-fg)] font-bold transition-all flex items-center justify-center space-x-2"
              >
                <Layers className={`w-4 h-4 text-[var(--gruv-yellow)] ${isSyncing ? 'animate-spin' : ''}`} />
                <span>REFRESH ALL PORTFOLIO ACCOUNTS & TRADES</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Manual EOD Override */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div className="bg-[var(--gruv-bg)] p-4 rounded-xl border border-[var(--gruv-border)] text-xs text-[var(--gruv-muted)] space-y-2">
              <div className="font-bold text-[var(--gruv-yellow)] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>EOD Balance-Based Drawdown Rule</span>
              </div>
              <p>
                At 5:00 PM EST (00:00 MT server reset), FundedNext records your account balance. Your daily loss floor for the next session will be:
              </p>
              <div className="bg-[var(--gruv-bg-soft)] p-2.5 rounded font-mono text-[var(--gruv-fg)] font-bold text-center border border-[var(--gruv-border)]">
                Daily Loss Floor = EOD Balance - ${(targetAccount?.dailyLossLimit || 1000).toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--gruv-muted)] mb-1">
                Set EOD Starting Balance for Today ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={customEodBalance}
                onChange={(e) => setCustomEodBalance(e.target.value)}
                className="w-full bg-[var(--gruv-bg-soft)] border border-[var(--gruv-border)] rounded-lg px-3 py-2 text-sm text-[var(--gruv-fg)] focus:outline-none focus:border-[var(--gruv-yellow)] font-mono"
              />
            </div>

            <button
              onClick={handleSaveEodManual}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--gruv-green)] text-[var(--gruv-bg)] font-bold hover:brightness-110 transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>LOCK EOD STARTING BALANCE</span>
            </button>
          </div>
        )}

        {/* Tab 3: Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-4 text-xs text-[var(--gruv-muted)]">
            <div className="bg-[var(--gruv-bg)] p-3.5 rounded-xl border border-[var(--gruv-border)] space-y-2">
              <div className="font-bold text-[var(--gruv-yellow)] flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Is there a FundedNext Dashboard API?</span>
              </div>
              <p>
                FundedNext uses an internal REST backend for <span className="text-[var(--gruv-fg)] font-bold">dashboard.fundednext.com</span>. 
              </p>
              <ul className="list-disc list-inside space-y-1 text-[var(--gruv-fg)]">
                <li>
                  <strong className="text-[var(--gruv-yellow)]">Bearer Token:</strong> You can grab your session Bearer token from browser DevTools (Network tab under request headers to <code className="bg-[var(--gruv-bg-soft)] px-1 rounded">dashboard.fundednext.com/api</code>).
                </li>
                <li>
                  <strong className="text-[var(--gruv-yellow)]">Tradovate / Match-Trader / Rithmic:</strong> For FundedNext Futures, platform webhooks can broadcast closed trades directly into your journal.
                </li>
              </ul>
            </div>

            <div className="bg-[var(--gruv-bg-soft)] p-3 rounded-lg border border-[var(--gruv-border)] font-mono">
              <div className="text-[var(--gruv-fg)] font-bold mb-1">Webhook Endpoint Schema:</div>
              <div className="text-[11px] text-[var(--gruv-muted)] overflow-x-auto">
                <code>POST /api/webhook/fundednext</code><br />
                <code>Header: Authorization: Bearer &lt;YourKey&gt;</code>
              </div>
            </div>
          </div>
        )}

        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-lg border flex items-center space-x-2 text-xs font-mono font-bold ${
              statusMessage.type === 'success'
                ? 'bg-[var(--gruv-green)]/20 border-[var(--gruv-green)] text-[var(--gruv-green)]'
                : 'bg-[var(--gruv-red)]/20 border-[var(--gruv-red)] text-[var(--gruv-red)]'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[var(--gruv-border)] flex items-center justify-between text-xs">
          <span className="text-[var(--gruv-muted)]">
            Session Reset Time: <span className="text-[var(--gruv-yellow)] font-bold">5:00 PM EST (21:00 UTC)</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[var(--gruv-bg-soft)] border border-[var(--gruv-border)] hover:text-[var(--gruv-fg)] text-[var(--gruv-muted)]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
