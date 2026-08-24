import React, { useState, useRef } from 'react';
import type { Trade } from '../types/journal';
import { toPng } from 'html-to-image';
import { X, Check, Copy, Download } from 'lucide-react';

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

  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const totalDayPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winCount = trades.filter((t) => t.pnl > 0.01 || t.status === 'win').length;
  const lossCount = trades.filter((t) => t.pnl < -0.01 || t.status === 'loss').length;
  const beCount = trades.filter(
    (t) => t.status === 'breakeven' || (!((t.pnl > 0.01 || t.status === 'win') || (t.pnl < -0.01 || t.status === 'loss')))
  ).length;

  const isDayWin = totalDayPnl > 0.01;
  const isDayLoss = totalDayPnl < -0.01;
  
  const totalR = trades.reduce((acc, t) => acc + (t.rMultiple || 0), 0);
  const symbolsUsed = Array.from(new Set(trades.map((t) => t.symbol))).join(' / ');
  const winRate = trades.length > 0 ? ((winCount / trades.length) * 100).toFixed(0) : '0';

  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleCopySummary = () => {
    const textToCopy = `● migo.nq | DAILY SUMMARY\nDATE: ${dateStr}\nNET PNL: ${totalDayPnl >= 0 ? '+' : ''}$${totalDayPnl.toFixed(2)}\nRECORD: ${winCount}W - ${lossCount}L - ${beCount}BE (${winRate}% win)\nNET R: ${totalR >= 0 ? '+' : ''}${totalR.toFixed(2)}R\nCONTRACTS: ${symbolsUsed || 'NQ/MNQ'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setExporting(true);
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `migo-nq-card-${dateStr}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating PNG card:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-mono text-xs">
      <div className="glass-panel w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 relative my-8 border-2 border-[var(--gruv-border)]">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-[var(--gruv-border)] pb-4 mb-5 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--gruv-yellow)] text-[#1d2021] flex items-center justify-center font-bold">
              ●
            </div>
            <div>
              <h2 className="font-bold text-base text-[var(--gruv-fg)] tracking-wider">{formattedDate}</h2>
              <p className="text-[11px] text-[var(--gruv-muted)]">
                {trades.length} Trades &bull; <span className="text-[var(--gruv-green)] font-bold">{winCount}W</span> - <span className="text-[var(--gruv-red)] font-bold">{lossCount}L</span> - <span className="text-[var(--gruv-yellow)] font-bold">{beCount}BE</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopySummary}
              title="Copy formatted text"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[var(--gruv-bg)] text-[var(--gruv-yellow)] border border-[var(--gruv-border)] hover:border-[var(--gruv-yellow)] transition-all font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--gruv-green)]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Text'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={exporting}
              title="Download High-Res PNG Card Image"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[var(--gruv-yellow)] text-[#1d2021] font-bold hover:brightness-110 transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Saving...' : 'PNG Card'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-bg)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Shareable PnL Card Component (Export Target) */}
        <div 
          ref={cardRef}
          className="bg-[#1d2021] text-[#ebdbb2] border-2 border-[#504945] rounded-2xl p-6 mb-6 relative overflow-hidden shadow-2xl font-mono"
        >
          {/* Top Indicator Line */}
          <div className={`h-2 w-full absolute top-0 left-0 ${isDayWin ? 'bg-[var(--gruv-green)]' : isDayLoss ? 'bg-[var(--gruv-red)]' : 'bg-[var(--gruv-yellow)]'}`} />

          {/* Card Header Branding */}
          <div className="flex items-center justify-between border-b border-[#3c3836] pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base text-[var(--gruv-yellow)] tracking-wider">migo.<span className="text-[#fbf1c7]">nq</span></span>
              <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-[#282828] text-[#a89984] font-bold border border-[#3c3836]">
                ● DAILY CARD
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-[#a89984]">{dateStr}</span>
          </div>

          {/* Big PnL Display */}
          <div className="my-2">
            <span className="text-[10px] text-[#a89984] uppercase tracking-wider block font-bold">NET DAY PnL</span>
            <div className={`text-4xl sm:text-5xl font-black tracking-wider my-1 ${
              isDayWin ? 'text-[var(--gruv-green)]' : isDayLoss ? 'text-[var(--gruv-red)]' : 'text-[#fbf1c7]'
            }`}>
              {totalDayPnl >= 0 ? '+' : ''}${totalDayPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Dotted Divider */}
          <div className="text-[#3c3836] text-[10px] my-3 overflow-hidden whitespace-nowrap tracking-widest select-none">
            ---------------------------------------------------------------------------------
          </div>

          {/* Metrics Grid with BE count */}
          <div className="grid grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-[#282828] p-2.5 rounded-xl border border-[#3c3836]">
              <span className="text-[10px] text-[#a89984] uppercase block font-bold mb-0.5">RECORD</span>
              <div className="font-bold text-sm text-[#fbf1c7] flex items-center space-x-1">
                <span className="text-[var(--gruv-green)]">{winCount}W</span>
                <span className="text-[#665c54]">-</span>
                <span className="text-[var(--gruv-red)]">{lossCount}L</span>
                <span className="text-[#665c54]">-</span>
                <span className="text-[var(--gruv-yellow)]">{beCount}BE</span>
              </div>
            </div>

            <div className="bg-[#282828] p-2.5 rounded-xl border border-[#3c3836]">
              <span className="text-[10px] text-[#a89984] uppercase block font-bold mb-0.5">WIN RATE</span>
              <span className="font-extrabold text-sm text-[var(--gruv-yellow)]">
                {winRate}%
              </span>
            </div>

            <div className="bg-[#282828] p-2.5 rounded-xl border border-[#3c3836]">
              <span className="text-[10px] text-[#a89984] uppercase block font-bold mb-0.5">NET R</span>
              <span className={`font-extrabold text-sm ${totalR >= 0 ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                {totalR >= 0 ? '+' : ''}{totalR.toFixed(2)}R
              </span>
            </div>
          </div>

          {symbolsUsed && (
            <div className="mt-4 pt-3 border-t border-[#3c3836] flex items-center justify-between text-[11px]">
              <span className="text-[#a89984] font-bold">INSTRUMENT:</span>
              <span className="font-bold text-[var(--gruv-yellow)] bg-[#282828] px-2 py-0.5 rounded border border-[#3c3836]">{symbolsUsed}</span>
            </div>
          )}
        </div>

        {/* List of Trades with Win / Loss / BE Badges */}
        <div className="space-y-2.5 mb-5">
          <span className="text-[10px] font-bold text-[var(--gruv-muted)] uppercase tracking-wider block">EXECUTION LOG</span>
          {trades.map((trade) => {
            const isTradeWin = trade.pnl > 0.01 || trade.status === 'win';
            const isTradeLoss = trade.pnl < -0.01 || trade.status === 'loss';
            const isTradeBE = !isTradeWin && !isTradeLoss;

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
                    
                    {/* Status Badge */}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      isTradeWin 
                        ? 'text-[var(--gruv-green)] bg-[var(--gruv-green)]/15 border border-[var(--gruv-green)]/30'
                        : isTradeLoss
                        ? 'text-[var(--gruv-red)] bg-[var(--gruv-red)]/15 border border-[var(--gruv-red)]/30'
                        : 'text-[var(--gruv-yellow)] bg-[var(--gruv-yellow)]/15 border border-[var(--gruv-yellow)]/30'
                    }`}>
                      {isTradeWin ? 'WIN' : isTradeLoss ? 'LOSS' : isTradeBE ? 'BE' : 'BE'}
                    </span>

                    {trade.session && (
                      <span className="text-[10px] text-[var(--gruv-muted)] px-1.5 py-0.5 rounded bg-[var(--gruv-bg)] font-mono">
                        {trade.session}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--gruv-muted)] mt-1 font-mono">
                    {trade.balanceBefore !== undefined && trade.balanceAfter !== undefined
                      ? `$${trade.balanceBefore.toLocaleString()} → $${trade.balanceAfter.toLocaleString()}`
                      : `Entry: ${trade.entryPrice} → Exit: ${trade.exitPrice}`}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold text-sm ${
                    isTradeWin ? 'text-[var(--gruv-green)]' : isTradeLoss ? 'text-[var(--gruv-red)]' : 'text-[var(--gruv-fg)]'
                  }`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {trade.rMultiple !== undefined && (
                    <div className="text-[10px] text-[var(--gruv-muted)] font-mono">
                      {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-right">
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
