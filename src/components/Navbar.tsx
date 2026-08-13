import React from 'react';
import type { Account } from '../types/journal';
import { 
  PlusCircle, 
  Calculator, 
  Database, 
  Sparkles, 
  Sun, 
  Moon, 
  TrendingUp,
  FolderPlus
} from 'lucide-react';

interface NavbarProps {
  accounts: Account[];
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  onOpenTradeModal: () => void;
  onOpenAccountModal: () => void;
  onOpenCalculatorModal: () => void;
  onOpenBackupModal: () => void;
  onLoadDemoData: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts,
  activeAccountId,
  onSelectAccount,
  onOpenTradeModal,
  onOpenAccountModal,
  onOpenCalculatorModal,
  onOpenBackupModal,
  onLoadDemoData,
  isDarkMode,
  onToggleTheme,
}) => {


  return (
    <header className="sticky top-0 z-40 border-b border-[var(--gruv-border)] bg-[var(--gruv-bg-soft)]/80 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gruv-yellow)] to-[var(--gruv-orange)] flex items-center justify-center shadow-lg shadow-[var(--gruv-yellow)]/20 text-[#1d2021]">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg tracking-tight text-[var(--gruv-fg)]">
                GRUVBOX <span className="text-[var(--gruv-yellow)]">JOURNAL</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-[var(--gruv-yellow)]/15 text-[var(--gruv-yellow)] border border-[var(--gruv-yellow)]/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-[var(--gruv-muted)] font-mono">Personal Prop &amp; Trading Journal</p>
          </div>
        </div>

        {/* Account Switcher */}
        <div className="flex items-center space-x-2 bg-[var(--gruv-surface)] p-1.5 rounded-xl border border-[var(--gruv-border)]">
          <span className="text-xs font-mono text-[var(--gruv-muted)] pl-2 hidden sm:inline">Account:</span>
          <select
            value={activeAccountId}
            onChange={(e) => onSelectAccount(e.target.value)}
            className="bg-[var(--gruv-bg)] text-[var(--gruv-fg)] font-mono text-xs md:text-sm px-3 py-1.5 rounded-lg border border-[var(--gruv-border)] focus:outline-none focus:border-[var(--gruv-yellow)] cursor-pointer"
          >
            <option value="all">⚡ All Accounts Combined</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.type === 'eval' ? '🎯' : acc.type === 'funded' ? '💰' : '📈'} {acc.name} (${acc.initialBalance.toLocaleString()})
              </option>
            ))}
          </select>
          <button
            onClick={onOpenAccountModal}
            title="Create New Prop Eval or Account"
            className="p-1.5 rounded-lg text-[var(--gruv-yellow)] hover:bg-[var(--gruv-yellow)]/10 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={onOpenTradeModal}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-[var(--gruv-yellow)] to-[var(--gruv-orange)] text-[#1d2021] font-bold text-xs md:text-sm px-3.5 py-2 rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Log Trade</span>
          </button>

          <button
            onClick={onOpenCalculatorModal}
            title="Risk & Position Size Calculator"
            className="glass-button p-2 rounded-xl hover:text-[var(--gruv-yellow)] transition-colors"
          >
            <Calculator className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenBackupModal}
            title="JSON Backup & CSV Export"
            className="glass-button p-2 rounded-xl hover:text-[var(--gruv-yellow)] transition-colors"
          >
            <Database className="w-4 h-4" />
          </button>

          <button
            onClick={onLoadDemoData}
            title="Load $50k Eval Sample Data"
            className="glass-button p-2 rounded-xl text-[var(--gruv-yellow)] hover:bg-[var(--gruv-yellow)]/10 transition-colors flex items-center space-x-1 text-xs font-mono"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden lg:inline">Demo Data</span>
          </button>

          <button
            onClick={onToggleTheme}
            title="Toggle Dark / Light Gruvbox Theme"
            className="glass-button p-2 rounded-xl text-[var(--gruv-fg)] hover:text-[var(--gruv-yellow)] transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-[var(--gruv-yellow)]" /> : <Moon className="w-4 h-4 text-[var(--gruv-purple)]" />}
          </button>
        </div>

      </div>
    </header>
  );
};
