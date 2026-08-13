import React, { useState } from 'react';
import type { Trade } from '../types/journal';
import { Search, ArrowUpDown, Image as ImageIcon, Trash2 } from 'lucide-react';


interface TradeTableProps {
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
}

export const TradeTable: React.FC<TradeTableProps> = ({
  trades,
  onSelectTrade,
  onDeleteTrade,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'long' | 'short'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'win' | 'loss' | 'breakeven'>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'rMultiple'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Apply Search & Filters
  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (trade.preTradeNotes && trade.preTradeNotes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (trade.postTradeNotes && trade.postTradeNotes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDirection = directionFilter === 'all' || trade.direction === directionFilter;
    const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;
    const matchesAsset = assetFilter === 'all' || trade.assetClass === assetFilter;

    return matchesSearch && matchesDirection && matchesStatus && matchesAsset;
  });

  // Apply Sorting
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
    } else if (sortBy === 'pnl') {
      comparison = b.pnl - a.pnl;
    } else if (sortBy === 'rMultiple') {
      comparison = (b.rMultiple || 0) - (a.rMultiple || 0);
    }
    return sortAsc ? -comparison : comparison;
  });

  const toggleSort = (field: 'date' | 'pnl' | 'rMultiple') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="glass-panel p-5 md:p-6 transition-all">
      {/* Table Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center space-x-3">
          <h2 className="font-bold text-lg text-[var(--gruv-fg)] font-mono tracking-tight">
            TRADE LOG ({sortedTrades.length})
          </h2>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--gruv-muted)]" />
            <input
              type="text"
              placeholder="Search symbol, tag, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[var(--gruv-bg)] text-[var(--gruv-fg)] font-mono text-xs pl-9 pr-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:outline-none focus:border-[var(--gruv-yellow)] w-48 md:w-64"
            />
          </div>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={(e: any) => setDirectionFilter(e.target.value)}
            className="bg-[var(--gruv-bg)] text-[var(--gruv-fg)] font-mono text-xs px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:outline-none focus:border-[var(--gruv-yellow)] cursor-pointer"
          >
            <option value="all">All Directions</option>
            <option value="long">Longs Only</option>
            <option value="short">Shorts Only</option>
          </select>

          {/* Result Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-[var(--gruv-bg)] text-[var(--gruv-fg)] font-mono text-xs px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:outline-none focus:border-[var(--gruv-yellow)] cursor-pointer"
          >
            <option value="all">All Outcomes</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="breakeven">Breakevens</option>
          </select>

          {/* Asset Class Filter */}
          <select
            value={assetFilter}
            onChange={(e: any) => setAssetFilter(e.target.value)}
            className="bg-[var(--gruv-bg)] text-[var(--gruv-fg)] font-mono text-xs px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:outline-none focus:border-[var(--gruv-yellow)] cursor-pointer"
          >
            <option value="all">All Assets</option>
            <option value="futures">Futures</option>
            <option value="crypto">Crypto</option>
            <option value="forex">Forex</option>
            <option value="stocks">Stocks</option>
            <option value="options">Options</option>
          </select>
        </div>
      </div>

      {/* Trade Log Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--gruv-border)]">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[var(--gruv-bg)]/80 text-[var(--gruv-muted)] uppercase tracking-wider text-[10px] border-b border-[var(--gruv-border)]">
            <tr>
              <th className="py-3 px-4 cursor-pointer" onClick={() => toggleSort('date')}>
                <div className="flex items-center space-x-1">
                  <span>Date &amp; Time</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-4">Symbol</th>
              <th className="py-3 px-4">Dir</th>
              <th className="py-3 px-4">Entry / Exit</th>
              <th className="py-3 px-4">Size</th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => toggleSort('pnl')}>
                <div className="flex items-center space-x-1">
                  <span>Net PnL</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => toggleSort('rMultiple')}>
                <div className="flex items-center space-x-1">
                  <span>R-Mult</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-4">Emotion</th>
              <th className="py-3 px-4">Tags</th>
              <th className="py-3 px-4 text-center">Chart</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gruv-border)]/40 bg-[var(--gruv-surface)]">
            {sortedTrades.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-[var(--gruv-muted)]">
                  No trades found matching selected criteria.
                </td>
              </tr>
            ) : (
              sortedTrades.map((trade) => {
                const isWin = trade.pnl > 0.01;
                const isLoss = trade.pnl < -0.01;
                const d = new Date(trade.entryDate);
                const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

                return (
                  <tr
                    key={trade.id}
                    className="hover:bg-[var(--gruv-bg)]/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectTrade(trade)}
                  >
                    {/* Date */}
                    <td className="py-3 px-4 font-bold text-[var(--gruv-fg)] whitespace-nowrap">
                      {dateStr}
                    </td>

                    {/* Symbol */}
                    <td className="py-3 px-4 font-bold text-[var(--gruv-yellow)] whitespace-nowrap">
                      {trade.symbol}
                    </td>

                    {/* Direction */}
                    <td className="py-3 px-4 uppercase whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        trade.direction === 'long'
                          ? 'bg-[var(--gruv-blue)]/20 text-[var(--gruv-blue)] border border-[var(--gruv-blue)]/40'
                          : 'bg-[var(--gruv-purple)]/20 text-[var(--gruv-purple)] border border-[var(--gruv-purple)]/40'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>

                    {/* Entry / Exit */}
                    <td className="py-3 px-4 text-[var(--gruv-muted)] whitespace-nowrap">
                      {trade.entryPrice} → {trade.exitPrice}
                    </td>

                    {/* Qty */}
                    <td className="py-3 px-4 text-[var(--gruv-fg)] whitespace-nowrap">
                      {trade.quantity}
                    </td>

                    {/* Net PnL */}
                    <td className={`py-3 px-4 font-bold whitespace-nowrap ${
                      isWin ? 'text-[var(--gruv-green)]' : isLoss ? 'text-[var(--gruv-red)]' : 'text-[var(--gruv-fg)]'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* R-Multiple */}
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-[var(--gruv-fg)]">
                      {trade.rMultiple !== undefined && trade.rMultiple !== null ? (
                        <span className={trade.rMultiple > 0 ? 'text-[var(--gruv-green)]' : trade.rMultiple < 0 ? 'text-[var(--gruv-red)]' : ''}>
                          {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                        </span>
                      ) : (
                        <span className="text-[var(--gruv-muted)]">-</span>
                      )}
                    </td>

                    {/* Emotion */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        trade.emotion === 'Disciplined' || trade.emotion === 'Calm'
                          ? 'bg-[var(--gruv-green)]/15 text-[var(--gruv-green)]'
                          : trade.emotion === 'FOMO' || trade.emotion === 'Revenge'
                          ? 'bg-[var(--gruv-red)]/15 text-[var(--gruv-red)] font-bold'
                          : 'bg-[var(--gruv-yellow)]/15 text-[var(--gruv-yellow)]'
                      }`}>
                        {trade.emotion}
                      </span>
                    </td>

                    {/* Tags */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 max-w-[160px] overflow-hidden">
                        {trade.tags && trade.tags.length > 0 ? (
                          trade.tags.slice(0, 2).map((t, idx) => (
                            <span key={idx} className="bg-[var(--gruv-bg)] text-[var(--gruv-muted)] px-1.5 py-0.5 rounded text-[10px] border border-[var(--gruv-border)]">
                              #{t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[var(--gruv-muted)]/40 text-[10px]">-</span>
                        )}
                        {trade.tags && trade.tags.length > 2 && (
                          <span className="text-[10px] text-[var(--gruv-muted)]">+{trade.tags.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* Chart Screenshot Indicator */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {trade.screenshot ? (
                        <span className="text-[var(--gruv-yellow)] inline-flex items-center justify-center p-1 rounded hover:bg-[var(--gruv-yellow)]/20">
                          <ImageIcon className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="text-[var(--gruv-muted)]/30">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this trade entry?')) {
                            onDeleteTrade(trade.id);
                          }
                        }}
                        title="Delete trade"
                        className="p-1.5 rounded text-[var(--gruv-muted)] hover:text-[var(--gruv-red)] hover:bg-[var(--gruv-red)]/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
