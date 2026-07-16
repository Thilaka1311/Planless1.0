import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, MoreVertical, Trash2, User, UserPlus, Check, X, UserMinus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useFriendshipStore } from "../state/FriendshipContext";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { useToast } from "../../../shared/contexts/ToastContext";
import { UserAvatar } from "../../../IMGfromDB/UserAvatar";
import { supabase } from "../../../lib/supabaseClient";
import { DiscoverFriends } from "./DiscoverFriends";


interface FriendshipsScreenProps {
  onBack: () => void;
}

export const FriendshipsScreen: React.FC<FriendshipsScreenProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const { activeUserUuid } = useProfileStore();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    friendCount,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
  } = useFriendshipStore();

  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [friendToRemove, setFriendToRemove] = useState<{ id: string; name: string } | null>(null);
  const [showDiscoverFriends, setShowDiscoverFriends] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ src: string; name: string } | null>(null);
  const [showSentRequests, setShowSentRequests] = useState(false);

  // Discovery states
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  // Fetch all users once on mount
  useEffect(() => {
    async function loadAllUsers() {
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, public_id, full_name, profile_url, bio");
        if (error) {
          console.error("Failed to load users for discovery:", error.message);
        } else {
          setAllUsers(data || []);
        }
      } catch (err) {
        console.error("Failed to load users for discovery:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadAllUsers();
  }, []);

  // Compute discoverable users client-side
  const discoverableUsers = useMemo(() => {
    if (!activeUserUuid) return [];

    const friendIds = new Set(friends.map(f => f.friend?.id).filter(Boolean));
    const incomingIds = new Set(incomingRequests.map(r => r.sender?.id).filter(Boolean));
    const outgoingIds = new Set(outgoingRequests.map(r => r.recipient?.id).filter(Boolean));

    return allUsers
      .filter(u => {
        // Exclude current user
        if (u.id === activeUserUuid) return false;
        // Exclude users already in accepted friendship states
        if (friendIds.has(u.id)) return false;
        // Exclude users who sent incoming requests (handled in Requests tab)
        if (incomingIds.has(u.id)) return false;
        // Exclude users with outgoing requests (handled in Sent Requests list)
        if (outgoingIds.has(u.id)) return false;
        return true;
      })
      .map(u => ({
        ...u,
        username: u.full_name.toLowerCase().replace(/\s+/g, ""),
        profile_photo: u.profile_url
      }))
      // Sort alphabetically by full_name
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [allUsers, friends, incomingRequests, outgoingRequests, activeUserUuid]);

  const handleSettleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
  };

  const confirmRemoveFriend = (friendshipId: string, name: string) => {
    setFriendToRemove({ id: friendshipId, name });
    setActiveMenuId(null);
  };

  const handleRemoveFriend = async () => {
    if (!friendToRemove) return;
    try {
      await removeFriend(friendToRemove.id);
      showToast(`Removed ${friendToRemove.name} from friends.`);
    } catch (err: any) {
      showToast(err.message || "Failed to remove friend.");
    } finally {
      setFriendToRemove(null);
    }
  };

  const handleAccept = async (friendshipId: string, name: string) => {
    try {
      await acceptFriendRequest(friendshipId);
      showToast(`Accepted ${name}'s friend request!`);
    } catch (err: any) {
      showToast(err.message || "Failed to accept request.");
    }
  };

  const handleReject = async (friendshipId: string, name: string) => {
    try {
      await rejectFriendRequest(friendshipId);
      showToast(`Declined ${name}'s friend request.`);
    } catch (err: any) {
      showToast(err.message || "Failed to decline request.");
    }
  };

  const handleAddFriend = async (targetUserUuid: string, name: string) => {
    try {
      await sendFriendRequest(targetUserUuid);
      showToast(`Sent friend request to ${name}!`);
    } catch (err: any) {
      showToast(err.message || "Failed to send friend request.");
    }
  };

  const handleCancelSentRequest = async (friendshipId: string, name: string) => {
    try {
      await rejectFriendRequest(friendshipId);
      showToast(`Cancelled friend request to ${name}.`);
    } catch (err: any) {
      showToast(err.message || "Failed to cancel request.");
    }
  };

  const isLoadingCombined = loading || loadingUsers;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-[#000000] flex flex-col z-40 select-none"
    >
      {/* HEADER */}
      <header className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-white/[0.06] hover:bg-white/[0.03] flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <h1 className="font-sans font-bold text-xl text-white">Friends</h1>
          </div>
        </div>
      </header>

      {/* SEGMENTED CONTROL */}
      <div className="px-5 py-3.5">
        <div className="relative w-full h-[38px] bg-zinc-950 border border-white/[0.04] rounded-xl p-[2px] flex items-center">
          <motion.div
            animate={{ x: activeTab === "friends" ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="absolute top-[2px] bottom-[2px] left-[2px] w-[calc(50%-2px)] bg-zinc-900 border border-white/[0.03] rounded-lg shadow-xl"
          />
          <button
            onClick={() => setActiveTab("friends")}
            className="relative flex-1 text-center font-sans font-semibold text-xs tracking-wide transition-colors duration-200 cursor-pointer h-full flex items-center justify-center z-10"
            style={{ color: activeTab === "friends" ? "#FFFFFF" : "#71717A" }}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className="relative flex-1 text-center font-sans font-semibold text-xs tracking-wide transition-colors duration-200 cursor-pointer h-full flex items-center justify-center z-10"
            style={{ color: activeTab === "requests" ? "#FFFFFF" : "#71717A" }}
          >
            Requests ({incomingRequests.length})
          </button>
        </div>
      </div>

      {/* CONTENT LIST */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {isLoadingCombined && friends.length === 0 && incomingRequests.length === 0 && discoverableUsers.length === 0 ? (
          /* SKELETON LOADER */
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full p-4 bg-[#0A0A0C] border border-white/[0.03] rounded-2xl flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full bg-zinc-900" />
                  <div className="space-y-2">
                    <div className="w-24 h-3 bg-zinc-900 rounded" />
                    <div className="w-16 h-2 bg-zinc-950 rounded" />
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-900" />
              </div>
            ))}
          </div>
        ) : activeTab === "friends" ? (
          /* FRIENDS LIST TAB */
          <div className="space-y-6">
            {friends.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 pt-16">
                <div className="w-16 h-16 rounded-full bg-zinc-950 border border-white/[0.03] flex items-center justify-center text-zinc-650 mb-4">
                  <User className="w-7 h-7" />
                </div>
                <h3 className="font-sans font-bold text-base text-zinc-200">No friends yet</h3>
                <p className="text-zinc-550 text-xs mt-1.5 max-w-[220px] leading-relaxed">
                  Start connecting with people on Planless.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 pt-2">
                {friends.map((item) => (
                  <div
                    key={item.friendshipId}
                    className="relative w-full p-4 bg-[#0A0A0C] border border-white/[0.03] rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3.5">
                      <UserAvatar
                        src={item.friend?.profile_photo || ""}
                        alt={item.friend?.full_name || "User"}
                        onClick={() => setZoomedPhoto({ src: item.friend?.profile_photo || "", name: item.friend?.full_name || "User" })}
                        className="w-11 h-11 rounded-full border border-white/[0.06] object-cover cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200"
                      />
                      <div>
                        <h4 className="font-sans font-bold text-sm text-zinc-200">
                          {item.friend?.full_name || "User"}
                        </h4>
                        <p className="text-[11.5px] font-sans font-medium text-zinc-500 mt-0.5 line-clamp-1">
                          {item.friend?.bio || "Always spontaneous, never planless."}
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === item.friendshipId ? null : item.friendshipId);
                        }}
                        className="w-9 h-9 rounded-full border border-white/[0.04] hover:bg-white/[0.02] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
                      >
                        <MoreVertical className="w-4.5 h-4.5" />
                      </button>

                      <AnimatePresence>
                        {activeMenuId === item.friendshipId && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={handleSettleAction} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.12 }}
                              className="absolute right-0 top-11 w-44 bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden"
                            >
                              <button
                                onClick={(e) => {
                                  handleSettleAction(e);
                                  showToast(`Viewing profile of ${item.friend?.full_name || "friend"}...`);
                                }}
                                className="w-full px-4 py-3 text-left font-sans font-semibold text-[11px] text-zinc-200 hover:bg-white/[0.02] transition cursor-pointer flex items-center gap-2"
                              >
                                <User className="w-3.5 h-3.5 text-zinc-400" />
                                View Profile
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmRemoveFriend(item.friendshipId, item.friend?.full_name || "friend");
                                }}
                                className="w-full px-4 py-3 text-left font-sans font-semibold text-[11px] text-[#EF4444] hover:bg-[#EF4444]/5 transition border-t border-white/[0.04] cursor-pointer flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove Friend
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collapsible Sent Requests */}
            {outgoingRequests.length > 0 && (
              <div className="mt-4 border-t border-white/[0.04] pt-4">
                <button
                  onClick={() => setShowSentRequests(!showSentRequests)}
                  className="w-full flex items-center justify-between py-2 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <span className="font-sans font-bold text-xs uppercase tracking-wider">
                    Sent Requests ({outgoingRequests.length})
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showSentRequests ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {showSentRequests && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 pt-3 overflow-hidden animate-fade-in"
                    >
                      {outgoingRequests.map((item) => (
                        <div
                          key={item.friendshipId}
                          className="w-full p-4 bg-[#0A0A0C]/60 border border-white/[0.03] rounded-2xl flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3.5">
                            <UserAvatar
                              src={item.recipient?.profile_photo || ""}
                              alt={item.recipient?.full_name || "User"}
                              onClick={() => setZoomedPhoto({ src: item.recipient?.profile_photo || "", name: item.recipient?.full_name || "User" })}
                              className="w-10 h-10 rounded-full border border-white/[0.06] object-cover cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200"
                            />
                            <div>
                              <h4 className="font-sans font-bold text-sm text-zinc-300">
                                {item.recipient?.full_name}
                              </h4>
                              <p className="text-[11px] font-sans font-medium text-zinc-550 line-clamp-1">
                                {item.recipient?.bio || "Always spontaneous, never planless."}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelSentRequest(item.friendshipId, item.recipient?.full_name || "User")}
                            className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-white/[0.04] hover:border-white/[0.08] text-zinc-400 hover:text-white font-sans font-semibold text-[11px] rounded-lg transition active:scale-[0.97] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          /* REQUESTS & DISCOVERY TAB */
          <div className="space-y-6 pt-2">
            {/* SECTION 1: FRIEND REQUESTS */}
            <div>
              <h3 className="text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-500 mb-3.5">
                Friend Requests
              </h3>
              {incomingRequests.length === 0 ? (
                <div className="p-4 bg-[#0A0A0C]/50 border border-white/[0.02] border-dashed rounded-2xl text-center">
                  <p className="text-zinc-600 font-sans font-medium text-xs">No pending friend requests</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {incomingRequests.map((item) => (
                    <div
                      key={item.friendshipId}
                      className="w-full p-4 bg-[#0A0A0C] border border-white/[0.03] rounded-2xl flex flex-col space-y-4"
                    >
                      <div className="flex items-center space-x-3.5">
                        <UserAvatar
                          src={item.sender?.profile_photo || ""}
                          alt={item.sender?.full_name || "User"}
                          onClick={() => setZoomedPhoto({ src: item.sender?.profile_photo || "", name: item.sender?.full_name || "User" })}
                          className="w-11 h-11 rounded-full border border-white/[0.06] object-cover cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200"
                        />
                        <div>
                          <h4 className="font-sans font-bold text-sm text-zinc-200">
                            {item.sender?.full_name || "User"}
                          </h4>
                          <p className="text-[11.5px] font-sans font-medium text-zinc-500 mt-0.5 line-clamp-1">
                            {item.sender?.bio || "Always spontaneous, never planless."}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleAccept(item.friendshipId, item.sender?.full_name || "User")}
                          className="flex-1 py-2.5 bg-white text-black font-sans font-bold text-xs rounded-xl hover:bg-zinc-100 transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(item.friendshipId, item.sender?.full_name || "User")}
                          className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-white/[0.04] text-zinc-300 font-sans font-bold text-xs rounded-xl transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 stroke-[3px]" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: DISCOVER PEOPLE */}
            <div>
              <h3 className="text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-500 mb-3.5">
                Discover People
              </h3>
              {discoverableUsers.length === 0 ? (
                <div className="p-4 bg-[#0A0A0C]/50 border border-white/[0.02] border-dashed rounded-2xl text-center">
                  <p className="text-zinc-600 font-sans font-medium text-xs">
                    You're already connected with everyone.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {discoverableUsers.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="w-full p-4 bg-[#0A0A0C] border border-white/[0.03] rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3.5">
                        <UserAvatar
                          src={user.profile_photo || ""}
                          alt={user.full_name || "User"}
                          onClick={() => setZoomedPhoto({ src: user.profile_photo || "", name: user.full_name })}
                          className="w-11 h-11 rounded-full border border-white/[0.06] object-cover cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200"
                        />
                        <div>
                          <h4 className="font-sans font-bold text-sm text-zinc-200">
                            {user.full_name}
                          </h4>
                          <p className="text-[11.5px] font-sans font-medium text-zinc-500 mt-0.5 line-clamp-1">
                            {user.bio || "Always spontaneous, never planless."}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddFriend(user.id, user.full_name)}
                        className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-white/[0.04] text-white font-sans font-bold text-xs rounded-xl transition active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add Friend
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowDiscoverFriends(true)}
                className="w-full mt-3.5 py-3 border border-white/[0.04] bg-zinc-950 hover:bg-zinc-900 rounded-xl text-center font-sans font-semibold text-xs text-zinc-350 hover:text-white transition active:scale-[0.98] cursor-pointer"
              >
                See More
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REMOVE FRIEND CONFIRMATION DIALOG */}
      <AnimatePresence>
        {friendToRemove && (
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6"
            onClick={() => setFriendToRemove(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-[280px] bg-[#0A0A0C] border border-white/10 rounded-2xl p-5 text-center shadow-2xl relative select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mx-auto mb-3.5">
                <Trash2 className="w-5 h-5" />
              </div>

              <h3 className="font-sans font-bold text-base text-white mb-1.5">Remove Friend?</h3>
              <p className="text-zinc-550 text-xs leading-normal mb-5">
                You will no longer appear in each other's friends list.
              </p>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setFriendToRemove(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-white/5 text-zinc-350 hover:text-white font-semibold text-xs tracking-wide transition active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveFriend}
                  className="flex-1 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#F87171] text-white font-semibold text-xs tracking-wide transition active:scale-95 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISCOVER FRIENDS FULL-SCREEN OVERLAY */}
      <AnimatePresence>
        {showDiscoverFriends && (
          <DiscoverFriends
            onBack={() => setShowDiscoverFriends(false)}
            discoverableUsers={discoverableUsers}
            onAddFriend={handleAddFriend}
          />
        )}
      </AnimatePresence>

      {/* PHOTO ZOOM MODAL */}
      <AnimatePresence>
        {zoomedPhoto && (
          <div
            className="fixed inset-0 bg-white/10 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center p-6"
            onClick={() => setZoomedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative max-w-[90vw] max-h-[80vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setZoomedPhoto(null)}
                className="absolute -top-12 right-0 w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* User Name Header */}
              <h3 className="absolute -top-11 left-0 font-sans font-bold text-base text-white">
                {zoomedPhoto.name}
              </h3>

              {/* Image wrapper */}
              <div className="bg-[#0A0A0C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <UserAvatar
                  src={zoomedPhoto.src}
                  alt={zoomedPhoto.name}
                  className="w-[280px] h-[280px] rounded-none object-cover"
                  size=""
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
