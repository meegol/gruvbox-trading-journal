import React, { useState } from 'react';
import type { Account, Trade, TradeDirection, EmotionRating, FuturesSymbol, TradingSession } from '../types/journal';
import { getFuturesPointValue } from '../utils/futures';
import { X, Upload, Star, DollarSign, BarChart2, CheckSquare, Square } from 'lucide-react';

interface TradeEntryModalProps {
  isOpen: boolean;
  accounts: Account[];
  activeAccountId: string;
  onClose: () => void;
  onSaveTrade: (trade: Trade) => void;
}

const FUTURES_PRESETS: FuturesSymbol[] = ['NQ', 'MNQ', 'ES', 'MES', 'YM', 'MYM', 'RTY', 'M2K', 'CL', 'GC'];
const SESSIONS: TradingSession[] = ['NY AM Open', 'NY PM Session', 'London', 'Asia / Overnight'];

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

  // Balance Delta Mode
  const [balanceBefore, setBalanceBefore] = useState<string>(currentAccBal.toString());
  const [balanceAfter, setBalanceAfter] = useState<string>(currentAccBal.toString());

  // Futures Execution Specs
  const [symbol, setSymbol] = useState<string>('NQ');
  const [session, setSession] = useState<TradingSession>('NY AM Open');
  const [direction, setDirection] = useState<TradeDirection>('long');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [fees, setFees] = useState<string>('4.50');

  const [entryDate] = useState<string>(new Date().toISOString().slice(0, 16));

  // Pre-Flight Checklist
  const [chkSl, setChkSl] = useState(false);
  const [chkRisk, setChkRisk] = useState(false);
  const [chkNews, setChkNews] = useState(false);

  const [emotion, setEmotion] = useState<EmotionRating>('Disciplined');
  const [rating, setRating] = useState<number>(5);
  const [preTradeNotes, setPreTradeNotes] = useState<string>('');
  const [postTradeNotes, setPostTradeNotes] = useState<string>('');
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);

  // Dynamic PnL Math
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
    const pointMultiplier = getFuturesPointValue(symbol);
    const pointDiff = direction === 'long' ? (numExit - numEntry) : (numEntry - numExit);
    const grossPnl = pointDiff * pointMultiplier * numQty;
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
    if (!symbol.trim()) return;

    const newTrade: Trade = {
      id: `trd-${Date.now()}`,
      accountId,
      symbol: symbol.toUpperCase().trim(),
      direction,
      assetClass: 'futures',
      session,
      entryPrice: entryMode === 'price' ? numEntry : undefined,
      exitPrice: entryMode === 'price' ? numExit : undefined,
      quantity: entryMode === 'price' ? numQty : 1,
      balanceBefore: entryMode === 'balance' ? numBalBefore : undefined,
      balanceAfter: entryMode === 'balance' ? numBalAfter : undefined,
      stopLoss: numSL || undefined,
      takeProfit: parseFloat(takeProfit) || undefined,
      fees: entryMode === 'price' ? numFees : 0,
      pnl: netPnl,
      pnlPercentage: (netPnl / (numBalBefore || 50000)) * 100,
      rMultiple: calculatedR,
      entryDate,
      exitDate: entryDate,
      status: netPnl > 0.01 ? 'win' : netPnl < -0.01 ? 'loss' : 'breakeven',
      emotion,
      rating,
      checklistPassed: chkSl && chkRisk && chkNews,
      preTradeNotes,
      postTradeNotes,
      screenshot,
    };

    onSaveTrade(newTrade);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-mono text-xs">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative my-8">
        
        <div className="flex items-center justify-between border-b border-[var(--gruv-border)] pb-4 mb-5">
          <div>
            <h2 className="font-bold text-xl text-[var(--gruv-fg)] font-ndot tracking-wider">LOG FUTURES TRADE</h2>
            <p className="text-[11px] text-[var(--gruv-muted)]">Select contract, session &amp; entry mode</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Mode Switcher */}
          <div className="p-1 rounded-xl bg-[var(--gruv-bg)] border border-[var(--gruv-border)] grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setEntryMode('balance')}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
                entryMode === 'balance'
                  ? 'bg-[var(--gruv-yellow)] text-[#1d2021]'
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
                  ? 'bg-[var(--gruv-yellow)] text-[#1d2021]'
                  : 'text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)]'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Price &amp; Contract Mode</span>
            </button>
          </div>

          {/* Session Selector */}
          <div>
            <label className="text-[var(--gruv-muted)] block mb-1">Trading Session</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SESSIONS.map((sess) => (
                <button
                  key={sess}
                  type="button"
                  onClick={() => setSession(sess)}
                  className={`py-2 px-2 rounded-lg font-bold text-center border transition-all ${
                    session === sess
                      ? 'bg-[var(--gruv-yellow)]/20 text-[var(--gruv-yellow)] border-[var(--gruv-yellow)]'
                      : 'bg-[var(--gruv-bg)] text-[var(--gruv-muted)] border-[var(--gruv-border)]'
                  }`}
                >
                  {sess}
                </button>
              ))}
            </div>
          </div>

          {/* Futures Symbol Selector */}
          <div>
            <label className="text-[var(--gruv-muted)] block mb-1">Futures Contract Symbol</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {FUTURES_PRESETS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setSymbol(sym)}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                    symbol.toUpperCase() === sym
                      ? 'bg-[var(--gruv-yellow)]/20 text-[var(--gruv-yellow)] border-[var(--gruv-yellow)]'
                      : 'bg-[var(--gruv-bg)] text-[var(--gruv-muted)] border-[var(--gruv-border)]'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Or enter symbol (e.g. NQ, MNQ, ES, MES, YM, MYM)"
              className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none uppercase font-bold"
            />
          </div>

          {/* Target Account */}
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

          {/* BALANCE DELTA MODE */}
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
                  className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none font-bold text-sm"
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
                  className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none font-bold text-sm"
                />
              </div>
            </div>
          ) : (
            /* PRICE & CONTRACT MODE */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <label className="text-[var(--gruv-muted)] block mb-1">Contracts</label>
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

          {/* Pre-Flight Protocol Checklist */}
          <div className="p-3.5 rounded-xl bg-[var(--gruv-bg)]/80 border border-[var(--gruv-border)] space-y-2">
            <span className="font-bold text-xs text-[var(--gruv-yellow)] uppercase tracking-wider block">Pre-Flight Execution Checklist</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChkSl(!chkSl)}
                className={`p-2 rounded-lg border text-left flex items-center space-x-2 transition-colors ${
                  chkSl ? 'bg-[var(--gruv-green)]/15 border-[var(--gruv-green)] text-[var(--gruv-green)] font-bold' : 'bg-[var(--gruv-bg)] border-[var(--gruv-border)] text-[var(--gruv-muted)]'
                }`}
              >
                {chkSl ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>SL Defined Before Entry</span>
              </button>

              <button
                type="button"
                onClick={() => setChkRisk(!chkRisk)}
                className={`p-2 rounded-lg border text-left flex items-center space-x-2 transition-colors ${
                  chkRisk ? 'bg-[var(--gruv-green)]/15 border-[var(--gruv-green)] text-[var(--gruv-green)] font-bold' : 'bg-[var(--gruv-bg)] border-[var(--gruv-border)] text-[var(--gruv-muted)]'
                }`}
              >
                {chkRisk ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>Risk ≤ 1.5% Equity</span>
              </button>

              <button
                type="button"
                onClick={() => setChkNews(!chkNews)}
                className={`p-2 rounded-lg border text-left flex items-center space-x-2 transition-colors ${
                  chkNews ? 'bg-[var(--gruv-green)]/15 border-[var(--gruv-green)] text-[var(--gruv-green)] font-bold' : 'bg-[var(--gruv-bg)] border-[var(--gruv-border)] text-[var(--gruv-muted)]'
                }`}
              >
                {chkNews ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>News Schedule Checked</span>
              </button>
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

          {/* Risk Management (SL & TP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Stop Loss Price (Optional)</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="SL Price"
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Take Profit Price (Optional)</label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="TP Price"
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>
          </div>

          {/* Net PnL Preview Banner */}
          <div className="p-4 rounded-xl bg-[var(--gruv-bg)]/80 border border-[var(--gruv-border)] flex items-center justify-between">
            <div>
              <span className="text-[var(--gruv-muted)] block text-[10px]">NET PnL</span>
              <span className={`font-bold text-xl font-ndot ${netPnl >= 0 ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                {netPnl >= 0 ? '+' : ''}${netPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {calculatedR !== undefined && (
              <div>
                <span className="text-[var(--gruv-muted)] block text-[10px]">R-MULTIPLE</span>
                <span className={`font-bold text-lg font-ndot ${calculatedR >= 0 ? 'text-[var(--gruv-green)]' : 'text-[var(--gruv-red)]'}`}>
                  {calculatedR >= 0 ? '+' : ''}{calculatedR.toFixed(2)}R
                </span>
              </div>
            )}
          </div>

          {/* Psychology Rating & Emotion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Execution Mindset</label>
              <select
                value={emotion}
                onChange={(e: any) => setEmotion(e.target.value)}
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              >
                <option value="Disciplined">Disciplined</option>
                <option value="Calm">Calm &amp; Patient</option>
                <option value="FOMO">FOMO</option>
                <option value="Revenge">Revenge Trade</option>
                <option value="Hesitant">Hesitant</option>
                <option value="Greedy">Greedy</option>
              </select>
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Execution Rating</label>
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

          {/* Pre-Trade Setup Plan & Post-Trade Review */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Pre-Trade Setup Plan</label>
              <textarea
                rows={3}
                value={preTradeNotes}
                onChange={(e) => setPreTradeNotes(e.target.value)}
                placeholder="Key levels, liquidity sweeps, trade plan..."
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] p-3 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Post-Trade Review</label>
              <textarea
                rows={3}
                value={postTradeNotes}
                onChange={(e) => setPostTradeNotes(e.target.value)}
                placeholder="Trade review and execution feedback..."
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] p-3 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="text-[var(--gruv-muted)] block mb-1">Chart Screenshot</label>
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
                <span className="text-xs text-[var(--gruv-fg)]">Attach chart screenshot</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Actions */}
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
              className="px-6 py-2 rounded-xl bg-[var(--gruv-yellow)] text-[#1d2021] font-bold shadow-md hover:brightness-110"
            >
              Save Trade Entry
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
