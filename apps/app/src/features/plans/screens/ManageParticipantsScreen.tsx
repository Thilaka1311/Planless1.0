import React, { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft, X, Plus, Minus, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlanMember } from '../../../core/types';
import { usePlansStore } from '../state/PlansContext';
import { useProfileStore } from '../../profile/state/ProfileContext';
import { normalizeFriendshipUsers } from '../../friendships/utils/normalize';
import { useCirclesStore } from '../../circles/state/CirclesContext';
import { StepWho } from '../../create/screens/WhoIsComing/Components/FriendsSelector';
import { ParticipantBoard } from '../components/ParticipantBoard';
import { useLivePlan } from '../hooks/useLivePlan';
import { UserAvatar } from '../../../IMGfromDB/UserAvatar';

interface ManageParticipantsScreenProps {
  planId: string;
  onBack: () => void;
}

export const ManageParticipantsScreen: React.FC<ManageParticipantsScreenProps> = ({ planId, onBack }) => {
  const {
    getAvailableCapacity,
    changePlanHost,
    addParticipantsToPlan,
    updatePlanDetails,
  } = usePlansStore();

  const { userProfile, activeUserId, dbUsers, dbFriendships } = useProfileStore();
  const { circles } = useCirclesStore();

  // Derive live plan from store — always fresh, never frozen
  const livePlan = useLivePlan(planId);

  console.log('[PLAN_DEBUG] ManageParticipantsScreen', { planId, livePlan: livePlan?.id ?? null });

  if (!livePlan) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#030303] flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-[#ff8b66] animate-spin" />
        <p className="text-zinc-500 text-xs mt-3 font-mono">Loading participants…</p>
      </div>
    );
  }

  const isHostUser = useMemo(() => {
    const hostUuid = livePlan.hostId;
    return hostUuid === activeUserId || hostUuid === userProfile?.dbUuid;
  }, [livePlan.hostId, activeUserId, userProfile]);

  // ─── Host Transfer UI state ──────────────────────────────────────────────────
  const [showTransferPanel, setShowTransferPanel] = useState(false);
  const [transferBusy, setTransferBusy] = useState(false);

  // ─── Add Participants picker state ───────────────────────────────────────────
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [searchPeopleQuery, setSearchPeopleQuery] = useState('');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);

  // ─── Capacity/Max Attendees Feedback State ───────────────────────────────────
  const [feedback, setFeedback] = useState<{ type: 'increased' | 'decreased'; count: number } | null>(null);

  const handleCapacityChange = useCallback(async (newCap: number) => {
    try {
      const res = await updatePlanDetails(livePlan.id, { join_limit: newCap, max_people: newCap });
      if (res) {
        if (res.promotedCount > 0) {
          setFeedback({ type: 'increased', count: res.promotedCount });
          setTimeout(() => {
            setFeedback(prev => prev?.type === 'increased' && prev?.count === res.promotedCount ? null : prev);
          }, 4000);
        } else if (res.demotedCount > 0) {
          setFeedback({ type: 'decreased', count: res.demotedCount });
          setTimeout(() => {
            setFeedback(prev => prev?.type === 'decreased' && prev?.count === res.demotedCount ? null : prev);
          }, 4000);
        } else {
          setFeedback(null);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update Max Attendees.');
    }
  }, [livePlan.id, updatePlanDetails]);

  // ─── Group & count members for header summary ────────────────────────────────
  const columns = useMemo(() => {
    const going: PlanMember[] = [];
    const waitlist: PlanMember[] = [];
    const invited: PlanMember[] = [];

    livePlan.members.forEach(m => {
      if (m.joinState === 'JOINED') going.push(m);
      else if (m.joinState === 'WAITLISTED') waitlist.push(m);
      else if (m.joinState === 'INVITED' || m.joinState === 'unanswered') invited.push(m);
    });

    return { going, waitlist, invited };
  }, [livePlan.members]);

  const { capacity, goingCount } = getAvailableCapacity(livePlan.id);

  const handleHostTransfer = useCallback(async (newHostId: string) => {
    const target = livePlan.members.find(m => m.userId === newHostId);
    if (!target) return;
    if (!confirm(`Transfer host to ${target.name}? You will no longer be the organizer.`)) return;
    setTransferBusy(true);
    try {
      await changePlanHost(livePlan.id, newHostId, livePlan.hostId);
      setShowTransferPanel(false);
    } catch (err: any) {
      alert(err.message || 'Host transfer failed.');
    } finally {
      setTransferBusy(false);
    }
  }, [livePlan, changePlanHost]);

  // ─── Add Participants picker plumbing ────────────────────────────────────────
  const disabledUserIds = useMemo(
    () => new Set(livePlan.members.map(m => m.userId).filter(Boolean)),
    [livePlan.members]
  );

  const disabledCircleIds = useMemo(
    () => livePlan.circleId ? new Set([livePlan.circleId]) : new Set<string>(),
    [livePlan.circleId]
  );

  const AVAILABLE_CIRCLES = useMemo(() =>
    circles.map(c => ({ id: c.id, name: c.name, membersCount: c.membersCount, emoji: c.category === 'sports' ? '⚽' : '🔥' })),
    [circles]
  );

  const selectedCircleMemberUserIds = useMemo(() => {
    const set = new Set<string>();
    selectedCircles.forEach(cid => {
      circles.find(c => c.id === cid)?.membersList?.forEach(m => { if (m.userId) set.add(m.userId); });
    });
    return set;
  }, [selectedCircles, circles]);

  const AVAILABLE_FRIENDS = useMemo(() => {
    const myUuid = userProfile?.dbUuid;
    if (!myUuid) return [];

    return dbUsers
      .filter(u => u.id !== userProfile?.dbUuid)
      .filter(u => u.id && !disabledUserIds.has(u.id))
      .filter(u => u.id && !selectedCircleMemberUserIds.has(u.id))
      .filter(u => {
        const targetUuid = u.id;
        if (!targetUuid) return false;
        const normalized = normalizeFriendshipUsers(myUuid, targetUuid);
        return dbFriendships.some(f =>
          f.user_1_id === normalized.user_1_id &&
          f.user_2_id === normalized.user_2_id &&
          f.status === "ACCEPTED"
        );
      })
      .map(u => ({ id: u.id || "", dbUuid: u.id, name: u.full_name, avatar: u.profile_photo || null }));
  }, [dbUsers, userProfile, disabledUserIds, selectedCircleMemberUserIds, dbFriendships]);

  const selectedCirclesCount = useMemo(() =>
    selectedCircles.reduce((sum, cid) => sum + (AVAILABLE_CIRCLES.find(c => c.id === cid)?.membersCount || 0), 0),
    [selectedCircles, AVAILABLE_CIRCLES]
  );
  const totalInvitedCount = selectedCirclesCount + selectedFriends.length;

  const toggleCircleSelection = useCallback((cid: string) =>
    setSelectedCircles(prev => prev.includes(cid) ? prev.filter(x => x !== cid) : [...prev, cid]), []);

  const toggleFriendSelection = useCallback((f: any) =>
    setSelectedFriends(prev => prev.some(x => x.id === f.id) ? prev.filter(x => x.id !== f.id) : [...prev, f]), []);

  const handleRemoveSelectedItem = useCallback((item: { id: string; type: 'circle' | 'friend'; name: string }) => {
    if (item.type === 'circle') setSelectedCircles(prev => prev.filter(id => id !== item.id));
    else setSelectedFriends(prev => prev.filter(f => f.id !== item.id));
  }, []);

  const selectedItems = useMemo(() => {
    const items: { id: string; type: 'circle' | 'friend'; name: string; avatar?: string; emoji?: string }[] = [];
    selectedCircles.forEach(cid => { const c = AVAILABLE_CIRCLES.find(x => x.id === cid); if (c) items.push({ id: c.id, type: 'circle', name: c.name, emoji: c.emoji }); });
    selectedFriends.forEach(f => items.push({ id: f.id, type: 'friend', name: f.name, avatar: f.avatar }));
    return items;
  }, [selectedCircles, selectedFriends, AVAILABLE_CIRCLES]);

  const unifiedSearchResults = useMemo(() => {
    const query = searchPeopleQuery.toLowerCase().trim();
    const results: any[] = [];
    AVAILABLE_FRIENDS.filter(f => f.name.toLowerCase().includes(query)).forEach(f =>
      results.push({ id: f.id, type: 'friend', name: f.name, avatar: f.avatar, rawFriend: f })
    );
    return results;
  }, [AVAILABLE_FRIENDS, searchPeopleQuery]);

  const handleConfirmAddParticipants = useCallback(async () => {
    const newUuids = new Set<string>();
    const inviteeCircleMap: Record<string, string | null> = {};

    selectedFriends.forEach(f => {
      const uuid = f.dbUuid || f.id;
      if (uuid) {
        newUuids.add(uuid);
        inviteeCircleMap[uuid] = null;
      }
    });

    selectedCircles.forEach(cid => {
      circles.find(c => c.id === cid)?.membersList?.forEach(m => {
        const uuid = dbUsers.find(u => u.id === m.userId)?.id;
        if (uuid) {
          newUuids.add(uuid);
          // If already in map from selectedFriends, circle selection takes precedence.
          inviteeCircleMap[uuid] = cid;
        }
      });
    });

    const filtered = Array.from(newUuids).filter(uuid => !livePlan.members.some(m => m.userId === uuid || m.userUuid === uuid));
    if (filtered.length > 0) {
      try {
        await addParticipantsToPlan(livePlan.id, filtered, userProfile, livePlan.title, inviteeCircleMap);
        setSelectedCircles([]);
        setSelectedFriends([]);
        setSearchPeopleQuery('');
        setShowAddParticipants(false);
      } catch (err: any) {
        alert('Failed to add participants: ' + err.message);
      }
    } else {
      setShowAddParticipants(false);
    }
  }, [livePlan, selectedFriends, selectedCircles, circles, dbUsers, userProfile, addParticipantsToPlan]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[60] bg-[#030303] flex flex-col"
      >
        {/* ── Simplified Premium Header ────────────────────────────────────────── */}
        <div className="px-5 pt-6 pb-4 flex flex-col border-b border-white/[0.03] shrink-0 bg-[#030303] z-10 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <button
                onClick={onBack}
                className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer flex-shrink-0"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              <div className="min-w-0">
                <h2 className="font-mono font-black text-white text-[16px] leading-tight tracking-tight">Participants</h2>
                <p className="text-[10px] font-mono text-zinc-500 font-semibold truncate mt-0.5">{livePlan.title}</p>
              </div>
            </div>
            {/* Host Transfer Trigger */}
            {isHostUser && (
              <button
                onClick={() => setShowTransferPanel(true)}
                className="text-[10px] font-mono font-black uppercase tracking-wider text-[#FF6B2C] bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 px-3 py-1.5 rounded-full cursor-pointer hover:bg-[#FF6B2C]/15 transition"
              >
                Transfer Host
              </button>
            )}
          </div>

          {/* Compact Capacity Summary Strip */}
          <div className="flex items-center flex-wrap gap-2 mt-4 text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span>Max Attendees</span>
              {isHostUser ? (
                <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg px-1.5 py-0.5 border border-white/[0.05]">
                  <button
                    onClick={() => handleCapacityChange(Math.max(1, capacity - 1))}
                    disabled={capacity <= 1}
                    className="text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 cursor-pointer"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-white font-mono font-black px-0.5">{capacity > 0 ? capacity : '∞'}</span>
                  <button
                    onClick={() => handleCapacityChange(capacity + 1)}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <span className="text-white font-black">{capacity > 0 ? capacity : '∞'}</span>
              )}
            </div>
            <span>•</span>
            <span><strong className="text-white font-black">{goingCount}</strong> Confirmed</span>
            <span>•</span>
            <span><strong className="text-white font-black">{columns.waitlist.length}</strong> Waitlisted</span>
            <span>•</span>
            <span><strong className="text-white font-black">{columns.invited.length}</strong> Invited</span>

            {/* Max Attendees Feedback mini message */}
            <AnimatePresence>
              {feedback && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`ml-auto font-mono text-[9px] font-black px-2 py-0.5 rounded-full border ${feedback.type === 'increased'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}
                >
                  {feedback.type === 'increased' ? '⚡ spots filled' : '⏳ queue adjusted'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Scrollable 2x2 Grid Body ── */}
        <div className="flex-1 overflow-y-auto scrollbar-none pb-32 flex flex-col">
          <ParticipantBoard planId={livePlan.id} isHostUser={isHostUser} />
        </div>

        {/* ── Floating Add Button (only for hosts) ────────────────────────────── */}
        {isHostUser && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-10">
            <button
              onClick={() => setShowAddParticipants(true)}
              className="pointer-events-auto flex items-center gap-2.5 bg-[#FF6B2C] hover:bg-[#FF854F] active:scale-[0.97] text-white font-black font-mono uppercase tracking-wider text-xs px-5 py-3.5 rounded-full shadow-2xl shadow-[#FF6B2C]/20 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add Guests
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Host Transfer Panel (slide-up modal) ─────────────────────────────── */}
      <AnimatePresence>
        {showTransferPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTransferPanel(false)}
              className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[80] bg-[#0D0D12] border-t border-white/[0.06] rounded-t-3xl max-h-[65vh] flex flex-col"
            >
              <div className="px-5 pt-5 pb-4 border-b border-white/[0.04] flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-mono font-black text-white text-sm uppercase tracking-wider">Transfer Host</h3>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Select who should become the new organizer</p>
                </div>
                <button onClick={() => setShowTransferPanel(false)} className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-none py-3">
                {livePlan.members.filter(m => m.userId !== livePlan.hostId && m.joinState !== 'SKIPPED').length === 0 ? (
                  <div className="py-8 text-center text-zinc-650 text-xs font-semibold italic">No eligible participants to transfer to.</div>
                ) : (
                  livePlan.members
                    .filter(m => m.userId !== livePlan.hostId && m.joinState !== 'SKIPPED')
                    .map(member => (
                      <button
                        key={member.userId}
                        disabled={transferBusy}
                        onClick={() => handleHostTransfer(member.userId)}
                        className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-white/[0.03] active:bg-white/[0.05] transition cursor-pointer disabled:opacity-50 text-left"
                      >
                        <UserAvatar src={member.avatar} alt={member.name} size="w-9 h-9" className="border border-white/10" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white truncate">{member.name}</div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider capitalize mt-0.5">{member.joinState}</div>
                        </div>
                        <div className="text-[#FF6B2C] text-[10px] font-mono font-black uppercase tracking-wider">Make Host →</div>
                      </button>
                    ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Add Participants full-screen picker ──────────────────────────────── */}
      <AnimatePresence>
        {showAddParticipants && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[90] bg-[#050505] flex flex-col"
          >
            <div className="px-5 pt-6 pb-2.5 flex items-center justify-between shrink-0 border-b border-white/[0.03] bg-[#050505]">
              <button
                onClick={() => { setSelectedCircles([]); setSelectedFriends([]); setSearchPeopleQuery(''); setShowAddParticipants(false); }}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition font-bold cursor-pointer"
              >
                <X className="w-5 h-5 text-[#FF6B2C]" />
                <span className="text-xs uppercase font-mono tracking-wider">Close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-1 pt-4 pb-6">
              <StepWho
                searchPeopleQuery={searchPeopleQuery}
                setSearchPeopleQuery={setSearchPeopleQuery}
                selectedCircles={selectedCircles}
                toggleCircleSelection={toggleCircleSelection}
                selectedFriends={selectedFriends}
                toggleFriendSelection={toggleFriendSelection}
                waitlistEnabled={false}
                setWaitlistEnabled={() => { }}
                waitlistCapacity={capacity}
                setWaitlistCapacity={() => { }}
                totalInvitedCount={totalInvitedCount}
                selectedItems={selectedItems}
                handleRemoveSelectedItem={handleRemoveSelectedItem}
                unifiedSearchResults={unifiedSearchResults}
                AVAILABLE_CIRCLES={AVAILABLE_CIRCLES}
                setCustomizerStep={() => { }}
                disabledUserIds={disabledUserIds}
                disabledCircleIds={disabledCircleIds}
                confirmLabel={`Add ${totalInvitedCount} Guest${totalInvitedCount === 1 ? '' : 's'}`}
                onConfirmEdit={handleConfirmAddParticipants}
                hideCapacity={true}
                userProfile={userProfile}
                activeUserId={activeUserId}
                localTitle={livePlan.title}
                localLocation={livePlan.location}
                eventDateTime={livePlan.time ? new Date(livePlan.time) : undefined}
                category={livePlan.category}
                subcategory={null}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
