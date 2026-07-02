import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, MapPin, Clock, Users, Check, Link, CheckCircle } from 'lucide-react';
import { usePlansStore } from "../../plans/state/PlansContext";
import { useCirclesStore } from "../../circles/state/CirclesContext";
import { Plan, NotificationItem } from "../../../core/types";
import { getOrCreatePlanInvite, buildInviteUrl } from "../../plans/services/planInviteService";

// Hooks & utils
import { useCreatePlanForm } from "../hooks/useCreatePlanForm";
import { getCategoryImage } from "../utils/constants";
import { useToast } from "../../../shared/contexts/ToastContext";
import { formatDateTimeStandard } from "../../../shared/components/NativeDateTimeField";

// Sub-components
import { CategorySelector } from "../components/CategorySelector";
import { SportsSelector } from "../components/SportsSelector";
import { StepWhere } from "../components/StepWhere";
import { StepWhen } from "../components/StepWhen";
import { StepWho } from "../components/StepWho";
import { StepCost } from "../components/StepCost";
import { ReviewPlanScreen } from "../../plans/screens/ReviewPlanScreen";

interface CreatePlanScreenProps {
  setActiveTab: (tab: "home" | "plans" | "create" | "circles" | "wallet" | "profile") => void;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  onToggleBottomNav?: (hidden: boolean) => void;
  setPlansFilter?: (filter: 'going' | 'waitlist' | 'passed' | 'hosted') => void;
}

