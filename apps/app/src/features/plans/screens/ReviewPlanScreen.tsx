import React from 'react';
import { ChevronRight, Link, CheckCircle, Users, Clock, Hourglass, MapPin, IndianRupee, Plus, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlansStore } from '../state/PlansContext';
import { useCirclesStore } from '../../circles/state/CirclesContext';
import { useProfileStore } from '../../profile/state/ProfileContext';
import { useToast } from '../../../shared/contexts/ToastContext';
import { formatDateTimeStandard } from '../../../shared/components/NativeDateTimeField';
import { getCategoryImage } from '../../create/utils/constants';
import { getOrCreatePlanInvite, buildInviteUrl } from '../services/planInviteService';
import { Plan, NotificationItem } from '../../../core/types';
import { UserAvatar } from '../../../shared/components/UserAvatar';
import { supabase } from '../../../lib/supabaseClient';

interface ReviewPlanScreenProps {
  form: any;
  selectedCategory: 'sports' | 'movies' | 'dining' | 'custom';
  selectedSubcategory: 'football' | 'badminton' | null;
  setActiveTab: (tab: "home" | "plans" | "create" | "circles" | "wallet" | "profile") => void;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  onEditSection: (step: number) => void;
  onResetWizard: () => void;
  onPlanCreated?: (planUuid: string) => void;
  onCancel: () => void;
}

