import React, { useRef } from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { PlanMember } from '../../../core/types';
import { UserAvatar } from '../../../shared/components/UserAvatar';

interface ParticipantCardProps {
  member: PlanMember;
  idx?: number;
  isHostUser: boolean;
  hostId: string;
  draggedUserId: string | null;
  draggableUserId: string | null;
  setDraggedUserId: (id: string | null) => void;
  setDraggableUserId: (id: string | null) => void;
  handleMove: (userId: string, target: 'going' | 'waitlist' | 'invited' | 'removed') => void;
  setActiveDropLane: (lane: 'going' | 'waitlist' | 'invited' | 'removed' | null) => void;
  getStatusMetadata: (member: PlanMember, idx?: number) => string;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = React.memo(({
  member,
  idx,
  isHostUser,
  hostId,
  draggedUserId,
  draggableUserId,
  setDraggedUserId,
  setDraggableUserId,
  handleMove,
  setActiveDropLane,
  getStatusMetadata,
}) => {
  const isHost = member.userId === hostId;
  const touchTimeoutRef = useRef<any>(null);

  const handlePressStart = () => {
    if (isHostUser && !isHost) {
      touchTimeoutRef.current = setTimeout(() => {
        setDraggableUserId(member.userId);
      }, 200); // 200ms Long Press
    }
  };

  const handlePressEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    setDraggableUserId(null);
  };

  return (
    <motion.div
      layout
      layoutId={`card-${member.userId}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      draggable={isHostUser && !isHost && draggableUserId === member.userId}
      onDragStart={(e) => {
        setDraggedUserId(member.userId);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => {
        setDraggedUserId(null);
        setDraggableUserId(null);
        setActiveDropLane(null);
      }}
      onTouchStart={handlePressStart}
      onTouchMove={(e) => {
        if (draggableUserId !== member.userId) return;
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const lane = element?.closest('[data-lane]')?.getAttribute('data-lane') as 'going' | 'waitlist' | 'invited' | 'removed' | null;
        setActiveDropLane(lane);
      }}
      onTouchEnd={(e) => {
        handlePressEnd();
        if (draggableUserId !== member.userId) return;
        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const lane = element?.closest('[data-lane]')?.getAttribute('data-lane') as 'going' | 'waitlist' | 'invited' | 'removed' | null;
        if (lane) {
          handleMove(member.userId, lane);
        }
        setDraggedUserId(null);
        setActiveDropLane(null);
      }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      className={`mb-2 rounded-xl p-2 flex items-center gap-2 select-none transition-all duration-200 ${
        isHost
          ? 'bg-[#FF6B2C]/[0.03] border border-[#FF6B2C]/10 cursor-default'
          : isHostUser
          ? draggableUserId === member.userId
            ? 'bg-white/[0.04] border border-white/10 scale-[1.03] shadow-2xl opacity-95 cursor-grabbing'
            : 'bg-white/[0.015] border border-white/[0.04] cursor-grab hover:bg-white/[0.03] hover:border-white/[0.08]'
          : 'bg-white/[0.015] border border-white/[0.04] cursor-default'
      } ${draggedUserId === member.userId ? 'opacity-30 scale-95 border-dashed border-[#FF6B2C]/40' : ''}`}
    >
      {/* Drag handle affordance (only for hosts) */}
      {isHostUser && !isHost && (
        <div className="text-zinc-600 flex-shrink-0 flex items-center justify-center font-mono font-bold text-xs tracking-tighter select-none pr-0.5">
          ⋮⋮
        </div>
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <UserAvatar
          src={member.avatar}
          alt={member.name}
          size="w-7 h-7"
          className={`border ${isHost ? 'border-[#FF6B2C]/40' : 'border-white/10'}`}
        />
        {isHost && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#FF6B2C] rounded-full flex items-center justify-center">
            <Shield className="w-2 h-2 text-white" />
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-white truncate">{member.name}</span>
          {isHost && (
            <span className="px-1 py-0.2 rounded text-[6.5px] font-mono font-black bg-[#FF6B2C] text-white uppercase tracking-wider">
              HOST
            </span>
          )}
        </div>
        <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider mt-0.5 inline-block text-zinc-500">
          {getStatusMetadata(member, idx)}
        </span>
      </div>
    </motion.div>
  );
});
ParticipantCard.displayName = 'ParticipantCard';
