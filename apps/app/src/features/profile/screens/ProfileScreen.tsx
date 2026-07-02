import React, { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  ChevronRight, 
  User, 
  Bell, 
  Lock, 
  CreditCard, 
  Wallet, 
  LogOut, 
  Check, 
  X,
  Camera,
  Shield,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProfileStore } from "../state/ProfileContext";
import { usePlansStore } from "../../plans/state/PlansContext";
import { useWalletStore } from "../../wallet/state/WalletContext";
import { UserProfile } from "../../../core/types";
import { useToast } from "../../../shared/contexts/ToastContext";
import { useProfileUpload } from "../hooks/useProfileUpload";
import { supabase } from "../../../lib/supabaseClient";
import { UserAvatar } from "../../../shared/components/UserAvatar";

interface ProfileScreenProps {
  onLogout: () => void;
  setSelectedPlanId: (planId: string | null) => void;
  setSelectedMemoryPlanId: (planId: string | null) => void;
  setShowDbExplorer: (show: boolean) => void;
  setShowDepositModal: (show: boolean) => void;
  onToggleBottomNav?: (hide: boolean) => void;
}

export const ProfileScreen = ({
  onLogout,
  setSelectedPlanId,
  setSelectedMemoryPlanId,
  setShowDbExplorer,
  setShowDepositModal,
  onToggleBottomNav,
}: ProfileScreenProps) => {
  const { showToast } = useToast();
  const { userProfile, activeUserId, activeUserUuid, updateProfile, dbUsers } = useProfileStore();
  const {
    plans,
    dbPlanParticipants,
    dbPlanOutcomes,
    dbMemories
  } = usePlansStore();
  const { walletBalance } = useWalletStore();

  const currentUser = dbUsers.find(u => u.id === activeUserUuid || u.user_id === activeUserId);

  // Interactive sheet states
  const [activeSheet, setActiveSheet] = useState<'account' | 'notifications' | 'privacy' | 'payments' | 'logout' | 'editProfile' | null>(null);

  React.useEffect(() => {
    onToggleBottomNav?.(activeSheet !== null);
    return () => {
      onToggleBottomNav?.(false);
    };
  }, [activeSheet, onToggleBottomNav]);

  // Memories visibility count (batch by 5)
  const [visibleMemoriesCount, setVisibleMemoriesCount] = useState(5);

  // Form temporary states (for edits)
  const [tempName, setTempName] = useState(userProfile?.name || "User");
  const [tempBio, setTempBio] = useState(userProfile?.bio || "");
  const [tempUsername, setTempUsername] = useState(currentUser?.username || activeUserId || "user");
  const [tempImage, setTempImage] = useState(userProfile?.avatar || "");
  const [editSaving, setEditSaving] = useState(false);

  const { uploading: avatarUploading, uploadError: avatarUploadError, uploadImage } = useProfileUpload();

  // Notification states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsFallback, setSmsFallback] = useState(false);
  const [soundFeedback, setSoundFeedback] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Privacy states
  const [isPrivate, setIsPrivate] = useState(false);
  const [showStatus, setShowStatus] = useState(true);
  const [allowSearch, setAllowSearch] = useState(true);

  const handleOpenEdit = () => {
    setTempName(userProfile?.name || "User");
    setTempBio(userProfile?.bio || "");
    setTempUsername(currentUser?.username || activeUserId || "user");
    setTempImage(userProfile?.avatar || "");
    setActiveSheet('editProfile');
  };

  const handleEditAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.dbUuid) return;
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') setTempImage(reader.result); };
    reader.readAsDataURL(file);
    // Upload to Supabase Storage
    const publicUrl = await uploadImage(file, userProfile.dbUuid);
    if (publicUrl) setTempImage(publicUrl);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) {
      showToast('Display name is required');
      return;
    }
    setEditSaving(true);
    try {
      if (userProfile?.dbUuid) {
        const { error } = await supabase
          .from('users')
          .update({
            full_name: tempName.trim(),
            bio: tempBio.trim(),
            profile_url: tempImage || null,
          })
          .eq('id', userProfile.dbUuid);
        if (error) {
          showToast('Failed to save profile. Please try again.');
          return;
        }
      }
      updateProfile({
        ...userProfile,
        name: tempName.trim(),
        bio: tempBio.trim(),
        avatar: tempImage,
      } as UserProfile);
      setActiveSheet(null);
      showToast('Profile updated successfully');
    } catch {
      showToast('Something went wrong. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  // List of settings menu rows
  const menuItems = [
    {
      id: 'account',
      label: 'Account',
      icon: <User className="w-4.5 h-4.5 text-zinc-400" />,
      onClick: () => {
        setTempName(userProfile?.name || "User");
        setTempBio(userProfile?.bio || "");
        setTempUsername(currentUser?.username || activeUserId || "user");
        setActiveSheet('account');
      }
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-4.5 h-4.5 text-zinc-400" />,
      onClick: () => setActiveSheet('notifications')
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: <Lock className="w-4.5 h-4.5 text-zinc-400" />,
      onClick: () => setActiveSheet('privacy')
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: <Wallet className="w-4.5 h-4.5 text-zinc-400" />,
      onClick: () => {
        setShowDepositModal(true);
      }
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: <LogOut className="w-4.5 h-4.5 text-zinc-400" />,
      onClick: () => setActiveSheet('logout')
    }
  ];

  // Robust Plan Event Date Helper
  const getPlanSortDate = (plan: any): Date => {
    if (!plan) return new Date(0);
    if (plan.datetime) {
      const d = new Date(plan.datetime);
      if (!isNaN(d.getTime()) && d.getFullYear() > 2020) return d;
    }
    if (plan.date) {
      if (plan.date === "TODAY") return new Date();
      if (plan.date === "TOMORROW") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      }
      const d = new Date(plan.date);
      if (!isNaN(d.getTime()) && d.getFullYear() > 2020) return d;
    }
    if (plan.createdAt) {
      const d = new Date(plan.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(0);
  };

  // Relative Date calculation helper
  const getRelativeDateLabel = (dateInput: Date) => {
    try {
      if (isNaN(dateInput.getTime()) || dateInput.getFullYear() < 2020) {
        return "Recent";
      }
      const now = new Date();
      const d1 = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
      const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return "Recent";
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 14) return "1 week ago";
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} weeks ago`;
    } catch {
      return "Recent";
    }
  };

  // Dynamic memories list — derived from completed plans + plan_participants
  const completedPlansForUser = plans.filter(
    (p) =>
      (p.status === "COMPLETED" || p.isHappened) &&
      dbPlanParticipants.some(
        (pp) =>
          (pp.plan_id === p.id || pp.plan_id === p.dbUuid) &&
          pp.user_id === activeUserUuid &&
          pp.status === "going"
      )
  );

  const cancelledMemoriesForUser = useMemo(() => {
    return dbMemories.filter(m => 
      (m.user_id === activeUserUuid || m.user_id === activeUserId) && 
      (m.status === "CANCELLED")
    );
  }, [dbMemories, activeUserUuid, activeUserId]);

  const cancelledPlansForUser = useMemo(() => {
    return plans.filter(p => 
      (p.status === "CANCELLED") &&
      (p.hostId === activeUserUuid || p.hostId === activeUserId || p.creatorId === activeUserUuid || p.creatorId === activeUserId)
    );
  }, [plans, activeUserUuid, activeUserId]);

  const mappedMemories = useMemo(() => {
    const list: any[] = [];
    
    // 1. Add completed plans
    for (const p of completedPlansForUser) {
      const planId = p.dbUuid || p.id;
      const category = (p.category || "").toLowerCase();
      const activityType = ((p as any).activity_type || (p as any).activityType || "").toLowerCase();

      let memType = "custom";
      if (category === "movies") memType = "movie";
      else if (category === "dining" || category === "restaurants") memType = "dining";
      else if (category === "sports") memType = activityType === "badminton" ? "badminton" : "football";

      let emoji = "⚡";
      let outcome = "Memory Recorded";
      let colorClass = "text-zinc-500";

      if (memType === "movie") {
        emoji = "🎬";
        colorClass = "text-[#DF8C6B]";
        const verdictRow = dbPlanOutcomes.find(
          (o) =>
            o.plan_id === planId &&
            o.outcome_type === "review" &&
            (o.submitted_by_user_id === activeUserUuid || o.submitted_by_user_id === activeUserId)
        );
        if (verdictRow) {
          outcome = `⭐ ${verdictRow.payload.rating}/5 Stars`;
        }
      } else if (memType === "dining") {
        emoji = "🍝";
        colorClass = "text-[#DEB26D]";
        const voteRow = dbPlanOutcomes.find(
          (o) =>
            o.plan_id === planId &&
            o.outcome_type === "review" &&
            (o.submitted_by_user_id === activeUserUuid || o.submitted_by_user_id === activeUserId)
        );
        if (voteRow) {
          outcome = `⭐ ${voteRow.payload.rating}/5 Stars`;
        }
      } else if (memType === "football" || memType === "badminton") {
        emoji = memType === "badminton" ? "🏸" : "⚽";
        colorClass = "text-[#E4CD8E]";
        
        if (memType === "football") {
          outcome = "Result Recorded";
        } else {
          const badmintonRow = dbPlanOutcomes.find(
            (o) =>
              o.plan_id === planId &&
              o.outcome_type === "stats" &&
              (o.submitted_by_user_id === activeUserUuid || o.submitted_by_user_id === activeUserId)
          );
          if (badmintonRow) {
            outcome = `${badmintonRow.payload.wins}W • ${badmintonRow.payload.losses}L`;
          } else {
            outcome = "0W • 0L";
          }
        }
      }

      list.push({
        id: `completed-${planId}`,
        emoji,
        title: p.title || "Meetup",
        type: memType === "movie" ? "Movies" : memType === "dining" ? "Dining" : memType === "football" ? "Football" : memType === "badminton" ? "Badminton" : "Meetup",
        outcome,
        colorClass,
        date: getRelativeDateLabel(getPlanSortDate(p)),
        timestamp: getPlanSortDate(p).getTime(),
        plan: p
      });
    }

    // 2. Add cancelled memories
    for (const m of cancelledMemoriesForUser) {
      const category = (m.category || "other").toLowerCase();
      const subcategory = (m.subcategory || "other").toLowerCase();
      
      let emoji = "📅";
      if (category === "sports") {
        emoji = subcategory === "badminton" ? "🏸" : "⚽";
      } else if (category === "movies") {
        emoji = "🎬";
      } else if (category === "dining") {
        emoji = "🍝";
      }

      list.push({
        id: m.id,
        emoji,
        title: m.title || "Cancelled Meetup",
        type: `${category.toUpperCase()} • CANCELLED`,
        date: m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Cancelled Plan",
        outcome: m.outcome_text || "Plan Cancelled",
        colorClass: "text-red-500 font-bold",
        timestamp: m.scheduled_at ? new Date(m.scheduled_at).getTime() : 0,
        plan: null
      });
    }

    // 3. Add existing cancelled plans (legacy database status based)
    for (const p of cancelledPlansForUser) {
      const planId = p.dbUuid || p.id;
      const category = (p.category || "").toLowerCase();
      const subcategory = (p.subcategory || (p as any).activityType || "").toLowerCase();
      
      let emoji = "📅";
      if (category === "sports") {
        emoji = subcategory === "badminton" ? "🏸" : "⚽";
      } else if (category === "movies") {
        emoji = "🎬";
      } else if (category === "dining") {
        emoji = "🍝";
      }

      list.push({
        id: `cancelled-plan-${planId}`,
        emoji,
        title: p.title || "Cancelled Meetup",
        type: `${category.toUpperCase()} • CANCELLED`,
        date: p.datetime ? new Date(p.datetime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Cancelled Plan",
        outcome: "Plan Cancelled",
        colorClass: "text-red-500 font-bold",
        timestamp: p.datetime ? new Date(p.datetime).getTime() : 0,
        plan: null
      });
    }

    // Sort combined memories by timestamp descending
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [completedPlansForUser, cancelledMemoriesForUser, cancelledPlansForUser, dbPlanOutcomes, dbUsers, activeUserUuid, activeUserId]);


  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full bg-black">
      
      {/* HEADER SECTION - Back button and Wordmark alignment */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.02] select-none flex-shrink-0 relative">
        <button 
          onClick={() => {}} 
          className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white flex items-center justify-center transition active:scale-90 opacity-0 pointer-events-none"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        <h2 className="absolute left-1/2 -translate-x-1/2 text-xs font-sans font-extrabold tracking-[0.4em] text-white uppercase">
          PLANLESS
        </h2>

        {/* Developer Panel trigger icon */}
        <button
          onClick={() => setShowDbExplorer(true)}
          className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-90"
          title="Database Explorer"
        >
          ⚙️
        </button>
      </div>

      {/* CORE SCROLLABLE PORT */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-6 pt-6 pb-28 flex flex-col items-center">
        
        {/* LARGE CENTRED PROFILE PICTURE */}
        <div className="relative mb-4 select-none">
          <div className="relative w-[136px] h-[136px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF6B2C] via-[#FF8C39] to-[#FF4F00] shadow-[0_0_24px_rgba(255,107,44,0.18)]">
            <UserAvatar 
              src={userProfile?.avatar} 
              alt={userProfile?.name || "User"} 
              size="w-full h-full"
              className="border-[3px] border-black"
            />
          </div>
        </div>

        {/* NAME AND BIO SECTIONS */}
        <div className="text-center select-none max-w-[280px]">
          <h1 className="font-sans font-bold text-xl text-white tracking-wide">
            {userProfile?.name || "User"}
          </h1>
          <p className="text-zinc-550 text-[13px] font-medium leading-relaxed mt-1.5 mb-5 font-sans">
            {userProfile?.bio || ""}
          </p>
        </div>

        {/* SUBTLE EDIT PROFILE PILL BUTTON */}
        <div className="mb-6">
          <button 
            type="button"
            onClick={handleOpenEdit}
            className="px-4 py-1.5 border border-zinc-850 rounded-full bg-[#0D0D10]/40 text-zinc-400 hover:text-white hover:border-zinc-700 active:scale-95 transition text-[10px] font-mono tracking-widest uppercase cursor-pointer"
          >
            EDIT PROFILE
          </button>
        </div>

        {/* SETTINGS SECTION */}
        <div className="w-full select-none mt-4 text-left">
          <h3 className="font-sans font-bold text-[11px] text-zinc-650 tracking-[0.25em] uppercase mb-4 text-left w-full px-1">
            SETTINGS
          </h3>
          <div className="space-y-1.5">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="w-full py-2 px-3 rounded-xl bg-[#0B0B0D]/85 border border-white/[0.04] flex items-center justify-between text-left transition active:scale-[0.98] active:bg-[#0E0E12] group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900/60 border border-white/[0.02] flex items-center justify-center text-zinc-400 group-hover:text-white transition">
                    {item.icon}
                  </div>
                  <span className="font-sans text-[13px] font-medium text-zinc-200">
                    {item.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:text-zinc-400 transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Subtle Divider and Spacing */}
        <div className="w-full h-px bg-white/[0.04] my-6"></div>

        {/* MEMORIES SECTION */}
        <div className="w-full select-none text-left">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-sans font-bold text-[11px] text-zinc-650 tracking-[0.25em] uppercase">
              MEMORIES
            </h3>
            <span className="text-[10px] font-sans font-semibold text-zinc-700 uppercase tracking-wider">
              {Math.min(visibleMemoriesCount, mappedMemories.length)} of {mappedMemories.length}
            </span>
          </div>
          
          {/* Vertically Scrolling List with Animation */}
          <div className="space-y-2">
            {mappedMemories.length === 0 ? (
              <div className="bg-zinc-900/10 border border-zinc-900/30 border-dashed rounded-2xl p-6 text-center space-y-1">
                <p className="text-xs font-semibold text-zinc-400">No memories yet</p>
                <p className="text-[10px] text-zinc-550 font-sans leading-relaxed">
                  Complete plans to build your memory timeline.
                </p>
              </div>
            ) : (
              mappedMemories.slice(0, visibleMemoriesCount).map((memory) => (
                <motion.div 
                  key={memory.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    if (memory.plan) {
                      setSelectedMemoryPlanId(memory.plan.id);
                    }
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#09090B]/40 border border-white/[0.03] flex items-center justify-between text-left hover:border-white/[0.1] hover:bg-[#09090B]/80 cursor-pointer active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-base w-7.5 h-7.5 rounded-lg bg-zinc-950/40 border border-white/[0.02] flex items-center justify-center">
                      {memory.emoji}
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-[12px] text-white tracking-tight leading-tight">
                        {memory.title}
                      </h4>
                      <span className="text-[9.5px] text-zinc-500 font-medium leading-none block mt-0.5">
                        {memory.type}
                      </span>
                      <span className="text-[8.5px] text-zinc-600 font-normal leading-none block mt-1">
                        {memory.date}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className={`text-[8px] font-sans font-semibold uppercase tracking-widest block ${memory.colorClass || 'text-zinc-400'}`}>
                      {memory.outcome}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Load More Button */}
          {visibleMemoriesCount < mappedMemories.length && (
            <div className="flex justify-center mt-5">
              <button
                type="button"
                onClick={() => setVisibleMemoriesCount(prev => prev + 5)}
                className="py-2 px-5 rounded-full border border-white/[0.04] bg-[#0A0A0C]/30 text-zinc-400 hover:text-[#DF8C6B] hover:border-[#DF8C6B]/20 active:scale-95 transition text-[9px] font-mono tracking-widest uppercase cursor-pointer"
              >
                View More Memories
              </button>
            </div>
          )}
        </div>

      </div>

      {/* --- ALL INTERACTIVE OVERLAYS / SHEET DRAWER SLIDERS --- */}
      <AnimatePresence>
        
        {/* 1. EDIT PROFILE BOTTOM SHEET */}
        {activeSheet === 'editProfile' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-45 flex flex-col justify-end">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full bg-[#08080A] border-t border-white/10 rounded-t-[28px] p-6 space-y-5 shadow-2xl relative overflow-y-auto max-h-[85%] pb-10"
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-1.5 mb-2"></div>
              
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <h3 className="font-sans font-bold text-base text-white">Edit Profile</h3>
                  <p className="text-zinc-500 text-[11px]">Customize your public coordinate presentation.</p>
                </div>
                <button 
                  onClick={() => setActiveSheet(null)}
                  className="w-7 h-7 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 pt-1 text-left">

                {/* Profile Photo Picker */}
                <div className="flex flex-col items-center pb-2">
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3 font-bold w-full text-center">Profile Photo</label>
                  <div
                    onClick={() => !avatarUploading && document.getElementById('edit_profile_avatar_input')?.click()}
                    className={`relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#FF6B2C]/40 cursor-pointer transition-all duration-300 ${avatarUploading ? 'opacity-60 cursor-wait' : 'hover:border-[#FF6B2C]'}`}
                  >
                     <UserAvatar
                       src={tempImage}
                       alt="Profile"
                       size="w-full h-full"
                       className="transition-opacity duration-300"
                     />
                    {avatarUploading ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <input
                    id="edit_profile_avatar_input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleEditAvatarChange}
                  />
                  {avatarUploadError && (
                    <p className="text-[10px] text-[#FF6B2C] mt-1.5 text-center">{avatarUploadError}</p>
                  )}
                  <p className="text-[9.5px] text-zinc-600 mt-1.5">Tap to change photo</p>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 font-bold">Display Name</label>
                  <input 
                    type="text" 
                    required
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full bg-[#0D0D10] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-[#FF6B2C]/40 transition font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 font-bold">Bio</label>
                  <textarea 
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    rows={2}
                    placeholder="What's your vibe?"
                    className="w-full bg-[#0D0D10] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-[#FF6B2C]/40 transition resize-none"
                  />
                </div>

                <div className="pt-3">
                  <button 
                    type="submit"
                    disabled={editSaving || avatarUploading}
                    className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-3.5 rounded-xl font-bold text-xs tracking-wide transition shadow-lg shadow-[#FF6B2C]/10 active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {editSaving ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 2. ACCOUNT SHEET */}
        {activeSheet === 'account' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-45 flex flex-col justify-end" onClick={() => setActiveSheet(null)}>
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full bg-[#08080A] border-t border-white/10 rounded-t-[28px] p-6 space-y-4 shadow-2xl relative max-h-[80%] pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-1.5 mb-2"></div>
              
              <div className="flex justify-between items-center mb-1 text-left">
                <div>
                  <h3 className="font-sans font-bold text-base text-white">Account Details</h3>
                  <p className="text-zinc-500 text-[11px]">System registry identity information.</p>
                </div>
                <button 
                  onClick={() => setActiveSheet(null)}
                  className="w-7 h-7 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-left pt-2 font-sans">
                <div className="bg-[#0D0D10] border border-white/[0.03] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">Primary Handle</span>
                    <span className="text-xs font-semibold text-zinc-200 font-mono">@{currentUser?.username || activeUserId || "user"}</span>
                  </div>
                  <Check className="w-4 h-4 text-[#FF6B2C]" />
                </div>

                <div className="bg-[#0D0D10] border border-white/[0.03] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">Verified Phone</span>
                    <span className="text-xs font-semibold text-zinc-300">{userProfile?.phone || "+91 90002 00001"}</span>
                  </div>
                  <span className="text-[9px] font-mono bg-green-500/10 text-green-400 px-2 py-0.5 border border-green-500/20 rounded">VERIFIED</span>
                </div>

                <div className="bg-[#0D0D10] border border-white/[0.03] p-4 rounded-xl">
                  <span className="block text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">Planless Member ID</span>
                  <span className="text-[10px] font-semibold text-zinc-400 font-mono tracking-wider break-all">{activeUserId}_VERIFIED_SEC_SSL</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSheet('editProfile');
                  }}
                  className="w-full bg-[#111] hover:bg-zinc-900 text-zinc-300 py-3 rounded-xl border border-white/5 font-semibold text-xs transition active:scale-98 cursor-pointer mt-2"
                >
                  Edit profile credentials
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 3. NOTIFICATIONS SHEET */}
        {activeSheet === 'notifications' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-45 flex flex-col justify-end" onClick={() => setActiveSheet(null)}>
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full bg-[#08080A] border-t border-white/10 rounded-t-[28px] p-6 space-y-4 shadow-2xl relative max-h-[85%] pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-1.5 mb-2"></div>
              
              <div className="flex justify-between items-center mb-2 text-left">
                <div>
                  <h3 className="font-sans font-bold text-base text-white">Notifications</h3>
                  <p className="text-zinc-500 text-[11px]">Coordinate alert trigger settings.</p>
                </div>
                <button 
                  onClick={() => setActiveSheet(null)}
                  className="w-7 h-7 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-left pt-1">
                {/* Switch Item 1 */}
                <div className="flex items-center justify-between p-4 bg-[#0D0D10] border border-white/[0.03] rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-zinc-200 block">Instant Widget Push</span>
                    <span className="text-[10px] text-zinc-500 block leading-snug">Spontaneous requests trigger immediately.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setPushEnabled(!pushEnabled);
                      showToast(`Push alerts ${!pushEnabled ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${pushEnabled ? 'bg-[#FF6B2C]' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${pushEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch Item 2 */}
                <div className="flex items-center justify-between p-4 bg-[#0D0D10] border border-white/[0.03] rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-zinc-200 block">SMS Coordinate Falls</span>
                    <span className="text-[10px] text-zinc-500 block leading-snug">SMS fallback coordinates on offline plans.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setSmsFallback(!smsFallback);
                      showToast(`SMS fallback ${!smsFallback ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${smsFallback ? 'bg-[#FF6B2C]' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${smsFallback ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch Item 3 */}
                <div className="flex items-center justify-between p-4 bg-[#0D0D10] border border-white/[0.03] rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-zinc-200 block">Custom Sound Widget</span>
                    <span className="text-[10px] text-zinc-500 block leading-snug">Premium synthesizer playbacks on join.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setSoundFeedback(!soundFeedback);
                      showToast(`Premium sound ${!soundFeedback ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${soundFeedback ? 'bg-[#FF6B2C]' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${soundFeedback ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch Item 4 */}
                <div className="flex items-center justify-between p-4 bg-[#0D0D10] border border-white/[0.03] rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-zinc-200 block">Haptic Coordinator</span>
                    <span className="text-[10px] text-zinc-500 block leading-snug">Physical phone vibration confirmations.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setHapticsEnabled(!hapticsEnabled);
                      showToast(`Haptic response ${!hapticsEnabled ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${hapticsEnabled ? 'bg-[#FF6B2C]' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${hapticsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. PRIVACY SHEET */}
        {activeSheet === 'privacy' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-45 flex flex-col justify-end" onClick={() => setActiveSheet(null)}>
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full bg-[#08080A] border-t border-white/10 rounded-t-[28px] p-6 space-y-4 shadow-2xl relative max-h-[85%] pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-1.5 mb-2"></div>
              
              <div className="flex justify-between items-center mb-2 text-left">
                <div>
                  <h3 className="font-sans font-bold text-base text-white">Privacy Details</h3>
                  <p className="text-zinc-500 text-[11px]">Coordinate encryption and visibility control.</p>
                </div>
                <button 
                  onClick={() => setActiveSheet(null)}
                  className="w-7 h-7 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-left pt-1 font-sans">
                {/* Switch Item 1 */}
                <div className="flex items-center justify-between p-4 bg-[#0D0D10] border border-white/[0.03] rounded-xl">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-semibold text-zinc-200 block">Private Profile</span>
                    <span className="text-[10px] text-zinc-500 block leading-snug">Only explicit circle members see your plans.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsPrivate(!isPrivate);
                      showToast(`Profile private ${!isPrivate ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${isPrivate ? 'bg-[#FF6B2C]' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${isPrivate ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch Item 2 */}
                <div className="flex items-center justify-between p-4 bg-[#0D0D10] border border-white/[0.03] rounded-xl">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-semibold text-zinc-200 block">Show Current Status</span>
                    <span className="text-[10px] text-zinc-500 block leading-snug">Exposes live status state.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowStatus(!showStatus);
                      showToast(`Status visibility ${!showStatus ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${showStatus ? 'bg-[#FF6B2C]' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${showStatus ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch Item 3 */}
                <div className="flex items-center justify-between p-4 bg-[#0D0D10] border border-white/[0.03] rounded-xl">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-semibold text-zinc-200 block">Circle Index Searchable</span>
                    <span className="text-[10px] text-zinc-500 block leading-snug">Allow close friends to discover you via search.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setAllowSearch(!allowSearch);
                      showToast(`Search discovery ${!allowSearch ? 'enabled' : 'disabled'}`);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${allowSearch ? 'bg-[#FF6B2C]' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${allowSearch ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-xl flex gap-3 text-[10px] text-zinc-500 leading-normal">
                  <Shield className="w-4.5 h-4.5 text-[#FF6B2C] flex-shrink-0" />
                  <span>Your physical coordinates and spontaneity metrics are protected under client encryption keys.</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 5. PAYMENTS SHEET */}
        {activeSheet === 'payments' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-45 flex flex-col justify-end" onClick={() => setActiveSheet(null)}>
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full bg-[#08080A] border-t border-white/10 rounded-t-[28px] p-6 space-y-4 shadow-2xl relative max-h-[85%] pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-1.5 mb-2"></div>
              
              <div className="flex justify-between items-center mb-1 text-left">
                <div>
                  <h3 className="font-sans font-bold text-base text-white">Payment Registry</h3>
                  <p className="text-zinc-500 text-[11px]">Premium membership and automated billing.</p>
                </div>
                <button 
                  onClick={() => setActiveSheet(null)}
                  className="w-7 h-7 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mock Credit Card styled with subtle glassmorphism */}
              <div className="relative overflow-hidden w-full h-[155px] rounded-2xl bg-gradient-to-br from-[#121217] via-[#1E110A] to-[#160B05] border border-white/10 p-5 shadow-xl flex flex-col justify-between text-left select-none">
                <div className="absolute top-[-10%] right-[-10%] w-[120px] h-[120px] bg-[#FF4F00]/10 blur-xl rounded-full"></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9.5px] font-mono text-[#FF8C39] font-bold uppercase tracking-wider block">Planless Priority Membership</span>
                    <span className="text-xs text-zinc-400 mt-0.5 block flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF6B2C]" /> Active VIP Coordinator
                    </span>
                  </div>
                  <div className="font-sans italic font-extrabold text-[15px] tracking-wider text-white">VISA</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-mono tracking-[0.2em] text-white">••••  ••••  ••••  9021</div>
                  <div className="flex justify-between items-end text-[9px] font-mono text-zinc-550 uppercase">
                    <div>
                      <span className="block text-[7.5px] text-zinc-600">Card Holder</span>
                      <span className="text-zinc-300 font-semibold">{userProfile?.name || "User"}</span>
                    </div>
                    <div>
                      <span className="block text-[7.5px] text-zinc-650">Expires</span>
                      <span className="text-zinc-300 font-semibold">12 / 29</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and transaction logs */}
              <div className="space-y-2 text-left pt-1">
                <div className="flex items-center justify-between py-2 text-xs border-b border-white/[0.04]">
                  <span className="text-zinc-500">Tier Tier:</span>
                  <span className="font-semibold text-white">Tier Premium Member ($0.00 / Lifetime)</span>
                </div>
                <div className="flex items-center justify-between py-2 text-xs border-b border-white/[0.04]">
                  <span className="text-zinc-500">Wallet Balance:</span>
                  <span className="font-semibold text-zinc-300">₹{walletBalance}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-xs border-b border-white/[0.04]">
                  <span className="text-zinc-500">Upcoming Bill:</span>
                  <span className="font-semibold text-zinc-300">Lifetime access. No charges scheduled.</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 6. LOGOUT MODAL OVERLAY */}
        {activeSheet === 'logout' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setActiveSheet(null)}>
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-[280px] bg-[#0A0A0C] border border-white/10 rounded-2xl p-5 text-center shadow-2xl relative select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-[#FF4F00]/10 border border-[#FF4F00]/20 flex items-center justify-center text-[#FF4F00] mx-auto mb-3.5">
                <LogOut className="w-5 h-5 ml-0.5" />
              </div>
              
              <h3 className="font-sans font-bold text-base text-white mb-1.5">Sign Out?</h3>
              <p className="text-zinc-550 text-xs leading-normal mb-5">
                Are you sure you want to end your current spontaneous plan-making session?
              </p>

              <div className="flex gap-2.5">
                <button 
                  onClick={() => setActiveSheet(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-white/5 text-zinc-350 hover:text-white font-semibold text-xs tracking-wide transition active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setActiveSheet(null);
                    showToast('Switching profile sessions... Bye! 👋');
                    setTimeout(() => {
                      onLogout();
                    }, 500);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#D95A23] hover:bg-[#FF6B2C] text-white font-semibold text-xs tracking-wide transition active:scale-95 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
};
