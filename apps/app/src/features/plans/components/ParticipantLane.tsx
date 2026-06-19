import React from 'react';

interface ParticipantLaneProps {
  laneKey: 'going' | 'waitlist' | 'invited' | 'removed';
  label: string;
  count: string | number;
  isHostUser: boolean;
  activeDropLane: 'going' | 'waitlist' | 'invited' | 'removed' | null;
  setActiveDropLane: (lane: 'going' | 'waitlist' | 'invited' | 'removed' | null) => void;
  draggedUserId: string | null;
  handleMove: (userId: string, target: 'going' | 'waitlist' | 'invited' | 'removed') => void;
  setDraggedUserId: (id: string | null) => void;
  children: React.ReactNode;
}

export const ParticipantLane: React.FC<ParticipantLaneProps> = ({
  laneKey,
  label,
  count,
  isHostUser,
  activeDropLane,
  setActiveDropLane,
  draggedUserId,
  handleMove,
  setDraggedUserId,
  children,
}) => {
  const isTargeted = activeDropLane === laneKey;

  return (
    <div
      data-lane={laneKey}
      onDragOver={(e) => {
        if (isHostUser) {
          e.preventDefault();
          setActiveDropLane(laneKey);
        }
      }}
      onDragLeave={() => {
        if (isTargeted) setActiveDropLane(null);
      }}
      onDrop={(e) => {
        if (isHostUser && draggedUserId) {
          handleMove(draggedUserId, laneKey);
        }
        setDraggedUserId(null);
        setActiveDropLane(null);
      }}
      className={`flex flex-col h-full min-h-[140px] rounded-xl p-2.5 transition-all duration-200 border text-left ${
        isTargeted
          ? 'bg-white/[0.03] border-white/20 ring-1 ring-white/10'
          : 'bg-white/[0.008] border-white/[0.02]'
      }`}
    >
      {/* Lane Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/[0.03] select-none">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">
          {label} ({count})
        </span>
      </div>

      {/* Cards container */}
      <div className="flex-1 overflow-y-auto scrollbar-none space-y-1">
        {children}
      </div>
    </div>
  );
};
