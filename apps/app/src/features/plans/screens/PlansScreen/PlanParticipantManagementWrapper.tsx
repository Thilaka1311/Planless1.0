import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { ParticipantManagementScreen, Friend } from '../../../participants/screens/ParticipantManagementScreen';
import { Plan, UserProfile } from '../../../../core/types';
import { normalizeStatus } from '../../../../../lib/participantStatus';
import { useToast } from '../../../../shared/contexts/ToastContext';
import { StepWho } from '../../../create/components/FriendsSelector';
import { useProfileStore } from '../../../profile/state/ProfileContext';
import { useCirclesStore } from '../../../circles/state/CirclesContext';
import { useFriendshipStore } from '../../../friendships/state/FriendshipContext';
import { X } from 'lucide-react';

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
  onUpdatePlanCapacity?: (planId: string, capacity: number) => Promise<void> | void;
  onAddParticipants?: (planId: string, userIds: string[], circleIds: string[]) => Promise<void>;
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
  onUpdatePlanCapacity,
  onAddParticipants,
}) => {
  const { dbUsers } = useProfileStore();
  const { circles } = useCirclesStore();
  const { friends } = useFriendshipStore();
  const { showToast } = useToast();
  const hostId = plan.hostId || '';
  const members: any[] = plan.members || [];

  // Determine active members (excluding host) to filter them out of the picker
  const activeMembers = useMemo(() => {
    return members.filter((m) => {
      const status = normalizeStatus(m.joinState);
      return status === 'JOINED' || status === 'WAITLISTED' || status === 'INVITED';
    });
  }, [members]);

  const disabledUserIds = useMemo(() => {
    return new Set(activeMembers.map((m) => m.userId || m.userUuid || m.user_id || m.id));
  }, [activeMembers]);

  const [showAddFriendsPicker, setShowAddFriendsPicker] = useState(false);
  const [searchPeopleQuery, setSearchPeopleQuery] = useState('');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [individuallySelectedFriendIds, setIndividuallySelectedFriendIds] = useState<string[]>([]);
  const [pickerSelectedFriends, setPickerSelectedFriends] = useState<any[]>([]);

  // Compute set of user IDs belonging to selected circles
  const selectedCircleMemberUserIds = useMemo(() => {
    const set = new Set<string>();
    selectedCircles.forEach((circleId) => {
      const circleObj = circles.find((c) => c.id === circleId);
      if (circleObj && circleObj.membersList) {
        circleObj.membersList.forEach((m) => {
          if (m.userId) set.add(m.userId);
        });
      }
    });
    return set;
  }, [selectedCircles, circles]);

  // Sync pickerSelectedFriends
  useEffect(() => {
    const circleMemberUserIds = new Set<string>();
    selectedCircles.forEach((circleId) => {
      const circleObj = circles.find((c) => c.id === circleId);
      if (circleObj && circleObj.membersList) {
        circleObj.membersList.forEach((m) => {
          if (m.userId && m.userId !== userProfile?.dbUuid) {
            circleMemberUserIds.add(m.userId);
          }
        });
      }
    });

    const uniqueIds = Array.from(new Set([
      ...individuallySelectedFriendIds,
      ...Array.from(circleMemberUserIds)
    ]));

    const mapped = uniqueIds.map((id) => {
      const u = dbUsers.find((user) => user.id === id || (user as any).dbUuid === id);
      if (!u) return null;
      return {
        id: u.id,
        dbUuid: u.id,
        name: u.full_name,
        avatar: u.profile_photo || (u as any).profile_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.full_name)}`
      };
    }).filter(Boolean);

    setPickerSelectedFriends(mapped);
  }, [selectedCircles, individuallySelectedFriendIds, circles, dbUsers, userProfile]);

  const AVAILABLE_CIRCLES = useMemo(() => {
    return circles.map((c) => ({
      id: c.id,
      name: c.name,
      membersCount: c.membersCount,
      groupImage: c.groupImage,
      emoji: c.category === 'sports' ? '⚽' : '🔥'
    }));
  }, [circles]);

  const AVAILABLE_FRIENDS = useMemo(() => {
    const myUuid = userProfile?.dbUuid;
    if (!myUuid) return [];

    const seenIds = new Set<string>();
    return dbUsers
      .filter((u) => u.id !== userProfile?.dbUuid && !disabledUserIds.has(u.id))
      .filter((u) => u.id && !selectedCircleMemberUserIds.has(u.id))
      .filter((u) => {
        const targetUuid = u.id;
        if (!targetUuid) return false;
        return friends.some(f => f.friend?.id === targetUuid);
      })
      .filter((u) => {
        if (!u.id || seenIds.has(u.id)) return false;
        seenIds.add(u.id);
        return true;
      })
      .map((u) => ({
        id: u.id || "",
        dbUuid: u.id,
        name: u.full_name,
        avatar: u.profile_photo || (u as any).profile_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.full_name)}`
      }));
  }, [dbUsers, userProfile, selectedCircleMemberUserIds, friends, disabledUserIds]);

  const toggleCircleSelection = useCallback((circleId: string) => {
    setSelectedCircles((prev) =>
      prev.includes(circleId) ? prev.filter((id) => id !== circleId) : [...prev, circleId]
    );
  }, []);

  const toggleFriendSelection = useCallback((friend: any) => {
    setIndividuallySelectedFriendIds((prev) =>
      prev.includes(friend.id) ? prev.filter((id) => id !== friend.id) : [...prev, friend.id]
    );
  }, []);

  const handleRemoveSelectedItem = useCallback((item: { id: string; type: 'circle' | 'friend'; name: string }) => {
    if (item.type === 'circle') {
      setSelectedCircles((prev) => prev.filter((id) => id !== item.id));
    } else {
      setIndividuallySelectedFriendIds((prev) => prev.filter((id) => id !== item.id));
    }
  }, []);

  const selectedItems = useMemo(() => {
    const items: any[] = [];
    selectedCircles.forEach((circleId) => {
      const c = AVAILABLE_CIRCLES.find(x => x.id === circleId);
      if (c) {
        items.push({
          id: c.id,
          type: 'circle',
          name: c.name,
          displayName: c.name,
          groupImage: c.groupImage,
          emoji: c.emoji
        });
      }
    });
    individuallySelectedFriendIds.forEach((friendId) => {
      if (selectedCircleMemberUserIds.has(friendId)) return;
      const u = dbUsers.find(x => x.id === friendId);
      if (u) {
        items.push({
          id: u.id,
          type: 'friend',
          name: u.full_name,
          avatar: u.profile_photo || (u as any).profile_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.full_name)}`
        });
      }
    });
    return items;
  }, [selectedCircles, individuallySelectedFriendIds, AVAILABLE_CIRCLES, dbUsers, selectedCircleMemberUserIds]);

  const unifiedSearchResults = useMemo(() => {
    const query = searchPeopleQuery.toLowerCase().trim();
    const recentFriends = AVAILABLE_FRIENDS.slice(0, 3);
    const recentCircles = AVAILABLE_CIRCLES.slice(0, 2);

    const matchedFriends = AVAILABLE_FRIENDS.filter(f =>
      f.name.toLowerCase().includes(query)
    );
    const matchedCircles = AVAILABLE_CIRCLES.filter(c =>
      (c.name || '').toLowerCase().includes(query)
    );

    const results: any[] = [];
    if (query === '') {
      recentFriends.forEach(f => {
        results.push({ id: f.id, type: 'recent', name: f.name, avatar: f.avatar, rawFriend: f });
      });
      recentCircles.forEach(c => {
        results.push({ id: c.id, type: 'recent', name: c.name, emoji: c.emoji, membersCount: c.membersCount, rawCircle: c });
      });
    } else {
      matchedFriends.forEach(f => {
        results.push({ id: f.id, type: 'friend', name: f.name, avatar: f.avatar, rawFriend: f });
      });
      matchedCircles.forEach(c => {
        results.push({ id: c.id, type: 'circle', name: c.name, emoji: c.emoji, membersCount: c.membersCount, rawCircle: c });
      });
    }
    return results;
  }, [searchPeopleQuery, AVAILABLE_FRIENDS, AVAILABLE_CIRCLES]);



  const handleConfirmInvite = async () => {
    if (onAddParticipants) {
      const friendIds = individuallySelectedFriendIds.filter(id => !disabledUserIds.has(id));
      await onAddParticipants(plan.id, friendIds, selectedCircles);
      showToast('✓ Invitations sent');
      setShowAddFriendsPicker(false);
      // Reset picker selection
      setSearchPeopleQuery('');
      setSelectedCircles([]);
      setIndividuallySelectedFriendIds([]);
    }
  };

  // Group plan members by status
  const hostMember = members.find((m) => (m.userId || m.userUuid || m.user_id || m.id) === hostId) || (isHost ? {
    userId: hostId,
    name: userProfile.name || 'You',
    avatar: userProfile.avatar || userProfile.profile_photo,
    joinState: 'JOINED',
  } : null);

  // Extract non-host members
  const nonHostMembers = members.filter((m) => (m.userId || m.userUuid || m.user_id || m.id) !== hostId);

  // Separate active non-host members and sort by acceptance order (responded_at ASC)
  const activeNonHostMembers = nonHostMembers
    .filter((m) => {
      const status = normalizeStatus(m.joinState);
      return status === 'JOINED' || status === 'WAITLISTED';
    })
    .sort((a, b) => {
      const timeA = a.respondedAt ? new Date(a.respondedAt).getTime() : (a.responded_at ? new Date(a.responded_at).getTime() : 0);
      const timeB = b.respondedAt ? new Date(b.respondedAt).getTime() : (b.responded_at ? new Date(b.responded_at).getTime() : 0);
      return timeA - timeB;
    });

  const invitedList: Friend[] = nonHostMembers
    .filter((m) => normalizeStatus(m.joinState) === 'INVITED')
    .map((m) => memberToFriend(m, hostId));

  // Determine capacity bounds
  const storedCapacity = plan.joinLimit || plan.capacity || 2;
  const maxCapacity = Math.max(2, 1 + nonHostMembers.length);
  const capacity = Math.min(maxCapacity, Math.max(2, storedCapacity));

  // Auto-sync database capacity if bounds clamped it
  useEffect(() => {
    if (capacity !== storedCapacity && onUpdatePlanCapacity) {
      onUpdatePlanCapacity(plan.id, capacity);
    }
  }, [capacity, storedCapacity, plan.id, onUpdatePlanCapacity]);

  // Distribute active members into Going and Waitlist based on capacity
  const goingNonHost = activeNonHostMembers.slice(0, capacity - 1);
  const waitlistNonHost = activeNonHostMembers.slice(capacity - 1);

  const goingList: Friend[] = [
    ...(hostMember ? [memberToFriend(hostMember, hostId)] : []),
    ...goingNonHost.map((m) => memberToFriend(m, hostId)),
  ];

  const waitlistList: Friend[] = waitlistNonHost.map((m) => memberToFriend(m, hostId));

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

  const handleAdjustCapacity = useCallback(
    async (newVal: number) => {
      const clampedVal = Math.min(maxCapacity, Math.max(2, newVal));
      if (clampedVal !== capacity && onUpdatePlanCapacity) {
        await onUpdatePlanCapacity(plan.id, clampedVal);
      }
    },
    [plan.id, capacity, maxCapacity, onUpdatePlanCapacity]
  );

  return (
    <>
      <ParticipantManagementScreen
        title="Participants"
        subtitle={plan.title}
        category={plan.category || 'custom'}
        eventDate={formattedDate}
        eventTime={formattedTime}
        capacity={capacity}
        maxCapacity={maxCapacity}
        mode="editor"
        isHostUser={isHost}
        externalGoingList={goingList}
        externalWaitlist={waitlistList}
        externalInvitedList={invitedList}
        onBack={onBack}
        onAdjustCapacity={isHost ? handleAdjustCapacity : undefined}
        onRemoveParticipant={isHost ? handleRemoveParticipant : undefined}
        onPromoteHost={isHost ? handlePromoteHost : undefined}
        onAddFriends={isHost ? () => setShowAddFriendsPicker(true) : undefined}
      />

      {showAddFriendsPicker && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 overflow-y-auto pb-24">
            <StepWho
              searchPeopleQuery={searchPeopleQuery}
              setSearchPeopleQuery={setSearchPeopleQuery}
              selectedCircles={selectedCircles}
              toggleCircleSelection={toggleCircleSelection}
              selectedFriends={pickerSelectedFriends}
              toggleFriendSelection={toggleFriendSelection}
              waitlistEnabled={false}
              setWaitlistEnabled={() => { }}
              waitlistCapacity={0}
              setWaitlistCapacity={() => { }}
              totalInvitedCount={pickerSelectedFriends.length}
              selectedItems={selectedItems}
              handleRemoveSelectedItem={handleRemoveSelectedItem}
              unifiedSearchResults={unifiedSearchResults}
              AVAILABLE_CIRCLES={AVAILABLE_CIRCLES}
              setCustomizerStep={handleConfirmInvite}
              disabledUserIds={disabledUserIds}
              confirmLabel="Send invites"
              onConfirmEdit={handleConfirmInvite}
              hideCapacity={true}
              hideConfirmButton={false}
              isHostSelected={false}
            />
          </div>
          <div className="absolute top-4 left-4 z-[60]">
            <button
              type="button"
              onClick={() => setShowAddFriendsPicker(false)}
              className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
