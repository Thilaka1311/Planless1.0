import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
import { Transaction, DbTransaction, User } from "../../../core/types";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { insertTransaction } from "../../../lib/db";

interface WalletState {
  walletBalance: number;
  transactions: Transaction[];
  dbTransactions: DbTransaction[];
  setDbTransactions: React.Dispatch<React.SetStateAction<DbTransaction[]>>;
  depositFunds: (amount: number, activeUserId: string, dbUsers: User[]) => Promise<void>;
  deductFunds: (amount: number, receiverId: string, planId: string | null, activeUserId: string, dbUsers: User[]) => Promise<void>;
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
  const [dbTransactions, setDbTransactions] = useState<DbTransaction[]>([]);
  const [planTitles, setPlanTitles] = useState<Record<string, string>>({});
  const [hasLoaded, setHasLoaded] = useState(false);

  const { activeUserUuid, dbUsers } = useProfileStore();

  const refreshTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/db/fetch-all?tables=transactions,plans");
      if (res.ok) {
        const json = await res.json();
        if (json.configured && !json.tables_missing) {
          const d = json.data || {};
          const fetchedTxs = d.transactions || [];
          const plansList = d.plans || [];
          const titles: Record<string, string> = {};
          plansList.forEach((p: any) => {
            titles[p.id || p.plan_id || ""] = p.title;
          });
          setPlanTitles(titles);
          setDbTransactions(fetchedTxs);
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

  // Derived walletBalance using useMemo
  const walletBalance = useMemo(() => {
    if (!activeUserUuid) return 0;
    if (!hasLoaded && dbTransactions.length === 0) return 0;

    const received = dbTransactions
      .filter((tx: any) => tx.receiver_id === activeUserUuid)
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
    const paid = dbTransactions
      .filter((tx: any) => tx.sender_id === activeUserUuid)
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
    const calculatedBalance = received - paid;

    console.log(`[Wallet Transactions Load]`);
    console.log(`- transaction count: ${dbTransactions.length}`);
    console.log(`- incoming total: ${received}`);
    console.log(`- outgoing total: ${paid}`);
    console.log(`- final balance: ${calculatedBalance}`);

    return calculatedBalance;
  }, [dbTransactions, activeUserUuid, hasLoaded]);

  // Derived transactions using useMemo
  const transactions = useMemo(() => {
    const activeUserObj = dbUsers.find(u => u.user_id === userId || u.id === userId || (u as any).dbUuid === userId);
    const activeUuid = activeUserObj?.id || userId;

    return dbTransactions.map(t => {
      const rxUser = dbUsers.find(u => u.id === t.receiver_id || u.user_id === t.receiver_id);
      const sxUser = dbUsers.find(u => u.id === t.sender_id || u.user_id === t.sender_id);
      const rx = rxUser?.full_name || "Self";
      const sx = sxUser?.full_name || "Self";
      
      let title = "Deposit";
      if (t.transaction_type === "split_payment" || t.transaction_type === "plan_payment") {
        const isSender = t.sender_id === activeUuid || t.sender_id === userId;
        title = isSender ? `Paid ${rx}` : `Received from ${sx}`;
      } else if (t.transaction_type === "deposit") {
        title = "Top-up Wallet";
      }

      const isSenderMatch = t.sender_id === activeUuid || t.sender_id === userId;
      const planTitle = t.plan_id ? planTitles[t.plan_id] : null;

      return {
        id: t.transaction_id,
        title: title,
        amount: t.amount,
        type: (isSenderMatch ? "debit" : "credit") as "debit" | "credit",
        timestamp: t.timestamp,
        settled: (t.status as any) === "success" || (t.status as any) === "completed" || (t.status as any) === true,
        status: t.status,
        transactionType: t.transaction_type,
        planTitle: planTitle
      };
    });
  }, [dbTransactions, dbUsers, userId, planTitles]);

  const depositFunds = async (amount: number, activeUserId: string, dbUsers: User[]) => {
    // Resolve active user's UUID for receiver_id (transactions must use users.id)
    const meUser = dbUsers.find(u => u.user_id === activeUserId || u.id === activeUserId);
    const meUuid = meUser?.id || activeUserId;

    const newTx = {
      transaction_id: `T_dep_${Date.now()}`,
      sender_id: "SYSTEM",
      receiver_id: meUuid,
      plan_id: null,
      amount,
      transaction_type: "deposit",
      status: "success",
      timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      created_at: new Date().toISOString()
    };
    
    await insertTransaction(newTx as any);
    await refreshTransactions();
  };

  const deductFunds = async (
    amount: number, 
    receiverId: string, 
    planId: string | null,
    activeUserId: string,
    dbUsers: User[]
  ) => {
    // Resolve UUIDs for sender and receiver (transactions must use users.id)
    const senderUser = dbUsers.find(u => u.user_id === activeUserId || u.id === activeUserId);
    const senderUuid = senderUser?.id || activeUserId;
    const receiverUser = dbUsers.find(u => u.user_id === receiverId || u.id === receiverId);
    const receiverUuid = receiverUser?.id || receiverId;

    const newTx = {
      transaction_id: `T_pay_${Date.now()}`,
      sender_id: senderUuid,
      receiver_id: receiverUuid,
      plan_id: planId,
      amount,
      transaction_type: "split_payment",
      status: "success",
      timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      created_at: new Date().toISOString()
    };
    
    await insertTransaction(newTx as any);
    await refreshTransactions();
  };

  const memoizedDepositFunds = useCallback(depositFunds, []);
  const memoizedDeductFunds = useCallback(deductFunds, []);

  const contextValue = useMemo(() => ({
    walletBalance,
    transactions,
    dbTransactions, setDbTransactions,
    depositFunds: memoizedDepositFunds,
    deductFunds: memoizedDeductFunds,
    refreshTransactions
  }), [
    walletBalance, transactions, dbTransactions,
    memoizedDepositFunds, memoizedDeductFunds, refreshTransactions
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
