import React, { useState, useMemo } from "react";
import { MoreVertical, Settings } from "lucide-react";
import { RelationshipDetailsScreen } from "./RelationshipDetailsScreen";
import { WalletRelationshipCard } from "../components/WalletRelationshipCard";
import { calculateWalletSummary, WalletRelationship } from "../services/walletService";
import { useWalletStore } from "../state/WalletContext";
import { useProfileStore } from "../../profile/state/ProfileContext";

interface WalletScreenProps {
  setActiveTab?: (tab: string) => void;
  setSelectedPlanId?: (planId: string | null) => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  setActiveTab,
  setSelectedPlanId,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [subView, setSubView] = useState<"main" | "relationship">("main");
  const [selectedRelationship, setSelectedRelationship] = useState<WalletRelationship | null>(null);

  const { dbWalletTransactions, dbPlansLocal, dbCirclesLocal, dbPlanParticipantsLocal, refreshTransactions } = useWalletStore();
  const { activeUserUuid, dbUsers } = useProfileStore();

  // Recalculate net balances dynamically based on the wallet database records
  const walletSummary = useMemo(() => {
    return calculateWalletSummary(
      activeUserUuid || "",
      dbWalletTransactions,
      dbUsers,
      dbPlansLocal,
      dbCirclesLocal,
      dbPlanParticipantsLocal
    );
  }, [activeUserUuid, dbWalletTransactions, dbUsers, dbPlansLocal, dbCirclesLocal, dbPlanParticipantsLocal]);

  // Combine all active relationships into a single list
  const activeRelationships = useMemo(() => {
    const all = [
      ...walletSummary.youOweList,
      ...walletSummary.youAreOwedList,
    ];
    // Deduplicate just in case, ordering by absolute balance magnitude (largest balances first)
    const uniqueMap = new Map<string, WalletRelationship>();
    all.forEach(r => uniqueMap.set(r.userId, r));
    return Array.from(uniqueMap.values()).sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));
  }, [walletSummary]);

  // Keep relationship details up-to-date dynamically when items are settled
  const currentRelationship = useMemo(() => {
    if (!selectedRelationship) return null;
    return activeRelationships.find((r) => r.userId === selectedRelationship.userId) || null;
  }, [activeRelationships, selectedRelationship]);

  if (subView === "relationship" && currentRelationship) {
    return (
      <RelationshipDetailsScreen
        relationship={currentRelationship}
        activeUserId={activeUserUuid || ""}
        onBack={() => {
          setSelectedRelationship(null);
          setSubView("main");
        }}
        onRefreshBalances={refreshTransactions}
        onSelectPlan={(pId) => setSelectedPlanId?.(pId)}
      />
    );
  }

  const netBalanceVal = walletSummary.totalYouAreOwed - walletSummary.totalYouOwe;
  const formattedOverallBalance = Math.abs(netBalanceVal).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return (
    <div id="subview_payments_wallet" className="w-full h-full flex flex-col overflow-y-auto scrollbar-none px-6 pt-3 pb-24 space-y-6 animate-fade-in text-left bg-[#050505]">
      {/* Premium Compact Header */}
      <div className="flex items-center justify-between pb-1.5 pt-1.5 relative">
        <div>
          <h2 className="text-[28px] font-display font-semibold text-white tracking-tight">Wallet</h2>
          <p className="text-[13px] text-zinc-550 font-sans mt-0.5">Manage your balance and transactions</p>
        </div>

        <div className="relative">
          <button
            id="wallet_menu_btn"
            onClick={() => setShowMenu(prev => !prev)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer border border-zinc-900/60"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 z-50 bg-[#0e0e11] border border-zinc-850 rounded-2xl shadow-xl overflow-hidden min-w-[140px] animate-fade-in">
              <button
                id="wallet_settings_btn"
                onClick={() => { setActiveTab?.("profile"); setShowMenu(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-left text-xs font-sans text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Redesigned Center-Aligned Overall Balance Card */}
      <div
        id="wallet_balance_card"
        className="bg-gradient-to-b from-zinc-900/40 to-zinc-950/20 border border-zinc-900/80 rounded-[28px] p-8 flex flex-col items-center justify-center text-center space-y-2.5 relative overflow-hidden shadow-lg"
      >
        <span className="text-[11px] font-sans font-medium text-zinc-450 tracking-wide block uppercase">
          Overall Balance
        </span>
        <h1 className={`text-5xl font-sans font-black select-all leading-none tracking-tight ${netBalanceVal > 0 ? "text-emerald-400" : netBalanceVal < 0 ? "text-[#FF6B2C]" : "text-white"}`}>
          {netBalanceVal > 0 ? `+${formattedOverallBalance}` : netBalanceVal < 0 ? `-${formattedOverallBalance}` : "₹0"}
        </h1>
        <p className="text-[12px] font-sans text-zinc-400">
          {netBalanceVal > 0 ? `You're owed ${formattedOverallBalance} overall.` : netBalanceVal < 0 ? `You owe ${formattedOverallBalance} overall.` : "You're all settled up 🎉"}
        </p>
      </div>

      {/* Unified Balances Section */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-zinc-500 px-1">
          Balances
        </h3>

        {activeRelationships.length === 0 ? (
          <div className="p-8 text-center bg-zinc-950/20 border border-dashed border-zinc-900 rounded-[24px] space-y-1">
            <p className="text-[13px] font-semibold text-zinc-300">You're all settled up 🎉</p>
            <p className="text-[11px] text-zinc-550 font-sans">No outstanding balances with your friends.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeRelationships.map((rel) => (
              <WalletRelationshipCard
                key={rel.userId}
                fullName={rel.fullName}
                profilePhoto={rel.profilePhoto}
                netBalance={rel.netBalance}
                type={rel.netBalance >= 0 ? "owed" : "owe"}
                onClick={() => {
                  setSelectedRelationship(rel);
                  setSubView("relationship");
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
