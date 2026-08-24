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
import { fetchLiveFundedNextData } from './services/fundedNextSync';
import { pushToRealServerCloud } from './services/dbSync';
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
  const [activeAccountId, setActiveAccountId] = useState<string>('acc-963132214');
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
    try {
      let accs = await getAllAccounts();
      if (accs.length === 0 || (accs.length === 1 && accs[0].id === 'acc-50k-eval-default')) {
        const live = await fetchLiveFundedNextData();
        if (live.success && live.accounts.length > 0) {
          for (const a of live.accounts) await saveAccount(a);
          for (const t of live.trades) await saveTrade(t);
          accs = await getAllAccounts();
        }
      }

      setAccounts(accs);

      // Track the 48010 account by default (FNFTCHMIGUELCARANDAN48010 / 963132214)
      const target48010 = accs.find(
        (a) =>
          (a.name && (a.name.includes('48010') || a.name.includes('963132214'))) ||
          (a.notes && a.notes.includes('48010')) ||
          a.id === 'acc-963132214'
      );

      const targetId =
        activeAccountId && accs.some((a) => a.id === activeAccountId) && activeAccountId !== 'acc-50k-eval-default'
          ? activeAccountId
          : target48010
          ? target48010.id
          : accs[0]?.id || 'acc-963132214';

      setActiveAccountId(targetId);
      let tradeList = await getTradesByAccount(targetId);
      const activeAcc = accs.find((a) => a.id === targetId);
      if (
        tradeList.length === 0 &&
        activeAcc &&
        activeAcc.currentBalance !== undefined &&
        activeAcc.currentBalance !== activeAcc.initialBalance
      ) {
        const pnlDiff = activeAcc.currentBalance - activeAcc.initialBalance;
        const todayIso = new Date().toISOString().split('T')[0];
        const sessionTrade: Trade = {
          id: `trd-fn-session-${activeAcc.id}`,
          accountId: activeAcc.id,
          symbol: 'NQ',
          direction: pnlDiff >= 0 ? 'long' : 'short',
          assetClass: 'futures',
          session: 'NY AM Open',
          entryPrice: 0,
          exitPrice: 0,
          quantity: 1,
          fees: 0,
          pnl: pnlDiff,
          pnlPercentage: (pnlDiff / activeAcc.initialBalance) * 100,
          entryDate: `${todayIso}T09:30`,
          exitDate: `${todayIso}T16:00`,
          status: pnlDiff > 0 ? 'win' : 'loss',
          emotion: 'Disciplined',
          rating: 5,
          checklistPassed: true,
          preTradeNotes: 'FundedNext Live Balance Sync',
          postTradeNotes: `Session Profit: ${pnlDiff >= 0 ? '+' : ''}$${pnlDiff.toFixed(2)} (Live Balance: $${activeAcc.currentBalance.toLocaleString()})`,
        };
        await saveTrade(sessionTrade);
        tradeList = [sessionTrade];
      }
      setTrades(tradeList);
    } catch (e) {
      console.error('Error reloading data:', e);
    }
  };

  const handleUnlockVault = async () => {
    sessionStorage.setItem('migo_vault_unlocked', 'true');
    setIsLocked(false);
    await reloadData();
  };

  const handleLockVault = () => {
    sessionStorage.removeItem('migo_vault_unlocked');
    setIsLocked(true);
  };

  useEffect(() => {
    reloadData();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      getTradesByAccount(activeAccountId).then(async (list) => {
        const currentAcc = accounts.find((a) => a.id === activeAccountId);
        if (
          list.length === 0 &&
          currentAcc &&
          currentAcc.currentBalance !== undefined &&
          currentAcc.currentBalance !== currentAcc.initialBalance
        ) {
          const pnlDiff = currentAcc.currentBalance - currentAcc.initialBalance;
          const todayIso = new Date().toISOString().split('T')[0];
          const sessionTrade: Trade = {
            id: `trd-fn-session-${currentAcc.id}`,
            accountId: currentAcc.id,
            symbol: 'NQ',
            direction: pnlDiff >= 0 ? 'long' : 'short',
            assetClass: 'futures',
            session: 'NY AM Open',
            entryPrice: 0,
            exitPrice: 0,
            quantity: 1,
            fees: 0,
            pnl: pnlDiff,
            pnlPercentage: (pnlDiff / currentAcc.initialBalance) * 100,
            entryDate: `${todayIso}T09:30`,
            exitDate: `${todayIso}T16:00`,
            status: pnlDiff > 0 ? 'win' : 'loss',
            emotion: 'Disciplined',
            rating: 5,
            checklistPassed: true,
            preTradeNotes: 'FundedNext Live Balance Sync',
            postTradeNotes: `Session Profit: ${pnlDiff >= 0 ? '+' : ''}$${pnlDiff.toFixed(2)} (Live Balance: $${currentAcc.currentBalance.toLocaleString()})`,
          };
          await saveTrade(sessionTrade);
          setTrades([sessionTrade]);
        } else {
          setTrades(list);
        }
      });
    }
  }, [activeAccountId, accounts]);

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
  const stats: TradingStats = computeTradingStats(trades, initialBalance, activeAccount?.currentBalance);

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
            activeAccount={activeAccount}
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
