import React, { useState } from 'react';
import { X, Calculator as CalcIcon } from 'lucide-react';


interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountBalance: number;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  accountBalance,
}) => {
  if (!isOpen) return null;

  const [balance, setBalance] = useState<string>(accountBalance.toString());
  const [riskPercent, setRiskPercent] = useState<string>('1.0');
  const [entryPrice, setEntryPrice] = useState<string>('19500');
  const [stopLossPrice, setStopLossPrice] = useState<string>('19470');
  const [instrument, setInstrument] = useState<'NQ' | 'ES' | 'FOREX' | 'CRYPTO'>('NQ');

  const numBal = parseFloat(balance) || 50000;
  const numRiskPct = parseFloat(riskPercent) || 1.0;
  const numEntry = parseFloat(entryPrice) || 0;
  const numSL = parseFloat(stopLossPrice) || 0;

  const dollarsToRisk = (numBal * numRiskPct) / 100;
  const priceDistance = Math.abs(numEntry - numSL);

  let suggestedContracts = 0;
  let pointValue = 1;

  if (priceDistance > 0) {
    if (instrument === 'NQ') {
      pointValue = 20; // NQ $20 per point per contract
      suggestedContracts = dollarsToRisk / (priceDistance * pointValue);
    } else if (instrument === 'ES') {
      pointValue = 50; // ES $50 per point per contract
      suggestedContracts = dollarsToRisk / (priceDistance * pointValue);
    } else if (instrument === 'FOREX') {
      pointValue = 10; // $10 per pip for 1 standard lot
      suggestedContracts = dollarsToRisk / (priceDistance * pointValue);
    } else {
      suggestedContracts = dollarsToRisk / priceDistance;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-md p-6 relative font-mono text-xs my-8">
        
        <div className="flex items-center justify-between border-b border-[var(--gruv-border)] pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[var(--gruv-bg)] text-[var(--gruv-yellow)] border border-[var(--gruv-border)]">
              <CalcIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[var(--gruv-fg)]">POSITION SIZING CALCULATOR</h2>
              <p className="text-[11px] text-[var(--gruv-muted)] font-mono">Calculate exact lot &amp; contract risk</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[var(--gruv-muted)] block mb-1">Instrument Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['NQ', 'ES', 'FOREX', 'CRYPTO'] as const).map((inst) => (
                <button
                  key={inst}
                  type="button"
                  onClick={() => setInstrument(inst)}
                  className={`py-2 rounded-lg font-bold border transition-colors ${
                    instrument === inst
                      ? 'bg-[var(--gruv-yellow)]/20 text-[var(--gruv-yellow)] border-[var(--gruv-yellow)]'
                      : 'bg-[var(--gruv-bg)] text-[var(--gruv-muted)] border-[var(--gruv-border)]'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Account Equity ($)</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Risk Capital (%)</label>
              <input
                type="number"
                step="0.1"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Entry Price</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Stop Loss Price</label>
              <input
                type="number"
                step="any"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>
          </div>

          {/* Results Display */}
          <div className="p-4 rounded-xl bg-[var(--gruv-bg)] border border-[var(--gruv-border)] space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--gruv-muted)]">Max Dollars Risked:</span>
              <span className="font-bold text-[var(--gruv-red)]">${dollarsToRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--gruv-muted)]">Stop Distance:</span>
              <span className="font-bold text-[var(--gruv-fg)]">{priceDistance.toFixed(2)} pts/pips</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[var(--gruv-border)] text-sm font-bold">
              <span className="text-[var(--gruv-yellow)]">SUGGESTED SIZE:</span>
              <span className="text-[var(--gruv-yellow)]">
                {suggestedContracts.toFixed(2)} {instrument === 'FOREX' ? 'Lots' : 'Contracts/Units'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right pt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-[var(--gruv-surface)] text-[var(--gruv-fg)] border border-[var(--gruv-border)]">
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
