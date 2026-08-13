import React, { useState } from 'react';
import { getAllAccounts, getTradesByAccount, saveAccount, saveTrade } from '../services/db';

import { getStoredSyncKey, pushDataToCloudVault, pullDataFromCloudVault } from '../services/syncService';
import { X, Download, Upload, Cloud, RefreshCw, Smartphone, ShieldCheck } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {

  if (!isOpen) return null;

  const [syncKey, setSyncKey] = useState<string>(getStoredSyncKey() || 'migo-secret-key-1002');
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleExportJSON = async () => {
    const accounts = await getAllAccounts();
    const allTrades = await getTradesByAccount('all');
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      accounts,
      trades: allTrades,
    };

    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `migo-nq-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.accounts && Array.isArray(parsed.accounts)) {
          for (const acc of parsed.accounts) {
            await saveAccount(acc);
          }
        }
        if (parsed.trades && Array.isArray(parsed.trades)) {
          for (const trd of parsed.trades) {
            await saveTrade(trd);
          }
        }

        alert('Backup successfully imported!');
        onRefreshData();
        onClose();
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handlePushCloud = async () => {
    setLoading(true);
    setSyncStatus({ type: '', message: '' });
    const res = await pushDataToCloudVault(syncKey);
    setLoading(false);
    setSyncStatus({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
    if (res.success) {
      onRefreshData();
    }
  };

  const handlePullCloud = async () => {
    setLoading(true);
    setSyncStatus({ type: '', message: '' });
    const res = await pullDataFromCloudVault(syncKey);
    setLoading(false);
    setSyncStatus({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
    if (res.success) {
      onRefreshData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-mono text-xs">
      <div className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative my-8">
        
        <div className="flex items-center justify-between border-b border-[var(--gruv-border)] pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[var(--gruv-bg)] text-[var(--gruv-yellow)] border border-[var(--gruv-border)]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[var(--gruv-fg)]">VAULT &amp; MOBILE SYNC</h2>
              <p className="text-[11px] text-[var(--gruv-muted)]">Personal secret key cloud sync &amp; backups</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">

          {/* 1. Personal Secret Cloud Sync */}
          <div className="p-4 rounded-xl bg-[var(--gruv-bg)]/80 border border-[var(--gruv-border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[var(--gruv-yellow)] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[var(--gruv-green)]" />
                <span>PERSONAL CLOUD VAULT SYNC</span>
              </span>
              <span className="text-[10px] text-[var(--gruv-muted)]">Private Key Protection</span>
            </div>

            <p className="text-[11px] text-[var(--gruv-muted)]">
              Only devices with your Secret Sync Key can read/write your journal. Anyone else opening the webapp sees a blank isolated database.
            </p>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Your Secret Sync Key</label>
              <input
                type="text"
                value={syncKey}
                onChange={(e) => setSyncKey(e.target.value)}
                placeholder="Enter secret key (e.g. migo-secret-key-1002)"
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none font-bold"
              />
            </div>

            {syncStatus.message && (
              <div className={`p-2.5 rounded-lg text-[11px] font-bold ${
                syncStatus.type === 'success' ? 'bg-[var(--gruv-green)]/15 text-[var(--gruv-green)] border border-[var(--gruv-green)]/40' : 'bg-[var(--gruv-red)]/15 text-[var(--gruv-red)] border border-[var(--gruv-red)]/40'
              }`}>
                {syncStatus.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handlePushCloud}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl bg-[var(--gruv-yellow)] text-[#1d2021] font-bold flex items-center justify-center space-x-1.5 hover:brightness-110 transition-all shadow-md"
              >
                <Upload className="w-4 h-4" />
                <span>{loading ? 'Syncing...' : 'Push to Cloud'}</span>
              </button>

              <button
                onClick={handlePullCloud}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl bg-[var(--gruv-surface)] text-[var(--gruv-fg)] border border-[var(--gruv-border)] font-bold flex items-center justify-center space-x-1.5 hover:bg-[var(--gruv-bg)] transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-[var(--gruv-blue)]" />
                <span>{loading ? 'Restoring...' : 'Pull from Cloud'}</span>
              </button>
            </div>
          </div>

          {/* 2. Mobile App Installation (PWA / Standalone APK alternative) */}
          <div className="p-4 rounded-xl bg-[var(--gruv-bg)]/80 border border-[var(--gruv-border)] space-y-2">
            <span className="font-bold text-sm text-[var(--gruv-blue)] flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4" />
              <span>INSTALL AS MOBILE APP (ANDROID / IOS)</span>
            </span>
            <p className="text-[11px] text-[var(--gruv-muted)] leading-relaxed">
              Open <span className="text-[var(--gruv-yellow)] font-bold">meegol.github.io/gruvbox-trading-journal/</span> on your mobile browser (Chrome/Safari), tap <span className="font-bold text-[var(--gruv-fg)]">Menu (...)</span> and select <span className="font-bold text-[var(--gruv-yellow)]">"Add to Home Screen"</span> or <span className="font-bold text-[var(--gruv-yellow)]">"Install App"</span> to launch it as a standalone app!
            </p>
          </div>

          {/* 3. Offline JSON Export */}
          <div className="p-4 rounded-xl bg-[var(--gruv-bg)]/80 border border-[var(--gruv-border)] space-y-3">
            <span className="font-bold text-sm text-[var(--gruv-fg)]">LOCAL FILE BACKUP</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJSON}
                className="py-2 px-3 rounded-xl bg-[var(--gruv-bg)] text-[var(--gruv-fg)] border border-[var(--gruv-border)] font-bold flex items-center justify-center space-x-1.5 hover:border-[var(--gruv-yellow)] transition-colors"
              >
                <Download className="w-4 h-4 text-[var(--gruv-yellow)]" />
                <span>Export JSON File</span>
              </button>

              <label className="py-2 px-3 rounded-xl bg-[var(--gruv-bg)] text-[var(--gruv-fg)] border border-[var(--gruv-border)] font-bold flex items-center justify-center space-x-1.5 hover:border-[var(--gruv-yellow)] cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-[var(--gruv-green)]" />
                <span>Import JSON File</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-[var(--gruv-border)] text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--gruv-surface)] text-[var(--gruv-fg)] border border-[var(--gruv-border)] hover:bg-[var(--gruv-bg)] transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
