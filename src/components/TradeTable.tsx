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
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'rMultiple'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trade.preTradeNotes && trade.preTradeNotes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (trade.postTradeNotes && trade.postTradeNotes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDirection = directionFilter === 'all' || trade.direction === directionFilter;
    const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;

    return matchesSearch && matchesDirection && matchesStatus;
  });

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
    <div className="glass-panel p-5 md:p-6 transition-all font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h2 className="font-bold text-base text-[var(--gruv-fg)] tracking-tight">
          TRADE LOG ({sortedTrades.length})
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--gruv-muted)]" />
            <input
              type="text"
              placeholder="Search symbol, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[var(--gruv-bg)] text-[var(--gruv-fg)] text-xs pl-9 pr-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:outline-none focus:border-[var(--gruv-yellow)] w-48 md:w-64"
            />
          </div>

          <select
            value={directionFilter}
            onChange={(e: any) => setDirectionFilter(e.target.value)}
            className="bg-[var(--gruv-bg)] text-[var(--gruv-fg)] text-xs px-3 py-2 rounded-xl border border-[var(--gruv-border)] cursor-pointer"
          >
            <option value="all">All Directions</option>
            <option value="long">Longs Only</option>
            <option value="short">Shorts Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-[var(--gruv-bg)] text-[var(--gruv-fg)] text-xs px-3 py-2 rounded-xl border border-[var(--gruv-border)] cursor-pointer"
          >
            <option value="all">All Outcomes</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="breakeven">Breakevens</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--gruv-border)]">
        <table className="w-full text-left">
          <thead className="bg-[var(--gruv-bg)]/80 text-[var(--gruv-muted)] uppercase tracking-wider text-[10px] border-b border-[var(--gruv-border)]">
            <tr>
              <th className="py-3 px-4 cursor-pointer" onClick={() => toggleSort('date')}>
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-4">Contract</th>
              <th className="py-3 px-4">Dir</th>
              <th className="py-3 px-4">Execution / Balance</th>
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
              <th className="py-3 px-4">Mindset</th>
              <th className="py-3 px-4 text-center">Chart</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gruv-border)]/40 bg-[var(--gruv-surface)]">
            {sortedTrades.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[var(--gruv-muted)]">
                  No trade entries logged yet.
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
                    <td className="py-3 px-4 font-bold text-[var(--gruv-fg)] whitespace-nowrap">
                      {dateStr}
                    </td>

                    <td className="py-3 px-4 font-bold text-[var(--gruv-yellow)] whitespace-nowrap">
                      {trade.symbol}
                    </td>

                    <td className="py-3 px-4 uppercase whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        trade.direction === 'long'
                          ? 'bg-[var(--gruv-blue)]/20 text-[var(--gruv-blue)]'
                          : 'bg-[var(--gruv-purple)]/20 text-[var(--gruv-purple)]'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[var(--gruv-muted)] whitespace-nowrap">
                      {trade.balanceBefore !== undefined && trade.balanceAfter !== undefined ? (
                        <span>${trade.balanceBefore.toLocaleString()} → ${trade.balanceAfter.toLocaleString()}</span>
                      ) : (
                        <span>{trade.entryPrice} → {trade.exitPrice} ({trade.quantity} qty)</span>
                      )}
                    </td>

                    <td className={`py-3 px-4 font-bold whitespace-nowrap ${
                      isWin ? 'text-[var(--gruv-green)]' : isLoss ? 'text-[var(--gruv-red)]' : 'text-[var(--gruv-fg)]'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-[var(--gruv-fg)]">
                      {trade.rMultiple !== undefined && trade.rMultiple !== null ? (
                        <span className={trade.rMultiple > 0 ? 'text-[var(--gruv-green)]' : trade.rMultiple < 0 ? 'text-[var(--gruv-red)]' : ''}>
                          {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                        </span>
                      ) : (
                        <span className="text-[var(--gruv-muted)]">-</span>
                      )}
                    </td>

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

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {trade.screenshot ? (
                        <span className="text-[var(--gruv-yellow)] inline-flex items-center justify-center p-1 rounded hover:bg-[var(--gruv-yellow)]/20">
                          <ImageIcon className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="text-[var(--gruv-muted)]/30">-</span>
                      )}
                    </td>

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
