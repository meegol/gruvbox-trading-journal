import React, { useState } from 'react';
import type { Account, AccountType } from '../types/journal';
import { X, Trash2, Edit3 } from 'lucide-react';


interface AccountManagerModalProps {
  isOpen: boolean;
  accounts: Account[];
  onClose: () => void;
  onSaveAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  accounts,
  onClose,
  onSaveAccount,
  onDeleteAccount,
}) => {
  if (!isOpen) return null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>('Apex 50k Eval #1');
  const [type, setType] = useState<AccountType>('eval');
  const [initialBalance, setInitialBalance] = useState<string>('50000');
  const [profitTarget, setProfitTarget] = useState<string>('3000');
  const [maxDrawdown, setMaxDrawdown] = useState<string>('2500');
  const [dailyLossLimit, setDailyLossLimit] = useState<string>('500');
  const [payoutThreshold, setPayoutThreshold] = useState<string>('1500');
  const [notes, setNotes] = useState<string>('');

  const resetForm = () => {
    setEditingId(null);
    setName('Apex 50k Eval #1');
    setType('eval');
    setInitialBalance('50000');
    setProfitTarget('3000');
    setMaxDrawdown('2500');
    setDailyLossLimit('500');
    setPayoutThreshold('1500');
    setNotes('');
  };

  const handleEditClick = (acc: Account) => {
    setEditingId(acc.id);
    setName(acc.name);
    setType(acc.type);
    setInitialBalance(acc.initialBalance.toString());
    setProfitTarget(acc.profitTarget.toString());
    setMaxDrawdown(acc.maxDrawdown.toString());
    setDailyLossLimit((acc.dailyLossLimit || 500).toString());
    setPayoutThreshold((acc.payoutThreshold || 1500).toString());
    setNotes(acc.notes || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numBal = parseFloat(initialBalance) || 50000;
    const numTarget = parseFloat(profitTarget) || 0;
    const numDrawdown = parseFloat(maxDrawdown) || 2500;
    const numDailyLoss = parseFloat(dailyLossLimit) || 500;
    const numPayout = parseFloat(payoutThreshold) || 1500;

    const newAcc: Account = {
      id: editingId || `acc-${Date.now()}`,
      name,
      type,
      initialBalance: numBal,
      currentBalance: editingId
        ? accounts.find((a) => a.id === editingId)?.currentBalance || numBal
        : numBal,
      profitTarget: numTarget,
      maxDrawdown: numDrawdown,
      dailyLossLimit: numDailyLoss,
      payoutThreshold: numPayout,
      status: 'active',
      createdAt: editingId
        ? accounts.find((a) => a.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      notes,
    };

    onSaveAccount(newAcc);
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative font-mono text-xs my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--gruv-border)] pb-4 mb-5">
          <div>
            <h2 className="font-bold text-xl text-[var(--gruv-fg)]">PROP FIRM &amp; ACCOUNT MANAGER</h2>
            <p className="text-xs text-[var(--gruv-muted)]">Configure evaluations, funded accounts ($50k defaults), and drawdown limits</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--gruv-muted)] hover:text-[var(--gruv-fg)] hover:bg-[var(--gruv-bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Accounts List */}
        <div className="mb-6">
          <h3 className="font-bold text-xs text-[var(--gruv-yellow)] uppercase tracking-wider mb-3">Your Accounts ({accounts.length})</h3>
          <div className="space-y-2.5">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3.5 rounded-xl bg-[var(--gruv-surface)] border border-[var(--gruv-border)] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-[var(--gruv-fg)]">{acc.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      acc.type === 'eval'
                        ? 'bg-[var(--gruv-yellow)]/20 text-[var(--gruv-yellow)]'
                        : acc.type === 'funded'
                        ? 'bg-[var(--gruv-green)]/20 text-[var(--gruv-green)]'
                        : 'bg-[var(--gruv-blue)]/20 text-[var(--gruv-blue)]'
                    }`}>
                      {acc.type === 'eval' ? 'Evaluation' : acc.type === 'funded' ? 'Funded' : 'Personal'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--gruv-muted)] mt-1">
                    Initial: ${acc.initialBalance.toLocaleString()} • Target: ${acc.profitTarget.toLocaleString()} • Max DD: ${acc.maxDrawdown.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditClick(acc)}
                    title="Edit account specs"
                    className="p-1.5 rounded-lg text-[var(--gruv-muted)] hover:text-[var(--gruv-yellow)] hover:bg-[var(--gruv-bg)]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {accounts.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete account "${acc.name}" and all its logged trades?`)) {
                          onDeleteAccount(acc.id);
                        }
                      }}
                      title="Delete account"
                      className="p-1.5 rounded-lg text-[var(--gruv-muted)] hover:text-[var(--gruv-red)] hover:bg-[var(--gruv-bg)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create / Edit Form */}
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-[var(--gruv-bg)]/60 border border-[var(--gruv-border)] space-y-4">
          <h3 className="font-bold text-xs text-[var(--gruv-yellow)] uppercase tracking-wider">
            {editingId ? 'Edit Account Specs' : '+ Add New Prop Eval / Account'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Account Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apex 50k Eval #1"
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Account Category</label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              >
                <option value="eval">Evaluation (Has Profit Target to Pass)</option>
                <option value="funded">Funded Account (Has Payout Threshold)</option>
                <option value="personal">Personal / Spot Account</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Initial Balance ($)</label>
              <input
                type="number"
                required
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="50000"
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>

            {type === 'eval' && (
              <div>
                <label className="text-[var(--gruv-muted)] block mb-1">Profit Target ($)</label>
                <input
                  type="number"
                  value={profitTarget}
                  onChange={(e) => setProfitTarget(e.target.value)}
                  placeholder="3000"
                  className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
                />
              </div>
            )}

            {type === 'funded' && (
              <div>
                <label className="text-[var(--gruv-muted)] block mb-1">Payout Threshold ($)</label>
                <input
                  type="number"
                  value={payoutThreshold}
                  onChange={(e) => setPayoutThreshold(e.target.value)}
                  placeholder="1500"
                  className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Max Drawdown ($)</label>
              <input
                type="number"
                required
                value={maxDrawdown}
                onChange={(e) => setMaxDrawdown(e.target.value)}
                placeholder="2500"
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[var(--gruv-muted)] block mb-1">Daily Max Loss ($)</label>
              <input
                type="number"
                required
                value={dailyLossLimit}
                onChange={(e) => setDailyLossLimit(e.target.value)}
                placeholder="500"
                className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
              />
            </div>
          </div>


          <div>
            <label className="text-[var(--gruv-muted)] block mb-1">Notes / Description</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., 50k Prop Firm eval targeting 6% profit..."
              className="w-full bg-[var(--gruv-bg)] text-[var(--gruv-fg)] px-3 py-2 rounded-xl border border-[var(--gruv-border)] focus:border-[var(--gruv-yellow)] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 rounded-xl border border-[var(--gruv-border)] text-[var(--gruv-muted)]"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[var(--gruv-yellow)] text-[#1d2021] font-bold hover:brightness-110"
            >
              {editingId ? 'Update Account Specs' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="text-right pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--gruv-surface)] text-[var(--gruv-fg)] border border-[var(--gruv-border)]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
