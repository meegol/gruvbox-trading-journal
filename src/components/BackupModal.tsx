import React, { useState } from 'react';
import { exportFullDatabaseJSON, importFullDatabaseJSON, clearAllDatabase } from '../services/db';
import type { Trade } from '../types/journal';
import { X, Download, Upload, FileSpreadsheet, RefreshCw } from 'lucide-react';


interface BackupModalProps {
  isOpen: boolean;
  trades: Trade[];
  onClose: () => void;
  onRefreshData: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  trades,
  onClose,
  onRefreshData,
}) => {
  if (!isOpen) return null;

  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportJSON = async () => {
    const jsonStr = await exportFullDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gruvbox-trading-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (trades.length === 0) return;
    const headers = ['ID', 'Date', 'AccountID', 'Symbol', 'Direction', 'AssetClass', 'BalanceBefore', 'BalanceAfter', 'EntryPrice', 'ExitPrice', 'Quantity', 'Fees', 'NetPnL', 'RMultiple', 'Emotion', 'Rating', 'PreNotes', 'PostNotes'];
    const rows = trades.map((t) => [
      t.id,
      t.entryDate,
      t.accountId,
      t.symbol,
      t.direction,
      t.assetClass,
      t.balanceBefore || '',
      t.balanceAfter || '',
      t.entryPrice || '',
      t.exitPrice || '',
      t.quantity || 1,
      t.fees,
      t.pnl,
      t.rMultiple || 0,
      t.emotion,
      t.rating,
      `"${(t.preTradeNotes || '').replace(/"/g, '""')}"`,
      `"${(t.postTradeNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gruvbox-trades-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const result = await importFullDatabaseJSON(content);
          setImportStatus(`Success! Imported ${result.accountsCount} accounts and ${result.tradesCount} trades.`);
          onRefreshData();
        } catch (err: any) {
          setImportStatus(`Import Error: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetData = async () => {
    if (confirm('WARNING: This will erase all local accounts, trades, and screenshots! Proceed?')) {
      await clearAllDatabase();
      onRefreshData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-md p-6 relative font-mono text-xs my-8">
        
        <div className="flex items-center justify-between border-b border-[var(--gruv-border)] pb-4 mb-4">
          <h2 className="font-bold text-base text-[var(--gruv-fg)]">BACKUP &amp; DATA PRIVACY</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-[var(--gruv-bg)]/80 border border-[var(--gruv-border)] text-[var(--gruv-muted)] text-[11px]">
            🔒 All data (trades, prop firm accounts &amp; chart screenshots) is stored 100% locally in your browser's IndexedDB. Export a JSON backup to keep your data safe forever.
          </div>

          {/* 1. Export JSON */}
          <button
            onClick={handleExportJSON}
            className="w-full py-3 px-4 rounded-xl bg-[var(--gruv-surface)] border border-[var(--gruv-border)] text-[var(--gruv-yellow)] font-bold hover:bg-[var(--gruv-yellow)]/10 flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Full JSON Database Backup</span>
          </button>

          {/* 2. Export CSV */}
          <button
            onClick={handleExportCSV}
            className="w-full py-3 px-4 rounded-xl bg-[var(--gruv-surface)] border border-[var(--gruv-border)] text-[var(--gruv-green)] font-bold hover:bg-[var(--gruv-green)]/10 flex items-center justify-center space-x-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Trades CSV (For Excel / Google Sheets)</span>
          </button>

          {/* 3. Restore JSON */}
          <label className="w-full py-3 px-4 rounded-xl bg-[var(--gruv-surface)] border border-[var(--gruv-border)] text-[var(--gruv-blue)] font-bold hover:bg-[var(--gruv-blue)]/10 flex items-center justify-center space-x-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Restore / Import JSON Backup</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          {importStatus && (
            <div className="p-3 rounded-xl bg-[var(--gruv-bg)] text-[var(--gruv-yellow)] font-mono text-[11px]">
              {importStatus}
            </div>
          )}

          {/* 4. Reset DB */}
          <button
            onClick={handleResetData}
            className="w-full py-2.5 px-4 rounded-xl border border-[var(--gruv-red)]/40 text-[var(--gruv-red)] hover:bg-[var(--gruv-red)]/10 flex items-center justify-center space-x-2 transition-colors text-[11px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear / Reset Local Storage</span>
          </button>
        </div>

        <div className="text-right pt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-[var(--gruv-surface)] text-[var(--gruv-fg)] border border-[var(--gruv-border)]">
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
