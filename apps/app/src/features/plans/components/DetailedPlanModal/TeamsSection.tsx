import React from "react";
import { UserAvatar } from "../../../../shared/components/UserAvatar";

interface TeamsSectionProps {
  showTeams: boolean;
  isModerator: boolean;
  setShowManageTeams: (val: boolean) => void;
  teamAMembers: any[];
  teamBMembers: any[];
  unassignedMembers: any[];
  isOverlay?: boolean;
}

export const TeamsSection: React.FC<TeamsSectionProps> = ({
  showTeams,
  isModerator,
  setShowManageTeams,
  teamAMembers,
  teamBMembers,
  unassignedMembers,
  isOverlay = false,
}) => {
  if (!showTeams) return null;

  return (
    <div className={`px-6 space-y-3.5 text-left select-none ${isOverlay ? "" : "bg-zinc-905 border border-zinc-900 rounded-3xl p-5"}`}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold block">
          ⚽ Teams
        </span>
        {isModerator && (
          <button
            type="button"
            onClick={() => setShowManageTeams(true)}
            className="text-[9px] font-mono font-bold text-[#ff8b66] hover:text-[#ff9a7c] uppercase tracking-wider cursor-pointer focus:outline-none"
          >
            Manage
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        {/* Team A */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[8.5px] font-mono uppercase tracking-wider text-emerald-450 font-bold px-1">
            <span>Team A</span>
            <span>({teamAMembers.length})</span>
          </div>
          {teamAMembers.length === 0 ? (
            <div className="text-[10px] font-mono text-zinc-650 py-3 text-center bg-zinc-950/20 border border-dashed border-zinc-900 rounded-2xl">
              No players assigned
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teamAMembers.map(m => (
                <div key={m.userId} className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                  <UserAvatar src={m.avatar} alt={m.name || ""} size="w-6 h-6" className="border border-emerald-500/30" />
                  <span className="text-xs font-semibold text-zinc-200">{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team B */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[8.5px] font-mono uppercase tracking-wider text-sky-400 font-bold px-1">
            <span>Team B</span>
            <span>({teamBMembers.length})</span>
          </div>
          {teamBMembers.length === 0 ? (
            <div className="text-[10px] font-mono text-zinc-650 py-3 text-center bg-zinc-950/20 border border-dashed border-zinc-900 rounded-2xl">
              No players assigned
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teamBMembers.map(m => (
                <div key={m.userId} className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-sky-950/20 border border-sky-500/20">
                  <UserAvatar src={m.avatar} alt={m.name || ""} size="w-6 h-6" className="border border-sky-500/30" />
                  <span className="text-xs font-semibold text-zinc-200">{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unassigned */}
        {unassignedMembers.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 font-bold px-1">
              <span>Unassigned</span>
              <span>({unassignedMembers.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unassignedMembers.map(m => (
                <div key={m.userId} className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                  <UserAvatar src={m.avatar} alt={m.name || ""} size="w-6 h-6" className="border border-zinc-800" />
                  <span className="text-xs font-semibold text-zinc-200">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
