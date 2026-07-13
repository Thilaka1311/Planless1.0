import React from 'react';
import { ChevronLeft, ChevronRight, Users, Clock, MapPin, IndianRupee, Camera, X, Check, Search, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlansStore } from '../state/PlansContext';
import { useCirclesStore } from '../../circles/state/CirclesContext';
import { useProfileStore } from '../../profile/state/ProfileContext';
import { useToast } from '../../../shared/contexts/ToastContext';
import { getCategoryImage } from '../../create/utils/constants';
import { NotificationItem } from '../../../core/types';
import { supabase } from '../../../lib/supabaseClient';

interface ReviewPlanScreenProps {
  form: any;
  selectedCategory: 'sports' | 'movies' | 'dining' | 'custom';
  selectedSubcategory: 'football' | 'badminton' | null;
  setActiveTab: (tab: 'home' | 'plans' | 'create' | 'circles' | 'wallet' | 'profile') => void;
  setSelectedCircle?: (circle: any) => void;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  onEditSection: (step: number) => void;
  onResetWizard: () => void;
  onPlanCreated?: (planUuid: string) => void;
  onCancel: () => void;
}

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 44 : -44, scale: 0.97 }),
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as any } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -28 : 28, scale: 0.97, transition: { duration: 0.24, ease: [0.4, 0, 1, 1] as any } }),
};

// ─── Live Plan Summary Card ───────────────────────────────────────────────────
interface SummaryCardProps {
  activeStep: 1 | 2 | 3 | 4;
  formattedDateTime: string;
  totalInvitedCount: number;
  localLocation: string;
  costAmount: number;
  totalCapacity: number;
}

const SummaryRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  active: boolean;
  done: boolean;
}> = ({ icon, label, value, active, done }) => (
  <div className={`flex items-start gap-2.5 py-2 px-2.5 rounded-xl transition-all duration-200 ${
    active ? 'bg-[#FF6B2C]/8 border border-[#FF6B2C]/15' : 'border border-transparent'
  }`}>
    <span className={`text-[13px] leading-none mt-0.5 shrink-0 ${active ? 'opacity-100' : 'opacity-60'}`}>{icon}</span>
    <div className="flex-1 min-w-0">
      <p className={`text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5 ${
        active ? 'text-[#FF6B2C]' : 'text-zinc-600'
      }`}>{label}</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] as any }}
          className={`text-[11px] font-semibold leading-snug truncate ${
            done ? 'text-white/90' : 'text-zinc-600'
          }`}
        >
          {done && <span className="text-[#FF6B2C] mr-1">✓</span>}{value}
        </motion.p>
      </AnimatePresence>
    </div>
  </div>
);

const LivePlanSummaryCard: React.FC<SummaryCardProps> = ({
  activeStep, formattedDateTime, totalInvitedCount, localLocation, costAmount, totalCapacity,
}) => {
  const perPerson = costAmount > 0 && totalCapacity > 0 ? Math.ceil(costAmount / totalCapacity) : 0;
  const rows = [
    {
      icon: '📅',
      label: 'Date & Time',
      value: formattedDateTime || 'Not set yet',
      active: activeStep === 1,
      done: !!formattedDateTime,
    },
    {
      icon: '👥',
      label: 'Participants',
      value: totalInvitedCount > 0 ? `${totalInvitedCount} ${totalInvitedCount === 1 ? 'person' : 'people'}` : 'Waiting for participants…',
      active: activeStep === 2,
      done: totalInvitedCount > 0,
    },
    {
      icon: '📍',
      label: 'Location',
      value: localLocation.trim() || 'No location added',
      active: false,
      done: !!localLocation.trim(),
    },
    {
      icon: '💰',
      label: 'Cost',
      value: costAmount > 0 ? `₹${costAmount} split · ≈ ₹${perPerson} each` : 'No expense added',
      active: activeStep === 3,
      done: costAmount > 0,
    },
  ];
  return (
    <div className="rounded-2xl bg-[#0D0D11] border border-white/6 overflow-hidden">
      {rows.map((row, i) => (
        <React.Fragment key={row.label}>
          {i > 0 && <div className="h-px bg-white/[0.04] mx-2.5" />}
          <SummaryRow {...row} />
        </React.Fragment>
      ))}
    </div>
  );
};