export const ReviewPlanScreen: React.FC<ReviewPlanScreenProps> = ({
  form,
  selectedCategory,
  selectedSubcategory,
  setActiveTab,
  notifications,
  setNotifications,
  onEditSection,
  onResetWizard,
  onPlanCreated,
  onCancel,
}) => {
  const { showToast } = useToast();
  const { createPlan, setDbPlans, setDbPlanParticipants } = usePlansStore();
  const { circles, setCircles } = useCirclesStore();
  const { userProfile } = useProfileStore();

  const [titleTouched, setTitleTouched] = React.useState(false);
  const [isParticipantsExpanded, setIsParticipantsExpanded] = React.useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = React.useState(false);
  const [postedPlanUuid, setPostedPlanUuid] = React.useState<string | null>(null);
  const [isCopying, setIsCopying] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  const isTitleEmpty = !form.localTitle.trim();
  const showValidationError = isTitleEmpty && (titleTouched || attemptedSubmit);

  const handleHostPlanSubmit = async () => {
    if (form.isSubmitting) return;
    form.setIsSubmitting(true);

    if (!form.userProfile) {
      showToast("User profile session is not active. Onboard first.");
      form.setIsSubmitting(false);
      return;
    }

    const now = new Date();
    if (form.eventDateTime < now) {
      showToast("Event time cannot be in the past.");
      form.setIsSubmitting(false);
      return;
    }

    if (!form.localTitle.trim()) {
      showToast("Plan title is required");
      form.setIsSubmitting(false);
      return;
    }

    const titleToUse = form.localTitle.trim();
    const locationToUse = (form.localLocation || "TBD Meetup Location").trim();
    const timeToUse = formatDateTimeStandard(form.eventDateTime);
    const planId = `p_${Date.now()}`;
    const coverUrl = form.customCoverImage || getCategoryImage(selectedCategory, selectedSubcategory);

    const matchedCircleObj = circles.find((c) => form.selectedCircles.includes(c.id));
    const circleUuid = matchedCircleObj?.dbUuid || null;
    const parsedIsoDateTime = form.eventDateTime.toISOString();

    let hoursOffset = 12;
    if (form.rsvpDeadline === '1 hour before') hoursOffset = 1;
    else if (form.rsvpDeadline === '3 hours before') hoursOffset = 3;
    else if (form.rsvpDeadline === '6 hours before') hoursOffset = 6;
    else if (form.rsvpDeadline === '12 hours before') hoursOffset = 12;
    else if (form.rsvpDeadline === '24 hours before') hoursOffset = 24;

    const deadlineDate = new Date(form.eventDateTime);
    if (form.rsvpDeadline === 'Custom' && form.customDeadline) {
      deadlineDate.setTime(form.customDeadline.getTime());
    } else {
      deadlineDate.setHours(deadlineDate.getHours() - hoursOffset);
    }

    if (deadlineDate < new Date(Date.now() - 10000)) {
      showToast("The RSVP deadline must be before the Plan time and cannot be in the past.");
      form.setIsSubmitting(false);
      return;
    }

    if (deadlineDate >= form.eventDateTime) {
      showToast("The RSVP deadline must be before the Plan time and cannot be in the past.");
      form.setIsSubmitting(false);
      return;
    }

    const responseDeadlineAt = deadlineDate.toISOString();
    const divisor = form.totalCapacity;
    const perPerson = form.costAmount > 0 && divisor > 0 ? Math.ceil(form.costAmount / divisor) : 0;

    const created: Plan = {
      id: planId,
      title: titleToUse.toUpperCase(),
      category: selectedCategory === "dining" ? "restaurants" : selectedCategory,
      date: "TODAY",
      time: timeToUse,
      location: locationToUse,
      cost: perPerson,
      confirmedCount: 1,
      coverImage: coverUrl,
      creatorId: form.activeUserId,
      creatorName: form.userProfile.name,
      creatorAvatar: form.userProfile.avatar,
      members: [
        {
          userId: form.activeUserId,
          name: form.userProfile.name,
          avatar: form.userProfile.avatar,
          joinState: "going",
          reminderState: "none",
          joinedAt: new Date().toISOString(),
          checkedIn: true,
        },
      ],
      joinedUsers: [
        {
          userId: form.activeUserId,
          name: form.userProfile.name,
          avatar: form.userProfile.avatar,
          joinState: "going",
          reminderState: "none",
          joinedAt: new Date().toISOString(),
          checkedIn: true,
        },
      ],
      timeline: "today",
      description: form.quickNote.trim() || `Spontaneous coordination thread for ${titleToUse}`,
      circleId: form.selectedCircles[0] || null,
      hostId: form.activeUserId,
      groupId: form.selectedCircles[0] || null,
      paymentAmount: perPerson,
      status: "LIVE",
      createdAt: new Date().toISOString(),
      waitlistEnabled: form.waitlistEnabled,
      joinLimit: form.waitlistEnabled ? form.waitlistCapacity : form.totalInvitedCount || undefined,
      capacity: form.waitlistEnabled ? form.waitlistCapacity + 1 : form.totalCapacity,
      waitlistUsers: [],
      interestedUsers: [],
      response_cutoff_hours: hoursOffset,
      response_deadline_at: responseDeadlineAt,
    };

    const dbCategory = selectedCategory.toUpperCase();
    const dbSubcategory = selectedSubcategory ? selectedSubcategory.toUpperCase() : "OTHER";

    const newDbPlan = {
      public_id: planId,
      host_id: form.userProfile.dbUuid,
      category: dbCategory,
      subcategory: dbSubcategory,
      title: created.title,
      description: form.quickNote.trim() || `Coordination thread: ${created.title}`,
      place_id: "TBD",
      place_name: locationToUse,
      place_address: locationToUse,
      scheduled_at: parsedIsoDateTime,
      rsvp_deadline: responseDeadlineAt,
      max_participants: form.waitlistEnabled
        ? form.totalCapacity
        : form.totalInvitedCount > 0 ? form.totalCapacity : null,
      total_cost: form.costAmount,
      cover_image: coverUrl,
      status: "LIVE" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Log the plan payload and input parameters before performing the insert
    console.log("[ReviewPlanScreen Submit] Preparing to insert plan:", {
      planPayload: newDbPlan,
      selectedCircles: form.selectedCircles,
      selectedFriends: form.selectedFriends,
      userProfile: form.userProfile
    });

    try {
      const { dbPlanRow, dbPartRow, inviteeUuids, hostRespondedAt } = await createPlan(
        newDbPlan,
        form.selectedCircles,
        form.selectedFriends,
        form.userProfile,
        titleToUse
      );

      console.log("[ReviewPlanScreen Submit] Success! Inserted plan row:", dbPlanRow);

      const matchedCircleId = form.selectedCircles[0] || null;
      if (matchedCircleId) {
        setCircles((prev) =>
          prev.map((c) =>
            c.id === matchedCircleId
              ? { ...c, lastSpontaneousActivity: `Spawned ${titleToUse} just now` }
              : c
          )
        );
      }

      const newNotif: NotificationItem = {
        id: `n_${Date.now()}`,
        type: "general",
        title: `You spawned "${titleToUse}" at ${locationToUse}`,
        relativeTime: "1s",
      };
      setNotifications([newNotif, ...notifications]);

      onPlanCreated?.(planId);
    } catch (err: any) {
      // Print one structured error with the relevant payload instead of multiple repeated logs
      console.error("[ReviewPlanScreen Submit] FAILED:", {
        message: err.message || "Unknown error",
        error: err,
        planPayload: newDbPlan,
        selectedCircles: form.selectedCircles,
        selectedFriends: form.selectedFriends
      });
      showToast(err.message || "Failed to post plan");
    } finally {
      form.setIsSubmitting(false);
    }
  };

  const onPostClick = () => {
    setAttemptedSubmit(true);
    if (isTitleEmpty) {
      showToast("Plan title is required");
      return;
    }
    handleHostPlanSubmit();
  };

  const formatCustomDeadline = (date: Date) => {
    if (!date || isNaN(date.getTime())) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
  };

  const hasCost = form.costAmount > 0;
  const hasLocation = form.localLocation && form.localLocation.trim().length > 0;
  const hasNote = form.quickNote && form.quickNote.trim().length > 0;

  const deadlineDisplayValue = form.rsvpDeadline === 'Custom'
    ? formatCustomDeadline(form.customDeadline)
    : form.rsvpDeadline.replace('before', 'before the plan');

  const divisor = form.totalCapacity;
  const perPerson = form.costAmount > 0 && divisor > 0 ? (form.costAmount / divisor) : 0;

  const selectedCircleName = React.useMemo(() => {
    if (form.selectedCircles && form.selectedCircles.length > 0) {
      const circleObj = circles.find(c => c.id === form.selectedCircles[0] || c.circle_id === form.selectedCircles[0]);
      if (circleObj) return circleObj.name;
    }
    return "MEETUP";
  }, [form.selectedCircles, circles]);

  const formattedDateAndTime = React.useMemo(() => {
    if (!form.eventDateTime || isNaN(form.eventDateTime.getTime())) return '';
    const optionsDate: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    const optionsTime: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const dateStr = form.eventDateTime.toLocaleDateString('en-US', optionsDate);
    const timeStr = form.eventDateTime.toLocaleTimeString('en-US', optionsTime);
    return `${dateStr} • ${timeStr}`;
  }, [form.eventDateTime]);

  const participantAvatars = React.useMemo(() => {
    const list = [{ name: userProfile?.name || 'You', avatar: userProfile?.avatarUrl || userProfile?.avatar || '' }];
    if (form.selectedFriends && form.selectedFriends.length > 0) {
      form.selectedFriends.forEach((friend: any) => {
        list.push({
          name: friend.name || friend.username || 'Friend',
          avatar: friend.avatarUrl || friend.avatar_url || friend.avatar || ''
        });
      });
    }
    return list;
  }, [form.selectedFriends, userProfile]);

  const selectedCircleObj = React.useMemo(() => {
    if (form.selectedCircles && form.selectedCircles.length > 0) {
      return circles.find(
        (c) => c.id === form.selectedCircles[0] || c.circle_id === form.selectedCircles[0]
      );
    }
    return null;
  }, [form.selectedCircles, circles]);

  const [showImageDialog, setShowImageDialog] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenImageDialog = () => {
    setShowImageDialog(true);
  };

  const handleUseDefaultImage = () => {
    form.setCustomCoverImage(null);
    setShowImageDialog(false);
    showToast("Using default cover image");
  };

  const handleUseGroupPhoto = () => {
    const circlePhoto = selectedCircleObj?.groupPhoto || selectedCircleObj?.groupImage || selectedCircleObj?.cover_image || (selectedCircleObj as any)?.coverImage;
    if (circlePhoto) {
      form.setCustomCoverImage(circlePhoto);
      showToast("Using group photo");
    } else {
      showToast("No photo found for this circle");
    }
    setShowImageDialog(false);
  };

  const handleChooseCustomImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        showToast("Unsupported file type. Please upload JPG, PNG, or WEBP.");
        return;
      }

      showToast("Uploading cover image...");
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const userUuid = form.userProfile?.dbUuid || form.activeUserId;
        if (!userUuid) {
          throw new Error("User UUID not found for upload path");
        }
        const fileName = `${userUuid}/plan_cover_${Date.now()}.${fileExt}`;
        
        const { data, error: uploadErr } = await supabase.storage
          .from("profile-images")
          .upload(fileName, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadErr || !data) {
          throw new Error(uploadErr?.message || "Upload failed");
        }

        const { data: { publicUrl } } = supabase.storage
          .from("profile-images")
          .getPublicUrl(data.path);

        form.setCustomCoverImage(publicUrl);
        showToast("Cover image updated successfully!");
      } catch (err: any) {
        console.error("Error uploading cover image:", err);
        showToast("Failed to upload image. Please try again.");
      }
    }
    setShowImageDialog(false);
  };

  const hasParticipants = form.selectedFriends.length > 0 || form.selectedCircles.length > 0;

  return (
    <div className="flex flex-col h-full bg-[#050505] text-left relative overflow-hidden">

      {/* ── 1. Hero Cover Image ── compact 28vh ── */}
      <div className="relative shrink-0 overflow-hidden flex flex-col justify-end" style={{ height: '28vh', minHeight: 160 }}>
        <img
          src={form.customCoverImage || getCategoryImage(selectedCategory, selectedSubcategory)}
          alt="Preview cover"
          className="absolute inset-0 w-full h-full object-cover brightness-[0.70] contrast-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-0" />

        {/* Close (X) */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition shadow-lg z-10 cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Camera / Edit Cover */}
        <button
          type="button"
          onClick={handleOpenImageDialog}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition shadow-lg z-10 cursor-pointer"
          title="Change Cover"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Title + Host overlaid at bottom of image */}
        <div className="px-5 pb-4 z-10 w-full relative space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-0.5 rounded-full text-[9px] font-sans font-black text-white/90 tracking-[0.14em] uppercase shadow-sm select-none">
              {selectedCircleName.toUpperCase()}
            </span>
          </div>

          {/* Editable Title */}
          <input
            type="text"
            value={form.localTitle}
            onChange={(e) => form.setLocalTitle(e.target.value)}
            onBlur={() => setTitleTouched(true)}
            placeholder="Name your plan..."
            className="font-sans font-black text-[26px] text-white tracking-tight leading-none bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full placeholder-white/30 text-left"
          />
          {showValidationError && (
            <p className="text-red-500 text-[10px] font-semibold text-left animate-fade-in">
              Plan title is required
            </p>
          )}

          {/* Hosted By — fades out once participants added */}
          <AnimatePresence initial={false}>
            {!hasParticipants && (
              <motion.div
                key="hosted-by-badge"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => onEditSection(2)}
                title="Add participants"
              >
                <UserAvatar
                  src={userProfile?.avatar || userProfile?.avatarUrl}
                  alt={userProfile?.name || "Host"}
                  size="w-5 h-5"
                  className="border border-white/20 shadow-md"
                />
                <span className="text-[11px] text-zinc-300 font-medium">
                  Hosted by <strong className="text-white font-semibold">{userProfile?.name || "You"}</strong>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── 2. Participants Toggle Bar (slides in above rows when filled) ── */}
      <AnimatePresence initial={false}>
        {hasParticipants && (
          <motion.div
            key="participants-toggle-bar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="mx-4 mt-2.5 shrink-0 z-10 relative"
          >
            <motion.div
              onClick={() => setIsParticipantsExpanded(v => !v)}
              className="select-none cursor-pointer overflow-hidden rounded-[20px] px-4 pt-2.5 pb-2.5 border"
              style={{
                background: 'rgba(8, 8, 8, 0.72)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderColor: 'rgba(255, 255, 255, 0.06)',
              }}
              animate={{ height: isParticipantsExpanded ? 'auto' : 76 }}
              transition={{ type: 'spring', damping: 19, stiffness: 200 }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-full ring-2 ring-black/75 overflow-hidden bg-zinc-800 flex-shrink-0">
                    <UserAvatar
                      src={userProfile?.avatar || userProfile?.avatarUrl}
                      alt={userProfile?.name || 'You'}
                      size="w-8 h-8"
                    />
                  </div>
                  <div className="flex flex-col text-left justify-center">
                    <span className="text-zinc-400 font-bold text-[9px] uppercase tracking-wider leading-none mb-0.5 select-none">HOSTED BY</span>
                    <span className="text-white font-semibold text-[13px] tracking-tight leading-none">{userProfile?.name || 'You'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <AnimatePresence initial={false} mode="popLayout">
                    {!isParticipantsExpanded && (
                      <motion.span
                        key="invited-count"
                        initial={{ opacity: 0, x: 4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 4 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        className="text-[11px] text-zinc-400 font-medium select-none whitespace-nowrap"
                      >
                        +{form.selectedFriends.length} Invited
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <motion.span
                    animate={{ rotate: isParticipantsExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="text-[10px] text-zinc-400 select-none font-bold pr-0.5 inline-block"
                  >
                    ▼
                  </motion.span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full rounded-full overflow-hidden mt-2" style={{ height: '7px', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                <div
                  className="h-full bg-[#FF6B2C] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,107,44,0.55)]"
                  style={{ width: `${Math.min(100, Math.round(((form.selectedFriends.length + 1) / Math.max(form.totalCapacity || 10, 1)) * 100))}%` }}
                />
              </div>

              {/* Expandable list */}
              <AnimatePresence initial={false}>
                {isParticipantsExpanded && (
                  <motion.div
                    key="draft-participants-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.02 } }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    className="overflow-hidden text-left"
                  >
                    <div className="text-[9.5px] font-sans font-black tracking-[0.14em] text-zinc-500 uppercase mt-3 mb-1 px-0.5 select-none">Participants</div>
                    <div className="w-full h-px bg-white/[0.06] mb-1.5" />
                    <div
                      className="max-h-[120px] overflow-y-auto scrollbar-none space-y-0.5 pr-1 select-text"
                      onPointerDown={e => e.stopPropagation()} onPointerMove={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}
                      onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}
                      onWheel={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between py-1 px-0.5 rounded-lg">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar src={userProfile?.avatar || userProfile?.avatarUrl} alt={userProfile?.name || 'You'} size="w-4.5 h-4.5" className="border border-white/10" />
                          <span className="font-sans text-[12px] text-white/95 font-medium leading-none truncate">{userProfile?.name || 'You'}</span>
                        </div>
                        <span className="text-[8px] font-sans font-bold tracking-wider px-1.5 py-1 rounded-[4px] uppercase flex-shrink-0 leading-none bg-emerald-500/20 text-emerald-350 border border-emerald-500/30">JOINED</span>
                      </div>
                      {form.selectedFriends.map((friend: any, idx: number) => (
                        <div key={friend.id || friend.user_id || idx} className="flex items-center justify-between py-1 px-0.5 hover:bg-white/[0.02] rounded-lg transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar src={friend.avatar || friend.avatar_url || friend.avatarUrl || friend.profile_photo} alt={friend.name || friend.full_name || 'Friend'} size="w-4.5 h-4.5" className="border border-white/10" />
                            <span className="font-sans text-[12px] text-white/95 font-medium leading-none truncate">{friend.name || friend.full_name || friend.username || 'Friend'}</span>
                          </div>
                          <span className="text-[8px] font-sans font-bold tracking-wider px-1.5 py-1 rounded-[4px] uppercase flex-shrink-0 leading-none bg-white/10 text-white/90 border border-white/20">INVITED</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/[0.04]" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => { setIsParticipantsExpanded(false); onEditSection(2); }}
                        className="w-full py-1.5 px-4 rounded-[10px] bg-white/[0.06] hover:bg-white/[0.10] text-white/80 text-[11px] font-sans font-black tracking-[0.12em] uppercase transition-all duration-200 text-center cursor-pointer"
                      >
                        Edit Participants
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. Detail rows — justify-between fills all remaining height ── */}
      <div className="flex-1 px-5 pt-1 pb-1 flex flex-col justify-between min-h-0">

        {/* Participants empty state */}
        {!hasParticipants && (
          <div className="flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <Users className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[12px] font-sans font-medium text-zinc-500">Who's coming?</span>
            </div>
            <button
              type="button"
              onClick={() => onEditSection(2)}
              className="text-[#FF6B2C] hover:text-[#FF8552] text-[11px] font-semibold uppercase tracking-wider transition cursor-pointer select-none bg-transparent border-none p-0"
            >
              + Add
            </button>
          </div>
        )}

        {/* Date & Time */}
        <div
          onClick={() => onEditSection(1)}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition text-left"
        >
          <Clock className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className={`text-[13px] font-semibold leading-tight truncate ${formattedDateAndTime ? 'text-zinc-150' : 'text-white/30'}`}>
              {formattedDateAndTime || 'Select date & time'}
            </span>
            <span className="text-[9px] text-zinc-600 font-sans tracking-wide">
              {formattedDateAndTime ? 'TIMING' : 'Choose when everyone meets.'}
            </span>
          </div>
        </div>

        <div className="h-px bg-white/[0.04]" />

        {/* Location */}
        <div
          onClick={() => onEditSection(0)}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition text-left"
        >
          <MapPin className="w-3.5 h-3.5 text-[#FF6B2C] flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className={`text-[13px] font-semibold leading-tight truncate ${hasLocation ? 'text-zinc-150' : 'text-white/30'}`}>
              {hasLocation ? form.localLocation : 'Add location'}
            </span>
            <span className="text-[9px] text-zinc-600 font-sans tracking-wide">
              {hasLocation ? 'LOCATION' : 'Choose where everyone meets.'}
            </span>
          </div>
        </div>

        <div className="h-px bg-white/[0.04]" />

        {/* Cost */}
        <div
          onClick={() => onEditSection(3)}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition text-left opacity-90"
        >
          <IndianRupee className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className={`text-[12px] font-semibold leading-tight truncate ${hasCost ? 'text-zinc-300' : 'text-zinc-500'}`}>
              {hasCost ? `₹${perPerson.toFixed(2)} per person` : 'Add cost (Optional)'}
            </span>
            <span className="text-[9px] text-zinc-600 font-sans tracking-wide">
              {hasCost ? 'COST' : 'Split expenses if needed.'}
            </span>
          </div>
        </div>

        <div className="h-px bg-white/[0.04]" />

        {/* RSVP Deadline */}
        <div
          onClick={() => onEditSection(1)}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition text-left opacity-90"
        >
          <Hourglass className="w-3.5 h-3.5 text-rose-500/80 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className={`text-[12px] font-semibold leading-tight truncate ${form.rsvpDeadline ? 'text-zinc-300' : 'text-zinc-500'}`}>
              {form.rsvpDeadline ? deadlineDisplayValue : 'Choose RSVP deadline'}
            </span>
            <span className="text-[9px] text-zinc-600 font-sans tracking-wide">
              {form.rsvpDeadline ? 'RSVP DEADLINE' : 'Set a cutoff time for responses.'}
            </span>
          </div>
        </div>

        <div className="h-px bg-white/[0.04]" />

        {/* Notes */}
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-zinc-650 font-sans tracking-wide uppercase block mb-0.5">
            {hasNote ? 'Notes (Optional)' : 'Anything everyone should know?'}
          </span>
          <input
            type="text"
            value={form.quickNote}
            onChange={(e) => form.setQuickNote(e.target.value)}
            placeholder="Add a note (Optional)"
            className="bg-transparent text-[12px] text-zinc-300 border-none p-0 focus:outline-none focus:ring-0 w-full placeholder-zinc-600 leading-tight"
          />
        </div>
      </div>


      {/* ── 4. Sticky Create Plan CTA ── */}
      <div className="shrink-0 px-5 py-3 bg-[#050505]/95 backdrop-blur-md border-t border-white/5 z-20">
        <button
          type="button"
          disabled={form.isSubmitting || isTitleEmpty}
          onClick={onPostClick}
          className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-[#050505] py-3.5 rounded-2xl font-bold text-xs tracking-widest uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          {form.isSubmitting ? (
            <span>Creating...</span>
          ) : (
            <>
              <span>Create Plan</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </>
          )}
        </button>
      </div>

      {/* ── Image Selection Dialog ── */}
      {showImageDialog && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-[28px] w-full max-w-[280px] p-5 text-center shadow-2xl relative">
            <h3 className="text-white text-sm font-black uppercase tracking-wider mb-1.5">Customize Cover</h3>
            <p className="text-zinc-400 text-[10.5px] font-semibold mb-4 leading-normal">
              Select how you want to display the plan's cover image.
            </p>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={handleUseDefaultImage} className="w-full bg-[#1A1A22] hover:bg-[#22222E] border border-white/5 text-white py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer">
                Use Default Image
              </button>
              {selectedCircleObj && (
                <button type="button" onClick={handleUseGroupPhoto} className="w-full bg-[#1A1A22] hover:bg-[#22222E] border border-white/5 text-white py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer">
                  Use Group Photo
                </button>
              )}
              <button type="button" onClick={handleChooseCustomImage} className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-[#050505] py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer">
                Choose Custom Image
              </button>
              <button type="button" onClick={() => setShowImageDialog(false)} className="w-full text-zinc-400 hover:text-white py-2 rounded-xl text-xs font-bold transition uppercase tracking-wide mt-1 cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
};
