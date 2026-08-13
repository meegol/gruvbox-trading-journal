import React from 'react';
import type { Account, Trade } from '../types/journal';
import { computeAccountProgress } from '../utils/calculations';
import { Target, Award, ShieldAlert, TrendingUp, CheckCircle, DollarSign } from 'lucide-react';


interface AccountProgressCardProps {
  account: Account | null;
  trades: Trade[];
  onOpenEditAccount: () => void;
}

export const AccountProgressCard: React.FC<AccountProgressCardProps> = ({
  account,
  trades,
  onOpenEditAccount,
}) => {
  if (!account) {
    return (
      <div className="glass-panel p-6 text-center text-[var(--gruv-muted)] font-mono">
        Viewing combined stats across all accounts.
      </div>
    );
  }

  const progress = computeAccountProgress(account, trades);

  const isNetPositive = progress.netPnl >= 0;

  return (
    <div className="glass-panel glass-panel-hover p-5 md:p-6 transition-all relative overflow-hidden">
      {/* Decorative subtle background gradient glow */}
      <div 
        className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none ${
          progress.isPassed 
            ? 'bg-[var(--gruv-green)]' 
            : isNetPositive 
            ? 'bg-[var(--gruv-yellow)]' 
            : 'bg-[var(--gruv-red)]'
        }`}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-[var(--gruv-border)] pb-4">
        {/* Account Title & Type Badge */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[var(--gruv-bg)] border border-[var(--gruv-border)] text-[var(--gruv-yellow)]">
            {account.type === 'eval' ? <Target className="w-5 h-5" /> : account.type === 'funded' ? <Award className="w-5 h-5 text-[var(--gruv-green)]" /> : <TrendingUp className="w-5 h-5 text-[var(--gruv-blue)]" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-lg text-[var(--gruv-fg)] font-mono">{account.name}</h2>
              <span className={`text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold border ${
                account.type === 'eval' 
                  ? 'bg-[var(--gruv-yellow)]/15 text-[var(--gruv-yellow)] border-[var(--gruv-yellow)]/40'
                  : account.type === 'funded'
                  ? 'bg-[var(--gruv-green)]/15 text-[var(--gruv-green)] border-[var(--gruv-green)]/40'
                  : 'bg-[var(--gruv-blue)]/15 text-[var(--gruv-blue)] border-[var(--gruv-blue)]/40'
              }`}>
                {progress.typeLabel}
              </span>
            </div>
            <p className="text-xs text-[var(--gruv-muted)] font-mono mt-0.5">
              Initial Balance: ${account.initialBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Current Balance & Net PnL Display */}
        <div className="text-right">
          <div className="text-xs text-[var(--gruv-muted)] font-mono uppercase tracking-wider">Current Balance</div>
          <div className="text-xl md:text-2xl font-bold font-mono text-[var(--gruv-fg)]">
            ${progress.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-xs font-mono font-bold flex items-center justify-end space-x-1 ${isNetPositive ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
            <span>{isNetPositive ? '+' : ''}${progress.netPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>({isNetPositive ? '+' : ''}{((progress.netPnl / account.initialBalance) * 100).toFixed(2)}%)</span>
          </div>
        </div>
      </div>

      {/* Dynamic Progress Bars based on Account Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Evaluation Progress to PASSING */}
        {account.type === 'eval' && (
          <div className="bg-[var(--gruv-bg)]/60 p-4 rounded-xl border border-[var(--gruv-border)]">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold text-[var(--gruv-yellow)] flex items-center space-x-1.5">
                <Target className="w-4 h-4" />
                <span>PROGRESS TO PASSING EVAL</span>
              </span>
              <span className="font-bold text-[var(--gruv-fg)]">
                ${progress.netPnl > 0 ? progress.netPnl.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'} / ${progress.target?.toLocaleString()}
              </span>
            </div>

            {/* Target Progress Bar */}
            <div className="w-full h-3 bg-[var(--gruv-bg-soft)] rounded-full overflow-hidden border border-[var(--gruv-border)] p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[var(--gruv-yellow)] to-[var(--gruv-green)] transition-all duration-500 shadow-sm"
                style={{ width: `${progress.progressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[var(--gruv-muted)] mt-2">
              <span>{progress.progressPct?.toFixed(1)}% Completed</span>
              {progress.isPassed ? (
                <span className="text-[var(--gruv-green)] font-bold flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>TARGET ACHIEVED!</span>
                </span>
              ) : (
                <span>Need ${progress.remainingToPass?.toLocaleString('en-US', { minimumFractionDigits: 2 })} more</span>
              )}
            </div>
          </div>
        )}

        {/* 2. Funded Progress to PAYOUT */}
        {account.type === 'funded' && (
          <div className="bg-[var(--gruv-bg)]/60 p-4 rounded-xl border border-[var(--gruv-border)]">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold text-[var(--gruv-green)] flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4" />
                <span>PROGRESS TO NEXT PAYOUT</span>
              </span>
              <span className="font-bold text-[var(--gruv-fg)]">
                ${progress.netPnl > 0 ? progress.netPnl.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'} / ${progress.payoutThreshold?.toLocaleString()}
              </span>
            </div>

            {/* Payout Progress Bar */}
            <div className="w-full h-3 bg-[var(--gruv-bg-soft)] rounded-full overflow-hidden border border-[var(--gruv-border)] p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[var(--gruv-blue)] to-[var(--gruv-green)] transition-all duration-500 shadow-sm"
                style={{ width: `${progress.progressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[var(--gruv-muted)] mt-2">
              <span>{progress.progressPct?.toFixed(1)}% Payout Buffer</span>
              {progress.isEligible ? (
                <span className="text-[var(--gruv-green)] font-bold flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>PAYOUT READY!</span>
                </span>
              ) : (
                <span>${progress.remainingToPayout?.toLocaleString('en-US', { minimumFractionDigits: 2 })} until payout</span>
              )}
            </div>
          </div>
        )}

        {/* 3. Personal Account Growth */}
        {account.type === 'personal' && (
          <div className="bg-[var(--gruv-bg)]/60 p-4 rounded-xl border border-[var(--gruv-border)]">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold text-[var(--gruv-blue)] flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>ALL-TIME RETURN ON CAPITAL</span>
              </span>
              <span className="font-bold text-[var(--gruv-fg)]">
                {progress.growthPercent! >= 0 ? '+' : ''}{progress.growthPercent?.toFixed(2)}%
              </span>
            </div>

            <div className="w-full h-3 bg-[var(--gruv-bg-soft)] rounded-full overflow-hidden border border-[var(--gruv-border)] p-0.5">
              <div 
                className="h-full rounded-full bg-[var(--gruv-blue)] transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(100, Math.max(0, 50 + (progress.growthPercent || 0)))}%` }}
              />
            </div>
            <div className="text-xs font-mono text-[var(--gruv-muted)] mt-2 text-right">
              Peak Balance: ${progress.currentBalance.toLocaleString()}
            </div>
          </div>
        )}

        {/* Max Drawdown Cushion Bar (Applies to all prop firm accounts) */}
        <div className="bg-[var(--gruv-bg)]/60 p-4 rounded-xl border border-[var(--gruv-border)]">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-[var(--gruv-orange)] flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>MAX DRAWDOWN BUFFER</span>
            </span>
            <span className="font-bold text-[var(--gruv-fg)]">
              ${progress.drawdownBufferRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} Cushion
            </span>
          </div>

          {/* Drawdown Used Bar */}
          <div className="w-full h-3 bg-[var(--gruv-bg-soft)] rounded-full overflow-hidden border border-[var(--gruv-border)] p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                progress.drawdownUsedPercent > 70 ? 'bg-[var(--gruv-red)]' : 'bg-[var(--gruv-orange)]'
              }`}
              style={{ width: `${Math.min(100, progress.drawdownUsedPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-[var(--gruv-muted)] mt-2">
            <span>Used ${progress.maxDrawdownUsed.toLocaleString('en-US', { minimumFractionDigits: 2 })} of ${progress.maxDrawdownLimit.toLocaleString()}</span>
            <span className={progress.isFailed ? 'text-[var(--gruv-red)] font-bold' : 'text-[var(--gruv-green)]'}>
              {progress.isFailed ? 'BREACHED!' : `${(100 - progress.drawdownUsedPercent).toFixed(1)}% Safe`}
            </span>
          </div>
        </div>

      </div>

      {/* Account Status Text Bar */}
      <div className="mt-4 pt-3 border-t border-[var(--gruv-border)]/50 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2 text-[var(--gruv-fg)]">
          <span className="text-[var(--gruv-muted)]">Status:</span>
          <span className="font-bold text-[var(--gruv-yellow)]">{progress.statusText}</span>
        </div>
        <button
          onClick={onOpenEditAccount}
          className="text-[var(--gruv-muted)] hover:text-[var(--gruv-yellow)] transition-colors underline"
        >
          Edit Account Limits
        </button>
      </div>
    </div>
  );
};