export const CreatePlanScreen = ({
  setActiveTab,
  notifications,
  setNotifications,
  onToggleBottomNav,
  setPlansFilter,
}: CreatePlanScreenProps) => {
  const { showToast } = useToast();
  const { createPlan } = usePlansStore();
  const { circles, setCircles } = useCirclesStore();

  // Flow states
  const [createPhase, setCreatePhase] = useState<'category' | 'sports_select' | 'customizer' | 'review' | 'confirmation'>('category');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [postedPlanUuid, setPostedPlanUuid] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isWhenStepValid, setIsWhenStepValid] = useState(true);

  const handleCopyInviteLink = async () => {
    if (!postedPlanUuid || isCopying) return;
    setIsCopying(true);
    try {
      const hostUuid = form.userProfile?.dbUuid;
      if (!hostUuid) throw new Error("No host UUID");
      const invite = await getOrCreatePlanInvite(postedPlanUuid, hostUuid);
      if (!invite) throw new Error("Failed to get invite");
      const url = buildInviteUrl(invite.invite_token);
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      showToast("Invite link copied!");
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error("[CreatePlanScreen] Copy invite failed:", err);
      showToast("Failed to copy invite link");
    } finally {
      setIsCopying(false);
    }
  };

  const handleResetAll = () => {
    setSelectedSubcategory(null);
    form.resetForm();
    setCustomizerStep(0);
    setCameFromReview(false);
    setPostedPlanUuid(null);
    setCreatePhase('category');
  };

  useEffect(() => {
    const isFlow = createPhase !== 'category';
    onToggleBottomNav?.(isFlow);
    return () => {
      onToggleBottomNav?.(false);
    };
  }, [createPhase, onToggleBottomNav]);

  const [customizerStep, setCustomizerStep] = useState(0);
  const [cameFromReview, setCameFromReview] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [startHeight, setStartHeight] = useState(235);
  const [isExpanding, setIsExpanding] = useState(false);
  const [animationStage, setAnimationStage] = useState<'none' | 'lift' | 'expand'>('none');

  const triggerExpansion = () => {
    if (cardRef.current) {
      setStartHeight(cardRef.current.offsetHeight);
    }
    setIsExpanding(true);
    setAnimationStage('lift');
    
    setTimeout(() => {
      setAnimationStage('expand');
      
      setTimeout(() => {
        setCreatePhase('review');
        setIsExpanding(false);
        setAnimationStage('none');
      }, 300);
    }, 150);
  };
  const renderExpandingCard = () => {
    const cardClass = animationStage === 'lift' ? 'animate-lift' : 'animate-expand';
    return (
      <div 
        className={`mx-5 bg-[#0E0E12] rounded-[28px] overflow-hidden z-25 relative mb-5 select-none border border-white/5 shadow-2xl flex flex-col group ${cardClass}`}
        style={{
          '--start-height': `${startHeight}px`,
          '--end-height': '580px',
          height: animationStage === 'lift' ? `${startHeight}px` : '580px',
        } as React.CSSProperties}
      >
        <img 
          src={getCategoryImage(selectedCategory, selectedSubcategory)} 
          alt="Activity Cover" 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.7] contrast-110 select-none"
          referrerPolicy="no-referrer"
        />
        <div 
          className="absolute inset-0 z-0" 
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.88) 100%)'
          }}
        />
        <div className="relative z-10 w-full p-5 flex flex-col justify-end text-left space-y-4 h-full">
          <div className="mb-1">
            <h1 className="text-[24px] sm:text-[25px] font-[850] text-white leading-none tracking-tight flex items-center drop-shadow-md select-none">
              {selectedCategory === 'sports' 
                ? (selectedSubcategory === 'football' ? '⚽ Football' : '🏸 Badminton')
                : selectedCategory === 'movies' ? '🎬 Movies'
                : selectedCategory === 'dining' ? '🍝 Dining'
                : '✨ Custom Plan'}
            </h1>
            <div className="w-8 h-[2.5px] bg-[#FF6B2C] rounded-full mt-2.5 opacity-90" />
          </div>

          <div className="space-y-3.5 pt-3 border-t border-white/10 w-full">
            <div className="flex items-start gap-2.5 text-left w-full min-w-0">
              <MapPin className="w-[15px] h-[15px] text-[#FF6B2C] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider leading-none block mb-1">Location</span>
                <span className="text-[13px] font-semibold text-white leading-snug block whitespace-pre-wrap break-words">
                  {form.localLocation || 'Add venue'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-left w-full min-w-0">
              <Clock className="w-[15px] h-[15px] text-[#FF6B2C] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider leading-none block mb-1">Time</span>
                <span className="text-[13px] font-semibold text-white leading-snug block">
                  {form.eventDateTime ? formatDateTimeStandard(form.eventDateTime) : 'Pick date & time'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-left w-full min-w-0">
              <Users className="w-[15px] h-[15px] text-[#FF6B2C] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider leading-none block mb-1">Guests</span>
                <div className="flex flex-col gap-1 mt-0.5">
                  <span className="text-[13px] font-semibold text-white leading-none">
                    {/* totalCapacity = invited + 1 host slot */}
                    👥 {form.waitlistEnabled ? `${form.waitlistCapacity + 1} Spots` : `${form.totalCapacity} Spots`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleNavigateStep = (targetStep: number) => {
    setCustomizerStep(targetStep);
  };

  const [selectedCategory, setSelectedCategory] = useState<'sports' | 'movies' | 'dining' | 'custom'>('sports');
  const [selectedSubcategory, setSelectedSubcategory] = useState<'football' | 'badminton' | null>(null);

  // Form hook
  const form = useCreatePlanForm();

  // Auto-prefill custom deadline based on eventDateTime when customizerStep is reached
  useEffect(() => {
    if (customizerStep === 1) {
      form.setCustomDeadline(new Date());
    }
  }, [customizerStep]);

  const handleSelectSubcategory = (sub: 'football' | 'badminton') => {
    setSelectedSubcategory(sub);
    form.resetForm();
    setCustomizerStep(0);
    setCameFromReview(false);
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
      setCameFromReview(false);
      setCreatePhase('customizer');
    }
  };

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
    
    // Formatting Standard: Saturday, Jun 27 • 7:30 PM
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

    // max_participants in the DB includes the host slot.
    // waitlistCapacity = non-host spots configured by the host.
    // So DB value = waitlistCapacity + 1 (or totalInvitedCount + 1 when no waitlist).
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
        ...form.selectedFriends.map((f: any) => ({
          userId: f.id || f.dbUuid,
          name: f.name,
          avatar: f.avatar || "",
          joinState: "delivered" as const,
          reminderState: "none" as const,
          joinedAt: null,
          checkedIn: false,
        })),
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
        ...form.selectedFriends.map((f: any) => ({
          userId: f.id || f.dbUuid,
          name: f.name,
          avatar: f.avatar || "",
          joinState: "delivered" as const,
          reminderState: "none" as const,
          joinedAt: null,
          checkedIn: false,
        })),
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
      // joinLimit = non-host capacity; totalCapacity = joinLimit + 1 (host)
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
      const { dbPlanRow, dbPartRow, inviteeUuids, hostRespondedAt } = await createPlan(
        newDbPlan,
        form.selectedCircles,
        form.selectedFriends,
        form.userProfile,
        titleToUse
      );

      // refreshPlans() inside createPlan already syncs dbPlans and dbPlanParticipants from the DB.
      // No optimistic DB state updates needed here — they would race against and overwrite the fresh state.

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
      setCameFromReview(false);
      setCreatePhase("category");
      form.setIsSubmitting(false);

      setActiveTab("circles");
      showToast("✨ Plan posted successfully!");
    } catch (err: any) {
      console.error("[CreatePlanFlow] Error:", err);
      form.setIsSubmitting(false);
      showToast(`Failed to post plan: ${err.message || "Unknown error"}`);
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
              if (customizerStep === 1 && !isWhenStepValid) {
                showToast("Please select a valid Respond By time first.");
                return;
              }
              if (cameFromReview) {
                setCreatePhase('review');
                setCameFromReview(false);
              } else if (customizerStep > 0) {
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

        {/* Animation style overrides */}
        <style>{`
          @keyframes lift {
            0% {
              transform: scale(1);
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            100% {
              transform: scale(1.025);
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
            }
          }

          @keyframes expand {
            0% {
              height: var(--start-height, 235px);
              margin-bottom: 20px;
              border-radius: 28px;
            }
            100% {
              height: 580px;
              margin-bottom: 0px;
              border-radius: 28px;
            }
          }

          .animate-lift {
            animation: lift 150ms cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
          }

          .animate-expand {
            animation: expand 300ms cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
          }
        `}</style>

        {/* Dynamic backdrop blur behind the card when expanding */}
        {isExpanding && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[5px] z-20 transition-all duration-300 animate-fade-in" />
        )}

        {/* COMPACT PLAN SUMMARY CARD */}
        {!isExpanding && (
          <div className="mx-5 mb-4 w-[calc(100%-40px)] bg-[#111115]/50 border border-white/5 rounded-2xl p-3 flex items-center gap-3 select-none backdrop-blur-md">
            <span className="w-10 h-10 rounded-full bg-zinc-800/40 border border-white/5 flex items-center justify-center text-lg shrink-0">
              {(() => {
                if (selectedCategory === 'sports') {
                  return selectedSubcategory === 'football' ? '⚽' : '🏸';
                }
                if (selectedCategory === 'movies') return '🎬';
                if (selectedCategory === 'dining' || selectedCategory === 'restaurants') return '🍝';
                return '📅';
              })()}
            </span>
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-xs font-black text-white truncate uppercase tracking-wide leading-tight">
                {form.localTitle.trim() || 'NEW EVENT'}
              </h4>
              <p className="text-[10px] text-zinc-400 truncate leading-none mt-0.5">
                📍 {form.localLocation.trim() || 'TBD Meetup Location'}
              </p>
              {form.eventDateTime && (
                <p className="text-[10px] text-[#FF6B2C] font-semibold leading-none mt-0.5">
                  🕒 {form.eventDateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {form.eventDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Expanding Animating Card placeholder */}
        {isExpanding && renderExpandingCard()}

        {/* STEP SCREENS CONTAINER */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {!isExpanding && customizerStep === 0 && (
            <StepWhere
              localLocation={form.localLocation}
              setLocalLocation={form.setLocalLocation}
              onContinue={() => handleNavigateStep(1)}
              cameFromReview={cameFromReview}
            />
          )}

          {!isExpanding && customizerStep === 1 && (
            <StepWhen
              eventDateTime={form.eventDateTime}
              setEventDateTime={form.setEventDateTime}
              rsvpDeadline={form.rsvpDeadline}
              setRsvpDeadline={form.setRsvpDeadline}
              customDeadline={form.customDeadline}
              setCustomDeadline={form.setCustomDeadline}
              onContinue={() => handleNavigateStep(2)}
              cameFromReview={cameFromReview}
              setWhenStepValid={setIsWhenStepValid}
            />
          )}

          {!isExpanding && customizerStep === 2 && (
            <StepWho
              searchPeopleQuery={form.searchPeopleQuery}
              setSearchPeopleQuery={form.setSearchPeopleQuery}
              selectedCircles={form.selectedCircles}
              toggleCircleSelection={form.toggleCircleSelection}
              selectedFriends={form.selectedFriends}
              toggleFriendSelection={form.toggleFriendSelection}
              waitlistEnabled={form.waitlistEnabled}
              setWaitlistEnabled={form.setWaitlistEnabled}
              waitlistCapacity={form.totalCapacity}
              setWaitlistCapacity={form.setTotalCapacity}
              totalInvitedCount={form.totalInvitedCount}
              selectedItems={form.selectedItems}
              handleRemoveSelectedItem={form.handleRemoveSelectedItem}
              unifiedSearchResults={form.unifiedSearchResults}
              AVAILABLE_CIRCLES={form.AVAILABLE_CIRCLES}
              setCustomizerStep={handleNavigateStep}
              cameFromReview={cameFromReview}
              userProfile={form.userProfile}
              activeUserId={form.activeUserId}
            />
          )}

          {!isExpanding && customizerStep === 3 && (
            <StepCost
              costAmount={form.costAmount}
              setCostAmount={form.setCostAmount}
              totalInvitedCount={form.totalInvitedCount}
              waitlistEnabled={form.waitlistEnabled}
              waitlistCapacity={form.waitlistCapacity}
              totalCapacity={form.totalCapacity}
              setCustomizerStep={(step) => {
                if (step === 4) {
                  triggerExpansion();
                } else {
                  handleNavigateStep(step);
                }
              }}
              cameFromReview={cameFromReview}
            />
          )}

        </div>

      </div>
    );
  }

  // REVIEW PHASE
  if (createPhase === 'review') {
    return (
      <div className="flex-1 flex flex-col relative h-full bg-[#050505] overflow-hidden text-left">
        {/* Apple Wallet Style Dynamic Floating Header Cancel button on the right */}
        <div className="px-5 pt-3.5 pb-2 flex items-center justify-end z-30">
          <button 
            type="button"
            onClick={() => {
              setShowCancelConfirm(true);
            }}
            className="text-[11.5px] text-[#FF6B2C] hover:text-[#FF8552] py-1 transition font-bold select-none cursor-pointer"
          >
            Cancel Plan
          </button>
        </div>

        <ReviewPlanScreen
          form={form}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          setActiveTab={setActiveTab}
          notifications={notifications}
          setNotifications={setNotifications}
          onEditSection={(step) => {
            setCameFromReview(true);
            setCreatePhase('customizer');
            setCustomizerStep(step);
          }}
          onResetWizard={() => {
            setSelectedSubcategory(null);
            form.resetForm();
            setCustomizerStep(0);
            setCameFromReview(false);
            setCreatePhase('category');
          }}
          onPlanCreated={(uuid) => {
            setPostedPlanUuid(uuid);
            setCreatePhase('confirmation');
          }}
        />

        {/* Confirmation Dialog Overlay */}
        {showCancelConfirm && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in">
            <div className="w-full max-w-[280px] bg-[#0E0E12] border border-white/10 rounded-3xl p-5 text-center space-y-4 shadow-2xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Cancel Plan?</h3>
              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                Do you really want to cancel this plan? Any information you've entered during this creation flow will be discarded.
              </p>
              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-[10.5px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setSelectedSubcategory(null);
                    form.resetForm();
                    setCustomizerStep(0);
                    setCameFromReview(false);
                    setCreatePhase('category');
                  }}
                  className="flex-1 bg-[#FF6B2C] hover:bg-[#FF8552] text-[#050505] py-2.5 rounded-xl text-[10.5px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // CONFIRMATION PHASE
  if (createPhase === 'confirmation') {
    // Particle positions: small orange dots that burst outward
    const PARTICLES = [
      { angle: 0,   dist: 72 },
      { angle: 45,  dist: 80 },
      { angle: 90,  dist: 72 },
      { angle: 135, dist: 80 },
      { angle: 180, dist: 72 },
      { angle: 225, dist: 80 },
      { angle: 270, dist: 72 },
      { angle: 315, dist: 80 },
    ] as const;

    const prefersReducedMotion = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    const springTransition = { type: 'spring', stiffness: 420, damping: 28 } as const;

    return (
      <motion.div
        className="flex-1 flex flex-col justify-between relative h-full bg-[#050505] overflow-hidden text-left"
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* ─── Upper: Hero animation + text ─── */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-10">

          {/* Success orb + ring + particles */}
          <div className="relative flex items-center justify-center">

            {/* Expanding glow ring */}
            <motion.div
              className="absolute rounded-full border border-[#FF6B2C]/40"
              initial={prefersReducedMotion ? {} : { width: 80, height: 80, opacity: 0.6 }}
              animate={{ width: 160, height: 160, opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut', delay: 0.15 }}
            />

            {/* Second subtler ring */}
            <motion.div
              className="absolute rounded-full border border-[#FF6B2C]/20"
              initial={prefersReducedMotion ? {} : { width: 80, height: 80, opacity: 0.4 }}
              animate={{ width: 200, height: 200, opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
            />

            {/* Particles */}
            {!prefersReducedMotion && PARTICLES.map((p, i) => {
              const rad = (p.angle * Math.PI) / 180;
              const tx = Math.cos(rad) * p.dist;
              const ty = Math.sin(rad) * p.dist;
              return (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-[#FF6B2C]"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: tx, y: ty, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.65, ease: 'easeOut', delay: 0.12 + i * 0.018 }}
                />
              );
            })}

            {/* Main orb */}
            <motion.div
              className="relative w-24 h-24 bg-[#FF6B2C]/10 border border-[#FF6B2C]/30 rounded-full flex items-center justify-center"
              style={{ boxShadow: '0 0 32px 0 rgba(255,107,44,0.18)' }}
              initial={prefersReducedMotion ? {} : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springTransition, delay: 0.05 }}
            >
              {/* Check icon draws in */}
              <motion.div
                initial={prefersReducedMotion ? {} : { scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...springTransition, delay: 0.2 }}
              >
                <Check className="w-11 h-11 text-[#FF6B2C] stroke-[2.5]" />
              </motion.div>
            </motion.div>
          </div>

          {/* Text block */}
          <div className="text-center space-y-3">
            <motion.h2
              className="text-3xl font-black text-white tracking-tight leading-none"
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.28 }}
            >
              Plan Created!
            </motion.h2>
            <motion.p
              className="text-[13px] text-zinc-500 font-medium max-w-[240px] mx-auto leading-relaxed"
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.38 }}
            >
              Your plan is live. Share it with the people you want there.
            </motion.p>
          </div>
        </div>

        {/* ─── Actions Footer ─── */}
        <motion.div
          className="px-5 pb-10 pt-4 space-y-3 w-full"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.48 }}
        >
          {/* Send Link — primary */}
          <motion.button
            type="button"
            onClick={handleCopyInviteLink}
            disabled={isCopying}
            className="w-full bg-[#FF6B2C] text-[#050505] py-4 rounded-2xl font-black text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer select-none"
            style={{ boxShadow: '0 8px 28px rgba(255,107,44,0.28)' }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
            transition={springTransition}
          >
            {isCopied ? (
              <>
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Link className="w-4 h-4 shrink-0" />
                <span>{isCopying ? 'Generating...' : 'Send Link'}</span>
              </>
            )}
          </motion.button>

          {/* Go to Plans — secondary */}
          <motion.button
            type="button"
            onClick={() => {
              handleResetAll();
              setPlansFilter?.('hosted');
              setActiveTab('plans');
            }}
            className="w-full bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 py-4 rounded-2xl font-bold text-[11px] tracking-widest uppercase flex items-center justify-center transition-colors cursor-pointer select-none"
            whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
            transition={springTransition}
          >
            Go to Plans
          </motion.button>
        </motion.div>
      </motion.div>
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
