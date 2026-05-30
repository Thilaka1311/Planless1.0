import React, { useState } from "react";
import { Wallet, Clock, TrendingUp, TrendingDown, ChevronRight, Plus, MoreVertical, Settings } from "lucide-react";
import { Plan, Transaction } from "../../../core/types";


interface WalletScreenProps {
  walletBalance: number;
  transactions: Transaction[];
  plans: Plan[];
  userProfile: any;
  setShowDepositModal: (show: boolean) => void;
  triggerToast: (msg: string) => void;
  onBackToHome?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  walletBalance,
  transactions,
  plans,
  userProfile,
  setShowDepositModal,
  triggerToast,
  onBackToHome,
  setActiveTab
}) => {
  const [showMenu, setShowMenu] = useState(false);
  // 1. Calculate Credits Added (sum of all credit type transaction amounts)
  const creditsAdded = transactions
    .filter((tx) => tx.type === "credit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // 2. Calculate Amount Spent (sum of all debit type transaction amounts)
  const amountSpent = transactions
    .filter((tx) => tx.type === "debit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Filter for active co-pays (plans joined with cost > 0)
  const activePaidPlans = plans.filter(
    (p) => p.cost > 0 && p.joinedUsers.some((u) => u.name === userProfile.name)
  );

  return (
    <div id="subview_payments_wallet" className="space-y-6 animate-fade-in text-left pb-16">
      {/* Lightweight Page Header */}
      <div className="flex items-center justify-between pb-1 relative">
        <h2 className="text-lg font-display font-bold text-zinc-100 tracking-tight">Wallet</h2>
        <div className="relative">
          <button
            id="wallet_menu_btn"
            onClick={() => setShowMenu(prev => !prev)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 z-50 bg-zinc-900 border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden min-w-[140px] animate-fade-in">
              <button
                id="wallet_settings_btn"
                onClick={() => { setActiveTab?.("profile"); setShowMenu(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-left text-xs font-sans text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LARGE BALANCE DISPLAY SEAMLESSLY ADOPTED */}
      <div
        id="wallet_balance_card"
        className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden shadow-xl text-center space-y-4"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff8b66]/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-[0.25em]">
            SPONTANEOUS BALANCE
          </span>
          <h1 className="text-4xl font-display font-black text-white select-all">
            ₹{walletBalance.toLocaleString("en-IN")}
          </h1>
        </div>

        <div className="flex justify-center gap-3">
          <button
            id="add_money_btn"
            onClick={() => setShowDepositModal(true)}
            className="bg-zinc-100 hover:bg-white text-black font-semibold text-xs px-6 py-2.5 rounded-full transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span>Deposit Cash (UPI)</span>
          </button>
        </div>
      </div>

      {/* TRANSACTION METRICS ROW */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Credits Added</span>
            <span className="text-sm font-mono font-black text-zinc-200 block">₹{creditsAdded.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-[#ff8b66] shrink-0">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Amount Spent</span>
            <span className="text-sm font-mono font-black text-zinc-200 block">₹{amountSpent.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* ACTIVE HANGOUT COPAYS */}
      <div className="space-y-3">
        <h3 className="text-[10.5px] font-display uppercase tracking-[0.15em] text-zinc-500 font-bold px-1">
          Active Plan Co-pays
        </h3>

        {activePaidPlans.length === 0 ? (
          <p className="text-[10px] text-zinc-500 italic p-3 text-center bg-zinc-950 rounded-2xl border border-zinc-900">
            No active plan co-pays yet. Join a plan with a ticket/shuffled split!
          </p>
        ) : (
          <div className="space-y-2">
            {activePaidPlans.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-950 border border-zinc-900/60 rounded-2xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">⚡</span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-sans font-bold text-zinc-200 truncate">{p.title}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[8.5px] text-emerald-400 font-mono font-bold uppercase">
                        SOCIALLY SETTLED
                      </span>
                      <span className="text-[8px] text-zinc-650">•</span>
                      <div className="flex -space-x-1">
                        {p.joinedUsers.slice(0, 3).map((u, ui) => (
                          <img
                            key={ui}
                            src={u.avatar}
                            className="w-3.5 h-3.5 rounded-full object-cover border border-zinc-955"
                            alt="avatar"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                  ₹{p.cost}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SPONTANEOUS PEER LEDGER HISTORY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10.5px] font-display uppercase tracking-[0.15em] text-zinc-500 font-bold">
            Spontaneous Peer Ledger
          </h3>
          <span className="text-[7.5px] font-mono text-[#ff8b66] bg-[#ff8b66]/10 px-2 py-0.5 rounded border border-[#ff8b66]/15 font-bold">
            Settle & Share History
          </span>
        </div>

        {transactions.length === 0 ? (
          <p className="text-[10px] text-zinc-500 italic p-3 text-center bg-zinc-950 rounded-2xl border border-zinc-900">
            No transactions found yet.
          </p>
        ) : (
          <div id="transactions_list" className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-sm leading-none ${
                      tx.type === "credit"
                        ? "bg-emerald-500/10 text-emerald-400 font-black"
                        : "bg-[#ff5e3a]/10 text-brand-peach"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "−"}
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-semibold text-zinc-200">{tx.title}</h4>
                    <span className="text-[9px] font-mono text-zinc-550 block mt-0.5 uppercase">
                      {tx.timestamp}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-xs font-bold text-zinc-200">
                  {tx.type === "credit" ? "+" : "−"} ₹{tx.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
