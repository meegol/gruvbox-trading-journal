import React, { useState } from 'react';
import type { Trade } from '../types/journal';
import { groupPyramidTrades, type BundledTrade } from '../utils/pyramidUtils';
import { Search, Image as ImageIcon, Trash2, Layers, ChevronDown, ChevronRight } from 'lucide-react';

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
  const [bundlePyramids, setBundlePyramids] = useState(true);
  const [expandedBundleIds, setExpandedBundleIds] = useState<Set<string>>(new Set());

  const toggleExpandBundle = (bundleId: string) => {
    setExpandedBundleIds((prev) => {
      const next = new Set(prev);
      if (next.has(bundleId)) next.delete(bundleId);
      else next.add(bundleId);
      return next;
    });
  };

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trade.preTradeNotes && trade.preTradeNotes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (trade.postTradeNotes && trade.postTradeNotes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDirection = directionFilter === 'all' || trade.direction === directionFilter;
    const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;

    return matchesSearch && matchesDirection && matchesStatus;
  });

  const bundledTrades: BundledTrade[] = bundlePyramids 
    ? groupPyramidTrades(filteredTrades)
    : filteredTrades.map((t) => ({
        id: t.id,
        isPyramidBundle: false,
        legsCount: 1,
        accountId: t.accountId,
        symbol: t.symbol,
        direction: t.direction,
        session: t.session,
        totalQuantity: t.quantity || 1,
        totalPnl: t.pnl,
        totalFees: t.fees || 0,
        avgEntryPrice: t.entryPrice,
        avgExitPrice: t.exitPrice,
        entryDate: t.entryDate,
        exitDate: t.exitDate,
        status: t.status,
        emotion: t.emotion,
        rating: t.rating,
        preTradeNotes: t.preTradeNotes,
        postTradeNotes: t.postTradeNotes,
        screenshot: t.screenshot,
        legs: [t],
      }));

  return (
    <div className="glass-panel p-5 md:p-6 transition-all font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center space-x-3">
          <h2 className="font-bold text-base text-[var(--gruv-fg)] tracking-tight">
            TRADE LOG ({bundledTrades.length} {bundlePyramids ? 'Bundles' : 'Executions'})
          </h2>

          <button
            onClick={() => setBundlePyramids(!bundlePyramids)}
            className={`px-3 py-1 rounded-xl font-bold flex items-center space-x-1.5 border transition-all text-xs ${
              bundlePyramids
                ? 'bg-[var(--gruv-yellow)]/20 text-[var(--gruv-yellow)] border-[var(--gruv-yellow)]'
                : 'bg-[var(--gruv-bg)] text-[var(--gruv-muted)] border-[var(--gruv-border)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{bundlePyramids ? 'Pyramids Bundled' : 'Show All Legs'}</span>
          </button>
        </div>

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
              <th className="py-3 px-4">Date / Time</th>
              <th className="py-3 px-4">Contract</th>
              <th className="py-3 px-4">Dir</th>
              <th className="py-3 px-4">Execution / Qty</th>
              <th className="py-3 px-4">Net PnL</th>
              <th className="py-3 px-4">Mindset</th>
              <th className="py-3 px-4 text-center">Chart</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gruv-border)]/40 bg-[var(--gruv-surface)]">
            {bundledTrades.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[var(--gruv-muted)]">
                  No trade entries logged yet.
                </td>
              </tr>
            ) : (
              bundledTrades.map((bundle) => {
                const isWin = bundle.totalPnl > 0.01;
                const isLoss = bundle.totalPnl < -0.01;
                const d = new Date(bundle.entryDate);
                const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                const isExpanded = expandedBundleIds.has(bundle.id);

                return (
                  <React.Fragment key={bundle.id}>
                    {/* Primary Row / Pyramid Bundle Header */}
                    <tr
                      className={`hover:bg-[var(--gruv-bg)]/40 transition-colors group cursor-pointer ${
                        bundle.isPyramidBundle ? 'bg-[var(--gruv-bg)]/30 border-l-4 border-l-[var(--gruv-yellow)]' : ''
                      }`}
                      onClick={() => {
                        if (bundle.isPyramidBundle) toggleExpandBundle(bundle.id);
                        else onSelectTrade(bundle.legs[0]);
                      }}
                    >
                      <td className="py-3 px-4 font-bold text-[var(--gruv-fg)] whitespace-nowrap flex items-center space-x-2">
                        {bundle.isPyramidBundle && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandBundle(bundle.id);
                            }}
                            className="text-[var(--gruv-yellow)] p-0.5 hover:bg-[var(--gruv-yellow)]/20 rounded"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        )}
                        <span>{dateStr}</span>
                      </td>

                      <td className="py-3 px-4 font-bold text-[var(--gruv-yellow)] whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span>{bundle.symbol}</span>
                          {bundle.isPyramidBundle && (
                            <span className="px-1.5 py-0.5 rounded bg-[var(--gruv-yellow)] text-[var(--gruv-bg)] font-bold text-[9px] uppercase">
                              Pyramid ({bundle.legsCount})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 uppercase whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          bundle.direction === 'long'
                            ? 'bg-[var(--gruv-blue)]/20 text-[var(--gruv-blue)]'
                            : 'bg-[var(--gruv-purple)]/20 text-[var(--gruv-purple)]'
                        }`}>
                          {bundle.direction}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[var(--gruv-muted)] whitespace-nowrap font-bold">
                        {bundle.avgEntryPrice !== undefined && bundle.avgExitPrice !== undefined ? (
                          <span>Avg: {bundle.avgEntryPrice.toFixed(2)} → {bundle.avgExitPrice.toFixed(2)} ({bundle.totalQuantity} contracts)</span>
                        ) : (
                          <span>{bundle.legsCount} Leg(s) • Total {bundle.totalQuantity} contracts</span>
                        )}
                      </td>

                      <td className={`py-3 px-4 font-bold whitespace-nowrap ${
                        isWin ? 'text-[var(--gruv-green)]' : isLoss ? 'text-[var(--gruv-red)]' : 'text-[var(--gruv-fg)]'
                      }`}>
                        {bundle.totalPnl >= 0 ? '+' : ''}${bundle.totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--gruv-yellow)]/15 text-[var(--gruv-yellow)]">
                          {bundle.emotion || 'Disciplined'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {bundle.screenshot ? (
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
                            if (confirm(`Delete ${bundle.isPyramidBundle ? 'all pyramid entries in this group' : 'this trade entry'}?`)) {
                              bundle.legs.forEach((leg) => onDeleteTrade(leg.id));
                            }
                          }}
                          title="Delete trade entry/group"
                          className="p-1.5 rounded text-[var(--gruv-muted)] hover:text-[var(--gruv-red)] hover:bg-[var(--gruv-red)]/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>

                    {/* Sub-rows for Pyramid Legs */}
                    {bundle.isPyramidBundle && isExpanded && bundle.legs.map((leg, idx) => {
                      const legWin = leg.pnl > 0.01;
                      const legLoss = leg.pnl < -0.01;
                      const legD = new Date(leg.entryDate);
                      const legDateStr = `${legD.getMonth() + 1}/${legD.getDate()} ${String(legD.getHours()).padStart(2, '0')}:${String(legD.getMinutes()).padStart(2, '0')}`;

                      return (
                        <tr
                          key={leg.id}
                          className="bg-[var(--gruv-bg)]/70 hover:bg-[var(--gruv-bg)] transition-colors cursor-pointer border-l-2 border-l-[var(--gruv-yellow)]/40 text-[11px]"
                          onClick={() => onSelectTrade(leg)}
                        >
                          <td className="py-2 pl-8 pr-4 font-mono text-[var(--gruv-muted)]">
                            Leg #{idx + 1} ({legDateStr})
                          </td>
                          <td className="py-2 px-4 text-[var(--gruv-fg)] font-bold">
                            {leg.symbol}
                          </td>
                          <td className="py-2 px-4 uppercase text-[var(--gruv-muted)]">
                            {leg.direction}
                          </td>
                          <td className="py-2 px-4 text-[var(--gruv-muted)]">
                            {leg.balanceBefore !== undefined && leg.balanceAfter !== undefined ? (
                              <span>${leg.balanceBefore.toLocaleString()} → ${leg.balanceAfter.toLocaleString()}</span>
                            ) : (
                              <span>{leg.entryPrice} → {leg.exitPrice} ({leg.quantity || 1} qty)</span>
                            )}
                          </td>
                          <td className={`py-2 px-4 font-bold ${legWin ? 'text-[var(--gruv-green)]' : legLoss ? 'text-[var(--gruv-red)]' : 'text-[var(--gruv-fg)]'}`}>
                            {leg.pnl >= 0 ? '+' : ''}${leg.pnl.toFixed(2)}
                          </td>
                          <td className="py-2 px-4 text-[var(--gruv-muted)]">
                            {leg.emotion}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {leg.screenshot ? <ImageIcon className="w-3.5 h-3.5 text-[var(--gruv-yellow)] mx-auto" /> : '-'}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this pyramid leg?')) onDeleteTrade(leg.id);
                              }}
                              className="text-[var(--gruv-muted)] hover:text-[var(--gruv-red)]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
