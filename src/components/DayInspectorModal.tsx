import React from 'react';
import type { Trade } from '../types/journal';
import { X, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';


interface DayInspectorModalProps {
  isOpen: boolean;
  dateStr: string;
  trades: Trade[];
  onClose: () => void;
  onSelectTrade: (trade: Trade) => void;
}

export const DayInspectorModal: React.FC<DayInspectorModalProps> = ({
  isOpen,
  dateStr,
  trades,
  onClose,
  onSelectTrade,
}) => {
  if (!isOpen) return null;

  const totalDayPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winCount = trades.filter((t) => t.pnl > 0.01).length;
  const isDayWin = totalDayPnl > 0.01;
  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 relative font-mono text-xs my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--gruv-border)] pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[var(--gruv-bg)] text-[var(--gruv-yellow)] border border-[var(--gruv-border)]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[var(--gruv-fg)]">{formattedDate}</h2>
              <p className="text-[11px] text-[var(--gruv-muted)]">{trades.length} Executed Trades</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Day PnL Summary Box */}
        <div className={`p-4 rounded-xl mb-4 border flex items-center justify-between ${
          isDayWin
            ? 'bg-[var(--gruv-green)]/10 border-[var(--gruv-green)]/40 text-[var(--gruv-green)]'
            : totalDayPnl < -0.01
            ? 'bg-[var(--gruv-red)]/10 border-[var(--gruv-red)]/40 text-[var(--gruv-red)]'
            : 'bg-[var(--gruv-surface)] border-[var(--gruv-border)] text-[var(--gruv-fg)]'
        }`}>
          <div>
            <span className="text-[var(--gruv-muted)] text-[10px] block uppercase">Day Net PnL</span>
            <span className="font-bold text-xl font-mono">
              {totalDayPnl >= 0 ? '+' : ''}${totalDayPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[var(--gruv-muted)] text-[10px] block uppercase">Win Rate</span>
            <span className="font-bold text-sm font-mono text-[var(--gruv-fg)]">
              {((winCount / trades.length) * 100).toFixed(0)}% ({winCount}W / {trades.length - winCount}L)
            </span>
          </div>
        </div>

        {/* List of Trades for this date */}
        <div className="space-y-3 mb-4">
          {trades.map((trade) => {
            const isTradeWin = trade.pnl > 0.01;
            return (
              <div
                key={trade.id}
                onClick={() => {
                  onClose();
                  onSelectTrade(trade);
                }}
                className="p-3.5 rounded-xl bg-[var(--gruv-surface)] border border-[var(--gruv-border)] hover:border-[var(--gruv-yellow)] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-[var(--gruv-yellow)]">{trade.symbol}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      trade.direction === 'long' ? 'text-[var(--gruv-blue)] bg-[var(--gruv-blue)]/15' : 'text-[var(--gruv-purple)] bg-[var(--gruv-purple)]/15'
                    }`}>
                      {trade.direction}
                    </span>
                    <span className="text-[var(--gruv-muted)] text-[11px]">{trade.assetClass}</span>
                  </div>
                  <div className="text-[11px] text-[var(--gruv-muted)] mt-1">
                    Entry: {trade.entryPrice} → Exit: {trade.exitPrice} ({trade.quantity} qty)
                  </div>
                </div>

                <div className="text-right flex items-center space-x-3">
                  <div>
                    <div className={`font-bold text-sm ${isTradeWin ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {trade.rMultiple !== undefined && (
                      <div className="text-[10px] text-[var(--gruv-muted)]">
                        {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-[var(--gruv-muted)] group-hover:text-[var(--gruv-yellow)] transition-colors" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--gruv-surface)] text-[var(--gruv-fg)] border border-[var(--gruv-border)] hover:bg-[var(--gruv-bg)] transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
