import React, { useState } from 'react';
import type { Trade, Account } from '../types/journal';
import { X, Star, Maximize2, Trash2 } from 'lucide-react';


interface TradeDetailModalProps {
  trade: Trade | null;
  accounts: Account[];
  onClose: () => void;
  onDeleteTrade: (tradeId: string) => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  trade,
  accounts,
  onClose,
  onDeleteTrade,
}) => {
  if (!trade) return null;

  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false);

  const account = accounts.find((a) => a.id === trade.accountId);
  const isWin = trade.pnl > 0.01;
  const isLoss = trade.pnl < -0.01;
  const entryD = new Date(trade.entryDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative font-mono text-xs my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--gruv-border)] pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-xl font-bold uppercase text-xs border ${
              trade.direction === 'long'
                ? 'bg-[var(--gruv-blue)]/20 text-[var(--gruv-blue)] border-[var(--gruv-blue)]'
                : 'bg-[var(--gruv-purple)]/20 text-[var(--gruv-purple)] border-[var(--gruv-purple)]'
            }`}>
              {trade.direction}
            </span>
            <div>
              <h2 className="font-bold text-xl text-[var(--gruv-fg)]">
                {trade.symbol} <span className="text-[var(--gruv-muted)] font-normal">({trade.assetClass})</span>
              </h2>
              <p className="text-[11px] text-[var(--gruv-muted)]">
                {entryD.toLocaleDateString()} {entryD.toLocaleTimeString()} • {account?.name || 'Account'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PnL & Key Stats Banner */}
        <div className={`p-4 rounded-xl mb-6 border flex flex-wrap items-center justify-between gap-4 ${
          isWin
            ? 'bg-[var(--gruv-green)]/10 border-[var(--gruv-green)]/40 text-[var(--gruv-green)]'
            : isLoss
            ? 'bg-[var(--gruv-red)]/10 border-[var(--gruv-red)]/40 text-[var(--gruv-red)]'
            : 'bg-[var(--gruv-surface)] border-[var(--gruv-border)] text-[var(--gruv-fg)]'
        }`}>
          <div>
            <span className="text-[var(--gruv-muted)] block text-[10px] uppercase">Net Profit / Loss</span>
            <span className="font-bold text-2xl font-mono">
              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {trade.rMultiple !== undefined && trade.rMultiple !== null && (
            <div>
              <span className="text-[var(--gruv-muted)] block text-[10px] uppercase">Achieved R-Multiple</span>
              <span className="font-bold text-xl font-mono">
                {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
              </span>
            </div>
          )}

          <div>
            <span className="text-[var(--gruv-muted)] block text-[10px] uppercase">Mindset &amp; Rating</span>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className="font-bold text-xs px-2 py-0.5 rounded bg-[var(--gruv-bg)] text-[var(--gruv-yellow)] border border-[var(--gruv-border)]">
                {trade.emotion}
              </span>
              <div className="flex items-center text-[var(--gruv-yellow)]">
                {[...Array(trade.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[var(--gruv-yellow)]" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Execution Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[var(--gruv-bg)]/60 border border-[var(--gruv-border)] mb-6">
          <div>
            <span className="text-[var(--gruv-muted)] block text-[10px]">ENTRY PRICE</span>
            <span className="font-bold text-sm text-[var(--gruv-fg)]">{trade.entryPrice}</span>
          </div>

          <div>
            <span className="text-[var(--gruv-muted)] block text-[10px]">EXIT PRICE</span>
            <span className="font-bold text-sm text-[var(--gruv-fg)]">{trade.exitPrice}</span>
          </div>

          <div>
            <span className="text-[var(--gruv-muted)] block text-[10px]">POSITION SIZE</span>
            <span className="font-bold text-sm text-[var(--gruv-fg)]">{trade.quantity}</span>
          </div>

          <div>
            <span className="text-[var(--gruv-muted)] block text-[10px]">FEES / COMMISSIONS</span>
            <span className="font-bold text-sm text-[var(--gruv-fg)]">${trade.fees.toFixed(2)}</span>
          </div>

          {trade.stopLoss && (
            <div>
              <span className="text-[var(--gruv-muted)] block text-[10px]">STOP LOSS</span>
              <span className="font-bold text-sm text-[var(--gruv-red)]">{trade.stopLoss}</span>
            </div>
          )}

          {trade.takeProfit && (
            <div>
              <span className="text-[var(--gruv-muted)] block text-[10px]">TAKE PROFIT</span>
              <span className="font-bold text-sm text-[var(--gruv-green)]">{trade.takeProfit}</span>
            </div>
          )}
        </div>

        {/* Setup Tags */}
        {trade.tags && trade.tags.length > 0 && (
          <div className="mb-6">
            <span className="text-[var(--gruv-muted)] block mb-1 text-[10px] uppercase">Strategy Setup Tags</span>
            <div className="flex flex-wrap gap-2">
              {trade.tags.map((tag, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-[var(--gruv-bg)] text-[var(--gruv-yellow)] border border-[var(--gruv-border)]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pre & Post Notes */}
        <div className="space-y-4 mb-6">
          {trade.preTradeNotes && (
            <div className="p-3.5 rounded-xl bg-[var(--gruv-bg)]/40 border border-[var(--gruv-border)]">
              <span className="text-[var(--gruv-yellow)] font-bold block mb-1">Pre-Trade Execution Plan:</span>
              <p className="text-[var(--gruv-fg)] whitespace-pre-wrap">{trade.preTradeNotes}</p>
            </div>
          )}

          {trade.postTradeNotes && (
            <div className="p-3.5 rounded-xl bg-[var(--gruv-bg)]/40 border border-[var(--gruv-border)]">
              <span className="text-[var(--gruv-green)] font-bold block mb-1">Post-Trade Review &amp; Lessons:</span>
              <p className="text-[var(--gruv-fg)] whitespace-pre-wrap">{trade.postTradeNotes}</p>
            </div>
          )}
        </div>

        {/* Screenshot Image Attachment */}
        {trade.screenshot && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--gruv-muted)] text-[10px] uppercase font-bold">Chart Screenshot</span>
              <button
                onClick={() => setIsImageLightboxOpen(true)}
                className="text-[var(--gruv-yellow)] hover:underline flex items-center space-x-1 text-xs"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Enlarge Chart</span>
              </button>
            </div>
            <div 
              onClick={() => setIsImageLightboxOpen(true)}
              className="rounded-xl overflow-hidden border border-[var(--gruv-border)] cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img src={trade.screenshot} alt="Chart execution" className="w-full max-h-64 object-cover" />
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--gruv-border)]">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this trade entry?')) {
                onDeleteTrade(trade.id);
                onClose();
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[var(--gruv-red)] hover:bg-[var(--gruv-red)]/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Trade</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--gruv-surface)] text-[var(--gruv-fg)] border border-[var(--gruv-border)] hover:bg-[var(--gruv-bg)] transition-colors"
          >
            Close
          </button>
        </div>

      </div>

      {/* Lightbox Full-screen Zoom Modal */}
      {isImageLightboxOpen && trade.screenshot && (
        <div 
          onClick={() => setIsImageLightboxOpen(false)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={trade.screenshot} alt="Full resolution chart" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};
