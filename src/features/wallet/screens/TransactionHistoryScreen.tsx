import React, { useState } from "react";
import { ArrowLeft, Search, X, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Transaction } from "../../../core/types";

interface TransactionHistoryScreenProps {
  transactions: Transaction[];
  onBack: () => void;
}

export const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({
  transactions,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter transactions based on query (Name/title, type, amount, or settled status)
  const filteredTransactions = transactions.filter((tx) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = tx.title.toLowerCase().includes(query);
    const typeMatch = tx.type.toLowerCase().includes(query);
    const amountMatch = tx.amount.toString().includes(query);
    const dateMatch = tx.timestamp.toLowerCase().includes(query);

    return titleMatch || typeMatch || amountMatch || dateMatch;
  });

  return (
    <div id="subview_transaction_history" className="space-y-6 animate-fade-in text-left pb-0 px-1">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer border border-zinc-900/60"
          aria-label="Back to Wallet"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-sans font-bold text-zinc-150 tracking-tight">Transaction History</h2>
          <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Search and review all ledger movements</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, type, date..."
          className="w-full bg-zinc-900/40 border border-zinc-900 rounded-2xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-zinc-800 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Full Transaction list */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950/20 border border-dashed border-zinc-900 rounded-[20px] space-y-2">
            <p className="text-xs text-zinc-500 font-sans">No matching transactions found</p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-[10px] text-[#ff8b66] hover:underline font-semibold font-sans"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div id="transactions_history_list" className="space-y-0.5 divide-y divide-zinc-900/60">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.type === "credit";
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-zinc-900/10 px-1 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCredit
                          ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                          : "bg-[#ff8b66]/5 text-[#ff8b66] border-[#ff8b66]/10"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 truncate">{tx.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-zinc-500 font-sans">
                          {tx.timestamp}
                        </span>
                        <span className="text-zinc-700 text-[10px]">•</span>
                        <span className={`text-[8.5px] font-sans font-bold uppercase tracking-wider ${
                          isCredit ? "text-emerald-500/80" : "text-[#ff8b66]/80"
                        }`}>
                          {tx.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`font-sans text-xs font-bold shrink-0 ${
                    isCredit ? "text-emerald-400" : "text-zinc-200"
                  }`}>
                    {isCredit ? "+" : "−"} ₹{tx.amount.toLocaleString("en-IN")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
