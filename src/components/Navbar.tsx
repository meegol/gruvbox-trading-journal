import React from 'react';
import type { Account } from '../types/journal';
import { 
  PlusCircle, 
  Calculator, 
  Database, 
  Sun, 
  Moon, 
  FolderPlus,
  Lock
} from 'lucide-react';


interface NavbarProps {
  accounts: Account[];
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  onOpenTradeModal: () => void;
  onOpenAccountModal: () => void;
  onOpenCalculatorModal: () => void;
  onOpenBackupModal: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLockApp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts,
  activeAccountId,
  onSelectAccount,
  onOpenTradeModal,
  onOpenAccountModal,
  onOpenCalculatorModal,
  onOpenBackupModal,
  isDarkMode,
  onToggleTheme,
  onLockApp,
}) => {

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--gruv-border)] bg-[var(--gruv-bg-soft)]/80 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--gruv-yellow)] text-[#1d2021] flex items-center justify-center font-bold font-mono text-sm">
            ●
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-wider text-[var(--gruv-fg)] font-mono">
              migo.<span className="text-[var(--gruv-yellow)]">nq</span>
            </h1>
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
            <option value="all">Combined Overview</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (${acc.initialBalance.toLocaleString()})
              </option>
            ))}
          </select>
          <button
            onClick={onOpenAccountModal}
            title="Create New Prop Eval / Account"
            className="p-1.5 rounded-lg text-[var(--gruv-yellow)] hover:bg-[var(--gruv-yellow)]/10 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenTradeModal}
            className="flex items-center space-x-1.5 bg-[var(--gruv-yellow)] text-[#1d2021] font-bold text-xs md:text-sm px-3.5 py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Log Trade</span>
          </button>

          <button
            onClick={onOpenCalculatorModal}
            title="Position Size Calculator"
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
            onClick={onLockApp}
            title="Lock Vault"
            className="glass-button p-2 rounded-xl hover:text-[var(--gruv-yellow)] transition-colors"
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleTheme}
            title="Toggle Dark / Light Theme"
            className="glass-button p-2 rounded-xl text-[var(--gruv-fg)] hover:text-[var(--gruv-yellow)] transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-[var(--gruv-yellow)]" /> : <Moon className="w-4 h-4 text-[var(--gruv-purple)]" />}
          </button>
        </div>

      </div>
    </header>
  );
};
