import React, { createContext, useContext, useState, ReactNode } from "react";
import { Transaction, DbTransaction, User } from "../../../core/types";
import { mapTransactionsToLegacy } from "../../../lib/mappers";

interface WalletState {
  walletBalance: number;
  setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  dbTransactions: DbTransaction[];
  setDbTransactions: React.Dispatch<React.SetStateAction<DbTransaction[]>>;
  depositFunds: (amount: number, activeUserId: string, dbUsers: User[]) => void;
  deductFunds: (amount: number, receiverId: string, planId: string | null, activeUserId: string, dbUsers: User[]) => void;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export const WalletProvider = ({ 
  children, 
  userId = "" 
}: { 
  children: ReactNode; 
  userId?: string;
}) => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [dbTransactions, setDbTransactions] = useState<DbTransaction[]>([]);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const depositFunds = (amount: number, activeUserId: string, dbUsers: User[]) => {
    setWalletBalance(prev => prev + amount);
    const newTx: DbTransaction = {
      transaction_id: `T_dep_${Date.now()}`,
      sender_id: "SYSTEM",
      receiver_id: activeUserId,
      plan_id: null,
      amount,
      transaction_type: "deposit",
      status: "success",
      timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    
    setDbTransactions(prev => [newTx, ...prev]);
    setTransactions(prev => {
      const rx = dbUsers.find(u => u.user_id === newTx.receiver_id)?.full_name || "Self";
      const sx = dbUsers.find(u => u.user_id === newTx.sender_id)?.full_name || "Self";
      return [{
        id: newTx.transaction_id,
        title: "Top-up Wallet",
        amount: newTx.amount,
        type: "credit" as const,
        timestamp: newTx.timestamp,
        settled: true
      }, ...prev];
    });
  };

  const deductFunds = (
    amount: number, 
    receiverId: string, 
    planId: string | null,
    activeUserId: string,
    dbUsers: User[]
  ) => {
    setWalletBalance(prev => Math.max(0, prev - amount));
    const newTx: DbTransaction = {
      transaction_id: `T_pay_${Date.now()}`,
      sender_id: activeUserId,
      receiver_id: receiverId,
      plan_id: planId,
      amount,
      transaction_type: "split_payment",
      status: "success",
      timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    
    setDbTransactions(prev => [newTx, ...prev]);
    setTransactions(prev => {
      const rx = dbUsers.find(u => u.user_id === newTx.receiver_id)?.full_name || "Self";
      return [{
        id: newTx.transaction_id,
        title: `Paid ${rx}`,
        amount: newTx.amount,
        type: "debit" as const,
        timestamp: newTx.timestamp,
        settled: true
      }, ...prev];
    });
  };

  return (
    <WalletContext.Provider value={{
      walletBalance, setWalletBalance,
      transactions, setTransactions,
      dbTransactions, setDbTransactions,
      depositFunds, deductFunds
    }}>
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
