import React, { useCallback } from 'react';
import { ParticipantManagementScreen, Friend } from '../../../participants/screens/ParticipantManagementScreen';
import { Plan, UserProfile } from '../../../../core/types';
import { normalizeStatus } from '../../../../../lib/participantStatus';
import { formatPlanDate } from '../../../../../lib/mappers';
import { useToast } from '../../../../shared/contexts/ToastContext';

interface PlanParticipantManagementWrapperProps {
  plan: Plan;
  userProfile: UserProfile;
  activeUserId?: string;
  isHost: boolean;
  onBack: () => void;
  // Store actions passed in so this wrapper stays store-agnostic
  onMoveToGoing: (planId: string, userId: string) => Promise<void>;
  onMoveToWaitlist: (planId: string, userId: string) => Promise<void>;
  onMoveToInvited: (planId: string, userId: string) => Promise<void>;
  onRemoveParticipant: (planId: string, userId: string) => Promise<void>;
  onChangePlanHost: (planId: string, newHostId: string, currentHostId: string) => Promise<void>;
}

/** Maps a plan member to the shared Friend shape */
function memberToFriend(m: any, hostId: string): Friend {
  return {
    id: m.userId || m.userUuid || m.user_id || m.id,
    dbUuid: m.userUuid || m.userId || m.user_id || m.id,
    name: m.name || m.displayName || 'Unknown',
    avatar:
      m.avatar ||
      m.profile_photo ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name || 'U')}`,
    isHost: (m.userId || m.userUuid || m.user_id || m.id) === hostId,
  };
}

export const PlanParticipantManagementWrapper: React.FC<PlanParticipantManagementWrapperProps> = ({
  plan,
  userProfile,
  activeUserId,
  isHost,
  onBack,
  onMoveToGoing,
  onMoveToWaitlist,
  onMoveToInvited,
  onRemoveParticipant,
  onChangePlanHost,
}) => {
  const { showToast } = useToast();
  const hostId = plan.hostId || '';

  // Group plan members by status
  const members: any[] = plan.members || [];
  const goingList: Friend[] = members
    .filter((m) => normalizeStatus(m.joinState) === 'JOINED')
    .map((m) => memberToFriend(m, hostId));
  const waitlistList: Friend[] = members
    .filter((m) => normalizeStatus(m.joinState) === 'WAITLISTED')
    .map((m) => memberToFriend(m, hostId));
  const invitedList: Friend[] = members
    .filter((m) => normalizeStatus(m.joinState) === 'INVITED')
    .map((m) => memberToFriend(m, hostId));

  const capacity = plan.joinLimit || plan.capacity || 0;

  // Formatted event date/time for header popover
  const eventDateObj = plan.datetime ? new Date(plan.datetime) : null;
  const formattedDate = eventDateObj
    ? eventDateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
    : undefined;
  const formattedTime = eventDateObj
    ? eventDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : undefined;

  // ── Callbacks bridging to plan store ──
  const handleMoveToGoing = useCallback(
    async (friend: Friend) => {
      try {
        await onMoveToGoing(plan.id, friend.dbUuid);
      } catch {
        showToast('Failed to move participant');
      }
    },
    [plan.id, onMoveToGoing, showToast],
  );

  const handleMoveToWaitlist = useCallback(
    async (friend: Friend) => {
      try {
        await onMoveToWaitlist(plan.id, friend.dbUuid);
      } catch {
        showToast('Failed to move participant');
      }
    },
    [plan.id, onMoveToWaitlist, showToast],
  );

  const handleRemoveParticipant = useCallback(
    async (friend: Friend) => {
      try {
        await onRemoveParticipant(plan.id, friend.dbUuid);
        showToast(`✓ Removed ${friend.name}`);
      } catch {
        showToast('Failed to remove participant');
      }
    },
    [plan.id, onRemoveParticipant, showToast],
  );

  const handlePromoteHost = useCallback(
    async (friend: Friend) => {
      const currentHostId = activeUserId || userProfile.dbUuid || '';
      if (!currentHostId) return;
      try {
        await onChangePlanHost(plan.id, friend.dbUuid, currentHostId);
        showToast(`✓ ${friend.name} is now the host`);
        onBack();
      } catch {
        showToast('Failed to transfer host');
      }
    },
    [plan.id, activeUserId, userProfile.dbUuid, onChangePlanHost, onBack, showToast],
  );

  return (
    <ParticipantManagementScreen
      title="Participants"
      subtitle={plan.title}
      category={plan.category || 'custom'}
      eventDate={formattedDate}
      eventTime={formattedTime}
      capacity={capacity}
      mode="editor"
      isHostUser={isHost}
      externalGoingList={goingList}
      externalWaitlist={waitlistList}
      externalInvitedList={invitedList}
      onBack={onBack}
      onMoveToGoing={isHost ? handleMoveToGoing : undefined}
      onMoveToWaitlist={isHost ? handleMoveToWaitlist : undefined}
      onRemoveParticipant={isHost ? handleRemoveParticipant : undefined}
      onPromoteHost={isHost ? handlePromoteHost : undefined}
    />
  );
};
