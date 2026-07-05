import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, ChevronRight, UserPlus, Trash2, Edit3, Bell, Eye, LogOut, 
  Info, Shield, Check, Users, Search, X, MoreVertical, ShieldAlert, Sparkles, Award, UserX, Crown, Plus, Save, Camera, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCirclesStore } from "../state/CirclesContext";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { useToast } from "../../../shared/contexts/ToastContext";
import { UserAvatar } from "../../../shared/components/UserAvatar";
import { CircleAvatar } from "../../../shared/components/CircleAvatar";
import { useProfileUpload } from "../../profile/hooks/useProfileUpload";
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

  const { circles, dbCircles, removeCircleMember, updateCircleMemberRole, transferCircleHost, updateCircle, deleteCircle } = useCirclesStore();
  const { activeUserUuid } = useProfileStore();
  const { uploading, uploadError, uploadImage } = useProfileUpload();

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
    const rawMembers = (freshCircle.membersList || []).map((m: any) => {
      const uObj = dbUsers.find((u: any) => u.id === m.userId || u.user_id === m.userId);
      return {
        id: m.userId,
        name: uObj?.full_name || m.name,
        avatar: uObj?.profile_photo || m.avatar,
        status: uObj?.bio || m.phone || 'Spontaneous and active ⚡',
        role: m.role === 'host' ? 'Host' : (m.role === 'co_host' ? 'Co-host' : 'Member')
      };
    });

    // Order by rank: Host, Co-host, then Member. Sort each alphabetically by name.
    const hosts = rawMembers.filter(m => m.role === 'Host').sort((a, b) => a.name.localeCompare(b.name));
    const cohosts = rawMembers.filter(m => m.role === 'Co-host').sort((a, b) => a.name.localeCompare(b.name));
    const regular = rawMembers.filter(m => m.role === 'Member').sort((a, b) => a.name.localeCompare(b.name));

    return [...hosts, ...cohosts, ...regular];
  }, [freshCircle.membersList, dbUsers]);

  // Local state for actions menus & search
  const [selectedMemberForActions, setSelectedMemberForActions] = useState<any | null>(null);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastText, setToastText] = useState<string | null>(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [showPermissionsSubScreen, setShowPermissionsSubScreen] = useState(false);

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

  const isMe = (userId: string) => {
    const resolvedUserUuid = activeUserUuid || activeUserId;
    return userId === resolvedUserUuid;
  };

  const myMember = members.find(m => m.id === (activeUserUuid || activeUserId));
  const myRole = myMember?.role || (dbCircle?.created_by === activeUserUuid ? 'Host' : 'Member');

  const isHost = myRole === 'Host';
  const isCoHost = myRole === 'Co-host';
  const isHostOrCoHost = isHost || isCoHost;

  const handleEditAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const publicUrl = await uploadImage(file, activeUserUuid || activeUserId);
    if (publicUrl) {
      try {
        const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
        await updateCircle(targetCircleUuid, circleNameInput, descriptionInput, publicUrl);
        const updated = { 
          ...freshCircle, 
          groupPhoto: publicUrl, 
          groupImage: publicUrl,
          cover_image: publicUrl 
        };
        setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
        setSelectedCircle?.(updated);
        triggerToast('Circle profile photo updated');
      } catch (err: any) {
        triggerToast(`Failed to save image: ${err.message || err}`);
      }
    }
  };

  const handleSaveName = async () => {
    if (!circleNameInput.trim()) return;
    try {
      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
      await updateCircle(targetCircleUuid, circleNameInput.trim(), descriptionInput);
      const updated = { ...freshCircle, name: circleNameInput.trim() };
      setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
      setSelectedCircle?.(updated);
      setIsEditingName(false);
      triggerToast('Circle name updated');
    } catch (err: any) {
      triggerToast(`Error updating name: ${err.message || err}`);
    }
  };

  const handleSaveDescription = async () => {
    try {
      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
      await updateCircle(targetCircleUuid, circleNameInput, descriptionInput);
      setIsEditingDescription(false);
      const updated = { ...freshCircle, tagline: descriptionInput, description: descriptionInput };
      setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
      setSelectedCircle?.(updated);
      triggerToast('Description updated successfully');
    } catch (err: any) {
      triggerToast(`Error updating description: ${err.message || err}`);
    }
  };

  const handleRemoveDescription = async () => {
    try {
      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
      await updateCircle(targetCircleUuid, circleNameInput, '');
      setDescriptionInput('');
      setIsEditingDescription(false);
      const updated = { ...freshCircle, tagline: '', description: '' };
      setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
      setSelectedCircle?.(updated);
      triggerToast('Description removed');
    } catch (err: any) {
      triggerToast(`Error removing description: ${err.message || err}`);
    }
  };

  // Promote Member to Co-host
  const handlePromoteToCoHost = async (memberId: string, name: string) => {
    try {
      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
      await updateCircleMemberRole(targetCircleUuid, memberId, "co_host");
      const updatedMembers = freshCircle.membersList.map((m: any) => m.userId === memberId ? { ...m, role: 'co_host' } : m);
      setSelectedCircle?.({ ...freshCircle, membersList: updatedMembers });
      triggerToast(`${name} has been promoted to Co-host`);
    } catch (err: any) {
      triggerToast(`Error promoting member: ${err.message || err}`);
    }
  };

  // Demote Co-host back to Member
  const handleDemoteToMember = async (memberId: string, name: string) => {
    try {
      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
      await updateCircleMemberRole(targetCircleUuid, memberId, "member");
      const updatedMembers = freshCircle.membersList.map((m: any) => m.userId === memberId ? { ...m, role: 'member' } : m);
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
        if (m.userId === (activeUserUuid || activeUserId)) return { ...m, role: 'co_host' };
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
          </div>
        </div>
      </div>

      {/* CORE WRAPPER */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-6 pt-8 pb-32 space-y-9">

        {/* 1. CIRCLE HEADER */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div 
              onClick={() => setShowPhotoViewer(true)}
              className="w-20 h-20 rounded-full overflow-hidden bg-zinc-900 shadow-sm relative group cursor-pointer hover:opacity-90"
            >
              <CircleAvatar 
                src={freshCircle.groupPhoto || freshCircle.groupImage || freshCircle.cover_image || (freshCircle as any).group_photo} 
                alt={freshCircle.name} 
                size="w-full h-full"
                className="object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {isHostOrCoHost && (
              <button
                type="button"
                onClick={() => !uploading && document.getElementById('settings_circle_avatar_input')?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#121217] border border-white/[0.08] hover:border-[#FF6B2C]/40 transition flex items-center justify-center text-zinc-400 hover:text-[#FF6B2C] shadow-lg cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isHostOrCoHost && (
            <input
              id="settings_circle_avatar_input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleEditAvatarChange}
            />
          )}

          <div className="space-y-0.5">
            {isEditingName ? (
              <div className="flex items-center gap-2 justify-center max-w-xs mx-auto">
                <input
                  type="text"
                  value={circleNameInput}
                  onChange={(e) => setCircleNameInput(e.target.value)}
                  onBlur={handleSaveName}
                  className="bg-[#0E0E12] border border-white/[0.08] focus:border-[#FF6B2C]/40 text-center text-[17px] font-sans font-bold rounded-lg px-2.5 py-1 text-white outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                  autoFocus
                />
              </div>
            ) : (
              <div 
                onClick={() => isHostOrCoHost && setIsEditingName(true)}
                className={`flex items-center justify-center gap-1.5 ${isHostOrCoHost ? 'cursor-pointer hover:opacity-80' : ''}`}
              >
                <h3 className="text-[17px] font-sans font-black text-zinc-100 tracking-wide leading-none">
                  {freshCircle.name}
                </h3>
                {isHostOrCoHost && <Pencil className="w-3.5 h-3.5 text-zinc-550 hover:text-[#FF6B2C] transition" />}
              </div>
            )}
            <p className="text-[9.5px] font-sans font-medium text-zinc-550 tracking-widest uppercase mt-0.5">
              {members.length} Members
            </p>
          </div>
        </div>

        {/* 2. ABOUT SECTION */}
        <div className="space-y-2.5 relative">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              About
            </h4>
            {isHostOrCoHost && !isEditingDescription && (
              <button
                type="button"
                onClick={() => {
                  setDescriptionInput(description);
                  setIsEditingDescription(true);
                }}
                className="text-zinc-550 hover:text-[#FF6B2C] transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {isEditingDescription ? (
            <div className="space-y-2 max-w-sm">
              <textarea
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                onBlur={handleSaveDescription}
                placeholder="Enter Circle Description"
                rows={2}
                className="w-full bg-[#0E0E12] border border-white/[0.08] focus:border-[#FF6B2C]/40 text-sm font-sans rounded-lg px-3 py-2 text-white outline-none resize-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSaveDescription(); }}
                autoFocus
              />
            </div>
          ) : (
            <div 
              onClick={() => isHostOrCoHost && setIsEditingDescription(true)}
              className={`px-1 group ${isHostOrCoHost ? 'cursor-pointer' : ''}`}
            >
              <p className="text-[12.5px] text-zinc-400 font-sans font-medium leading-relaxed group-hover:text-zinc-200 transition">
                {freshCircle.description || freshCircle.tagline || "No description set yet. Click to add details."}
              </p>
            </div>
          )}
        </div>

        {/* 3. SETTINGS NAVIGATION SECTION */}
        {isHost && (
          <div className="space-y-2.5">
            <div className="border-b border-white/[0.04] pb-1.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Preferences
              </h4>
            </div>
            <div className="px-1">
              <button
                type="button"
                onClick={() => setShowPermissionsSubScreen(true)}
                className="w-full flex items-center justify-between py-3 hover:opacity-80 transition cursor-pointer text-left"
              >
                <div>
                  <p className="text-[12.5px] font-bold text-zinc-300">Circle Settings</p>
                  <p className="text-[10.5px] text-zinc-550 mt-0.5">Manage permissions and access controls</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        )}

        {/* 5. MEMBERS SECTION */}
        <div className="space-y-3.5">
          <div className="border-b border-white/[0.04] pb-1.5 flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Members • {members.length}
            </h4>
          </div>

          {/* Members List Container */}
          <div className="divide-y divide-white/[0.03] space-y-0.5">
            {members.map((member, idx) => {
              const isMemberMe = isMe(member.id);
              const isTargetHost = member.role === 'Host';
              const isTargetCoHost = member.role === 'Co-host';

              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedMemberForActions(member)}
                  className="flex items-center justify-between py-2.5 hover:opacity-85 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={member.avatar}
                      alt={member.name}
                      size="w-7 h-7"
                      className="border border-white/10"
                    />
                    <p className="text-[12.5px] font-sans font-bold text-zinc-300 leading-tight">
                      {member.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role Badges */}
                    {isTargetHost ? (
                      <span className="text-[8px] font-sans font-bold tracking-wider text-amber-400 bg-amber-400/5 px-1.5 py-0.5 rounded uppercase">
                        HOST
                      </span>
                    ) : isTargetCoHost ? (
                      <span className="text-[8px] font-sans font-bold tracking-wider text-[#FF6B2C] bg-[#FF6B2C]/5 px-1.5 py-0.5 rounded uppercase">
                        CO-HOST
                      </span>
                    ) : (
                      <span className="text-[8px] font-sans font-bold tracking-wider text-zinc-500 bg-white/[0.02] px-1.5 py-0.5 rounded uppercase">
                        MEMBER
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Member Management: inline below list */}
          {isHostOrCoHost && (
            <button
              type="button"
              onClick={onAddMembers}
              className="w-full py-2.5 mt-2 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] text-zinc-300 hover:text-white font-sans font-bold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          )}
        </div>

        {/* 6. ACTIONS: LEAVE / DELETE (Placed at the very bottom below Members) */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={handleLeaveCircleAction}
            className="w-full py-2.5 bg-[#FF6B2C]/5 hover:bg-[#FF6B2C]/10 border border-[#FF6B2C]/10 text-[#FF6B2C] font-sans font-bold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Leave Circle</span>
          </button>

          {isHost && (
            <button
              type="button"
              onClick={() => setShowDeleteCircleConfirmModal(true)}
              className="w-full py-2.5 bg-red-600/5 hover:bg-red-650/10 border border-red-650/10 text-red-500 hover:text-red-455 font-sans font-bold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Delete Circle</span>
            </button>
          )}
        </div>

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

      {/* MEMBER ACTION SHEET */}
      <AnimatePresence>
        {selectedMemberForActions && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMemberForActions(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-md bg-[#0D0D10] border-t border-white/10 rounded-t-[28px] p-6 space-y-4 z-[110] relative pb-10 shadow-2xl text-left"
            >
              {/* Handle bar */}
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-2 mb-4" />
              
              {/* Member details */}
              <div className="flex items-center gap-3.5 pb-2 border-b border-white/[0.04]">
                <UserAvatar
                  src={selectedMemberForActions.avatar}
                  alt={selectedMemberForActions.name}
                  size="w-10 h-10"
                  className="border border-white/10"
                />
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wide leading-tight">
                    {selectedMemberForActions.name}
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest mt-1 block">
                    Role: {selectedMemberForActions.role}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMemberForActions(null);
                    showToast(`Viewing profile of ${selectedMemberForActions.name}`);
                  }}
                  className="w-full py-3 px-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition text-center cursor-pointer"
                >
                  View Profile
                </button>

                {/* Make Co-Host (Host only) */}
                {isHost && selectedMemberForActions.role === 'Member' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberForActions(null);
                      handlePromoteToCoHost(selectedMemberForActions.id, selectedMemberForActions.name);
                    }}
                    className="w-full py-3 px-4 bg-[#FF6B2C]/10 hover:bg-[#FF6B2C]/20 border border-[#FF6B2C]/20 text-[#FF6B2C] rounded-xl text-xs font-bold transition text-center cursor-pointer"
                  >
                    Make Co-Host
                  </button>
                )}

                {/* Demote to Member / Remove Co-Host (Host only) */}
                {isHost && selectedMemberForActions.role === 'Co-host' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberForActions(null);
                      handleDemoteToMember(selectedMemberForActions.id, selectedMemberForActions.name);
                    }}
                    className="w-full py-3 px-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-zinc-300 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                  >
                    Demote to Member
                  </button>
                )}

                {/* Make Host (Host only - only to Co-hosts) */}
                {isHost && selectedMemberForActions.role === 'Co-host' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberForActions(null);
                      setMemberToTransferHost(selectedMemberForActions);
                    }}
                    className="w-full py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                  >
                    Make Host
                  </button>
                )}

                {/* Remove from Circle (Host or Co-host - Co-host can only remove regular Members) */}
                {((isHost && selectedMemberForActions.role !== 'Host') || 
                  (isCoHost && selectedMemberForActions.role === 'Member')) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberForActions(null);
                      setMemberToRemove(selectedMemberForActions);
                    }}
                    className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                  >
                    Remove From Circle
                  </button>
                )}

                {/* Cancel */}
                <button
                  type="button"
                  onClick={() => setSelectedMemberForActions(null)}
                  className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-850 border border-white/[0.03] text-zinc-400 hover:text-zinc-300 rounded-xl text-xs font-bold transition text-center cursor-pointer mt-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
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
                <h3 className="font-sans font-black text-sm text-zinc-100 uppercase tracking-wider">Remove member from circle?</h3>
                <p className="text-[11px] text-zinc-400 font-medium font-sans leading-relaxed">
                  Are you sure you want to remove <strong className="text-zinc-200">{memberToRemove.name}</strong>?
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
                  {members.filter(m => m.id !== (activeUserUuid || activeUserId) && m.role === 'Co-host').map((m, mIdx) => (
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
                        <UserAvatar src={m.avatar} alt={m.name} size="w-6 h-6" />
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
                      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
                      await deleteCircle(targetCircleUuid);
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

      {/* FULL-SCREEN PHOTO VIEWER MODAL */}
      <AnimatePresence>
        {showPhotoViewer && (
          <div className="fixed inset-0 z-[200] flex flex-col justify-between bg-black text-white">
            {/* Background Backdrop Fader */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPhotoViewer(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />

            {/* Header overlay */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="relative z-[220] px-5 py-4 flex items-center justify-between bg-black/60 backdrop-blur-md border-b border-white/[0.04] text-left"
            >
              <button
                type="button"
                onClick={() => setShowPhotoViewer(false)}
                className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.12] transition flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider leading-tight truncate max-w-[180px]">
                  {freshCircle.name}
                </h4>
                <p className="text-[10px] text-zinc-450 font-medium tracking-wide mt-0.5">
                  {members.length} Members
                </p>
              </div>

              <button
                type="button"
                onClick={() => triggerToast("Edit Photo capability coming soon!")}
                className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.12] transition flex items-center justify-center text-white cursor-pointer"
              >
                <Pencil className="w-4.5 h-4.5" />
              </button>
            </motion.div>

            {/* Central Image Viewer */}
            <div 
              onClick={() => setShowPhotoViewer(false)}
              className="flex-1 flex items-center justify-center p-3 relative z-[210] cursor-pointer"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 220 }}
                className="max-w-full max-h-[75vh] rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 flex items-center justify-center"
              >
                <img
                  src={freshCircle.groupPhoto || freshCircle.groupImage || freshCircle.cover_image || (freshCircle as any).group_photo}
                  alt={freshCircle.name}
                  className="max-w-full max-h-[75vh] object-contain select-none"
                  referrerPolicy="no-referrer"
                  onClick={(e) => e.stopPropagation()} // Prevent closing when tapping on the image itself
                />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CIRCLE SETTINGS PERMISSIONS SUB-SCREEN */}
      <AnimatePresence>
        {showPermissionsSubScreen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-0 z-[150] flex flex-col bg-[#0b0c10] text-zinc-100"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-3.5 border-b border-white/[0.04] bg-[#0b0c10] sticky top-0 z-20">
              <button
                type="button"
                onClick={() => setShowPermissionsSubScreen(false)}
                className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-sans font-black text-[15px] uppercase tracking-wider text-zinc-100 leading-none">
                  Group permissions
                </h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mt-1">
                  {freshCircle.name}
                </p>
              </div>
            </div>
            {/* Content wrapper */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 font-sans">
              
              {/* SECTION: Members and Co-host */}
              <div className="space-y-5">
                <h3 className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest">
                  Members and Co-host:
                </h3>

                {/* Toggle 1: Edit Circle Settings (maps to edit_info_permission === "ANYONE") */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex items-center justify-center w-5 h-5 text-zinc-400">
                      <Pencil className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-zinc-200">Edit Circle Settings</h4>
                      <p className="text-[10.5px] text-zinc-500 mt-0.5 leading-normal max-w-[220px]">
                        This includes the group name, description, group profile photo, and all other circle details.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!isHost}
                    onClick={async () => {
                      const currentVal = freshCircle.edit_info_permission || "HOSTS_ONLY";
                      const newVal = currentVal === "ANYONE" ? "HOSTS_ONLY" : "ANYONE";
                      try {
                        const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
                        await updateCircle(
                          targetCircleUuid,
                          freshCircle.name,
                          freshCircle.description || '',
                          freshCircle.groupPhoto || freshCircle.groupImage,
                          freshCircle.plan_creation_permission,
                          freshCircle.add_members_permission,
                          newVal,
                          freshCircle.remove_members_permission,
                          freshCircle.manage_roles_permission
                        );
                        const updated = { ...freshCircle, edit_info_permission: newVal };
                        setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
                        setSelectedCircle?.(updated);
                        triggerToast(`Members can edit settings: ${newVal === "ANYONE" ? "ON" : "OFF"}`);
                      } catch (err: any) {
                        triggerToast(`Failed: ${err.message || err}`);
                      }
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      (freshCircle.edit_info_permission || "HOSTS_ONLY") === "ANYONE" ? "bg-[#25D366]" : "bg-zinc-800"
                    } ${!isHost ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      (freshCircle.edit_info_permission || "HOSTS_ONLY") === "ANYONE" ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Toggle 2: Spawning/creating plans (maps to plan_creation_permission === "ANYONE") */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex items-center justify-center w-5 h-5 text-zinc-400">
                      <Plus className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-zinc-200">Host new plans</h4>
                      <p className="text-[10.5px] text-zinc-550 mt-0.5 leading-normal max-w-[220px]">
                        Allows members to create and spawn plans inside this circle.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!isHost}
                    onClick={async () => {
                      const currentVal = freshCircle.plan_creation_permission || "ANYONE";
                      const newVal = currentVal === "ANYONE" ? "HOSTS_ONLY" : "ANYONE";
                      try {
                        const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
                        await updateCircle(
                          targetCircleUuid,
                          freshCircle.name,
                          freshCircle.description || '',
                          freshCircle.groupPhoto || freshCircle.groupImage,
                          newVal,
                          freshCircle.add_members_permission,
                          freshCircle.edit_info_permission,
                          freshCircle.remove_members_permission,
                          freshCircle.manage_roles_permission
                        );
                        const updated = { ...freshCircle, plan_creation_permission: newVal };
                        setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
                        setSelectedCircle?.(updated);
                        triggerToast(`Members can host plans: ${newVal === "ANYONE" ? "ON" : "OFF"}`);
                      } catch (err: any) {
                        triggerToast(`Failed: ${err.message || err}`);
                      }
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      (freshCircle.plan_creation_permission || "ANYONE") === "ANYONE" ? "bg-[#25D366]" : "bg-zinc-800"
                    } ${!isHost ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      (freshCircle.plan_creation_permission || "ANYONE") === "ANYONE" ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Toggle 3: Add/Remove other members (maps to add_members_permission === "ANYONE") */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex items-center justify-center w-5 h-5 text-zinc-400">
                      <UserPlus className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-zinc-200">Add other members</h4>
                      <p className="text-[10.5px] text-zinc-550 mt-0.5 leading-normal max-w-[220px]">
                        Allows members to invite new friends and remove them from this group.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!isHost}
                    onClick={async () => {
                      const currentVal = freshCircle.add_members_permission || "ANYONE";
                      const newVal = currentVal === "ANYONE" ? "HOSTS_ONLY" : "ANYONE";
                      try {
                        const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
                        await updateCircle(
                          targetCircleUuid,
                          freshCircle.name,
                          freshCircle.description || '',
                          freshCircle.groupPhoto || freshCircle.groupImage,
                          freshCircle.plan_creation_permission,
                          newVal,
                          freshCircle.edit_info_permission,
                          newVal,
                          freshCircle.manage_roles_permission
                        );
                        const updated = { 
                          ...freshCircle, 
                          add_members_permission: newVal,
                          remove_members_permission: newVal 
                        };
                        setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
                        setSelectedCircle?.(updated);
                        triggerToast(`Members can add/remove members: ${newVal === "ANYONE" ? "ON" : "OFF"}`);
                      } catch (err: any) {
                        triggerToast(`Failed: ${err.message || err}`);
                      }
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      (freshCircle.add_members_permission || "ANYONE") === "ANYONE" ? "bg-[#25D366]" : "bg-zinc-800"
                    } ${!isHost ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      (freshCircle.add_members_permission || "ANYONE") === "ANYONE" ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>

              {/* SECTION: Co-host */}
              <div className="space-y-5 pt-4 border-t border-white/[0.04]">
                <h3 className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest">
                  Co-host:
                </h3>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex items-center justify-center w-5 h-5 text-zinc-400">
                      <Shield className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-zinc-200">Co-hosts can manage roles</h4>
                      <p className="text-[10.5px] text-zinc-500 mt-0.5 leading-normal max-w-[220px]">
                        Allows Co-hosts to change roles and configure group permissions.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!isHost}
                    onClick={async () => {
                      const currentVal = freshCircle.manage_roles_permission || "HOSTS_ONLY";
                      const newVal = currentVal === "HOSTS_ONLY" ? "HOST_ONLY" : "HOSTS_ONLY";
                      try {
                        const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
                        await updateCircle(
                          targetCircleUuid,
                          freshCircle.name,
                          freshCircle.description || '',
                          freshCircle.groupPhoto || freshCircle.groupImage,
                          freshCircle.plan_creation_permission,
                          freshCircle.add_members_permission,
                          freshCircle.edit_info_permission,
                          freshCircle.remove_members_permission,
                          newVal
                        );
                        const updated = { ...freshCircle, manage_roles_permission: newVal };
                        setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
                        setSelectedCircle?.(updated);
                        triggerToast(`Co-hosts can manage roles: ${newVal === "HOSTS_ONLY" ? "ON" : "OFF"}`);
                      } catch (err: any) {
                        triggerToast(`Failed: ${err.message || err}`);
                      }
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                      (freshCircle.manage_roles_permission || "HOSTS_ONLY") === "HOSTS_ONLY" ? "bg-[#25D366]" : "bg-zinc-800"
                    } ${!isHost ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      (freshCircle.manage_roles_permission || "HOSTS_ONLY") === "HOSTS_ONLY" ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>

              {/* SECTION: Host */}
              {isHost && (
                <div className="space-y-5 pt-4 border-t border-white/[0.04]">
                  <h3 className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest">
                    Host:
                  </h3>

                  {/* Approve new members */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex items-center justify-center w-5 h-5 text-zinc-400">
                        <ShieldAlert className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-bold text-zinc-200">Approve new members</h4>
                        <p className="text-[10.5px] text-zinc-500 mt-0.5 leading-normal max-w-[220px]">
                          When turned on, the host must approve anyone who wants to join the group.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!isHost}
                      onClick={() => {
                        triggerToast("Member approval settings updated.");
                      }}
                      className="w-11 h-6 rounded-full p-0.5 bg-zinc-800 focus:outline-none flex items-center cursor-pointer"
                    >
                      <div className="bg-white w-5 h-5 rounded-full shadow-md transform translate-x-0" />
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION: Group admins */}
              <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                <h3 className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest">
                  Group admins
                </h3>
                
                <div className="space-y-3.5">
                  {members.filter(m => m.role === 'Host' || m.role === 'Co-host').map((admin, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={admin.avatar}
                          alt={admin.name}
                          size="w-7 h-7"
                          className="border border-white/10"
                        />
                        <p className="text-[12.5px] font-sans font-bold text-zinc-300 leading-tight">
                          {admin.name}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {admin.role === 'Host' ? (
                          <span className="text-[8px] font-sans font-bold tracking-wider text-amber-400 bg-amber-400/5 px-1.5 py-0.5 rounded uppercase">
                            HOST
                          </span>
                        ) : (
                          <span className="text-[8px] font-sans font-bold tracking-wider text-[#FF6B2C] bg-[#FF6B2C]/5 px-1.5 py-0.5 rounded uppercase">
                            CO-HOST
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default CircleDetailScreen;