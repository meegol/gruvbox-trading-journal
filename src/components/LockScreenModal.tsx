import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface LockScreenModalProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export const LockScreenModal: React.FC<LockScreenModalProps> = ({ isLocked, onUnlock }) => {
  if (!isLocked) return null;

  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'migol') {
      setError(false);
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onUnlock();
      }, 300);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#1d2021]/95 backdrop-blur-xl font-mono text-xs selection:bg-[var(--gruv-yellow)] selection:text-[#1d2021]">
      <div className="glass-panel w-full max-w-md p-8 relative border-2 border-[var(--gruv-border)] shadow-2xl rounded-2xl text-center space-y-6">
        
        {/* Top Header Logo */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--gruv-yellow)] text-[#1d2021] flex items-center justify-center shadow-lg font-bold text-2xl">
            <Lock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-wider text-[var(--gruv-fg)] font-mono">
              migo.<span className="text-[var(--gruv-yellow)]">nq</span>
            </h1>
            <p className="text-xs text-[var(--gruv-muted)] mt-1 font-mono">
              PERSONAL FUTURES TRADING VAULT
            </p>
          </div>
        </div>

        {/* Lock Description */}
        <div className="p-3.5 rounded-xl bg-[var(--gruv-bg)]/80 border border-[var(--gruv-border)] text-left flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-[var(--gruv-green)] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[var(--gruv-muted)] leading-relaxed">
            This journal is private and locked. Enter master passcode to authenticate and auto-sync your cloud database.
          </p>
        </div>

        {/* Passcode Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--gruv-muted)]">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Enter vault passcode"
              className={`w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] pl-10 pr-4 py-3 rounded-xl border text-sm font-bold tracking-widest focus:outline-none transition-colors ${
                error
                  ? 'border-[var(--gruv-red)] text-[var(--gruv-red)] animate-shake'
                  : 'border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)]'
              }`}
            />
          </div>

          {error && (
            <div className="flex items-center justify-center space-x-1.5 text-[var(--gruv-red)] font-bold text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>INVALID PASSCODE</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[var(--gruv-yellow)] text-[#1d2021] font-bold text-sm tracking-wider flex items-center justify-center space-x-2 shadow-md hover:brightness-110 active:scale-[0.99] transition-all"
          >
            <span>{loading ? 'AUTHENTICATING & SYNCING...' : 'UNLOCK JOURNAL'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="pt-2 text-[10px] text-[var(--gruv-muted)] border-t border-[var(--gruv-border)]/60">
          ● REAL CLOUD SERVER DATABASE ACTIVE
        </div>

      </div>
    </div>
  );
};
