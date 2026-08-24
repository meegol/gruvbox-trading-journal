import React, { useState } from "react";
import type { Account, Trade } from "../types/journal";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Sliders, 
  HelpCircle,
  TrendingUp,
  Zap
} from "lucide-react";

interface FundedNextSafetyRadarProps {
  account: Account | null;
  trades: Trade[];
}

export const FundedNextSafetyRadar: React.FC<FundedNextSafetyRadarProps> = ({ account, trades }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [simulatedPnl, setSimulatedPnl] = useState<number>(322.60);
  const [showTooltip, setShowTooltip] = useState(false);

  if (!account) return null;

  const isFundedNext = !!account.isFundedNextFutures || account.name.includes("Futures") || !!account.login;
  const initialBalance = account.initialBalance || 50000;
  const currentBalance = account.currentBalance || initialBalance;
  const profitTarget = account.profitTarget || 2500;
  const maxDrawdownLimit = account.maxDrawdown || 1500;
  const dailyLossLimit = account.dailyLossLimit || 1000;

  // Account Hard Equity Floor ($48,500 for 50k flex)
  const hardEquityFloor = initialBalance - maxDrawdownLimit;
  const totalCushion = Math.max(0, currentBalance - hardEquityFloor);
  const cushionPercent = (totalCushion / maxDrawdownLimit) * 100;

  // Consistency Rule Calculations (40% maximum single-day profit cap)
  const accountTrades = trades.filter((t) => t.accountId === account.id);
  const tradesByDay = new Map<string, number>();
  for (const t of accountTrades) {
    const day = t.entryDate ? t.entryDate.split("T")[0] : "today";
    tradesByDay.set(day, (tradesByDay.get(day) || 0) + t.pnl);
  }

  let highestDayProfit = 0;
  tradesByDay.forEach((pnl) => {
    if (pnl > highestDayProfit) highestDayProfit = pnl;
  });

  if (highestDayProfit === 0 && currentBalance > initialBalance) {
    highestDayProfit = currentBalance - initialBalance;
  }

  const standardSingleDayCeiling = profitTarget * 0.40;
  const consistencyRate = profitTarget > 0 ? (highestDayProfit / profitTarget) * 100 : 0;
  const headroomToday = Math.max(0, standardSingleDayCeiling - highestDayProfit);

  const effectiveProfitTarget = highestDayProfit > standardSingleDayCeiling
    ? highestDayProfit / 0.40
    : profitTarget;

  const isConsistencyPassing = consistencyRate <= 40.0;

  // Simulator Math
  const simSingleDayCeiling = profitTarget * 0.40;
  const simEffectiveTarget = simulatedPnl > simSingleDayCeiling 
    ? simulatedPnl / 0.40 
    : profitTarget;
  const simExceedsCap = simulatedPnl > simSingleDayCeiling;
  const simAddedRequirement = Math.max(0, simEffectiveTarget - profitTarget);

  const mnqRiskPerTrade = 30; // $2/pt * 15 pts
  const safeTradesRemaining = Math.floor(totalCushion / mnqRiskPerTrade);

  return (
    <div className="glass-panel p-4 md:p-5 border-2 border-[var(--gruv-yellow)]/30 rounded-2xl bg-[var(--gruv-surface)]/80 relative overflow-hidden transition-all shadow-lg font-mono">
      <div className={`h-1.5 w-full absolute top-0 left-0 ${
        isConsistencyPassing && totalCushion > 500
          ? "bg-gradient-to-r from-[var(--gruv-yellow)] via-[var(--gruv-green)] to-[var(--gruv-yellow)]"
          : "bg-[var(--gruv-orange)]"
      }`} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--gruv-yellow)]/15 border border-[var(--gruv-yellow)]/40 flex items-center justify-center text-[var(--gruv-yellow)] font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm md:text-base text-[var(--gruv-fg)] tracking-wider">
                PROP SAFETY &amp; CONSISTENCY RADAR
              </h3>
              {isFundedNext && (
                <span className="text-[9px] px-2 py-0.5 rounded bg-[var(--gruv-yellow)] text-[#1d2021] font-bold uppercase">
                  FundedNext Flex 40%
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--gruv-muted)] mt-0.5">
              Live Drawdown Cushion &bull; 40% Consistency Ceiling &bull; Account Guard
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 ${
            isConsistencyPassing
              ? "bg-[var(--gruv-green)]/15 border-[var(--gruv-green)]/40 text-[var(--gruv-green)]"
              : "bg-[var(--gruv-orange)]/15 border-[var(--gruv-orange)]/40 text-[var(--gruv-orange)]"
          }`}>
            <span className="text-[10px] uppercase text-[var(--gruv-muted)]">Consistency:</span>
            <span>{consistencyRate.toFixed(1)}% / 40%</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[var(--gruv-bg)] border border-[var(--gruv-border)] text-xs font-bold text-[var(--gruv-fg)] flex items-center space-x-1.5">
            <span className="text-[10px] uppercase text-[var(--gruv-muted)]">Equity Cushion:</span>
            <span className="text-[var(--gruv-green)]">+${totalCushion.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl bg-[var(--gruv-yellow)] text-[#1d2021] font-bold hover:brightness-110 transition-all text-xs flex items-center space-x-1.5 shadow cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isExpanded ? "Hide Radar" : "Open Radar HUD"}</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-[var(--gruv-border)] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-[var(--gruv-bg)] p-4 rounded-xl border border-[var(--gruv-border)] space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--gruv-yellow)] uppercase tracking-wider flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>40% Consistency Ceiling</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--gruv-surface)] text-[var(--gruv-muted)] border border-[var(--gruv-border)]">
                  Rule Cap
                </span>
              </div>

              <div>
                <div className="text-2xl font-extrabold text-[var(--gruv-fg)] tracking-wide">
                  ${highestDayProfit.toFixed(2)}{" "}
                  <span className="text-xs text-[var(--gruv-muted)] font-normal">
                    / max ${standardSingleDayCeiling.toFixed(0)} cap
                  </span>
                </div>
                <p className="text-[11px] text-[var(--gruv-muted)] mt-1">
                  Highest single-day profit is <strong className="text-[var(--gruv-green)]">{consistencyRate.toFixed(1)}%</strong> of target.
                </p>
              </div>

              <div className="space-y-1">
                <div className="w-full h-2.5 bg-[var(--gruv-bg-soft)] rounded-lg overflow-hidden border border-[var(--gruv-border)] p-0.5">
                  <div 
                    className={`h-full rounded transition-all duration-500 ${
                      consistencyRate > 40 ? "bg-[var(--gruv-orange)]" : "bg-[var(--gruv-green)]"
                    }`}
                    style={{ width: `${Math.min(100, (consistencyRate / 40) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--gruv-muted)]">
                  <span>0%</span>
                  <span className="text-[var(--gruv-yellow)] font-bold">40% Limit ($1,000)</span>
                  <span>Headroom: +${headroomToday.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--gruv-surface)] border border-[var(--gruv-border)] text-[11px] text-[var(--gruv-muted)]">
                {highestDayProfit <= standardSingleDayCeiling ? (
                  <span className="text-[var(--gruv-green)] flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>You can make up to <strong>+${headroomToday.toFixed(2)}</strong> more today without expanding your $2,500 target.</span>
                  </span>
                ) : (
                  <span className="text-[var(--gruv-orange)] flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Day profit exceeded 40%! Your expanded target is <strong>${effectiveProfitTarget.toFixed(2)}</strong>.</span>
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[var(--gruv-bg)] p-4 rounded-xl border border-[var(--gruv-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--gruv-green)] uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Equity Drawdown Cushion</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--gruv-surface)] text-[var(--gruv-muted)] border border-[var(--gruv-border)]">
                  EOD Hard Floor
                </span>
              </div>

              <div>
                <div className="text-2xl font-extrabold text-[var(--gruv-green)] tracking-wide">
                  +${totalCushion.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-[var(--gruv-muted)] mt-1">
                  Hard floor level: <strong className="text-[var(--gruv-red)]">${hardEquityFloor.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                </p>
              </div>

              <div className="space-y-1">
                <div className="w-full h-2.5 bg-[var(--gruv-bg-soft)] rounded-lg overflow-hidden border border-[var(--gruv-border)] p-0.5">
                  <div 
                    className="h-full rounded bg-[var(--gruv-green)] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, (totalCushion / (maxDrawdownLimit + 500)) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--gruv-muted)]">
                  <span className="text-[var(--gruv-red)]">Breach ($48,500)</span>
                  <span className="text-[var(--gruv-green)] font-bold">Safe ({cushionPercent.toFixed(0)}% Buffer)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--gruv-surface)] border border-[var(--gruv-border)] text-[11px] text-[var(--gruv-fg)] flex items-center justify-between">
                <span className="text-[var(--gruv-muted)]">MNQ 15pt Stop Capacity:</span>
                <span className="font-bold text-[var(--gruv-yellow)] flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>~{safeTradesRemaining} Stop-Outs Buffer</span>
                </span>
              </div>
            </div>

            <div className="bg-[var(--gruv-bg)] p-4 rounded-xl border border-[var(--gruv-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--gruv-blue)] uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Session &amp; Expiration Guard</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--gruv-surface)] text-[var(--gruv-muted)] border border-[var(--gruv-border)]">
                  Rules
                </span>
              </div>

              <div className="space-y-2.5 text-xs pt-1">
                <div className="flex items-center justify-between p-2 rounded bg-[var(--gruv-bg-soft)] border border-[var(--gruv-border)]">
                  <span className="text-[var(--gruv-muted)]">EOD Session Reset:</span>
                  <span className="font-bold text-[var(--gruv-yellow)]">5:00 PM EST (21:00 UTC)</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[var(--gruv-bg-soft)] border border-[var(--gruv-border)]">
                  <span className="text-[var(--gruv-muted)]">Daily Max Loss Limit:</span>
                  <span className="font-bold text-[var(--gruv-red)]">-${dailyLossLimit.toLocaleString()} / Day</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[var(--gruv-bg-soft)] border border-[var(--gruv-border)]">
                  <span className="text-[var(--gruv-muted)]">Inactivity Rule:</span>
                  <span className="font-bold text-[var(--gruv-green)]">30-Day Window (Active)</span>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-[var(--gruv-bg)] p-4 md:p-5 rounded-xl border border-[var(--gruv-border)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--gruv-border)] pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[var(--gruv-yellow)]" />
                <span className="font-bold text-xs text-[var(--gruv-fg)] uppercase tracking-wider">
                  Interactive Consistency Simulator (What-If Calculator)
                </span>
              </div>
              <button 
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-xs text-[var(--gruv-muted)] hover:text-[var(--gruv-yellow)] flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How 40% rule works</span>
              </button>
            </div>

            {showTooltip && (
              <div className="p-3 rounded-lg bg-[var(--gruv-surface)] border border-[var(--gruv-yellow)]/40 text-xs text-[var(--gruv-muted)] space-y-1.5">
                <p><strong className="text-[var(--gruv-yellow)]">FundedNext 40% Consistency Rule:</strong> No single trading day may account for more than 40% of your total target.</p>
                <p>On a <strong>$50K Flex Account</strong> with a <strong>$2,500 target</strong>, your standard daily profit cap is <strong>$1,000.00 (40%)</strong>.</p>
                <p>If you make more than $1,000 in a single day (e.g. $1,400), you do NOT fail! Instead, your profit target automatically increases to <code>$1,400 / 0.40 = $3,500</code>.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-xs font-bold text-[var(--gruv-muted)] mb-2">
                  Simulate Single Day Profit: <strong className="text-[var(--gruv-yellow)]">${simulatedPnl.toFixed(2)}</strong>
                </label>
                <input
                  type="range"
                  min={50}
                  max={2500}
                  step={25}
                  value={simulatedPnl}
                  onChange={(e) => setSimulatedPnl(parseFloat(e.target.value))}
                  className="w-full accent-[var(--gruv-yellow)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--gruv-muted)] mt-1">
                  <span>$50</span>
                  <span className="text-[var(--gruv-yellow)] font-bold">$1,000 (40% Cap)</span>
                  <span>$2,500</span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                simExceedsCap
                  ? "bg-[var(--gruv-orange)]/10 border-[var(--gruv-orange)]/50 text-[var(--gruv-fg)]"
                  : "bg-[var(--gruv-green)]/10 border-[var(--gruv-green)]/50 text-[var(--gruv-fg)]"
              }`}>
                <div className="flex justify-between font-bold">
                  <span>Simulated Single Day Profit:</span>
                  <span className={simExceedsCap ? "text-[var(--gruv-orange)]" : "text-[var(--gruv-green)]"}>
                    ${simulatedPnl.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between font-bold">
                  <span>Required Profit Target:</span>
                  <span className="text-[var(--gruv-yellow)]">
                    ${simEffectiveTarget.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-[var(--gruv-muted)] pt-1 border-t border-[var(--gruv-border)]">
                  <span>Target Extension:</span>
                  <span>{simExceedsCap ? `+${simAddedRequirement.toFixed(2)} added target` : "None ($2,500 base)"}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
