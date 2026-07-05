import React from "react";
import { ArrowLeft } from "lucide-react";
import { WalletRelationship } from "../services/walletService";
import { UserAvatar } from "../../../shared/components/UserAvatar";

interface RelationshipDetailsScreenProps {
  relationship: WalletRelationship;
  onBack: () => void;
  onRefreshBalances: () => void;
  activeUserId: string;
  onSelectPlan: (planId: string) => void;
}

export const RelationshipDetailsScreen: React.FC<RelationshipDetailsScreenProps> = ({
  relationship,
  onBack,
  onRefreshBalances,
  activeUserId,
  onSelectPlan,
}) => {
  const isOwed = relationship.netBalance >= 0;
  const formattedNetBalance = Math.abs(relationship.netBalance).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return (
    <div
      id="subview_relationship_details"
      className="w-full h-full flex flex-col overflow-y-auto scrollbar-none px-6 pt-3 pb-24 text-left bg-[#050505]"
    >
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
          <h2 className="text-xl font-display font-semibold text-zinc-100 tracking-tight">
            Details
          </h2>
          <p className="text-[10px] text-zinc-550 font-sans mt-0.5">
            Outstanding balance breakdown
          </p>
        </div>
      </div>

      {/* Relationship Header Banner */}
      <div className="flex flex-col items-center text-center py-6 mt-2 space-y-3">
        <UserAvatar
          src={relationship.profilePhoto}
          alt={relationship.fullName}
          size="w-20 h-20"
          className="ring-2 ring-white/10"
        />
        <div className="space-y-1">
          <h3 className="font-display font-bold text-xl text-zinc-100">
            {relationship.fullName}
          </h3>
          <p className="text-zinc-500 font-sans text-xs font-medium uppercase tracking-wider">
            {isOwed ? "Owes you" : "You owe"}
          </p>
          <h1 className={`font-sans font-black text-4xl leading-none mt-1 ${isOwed ? "text-emerald-400" : "text-[#FF6B2C]"}`}>
            {formattedNetBalance}
          </h1>
        </div>
      </div>

      {/* Expense Timeline list */}
      <div className="flex-1 flex flex-col pt-4 mt-2">
        <h4 className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-zinc-500 px-1 mb-4">
          Expenses Timeline
        </h4>

        {/* Expenses List (Sorted newest to oldest) */}
        <div className="divide-y divide-white/[0.04]">
          {[...relationship.expenses]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((expense) => {
              const expenseIsOwed = expense.role === "creditor";
              
              // Format date: Short month & day e.g. "Jul 05"
              const dateObj = new Date(expense.date);
              const formattedDate = !isNaN(dateObj.getTime())
                ? dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
                : "Recent";

              const formattedShare = expense.yourShare.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              });

              return (
                <button
                  key={expense.id}
                  onClick={() => onSelectPlan(expense.planId)}
                  className="w-full flex items-center justify-between py-4 text-left group hover:bg-white/[0.01] transition-all cursor-pointer px-1"
                >
                  {/* Left block: Date -> Cover -> Plan Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-xs font-sans text-zinc-500 w-12 shrink-0 font-medium">
                      {formattedDate}
                    </span>
                    
                    {expense.planCover ? (
                      <img
                        src={expense.planCover}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-white/[0.05] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/[0.05] shrink-0 flex items-center justify-center text-[10px] text-zinc-650 font-black">
                        PLAN
                      </div>
                    )}

                    <div className="min-w-0">
                      <h5 className="font-sans font-semibold text-[13px] text-zinc-200 group-hover:text-white transition-colors truncate">
                        {expense.planTitle}
                      </h5>
                      <span className="text-[10px] font-sans text-zinc-550 block truncate mt-0.5">
                        {expense.circleName}
                      </span>
                    </div>
                  </div>

                  {/* Right block: Amount */}
                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono text-sm font-bold tracking-tight ${
                        expenseIsOwed ? "text-emerald-400" : "text-[#FF6B2C]"
                      }`}
                    >
                      {expenseIsOwed ? "+" : "-"}
                      {formattedShare}
                    </span>
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
