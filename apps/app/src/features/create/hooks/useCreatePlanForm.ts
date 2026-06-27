import { useState, useEffect, useMemo, useCallback } from "react";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { useCirclesStore } from "../../circles/state/CirclesContext";

export function useCreatePlanForm() {
  const { userProfile, dbUsers } = useProfileStore();
  const { circles } = useCirclesStore();
  const activeUserId = userProfile?.user_id || "U001";

  // Form inputs
  const [localLocation, setLocalLocation] = useState('');
  const [eventDateTime, setEventDateTime] = useState<Date>(() => {
    const now = new Date();
    const nextHour = (now.getHours() + 1) % 24;
    const defaultDate = new Date();
    // If it wrapped to next day, increment the date
    if (nextHour < now.getHours()) {
      defaultDate.setDate(defaultDate.getDate() + 1);
    }
    defaultDate.setHours(nextHour, 0, 0, 0);
    return defaultDate;
  });
  const [searchPeopleQuery, setSearchPeopleQuery] = useState('');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [waitlistCapacity, setWaitlistCapacity] = useState(1);
  const [isCapacityManuallySet, setIsCapacityManuallySet] = useState(false);
  const [rsvpDeadline, setRsvpDeadline] = useState('1 hour before');
  const [customDeadline, setCustomDeadline] = useState<Date>(() => {
    const now = new Date();
    // default to 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  });
  const [costAmount, setCostAmount] = useState(0);
  const [quickNote, setQuickNote] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Relational data mappings
  const AVAILABLE_CIRCLES = useMemo(() => {
    return circles.map((c) => ({
      id: c.id,
      name: c.name,
      membersCount: c.membersCount,
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

  // Deselect selected friends that are already covered by selected circles
  useEffect(() => {
    if (selectedCircleMemberUserIds.size > 0) {
      setSelectedFriends((prev) => prev.filter((f) => {
        return !selectedCircleMemberUserIds.has(f.id) && !selectedCircleMemberUserIds.has(f.dbUuid);
      }));
    }
  }, [selectedCircleMemberUserIds]);

  const AVAILABLE_FRIENDS = useMemo(() => {
    return dbUsers
      .filter((u) => u.id !== userProfile?.dbUuid && u.user_id !== userProfile?.user_id)
      .filter((u) => !selectedCircleMemberUserIds.has(u.user_id) && !selectedCircleMemberUserIds.has(u.id))
      .map((u) => ({
        id: u.user_id,
        dbUuid: u.id,
        name: u.full_name,
        avatar: u.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.full_name)}`
      }));
  }, [dbUsers, userProfile, selectedCircleMemberUserIds]);

  const selectedCirclesCount = useMemo(() => {
    return selectedCircles.reduce((sum, circleId) => {
      const circle = AVAILABLE_CIRCLES.find(c => c.id === circleId);
      return sum + (circle ? circle.membersCount : 0);
    }, 0);
  }, [selectedCircles, AVAILABLE_CIRCLES]);

  const totalInvitedCount = selectedCirclesCount + selectedFriends.length;

  // Sync available spots dynamically when invited count changes
  useEffect(() => {
    if (!isCapacityManuallySet) {
      setWaitlistCapacity(Math.max(1, totalInvitedCount));
    } else {
      // Constraints: capacity cannot exceed total invited count
      if (waitlistCapacity > totalInvitedCount && totalInvitedCount > 0) {
        setWaitlistCapacity(totalInvitedCount);
      }
    }
  }, [totalInvitedCount, isCapacityManuallySet, waitlistCapacity]);

  const handleSetWaitlistCapacity = useCallback((val: number) => {
    // Constraint: cannot exceed total invited count, cannot be less than 1
    const boundedVal = Math.max(1, Math.min(val, totalInvitedCount));
    setWaitlistCapacity(boundedVal);
    setIsCapacityManuallySet(true);
  }, [totalInvitedCount]);

  const toggleCircleSelection = useCallback((circleId: string) => {
    setSelectedCircles((prev) =>
      prev.includes(circleId) ? prev.filter((id) => id !== circleId) : [...prev, circleId]
    );
  }, []);

  const toggleFriendSelection = useCallback((friend: any) => {
    setSelectedFriends((prev) =>
      prev.some((f) => f.id === friend.id) ? prev.filter((f) => f.id !== friend.id) : [...prev, friend]
    );
  }, []);

  const handleRemoveSelectedItem = useCallback((item: { id: string; type: 'circle' | 'friend'; name: string }) => {
    if (item.type === 'circle') {
      setSelectedCircles((prev) => prev.filter((id) => id !== item.id));
    } else {
      setSelectedFriends((prev) => prev.filter((f) => f.id !== item.id));
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
    const recentInvites = AVAILABLE_FRIENDS.slice(0, 3);
    
    const matchedFriends = AVAILABLE_FRIENDS.filter(f => 
      f.name.toLowerCase().includes(query)
    );
    
    const results: { id: string; type: 'circle' | 'friend' | 'recent'; name: string; avatar?: string; emoji?: string; membersCount?: number; rawFriend?: any }[] = [];
    
    if (query === '') {
      recentInvites.forEach(f => {
        results.push({ id: f.id, type: 'recent', name: f.name, avatar: f.avatar, rawFriend: f });
      });
      matchedFriends.forEach(f => {
        results.push({ id: f.id, type: 'friend', name: f.name, avatar: f.avatar, rawFriend: f });
      });
    } else {
      matchedFriends.forEach(f => {
        results.push({ id: f.id, type: 'friend', name: f.name, avatar: f.avatar, rawFriend: f });
      });
    }
    
    return results;
  }, [AVAILABLE_FRIENDS, searchPeopleQuery]);

  const resetForm = useCallback(() => {
    setLocalTitle('');
    setLocalLocation('');
    const now = new Date();
    const nextHour = (now.getHours() + 1) % 24;
    const defaultDate = new Date();
    if (nextHour < now.getHours()) {
      defaultDate.setDate(defaultDate.getDate() + 1);
    }
    defaultDate.setHours(nextHour, 0, 0, 0);
    setEventDateTime(defaultDate);
    setCustomDeadline(new Date(now.getTime() + 60 * 60 * 1000));
    setSelectedCircles([]);
    setSelectedFriends([]);
    setWaitlistEnabled(false);
    setWaitlistCapacity(1);
    setIsCapacityManuallySet(false);
    setRsvpDeadline('1 hour before');
    setCostAmount(0);
    setQuickNote('');
  }, []);

  return {
    localLocation, setLocalLocation,
    eventDateTime, setEventDateTime,
    searchPeopleQuery, setSearchPeopleQuery,
    selectedCircles, setSelectedCircles,
    selectedFriends, setSelectedFriends,
    waitlistEnabled, setWaitlistEnabled,
    waitlistCapacity, setWaitlistCapacity: handleSetWaitlistCapacity,
    rsvpDeadline, setRsvpDeadline,
    customDeadline, setCustomDeadline,
    costAmount, setCostAmount,
    quickNote, setQuickNote,
    localTitle, setLocalTitle,
    isSubmitting, setIsSubmitting,
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
