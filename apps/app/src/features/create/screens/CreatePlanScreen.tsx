import React, { useEffect, useState } from "react";
import { ChevronLeft, MapPin, Clock, Users } from 'lucide-react';
import { usePlansStore } from "../../plans/state/PlansContext";
import { useCirclesStore } from "../../circles/state/CirclesContext";
import { Plan, NotificationItem } from "../../../core/types";
import { syncUserStats } from "../../../lib/db";

// Hooks & utils
import { useCreatePlanForm } from "../hooks/useCreatePlanForm";
import { getCategoryImage } from "../utils/constants";

// Sub-components
import { CategorySelector } from "../components/CategorySelector";
import { SportsSelector } from "../components/SportsSelector";
import { StepWhere } from "../components/StepWhere";
import { StepWhen } from "../components/StepWhen";
import { StepWho } from "../components/StepWho";
import { StepCost } from "../components/StepCost";
import { StepWhat } from "../components/StepWhat";

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
  const { circles, setCircles } = useCirclesStore();

  // Flow states
  const [createPhase, setCreatePhase] = useState<'category' | 'sports_select' | 'customizer'>('category');
  const [customizerStep, setCustomizerStep] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<'sports' | 'movies' | 'dining' | 'custom'>('sports');
  const [selectedSubcategory, setSelectedSubcategory] = useState<'football' | 'badminton' | null>(null);

  // Form hook
  const form = useCreatePlanForm();

  // Auto-prefill date & time once the user reaches step 1 (When?)
  useEffect(() => {
    if (customizerStep === 1) {
      const now = new Date();
      
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const nextHour = (now.getHours() + 1) % 24;
      const formattedTime = `${String(nextHour).padStart(2, '0')}:00`;

      if (!form.localDate) {
        form.setLocalDate(formattedDate);
      }
      if (!form.localTime) {
        form.setLocalTime(formattedTime);
      }
      
      // Also set the custom deadline default dynamically based on the calculated values
      const deadlineDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const dlYear = deadlineDate.getFullYear();
      const dlMonth = String(deadlineDate.getMonth() + 1).padStart(2, '0');
      const dlDay = String(deadlineDate.getDate()).padStart(2, '0');
      const dlHours = String(deadlineDate.getHours()).padStart(2, '0');
      const dlMinutes = String(deadlineDate.getMinutes()).padStart(2, '0');
      form.setCustomDeadline(`${dlYear}-${dlMonth}-${dlDay}T${dlHours}:${dlMinutes}`);
    }
  }, [customizerStep, form.localDate, form.localTime]);

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
    const hh = hour.padStart(2, '0');
    const mm = minute.padStart(2, '0');
    
    return `${label} • ${hh}:${mm}`;
  };

  const handleSelectSubcategory = (sub: 'football' | 'badminton') => {
    setSelectedSubcategory(sub);
    form.resetForm();
    setCustomizerStep(0);
    setCreatePhase('customizer');
  };

  const handleSelectCategory = (cat: 'sports' | 'movies' | 'dining' | 'custom') => {
    setSelectedCategory(cat);
    if (cat === 'sports') {
      setCreatePhase('sports_select');
    } else {
      setSelectedSubcategory(null);
      form.resetForm();
      setCustomizerStep(0);
      setCreatePhase('customizer');
    }
  };

  const handleHostPlanSubmit = async () => {
    if (form.isSubmitting) return;
    form.setIsSubmitting(true);

    if (!form.userProfile) {
      triggerToast("User profile session is not active. Onboard first.");
      form.setIsSubmitting(false);
      return;
    }

    const titleToUse = (form.localTitle || (selectedSubcategory ? `${selectedSubcategory.toUpperCase()} SESSION` : 'Spontaneous Move')).trim();
    const locationToUse = (form.localLocation || "TBD Meetup Location").trim();
    const timeToUse = formatStickyDateTime(form.localDate, form.localTime);
    
    const planId = `p_${Date.now()}`;
    const coverUrl = getCategoryImage(selectedCategory, selectedSubcategory);

    const matchedCircleObj = circles.find((c) => form.selectedCircles.includes(c.id));
    const circleUuid = matchedCircleObj?.dbUuid || null;

    const parsedIsoDateTime = form.localDate && form.localTime 
      ? new Date(`${form.localDate}T${form.localTime}:00`).toISOString()
      : new Date().toISOString();

    let hoursOffset = 12;
    if (form.rsvpDeadline === '1 hour before') hoursOffset = 1;
    else if (form.rsvpDeadline === '3 hours before') hoursOffset = 3;
    else if (form.rsvpDeadline === '6 hours before') hoursOffset = 6;
    else if (form.rsvpDeadline === '12 hours before') hoursOffset = 12;
    else if (form.rsvpDeadline === '24 hours before') hoursOffset = 24;

    const deadlineDate = new Date(parsedIsoDateTime);
    if (form.rsvpDeadline === 'Custom' && form.customDeadline) {
      deadlineDate.setTime(new Date(form.customDeadline).getTime());
    } else {
      deadlineDate.setHours(deadlineDate.getHours() - hoursOffset);
    }
    const responseDeadlineAt = deadlineDate.toISOString();

    const calculatedCapacity = Math.max(20, form.totalInvitedCount);
    const splitCount = Math.max(1, form.totalInvitedCount + 1);
    const perPerson = form.costAmount > 0 ? Math.ceil(form.costAmount / splitCount) : 0;

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
      status: "active",
      createdAt: new Date().toISOString(),
      waitlistEnabled: form.waitlistEnabled,
      joinLimit: form.waitlistEnabled ? form.waitlistCapacity : undefined,
      capacity: form.waitlistEnabled ? form.waitlistCapacity : undefined,
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
      created_by: form.userProfile.dbUuid,
      host_id: form.userProfile.dbUuid,
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
      notes: form.quickNote.trim() || null,
      waitlist_enabled: form.waitlistEnabled,
      join_limit: form.waitlistEnabled ? form.waitlistCapacity : null,
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
      if (form.selectedCircles.length > 0) {
        const circleUuids = form.selectedCircles.map((cid) => {
          const c = freshCircles.find((x: any) => x.circle_id === cid || x.id === cid);
          return c?.id || cid;
        });
        const targetMembers = freshCircleMembers.filter((m: any) => circleUuids.includes(m.circle_id));
        targetMembers.forEach((m: any) => {
          if (m.user_id && m.user_id !== form.userProfile.dbUuid) {
            uniqueInviteeUuids.add(m.user_id);
          }
        });
      }

      // 2. Gather selected friends
      if (form.selectedFriends.length > 0) {
        form.selectedFriends.forEach((friendObj) => {
          const freshFriendRow = freshUsers.find((u: any) => u.user_id === friendObj.id || u.id === friendObj.id || u.id === friendObj.dbUuid);
          const friendUuid = freshFriendRow?.id || friendObj.dbUuid || null;
          if (friendUuid && friendUuid !== form.userProfile.dbUuid) {
            uniqueInviteeUuids.add(friendUuid);
          }
        });
      }

      // 3. Add host self-participant record
      participantRecords.push({
        participant_id: `PP_${Date.now()}_self`,
        plan_id: insertedPlanUuid,
        user_id: form.userProfile.dbUuid,
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
        title: `${form.userProfile.name} invited you to join "${titleToUse}"`,
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

      if (form.userProfile.dbUuid) await syncUserStats(form.userProfile.dbUuid, "create_plan");
      await refreshPlans();

      // Local state hydration
      const localMembers = [
        {
          userId: form.userProfile.user_id,
          name: form.userProfile.name,
          avatar: form.userProfile.avatar,
          joinState: "going" as any,
          reminderState: "none" as const,
          joinedAt: hostJoinedAt,
          checkedIn: true,
        },
      ];
      inviteeUuids.forEach((uuid) => {
        const u = form.dbUsers.find((user) => user.id === uuid || user.user_id === uuid);
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

      setPlans((prev) => [{ ...created, dbUuid: insertedPlanUuid, creatorId: form.userProfile.dbUuid, hostId: form.userProfile.dbUuid, members: localMembers, joinedUsers: localMembers }, ...prev]);
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

      // Reset Wizard
      setSelectedSubcategory(null);
      form.resetForm();
      setCustomizerStep(0);
      setCreatePhase("category");
      form.setIsSubmitting(false);

      setActiveTab("circles");
      triggerToast("✨ Plan posted successfully!");
    } catch (err: any) {
      console.error("[CreatePlanFlow] Error:", err);
      form.setIsSubmitting(false);
      triggerToast(`Failed to post plan: ${err.message || "Unknown error"}`);
    }
  };

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
                    {form.localLocation || 'Add venue'}
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
                    {form.localDate && form.localTime ? formatStickyDateTime(form.localDate, form.localTime) : 'Pick date'}
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
                  <span className={`text-[12.5px] sm:text-[13px] font-semibold block leading-none tracking-tight truncate ${form.totalInvitedCount > 0 ? 'text-[#FF6B2C]' : 'text-white'}`}>
                    {form.totalInvitedCount > 0 ? `${form.totalInvitedCount} invited` : 'Invite people'}
                  </span>
                  {form.totalInvitedCount > 0 && (
                    <span className="text-[9px] font-medium text-zinc-400 block leading-none truncate mt-1">
                      {form.selectedCircles.length} {form.selectedCircles.length === 1 ? 'circle' : 'circles'} • {form.selectedFriends.length} {form.selectedFriends.length === 1 ? 'friend' : 'friends'}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* STEP SCREENS CONTAINER */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {customizerStep === 0 && (
            <StepWhere
              localLocation={form.localLocation}
              setLocalLocation={form.setLocalLocation}
              onContinue={() => setCustomizerStep(1)}
            />
          )}

          {customizerStep === 1 && (
            <StepWhen
              localDate={form.localDate}
              setLocalDate={form.setLocalDate}
              localTime={form.localTime}
              setLocalTime={form.setLocalTime}
              rsvpDeadline={form.rsvpDeadline}
              setRsvpDeadline={form.setRsvpDeadline}
              customDeadline={form.customDeadline}
              setCustomDeadline={form.setCustomDeadline}
              onContinue={() => setCustomizerStep(2)}
            />
          )}

          {customizerStep === 2 && (
            <StepWho
              searchPeopleQuery={form.searchPeopleQuery}
              setSearchPeopleQuery={form.setSearchPeopleQuery}
              selectedCircles={form.selectedCircles}
              toggleCircleSelection={form.toggleCircleSelection}
              selectedFriends={form.selectedFriends}
              toggleFriendSelection={form.toggleFriendSelection}
              waitlistEnabled={form.waitlistEnabled}
              setWaitlistEnabled={form.setWaitlistEnabled}
              waitlistCapacity={form.waitlistCapacity}
              setWaitlistCapacity={form.setWaitlistCapacity}
              totalInvitedCount={form.totalInvitedCount}
              selectedItems={form.selectedItems}
              handleRemoveSelectedItem={form.handleRemoveSelectedItem}
              unifiedSearchResults={form.unifiedSearchResults}
              AVAILABLE_CIRCLES={form.AVAILABLE_CIRCLES}
              setCustomizerStep={setCustomizerStep}
            />
          )}

          {customizerStep === 3 && (
            <StepCost
              costAmount={form.costAmount}
              setCostAmount={form.setCostAmount}
              totalInvitedCount={form.totalInvitedCount}
              waitlistEnabled={form.waitlistEnabled}
              waitlistCapacity={form.waitlistCapacity}
              quickNote={form.quickNote}
              setQuickNote={form.setQuickNote}
              setCustomizerStep={setCustomizerStep}
            />
          )}

          {customizerStep === 4 && (
            <StepWhat
              localTitle={form.localTitle}
              setLocalTitle={form.setLocalTitle}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              localLocation={form.localLocation}
              localDate={form.localDate}
              localTime={form.localTime}
              totalInvitedCount={form.totalInvitedCount}
              selectedCircles={form.selectedCircles}
              selectedFriends={form.selectedFriends}
              waitlistEnabled={form.waitlistEnabled}
              waitlistCapacity={form.waitlistCapacity}
              rsvpDeadline={form.rsvpDeadline}
              customDeadline={form.customDeadline}
              costAmount={form.costAmount}
              quickNote={form.quickNote}
              isSubmitting={form.isSubmitting}
              handleHostPlanSubmit={handleHostPlanSubmit}
              setCustomizerStep={setCustomizerStep}
            />
          )}
        </div>

      </div>
    );
  }

  // SPORTS SELECT SUB-PHASE
  if (createPhase === 'sports_select') {
    return (
      <SportsSelector
        onSelectSubcategory={handleSelectSubcategory}
        onBack={() => {
          setSelectedSubcategory(null);
          setCreatePhase('category');
        }}
      />
    );
  }

  // DEFAULT CATEGORY SELECTION SCREEN
  return (
    <CategorySelector
      onSelectCategory={handleSelectCategory}
    />
  );
};
