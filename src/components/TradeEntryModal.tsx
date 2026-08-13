import React, { useState } from 'react';
import type { Account, Trade, AssetClass, TradeDirection, EmotionRating } from '../types/journal';
import { X, Upload, Star, DollarSign, BarChart2 } from 'lucide-react';

interface TradeEntryModalProps {
  isOpen: boolean;
  accounts: Account[];
  activeAccountId: string;
  onClose: () => void;
  onSaveTrade: (trade: Trade) => void;
}

const PRESET_TAGS = ['Breakout', 'ICT_FVG', 'FVG_Sweep', 'TrendFollow', 'Scalp', 'Swing', 'News', 'Mistake_FOMO', 'Mistake_Revenge', 'EarlyExit'];

export const TradeEntryModal: React.FC<TradeEntryModalProps> = ({
  isOpen,
  accounts,
  activeAccountId,
  onClose,
  onSaveTrade,
}) => {
  if (!isOpen) return null;

  const [entryMode, setEntryMode] = useState<'balance' | 'price'>('balance');

  const [accountId, setAccountId] = useState<string>(
    activeAccountId === 'all' && accounts.length > 0 ? accounts[0].id : activeAccountId
  );

  const activeAccount = accounts.find((a) => a.id === accountId);
  const currentAccBal = activeAccount ? activeAccount.currentBalance : 50000;

  // Balance Delta Mode Inputs
  const [balanceBefore, setBalanceBefore] = useState<string>(currentAccBal.toString());
  const [balanceAfter, setBalanceAfter] = useState<string>((currentAccBal + 1200).toString());

  // Price & Quantity Mode Inputs
  const [symbol, setSymbol] = useState<string>('NQ');
  const [direction, setDirection] = useState<TradeDirection>('long');
  const [assetClass, setAssetClass] = useState<AssetClass>('futures');
  const [entryPrice, setEntryPrice] = useState<string>('19500');
  const [exitPrice, setExitPrice] = useState<string>('19560');
  const [quantity, setQuantity] = useState<string>('2');
  const [stopLoss, setStopLoss] = useState<string>('19470');
  const [takeProfit, setTakeProfit] = useState<string>('19560');
  const [fees, setFees] = useState<string>('8.50');

  const [entryDate] = useState<string>(new Date().toISOString().slice(0, 16));

  const [selectedTags, setSelectedTags] = useState<string[]>(['Breakout', 'ICT_FVG']);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [emotion, setEmotion] = useState<EmotionRating>('Disciplined');
  const [rating, setRating] = useState<number>(5);
  const [preTradeNotes, setPreTradeNotes] = useState<string>('');
  const [postTradeNotes, setPostTradeNotes] = useState<string>('');
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);

  // Computations
  const numBalBefore = parseFloat(balanceBefore) || 0;
  const numBalAfter = parseFloat(balanceAfter) || 0;

  const numEntry = parseFloat(entryPrice) || 0;
  const numExit = parseFloat(exitPrice) || 0;
  const numQty = parseFloat(quantity) || 0;
  const numFees = parseFloat(fees) || 0;
  const numSL = parseFloat(stopLoss) || 0;

  let netPnl = 0;
  if (entryMode === 'balance') {
    netPnl = numBalAfter - numBalBefore;
  } else {
    let grossPnl = (numExit - numEntry) * numQty;
    if (direction === 'short') grossPnl = (numEntry - numExit) * numQty;
    if (assetClass === 'futures' && (symbol.toUpperCase().includes('NQ') || symbol.toUpperCase().includes('MNQ'))) {
      grossPnl = (direction === 'long' ? numExit - numEntry : numEntry - numExit) * 20 * numQty;
    } else if (assetClass === 'futures' && (symbol.toUpperCase().includes('ES') || symbol.toUpperCase().includes('MES'))) {
      grossPnl = (direction === 'long' ? numExit - numEntry : numEntry - numExit) * 50 * numQty;
    }
    netPnl = grossPnl - numFees;
  }

  let calculatedR = undefined;
  if (numSL > 0 && numEntry > 0) {
    const riskDistance = Math.abs(numEntry - numSL);
    if (riskDistance > 0) {
      const rewardDistance = direction === 'long' ? (numExit - numEntry) : (numEntry - numExit);
      calculatedR = rewardDistance / riskDistance;
    }
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !selectedTags.includes(customTagInput.trim())) {
      setSelectedTags([...selectedTags, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol) return;

    const newTrade: Trade = {
      id: `trd-${Date.now()}`,
      accountId,
      symbol: symbol.toUpperCase(),
      direction,
      assetClass,
      entryPrice: entryMode === 'price' ? numEntry : undefined,
      exitPrice: entryMode === 'price' ? numExit : undefined,
      quantity: entryMode === 'price' ? numQty : 1,
      balanceBefore: entryMode === 'balance' ? numBalBefore : undefined,
      balanceAfter: entryMode === 'balance' ? numBalAfter : undefined,
      stopLoss: numSL || undefined,
      takeProfit: parseFloat(takeProfit) || undefined,
      fees: entryMode === 'price' ? numFees : 0,
      pnl: netPnl,
      pnlPercentage: (netPnl / (numBalBefore || 1)) * 100,
      rMultiple: calculatedR,
      entryDate,
      exitDate: entryDate,
      status: netPnl > 0.01 ? 'win' : netPnl < -0.01 ? 'loss' : 'breakeven',
      tags: selectedTags,
      emotion,
      rating,
      preTradeNotes,
      postTradeNotes,
      screenshot,
    };

    onSaveTrade(newTrade);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative font-mono text-xs my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--gruv-border)] pb-4 mb-5">
          <div>
            <h2 className="font-bold text-xl text-[var(--gruv-fg)]">LOG NEW TRADE</h2>
            <p className="text-xs text-[var(--gruv-muted)]">Choose Balance Delta Mode or Price Execution Mode</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Mode Switcher */}
          <div className="p-1 rounded-xl bg-[var(--gruv-bg)] border border-[var(--gruv-border)] grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setEntryMode('balance')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
                entryMode === 'balance'
                  ? 'bg-[var(--gruv-yellow)] text-[#1d2021] shadow-md'
                  : 'text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Balance Delta Mode (Includes Fees &amp; Slippage)</span>
            </button>

            <button
              type="button"
              onClick={() => setEntryMode('price')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
                entryMode === 'price'
                  ? 'bg-[var(--gruv-yellow)] text-[#1d2021] shadow-md'
                  : 'text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)]'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Price &amp; Contract Mode</span>
            </button>
          </div>

          {/* Account & General Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Target Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.initialBalance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Symbol (e.g. NQ, ES, BTC)</label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="NQ"
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none uppercase font-bold"
              />
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Asset Class</label>
              <select
                value={assetClass}
                onChange={(e: any) => setAssetClass(e.target.value)}
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              >
                <option value="futures">Futures</option>
                <option value="crypto">Crypto</option>
                <option value="forex">Forex</option>
                <option value="stocks">Stocks</option>
                <option value="options">Options</option>
              </select>
            </div>
          </div>

          {/* BALANCE DELTA MODE INPUTS */}
          {entryMode === 'balance' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--gruv-bg)]/60 border border-[var(--gruv-border)]">
              <div>
                <label className="text-[var(--gruv-muted)] block mb-1">Account Balance BEFORE Trade ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={balanceBefore}
                  onChange={(e) => setBalanceBefore(e.target.value)}
                  className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-[var(--gruv-muted)] block mb-1">Account Balance AFTER Trade ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={balanceAfter}
                  onChange={(e) => setBalanceAfter(e.target.value)}
                  className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none font-bold"
                />
              </div>
            </div>
          ) : (
            /* PRICE & CONTRACT EXECUTION MODE INPUTS */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[var(--gruv-muted)] block mb-1">Entry Price</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[var(--gruv-muted)] block mb-1">Exit Price</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[var(--gruv-muted)] block mb-1">Quantity / Contracts</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[var(--gruv-muted)] block mb-1">Fees ($)</label>
                <input
                  type="number"
                  step="any"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Risk Management (Stop Loss & Take Profit) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Stop Loss Price</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Optional SL"
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Take Profit Price</label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="Optional TP"
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>
          </div>

          {/* Direction Toggle */}
          <div>
            <label className="text-[var(--gruv-muted)] block mb-1">Trade Direction</label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDirection('long')}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  direction === 'long'
                    ? 'bg-[var(--gruv-blue)]/20 text-[var(--gruv-blue)] border-[var(--gruv-blue)]'
                    : 'bg-[var(--gruv-bg)] text-[var(--gruv-muted)] border-[var(--gruv-border)]'
                }`}
              >
                ▲ LONG
              </button>
              <button
                type="button"
                onClick={() => setDirection('short')}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  direction === 'short'
                    ? 'bg-[var(--gruv-purple)]/20 text-[var(--gruv-purple)] border-[var(--gruv-purple)]'
                    : 'bg-[var(--gruv-bg)] text-[var(--gruv-muted)] border-[var(--gruv-border)]'
                }`}
              >
                ▼ SHORT
              </button>
            </div>
          </div>

          {/* Calculated Net PnL Preview Banner */}
          <div className="p-4 rounded-xl bg-[var(--gruv-bg)]/80 border border-[var(--gruv-border)] flex items-center justify-between">
            <div>
              <span className="text-[var(--gruv-muted)] block text-[10px]">PREVIEW NET PnL (AFTER FEES &amp; SLIPPAGE)</span>
              <span className={`font-bold text-xl ${netPnl >= 0 ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                {netPnl >= 0 ? '+' : ''}${netPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Strategy Tags */}
          <div>
            <label className="text-[var(--gruv-muted)] block mb-1">Strategy Setups &amp; Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors border ${
                      isSelected
                        ? 'bg-[var(--gruv-yellow)]/20 text-[var(--gruv-yellow)] border-[var(--gruv-yellow)]'
                        : 'bg-[var(--gruv-bg)] text-[var(--gruv-muted)] border-[var(--gruv-border)]'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="Add custom tag..."
                className="bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-1.5 rounded-lg border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 rounded-lg bg-[var(--gruv-surface)] text-[var(--gruv-yellow)] border border-[var(--gruv-border)] hover:bg-[var(--gruv-yellow)]/10"
              >
                + Tag
              </button>
            </div>
          </div>

          {/* Psychology Rating & Emotion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Emotional Mindset</label>
              <select
                value={emotion}
                onChange={(e: any) => setEmotion(e.target.value)}
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              >
                <option value="Disciplined">Disciplined (Systematic execution)</option>
                <option value="Calm">Calm &amp; Patient</option>
                <option value="FOMO">FOMO (Chased entry)</option>
                <option value="Revenge">Revenge Trade (Forced position)</option>
                <option value="Hesitant">Hesitant (Late exit/entry)</option>
                <option value="Greedy">Greedy (Held past target)</option>
              </select>
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Execution Quality (1-5 Stars)</label>
              <div className="flex items-center space-x-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-[var(--gruv-yellow)] transition-transform hover:scale-110"
                  >
                    <Star className={`w-6 h-6 ${star <= rating ? 'fill-[var(--gruv-yellow)]' : 'opacity-30'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes & Screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Pre-Trade Setup Plan</label>
              <textarea
                rows={2}
                value={preTradeNotes}
                onChange={(e) => setPreTradeNotes(e.target.value)}
                placeholder="Key levels, liquidity sweeps..."
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] p-3 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Post-Trade Review &amp; Lessons</label>
              <textarea
                rows={2}
                value={postTradeNotes}
                onChange={(e) => setPostTradeNotes(e.target.value)}
                placeholder="What went right or wrong?"
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] p-3 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[var(--gruv-muted)] block mb-1">Chart Screenshot Attachment</label>
            {screenshot ? (
              <div className="relative rounded-xl overflow-hidden border border-[var(--gruv-border)]">
                <img src={screenshot} alt="Chart Screenshot" className="w-full max-h-36 object-cover" />
                <button
                  type="button"
                  onClick={() => setScreenshot(undefined)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 text-[var(--gruv-red)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center p-4 rounded-xl border border-dashed border-[var(--gruv-border)] hover:border-[var(--gruv-yellow)] cursor-pointer bg-[var(--gruv-bg)]/40 transition-colors space-x-2">
                <Upload className="w-4 h-4 text-[var(--gruv-yellow)]" />
                <span className="text-xs text-[var(--gruv-fg)]">Upload chart screenshot (PNG, JPG, WEBP)</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--gruv-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--gruv-border)] text-[var(--gruv-muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[var(--gruv-yellow)] to-[var(--gruv-orange)] text-[#1d2021] font-bold shadow-md hover:brightness-110"
            >
              Save Trade Entry
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
