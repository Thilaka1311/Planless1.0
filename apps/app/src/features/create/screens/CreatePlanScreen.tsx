import React, { useEffect, useState } from "react";
import { ChevronLeft, MapPin, Clock, Users } from 'lucide-react';
import { usePlansStore } from "../../plans/state/PlansContext";
import { useCirclesStore } from "../../circles/state/CirclesContext";
import { Plan, NotificationItem } from "../../../core/types";

// Hooks & utils
import { useCreatePlanForm } from "../hooks/useCreatePlanForm";
import { getCategoryImage } from "../utils/constants";
import { useToast } from "../../../shared/contexts/ToastContext";
import { formatDateTimeStandard } from "../../shared/components/NativeDateTimeField";

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
}

export const CreatePlanScreen = ({
  setActiveTab,
  notifications,
  setNotifications,
  onToggleBottomNav,
}: CreatePlanScreenProps) => {
  const { showToast } = useToast();
  const { createPlan, setDbPlans, setDbPlanParticipants } = usePlansStore();
  const { circles, setCircles } = useCirclesStore();

  // Flow states
  const [createPhase, setCreatePhase] = useState<'category' | 'sports_select' | 'customizer' | 'review'>('category');

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
                    👥 {form.waitlistEnabled ? `${form.waitlistCapacity} Spots` : `${form.totalInvitedCount} Spots`}
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
    if (customizerStep === 1 && form.eventDateTime) {
      // Default custom deadline to 12 hours before event if possible, otherwise 1 hour from now
      const defaultDeadline = new Date(form.eventDateTime.getTime() - 12 * 60 * 60 * 1000);
      if (defaultDeadline > new Date()) {
        form.setCustomDeadline(defaultDeadline);
      } else {
        form.setCustomDeadline(new Date(Date.now() + 60 * 60 * 1000));
      }
    }
  }, [customizerStep, form.eventDateTime]);

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
    const coverUrl = getCategoryImage(selectedCategory, selectedSubcategory);

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

    if (deadlineDate > form.eventDateTime) {
      showToast("RSVP Deadline cannot be after the event time.");
      form.setIsSubmitting(false);
      return;
    }

    const responseDeadlineAt = deadlineDate.toISOString();

    const calculatedCapacity = Math.max(20, form.totalInvitedCount);
    const divisor = form.waitlistEnabled ? form.waitlistCapacity : form.totalInvitedCount;
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
      const { dbPlanRow, dbPartRow, inviteeUuids, hostJoinedAt } = await createPlan(
        newDbPlan,
        form.selectedCircles,
        form.selectedFriends,
        form.userProfile,
        titleToUse
      );

      // plans is now a useMemo in PlansContext — automatically reflects dbPlans after refreshPlans()
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

        {/* REDESIGNED IMMERSIVE HERO PLAN SUMMARY CARD */}
        {customizerStep < 4 && !isExpanding && (
          <div ref={cardRef} className="mx-5 bg-[#0E0E12] rounded-[28px] overflow-hidden z-25 relative mb-5 select-none min-h-[235px] h-auto border border-white/5 shadow-2xl flex flex-col group">
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
            
            <div className="relative z-10 w-full p-5 flex flex-col justify-end text-left space-y-4">
              <div className="mb-1">
                <h1 className="text-[24px] sm:text-[25px] font-[850] text-white leading-none tracking-tight flex items-center drop-shadow-md select-none">
                  {selectedCategory === 'sports' 
                    ? (selectedSubcategory === 'football' ? <><span className="mr-1.5">⚽</span>Football</> : <><span className="mr-1.5">🏸</span>Badminton</>)
                    : selectedCategory === 'movies' ? <><span className="mr-1.5">🎬</span>Movies</>
                    : selectedCategory === 'dining' ? <><span className="mr-1.5">🍝</span>Dining</>
                    : <>✨ Custom Plan</>}
                </h1>
                <div className="w-8 h-[2.5px] bg-[#FF6B2C] rounded-full mt-2.5 opacity-90" />
              </div>

              {/* Status Rows Stacked Vertically for Readability & Dynamic Height */}
              <div className="space-y-3.5 pt-3 border-t border-white/10 w-full">
                {/* Row 1: Location */}
                <button 
                  type="button"
                  onClick={() => handleNavigateStep(0)}
                  className="flex items-start gap-2.5 text-left w-full focus:outline-none transition-all active:opacity-75 cursor-pointer min-w-0"
                >
                  <MapPin className="w-[15px] h-[15px] text-[#FF6B2C] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider leading-none block mb-1">Location</span>
                    <span className="text-[13px] font-semibold text-white leading-snug block whitespace-pre-wrap break-words">
                      {form.localLocation || 'Add venue'}
                    </span>
                  </div>
                </button>

                {/* Row 2: Time */}
                <button 
                  type="button"
                  onClick={() => handleNavigateStep(1)}
                  className="flex items-start gap-2.5 text-left w-full focus:outline-none transition-all active:opacity-75 cursor-pointer min-w-0"
                >
                  <Clock className="w-[15px] h-[15px] text-[#FF6B2C] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider leading-none block mb-1">Time</span>
                    <span className="text-[13px] font-semibold text-white leading-snug block">
                      {form.eventDateTime ? formatDateTimeStandard(form.eventDateTime) : 'Pick date & time'}
                    </span>
                  </div>
                </button>

                {/* Row 3: Guests & Waitlist */}
                <button 
                  type="button"
                  onClick={() => handleNavigateStep(2)}
                  className="flex items-start gap-2.5 text-left w-full focus:outline-none transition-all active:opacity-75 cursor-pointer min-w-0"
                >
                  <Users className="w-[15px] h-[15px] text-[#FF6B2C] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider leading-none block mb-1">Guests</span>
                    <div className="flex flex-col gap-1 mt-0.5">
                      <span className="text-[13px] font-semibold text-white leading-none">
                        👥 {form.waitlistEnabled ? `${form.waitlistCapacity} Spots` : `${form.totalInvitedCount} Spots`}
                      </span>
                      {form.waitlistEnabled && (form.totalInvitedCount - form.waitlistCapacity) > 0 && (
                        <span className="text-[13px] font-semibold text-amber-400 leading-none mt-1">
                          ⏳ {form.totalInvitedCount - form.waitlistCapacity} Waitlisted
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
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
              waitlistCapacity={form.waitlistCapacity}
              setWaitlistCapacity={form.setWaitlistCapacity}
              totalInvitedCount={form.totalInvitedCount}
              selectedItems={form.selectedItems}
              handleRemoveSelectedItem={form.handleRemoveSelectedItem}
              unifiedSearchResults={form.unifiedSearchResults}
              AVAILABLE_CIRCLES={form.AVAILABLE_CIRCLES}
              setCustomizerStep={handleNavigateStep}
              cameFromReview={cameFromReview}
            />
          )}

          {!isExpanding && customizerStep === 3 && (
            <StepCost
              costAmount={form.costAmount}
              setCostAmount={form.setCostAmount}
              totalInvitedCount={form.totalInvitedCount}
              waitlistEnabled={form.waitlistEnabled}
              waitlistCapacity={form.waitlistCapacity}
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
        {/* Apple Wallet Style Dynamic Floating Header Back button */}
        <div className="px-5 pt-3.5 pb-2 flex items-center justify-between z-30">
          <button 
            type="button"
            onClick={() => {
              setCreatePhase(selectedCategory === 'sports' ? 'sports_select' : 'category');
            }}
            className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-white py-1 transition font-bold select-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#FF6B2C]" />
            <span>Categories</span>
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
        />
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
