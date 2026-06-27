import React from 'react';
import { ChevronRight, MapPin, Clock, Users } from 'lucide-react';
import { usePlansStore } from '../state/PlansContext';
import { useCirclesStore } from '../../circles/state/CirclesContext';
import { useToast } from '../../../shared/contexts/ToastContext';
import { formatDateTimeStandard } from '../../shared/components/NativeDateTimeField';
import { getCategoryImage } from '../../create/utils/constants';
import { Plan, NotificationItem } from '../../../core/types';

interface ReviewPlanScreenProps {
  form: any;
  selectedCategory: 'sports' | 'movies' | 'dining' | 'custom';
  selectedSubcategory: 'football' | 'badminton' | null;
  setActiveTab: (tab: "home" | "plans" | "create" | "circles" | "wallet" | "profile") => void;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  onEditSection: (step: number) => void;
  onResetWizard: () => void;
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
}) => {
  const { showToast } = useToast();
  const { createPlan, setDbPlans, setDbPlanParticipants } = usePlansStore();
  const { circles, setCircles } = useCirclesStore();

  const [titleTouched, setTitleTouched] = React.useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = React.useState(false);

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

      onResetWizard();
      form.setIsSubmitting(false);
      setActiveTab("circles");
      showToast("✨ Plan posted successfully!");
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

  const divisor = form.waitlistEnabled ? form.waitlistCapacity : form.totalInvitedCount;
  const perPerson = form.costAmount > 0 && divisor > 0 ? (form.costAmount / divisor) : 0;

  return (
    <div className="mx-5 bg-[#0E0E12] rounded-[28px] border border-white/5 shadow-2xl flex flex-col overflow-y-auto scrollbar-none flex-1 mb-6 relative animate-fade-in text-left">
      <style>{`
        .stagger-item {
          opacity: 0;
          transform: translateY(12px);
          animation: fadeInUp 350ms cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .stagger-delay-1 { animation-delay: 40ms; }
        .stagger-delay-2 { animation-delay: 80ms; }
        .stagger-delay-3 { animation-delay: 120ms; }
        .stagger-delay-4 { animation-delay: 160ms; }
        .stagger-delay-5 { animation-delay: 200ms; }
        .stagger-delay-6 { animation-delay: 240ms; }
        .stagger-delay-7 { animation-delay: 280ms; }
        .stagger-delay-8 { animation-delay: 320ms; }
        .stagger-delay-9 { animation-delay: 360ms; }
      `}</style>

      {/* Cover image at the top of the Review screen */}
      <div className="relative h-[180px] shrink-0 w-full overflow-hidden">
        <img 
          src={getCategoryImage(selectedCategory, selectedSubcategory)} 
          alt="Activity Cover" 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.7] contrast-110"
          referrerPolicy="no-referrer"
        />
        <div 
          className="absolute inset-0" 
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)'
          }}
        />
        <div className="absolute bottom-5 left-5 text-left">
          <h1 className="text-[22px] font-[850] text-white leading-none tracking-tight">
            {selectedCategory === 'sports' 
              ? (selectedSubcategory === 'football' ? '⚽ Football' : '🏸 Badminton')
              : selectedCategory === 'movies' ? '🎬 Movies'
              : selectedCategory === 'dining' ? '🍝 Dining'
              : '✨ Custom Plan'}
          </h1>
          <div className="w-8 h-[2px] bg-[#FF6B2C] rounded-full mt-2" />
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          
          <div className={`stagger-item stagger-delay-1 bg-[#111115] border rounded-xl p-3 flex flex-col transition-all text-left ${showValidationError ? 'border-red-500/50 focus-within:border-red-550' : 'border-[#FF6B2C]/30 focus-within:border-[#FF6B2C]'}`}>
            <span className={`text-[8px] font-mono uppercase font-bold block mb-1.5 ${showValidationError ? 'text-red-500' : 'text-[#FF6B2C]'}`}>Title *</span>
            <input 
              type="text"
              value={form.localTitle}
              onChange={(e) => form.setLocalTitle(e.target.value)}
              onBlur={() => setTitleTouched(true)}
              placeholder="Please enter a title for this plan."
              className="bg-transparent text-white border-none p-0 text-xs font-bold focus:outline-none focus:ring-0 w-full"
            />
          </div>
          {showValidationError && (
            <p className="text-red-500 text-[10px] font-semibold mt-1 pl-1 text-left stagger-item stagger-delay-2">
              Plan title is required
            </p>
          )}

          <div className="stagger-item stagger-delay-2 bg-[#111115] border border-white/5 focus-within:border-[#FF6B2C]/30 rounded-xl p-3 flex flex-col transition-all text-left mt-2">
            <span className="text-[8px] font-mono uppercase text-zinc-555 font-bold block mb-1.5">Notes (Optional)</span>
            <input 
              type="text"
              value={form.quickNote}
              onChange={(e) => form.setQuickNote(e.target.value)}
              placeholder="Add a note for this plan."
              className="bg-transparent text-white border-none p-0 text-xs font-semibold focus:outline-none focus:ring-0 w-full placeholder-zinc-700"
            />
          </div>

          <div className="space-y-1">
            {[
              { key: 'activity', label: 'Activity', value: selectedSubcategory ? `${selectedSubcategory.charAt(0).toUpperCase() + selectedSubcategory.slice(1)}` : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`, step: 0, delayClass: 'stagger-delay-3' },
              { key: 'location', label: 'Location', value: form.localLocation || 'Not set', step: 0, delayClass: 'stagger-delay-4' },
              { key: 'datetime', label: 'Date & Time', value: formatDateTimeStandard(form.eventDateTime), step: 1, delayClass: 'stagger-delay-5' },
              { key: 'invited', label: 'Invited Circle', value: `${form.totalInvitedCount} invited (${form.selectedCircles.length} circles, ${form.selectedFriends.length} friends)`, step: 2, delayClass: 'stagger-delay-6' },
              { key: 'waitlist', label: 'Waitlist', value: form.waitlistEnabled ? `${form.waitlistCapacity} spots` : 'Disabled', step: 2, delayClass: 'stagger-delay-7' },
              { key: 'deadline', label: 'Response Deadline', value: deadlineDisplayValue, step: 1, delayClass: 'stagger-delay-8' },
              { key: 'cost', label: 'Cost Split', value: form.costAmount > 0 ? `₹${perPerson.toFixed(2)} per person` : 'Free entry', step: 3, delayClass: 'stagger-delay-9' },
            ].map((row) => (
              <button 
                key={row.key}
                type="button"
                onClick={() => onEditSection(row.step)}
                className={`w-full text-left py-2.5 px-3 bg-[#111115]/30 hover:bg-[#111115]/70 rounded-xl flex items-center justify-between border border-white/[0.02] hover:border-white/5 transition-all text-xs stagger-item ${row.delayClass}`}
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

        <div className="pt-4 mt-auto stagger-item stagger-delay-9">
          <button 
            type="button"
            disabled={form.isSubmitting || isTitleEmpty}
            onClick={onPostClick}
            className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
      </div>
    </div>
  );
};
