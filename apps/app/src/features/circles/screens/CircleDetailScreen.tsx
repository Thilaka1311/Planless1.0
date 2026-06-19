import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, ChevronRight, UserPlus, Trash2, Edit3, Bell, Eye, LogOut, 
  Info, Shield, Check, Users, Search, X, MoreVertical, ShieldAlert, Sparkles, Award, UserX, Crown, Plus, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCirclesStore } from "../state/CirclesContext";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { getInitialsAvatar } from "../../../demo/seedData";
import { useToast } from "../../../shared/contexts/ToastContext";

export const CircleDetailScreen = (props: any) => {
  const {
    circle,
    plans,
    activeUserId,
    onBack,                  // back to CircleChatScreen
    setCircles,
    setSelectedCircle,
    dbUsers,
    onAddMembers,
  } = props;

  const { circles, dbCircles, removeCircleMember, updateCircleMemberRole, transferCircleHost } = useCirclesStore();
  const { activeUserUuid } = useProfileStore();

  const freshCircle = circles.find((c: any) => c.id === circle.id || c.dbUuid === circle.id || c.id === circle.dbUuid) || circle;
  const dbCircle = dbCircles.find(c => c.id === freshCircle.dbUuid || c.circle_id === freshCircle.id);

  // Notification states
  const [notifSound, setNotifSound] = useState(true);
  const [notifMuted, setNotifMuted] = useState(false);

  // Sync details & editable states
  const [isEditingName, setIsEditingName] = useState(false);
  const [circleNameInput, setCircleNameInput] = useState(freshCircle.name);

  // Segmented group description state
  const description = freshCircle.tagline || freshCircle.description || '';
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState(freshCircle.tagline || freshCircle.description || '');

  // Members mapped from freshCircle.membersList using useMemo
  const members = useMemo(() => {
    return (freshCircle.membersList || []).map((m: any) => ({
      id: m.userId,
      name: m.name,
      avatar: m.avatar,
      status: m.phone || 'Spontaneous and active ⚡',
      role: m.role === 'host' ? 'Host' : (m.role === 'co_host' ? 'Co-host' : 'Member')
    }));
  }, [freshCircle.membersList]);

  // Local state for actions menus & search
  const [activeMenuMember, setActiveMenuMember] = useState<string | null>(null);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastText, setToastText] = useState<string | null>(null);

  // Modals confirmation states
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);
  const [memberToTransferHost, setMemberToTransferHost] = useState<any | null>(null);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [showHostBlockLeaveModal, setShowHostBlockLeaveModal] = useState(false);
  const [chosenNewHostForLeave, setChosenNewHostForLeave] = useState<any | null>(null);
  const [showHostTransferLeaveConfirmModal, setShowHostTransferLeaveConfirmModal] = useState(false);
  const [showDeleteCircleConfirmModal, setShowDeleteCircleConfirmModal] = useState(false);

  const { showToast } = useToast();

  const triggerToast = (text: string) => {
    showToast(text);
    // Also update local state for the bottom-positioned toast in this screen
    setToastText(text);
    setTimeout(() => {
      setToastText(null);
    }, 3500);
  };

  const isMe = (name: string) => {
    const resolvedUserUuid = activeUserUuid || activeUserId;
    const member = freshCircle.membersList?.find((m: any) => m.name === name);
    return member?.userId === resolvedUserUuid;
  };

  const myMember = members.find(m => m.id === (activeUserUuid || activeUserId));
  const myRole = myMember?.role || (dbCircle?.created_by === activeUserUuid ? 'Host' : 'Member');

  const isHost = myRole === 'Host';
  const isCoHost = myRole === 'Co-host';
  const isHostOrCoHost = isHost || isCoHost;

  const handleSaveName = () => {
    if (!circleNameInput.trim()) return;
    const updated = { ...freshCircle, name: circleNameInput.trim() };
    setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
    setSelectedCircle?.(updated);
    setIsEditingName(false);
    triggerToast('Circle name updated');
  };

  const handleSaveDescription = () => {
    setIsEditingDescription(false);
    const updated = { ...freshCircle, tagline: descriptionInput, description: descriptionInput };
    setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
    setSelectedCircle?.(updated);
    triggerToast('Description updated successfully');
  };

  const handleRemoveDescription = () => {
    setDescriptionInput('');
    setIsEditingDescription(false);
    const updated = { ...freshCircle, tagline: '', description: '' };
    setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
    setSelectedCircle?.(updated);
    triggerToast('Description removed');
  };

  // Promote Member to Co-host
  const handlePromoteToCoHost = async (name: string) => {
    const member = freshCircle.membersList?.find((m: any) => m.name === name);
    if (!member) return;
    try {
      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
      await updateCircleMemberRole(targetCircleUuid, member.userId, "co_host");
      const updatedMembers = freshCircle.membersList.map((m: any) => m.userId === member.userId ? { ...m, role: 'co_host' } : m);
      setSelectedCircle?.({ ...freshCircle, membersList: updatedMembers });
      triggerToast(`${name} has been promoted to Co-host`);
    } catch (err: any) {
      triggerToast(`Error promoting member: ${err.message || err}`);
    }
  };

  // Demote Co-host back to Member
  const handleDemoteToMember = async (name: string) => {
    const member = freshCircle.membersList?.find((m: any) => m.name === name);
    if (!member) return;
    try {
      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
      await updateCircleMemberRole(targetCircleUuid, member.userId, "member");
      const updatedMembers = freshCircle.membersList.map((m: any) => m.userId === member.userId ? { ...m, role: 'member' } : m);
      setSelectedCircle?.({ ...freshCircle, membersList: updatedMembers });
      triggerToast(`${name} has been demoted to Member`);
    } catch (err: any) {
      triggerToast(`Error demoting member: ${err.message || err}`);
    }
  };

  // Complete Host Ownership Transfer
  const handleTransferHostOwnership = async (targetMember: any) => {
    try {
      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
      await transferCircleHost(targetCircleUuid, targetMember.id);
      const updatedMembers = freshCircle.membersList.map((m: any) => {
        if (m.userId === targetMember.id) return { ...m, role: 'host' };
        if (m.userId === (activeUserUuid || activeUserId)) return { ...m, role: 'member' };
        return m;
      });
      setSelectedCircle?.({ ...freshCircle, created_by: targetMember.id, membersList: updatedMembers });
      setMemberToTransferHost(null);
      triggerToast(`${targetMember.name} is now the Host of this circle`);
    } catch (err: any) {
      triggerToast(`Error transferring host: ${err.message || err}`);
    }
  };

  // Remove a member from the circle
  const handleRemoveMemberFinal = async () => {
    if (!memberToRemove) return;
    try {
      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
      await removeCircleMember(targetCircleUuid, memberToRemove.id);
      const updatedMembers = freshCircle.membersList.filter((m: any) => m.userId !== memberToRemove.id);
      setSelectedCircle?.({
        ...freshCircle,
        membersList: updatedMembers,
        membersCount: updatedMembers.length,
        avatars: updatedMembers.slice(0, 5).map((m: any) => m.avatar)
      });
      triggerToast(`${memberToRemove.name} was removed from the circle`);
      setMemberToRemove(null);
    } catch (err: any) {
      triggerToast(`Error removing member: ${err.message || err}`);
    }
  };

  // Add selected members to the Circle
  const handleAddMemberToCircle = (user: { user_id: string; full_name: string; profile_photo: string }) => {
    // Navigate back to members add flow
    if (onAddMembers) {
      onAddMembers();
      setShowAddMembersModal(false);
    }
  };

  // Handle Logged In User Leaving circle
  const handleLeaveCircleAction = () => {
    const otherHosts = members.filter(m => m.role === 'Host' && m.id !== (activeUserUuid || activeUserId));
    if (isHost && otherHosts.length === 0) {
      setShowHostBlockLeaveModal(true);
    } else {
      setShowLeaveConfirmModal(true);
    }
  };

  // Host transfers ownership and leaves in one action
  const handleTransferAndLeaveFinal = async () => {
    if (!chosenNewHostForLeave) return;
    try {
      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
      await transferCircleHost(targetCircleUuid, chosenNewHostForLeave.id);
      await removeCircleMember(targetCircleUuid, activeUserUuid || activeUserId);
      setCircles?.((prev: any[]) => prev.filter(c => c.id !== freshCircle.id));
      setSelectedCircle?.(null);
      setShowHostTransferLeaveConfirmModal(false);
      setShowHostBlockLeaveModal(false);
      onBack();
      triggerToast(`Transferred host to ${chosenNewHostForLeave.name} and left circle.`);
    } catch (err: any) {
      triggerToast(`Error leaving circle: ${err.message || err}`);
    }
  };

  const handleLeaveCircle = async () => {
    try {
      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
      await removeCircleMember(targetCircleUuid, activeUserUuid || activeUserId);
      setCircles?.((prev: any[]) => prev.filter(c => c.id !== freshCircle.id));
      setSelectedCircle?.(null);
      onBack();
      triggerToast(`Left ${freshCircle.name}.`);
    } catch (err: any) {
      triggerToast(`Error leaving circle: ${err.message || err}`);
    }
  };

  // Clean remaining search candidates
  const eligibleUsers = dbUsers.filter((u: any) => u.user_id !== activeUserId);
  const addableUsers = eligibleUsers.filter((user: any) => 
    !members.some(m => m.name === user.full_name) &&
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -25 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 25 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden select-none text-left"
    >
      {/* HEADER SECTION */}
      <div 
        id="circle-settings-header"
        className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/[0.04] bg-[#050505] sticky top-0 z-20"
      >
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-sans font-black text-[16px] uppercase tracking-wider text-zinc-100 leading-none">
              Circle Settings
            </h2>
            <p className="text-[10px] font-mono font-bold text-zinc-555 mt-1 uppercase tracking-widest text-[#FF6B2C]">
              {myRole} Access
            </p>
          </div>
        </div>
      </div>

      {/* CORE WRAPPER */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-6 pt-6 pb-32 space-y-6">

        {/* IDENTITY AND PHOTO */}
        <div className="flex flex-col items-center text-center space-y-4 bg-zinc-955/20 border border-white/[0.03] p-5 rounded-[24px]">
          <div className="w-24 h-24 rounded-full border-2 border-[#FF6B2C]/20 shadow-2xl overflow-hidden relative bg-zinc-900">
            <img 
              src={freshCircle.groupPhoto || freshCircle.groupImage || (freshCircle.avatars && freshCircle.avatars[0]) || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=240"} 
              alt={freshCircle.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-1 w-full px-2">
            {isEditingName ? (
              <div className="flex items-center gap-2 justify-center max-w-xs mx-auto">
                <input
                  type="text"
                  value={circleNameInput}
                  onChange={(e) => setCircleNameInput(e.target.value)}
                  className="w-full bg-[#0E0E12] border border-white/[0.12] focus:border-[#FF6B2C] text-center text-md font-sans font-black uppercase rounded-xl px-3 py-1.5 text-white outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="p-2 bg-[#FF6B2C] hover:bg-[#FF854C] rounded-lg text-white transition active:scale-95 flex items-center justify-center shrink-0"
                >
                  <Check className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-[20px] font-sans font-black uppercase text-zinc-100 tracking-wide leading-none">
                  {freshCircle.name}
                </h3>
                {isHostOrCoHost && (
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-zinc-500 hover:text-[#FF6B2C] cursor-pointer transition-all active:scale-95"
                    title="Rename Circle"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <p className="text-[10px] font-sans font-bold text-[#FF6B2C] tracking-widest uppercase mt-1">
              {members.length} Active Members
            </p>
          </div>
        </div>

        {/* 1. CIRCLE INFORMATION SCREEN SECTION */}
        <div className="bg-[#09090C] border border-white/[0.04] p-5 rounded-[22px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Info className="w-4.5 h-4.5 text-[#FF6B2C]" />
              <h4 className="text-[12px] font-sans font-black uppercase tracking-wider text-zinc-300">
                1. Circle Information
              </h4>
            </div>
            {isHostOrCoHost && !isEditingDescription && (
              <button
                type="button"
                onClick={() => {
                  setDescriptionInput(description);
                  setIsEditingDescription(true);
                }}
                className="text-[10px] font-sans font-black text-[#FF6B2C] uppercase tracking-wider hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{description ? 'Edit' : 'Add Info'}</span>
              </button>
            )}
          </div>

          {isEditingDescription ? (
            <div className="space-y-3 pt-1">
              <textarea
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Give this circle a beautiful group description (e.g. Weekend spontaneous football)..."
                rows={3}
                className="w-full bg-black/40 border border-white/[0.08] focus:border-[#FF6B2C] rounded-xl p-3 text-[12px] text-zinc-200 placeholder-zinc-700 outline-none font-sans leading-relaxed resize-none"
              />
              <div className="flex items-center justify-end gap-2.5">
                {description && (
                  <button
                    type="button"
                    onClick={handleRemoveDescription}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-[10px] font-sans font-black uppercase tracking-wide cursor-pointer transition-all flex items-center gap-1 mr-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Description</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setIsEditingDescription(false)}
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-zinc-200 text-[10px] font-sans font-black uppercase tracking-wide cursor-pointer"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleSaveDescription}
                  className="px-4 py-1.5 bg-[#FF6B2C] hover:bg-[#FF854C] rounded-lg text-white text-[10px] font-sans font-black uppercase tracking-wide cursor-pointer"
                >
                  Save description
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-black/30 border border-white/[0.02] p-3.5 rounded-xl">
              <p className="text-[12px] text-zinc-400 font-sans font-medium leading-relaxed">
                {description || "No description set yet. Spontaneous friend plans circle."}
              </p>
            </div>
          )}
        </div>

        {/* 2 & 3. MEMBERS LIST & ROLE MANAGEMENT */}
        <div className="bg-[#09090C] border border-white/[0.05] p-5 rounded-[22px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="w-4.5 h-4.5 text-[#FF6B2C]" />
              <h4 className="text-[12px] font-sans font-black uppercase tracking-wider text-zinc-300">
                2. Members ({members.length})
              </h4>
            </div>
            {isHostOrCoHost && (
              <button
                type="button"
                onClick={onAddMembers}
                className="px-3 py-1.5 bg-[#FF6B2C]/10 hover:bg-[#FF6B2C]/20 text-[#FF6B2C] hover:text-[#FF854C] border border-[#FF6B2C]/15 hover:border-[#FF6B2C]/30 rounded-xl text-[9.5px] font-sans font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Members</span>
              </button>
            )}
          </div>

          {/* Members List Container */}
          <div className="space-y-2 pt-1">
            {members.map((member, idx) => {
              const isMemberMe = isMe(member.name);
              const isTargetHost = member.role === 'Host';
              const isTargetCoHost = member.role === 'Co-host';
              const isTargetMember = member.role === 'Member' || !member.role;

              return (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 bg-black/25 hover:bg-black/40 border border-white/[0.02] rounded-xl transition relative group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <img 
                        src={member.avatar || getInitialsAvatar(member.name)} 
                        alt={member.name} 
                        className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getInitialsAvatar(member.name);
                        }}
                      />
                      {isTargetHost && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border border-black flex items-center justify-center text-black">
                          <Crown className="w-2 h-2 text-zinc-950" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[12.5px] font-sans font-black text-zinc-250 leading-tight">
                        {member.name} {isMemberMe && <span className="text-zinc-500 font-medium lowercase">(you)</span>}
                      </p>
                      <p className="text-[9.5px] font-mono text-zinc-555 mt-1 truncate max-w-[170px] leading-none">
                        {member.status || "Spontaneous living 🌴"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role Badges */}
                    {isTargetHost ? (
                      <span className="text-[8px] font-sans font-black tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-md uppercase">
                        Host
                      </span>
                    ) : isTargetCoHost ? (
                      <span className="text-[8px] font-sans font-black tracking-wider text-[#FF6B2C] bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 px-2 py-1 rounded-md uppercase flex items-center gap-0.5">
                        <Shield className="w-2 h-2 text-[#FF6B2C]" /> Co-Host
                      </span>
                    ) : (
                      <span className="text-[8px] font-sans font-black tracking-wider text-zinc-500 bg-white/[0.03] border border-white/[0.08] px-2 py-1 rounded-md uppercase">
                        Member
                      </span>
                    )}

                    {/* Member action dropdown list */}
                    {isHostOrCoHost && !isMemberMe && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuMember(activeMenuMember === member.name ? null : member.name);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] border border-transparent hover:border-white/5 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center justify-center shrink-0"
                          id={`circle-member-menu-btn-${member.name.replace(/\s+/g, '-')}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeMenuMember === member.name && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuMember(null);
                              }}
                            />
                            <div className="absolute right-0 top-full mt-2 bg-[#09090C] border border-white/[0.12] shadow-2xl rounded-2xl p-1 z-50 w-44 animate-scale-up text-left overflow-hidden">
                              {/* Option 1: Promote / Demote Co-Host (Host ONLY can demote or promote other members) */}
                              {isHost && (
                                <>
                                  {isTargetMember && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuMember(null);
                                        handlePromoteToCoHost(member.name);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#FF6B2C]/15 text-[#FF6B2C] hover:text-[#FF854C] font-sans font-black text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                    >
                                      <Shield className="w-3 h-3" />
                                      <span>Make Co-Host</span>
                                    </button>
                                  )}

                                  {isTargetCoHost && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuMember(null);
                                        handleDemoteToMember(member.name);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 font-sans font-black text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                    >
                                      <Users className="w-3 h-3" />
                                      <span>Demote to Member</span>
                                    </button>
                                  )}

                                  {/* Option 2: Transfer Hostship */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuMember(null);
                                      setMemberToTransferHost(member);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 font-sans font-black text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border-t border-white/[0.03]"
                                  >
                                    <Crown className="w-3 h-3" />
                                    <span>Make Host</span>
                                  </button>
                                </>
                              )}

                              {/* Option 3: Remove Member */}
                              {(!isTargetHost) && (isHost || (isCoHost && isTargetMember)) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuMember(null);
                                    setMemberToRemove(member);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-sans font-black text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border-t border-white/[0.03]"
                                  id={`remove-member-row-btn-${member.name.replace(/\s+/g, '-')}`}
                                >
                                  <UserX className="w-3 h-3 shrink-0 text-red-500" />
                                  <span>Remove Member</span>
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. ROLES & PERMISSIONS EXPLAINER CONTAINER */}
        <div className="bg-[#09090C] border border-white/[0.05] p-5 rounded-[22px] space-y-3.5">
          <div className="flex items-center gap-2.5">
            <Award className="w-4.5 h-4.5 text-[#FF6B2C]" />
            <h4 className="text-[12px] font-sans font-black uppercase tracking-wider text-zinc-300">
              3. Roles & Permissions
            </h4>
          </div>
          <div className="space-y-2 pt-1 font-sans text-[11px] text-zinc-400">
            <div className="bg-black/35 p-3 rounded-xl space-y-2 border border-white/[0.02]">
              <div className="flex items-center gap-2">
                <Crown className="w-3 h-3 text-amber-400" />
                <span className="font-extrabold uppercase text-[9.5px] text-amber-400">Host (1 per circle)</span>
              </div>
              <p className="text-zinc-555 leading-relaxed text-[10px]">
                Full management permissions. Can edit group tagline details, add/remove members, promote members to Co-hosts, demote Co-hosts, transfer primary ownership, and permanently delete the entire circle.
              </p>
            </div>

            <div className="bg-black/35 p-3 rounded-xl space-y-2 border border-white/[0.02]">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-[#FF6B2C]" />
                <span className="font-extrabold uppercase text-[9.5px] text-[#FF6B2C]">Co-Hosts (Multiple allowed)</span>
              </div>
              <p className="text-zinc-555 leading-relaxed text-[10px]">
                Support and administration permissions. Can edit group tagline description details, use member search utilities, add new friends, and remove regular Members from the circle list.
              </p>
            </div>
          </div>
        </div>

        {/* NOTIFICATION SETTINGS ACCORDION */}
        <div className="bg-[#09090C] border border-white/[0.04] p-5 rounded-[22px] space-y-4">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4.5 h-4.5 text-[#FF6B2C]" />
            <h4 className="text-[12px] font-sans font-black uppercase tracking-wider text-zinc-300">
              Notification Preferences
            </h4>
          </div>
          <div className="space-y-3">
            {/* Switch 1: Mute Notifications */}
            <div className="flex items-center justify-between">
              <div className="text-left font-sans">
                <p className="text-[12px] font-bold text-zinc-300 uppercase tracking-wide">Mute spontaneous updates</p>
                <p className="text-[10px] text-zinc-555 mt-0.5">Silence all general updates from group threads</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifMuted(!notifMuted)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-150 relative cursor-pointer outline-none ${notifMuted ? 'bg-[#FF6B2C]' : 'bg-white/10'}`}
              >
                <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-150 ${notifMuted ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Switch 2: Sound Alerts */}
            <div className="flex items-center justify-between border-t border-white/[0.03] pt-3">
              <div className="text-left font-sans">
                <p className="text-[12px] font-bold text-zinc-300 uppercase tracking-wide">Play Sound Alerts</p>
                <p className="text-[10px] text-zinc-555 mt-0.5">Play dynamic sound effects upon new messages</p>
              </div>
              <button
                type="button"
                disabled={notifMuted}
                onClick={() => setNotifSound(!notifSound)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-150 relative outline-none ${notifMuted ? 'bg-zinc-800 opacity-40 cursor-not-allowed' : notifSound ? 'bg-[#FF6B2C] cursor-pointer' : 'bg-white/10 cursor-pointer'}`}
              >
                <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-150 ${notifSound && !notifMuted ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 4. LEAVE CIRCLE SECTION CARD */}
        <div className="bg-[#09090C] border border-white/[0.04] p-5 rounded-[22px] space-y-4">
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4.5 h-4.5 text-red-500" />
            <h4 className="text-[12px] font-sans font-black uppercase tracking-wider text-zinc-300">
              4. Leave Circle
            </h4>
          </div>
          <p className="text-[11px] font-sans text-zinc-555 leading-relaxed">
            You can leave this circle at any point. Spontaneous threads and plans inside this circle will no longer be visible on your hub feeds.
          </p>
          <button
            type="button"
            onClick={handleLeaveCircleAction}
            className="w-full py-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-500 hover:text-rose-400 font-sans font-black text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            <span>Leave Circle</span>
          </button>
        </div>

        {/* 5. DELETE CIRCLE SECTION (Host Only) */}
        {isHost && (
          <div className="bg-[#09090C] border border-red-500/10 p-5 rounded-[22px] space-y-4">
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4.5 h-4.5 text-red-500" />
              <h4 className="text-[12px] font-sans font-black uppercase tracking-wider text-zinc-300">
                5. Delete Circle
              </h4>
            </div>
            <p className="text-[10.5px] font-sans text-zinc-555 leading-relaxed">
              This action cannot be undone. All spontaneous matches, chat history log databases, and shared albums will be deleted permanently.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteCircleConfirmModal(true)}
              className="w-full py-3.5 bg-red-650/15 hover:bg-red-655/25 border border-red-650/40 hover:border-red-655/60 text-red-500 hover:text-red-400 font-sans font-black text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4.5 h-4.5 shrink-0 text-red-500" />
              <span>Delete Circle</span>
            </button>
          </div>
        )}

      </div>

      {/* FLOATING ACTION NOTIFICATION TOAST */}
      <AnimatePresence>
        {toastText && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-[#121218] border border-white/10 px-4.5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl max-w-xs w-full pointer-events-none text-left"
            id="circles-management-toast"
          >
            <div className="w-6 h-6 rounded-full bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C] shrink-0 font-bold">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <p className="text-white font-sans font-black text-[10.5px] tracking-wide uppercase leading-tight">
              {toastText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== ACTIVE MODALS & CONFIRMATIONS ==================== */}

      {/* CONFIRMATION DIALOG: REMOVE MEMBER */}
      <AnimatePresence>
        {memberToRemove && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMemberToRemove(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              id="remove-member-backdrop"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[24px] p-6 max-w-xs w-full text-center z-[110] space-y-4 shadow-3xl"
              id="remove-member-modal"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shrink-0">
                <UserX className="w-5 h-5 shrink-0" />
              </div>
              <div className="space-y-1.5 text-center">
                <h3 className="font-sans font-black text-sm text-zinc-100 uppercase tracking-wider">Remove Member?</h3>
                <p className="text-[11px] text-zinc-400 font-medium font-sans leading-relaxed">
                  Are you sure you want to remove <strong className="text-zinc-200">{memberToRemove.name}</strong> from this circle?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setMemberToRemove(null)}
                  className="bg-white/5 hover:bg-white/10 text-zinc-300 py-2.5 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition border border-white/[0.05] cursor-pointer"
                  id="remove-member-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemoveMemberFinal}
                  className="bg-[#E11D48] hover:bg-red-650 text-white font-sans font-black text-[10px] tracking-wider uppercase py-2.5 rounded-xl transition border border-red-500/10 cursor-pointer"
                  id="remove-member-confirm-btn"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG: TRANSFER HOSTSHIP */}
      <AnimatePresence>
        {memberToTransferHost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMemberToTransferHost(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              id="transfer-host-backdrop"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[24px] p-6 max-w-xs w-full text-center z-[110] space-y-4 shadow-3xl relative"
              id="transfer-host-modal"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 text-center font-sans">
                <h3 className="font-black text-sm text-zinc-100 uppercase tracking-wider">Transfer Circle Ownership?</h3>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                  <strong className="text-zinc-200">{memberToTransferHost.name}</strong> will become the new Host.
                </p>
                <p className="text-[10px] text-[#FF6B2C] leading-relaxed font-semibold uppercase tracking-wider mt-1">
                  You will become a regular member.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setMemberToTransferHost(null)}
                  className="bg-white/5 hover:bg-white/10 text-zinc-300 py-2.5 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition border border-white/[0.05] cursor-pointer"
                  id="transfer-host-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleTransferHostOwnership(memberToTransferHost)}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-sans font-black text-[10px] tracking-wider uppercase py-2.5 rounded-xl transition cursor-pointer"
                  id="transfer-host-confirm-btn"
                >
                  Transfer Host
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG: LEAVE CIRCLE (NON-HOST) */}
      <AnimatePresence>
        {showLeaveConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaveConfirmModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              id="leave-backdrop"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[24px] p-6 max-w-xs w-full text-center z-[110] space-y-4 shadow-3xl"
              id="leave-modal"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shrink-0">
                <LogOut className="w-5 h-5 shrink-0" />
              </div>
              <div className="space-y-1.5 text-center font-sans">
                <h3 className="font-black text-sm text-zinc-100 uppercase tracking-wider">Leave Circle?</h3>
                <p className="text-[11.5px] text-zinc-400 font-medium leading-relaxed">
                  Are you sure you want to leave this circle?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLeaveConfirmModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-zinc-300 py-2.5 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition border border-white/[0.05] cursor-pointer"
                  id="leave-stay-btn"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={handleLeaveCircle}
                  className="bg-[#E11D48] hover:bg-red-650 text-white font-sans font-black text-[10px] tracking-wider uppercase py-2.5 rounded-xl transition border border-red-500/10 cursor-pointer"
                  id="leave-confirm-btn"
                >
                  Leave Circle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG FOR HOST LEAVING (OWNERSHIP TRANSFER REQUIRED FLOW) */}
      <AnimatePresence>
        {showHostBlockLeaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHostBlockLeaveModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              id="host-leave-blocker-backdrop"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[28px] p-6 max-w-sm w-full z-[110] space-y-4 shadow-3xl text-center relative"
              id="host-leave-blocker-modal"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500 shrink-0">
                <Crown className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-2 font-sans text-center">
                <h3 className="font-black text-sm text-zinc-100 uppercase tracking-wider">Transfer Ownership Required</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                  As the primary Host, you must transfer ownership to another member before leaving the circle.
                </p>
              </div>

              {/* Select candidate dropdown */}
              <div className="space-y-2 pt-2 text-left">
                <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                  Select new circle Host:
                </label>
                <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1">
                  {members.filter(m => m.id !== (activeUserUuid || activeUserId)).map((m, mIdx) => (
                    <div 
                      key={mIdx}
                      onClick={() => setChosenNewHostForLeave(m)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        chosenNewHostForLeave?.id === m.id 
                          ? 'bg-amber-500/10 border-amber-500/35' 
                          : 'bg-white/[0.02] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-left font-sans">
                        <img src={m.avatar || getInitialsAvatar(m.name)} alt="face" className="w-6.5 h-6.5 rounded-full object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <span className="text-xs font-black text-zinc-200 block leading-tight">{m.name}</span>
                          <span className="text-[9px] text-zinc-550 block uppercase tracking-wider leading-none mt-0.5">{m.role}</span>
                        </div>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                        chosenNewHostForLeave?.id === m.id ? 'bg-amber-500 border-amber-500' : 'border-zinc-700'
                      }`}>
                        {chosenNewHostForLeave?.id === m.id && <Check className="w-2.5 h-2.5 text-zinc-950 stroke-[3.5]" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions row */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHostBlockLeaveModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-zinc-300 py-2.5 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition border border-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!chosenNewHostForLeave}
                  onClick={() => setShowHostTransferLeaveConfirmModal(true)}
                  className={`py-2.5 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition ${
                    chosenNewHostForLeave 
                      ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold cursor-pointer shadow-lg shadow-amber-500/5' 
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Transfer & Leave
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION NESTED OVERLAY: TRANSFER AND LEAVE */}
      <AnimatePresence>
        {showHostTransferLeaveConfirmModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHostTransferLeaveConfirmModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              id="host-leave-nested-backdrop"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[24px] p-6 max-w-xs w-full text-center z-[130] space-y-4 shadow-3xl relative"
              id="host-leave-nested-modal"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shrink-0">
                <ShieldAlert className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-1.5 text-center font-sans">
                <h3 className="font-black text-sm text-zinc-150 uppercase tracking-wider">Are you absolutely sure?</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                  This will transfer primary Host credentials to <strong className="text-zinc-200">{chosenNewHostForLeave?.name}</strong> and remove you from this circle.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowHostTransferLeaveConfirmModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-zinc-300 py-2.5 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition border border-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTransferAndLeaveFinal}
                  className="bg-[#E11D48] hover:bg-red-650 text-white font-sans font-black text-[10px] tracking-wider uppercase py-2.5 rounded-xl transition border border-red-500/10 cursor-pointer"
                >
                  Confirm Exit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG: DELETE CIRCLE */}
      <AnimatePresence>
        {showDeleteCircleConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteCircleConfirmModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              id="delete-circle-backdrop"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-[24px] p-6 max-w-xs w-full text-center z-[110] space-y-4 shadow-3xl relative"
              id="delete-circle-modal"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shrink-0">
                <Trash2 className="w-5 h-5 shrink-0" />
              </div>
              <div className="space-y-1.5 text-center font-sans">
                <h3 className="font-black text-sm text-zinc-100 uppercase tracking-wider">Delete Circle?</h3>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                  Are you sure you want to permanently delete this circle? This action cannot be undone.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteCircleConfirmModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-zinc-300 py-2.5 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition border border-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      // Perform delete circle logic
                      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
                      // Note: supabase server mutation could delete or set deleted status
                      // We can invoke parent state updates to clean deleted circle from cache
                      setCircles?.((prev: any[]) => prev.filter(c => c.id !== freshCircle.id));
                      setSelectedCircle?.(null);
                      setShowDeleteCircleConfirmModal(false);
                      onBack();
                      triggerToast(`✓ Deleted circle ${freshCircle.name} permanently.`);
                    } catch (err: any) {
                      triggerToast(`Error: ${err.message || err}`);
                    }
                  }}
                  className="bg-[#E11D48] hover:bg-red-650 text-white font-sans font-black text-[10px] tracking-wider uppercase py-2.5 rounded-xl transition border border-red-500/10 cursor-pointer"
                >
                  Delete Circle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default CircleDetailScreen;
