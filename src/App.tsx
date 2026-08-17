import { useState, useEffect } from 'react';
import type { Account, Trade, TradingStats } from './types/journal';
import { 
  getAllAccounts, 
  saveAccount, 
  deleteAccount, 
  getTradesByAccount, 
  saveTrade, 
  deleteTrade
} from './services/db';
import { pullFromRealServerCloud, pushToRealServerCloud } from './services/dbSync';
import { computeTradingStats } from './utils/calculations';

import { Navbar } from './components/Navbar';
import { AccountProgressCard } from './components/AccountProgressCard';
import { SummaryCards } from './components/SummaryCards';
import { CalendarGrid } from './components/CalendarGrid';
import { EquityChart } from './components/EquityChart';
import { TradeTable } from './components/TradeTable';
import { AnalyticsView } from './components/AnalyticsView';
import { TradeEntryModal } from './components/TradeEntryModal';
import { TradeDetailModal } from './components/TradeDetailModal';
import { DayInspectorModal } from './components/DayInspectorModal';
import { AccountManagerModal } from './components/AccountManagerModal';
import { CalculatorModal } from './components/CalculatorModal';
import { BackupModal } from './components/BackupModal';
import { LockScreenModal } from './components/LockScreenModal';
import { FundedNextSyncModal } from './components/FundedNextSyncModal';
import { MonteCarloView } from './components/MonteCarloView';

