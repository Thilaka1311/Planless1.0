import React, { useEffect, useState, useMemo, useRef } from "react";
import { 
  ArrowLeft, 
  Plus, 
  ChevronRight, 
  Check, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  X, 
  ChevronLeft 
} from 'lucide-react';
import { usePlansStore } from "../../plans/state/PlansContext";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { useCirclesStore } from "../../circles/state/CirclesContext";
import { useWalletStore } from "../../wallet/state/WalletContext";
import { Plan, NotificationItem, UserProfile } from "../../../core/types";
import { syncUserStats } from "../../../lib/db";

interface CreatePlanScreenProps {
  setActiveTab: (tab: "home" | "plans" | "create" | "circles" | "wallet" | "profile") => void;
  triggerToast: (msg: string) => void;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

export const CreatePlanScreen = ({
  setActiveTab,
  triggerToast,
  notifications,
  setNotifications,
}: CreatePlanScreenProps) => {
  const { setPlans, setDbPlans, setDbPlanParticipants, refreshPlans } = usePlansStore();
  const { userProfile, dbUsers } = useProfileStore();
  const { circles, setCircles } = useCirclesStore();
  const activeUserId = userProfile?.user_id || "U001";

  // Flow states
  const [createPhase, setCreatePhase] = useState<'category' | 'sports_select' | 'customizer'>('category');
  const [customizerStep, setCustomizerStep] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<'sports' | 'movies' | 'dining' | 'custom'>('sports');
  const [selectedSubcategory, setSelectedSubcategory] = useState<'football' | 'badminton' | null>(null);

  // Modular Customizer Creation states
  const [localLocation, setLocalLocation] = useState('');
  const [localDate, setLocalDate] = useState('');
  const [localTime, setLocalTime] = useState('');
  const [searchPeopleQuery, setSearchPeopleQuery] = useState('');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [waitlistCapacity, setWaitlistCapacity] = useState(10);
  const [rsvpDeadline, setRsvpDeadline] = useState('12 hours before');
  const [customDeadline, setCustomDeadline] = useState('2026-06-14T08:30');
  const [costAmount, setCostAmount] = useState(0);
  const [quickNote, setQuickNote] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // Auto-prefill date & time once the user reaches step 1
  useEffect(() => {
    if (customizerStep >= 1) {
      if (!localDate) setLocalDate('2026-06-14');
      if (!localTime) setLocalTime('20:30');
    }
  }, [customizerStep, localDate, localTime]);

  const getCategoryImage = (cat: string, sub: string | null) => {
    if (cat === 'sports') {
      switch (sub) {
        case 'football': return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80';
        case 'badminton': return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80';
        default: return 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800';
      }
    }
    if (cat === 'movies') return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800';
    if (cat === 'dining') return 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800';
    return 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800';
  };

  // Helper date format text for display card
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'Not set';
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return 'Pick date';
    const dateObj = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[dateObj.getDay()];
    const monthName = months[dateObj.getMonth()];
    const dayNum = dateObj.getDate();
    return `${dayName}, ${monthName} ${dayNum}`;
  };

  const formatFriendlyTime = (timeStr: string) => {
    if (!timeStr) return 'Pick time';
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  // Sticky Headings date generator
  const formatStickyDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return 'Not set';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dateObj = new Date(dateStr);
    const dayName = days[dateObj.getDay()];
    const monthName = months[dateObj.getMonth()];
    const dayNum = dateObj.getDate();
    
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    let label = `${dayName}, ${monthName} ${dayNum}`;
    if (dateStr === todayStr) {
      label = 'Today';
    } else if (dateStr === tomorrowStr) {
      label = 'Tomorrow';
    }
    
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    
    return `${label} • ${displayHour}:${minute} ${ampm}`;
  };

  // Calculate dynamic deadline text
  const getDeadlineText = (dateStr: string, timeStr: string, deadlineOption: string) => {
    if (!dateStr || !timeStr) return { day: 'Not set', time: '—' };
    const combinedStr = `${dateStr}T${timeStr}:00`;
    const planDate = new Date(combinedStr);
    
    let hoursOffset = 12;
    if (deadlineOption === '1 hour before') hoursOffset = 1;
    else if (deadlineOption === '3 hours before') hoursOffset = 3;
    else if (deadlineOption === '6 hours before') hoursOffset = 6;
    else if (deadlineOption === '12 hours before') hoursOffset = 12;
    else if (deadlineOption === '24 hours before') hoursOffset = 24;
    
    const deadlineDate = new Date(planDate.getTime() - hoursOffset * 60 * 60 * 1000);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const h = deadlineDate.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    const minutes = deadlineDate.getMinutes().toString().padStart(2, '0');
    
    return {
      day: days[deadlineDate.getDay()],
      time: `${displayHour}:${minutes} ${ampm}`
    };
  };

  // Relational data mappings
  const AVAILABLE_CIRCLES = useMemo(() => {
    return circles.map((c) => ({
      id: c.id,
      name: c.name,
      membersCount: c.membersCount,
      emoji: c.category === 'sports' ? '⚽' : '🔥'
    }));
  }, [circles]);

