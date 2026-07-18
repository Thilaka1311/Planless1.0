import React, { useState, useEffect } from 'react';
import { ParticipantManagementScreen, Friend } from '../../../participants/screens/ParticipantManagementScreen';

interface WhoIsActuallyComingProps {
  form: any;
  onBack: () => void;
  onContinue: () => void;
  onAddFriends?: () => void;
  selectedCategory?: string;
}

export const WhoIsActuallyComing: React.FC<WhoIsActuallyComingProps> = ({
  form,
  onBack,
  onContinue,
  onAddFriends,
  selectedCategory = 'custom'
}) => {
  const selectedFriends: Friend[] = form.selectedFriends || [];
  const capacity = form.totalCapacity || 2;

  // Build the Host Item object if the host is part of the plan
  const hostItem: Friend | null = form.isHostSelected ? {
    id: 'host',
    dbUuid: form.userProfile?.dbUuid || 'host',
    name: form.userProfile?.name || 'You',
    avatar: form.userProfile?.avatar || form.userProfile?.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=You`,
    isHost: true
  } : null;

  // Ordered lists local states (maintained for drag/drop sync)
  const [goingList, setGoingList] = useState<Friend[]>([]);
  const [waitlist, setWaitlist] = useState<Friend[]>([]);

  // Sync to form whenever local goingList updates
  useEffect(() => {
    if (goingList.length > 0) {
      form.setPriorityGuestIds(goingList.map(item => item.id));
    }
  }, [goingList]);

  // Initial distribution
  useEffect(() => {
    const allList = [
      ...(hostItem ? [hostItem] : []),
      ...selectedFriends
    ];

    let initialGoing: Friend[] = [];
    let initialWait: Friend[] = [];

    if (form.priorityGuestIds && form.priorityGuestIds.length > 0) {
      const resolvedGoing = form.priorityGuestIds
        .map((id: string) => allList.find(f => f.id === id))
        .filter(Boolean) as Friend[];
      
      if (resolvedGoing.length > capacity) {
        initialGoing = resolvedGoing.slice(0, capacity);
        const excess = resolvedGoing.slice(capacity);
        const nonPrioritized = allList.filter(f => !form.priorityGuestIds.includes(f.id));
        initialWait = [...excess, ...nonPrioritized];
      } else {
        initialGoing = resolvedGoing;
        initialWait = allList.filter(f => !form.priorityGuestIds.includes(f.id));
      }
    } else {
      initialGoing = allList.slice(0, capacity);
      initialWait = allList.slice(capacity);
    }

    setGoingList(initialGoing);
    setWaitlist(initialWait);
  }, [selectedFriends, capacity, form.isHostSelected]);

  // Format date parts to match WhenIsPlanScreen header summary
  const eventDateObj = form.eventDateTime ? new Date(form.eventDateTime) : new Date();
  const formattedDate = eventDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const formattedTime = eventDateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const handleMoveToGoing = (item: Friend) => {
    let newGoing = [...goingList.filter(f => f.id !== item.id)];
    let newWait = [...waitlist.filter(f => f.id !== item.id)];

    if (newGoing.length >= capacity) {
      const displacedItem = newGoing[newGoing.length - 1];
      newGoing = newGoing.slice(0, newGoing.length - 1);
      newWait = [displacedItem, ...newWait];
    }

    if (item.isHost) {
      newGoing.unshift(item);
    } else {
      newGoing.push(item);
    }

    setGoingList(newGoing);
    setWaitlist(newWait);
  };

  const handleMoveToWaitlist = (item: Friend) => {
    setGoingList(prev => prev.filter(f => f.id !== item.id));
    setWaitlist(prev => [...prev.filter(f => f.id !== item.id), item]);
  };

  const handleRemoveParticipant = (item: Friend) => {
    setGoingList(prev => prev.filter(f => f.id !== item.id));
    setWaitlist(prev => prev.filter(f => f.id !== item.id));

    const updatedFriends = selectedFriends.filter(f => f.id !== item.id);
    form.setSelectedFriends(updatedFriends);

    if (item.isHost) {
      form.setIsHostSelected(false);
    }
  };

  const handleAdjustCapacity = (val: number) => {
    form.setTotalCapacity(val);
  };

  return (
    <ParticipantManagementScreen
      title={form.localTitle || "New Activity"}
      category={selectedCategory}
      eventDate={formattedDate}
      eventTime={formattedTime}
      capacity={capacity}
      isHostSelected={form.isHostSelected}
      userProfile={form.userProfile}
      selectedFriends={selectedFriends}
      mode="wizard"
      onBack={onBack}
      onContinue={onContinue}
      onAddFriends={onAddFriends}
      onAdjustCapacity={handleAdjustCapacity}
      onMoveToGoing={handleMoveToGoing}
      onMoveToWaitlist={handleMoveToWaitlist}
      onRemoveParticipant={handleRemoveParticipant}
    />
  );
};
