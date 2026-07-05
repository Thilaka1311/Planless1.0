import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
import { useProfileStore } from "../../profile/state/ProfileContext";

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
      const res = await fetch("/api/db/fetch-all?tables=plans,wallet_expenses,circles,users,plan_participants");
      if (res.ok) {
        const json = await res.json();
        if (json.configured && !json.tables_missing) {
          const d = json.data || {};
          const plansList = d.plans || [];
          const walletTxs = d.wallet_expenses || [];
          const circlesList = d.circles || [];
          const participantsList = d.plan_participants || [];

          setDbWalletTransactions(walletTxs);
          setDbPlansLocal(plansList);
          setDbCirclesLocal(circlesList);
          setDbPlanParticipantsLocal(participantsList);
          setHasLoaded(true);
        }
      }
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