import { Calendar, TrendingUp, Table, BarChart2, Activity } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'equity' | 'log' | 'analytics' | 'monte-carlo'>('calendar');
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return sessionStorage.getItem('migo_vault_unlocked') !== 'true';
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>('acc-50k-eval-default');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Modals state
  const [isTradeEntryOpen, setIsTradeEntryOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [dayInspector, setDayInspector] = useState<{ dateStr: string; trades: Trade[] } | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isFundedNextSyncOpen, setIsFundedNextSyncOpen] = useState(false);

  const reloadData = async () => {
    const accList = await getAllAccounts();
    setAccounts(accList);
    
    const targetAccId = accList.some((a) => a.id === activeAccountId)
      ? activeAccountId
      : accList.length > 0
      ? accList[0].id
      : 'all';
    
    setActiveAccountId(targetAccId);

    const tradeList = await getTradesByAccount(targetAccId);
    setTrades(tradeList);
  };

  const handleUnlockVault = async () => {
    sessionStorage.setItem('migo_vault_unlocked', 'true');
    setIsLocked(false);
    
    // Auto-pull latest cloud state on unlock
    await pullFromRealServerCloud();
    await reloadData();
  };

  const handleLockVault = () => {
    sessionStorage.removeItem('migo_vault_unlocked');
    setIsLocked(true);
  };

  useEffect(() => {
    if (!isLocked) {
      pullFromRealServerCloud().then(() => reloadData());
    } else {
      reloadData();
    }
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      getTradesByAccount(activeAccountId).then(setTrades);
    }
  }, [activeAccountId]);

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
  };

  const handleSaveTrade = async (trade: Trade) => {
    await saveTrade(trade);
    await reloadData();
    // Auto-push background sync to cloud server
    pushToRealServerCloud();
  };

  const handleDeleteTrade = async (tradeId: string) => {
    await deleteTrade(tradeId);
    await reloadData();
    // Auto-push background sync to cloud server
    pushToRealServerCloud();
  };

  const handleSaveAccount = async (account: Account) => {
    await saveAccount(account);
    setActiveAccountId(account.id);
    await reloadData();
    // Auto-push background sync to cloud server
    pushToRealServerCloud();
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteAccount(id);
    await reloadData();
    // Auto-push background sync to cloud server
    pushToRealServerCloud();
  };

  const handleResetSeedData = async () => {
    if (confirm('Reset journal data to the seeded FundedNext $50k account & trades?')) {
      const { forceResetToSeededData } = await import('./services/dbSync');
      await forceResetToSeededData();
      await reloadData();
      alert('Journal successfully reset to seeded FundedNext Flex $50K account and trades!');
    }
  };

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || null;
  const initialBalance = activeAccount ? activeAccount.initialBalance : 50000;
  const stats: TradingStats = computeTradingStats(trades, initialBalance);

  return (
    <div className="min-h-screen bg-[var(--gruv-bg)] text-[var(--gruv-fg)] font-mono selection:bg-[var(--gruv-yellow)] selection:text-[#1d2021]">
      
      {/* Master Lock Screen Modal */}
      <LockScreenModal
        isLocked={isLocked}
        onUnlock={handleUnlockVault}
      />

      <Navbar
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelectAccount={(id) => setActiveAccountId(id)}
        onOpenTradeModal={() => setIsTradeEntryOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenCalculatorModal={() => setIsCalculatorOpen(true)}
        onOpenBackupModal={() => setIsBackupOpen(true)}
        onOpenFundedNextSyncModal={() => setIsFundedNextSyncOpen(true)}
        onResetSeedData={handleResetSeedData}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onLockApp={handleLockVault}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        <AccountProgressCard
          account={activeAccount}
          trades={trades}
          onOpenEditAccount={() => setIsAccountModalOpen(true)}
        />

        <SummaryCards stats={stats} />

        <div className="flex items-center space-x-2 border-b border-[var(--gruv-border)] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'calendar'
                ? 'bg-[var(--gruv-yellow)] text-[#1d2021] shadow-md'
                : 'text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-surface)]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>PnL Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('equity')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'equity'
                ? 'bg-[var(--gruv-yellow)] text-[#1d2021] shadow-md'
                : 'text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-surface)]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Equity Trajectory</span>
          </button>

          <button
            onClick={() => setActiveTab('log')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'log'
                ? 'bg-[var(--gruv-yellow)] text-[#1d2021] shadow-md'
                : 'text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-surface)]'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Trade Log ({trades.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-[var(--gruv-yellow)] text-[#1d2021] shadow-md'
                : 'text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-surface)]'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Mindset Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('monte-carlo')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'monte-carlo'
                ? 'bg-[var(--gruv-yellow)] text-[#1d2021] shadow-md'
                : 'text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-surface)]'
            }`}
          >
            <Activity className="w-4 h-4 text-[var(--gruv-yellow)]" />
            <span>Monte Carlo Matrix</span>
          </button>
        </div>

        {activeTab === 'calendar' && (
          <CalendarGrid
            trades={trades}
            onSelectDay={(dateStr, dayTrades) => setDayInspector({ dateStr, trades: dayTrades })}
          />
        )}

        {activeTab === 'equity' && (
          <EquityChart trades={trades} initialBalance={initialBalance} />
        )}

        {activeTab === 'log' && (
          <TradeTable
            trades={trades}
            onSelectTrade={(t) => setSelectedTrade(t)}
            onDeleteTrade={handleDeleteTrade}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView trades={trades} />
        )}

        {activeTab === 'monte-carlo' && (
          <MonteCarloView account={activeAccount} trades={trades} />
        )}

      </main>

      <footer className="border-t border-[var(--gruv-border)] py-6 mt-12 text-center text-xs text-[var(--gruv-muted)] font-mono">
        <p>migo.nq • Real Server Database Sync Active</p>
      </footer>

      <TradeEntryModal
        isOpen={isTradeEntryOpen}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onClose={() => setIsTradeEntryOpen(false)}
        onSaveTrade={handleSaveTrade}
      />

      <TradeDetailModal
        trade={selectedTrade}
        accounts={accounts}
        onClose={() => setSelectedTrade(null)}
        onDeleteTrade={handleDeleteTrade}
      />

      <DayInspectorModal
        isOpen={!!dayInspector}
        dateStr={dayInspector?.dateStr || ''}
        trades={dayInspector?.trades || []}
        onClose={() => setDayInspector(null)}
        onSelectTrade={(t) => setSelectedTrade(t)}
      />

      <AccountManagerModal
        isOpen={isAccountModalOpen}
        accounts={accounts}
        onClose={() => setIsAccountModalOpen(false)}
        onSaveAccount={handleSaveAccount}
        onDeleteAccount={handleDeleteAccount}
      />

      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        accountBalance={activeAccount ? activeAccount.currentBalance : 50000}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onRefreshData={reloadData}
      />

      <FundedNextSyncModal
        isOpen={isFundedNextSyncOpen}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onClose={() => setIsFundedNextSyncOpen(false)}
        onAccountUpdated={async (updatedAccount) => {
          await saveAccount(updatedAccount);
          await reloadData();
        }}
      />

    </div>
  );
}
export default App;
