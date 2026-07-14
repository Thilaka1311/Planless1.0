import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { supabase } from "../../../lib/supabaseClient";
import * as service from "../services/friendshipService";

interface FriendshipContextType {
  friends: any[];
  incomingRequests: any[];
  outgoingRequests: any[];
  friendCount: number;
  loading: boolean;
  sendFriendRequest: (targetUserId: string, createdFromPlanId?: string | null) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  rejectFriendRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  refreshFriendships: () => Promise<void>;
}

const FriendshipContext = createContext<FriendshipContextType | undefined>(undefined);

export const FriendshipProvider = ({ children }: { children: ReactNode }) => {
  const { activeUserUuid } = useProfileStore();

  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const friendCount = useMemo(() => friends.length, [friends]);

  const refreshFriendships = useCallback(async () => {
    if (!activeUserUuid) {
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }

    setLoading(true);
    try {
      const [friendsList, incomingList, outgoingList] = await Promise.all([
        service.getFriends(activeUserUuid),
        service.getIncomingFriendRequests(activeUserUuid),
        service.getOutgoingFriendRequests(activeUserUuid)
      ]);

      setFriends(friendsList);
      setIncomingRequests(incomingList);
      setOutgoingRequests(outgoingList);
    } catch (err) {
      console.error("[FriendshipContext] Failed to refresh friendships:", err);
    } finally {
      setLoading(false);
    }
  }, [activeUserUuid]);

  const sendFriendRequest = useCallback(async (targetUserId: string, createdFromPlanId?: string | null) => {
    if (!activeUserUuid) throw new Error("Authentication required.");
    await service.sendFriendRequest(activeUserUuid, targetUserId, createdFromPlanId);
    await refreshFriendships();
  }, [activeUserUuid, refreshFriendships]);

  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    await service.acceptFriendRequest(friendshipId);
    await refreshFriendships();
  }, [refreshFriendships]);

  const rejectFriendRequest = useCallback(async (friendshipId: string) => {
    await service.rejectFriendRequest(friendshipId);
    await refreshFriendships();
  }, [refreshFriendships]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    await service.removeFriend(friendshipId);
    await refreshFriendships();
  }, [refreshFriendships]);

  // Load initial data and subscribe to realtime updates
  useEffect(() => {
    if (!activeUserUuid) return;

    refreshFriendships();

    const channel = supabase
      .channel(`friendships-realtime-${activeUserUuid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships"
        },
        () => {
          refreshFriendships();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [activeUserUuid, refreshFriendships]);

  const value = useMemo(() => ({
    friends,
    incomingRequests,
    outgoingRequests,
    friendCount,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refreshFriendships
  }), [
    friends,
    incomingRequests,
    outgoingRequests,
    friendCount,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refreshFriendships
  ]);

  return (
    <FriendshipContext.Provider value={value}>
      {children}
    </FriendshipContext.Provider>
  );
};

export const useFriendshipStore = () => {
  const context = useContext(FriendshipContext);
  if (context === undefined) {
    throw new Error("useFriendshipStore must be used within a FriendshipProvider");
  }
  return context;
};