  const AVAILABLE_FRIENDS = useMemo(() => {
    return dbUsers
      .filter((u) => u.id !== userProfile?.dbUuid && u.user_id !== userProfile?.user_id)
      .map((u) => ({
        id: u.user_id,
        dbUuid: u.id,
        name: u.full_name,
        avatar: u.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.full_name)}`
      }));
  }, [dbUsers, userProfile]);

  const selectedCirclesCount = useMemo(() => {
    return selectedCircles.reduce((sum, circleId) => {
      const circle = AVAILABLE_CIRCLES.find(c => c.id === circleId);
      return sum + (circle ? circle.membersCount : 0);
    }, 0);
  }, [selectedCircles, AVAILABLE_CIRCLES]);

  const totalInvitedCount = selectedCirclesCount + selectedFriends.length;

  const handleSelectSubcategory = (sub: 'football' | 'badminton') => {
    setSelectedSubcategory(sub);
    setLocalTitle('');
    setLocalLocation('');
    setLocalDate('');
    setLocalTime('');
    setSelectedCircles([]);
    setSelectedFriends([]);
    setWaitlistEnabled(false);
    setWaitlistCapacity(10);
    setRsvpDeadline('12 hours before');
    setCostAmount(0);
    setQuickNote('');
    setCustomizerStep(0);
    setCreatePhase('customizer');
  };

  const handleSelectCategory = (cat: 'sports' | 'movies' | 'dining' | 'custom') => {
    setSelectedCategory(cat);
    if (cat === 'sports') {
      setCreatePhase('sports_select');
    } else {
      setSelectedSubcategory(null);
      setLocalTitle('');
      setLocalLocation('');
      setLocalDate('');
      setLocalTime('');
      setSelectedCircles([]);
      setSelectedFriends([]);
      setWaitlistEnabled(false);
      setWaitlistCapacity(10);
      setRsvpDeadline('12 hours before');
      setCostAmount(0);
      setQuickNote('');
      setCustomizerStep(0);
      setCreatePhase('customizer');
    }
  };

  const toggleCircleSelection = (circleId: string) => {
    if (selectedCircles.includes(circleId)) {
      setSelectedCircles(selectedCircles.filter(id => id !== circleId));
    } else {
      setSelectedCircles([...selectedCircles, circleId]);
    }
  };

  const toggleFriendSelection = (friend: any) => {
    if (selectedFriends.some(f => f.id === friend.id)) {
      setSelectedFriends(selectedFriends.filter(f => f.id !== friend.id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const handleHostPlanSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!userProfile) {
      triggerToast("User profile session is not active. Onboard first.");
      setIsSubmitting(false);
      return;
    }

    const titleToUse = (localTitle || (selectedSubcategory ? `${selectedSubcategory.toUpperCase()} SESSION` : 'Spontaneous Move')).trim();
    const locationToUse = (localLocation || "TBD Meetup Location").trim();
    const timeToUse = formatStickyDateTime(localDate, localTime);
    
    const planId = `p_${Date.now()}`;
    const coverUrl = getCategoryImage(selectedCategory, selectedSubcategory);

    const matchedCircleObj = circles.find((c) => selectedCircles.includes(c.id));
    const circleUuid = matchedCircleObj?.dbUuid || null;

    const parsedIsoDateTime = localDate && localTime 
      ? new Date(`${localDate}T${localTime}:00`).toISOString()
      : new Date().toISOString();

    let hoursOffset = 12;
    if (rsvpDeadline === '1 hour before') hoursOffset = 1;
    else if (rsvpDeadline === '3 hours before') hoursOffset = 3;
    else if (rsvpDeadline === '6 hours before') hoursOffset = 6;
    else if (rsvpDeadline === '12 hours before') hoursOffset = 12;
    else if (rsvpDeadline === '24 hours before') hoursOffset = 24;

    const deadlineDate = new Date(parsedIsoDateTime);
    if (rsvpDeadline === 'Custom' && customDeadline) {
      deadlineDate.setTime(new Date(customDeadline).getTime());
    } else {
      deadlineDate.setHours(deadlineDate.getHours() - hoursOffset);
    }
    const responseDeadlineAt = deadlineDate.toISOString();

    const calculatedCapacity = Math.max(20, totalInvitedCount);
    const splitCount = Math.max(1, totalInvitedCount + 1);
    const perPerson = costAmount > 0 ? Math.ceil(costAmount / splitCount) : 0;

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
      creatorId: activeUserId,
      creatorName: userProfile.name,
      creatorAvatar: userProfile.avatar,
      members: [
        {
          userId: activeUserId,
          name: userProfile.name,
          avatar: userProfile.avatar,
          joinState: "going",
          reminderState: "none",
          joinedAt: new Date().toISOString(),
          checkedIn: true,
        },
      ],
      joinedUsers: [
        {
          userId: activeUserId,
          name: userProfile.name,
          avatar: userProfile.avatar,
          joinState: "going",
          reminderState: "none",
          joinedAt: new Date().toISOString(),
          checkedIn: true,
        },
      ],
      timeline: "today",
      description: quickNote.trim() || `Spontaneous coordination thread for ${titleToUse}`,
      circleId: selectedCircles[0] || null,
      hostId: activeUserId,
      groupId: selectedCircles[0] || null,
      paymentAmount: perPerson,
      status: "active",
      createdAt: new Date().toISOString(),
      waitlistEnabled,
      joinLimit: waitlistEnabled ? waitlistCapacity : undefined,
      capacity: waitlistEnabled ? waitlistCapacity : undefined,
      waitlistUsers: [],
      interestedUsers: [],
      response_cutoff_hours: hoursOffset,
      response_deadline_at: responseDeadlineAt,
    };

    const dbCategory = selectedCategory === "dining" ? "dining" : selectedCategory;
    const dbActivityType = dbCategory === "sports" ? (selectedSubcategory === "badminton" ? "badminton" : "football") : null;

    const newDbPlan = {
      plan_id: planId,
      title: created.title,
      description: created.description || `Coordination thread: ${created.title}`,
      created_by: userProfile.dbUuid,
      host_id: userProfile.dbUuid,
      circle_id: circleUuid,
      activity_type: dbActivityType,
      category: dbCategory,
      location: created.location,
      datetime: parsedIsoDateTime,
      split_amount: perPerson,
      payment_required: perPerson > 0,
      status: "active" as const,
      created_at: new Date().toISOString(),
      cover_image: created.coverImage,
      notes: quickNote.trim() || null,
      waitlist_enabled: waitlistEnabled,
      join_limit: waitlistEnabled ? waitlistCapacity : null,
      response_cutoff_hours: hoursOffset,
      response_deadline_at: responseDeadlineAt,
    };

    try {
      const planRes = await fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "plans", records: [newDbPlan] }),
      });
      if (!planRes.ok) {
        const errData = await planRes.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || "Failed to write plan to backend database");
      }

      const planResult = await planRes.json();
      const dbPlanRow = planResult.data?.[0];
      const insertedPlanUuid = dbPlanRow?.id;

      if (!insertedPlanUuid) {
        throw new Error("Backend did not return the generated UUID for the new plan.");
      }

      // Fresh DB snapshot
      const freshRes = await fetch("/api/db/fetch-all");
      if (!freshRes.ok) throw new Error("Failed to fetch fresh database snapshot.");
      const freshJson = await freshRes.json();
      const freshCircles = freshJson?.data?.circles || [];
      const freshCircleMembers = freshJson?.data?.circle_members || [];
      const freshPlanParticipants = freshJson?.data?.plan_participants || [];
      const freshUsers = freshJson?.data?.users || [];

      const inviteeUuids: string[] = [];
      const participantRecords: any[] = [];
      const hostJoinedAt = new Date().toISOString();
      const uniqueInviteeUuids = new Set<string>();

      // 1. Gather circle members
      if (selectedCircles.length > 0) {
        const circleUuids = selectedCircles.map((cid) => {
          const c = freshCircles.find((x: any) => x.circle_id === cid || x.id === cid);
          return c?.id || cid;
        });
        const targetMembers = freshCircleMembers.filter((m: any) => circleUuids.includes(m.circle_id));
        targetMembers.forEach((m: any) => {
          if (m.user_id && m.user_id !== userProfile.dbUuid) {
            uniqueInviteeUuids.add(m.user_id);
          }
        });
      }

      // 2. Gather selected friends
      if (selectedFriends.length > 0) {
        selectedFriends.forEach((friendObj) => {
          const freshFriendRow = freshUsers.find((u: any) => u.user_id === friendObj.id || u.id === friendObj.id || u.id === friendObj.dbUuid);
          const friendUuid = freshFriendRow?.id || friendObj.dbUuid || null;
          if (friendUuid && friendUuid !== userProfile.dbUuid) {
            uniqueInviteeUuids.add(friendUuid);
          }
        });
      }

      // 3. Add host self-participant record
      participantRecords.push({
        participant_id: `PP_${Date.now()}_self`,
        plan_id: insertedPlanUuid,
        user_id: userProfile.dbUuid,
        status: "going",
        payment_status: "paid",
        joined_at: hostJoinedAt,
      });

      // 4. Add all unique invitees
      Array.from(uniqueInviteeUuids).forEach((inviteeUuid, idx) => {
        inviteeUuids.push(inviteeUuid);
        participantRecords.push({
          participant_id: `PP_${Date.now()}_invitee_${idx}`,
          plan_id: insertedPlanUuid,
          user_id: inviteeUuid,
          status: "delivered",
          payment_status: "unpaid",
          joined_at: new Date().toISOString(),
        });
      });

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validParticipantRecords = participantRecords.filter(
        (rec) => rec.user_id && uuidRegex.test(rec.user_id)
      );
      const filteredParticipantRecords = validParticipantRecords.filter(
        (rec) => !freshPlanParticipants.some((p: any) => p.plan_id === rec.plan_id && p.user_id === rec.user_id)
      );

      let dbPartRow = null;
      if (filteredParticipantRecords.length > 0) {
        const partRes = await fetch("/api/db/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "plan_participants", records: filteredParticipantRecords }),
        });
        if (!partRes.ok) {
          const errData = await partRes.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || "Failed to write participants");
        }
        const partResult = await partRes.json();
        dbPartRow = partResult.data?.[0];
      }

      // Notifications
      const inviteNotifications = inviteeUuids.map((uuid) => ({
        user_id: uuid,
        type: "PLAN_INVITATION",
        title: `${userProfile.name} invited you to join "${titleToUse}"`,
        body: "Spontaneous meetup invitation",
        reference_id: insertedPlanUuid,
        is_read: false,
        created_at: new Date().toISOString(),
      }));
      if (inviteNotifications.length > 0) {
        await fetch("/api/db/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "notifications", records: inviteNotifications }),
        });
      }

      if (userProfile.dbUuid) await syncUserStats(userProfile.dbUuid, "create_plan");
      await refreshPlans();

      // Local state hydration
      const localMembers = [
        {
          userId: userProfile.user_id,
          name: userProfile.name,
          avatar: userProfile.avatar,
          joinState: "going" as any,
          reminderState: "none" as const,
          joinedAt: hostJoinedAt,
          checkedIn: true,
        },
      ];
      inviteeUuids.forEach((uuid) => {
        const u = dbUsers.find((user) => user.id === uuid || user.user_id === uuid);
        if (u) {
          localMembers.push({
            userId: u.user_id,
            name: u.full_name,
            avatar: u.profile_photo,
            joinState: "delivered" as any,
            reminderState: "none" as const,
            joinedAt: new Date().toISOString(),
            checkedIn: false,
          });
        }
      });

      setPlans((prev) => [{ ...created, dbUuid: insertedPlanUuid, creatorId: userProfile.dbUuid, hostId: userProfile.dbUuid, members: localMembers, joinedUsers: localMembers }, ...prev]);
      setDbPlans((prev) => [dbPlanRow, ...prev]);
      if (dbPartRow) setDbPlanParticipants((prev) => [dbPartRow, ...prev]);

      const matchedCircleId = selectedCircles[0] || null;
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

      // Reset Wizard
      setSelectedSubcategory(null);
      setLocalTitle("");
      setLocalLocation("");
      setLocalDate("");
      setLocalTime("");
      setSelectedCircles([]);
      setSelectedFriends([]);
      setWaitlistEnabled(false);
      setWaitlistCapacity(10);
      setRsvpDeadline("12 hours before");
      setCostAmount(0);
      setQuickNote("");
      setCustomizerStep(0);
      setCreatePhase("category");
      setIsSubmitting(false);

      setActiveTab("circles");
      triggerToast("✨ Plan posted successfully!");
    } catch (err: any) {
      console.error("[CreatePlanFlow] Error:", err);
      setIsSubmitting(false);
      triggerToast(`Failed to post plan: ${err.message || "Unknown error"}`);
    }
  };

  // Filtered lists
  const filteredCircles = useMemo(() => {
    return AVAILABLE_CIRCLES.filter(c => 
      c.name.toLowerCase().includes(searchPeopleQuery.toLowerCase())
    );
  }, [AVAILABLE_CIRCLES, searchPeopleQuery]);

  const filteredFriends = useMemo(() => {
    return AVAILABLE_FRIENDS.filter(f => 
      f.name.toLowerCase().includes(searchPeopleQuery.toLowerCase())
    );
  }, [AVAILABLE_FRIENDS, searchPeopleQuery]);

  // CUSTOMIZER PHASE
  if (createPhase === 'customizer') {
    return (
      <div className="flex-1 flex flex-col relative h-full bg-[#050505] overflow-hidden text-left">
        
        {/* Apple Wallet Style Dynamic Floating Header Back button */}
        <div className="px-5 pt-3.5 pb-2 flex items-center justify-between z-30">
          <button 
            type="button"
            onClick={() => {
              if (customizerStep > 0) {
                setCustomizerStep(customizerStep - 1);
              } else {
                setCreatePhase(selectedCategory === 'sports' ? 'sports_select' : 'category');
              }
            }}
            className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-white py-1 transition font-bold select-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#FF6B2C]" />
            <span>{customizerStep === 0 ? 'Categories' : 'Back'}</span>
          </button>
        </div>

        {/* REDESIGNED IMMERSIVE HERO PLAN SUMMARY CARD */}
        <div className="mx-5 bg-[#0E0E12] rounded-[28px] overflow-hidden z-25 relative mb-5 select-none h-[235px] border border-white/5 shadow-2xl flex flex-col group">
          <img 
            src={getCategoryImage(selectedCategory, selectedSubcategory)} 
            alt="Activity Cover" 
            className="absolute inset-0 w-full h-full object-cover brightness-[0.7] contrast-110 select-none transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          
          <div 
            className="absolute inset-0 z-0" 
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.88) 100%)'
            }}
          />
          
          <div className="relative z-10 w-full h-full p-5 pb-4 flex flex-col justify-end text-left">
            <div className="mb-3">
              <h1 className="text-[24px] sm:text-[25px] font-[850] text-white leading-none tracking-tight flex items-center drop-shadow-md select-none">
                {selectedCategory === 'sports' 
                  ? (selectedSubcategory === 'football' ? <><span className="mr-1.5">⚽</span>Football</> : <><span className="mr-1.5">🏸</span>Badminton</>)
                  : selectedCategory === 'movies' ? <><span className="mr-1.5">🎬</span>Movies</>
                  : selectedCategory === 'dining' ? <><span className="mr-1.5">🍝</span>Dining</>
                  : <>✨ Custom Plan</>}
              </h1>
              <div className="w-8 h-[2.5px] bg-[#FF6B2C] rounded-full mt-2.5 opacity-90" />
            </div>

            {/* 3-Column Status Rows */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 w-full">
              {/* Column 1: Location */}
              <button 
                type="button"
                onClick={() => setCustomizerStep(0)}
                className="flex flex-col items-start text-left pr-1.5 border-r border-white/15 focus:outline-none transition-all active:opacity-75 cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-1 shrink-0">
                  <MapPin className="w-[12px] h-[12px] text-[#FF6B2C] shrink-0" />
                  <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider leading-none">Location</span>
                </div>
                <div className="mt-1.5 w-full min-w-0">
                  <span className="text-[12.5px] sm:text-[13px] font-semibold block leading-tight text-white tracking-tight truncate">
                    {localLocation || 'Add venue'}
                  </span>
                </div>
              </button>

              {/* Column 2: Time */}
              <button 
                type="button"
                onClick={() => setCustomizerStep(1)}
                className="flex flex-col items-start text-left px-1 border-r border-white/15 focus:outline-none transition-all active:opacity-75 cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="w-[12px] h-[12px] text-[#FF6B2C] shrink-0" />
                  <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider leading-none">Time</span>
                </div>
                <div className="mt-1.5 w-full min-w-0">
                  <span className="text-[12.5px] sm:text-[13px] font-semibold block leading-tight text-white tracking-tight truncate">
                    {localDate && localTime ? formatStickyDateTime(localDate, localTime) : 'Pick date'}
                  </span>
                </div>
              </button>

              {/* Column 3: Guests */}
              <button 
                type="button"
                onClick={() => setCustomizerStep(2)}
                className="flex flex-col items-start text-left pl-1.5 focus:outline-none transition-all active:opacity-75 cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-1 shrink-0">
                  <Users className="w-[12px] h-[12px] text-[#FF6B2C] shrink-0" />
                  <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider leading-none">Guests</span>
                </div>
                <div className="mt-1.5 w-full min-w-0">
                  <span className={`text-[12.5px] sm:text-[13px] font-semibold block leading-none tracking-tight truncate ${totalInvitedCount > 0 ? 'text-[#FF6B2C]' : 'text-white'}`}>
                    {totalInvitedCount > 0 ? `${totalInvitedCount} invited` : 'Invite people'}
                  </span>
                  {totalInvitedCount > 0 && (
                    <span className="text-[9px] font-medium text-zinc-400 block leading-none truncate mt-1">
                      {selectedCircles.length} {selectedCircles.length === 1 ? 'circle' : 'circles'} • {selectedFriends.length} {selectedFriends.length === 1 ? 'friend' : 'friends'}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* STEP SCREENS CONTAINER */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* SCREEN 1 - LOCATION */}
          {customizerStep === 0 && (
            <div className="flex-1 flex flex-col px-5 pt-0 pb-6 justify-between animate-fade-in overflow-y-auto scrollbar-none">
              <div className="space-y-4">
                <div>
                  <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">Where?</h2>
                  <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">Choose where everyone meets.</p>
                </div>
                
                <div className="relative mt-1">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#FF6B2C]" />
                  <input 
                    type="text"
                    placeholder="Search venue, turf, café, theatre or address"
                    value={localLocation}
                    onChange={(e) => setLocalLocation(e.target.value)}
                    className="w-full bg-[#111115] border border-white/5 rounded-xl py-3.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#FF6B2C]/50 transition placeholder-zinc-500 font-medium"
                    autoFocus
                  />
                  {localLocation && (
                    <button 
                      type="button" 
                      onClick={() => setLocalLocation('')}
                      className="absolute right-3.5 top-3.5 p-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <h4 className="text-[9px] font-mono tracking-wider text-zinc-550 uppercase font-bold block mb-1">Recent Places</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {['Play Arena HSR', 'Toit Indiranagar', 'Nexus IMAX', 'Social Indiranagar'].map((place) => {
                      const isSelected = localLocation === place;
                      return (
                        <button 
                          key={place}
                          type="button"
                          onClick={() => setLocalLocation(place)}
                          className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold select-none transition-all duration-150 border flex items-center justify-between ${
                            isSelected 
                              ? 'bg-[#FF6B2C]/10 border-[#FF6B2C]/30 text-[#FF6B2C]' 
                              : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04] text-zinc-300'
                          }`}
                        >
                          <span>{place}</span>
                          <Plus className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FF6B2C]' : 'text-zinc-650'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                {!localLocation.trim() && (
                  <p className="text-[13px] text-center text-zinc-500 mb-2.5 transition">
                    Choose a location to continue
                  </p>
                )}
                <button 
                  type="button"
                  disabled={!localLocation.trim()}
                  onClick={() => setCustomizerStep(1)}
                  className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] disabled:bg-zinc-900 disabled:text-zinc-655 text-white py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/5"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2 - DATE & TIME */}
          {customizerStep === 1 && (
            <div className="flex-1 flex flex-col px-5 pt-3 pb-6 min-h-0 animate-fade-in overflow-y-auto scrollbar-none justify-start">
              <div className="space-y-5 flex-1">
                <div>
                  <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">When?</h2>
                  <p className="text-[#8e8e93] text-[13px] mt-1.5 font-medium leading-relaxed">Choose the plan timing.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {/* DATE CARD CONTAINER */}
                  <div className="bg-[#111115] border border-white/5 hover:border-white/10 rounded-[22px] p-3.5 flex items-center justify-between min-h-[72px] relative transition-all duration-150 ease-out active:scale-[0.98] active:opacity-85 overflow-hidden select-none outline-none focus-within:ring-1 focus-within:ring-[#FF6B2C]">
                    <div className="flex items-center gap-2.5 w-full min-w-0">
                      <div className="p-1.5 bg-[#FF6B2C]/10 rounded-lg shrink-0">
                        <Calendar className="w-4 h-4 text-[#FF6B2C]" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-0.5">Date</span>
                        <span className="text-[13.5px] sm:text-[14.5px] font-semibold text-white leading-snug whitespace-nowrap">
                          {localDate ? formatFriendlyDate(localDate) : 'Pick date'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 ml-1.5" />
                    <input 
                      ref={dateInputRef}
                      type="date"
                      value={localDate}
                      onChange={(e) => setLocalDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 [color-scheme:dark]"
                    />
                  </div>
                  
                  {/* TIME CARD CONTAINER */}
                  <div className="bg-[#111115] border border-white/5 hover:border-white/10 rounded-[22px] p-3.5 flex items-center justify-between min-h-[72px] relative transition-all duration-150 ease-out active:scale-[0.98] active:opacity-85 overflow-hidden select-none outline-none focus-within:ring-1 focus-within:ring-[#FF6B2C]">
                    <div className="flex items-center gap-2.5 w-full min-w-0">
                      <div className="p-1.5 bg-[#FF6B2C]/10 rounded-lg shrink-0">
                        <Clock className="w-4 h-4 text-[#FF6B2C]" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-0.5">Time</span>
                        <span className="text-[13.5px] sm:text-[14.5px] font-semibold text-white leading-snug whitespace-nowrap">
                          {localTime ? formatFriendlyTime(localTime) : 'Pick time'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 ml-1.5" />
                    <input 
                      ref={timeInputRef}
                      type="time"
                      value={localTime}
                      onChange={(e) => setLocalTime(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 [color-scheme:dark]"
                    />
                  </div>
                </div>
 
                {/* SELECTED TIME CONFIRMATION CARD */}
                <div className="bg-[#111115]/55 border border-white/5 rounded-[22px] py-3.5 px-4.5 flex items-center justify-between transition-all duration-300">
                  <div className="flex flex-col space-y-0.5 text-left">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-0.5">SELECTED TIME</span>
                    <h3 className="text-[16.5px] font-bold text-zinc-100 leading-tight">
                      {localDate ? formatDate(localDate) : 'Not selected'}
                    </h3>
                    <p className="text-[#FF6B2C] text-[14.5px] font-semibold leading-normal">
                      {localTime ? formatTime(localTime) : '—'}
                    </p>
                  </div>
                  
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/15 shrink-0 ml-4">
                    <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                  </div>
                </div>
              </div>
 
              <div className="pt-3 mt-5">
                <button 
                  type="button"
                  onClick={() => setCustomizerStep(2)}
                  className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-4 rounded-2xl font-semibold text-sm tracking-wider uppercase transition-all duration-250 flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/10 active:scale-[0.985] cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3 - PEOPLE / CIRCLES & WAITLIST */}
          {customizerStep === 2 && (
            <div className="flex-1 flex flex-col px-5 pt-3 pb-6 justify-between animate-fade-in overflow-y-auto scrollbar-none">
              <div className="space-y-4">
                <div>
                  <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">Who's invited?</h2>
                  <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">Invite circles or individual friends.</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text"
                    placeholder="Search circles or friends"
                    value={searchPeopleQuery}
                    onChange={(e) => setSearchPeopleQuery(e.target.value)}
                    className="w-full bg-[#111115] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#FF6B2C]/30 transition placeholder-zinc-500"
                  />
                  {searchPeopleQuery && (
                    <button type="button" onClick={() => setSearchPeopleQuery('')} className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 px-0.5 py-1 select-none">
                  <span className="text-xl">👥</span>
                  <div>
                    <div className="text-[13px] font-black text-white leading-tight">{totalInvitedCount} invited</div>
                    <div className="text-[10px] text-zinc-500 font-semibold leading-none mt-0.5">
                      {selectedCircles.length} {selectedCircles.length === 1 ? 'circle' : 'circles'} • {selectedFriends.length} {selectedFriends.length === 1 ? 'friend' : 'friends'}
                    </div>
                  </div>
                </div>

                {/* Sections List */}
                <div className="grid grid-cols-1 gap-3.5 max-h-[220px] overflow-y-auto scrollbar-none pr-0.5">
                  {/* Circles */}
                  <div>
                    <h3 className="text-[15px] font-extrabold text-[#E4E4E7] tracking-tight block mb-2 px-0.5">Circles</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {filteredCircles.map((circle) => {
                        const isChecked = selectedCircles.includes(circle.id);
                        return (
                          <button 
                            key={circle.id}
                            type="button"
                            onClick={() => toggleCircleSelection(circle.id)}
                            className={`p-2.5 rounded-xl border select-none text-left flex items-center justify-between transition-all duration-150 text-xs font-semibold ${
                              isChecked 
                                ? 'bg-[#111115] border-[#FF6B2C] shadow-[0_0_12px_rgba(255,107,44,0.12)] text-white' 
                                : 'bg-[#111115] border-white/5 text-zinc-300 hover:border-white/10'
                            }`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              <span>{circle.emoji}</span>
                              <span className="truncate">{circle.name}</span>
                            </span>
                            {isChecked ? (
                              <span className="flex items-center gap-1 text-[9.5px] font-mono font-medium text-[#FF6B2C]">
                                <span>{circle.membersCount}👥</span>
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-mono font-medium text-zinc-500 opacity-80">{circle.membersCount}👥</span>
                            )}
                          </button>
                        );
                      })}
                      {filteredCircles.length === 0 && <span className="text-[11px] text-zinc-600 block pl-1">No matches</span>}
                    </div>
                  </div>

                  {/* Friends */}
                  <div>
                    <h3 className="text-[15px] font-extrabold text-[#E4E4E7] tracking-tight block mb-2 px-0.5">Friends</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {filteredFriends.map((friend) => {
                        const isChecked = selectedFriends.some(f => f.id === friend.id);
                        return (
                          <button 
                            key={friend.id}
                            type="button"
                            onClick={() => toggleFriendSelection(friend)}
                            className={`p-2.5 rounded-xl border select-none text-left flex items-center justify-between transition-all duration-150 text-xs font-semibold ${
                              isChecked 
                                ? 'bg-[#111115] border-[#FF6B2C] shadow-[0_0_12px_rgba(255,107,44,0.12)] text-white' 
                                : 'bg-[#111115] border-white/5 text-zinc-300 hover:border-white/10'
                            }`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              <img src={friend.avatar} alt="Avatar" className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                              <span className="truncate">{friend.name}</span>
                            </span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-[#FF6B2C] stroke-[2.5]" />}
                          </button>
                        );
                      })}
                      {filteredFriends.length === 0 && <span className="text-[11px] text-zinc-650 block pl-1">No matches</span>}
                    </div>
                  </div>
                </div>

                {/* WAITLIST CARD SECTION */}
                <div className="bg-[#111115] border border-white/5 rounded-2xl p-4 space-y-3 mt-1.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Enable Waitlist</span>
                      <span className="text-[9.5px] text-zinc-500 font-medium">Backup slots if main fills</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setWaitlistEnabled(!waitlistEnabled)}
                      className={`w-9 h-5 rounded-full p-0.5 transition duration-200 flex items-center ${waitlistEnabled ? 'bg-[#FF6B2C] justify-end' : 'bg-zinc-800 justify-start'}`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {waitlistEnabled && (
                    <div className="space-y-3 border-t border-white/5 pt-2.5 animate-fade-in">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-zinc-400">Waitlist Capacity</span>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setWaitlistCapacity(Math.max(1, waitlistCapacity - 1))}
                            className="w-7 h-7 rounded-lg bg-zinc-850 hover:bg-zinc-800 flex items-center justify-center text-white transition font-bold"
                          >
                            <span className="text-sm select-none leading-none">-</span>
                          </button>
                          <span className="text-xs font-bold text-white font-mono w-4 text-center">{waitlistCapacity}</span>
                          <button 
                            type="button"
                            onClick={() => setWaitlistCapacity(waitlistCapacity + 1)}
                            className="w-7 h-7 rounded-lg bg-zinc-850 hover:bg-zinc-800 flex items-center justify-center text-white transition font-bold"
                          >
                            <span className="text-sm select-none leading-none">+</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-black/40 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
                        <span className="text-zinc-500">Invited Capacity: <strong className="text-zinc-300 font-bold">{totalInvitedCount || 20}</strong></span>
                        <span className="text-zinc-500">Waitlist slots: <strong className="text-[#FF6B2C] font-bold">{waitlistCapacity}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button 
                  type="button"
                  onClick={() => setCustomizerStep(3)}
                  className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/5"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4 - RSVP DEADLINE */}
          {customizerStep === 3 && (
            <div className="flex-1 flex flex-col px-5 pt-3 pb-6 justify-between animate-fade-in overflow-y-auto scrollbar-none">
              <div className="space-y-4">
                <div>
                  <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">When should responses close?</h2>
                  <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">Choose when people must respond.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['1 hour before', '3 hours before', '6 hours before', '12 hours before', '24 hours before', 'Custom'].map((option) => {
                    const isSelected = rsvpDeadline === option;
                    return (
                      <button 
                        key={option}
                        type="button"
                        onClick={() => setRsvpDeadline(option)}
                        className={`py-3 px-3.5 rounded-xl text-xs font-semibold select-none text-left border flex items-center justify-between transition-all duration-150 ${
                          isSelected 
                            ? 'bg-[#FF6B2C]/10 border-[#FF6B2C]/30 text-[#FF6B2C]' 
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] text-zinc-455 hover:border-white/10'
                        }`}
                      >
                        <span>{option}</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center p-0.5 ${isSelected ? 'border-[#FF6B2C]' : 'border-zinc-700'}`}>
                          {isSelected && <div className="w-full h-full bg-[#FF6B2C] rounded-full" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {rsvpDeadline === 'Custom' && (
                  <div className="bg-[#111115] border border-white/5 rounded-xl p-3 animate-fade-in">
                    <span className="text-[9px] font-mono uppercase text-zinc-500 block mb-1 font-bold">Custom Deadline</span>
                    <input 
                      type="datetime-local"
                      value={customDeadline}
                      onChange={(e) => setCustomDeadline(e.target.value)}
                      className="w-full bg-transparent text-white border-none p-0 text-xs focus:outline-none focus:ring-0 cursor-pointer font-bold [color-scheme:dark]"
                    />
                  </div>
                )}

                <div className="bg-[#111115]/55 border border-white/5 rounded-2xl p-4 mt-2">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block mb-1.5 font-bold">Responses Close</span>
                  {rsvpDeadline === 'Custom' && customDeadline ? (
                    <>
                      <h3 className="text-sm font-semibold text-zinc-150">
                        {new Date(customDeadline).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h3>
                      <p className="text-[#FF6B2C] text-xs font-semibold mt-0.5">
                        {new Date(customDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </>
                  ) : (
                    (() => {
                      const deadline = getDeadlineText(localDate, localTime, rsvpDeadline);
                      return (
                        <>
                          <h3 className="text-sm font-semibold text-zinc-155">{deadline.day}</h3>
                          <p className="text-[#FF6B2C] text-xs font-semibold mt-0.5">{deadline.time}</p>
                        </>
                      );
                    })()
                  )}
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button 
                  type="button"
                  onClick={() => setCustomizerStep(4)}
                  className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/5"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 5 - COST */}
          {customizerStep === 4 && (
            <div className="flex-1 flex flex-col px-5 pt-3 pb-6 justify-between animate-fade-in overflow-y-auto scrollbar-none">
              <div className="space-y-4">
                <div>
                  <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">Cost?</h2>
                  <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">Split expenses automatically.</p>
                </div>

                <div className="flex flex-col items-center justify-center py-1 relative">
                  <span className="text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-1">Entry Split Amount</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[32px] font-extrabold text-[#FF6B2C]">₹</span>
                    <input 
                      type="number"
                      value={costAmount || ''}
                      placeholder="0"
                      onChange={(e) => setCostAmount(parseInt(e.target.value, 10) || 0)}
                      className="bg-transparent text-white border-none p-1 text-[38px] font-extrabold focus:outline-none focus:ring-0 max-w-[140px] text-center"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center">
                  {[
                    { label: 'Free', value: 0 },
                    { label: '₹300', value: 300 },
                    { label: '₹500', value: 500 },
                    { label: '₹1000', value: 1000 },
                    { label: '₹1500', value: 1500 },
                    { label: '₹2000', value: 2000 },
                  ].map((chip) => {
                    const isSelected = costAmount === chip.value;
                    return (
                      <button 
                        key={chip.label}
                        type="button"
                        onClick={() => setCostAmount(chip.value)}
                        className={`py-1.5 px-3.5 rounded-full text-[11px] font-bold select-none transition-all duration-155 border ${
                          isSelected 
                            ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white' 
                            : 'bg-[#111115] border-white/5 hover:border-white/10 text-zinc-450'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>

                {/* Counts Summary */}
                <div className="grid grid-cols-3 gap-1.5 bg-[#111115]/50 border border-white/5 rounded-xl p-3 text-center">
                  <div>
                    <span className="text-[8px] font-mono text-zinc-550 font-bold block leading-none mb-1">HOST</span>
                    <span className="text-xs font-bold text-zinc-350 font-mono">1</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-zinc-550 font-bold block leading-none mb-1">INVITED</span>
                    <span className="text-xs font-bold text-zinc-350 font-mono">{totalInvitedCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-zinc-550 font-bold block leading-none mb-1">WAITLIST</span>
                    <span className="text-xs font-bold text-zinc-350 font-mono">{waitlistEnabled ? waitlistCapacity : '—'}</span>
                  </div>
                </div>

                {/* Split Card Calculation */}
                <div className="bg-[#111115] border border-white/5 rounded-xl p-3.5 flex justify-between items-center text-left">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block leading-none mb-1">Estimated Cost Per Person</span>
                    <span className="text-[10px] text-zinc-450">Divided by joiners</span>
                  </div>
                  <h3 className="text-base font-bold text-[#FF6B2C]">
                    {costAmount === 0 ? 'Free' : `₹${Math.round(costAmount / (totalInvitedCount || 1))}`}
                  </h3>
                </div>

                <div className="space-y-1 pt-1 text-left">
                  <span className="text-[8.5px] font-mono uppercase text-zinc-500 font-bold block mb-1">Optional Note</span>
                  <input 
                    type="text"
                    placeholder="e.g. Bring your own racquet, Pay at venue"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-3.5 text-xs text-white focus:outline-none focus:border-[#FF6B2C]/30 transition placeholder-zinc-650"
                  />
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button 
                  type="button"
                  onClick={() => setCustomizerStep(5)}
                  className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/5"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 6 - REVIEW PLAN */}
          {customizerStep === 5 && (
            <div className="flex-1 flex flex-col px-5 pt-3 pb-6 justify-between animate-fade-in overflow-y-auto scrollbar-none">
              <div className="space-y-4">
                <div>
                  <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">Review Plan</h2>
                  <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">Give your plan a title and review details.</p>
                </div>

                <div className="bg-[#111115] border border-[#FF6B2C]/30 focus-within:border-[#FF6B2C] rounded-xl p-3 flex flex-col transition-all text-left">
                  <span className="text-[8px] font-mono uppercase text-[#FF6B2C] font-bold block mb-1.5">PLAN TITLE</span>
                  <input 
                    type="text"
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    placeholder="e.g. Saturday Football Match"
                    className="bg-transparent text-white border-none p-0 text-xs font-bold focus:outline-none focus:ring-0 w-full"
                  />
                </div>

                <div className="space-y-1">
                  {[
                    { key: 'activity', label: 'Activity', value: selectedSubcategory ? `${selectedSubcategory.charAt(0).toUpperCase() + selectedSubcategory.slice(1)}` : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`, step: 0 },
                    { key: 'location', label: 'Location', value: localLocation || 'Not set', step: 0 },
                    { key: 'datetime', label: 'Date & Time', value: `${formatDate(localDate)} at ${formatTime(localTime)}`, step: 1 },
                    { key: 'invited', label: 'Invited Circle', value: `${totalInvitedCount} invited (${selectedCircles.length} circles, ${selectedFriends.length} friends)`, step: 2 },
                    { key: 'waitlist', label: 'Waitlist', value: waitlistEnabled ? `${waitlistCapacity} spots` : 'Disabled', step: 2 },
                    { key: 'deadline', label: 'Response Deadline', value: rsvpDeadline === 'Custom' && customDeadline ? new Date(customDeadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : `${rsvpDeadline} before`, step: 3 },
                    { key: 'cost', label: 'Cost Split', value: costAmount > 0 ? `₹${costAmount} (${quickNote || 'Pay at venue'})` : 'Free entry', step: 4 },
                  ].map((row) => (
                    <button 
                      key={row.key}
                      type="button"
                      onClick={() => setCustomizerStep(row.step)}
                      className="w-full text-left py-2.5 px-3 bg-[#111115]/30 hover:bg-[#111115]/70 rounded-xl flex items-center justify-between border border-white/[0.02] hover:border-white/5 transition-all text-xs"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-[8.5px] font-semibold text-zinc-550 uppercase tracking-wider leading-none mb-1">{row.label}</span>
                        <span className="text-zinc-200 font-bold truncate max-w-[245px]">{row.value}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-555 mr-0.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleHostPlanSubmit}
                  className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/10 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Posting...</span>
                  ) : (
                    <>
                      <span>Post Plan</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    );
  }

  // SPORTS SELECT SUB-PHASE
  if (createPhase === 'sports_select') {
    return (
      <div className="flex-1 flex flex-col relative overflow-hidden h-full text-left">
        <div className="flex-1 flex flex-col px-5 pt-3.5 pb-24 animate-fade-in justify-between overflow-y-auto scrollbar-none">
          
          <div className="flex flex-col">
            <div className="mb-3 text-left">
              <button 
                type="button"
                onClick={() => {
                  setSelectedSubcategory(null);
                  setCreatePhase('category');
                }}
                className="flex items-center gap-1 text-xs text-zinc-550 hover:text-white py-1 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#FF6B2C]" />
                <span className="font-semibold">Back</span>
              </button>
            </div>

            <div className="mb-6 mt-1 text-left">
              <h2 className="font-display font-semibold text-[32px] leading-tight tracking-tight text-white mb-1.5">
                What’s the <span className="italic font-serif text-[#FF6B2C] font-semibold">game?</span>
              </h2>
              <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
                Choose the sport you're organizing.
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 justify-start">
            {[
              { 
                id: 'football' as const, 
                title: 'Football', 
                emoji: '⚽', 
                image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
              },
              { 
                id: 'badminton' as const, 
                title: 'Badminton', 
                emoji: '🏸', 
                image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'
              }
            ].map((item) => {
              return (
                <div 
                  key={item.id}
                  onClick={() => handleSelectSubcategory(item.id)}
                  className="group rounded-[28px] relative overflow-hidden bg-zinc-950 border border-white/5 transition-all duration-200 cursor-pointer h-[150px] flex-shrink-0 flex flex-col justify-start pt-7 px-7 pb-5 shadow-lg scale-100 hover:scale-[1.01]"
                >
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-300 brightness-[0.85] group-hover:brightness-[0.95]"
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="absolute inset-0 bg-black/25 z-0"></div>
                  
                  <div className="relative z-10 flex items-center gap-2.5 text-left">
                    <span className="text-2xl select-none leading-none">{item.emoji}</span>
                    <h3 className="font-display font-bold text-[24px] tracking-tight text-white leading-none">
                      {item.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    );
  }

  // DEFAULT CATEGORY SELECTION SCREEN
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full text-left">
      <div className="flex-1 overflow-y-auto scrollbar-none px-5 pt-3.5 pb-24">
        
        {/* Opener Header */}
        <div className="mb-6 mt-2.5 animate-fade-in text-left">
          <h2 className="font-display font-semibold text-[28px] leading-tight tracking-tight text-white mb-1.5">
            What’s the <span className="italic font-serif text-[#FF6B2C] font-semibold">move?</span>
          </h2>
          <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
            Choose what you're coordinating.
          </p>
        </div>

        {/* Predefined Categories */}
        <div className="space-y-4 mb-2">
          {[
            {
              id: 'sports' as const,
              title: 'Sports',
              subtitle: 'Coordinate basketball, badminton, soccer, etc.',
              image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800'
            },
            {
              id: 'movies' as const,
              title: 'Movies',
              subtitle: 'IMAX screenings, premieres and movie nights',
              image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800'
            },
            {
              id: 'dining' as const,
              title: 'Dining and Drinks',
              subtitle: 'Gourmet restaurant dinners, cafes or brewery drinks',
              image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800'
            },
            {
              id: 'custom' as const,
              title: 'Create Your Own Plan',
              subtitle: 'Coffee runs, road trips, house parties and anything else',
              image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800'
            }
          ].map((item) => {
            return (
              <div 
                key={item.id}
                onClick={() => handleSelectCategory(item.id)}
                className="group rounded-[24px] relative overflow-hidden bg-zinc-950 border border-white/5 transition-all duration-300 cursor-pointer h-[120px] hover:border-white/10"
              >
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-500 brightness-[0.4] group-hover:brightness-[0.5] group-hover:scale-[1.01]"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"></div>
                
                <div className="absolute inset-x-0 bottom-0 p-5 text-left">
                  <h3 className="font-display font-semibold text-[17px] text-zinc-100 group-hover:text-white transition-colors duration-150">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 text-[11px] mt-0.5 font-medium max-w-[245px] leading-tight">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
