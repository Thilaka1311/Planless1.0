import React from "react";
import { UserAvatar } from "../../../shared/components/UserAvatar";

interface WalletRelationshipCardProps {
  fullName: string;
  profilePhoto: string;
  netBalance: number;
  type: "owe" | "owed";
  onClick: () => void;
}

export const WalletRelationshipCard: React.FC<WalletRelationshipCardProps> = ({
  fullName,
  profilePhoto,
  netBalance,
  type,
  onClick,
}) => {
  const formattedBalance = Math.abs(netBalance).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-[#0a0a0c] border border-white/[0.04] rounded-2xl hover:bg-white/[0.02] hover:border-white/[0.08] transition-all duration-200 text-left group cursor-pointer"
    >
      <div className="flex items-center gap-3.5">
        <UserAvatar
          src={profilePhoto}
          alt={fullName}
          size="w-10 h-10"
          className="ring-1 ring-white/10"
        />
        <div>
          <h4 className="font-display font-medium text-sm text-zinc-200 group-hover:text-white transition-colors">
            {fullName}
          </h4>
          <p className="text-[11px] font-sans text-zinc-550 mt-0.5">
            {type === "owed" ? "Owes you money" : "You owe them money"}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span
          className={`font-mono text-sm font-bold tracking-tight ${
            type === "owed" ? "text-emerald-400" : "text-[#FF6B2C]"
          }`}
        >
          {type === "owed" ? "+" : "-"}
          {formattedBalance}
        </span>
      </div>
    </button>
  );
};
