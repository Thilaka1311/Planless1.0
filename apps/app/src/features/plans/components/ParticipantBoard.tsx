import React, { useMemo, useState, useCallback } from 'react';
import { Plan, PlanMember } from '../../../core/types';
import { usePlansStore } from '../state/PlansContext';
import { useLivePlan } from '../hooks/useLivePlan';
import { ParticipantCard } from './ParticipantCard';
import { ParticipantLane } from './ParticipantLane';

interface ParticipantBoardProps {
  planId: string;
  isHostUser: boolean;
}

type SectionKey = 'going' | 'waitlist' | 'invited' | 'removed';

export const ParticipantBoard: React.FC<ParticipantBoardProps> = ({ planId, isHostUser }) => {
  const plan = useLivePlan(planId);
  useMemo(() => {
    console.log('[PLAN_DEBUG] ParticipantBoard', { planId, livePlan: plan?.id ?? null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, plan]);
  if (!plan) return null;
  const {
    getAvailableCapacity,
    moveParticipantToGoing,
    moveParticipantToWaitlist,
    moveParticipantToInvited,
    moveParticipantToRemoved,
  } = usePlansStore();

  const [draggedUserId, setDraggedUserId] = useState<string | null>(null);
  const [draggableUserId, setDraggableUserId] = useState<string | null>(null);
  const [activeDropLane, setActiveDropLane] = useState<SectionKey | null>(null);

  // Group and sort members
  const columns = useMemo(() => {
    const going: PlanMember[] = [];
    const waitlist: PlanMember[] = [];
    const invited: PlanMember[] = [];
    const removed: PlanMember[] = [];

    plan.members.forEach((m) => {
      // Exclude voluntarily left users (skipped / passed) from the board lanes entirely
      if (m.joinState === 'going') {
        going.push(m);
      } else if (m.joinState === 'waitlist') {
        waitlist.push(m);
      } else if (m.joinState === 'removed') {
        removed.push(m);
      } else if (
        m.joinState === 'delivered' ||
        m.joinState === 'seen' ||
        m.joinState === 'unanswered'
      ) {
        invited.push(m);
      }
    });

    going.sort((a, b) => {
      if (a.userId === plan.hostId) return -1;
      if (b.userId === plan.hostId) return 1;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

    waitlist.sort((a, b) => {
      const tA = (a as any).waitlistedAt ? new Date((a as any).waitlistedAt).getTime() : 0;
      const tB = (b as any).waitlistedAt ? new Date((b as any).waitlistedAt).getTime() : 0;
      return tA - tB;
    });

    return { going, waitlist, invited, removed };
  }, [plan.members, plan.hostId]);

  const { capacity, goingCount, availableSpots } = getAvailableCapacity(plan.id);

  // Relative Time Helper
  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return '';
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };

  const getStatusMetadata = useCallback((member: PlanMember, idx?: number) => {
    if (member.userId === plan.hostId) {
      return 'Organizer';
    }
    switch (member.joinState) {
      case 'going':
        return `Joined ${getRelativeTime(member.joinedAt) || 'recently'}`;
      case 'waitlist':
        return idx !== undefined ? `#${idx + 1} in waitlist` : 'Waitlisted';
      case 'delivered':
      case 'seen':
        return `Invited ${getRelativeTime(member.createdAt || member.deliveredAt) || 'recently'}`;
      case 'removed':
        return member.removedByHost ? 'Removed by Host' : 'Removed from Plan';
      default:
        return '';
    }
  }, [plan.hostId]);

  // Strict drag-and-drop validations
  const handleMove = useCallback(async (userId: string, target: SectionKey) => {
    if (userId === plan.hostId) {
      alert("The host's status is locked and cannot be changed.");
      return;
    }

    const member = plan.members.find(m => m.userId === userId);
    if (!member) return;

    const currentStatus = member.joinState;
    if (currentStatus === target) return;

    // 1. Target: GOING
    if (target === 'going') {
      if (currentStatus === 'waitlist') {
        if (capacity > 0 && availableSpots <= 0) {
          alert("Max Attendees reached.\n\nIncrease the limit before moving someone into Going.");
          return;
        }
      } else if (currentStatus === 'removed') {
        if (!member.removedByHost) {
          alert("This participant left the plan voluntarily and cannot be restored. Use + Add Guests to invite them again.");
          return;
        }
        if (capacity > 0 && availableSpots <= 0) {
          alert("Max Attendees reached. Move to Waitlist instead.");
          return;
        }
      } else {
        if (currentStatus === 'delivered' || currentStatus === 'seen' || (currentStatus as any) === 'new') {
          alert("Participants must accept the invitation themselves.");
          return;
        }
        alert("Action blocked by participant lifecycle rules.");
        return;
      }
    }

    // 2. Target: WAITLIST
    if (target === 'waitlist') {
      if (currentStatus === 'going') {
        // Allowed: Going -> Waitlist
      } else if (currentStatus === 'removed') {
        if (!member.removedByHost) {
          alert("This participant left the plan voluntarily and cannot be restored. Use + Add Guests to invite them again.");
          return;
        }
      } else {
        if (currentStatus === 'delivered' || currentStatus === 'seen' || (currentStatus as any) === 'new') {
          alert("Participants must accept the invitation themselves.");
          return;
        }
        alert("Action blocked by participant lifecycle rules.");
        return;
      }
    }

    // 3. Target: INVITED
    if (target === 'invited') {
      if (currentStatus === 'removed') {
        if (!member.removedByHost) {
          alert("This participant left the plan voluntarily and cannot be restored. Use + Add Guests to invite them again.");
          return;
        }
      } else {
        alert("Accepted participants cannot be returned to the invitation lifecycle.");
        return;
      }
    }

    // 4. Target: REMOVED
    if (target === 'removed') {
      if (currentStatus === 'skipped') {
        alert("This participant left the plan voluntarily and cannot be restored. Use + Add Guests to invite them again.");
        return;
      }
    }

    // Execute state transition
    try {
      if (target === 'going') {
        await moveParticipantToGoing(plan.id, userId);
      } else if (target === 'waitlist') {
        await moveParticipantToWaitlist(plan.id, userId);
      } else if (target === 'invited') {
        await moveParticipantToInvited(plan.id, userId);
      } else if (target === 'removed') {
        await moveParticipantToRemoved(plan.id, userId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update participant status.');
    }
  }, [plan, capacity, availableSpots, moveParticipantToGoing, moveParticipantToWaitlist, moveParticipantToInvited, moveParticipantToRemoved]);

  return (
    <div className="grid grid-cols-2 gap-4 px-4 py-2 flex-1 min-h-0">
      {/* GOING Lane */}
      <ParticipantLane
        laneKey="going"
        label="Going"
        count={capacity > 0 ? `${goingCount}/${capacity}` : `${goingCount}`}
        isHostUser={isHostUser}
        activeDropLane={activeDropLane}
        setActiveDropLane={setActiveDropLane}
        draggedUserId={draggedUserId}
        handleMove={handleMove}
        setDraggedUserId={setDraggedUserId}
      >
        {columns.going.length === 0 ? (
          <div className="py-4 text-center text-zinc-650 text-[10px] italic">Nobody confirmed.</div>
        ) : (
          columns.going.map(member => (
            <ParticipantCard
              key={member.userId}
              member={member}
              isHostUser={isHostUser}
              hostId={plan.hostId}
              draggedUserId={draggedUserId}
              draggableUserId={draggableUserId}
              setDraggedUserId={setDraggedUserId}
              setDraggableUserId={setDraggableUserId}
              handleMove={handleMove}
              setActiveDropLane={setActiveDropLane}
              getStatusMetadata={getStatusMetadata}
            />
          ))
        )}
      </ParticipantLane>

      {/* WAITLIST Lane */}
      <ParticipantLane
        laneKey="waitlist"
        label="Waitlist"
        count={columns.waitlist.length}
        isHostUser={isHostUser}
        activeDropLane={activeDropLane}
        setActiveDropLane={setActiveDropLane}
        draggedUserId={draggedUserId}
        handleMove={handleMove}
        setDraggedUserId={setDraggedUserId}
      >
        {columns.waitlist.length === 0 ? (
          <div className="py-4 text-center text-zinc-650 text-[10px] italic">No waitlisted users.</div>
        ) : (
          columns.waitlist.map((member, idx) => (
            <ParticipantCard
              key={member.userId}
              member={member}
              idx={idx}
              isHostUser={isHostUser}
              hostId={plan.hostId}
              draggedUserId={draggedUserId}
              draggableUserId={draggableUserId}
              setDraggedUserId={setDraggedUserId}
              setDraggableUserId={setDraggableUserId}
              handleMove={handleMove}
              setActiveDropLane={setActiveDropLane}
              getStatusMetadata={getStatusMetadata}
            />
          ))
        )}
      </ParticipantLane>

      {/* INVITED Lane */}
      <ParticipantLane
        laneKey="invited"
        label="Invited"
        count={columns.invited.length}
        isHostUser={isHostUser}
        activeDropLane={activeDropLane}
        setActiveDropLane={setActiveDropLane}
        draggedUserId={draggedUserId}
        handleMove={handleMove}
        setDraggedUserId={setDraggedUserId}
      >
        {columns.invited.length === 0 ? (
          <div className="py-4 text-center text-zinc-650 text-[10px] italic">No pending invites.</div>
        ) : (
          columns.invited.map(member => (
            <ParticipantCard
              key={member.userId}
              member={member}
              isHostUser={isHostUser}
              hostId={plan.hostId}
              draggedUserId={draggedUserId}
              draggableUserId={draggableUserId}
              setDraggedUserId={setDraggedUserId}
              setDraggableUserId={setDraggableUserId}
              handleMove={handleMove}
              setActiveDropLane={setActiveDropLane}
              getStatusMetadata={getStatusMetadata}
            />
          ))
        )}
      </ParticipantLane>

      {/* REMOVED Lane */}
      <ParticipantLane
        laneKey="removed"
        label="Removed"
        count={columns.removed.length}
        isHostUser={isHostUser}
        activeDropLane={activeDropLane}
        setActiveDropLane={setActiveDropLane}
        draggedUserId={draggedUserId}
        handleMove={handleMove}
        setDraggedUserId={setDraggedUserId}
      >
        {columns.removed.length === 0 ? (
          <div className="py-4 text-center text-zinc-650 text-[10px] italic">No removed users.</div>
        ) : (
          columns.removed.map(member => (
            <ParticipantCard
              key={member.userId}
              member={member}
              isHostUser={isHostUser}
              hostId={plan.hostId}
              draggedUserId={draggedUserId}
              draggableUserId={draggableUserId}
              setDraggedUserId={setDraggedUserId}
              setDraggableUserId={setDraggableUserId}
              handleMove={handleMove}
              setActiveDropLane={setActiveDropLane}
              getStatusMetadata={getStatusMetadata}
            />
          ))
        )}
      </ParticipantLane>
    </div>
  );
};
