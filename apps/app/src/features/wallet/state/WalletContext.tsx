import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { supabase } from "../../../../lib/supabaseClient";

interface WalletState {
  dbWalletTransactions: any[];
  dbPlansLocal: any[];
  dbCirclesLocal: any[];
  dbPlanParticipantsLocal: any[];
  refreshTransactions: () => Promise<void>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export const WalletProvider = ({
  children,
  userId = ""
}: {
  children: ReactNode;
  userId?: string;
}) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const { activeUserUuid } = useProfileStore();

  const [dbWalletTransactions, setDbWalletTransactions] = useState<any[]>([]);
  const [dbPlansLocal, setDbPlansLocal] = useState<any[]>([]);
  const [dbCirclesLocal, setDbCirclesLocal] = useState<any[]>([]);
  const [dbPlanParticipantsLocal, setDbPlanParticipantsLocal] = useState<any[]>([]);

  const refreshTransactions = useCallback(async () => {
    try {
      const { data: plansList } = await (supabase as any).from("plans").select("*");
      const { data: participantsList } = await (supabase as any).from("plan_participants").select("*");
      const { data: walletTxs, error: walletErr } = await (supabase as any).from("wallet_expenses").select("*");
      const { data: circlesList, error: circlesErr } = await (supabase as any).from("circles").select("*");

      if (walletErr) console.error("[WalletContext refreshTransactions] wallet_expenses error:", walletErr);
      if (circlesErr) console.error("[WalletContext refreshTransactions] circles error:", circlesErr);

      setDbWalletTransactions(walletTxs || []);
      if (plansList) setDbPlansLocal(plansList);
      setDbCirclesLocal(circlesList || []);
      if (participantsList) setDbPlanParticipantsLocal(participantsList);
      setHasLoaded(true);
    } catch (err) {
      console.error("[WalletContext refreshTransactions] Failed:", err);
    }
  }, []);

  // Reload transactions on startup / active user UUID change
  useEffect(() => {
    if (activeUserUuid) {
      refreshTransactions();
    }
  }, [activeUserUuid, refreshTransactions]);

  const contextValue = useMemo(() => ({
    dbWalletTransactions,
    dbPlansLocal,
    dbCirclesLocal,
    dbPlanParticipantsLocal,
    refreshTransactions
  }), [
    dbWalletTransactions, dbPlansLocal, dbCirclesLocal, dbPlanParticipantsLocal, refreshTransactions
  ]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletStore = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletStore must be used within a WalletProvider");
  }
  return context;
};