export const ReviewPlanScreen: React.FC<ReviewPlanScreenProps> = ({
  form,
  selectedCategory,
  selectedSubcategory,
  setActiveTab,
  setSelectedCircle,
  notifications,
  setNotifications,
  onEditSection,
  onResetWizard,
  onPlanCreated,
  onCancel,
}) => {
  const { showToast } = useToast();
  const { createPlan } = usePlansStore();
  const { circles, setCircles } = useCirclesStore();
  const { userProfile } = useProfileStore();

  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = React.useState(1);
  const [attemptedSubmit, setAttemptedSubmit] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Step 1
  const [tempDate, setTempDate] = React.useState<string>(() => {
    if (form.eventDateTime) {
      const d = form.eventDateTime;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return '';
  });
  const [tempTime, setTempTime] = React.useState<string>(() => {
    if (form.eventDateTime) {
      const d = form.eventDateTime;
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return '';
  });
  const [showTimePicker, setShowTimePicker] = React.useState(!!form.eventDateTime);
  const [dateConfirmed, setDateConfirmed] = React.useState(!!form.eventDateTime);

  // Step 3
  const [addingExpense, setAddingExpense] = React.useState(form.costAmount > 0);
  const [rawCost, setRawCost] = React.useState(form.costAmount > 0 ? String(form.costAmount) : '');

  // Step 4
  const [showImageDialog, setShowImageDialog] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Step 2
  const [searchQ, setSearchQ] = React.useState('');

  React.useEffect(() => {
    if (tempDate && tempTime) {
      const [yr, mo, dy] = tempDate.split('-').map(Number);
      const [hr, mn] = tempTime.split(':').map(Number);
      form.setEventDateTime(new Date(yr, mo - 1, dy, hr, mn));
      setDateConfirmed(true);
    }
  }, [tempDate, tempTime]);

  React.useEffect(() => {
    if (tempDate && !showTimePicker) setShowTimePicker(true);
  }, [tempDate]);

  const isTitleEmpty = !form.localTitle.trim();
  const hasDateTime = !!form.eventDateTime && dateConfirmed;
  const hasParticipants = form.totalInvitedCount > 0 || form.selectedCircles.length > 0;
  const coverUrl = form.customCoverImage || getCategoryImage(selectedCategory, selectedSubcategory);
  const perPerson = form.costAmount > 0 && form.totalCapacity > 0 ? Math.ceil(form.costAmount / form.totalCapacity) : 0;

  const formattedDateTime = React.useMemo(() => {
    if (!form.eventDateTime || isNaN(form.eventDateTime.getTime())) return '';
    const optDate: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const optTime: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    return `${form.eventDateTime.toLocaleDateString('en-US', optDate)} · ${form.eventDateTime.toLocaleTimeString('en-US', optTime)}`;
  }, [form.eventDateTime]);

  const q = searchQ.toLowerCase().trim();
  const allCircles = (form.AVAILABLE_CIRCLES || []).filter((c: any) => (c.name || '').toLowerCase().includes(q));
  const allFriends = (form.AVAILABLE_FRIENDS || []).filter((f: any) => f.name.toLowerCase().includes(q));
  const isFriendSel = (f: any) => form.selectedFriends.some((sf: any) => sf.id === f.id);
  const isCircleSel = (c: any) => form.selectedCircles.includes(c.id);
  const selectedItems = [
    ...allCircles.filter(isCircleSel).map((c: any) => ({ ...c, _type: 'circle' as const })),
    ...allFriends.filter(isFriendSel).map((f: any) => ({ ...f, _type: 'friend' as const })),
  ];
  const availableItems = [
    ...allCircles.filter((c: any) => !isCircleSel(c)).map((c: any) => ({ ...c, _type: 'circle' as const })),
    ...allFriends.filter((f: any) => !isFriendSel(f)).map((f: any) => ({ ...f, _type: 'friend' as const })),
  ];

  const goTo = (next: 1 | 2 | 3 | 4, dir: number) => { setDirection(dir); setStep(next); };
  const goNext = () => {
    if (step === 1) { if (!hasDateTime) { showToast('Please pick a date and time'); return; } goTo(2, 1); }
    else if (step === 2) { if (!hasParticipants) { showToast('Add at least one person'); return; } goTo(3, 1); }
    else if (step === 3) goTo(4, 1);
  };
  const goBack = () => {
    if (step === 1) onCancel();
    else if (step === 2) goTo(1, -1);
    else if (step === 3) goTo(2, -1);
    else if (step === 4) goTo(3, -1);
  };

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (isTitleEmpty) { showToast('Plan title is required'); return; }
    if (isSubmitting) return;
    setIsSubmitting(true);
    form.setIsSubmitting(true);
    try {
      const titleToUse = form.localTitle.trim();
      const locationToUse = (form.localLocation || 'TBD Meetup Location').trim();
      const parsedIsoDateTime = form.eventDateTime.toISOString();
      const planId = `p_${Date.now()}`;
      let hoursOffset = 12;
      if (form.rsvpDeadline === '1 hour before') hoursOffset = 1;
      else if (form.rsvpDeadline === '3 hours before') hoursOffset = 3;
      else if (form.rsvpDeadline === '6 hours before') hoursOffset = 6;
      else if (form.rsvpDeadline === '24 hours before') hoursOffset = 24;
      const deadlineDate = new Date(form.eventDateTime);
      if (form.rsvpDeadline === 'Custom' && form.customDeadline) {
        deadlineDate.setTime(form.customDeadline.getTime());
      } else {
        deadlineDate.setHours(deadlineDate.getHours() - hoursOffset);
      }
      if (deadlineDate < new Date(Date.now() - 10000) || deadlineDate >= form.eventDateTime) {
        showToast('RSVP deadline must be before the event and not in the past.');
        setIsSubmitting(false); form.setIsSubmitting(false); return;
      }
      const matchedCircleObj = circles.find((c) => form.selectedCircles.includes(c.id));
      const circleUuid = (matchedCircleObj as any)?.dbUuid || null;
      const matchedCircleId = form.selectedCircles[0] || null;
      if (matchedCircleId) {
        const circleObj = circles.find((c: any) => c.id === matchedCircleId);
        if (circleObj) {
          const creatorId = userProfile?.dbUuid;
          const myRole = (circleObj as any).membersList?.find((m: any) => m.userId === creatorId)?.role || 'member';
          const permission = (circleObj as any).plan_creation_permission || 'ANYONE';
          if (permission === 'HOSTS_ONLY' && myRole !== 'admin' && myRole !== 'host' && myRole !== 'co_host') {
            showToast('⚠️ Only Admins can create plans in this circle.');
            setIsSubmitting(false); form.setIsSubmitting(false); return;
          }
        }
      }
      const newDbPlan = {
        public_id: planId,
        host_id: userProfile?.dbUuid,
        category: selectedCategory.toUpperCase(),
        subcategory: selectedSubcategory ? selectedSubcategory.toUpperCase() : 'OTHER',
        title: titleToUse.toUpperCase(),
        description: form.quickNote.trim() || `Coordination thread: ${titleToUse}`,
        place_id: 'TBD',
        place_name: locationToUse,
        place_address: locationToUse,
        scheduled_at: parsedIsoDateTime,
        rsvp_deadline: deadlineDate.toISOString(),
        max_participants: form.waitlistEnabled ? form.totalCapacity : form.totalInvitedCount > 0 ? form.totalCapacity : null,
        total_cost: form.costAmount,
        cover_image: coverUrl,
        status: 'LIVE' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        circle_id: circleUuid,
      };
      await createPlan(newDbPlan, form.selectedCircles, form.selectedFriends, userProfile, titleToUse, form.isHostSelected);
      if (matchedCircleId) {
        setCircles((prev: any[]) => prev.map((c) => c.id === matchedCircleId ? { ...c, lastSpontaneousActivity: `Spawned ${titleToUse} just now` } : c));
      }
      const newNotif: NotificationItem = { id: `n_${Date.now()}`, type: 'general', title: `You spawned "${titleToUse}" at ${locationToUse}`, relativeTime: '1s' };
      setNotifications([newNotif, ...notifications]);
      onPlanCreated?.(planId);
    } catch (err: any) {
      console.error('[ReviewPlanScreen Submit]', err);
      showToast(err.message || 'Failed to post plan');
    } finally {
      setIsSubmitting(false);
      form.setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        // Generate the clean UUID to use for the new plan
        const planUuid = `plan_${Date.now()}`;
        const filePath = `${planUuid}.${fileExt}`;
        const { error } = await supabase.storage.from('plan-images').upload(filePath, file, { upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('plan-images').getPublicUrl(filePath);
        form.setCustomCoverImage(publicUrl);
      } catch { showToast('Failed to upload image'); }
    }
    setShowImageDialog(false);
  };

  const STEPS = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }];
  const headlines: Record<number, string> = { 1: 'When are you meeting?', 2: "Who's coming?", 3: 'Did you pay for anything?', 4: 'Looks good?' };

  const categoryLabel = selectedCategory === 'sports'
    ? (selectedSubcategory === 'football' ? '⚽ Football' : '🏸 Badminton')
    : selectedCategory === 'movies' ? '🎬 Movies'
    : selectedCategory === 'dining' ? '🍝 Dining'
    : '✨ Custom';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-hidden text-left select-none">
      <style>{`
        .wz-scroll::-webkit-scrollbar{display:none}
        .wz-scroll{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes tick-in{0%{transform:scale(0) rotate(-12deg);opacity:0}70%{transform:scale(1.2) rotate(3deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
        .tick-in{animation:tick-in 0.42s cubic-bezier(0.22,1,0.36,1) both}
      `}</style>

      {/* Header */}
      <div className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between z-20">
        <button type="button" onClick={goBack} className="flex items-center gap-1 text-zinc-400 hover:text-white transition py-1 cursor-pointer">
          <ChevronLeft className="w-4 h-4 text-[#FF6B2C]" />
          <span className="text-[11px] font-bold">{step === 1 ? 'Cancel' : 'Back'}</span>
        </button>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => (
            <div key={s.n} className={`rounded-full transition-all duration-300 ${s.n === step ? 'w-5 h-1.5 bg-[#FF6B2C]' : s.n < step ? 'w-1.5 h-1.5 bg-[#FF6B2C]/60' : 'w-1.5 h-1.5 bg-white/10'}`} />
          ))}
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{step} of 4</span>
      </div>

      {/* Animated step content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div key={step} custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 flex flex-col overflow-y-auto wz-scroll">

            {/* ── STEP 1: Date & Time ── */}
            {step === 1 && (
              <div className="flex flex-col flex-1 px-6 pt-6 pb-8 gap-5">
                <div>
                  <p className="text-[10px] font-bold text-[#FF6B2C] uppercase tracking-widest mb-2">Step 1 of 4</p>
                  <h1 className="text-[30px] font-black text-white leading-tight tracking-tight">{headlines[1]}</h1>
                  <p className="text-zinc-500 text-[12px] mt-1.5 font-medium">Pick a date — the time reveals once you choose.</p>
                </div>

                <LivePlanSummaryCard
                  activeStep={1}
                  formattedDateTime={formattedDateTime}
                  totalInvitedCount={form.totalInvitedCount}
                  localLocation={form.localLocation}
                  costAmount={form.costAmount}
                  totalCapacity={form.totalCapacity}
                />

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Date</label>
                    <div className={`relative rounded-2xl overflow-hidden border transition-all duration-200 ${tempDate ? 'border-[#FF6B2C]/40 bg-[#FF6B2C]/5' : 'border-white/8 bg-[#111115]'}`}>
                      <input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-transparent py-4 px-4 text-white text-[15px] font-semibold focus:outline-none cursor-pointer" style={{ colorScheme: 'dark' }} />
                      {tempDate && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FF6B2C] flex items-center justify-center tick-in"><Check className="w-3.5 h-3.5 text-white stroke-[3]" /></div>}
                    </div>
                  </div>

                  <AnimatePresence>
                    {showTimePicker && (
                      <motion.div initial={{ opacity: 0, y: 12, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] as any }} className="overflow-hidden space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Time</label>
                          <div className={`relative rounded-2xl overflow-hidden border transition-all duration-200 ${tempTime ? 'border-[#FF6B2C]/40 bg-[#FF6B2C]/5' : 'border-white/8 bg-[#111115]'}`}>
                            <input type="time" value={tempTime} onChange={(e) => setTempTime(e.target.value)} className="w-full bg-transparent py-4 px-4 text-white text-[15px] font-semibold focus:outline-none cursor-pointer" style={{ colorScheme: 'dark' }} />
                            {tempTime && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FF6B2C] flex items-center justify-center tick-in"><Check className="w-3.5 h-3.5 text-white stroke-[3]" /></div>}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5 block">RSVP Deadline</label>
                          <div className="flex gap-2">
                            {[{ id: '1 hour before', label: '1 Hr' }, { id: '12 hours before', label: '12 Hr' }, { id: '24 hours before', label: '24 Hr' }].map((opt) => {
                              const sel = form.rsvpDeadline === opt.id;
                              return <button key={opt.id} type="button" onClick={() => form.setRsvpDeadline(opt.id)} className={`flex-1 py-2.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${sel ? 'bg-[#FF6B2C] border-[#FF6B2C] text-[#050505]' : 'bg-[#111115] border-white/8 text-zinc-400 hover:text-white hover:border-white/15'}`}>{opt.label}</button>;
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-auto">
                  <button type="button" onClick={goNext} disabled={!hasDateTime} className={`w-full py-4 rounded-2xl font-black text-[12px] tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${hasDateTime ? 'bg-[#FF6B2C] text-[#050505] shadow-[0_8px_28px_rgba(255,107,44,0.28)]' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                    Continue <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Who's Coming ── */}
            {step === 2 && (
              <div className="flex flex-col flex-1 px-6 pt-6 pb-8 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-[#FF6B2C] uppercase tracking-widest mb-2">Step 2 of 4</p>
                  <h1 className="text-[30px] font-black text-white leading-tight tracking-tight">{headlines[2]}</h1>
                  <p className="text-zinc-500 text-[12px] mt-1.5 font-medium">
                    {form.totalInvitedCount > 0 ? `${form.totalInvitedCount} ${form.totalInvitedCount === 1 ? 'person' : 'people'} attending` : 'Add your circles or friends'}
                  </p>
                </div>

                <LivePlanSummaryCard
                  activeStep={2}
                  formattedDateTime={formattedDateTime}
                  totalInvitedCount={form.totalInvitedCount}
                  localLocation={form.localLocation}
                  costAmount={form.costAmount}
                  totalCapacity={form.totalCapacity}
                />

                {/* Capacity */}
                <div className="flex items-center gap-3 bg-[#111115] border border-white/8 rounded-2xl px-4 py-3">
                  <Users className="w-4 h-4 text-[#FF6B2C] shrink-0" />
                  <span className="text-[13px] text-white font-semibold flex-1">{form.totalCapacity} {form.totalCapacity === 1 ? 'spot' : 'spots'} total</span>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => form.setTotalCapacity(Math.max(1, form.totalCapacity - 1))} className="w-8 h-8 rounded-full bg-[#1A1A22] border border-white/8 flex items-center justify-center text-white hover:border-white/20 transition cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="text-white font-black text-[15px] w-6 text-center">{form.totalCapacity}</span>
                    <button type="button" onClick={() => form.setTotalCapacity(form.totalCapacity + 1)} className="w-8 h-8 rounded-full bg-[#1A1A22] border border-white/8 flex items-center justify-center text-white hover:border-white/20 transition cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input type="text" placeholder="Search circles & people…" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="w-full bg-[#111115] border border-white/8 rounded-xl py-3 pl-9 pr-4 text-[12px] text-white focus:outline-none focus:border-[#FF6B2C]/40 transition placeholder-zinc-600 font-medium" />
                  {searchQ && <button type="button" onClick={() => setSearchQ('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500"><X className="w-3.5 h-3.5" /></button>}
                </div>

                {/* Selected */}
                {selectedItems.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Added</p>
                    <div className="space-y-2">
                      {selectedItems.map((item: any) => (
                        <div key={`sel-${item._type}-${item.id}`} className="flex items-center gap-3 py-2.5 px-3.5 rounded-xl bg-[#FF6B2C]/8 border border-[#FF6B2C]/20">
                          {item._type === 'circle' ? (
                            <span className="w-8 h-8 rounded-full bg-[#FF6B2C]/20 border border-[#FF6B2C]/30 flex items-center justify-center text-sm shrink-0">{item.emoji || '⚡'}</span>
                          ) : (
                            <img src={item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}`} className="w-8 h-8 rounded-full object-cover shrink-0" alt={item.name} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-white truncate">{item.name}</p>
                            {item._type === 'circle' && item.membersCount && <p className="text-[10px] text-zinc-500">{item.membersCount} members</p>}
                          </div>
                          <button type="button" onClick={() => item._type === 'circle' ? form.toggleCircleSelection(item.id) : form.toggleFriendSelection(item)} className="w-6 h-6 rounded-full bg-[#FF6B2C] flex items-center justify-center shrink-0 cursor-pointer">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available */}
                {availableItems.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{selectedItems.length > 0 ? 'More' : 'People & Circles'}</p>
                    <div className="space-y-1.5">
                      {availableItems.map((item: any) => (
                        <button type="button" key={`avail-${item._type}-${item.id}`} onClick={() => item._type === 'circle' ? form.toggleCircleSelection(item.id) : form.toggleFriendSelection(item)} className="w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl bg-[#111115] border border-white/5 hover:border-white/12 hover:bg-[#18181C] transition-all duration-150 cursor-pointer">
                          {item._type === 'circle' ? (
                            <span className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-sm shrink-0">{item.emoji || '⚡'}</span>
                          ) : (
                            <img src={item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}`} className="w-8 h-8 rounded-full object-cover shrink-0" alt={item.name} />
                          )}
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-[12px] font-semibold text-white truncate">{item.name}</p>
                            {item._type === 'circle' && item.membersCount && <p className="text-[10px] text-zinc-500">{item.membersCount} members</p>}
                          </div>
                          <Plus className="w-4 h-4 text-zinc-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableItems.length === 0 && selectedItems.length === 0 && (
                  <div className="flex-1 flex items-center justify-center py-8">
                    <p className="text-zinc-600 text-[12px] text-center leading-relaxed">No people or circles found.<br />Add friends in the Circles tab.</p>
                  </div>
                )}

                <div className="mt-auto pt-2 shrink-0">
                  <button type="button" onClick={goNext} disabled={!hasParticipants} className={`w-full py-4 rounded-2xl font-black text-[12px] tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${hasParticipants ? 'bg-[#FF6B2C] text-[#050505] shadow-[0_8px_28px_rgba(255,107,44,0.28)]' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                    Continue <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Cost ── */}
            {step === 3 && (
              <div className="flex flex-col flex-1 px-6 pt-6 pb-8 gap-5">
                <div>
                  <p className="text-[10px] font-bold text-[#FF6B2C] uppercase tracking-widest mb-2">Step 3 of 4</p>
                  <h1 className="text-[30px] font-black text-white leading-tight tracking-tight">{headlines[3]}</h1>
                  <p className="text-zinc-500 text-[12px] mt-1.5 font-medium">Split costs with everyone — or skip if it's free.</p>
                </div>

                <LivePlanSummaryCard
                  activeStep={3}
                  formattedDateTime={formattedDateTime}
                  totalInvitedCount={form.totalInvitedCount}
                  localLocation={form.localLocation}
                  costAmount={form.costAmount}
                  totalCapacity={form.totalCapacity}
                />

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setAddingExpense(false); form.setCostAmount(0); setRawCost(''); }} className={`flex-1 flex flex-col items-center gap-2 py-6 rounded-2xl border transition-all duration-200 cursor-pointer ${!addingExpense ? 'bg-[#FF6B2C]/10 border-[#FF6B2C]/40' : 'bg-[#111115] border-white/8 hover:border-white/15'}`}>
                    <span className="text-2xl">🆓</span>
                    <span className={`text-[12px] font-bold ${!addingExpense ? 'text-white' : 'text-zinc-500'}`}>Free</span>
                    <span className="text-[10px] text-zinc-500 font-medium">No charge</span>
                  </button>
                  <button type="button" onClick={() => setAddingExpense(true)} className={`flex-1 flex flex-col items-center gap-2 py-6 rounded-2xl border transition-all duration-200 cursor-pointer ${addingExpense ? 'bg-[#FF6B2C]/10 border-[#FF6B2C]/40' : 'bg-[#111115] border-white/8 hover:border-white/15'}`}>
                    <span className="text-2xl">💰</span>
                    <span className={`text-[12px] font-bold ${addingExpense ? 'text-white' : 'text-zinc-500'}`}>Split Cost</span>
                    <span className="text-[10px] text-zinc-500 font-medium">Share expense</span>
                  </button>
                </div>

                <AnimatePresence>
                  {addingExpense && (
                    <motion.div initial={{ opacity: 0, y: 14, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: 8, height: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as any }} className="overflow-hidden">
                      <div className="bg-[#111115] border border-white/8 rounded-2xl p-5 space-y-4">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Total Amount</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6B2C] font-black text-[18px]">₹</span>
                          <input type="number" inputMode="numeric" value={rawCost} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setRawCost(v); form.setCostAmount(parseInt(v || '0', 10)); }} placeholder="0" className="w-full bg-[#0E0E12] border border-white/8 rounded-xl py-4 pl-10 pr-4 text-white text-[20px] font-black focus:outline-none focus:border-[#FF6B2C]/50 transition" autoFocus />
                        </div>
                        {form.costAmount > 0 && form.totalCapacity > 0 && (
                          <div className="flex items-center justify-between text-[11px] font-medium">
                            <span className="text-zinc-500">÷ {form.totalCapacity} people</span>
                            <span className="text-[#FF6B2C] font-bold text-[14px]">≈ ₹{perPerson} each</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-auto">
                  <button type="button" onClick={goNext} className="w-full py-4 rounded-2xl font-black text-[12px] tracking-widest uppercase flex items-center justify-center gap-1.5 bg-[#FF6B2C] text-[#050505] shadow-[0_8px_28px_rgba(255,107,44,0.28)] cursor-pointer transition-all">
                    {addingExpense && form.costAmount > 0 ? 'Save & Continue' : 'Skip & Continue'} <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Review & Create ── */}
            {step === 4 && (
              <div className="flex flex-col flex-1 px-5 pt-6 pb-8 gap-5">
                <div className="px-1">
                  <p className="text-[10px] font-bold text-[#FF6B2C] uppercase tracking-widest mb-2">Step 4 of 4</p>
                  <h1 className="text-[28px] font-black text-white leading-tight tracking-tight">{headlines[4]}</h1>
                </div>

                {/* Summary card */}
                <div className="rounded-3xl overflow-hidden border border-white/8 bg-[#0E0E12] shadow-2xl">
                  <div className="relative h-44">
                    <img src={coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover brightness-75" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <button type="button" onClick={() => setShowImageDialog(true)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center cursor-pointer hover:bg-black/70 transition">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{categoryLabel}</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Plan Title</label>
                      <input type="text" value={form.localTitle} onChange={(e) => form.setLocalTitle(e.target.value)} placeholder="Give your plan a name…" className={`w-full bg-transparent text-[18px] font-black text-white focus:outline-none placeholder-zinc-700 border-b pb-1 transition-colors ${attemptedSubmit && isTitleEmpty ? 'border-red-500/50' : 'border-white/10 focus:border-[#FF6B2C]/50'}`} />
                      {attemptedSubmit && isTitleEmpty && <p className="text-red-400 text-[10px] mt-1 font-medium">Title is required</p>}
                    </div>
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0 mt-0.5" />
                      <input type="text" value={form.localLocation} onChange={(e) => form.setLocalLocation(e.target.value)} placeholder="Add venue or location" className="flex-1 bg-transparent text-[12px] font-semibold text-white/90 focus:outline-none placeholder-zinc-600 border-b border-white/8 pb-1 focus:border-[#FF6B2C]/40 transition-colors" />
                    </div>
                    {formattedDateTime && (
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0" />
                        <span className="text-[12px] font-semibold text-white/90">{formattedDateTime}</span>
                      </div>
                    )}
                    {form.totalInvitedCount > 0 && (
                      <div className="flex items-center gap-2.5">
                        <Users className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0" />
                        <span className="text-[12px] font-semibold text-white/90">{form.totalInvitedCount} {form.totalInvitedCount === 1 ? 'person' : 'people'} coming</span>
                      </div>
                    )}
                    {form.costAmount > 0 && (
                      <div className="flex items-center gap-2.5">
                        <IndianRupee className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0" />
                        <span className="text-[12px] font-semibold text-white/90">₹{form.costAmount} total · ≈ ₹{perPerson} per person</span>
                      </div>
                    )}
                    {form.rsvpDeadline && (
                      <div className="flex items-center gap-2.5">
                        <span className="text-[#FF6B2C] text-[12px] shrink-0">⏱</span>
                        <span className="text-[12px] font-semibold text-white/90">RSVP {form.rsvpDeadline}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                    Anything everyone should know? <span className="text-zinc-600 normal-case font-normal">(optional)</span>
                  </label>
                  <textarea value={form.quickNote} onChange={(e) => form.setQuickNote(e.target.value)} placeholder="Bring your own rackets, dress code casual…" rows={3} className="w-full bg-[#111115] border border-white/8 rounded-2xl p-4 text-[12px] text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B2C]/40 transition-colors resize-none font-medium" />
                </div>

                <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="w-full py-4 rounded-2xl font-black text-[13px] tracking-widest uppercase flex items-center justify-center gap-2 bg-[#FF6B2C] text-[#050505] shadow-[0_8px_28px_rgba(255,107,44,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all">
                  {isSubmitting ? <span>Creating…</span> : <><span>Create Plan</span><ChevronRight className="w-4 h-4 stroke-[3]" /></>}
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Image dialog */}
      {showImageDialog && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-5">
          <div className="w-full max-w-[320px] bg-[#121216] border border-white/10 rounded-[28px] p-5 shadow-2xl space-y-2">
            <h3 className="text-white text-sm font-black uppercase tracking-wider text-center mb-4">Change Cover</h3>
            <button type="button" onClick={() => { form.setCustomCoverImage(null); setShowImageDialog(false); }} className="w-full bg-[#1A1A22] border border-white/5 text-white py-3 rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-[#22222E] cursor-pointer transition">Use Default</button>
            {(circles as any[]).find((c: any) => c.id === form.selectedCircles[0])?.groupPhoto && (
              <button type="button" onClick={() => { const c = (circles as any[]).find((c: any) => c.id === form.selectedCircles[0]); if (c?.groupPhoto) { form.setCustomCoverImage(c.groupPhoto); setShowImageDialog(false); } }} className="w-full bg-[#1A1A22] border border-white/5 text-white py-3 rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-[#22222E] cursor-pointer transition">Use Circle Photo</button>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full bg-[#FF6B2C] text-[#050505] py-3 rounded-xl text-[11px] font-bold uppercase tracking-wide cursor-pointer">Choose from Device</button>
            <button type="button" onClick={() => setShowImageDialog(false)} className="w-full text-zinc-500 hover:text-white py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide mt-1 cursor-pointer transition">Cancel</button>
          </div>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
};
