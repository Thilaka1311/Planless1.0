import { useState, useEffect, useMemo, useCallback } from "react";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { useCirclesStore } from "../../circles/state/CirclesContext";
import { normalizeFriendshipUsers } from "../../friendships/utils/normalize";

export function useCreatePlanForm() {
  const { userProfile, dbUsers, dbFriendships } = useProfileStore();
  const { circles } = useCirclesStore();
  const activeUserId = userProfile?.dbUuid || "";

  // Form inputs
  const [localLocation, setLocalLocation] = useState('');
  const [eventDateTime, setEventDateTime] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getTime() + 60 * 60 * 1000);
  });
  const [searchPeopleQuery, setSearchPeopleQuery] = useState('');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [individuallySelectedFriendIds, setIndividuallySelectedFriendIds] = useState<string[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [totalCapacity, setTotalCapacity] = useState(1);
  const [isCapacityManuallySet, setIsCapacityManuallySet] = useState(false);
  const [rsvpDeadline, setRsvpDeadline] = useState('1 hour before');
  const [customDeadline, setCustomDeadline] = useState<Date>(() => {
    return new Date();
  });
  const [costAmount, setCostAmount] = useState(0);
  const [quickNote, setQuickNote] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCoverImage, setCustomCoverImage] = useState<string | null>(null);

  // Relational data mappings
  const AVAILABLE_CIRCLES = useMemo(() => {
    return circles.map((c) => ({
      id: c.id,
      name: c.name,
      membersCount: c.membersCount,
      groupImage: c.groupImage,
      emoji: c.category === 'sports' ? '⚽' : '🔥'
    }));
  }, [circles]);

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

  // Sync selectedFriends whenever selectedCircles, individuallySelectedFriendIds, circles, or dbUsers changes
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

    setSelectedFriends(mapped);
  }, [selectedCircles, individuallySelectedFriendIds, circles, dbUsers, userProfile]);

  const AVAILABLE_FRIENDS = useMemo(() => {
    const myUuid = userProfile?.dbUuid;
    if (!myUuid) return [];

    const seenIds = new Set<string>();
    return dbUsers
      .filter((u) => u.id !== userProfile?.dbUuid)
      .filter((u) => u.id && !selectedCircleMemberUserIds.has(u.id))
      .filter((u) => {
        const targetUuid = u.id;
        if (!targetUuid) return false;
        const normalized = normalizeFriendshipUsers(myUuid, targetUuid);
        return dbFriendships.some(f => 
          f.user_1_id === normalized.user_1_id && 
          f.user_2_id === normalized.user_2_id && 
          f.status === "ACCEPTED"
        );
      })
      .filter((u) => {
        // Deduplicate by UUID — guard against duplicate dbUsers entries
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
  }, [dbUsers, userProfile, selectedCircleMemberUserIds, dbFriendships]);

  const totalInvitedCount = selectedFriends.length;

  // Sync total capacity (which includes the host) dynamically when invited count changes
  useEffect(() => {
    if (!isCapacityManuallySet) {
      setTotalCapacity(totalInvitedCount + 1);
    } else {
      if (totalCapacity > totalInvitedCount + 1 && totalInvitedCount > 0) {
        setTotalCapacity(totalInvitedCount + 1);
      }
    }
  }, [totalInvitedCount, isCapacityManuallySet, totalCapacity]);

  // Derived: waitlistCapacity is the non-host capacity
  const waitlistCapacity = Math.max(1, totalCapacity - 1);

  const handleSetTotalCapacity = useCallback((val: number) => {
    // totalCapacity includes host: minimum 1, maximum totalInvitedCount + 1
    const max = totalInvitedCount > 0 ? totalInvitedCount + 1 : 999;
    const boundedVal = Math.max(1, Math.min(val, max));
    setTotalCapacity(boundedVal);
    setIsCapacityManuallySet(true);
  }, [totalInvitedCount]);

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
    const items: { id: string; type: 'circle' | 'friend'; name: string; avatar?: string; emoji?: string }[] = [];
    selectedCircles.forEach((circleId) => {
      const c = AVAILABLE_CIRCLES.find(x => x.id === circleId);
      if (c) {
        items.push({ id: c.id, type: 'circle', name: c.name, emoji: c.emoji });
      }
    });
    selectedFriends.forEach((f) => {
      items.push({ id: f.id, type: 'friend', name: f.name, avatar: f.avatar });
    });
    return items;
  }, [selectedCircles, selectedFriends, AVAILABLE_CIRCLES]);

  const unifiedSearchResults = useMemo(() => {
    const query = searchPeopleQuery.toLowerCase().trim();

    // --- Recents pool: top 3 friends + top 2 circles ---
    const recentFriends = AVAILABLE_FRIENDS.slice(0, 3);
    const recentCircles = AVAILABLE_CIRCLES.slice(0, 2);
    const recentFriendIds = new Set(recentFriends.map(f => f.id));

    // --- Filtered matches ---
    const matchedFriends = AVAILABLE_FRIENDS.filter(f =>
      f.name.toLowerCase().includes(query)
    );
    const matchedCircles = AVAILABLE_CIRCLES.filter(c =>
      (c.name || '').toLowerCase().includes(query)
    );

    const results: { id: string; type: 'circle' | 'friend' | 'recent'; name: string; avatar?: string; emoji?: string; membersCount?: number; image?: string; rawFriend?: any; rawCircle?: any }[] = [];

    if (query === '') {
      // Show recent friends
      recentFriends.forEach(f => {
        results.push({ id: f.id, type: 'recent', name: f.name, avatar: f.avatar, rawFriend: f });
      });
      // Show recent circles
      recentCircles.forEach(c => {
        results.push({ id: c.id, type: 'recent', name: c.name, emoji: c.emoji, membersCount: c.membersCount, rawCircle: c });
      });
      // Remaining friends not already shown as recents
      matchedFriends.forEach(f => {
        if (!recentFriendIds.has(f.id)) {
          results.push({ id: f.id, type: 'friend', name: f.name, avatar: f.avatar, rawFriend: f });
        }
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
  }, [AVAILABLE_FRIENDS, AVAILABLE_CIRCLES, searchPeopleQuery]);


  const resetForm = useCallback(() => {
    setLocalTitle('');
    setLocalLocation('');
    const now = new Date();
    setEventDateTime(new Date(now.getTime() + 60 * 60 * 1000));
    setCustomDeadline(new Date(now.getTime()));
    setSelectedCircles([]);
    setIndividuallySelectedFriendIds([]);
    setWaitlistEnabled(false);
    setTotalCapacity(1);
    setIsCapacityManuallySet(false);
    setRsvpDeadline('1 hour before');
    setCostAmount(0);
    setQuickNote('');
    setCustomCoverImage(null);
  }, []);

  return {
    localLocation, setLocalLocation,
    eventDateTime, setEventDateTime,
    searchPeopleQuery, setSearchPeopleQuery,
    selectedCircles, setSelectedCircles,
    selectedFriends, setSelectedFriends,
    waitlistEnabled, setWaitlistEnabled,
    waitlistCapacity, setWaitlistCapacity: handleSetTotalCapacity,
    rsvpDeadline, setRsvpDeadline,
    // totalCapacity exposes the setter which triggers manually set capacity state
    totalCapacity, setTotalCapacity: handleSetTotalCapacity,
    customDeadline, setCustomDeadline,
    costAmount, setCostAmount,
    quickNote, setQuickNote,
    localTitle, setLocalTitle,
    isSubmitting, setIsSubmitting,
    customCoverImage, setCustomCoverImage,
    AVAILABLE_CIRCLES,
    AVAILABLE_FRIENDS,
    totalInvitedCount,
    toggleCircleSelection,
    toggleFriendSelection,
    handleRemoveSelectedItem,
    selectedItems,
    unifiedSearchResults,
    resetForm,
    userProfile,
    dbUsers,
    activeUserId
  };
}
