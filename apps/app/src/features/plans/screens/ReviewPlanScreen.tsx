import React from 'react';
import { ChevronRight, Link, CheckCircle, Users, Clock, Hourglass, MapPin, IndianRupee } from 'lucide-react';
import { usePlansStore } from '../state/PlansContext';
import { useCirclesStore } from '../../circles/state/CirclesContext';
import { useProfileStore } from '../../profile/state/ProfileContext';
import { useToast } from '../../../shared/contexts/ToastContext';
import { formatDateTimeStandard } from '../../../shared/components/NativeDateTimeField';
import { getCategoryImage } from '../../create/utils/constants';
import { getOrCreatePlanInvite, buildInviteUrl } from '../services/planInviteService';
import { Plan, NotificationItem } from '../../../core/types';
import { UserAvatar } from '../../../shared/components/UserAvatar';
import { ParticipantToggleBar } from '../components/ParticipantToggleBar';
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
}) => {
  const { showToast } = useToast();
  const { createPlan, setDbPlans, setDbPlanParticipants } = usePlansStore();
  const { circles, setCircles } = useCirclesStore();
  const { userProfile } = useProfileStore();

  const [titleTouched, setTitleTouched] = React.useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = React.useState(false);
  // Set after plan is successfully created so the invite section can appear
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
    // Cost split divisor: number of people who will pay (non-host capacity)
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
      // joinLimit = non-host spots; capacity = total including host
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
      entry_fee: perPerson,
      cover_image: coverUrl,
      status: "LIVE" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { dbPlanRow, dbPartRow } = await createPlan(
        newDbPlan,
        form.selectedCircles,
        form.selectedFriends,
        form.userProfile,
        titleToUse
      );

      setDbPlans((prev) => [dbPlanRow, ...prev]);
      if (dbPartRow) setDbPlanParticipants((prev) => [dbPartRow, ...prev]);

      const matchedCircleId = form.selectedCircles[0] || null;
      if (matchedCircleId) {
        setCircles((prev) => prev.map((c) => c.id === matchedCircleId ? { ...c, lastSpontaneousActivity: `Spawned ${titleToUse} just now` } : c));
      }

      const newNotif: NotificationItem = {
        id: `n_${Date.now()}`,
        type: "general",
        title: `You spawned "${titleToUse}" at ${locationToUse}`,
        relativeTime: "1s",
      };
      setNotifications([newNotif, ...notifications]);

      form.setIsSubmitting(false);
      showToast("✨ Plan posted successfully!");
      if (onPlanCreated && dbPlanRow) {
        onPlanCreated(dbPlanRow.id);
      }
    } catch (err: any) {
      console.error("[ReviewPlanScreen] Error:", err);
      form.setIsSubmitting(false);
      showToast(`Failed to post plan: ${err.message || "Unknown error"}`);
    }
  };

  const onPostClick = async () => {
    setAttemptedSubmit(true);
    if (isTitleEmpty) {
      return;
    }
    await handleHostPlanSubmit();
  };

  const handleCopyInviteLink = async () => {
    if (!postedPlanUuid || isCopying) return;
    setIsCopying(true);
    try {
      const hostUuid = userProfile?.dbUuid;
      if (!hostUuid) throw new Error("No host UUID");
      const invite = await getOrCreatePlanInvite(postedPlanUuid, hostUuid);
      if (!invite) throw new Error("Failed to get invite");
      const url = buildInviteUrl(invite.invite_token);
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast("Invite link copied!");
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error("[ReviewPlanScreen] Copy invite failed:", err);
      showToast("Failed to copy invite link");
    } finally {
      setIsCopying(false);
    }
  };

  const handleDone = () => {
    onResetWizard();
    setActiveTab("circles");
  };

  const formatCustomDeadline = (date: Date) => {
    if (!date || isNaN(date.getTime())) return '—';
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

  const deadlineDisplayValue = form.rsvpDeadline === 'Custom'
    ? formatCustomDeadline(form.customDeadline)
    : form.rsvpDeadline.replace('before', 'before the plan');

  const divisor = form.totalCapacity;
  const perPerson = form.costAmount > 0 && divisor > 0 ? (form.costAmount / divisor) : 0;

  const getPreviewActivityIcon = () => {
    if (selectedCategory === 'sports') {
      return selectedSubcategory === 'football' ? '⚽' : '🏸';
    }
    if (selectedCategory === 'movies') return '🎬';
    if (selectedCategory === 'dining' || selectedCategory === 'restaurants') return '🍽️';
    return '📅';
  };

  const selectedCircleName = React.useMemo(() => {
    if (form.selectedCircles && form.selectedCircles.length > 0) {
      const circleObj = circles.find(c => c.id === form.selectedCircles[0] || c.circle_id === form.selectedCircles[0]);
      if (circleObj) return circleObj.name;
    }
    return "MEETUP";
  }, [form.selectedCircles, circles]);

  const calendarDay = React.useMemo(() => {
    if (form.eventDateTime) {
      const d = new Date(form.eventDateTime);
      if (!isNaN(d.getTime())) {
        return String(d.getDate());
      }
    }
    return String(new Date().getDate());
  }, [form.eventDateTime]);

  const formattedDateAndTime = React.useMemo(() => {
    if (!form.eventDateTime || isNaN(form.eventDateTime.getTime())) return '—';
    const optionsDate: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    const optionsTime: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const dateStr = form.eventDateTime.toLocaleDateString('en-US', optionsDate);
    const timeStr = form.eventDateTime.toLocaleTimeString('en-US', optionsTime);
    return `${dateStr} • ${timeStr}`;
  }, [form.eventDateTime]);

  const participantAvatars = React.useMemo(() => {
    const list = [{ name: userProfile?.name || 'You', avatar: userProfile?.avatarUrl || '' }];
    if (form.selectedFriends && form.selectedFriends.length > 0) {
      form.selectedFriends.forEach((friend: any) => {
        list.push({
          name: friend.name || friend.username || 'Friend',
          avatar: friend.avatarUrl || friend.avatar_url || ''
        });
      });
    }
    return list;
  }, [form.selectedFriends, userProfile]);

  const mockPlan = React.useMemo<Plan>(() => {
    const hostName = userProfile?.name || 'You';
    const hostAvatar = userProfile?.avatarUrl || userProfile?.avatar || '';

    const membersList = [
      {
        userId: userProfile?.user_id || 'host_id',
        userUuid: userProfile?.dbUuid || 'host_id',
        name: hostName,
        avatar: hostAvatar,
        joinState: 'going'
      }
    ];

    if (form.selectedFriends && form.selectedFriends.length > 0) {
      form.selectedFriends.forEach((friend: any) => {
        membersList.push({
          userId: friend.id || friend.user_id || friend.userId || 'friend_id',
          userUuid: friend.dbUuid || friend.user_id || friend.userId || 'friend_id',
          name: friend.name || friend.username || 'Friend',
          avatar: friend.avatarUrl || friend.avatar_url || friend.avatar || '',
          joinState: 'invited'
        });
      });
    }

    const matchedCircleObj = circles.find((c) => form.selectedCircles.includes(c.id));

    return {
      id: 'draft_preview_id',
      title: form.localTitle.toUpperCase() || 'NEW EVENT',
      category: selectedCategory === "dining" ? "restaurants" : selectedCategory,
      date: 'TODAY',
      time: formattedDateAndTime,
      location: form.localLocation || 'Not set',
      cost: perPerson,
      confirmedCount: 1,
      coverImage: form.customCoverImage || getCategoryImage(selectedCategory, selectedSubcategory),
      creatorId: userProfile?.user_id || 'host_id',
      creatorName: hostName,
      creatorAvatar: hostAvatar,
      members: membersList as any,
      joinedUsers: membersList as any,
      timeline: 'today',
      description: form.quickNote.trim(),
      circleId: form.selectedCircles[0] || null,
      circleName: matchedCircleObj?.name || 'PLANLESS CIRCLE',
      hostId: userProfile?.user_id || 'host_id',
      groupId: form.selectedCircles[0] || null,
      paymentAmount: perPerson,
      status: 'LIVE',
      createdAt: new Date().toISOString(),
      waitlistEnabled: form.waitlistEnabled,
      joinLimit: form.waitlistEnabled ? form.waitlistCapacity : form.totalInvitedCount || undefined,
      capacity: form.waitlistEnabled ? form.waitlistCapacity + 1 : form.totalCapacity,
      waitlistUsers: [],
      interestedUsers: [],
      response_cutoff_hours: 12,
      response_deadline_at: form.eventDateTime ? form.eventDateTime.toISOString() : new Date().toISOString(),
    };
  }, [form.localTitle, form.localLocation, form.costAmount, form.totalCapacity, form.selectedFriends, form.selectedCircles, form.customCoverImage, selectedCategory, selectedSubcategory, userProfile, circles, formattedDateAndTime, perPerson]);

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showImageDialog, setShowImageDialog] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const selectedCircleObj = React.useMemo(() => {
    if (form.selectedCircles && form.selectedCircles.length > 0) {
      return circles.find(
        (c) => c.id === form.selectedCircles[0] || c.circle_id === form.selectedCircles[0]
      );
    }
    return null;
  }, [form.selectedCircles, circles]);

  const handleOpenImageDialog = () => {
    setShowImageDialog(true);
  };

  const handleUseDefaultImage = () => {
    form.setCustomCoverImage(null);
    setShowImageDialog(false);
    showToast("Using default activity cover");
  };

  const handleUseGroupPhoto = () => {
    const circlePhoto = selectedCircleObj?.groupPhoto || selectedCircleObj?.groupImage || selectedCircleObj?.cover_image || (selectedCircleObj as any)?.coverImage;
    if (circlePhoto) {
      form.setCustomCoverImage(circlePhoto);
      showToast("Using group profile photo");
    } else {
      showToast("No profile photo found for this circle");
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
        console.error("Error uploading plan cover image:", err);
        showToast("Failed to upload image. Please try again.");
      }
    }
    setShowImageDialog(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-between h-full bg-[#050505] text-left relative overflow-hidden">
      
      {/* Scrollable content simulating the Detailed Plan card */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-none pb-24"
      >
        {/* Cover image header block */}
        <div 
          onClick={handleOpenImageDialog}
          className="relative h-[225px] shrink-0 w-full overflow-hidden flex flex-col justify-end cursor-pointer group"
        >
          <img 
            src={form.customCoverImage || getCategoryImage(selectedCategory, selectedSubcategory)} 
            alt="Preview cover" 
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.8] contrast-110 group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          {/* Overlay info to hint clicking to edit */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
            <span className="bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-sans font-black text-white tracking-[0.12em] uppercase border border-white/10 shadow-lg">
              Tap to Change Image
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-transparent z-0" />

          {/* Hero Meta Info */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="px-6 pb-4 z-10 w-full relative"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-black/55 backdrop-blur-md px-4.5 py-1.5 rounded-full text-[11px] font-sans font-black text-white tracking-[0.16em] inline-flex items-center justify-center uppercase border border-white/[0.08] shadow-2xl select-none">
                {selectedCircleName.toUpperCase()}
              </span>
              <div className="w-5 h-5 rounded-full bg-black/45 border border-white/10 flex items-center justify-center">
                <span className="text-[11px] leading-none select-none">{getPreviewActivityIcon()}</span>
              </div>
            </div>

            {/* Editable Title input directly within card title hierarchy */}
            <input 
              type="text"
              value={form.localTitle}
              onChange={(e) => form.setLocalTitle(e.target.value)}
              onBlur={() => setTitleTouched(true)}
              placeholder="Tap to add title..."
              className={`font-sans font-black text-[26px] text-white tracking-tight leading-none bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full placeholder-white/40 text-left`}
            />
            {showValidationError && (
              <p className="text-red-500 text-[10px] font-semibold mt-1 text-left animate-fade-in">
                Plan title is required
              </p>
            )}

            {/* Hosted By Mini Badge */}
            <div className="flex items-center gap-2 mt-2">
              <UserAvatar
                src={userProfile?.avatar || userProfile?.avatarUrl}
                alt={userProfile?.name || "Host"}
                size="w-5 h-5"
                className="border border-white/10"
              />
              <span className="text-[11.5px] text-zinc-300 font-medium">
                Hosted by <strong className="text-white font-semibold">{userProfile?.name || "You"}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Notes (About/Description block) */}
        <div className="px-6 py-3.5 bg-[#111115]/30 border border-white/[0.03] rounded-2xl mx-6 mb-2 mt-4 text-left">
          <span className="text-[10px] font-sans font-black tracking-[0.14em] text-zinc-500 uppercase block mb-1">
            Notes (Optional)
          </span>
          <input 
            type="text"
            value={form.quickNote}
            onChange={(e) => form.setQuickNote(e.target.value)}
            placeholder="Add a note for this plan..."
            className="bg-transparent text-[13px] text-zinc-200 border-none p-0 focus:outline-none focus:ring-0 w-full placeholder-zinc-650"
          />
        </div>

        {/* QUICK INFORMATION (Clickable fields that route to Create flow screens) */}
        <div className="px-6 pt-2 space-y-3">
          {/* Timing details -> triggers step 1 */}
          <div 
            onClick={() => onEditSection(1)}
            className="flex items-center gap-3 py-2.5 px-3 bg-[#111115]/30 hover:bg-[#111115]/55 border border-white/[0.02] hover:border-white/5 rounded-2xl transition cursor-pointer text-left"
          >
            <Clock className="w-4.5 h-4.5 text-zinc-400 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[13px] text-white font-semibold leading-tight">
                {formattedDateAndTime}
              </span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">TIMING</span>
            </div>
          </div>

          {/* Cost details -> triggers step 3 */}
          <div 
            onClick={() => onEditSection(3)}
            className="flex items-center gap-3 py-2.5 px-3 bg-[#111115]/30 hover:bg-[#111115]/55 border border-white/[0.02] hover:border-white/5 rounded-2xl transition cursor-pointer text-left"
          >
            <IndianRupee className="w-4.5 h-4.5 text-zinc-400 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[13px] text-white font-semibold leading-tight">
                {form.costAmount > 0 ? `₹${perPerson.toFixed(2)} per person` : 'Free entry'}
              </span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">COST</span>
            </div>
          </div>

          {/* RSVP Deadline details -> triggers step 1 */}
          <div 
            onClick={() => onEditSection(1)}
            className="flex items-center gap-3 py-2.5 px-3 bg-[#111115]/30 hover:bg-[#111115]/55 border border-white/[0.02] hover:border-white/5 rounded-2xl transition cursor-pointer text-left"
          >
            <Hourglass className="w-4.5 h-4.5 text-[#EF4444] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[13px] text-[#EF4444] font-bold leading-tight">
                {deadlineDisplayValue}
              </span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">RSVP DEADLINE</span>
            </div>
          </div>

          {/* Location details -> triggers step 0 */}
          <div 
            onClick={() => onEditSection(0)}
            className="flex items-center gap-3 py-2.5 px-3 bg-[#111115]/30 hover:bg-[#111115]/55 border border-white/[0.02] hover:border-white/5 rounded-2xl transition cursor-pointer text-left"
          >
            <MapPin className="w-4.5 h-4.5 text-[#FF6B2C] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[13px] text-white font-semibold leading-tight">
                {form.localLocation || 'Not set'}
              </span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">LOCATION</span>
            </div>
          </div>
        </div>

        {/* Participant Section Header with edit option */}
        <div className="px-6 mt-4 mb-1.5 flex justify-between items-center text-left">
          <span className="text-[10px] font-sans font-black tracking-[0.14em] text-zinc-550 uppercase">
            Participants
          </span>
          <button 
            type="button"
            onClick={() => onEditSection(2)}
            className="text-[10.5px] text-[#FF6B2C] font-bold uppercase tracking-wider hover:text-[#FF8552]"
          >
            EDIT GUESTS
          </button>
        </div>

        {/* Live replica of the ParticipantToggleBar from the feed */}
        <div className="relative">
          <ParticipantToggleBar
            plan={mockPlan}
            userProfile={userProfile!}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            setSelectedParticipantForActions={() => onEditSection(2)}
          />
        </div>
      </div>

      {/* Floating CTA footer at the bottom of the Review screen */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#050505]/90 backdrop-blur-md border-t border-white/5 z-20 shadow-2xl">
        <button
          type="button"
          disabled={form.isSubmitting || isTitleEmpty}
          onClick={onPostClick}
          className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-[#050505] py-4 rounded-2xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          {form.isSubmitting ? (
            <span>Posting...</span>
          ) : (
            <>
              <span>Post Plan</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </>
          )}
        </button>
      </div>

      {/* Lightweight Image Selection Dialog Overlay */}
      {showImageDialog && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-[28px] w-full max-w-[280px] p-5 text-center shadow-2xl relative">
            <h3 className="text-white text-sm font-black uppercase tracking-wider mb-1.5">Customize Cover</h3>
            <p className="text-zinc-400 text-[10.5px] font-semibold mb-4 leading-normal">
              Select how you want to display the plan's cover image.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleUseDefaultImage}
                className="w-full bg-[#1A1A22] hover:bg-[#22222E] border border-white/5 text-white py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer"
              >
                Use Default Image
              </button>
              {selectedCircleObj && (
                <button
                  type="button"
                  onClick={handleUseGroupPhoto}
                  className="w-full bg-[#1A1A22] hover:bg-[#22222E] border border-white/5 text-white py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer"
                >
                  Use Group Photo
                </button>
              )}
              <button
                type="button"
                onClick={handleChooseCustomImage}
                className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-[#050505] py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer"
              >
                Choose Custom Image
              </button>
              <button
                type="button"
                onClick={() => setShowImageDialog(false)}
                className="w-full text-zinc-400 hover:text-white py-2 rounded-xl text-xs font-bold transition uppercase tracking-wide mt-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for custom cover image */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
