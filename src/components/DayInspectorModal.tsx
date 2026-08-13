import React, { useState, useRef } from 'react';
import type { Trade } from '../types/journal';
import { toPng } from 'html-to-image';
import { X, Check, Copy, Download, Printer } from 'lucide-react';

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
  const winCount = trades.filter((t) => t.pnl > 0.01).length;
  const lossCount = trades.filter((t) => t.pnl < -0.01).length;
  const isDayWin = totalDayPnl > 0.01;
  const isDayLoss = totalDayPnl < -0.01;
  
  const totalR = trades.reduce((acc, t) => acc + (t.rMultiple || 0), 0);
  const symbolsUsed = Array.from(new Set(trades.map((t) => t.symbol))).join(' / ');

  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleCopySummary = () => {
    const textToCopy = `● migo.nq | DAILY SUMMARY\nDATE: ${dateStr}\nNET PNL: ${totalDayPnl >= 0 ? '+' : ''}$${totalDayPnl.toFixed(2)}\nWIN RATE: ${((winCount / trades.length) * 100).toFixed(0)}% (${winCount}W / ${lossCount}L)\nNET R: ${totalR >= 0 ? '+' : ''}${totalR.toFixed(2)}R\nCONTRACTS: ${symbolsUsed}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setExporting(true);
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
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

  // Clean PDF Print - Only prints the PnL Card element
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-mono text-xs no-print-backdrop">
      <div className="glass-panel w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 relative my-8 border-2 border-[var(--gruv-border)]">
        
        {/* Header (Hidden in PDF print) */}
        <div className="flex flex-wrap items-center justify-between border-b border-[var(--gruv-border)] pb-4 mb-5 gap-3 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--gruv-yellow)] text-[#1d2021] flex items-center justify-center font-bold">
              ●
            </div>
            <div>
              <h2 className="font-bold text-base text-[var(--gruv-fg)] tracking-wider">{formattedDate}</h2>
              <p className="text-[11px] text-[var(--gruv-muted)]">{trades.length} Executed Trades</p>
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
              title="Download PNG Card Image"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[var(--gruv-yellow)] text-[#1d2021] font-bold hover:brightness-110 transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Saving...' : 'PNG Card'}</span>
            </button>

            <button
              onClick={handlePrintPDF}
              title="Print or Save PDF Card"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[var(--gruv-bg)] text-[var(--gruv-fg)] border border-[var(--gruv-border)] hover:border-[var(--gruv-yellow)] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF Card</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-bg)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Shareable PnL Card Component */}
        <div 
          ref={cardRef}
          className="printable-card bg-[#1d2021] border-2 border-[var(--gruv-border-solid)] rounded-xl p-5 mb-6 relative overflow-hidden shadow-2xl"
        >
          {/* Top Indicator Line */}
          <div className={`h-1.5 w-full absolute top-0 left-0 ${isDayWin ? 'bg-[var(--gruv-green)]' : isDayLoss ? 'bg-[var(--gruv-red)]' : 'bg-[var(--gruv-yellow)]'}`} />

          {/* Card Header Branding */}
          <div className="flex items-center justify-between border-b border-[var(--gruv-border)]/60 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-[var(--gruv-yellow)] tracking-wider">migo.<span className="text-[var(--gruv-fg)]">nq</span></span>
              <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-[var(--gruv-bg-soft)] text-[var(--gruv-muted)] font-mono border border-[var(--gruv-border)]">
                ● DAILY CARD
              </span>
            </div>
            <span className="font-mono text-xs text-[var(--gruv-muted)]">{dateStr}</span>
          </div>

          {/* Big PnL Display */}
          <div className="my-2">
            <span className="text-[10px] text-[var(--gruv-muted)] uppercase tracking-wider block font-mono">NET DAY PnL</span>
            <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-wider ${
              isDayWin ? 'text-[var(--gruv-green)]' : isDayLoss ? 'text-[var(--gruv-red)]' : 'text-[var(--gruv-fg)]'
            }`}>
              {totalDayPnl >= 0 ? '+' : ''}${totalDayPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Dotted Divider */}
          <div className="text-[var(--gruv-border)] text-[10px] my-3 overflow-hidden whitespace-nowrap tracking-widest select-none font-mono">
            -----------------------------------------------------------------------
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 font-mono text-xs pt-1">
            <div>
              <span className="text-[10px] text-[var(--gruv-muted)] uppercase block">OUTCOME</span>
              <span className="font-bold text-sm text-[var(--gruv-fg)]">
                {winCount}W <span className="text-[var(--gruv-muted)] font-normal">/</span> {lossCount}L
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[var(--gruv-muted)] uppercase block">WIN RATE</span>
              <span className="font-bold text-sm text-[var(--gruv-yellow)]">
                {((winCount / trades.length) * 100).toFixed(0)}%
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[var(--gruv-muted)] uppercase block">NET R-MULT</span>
              <span className={`font-bold text-sm ${totalR >= 0 ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                {totalR >= 0 ? '+' : ''}{totalR.toFixed(2)}R
              </span>
            </div>
          </div>

          {symbolsUsed && (
            <div className="mt-3 pt-3 border-t border-[var(--gruv-border)]/40 flex items-center justify-between text-[11px] font-mono">
              <span className="text-[var(--gruv-muted)]">CONTRACTS:</span>
              <span className="font-bold text-[var(--gruv-fg)]">{symbolsUsed}</span>
            </div>
          )}
        </div>

        {/* List of Trades (Hidden in PDF print) */}
        <div className="space-y-2.5 mb-5 no-print">
          <span className="text-[10px] font-bold text-[var(--gruv-muted)] uppercase tracking-wider block">EXECUTION LOG</span>
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
                  <div className={`font-bold text-sm ${isTradeWin ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
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

        <div className="text-right no-print">
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
