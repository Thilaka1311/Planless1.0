import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, MapPin, Users, IndianRupee, Image as ImageIcon, Send, X, Plus, Sparkles, Navigation, Globe, Hash, ChevronRight, Film, Trophy, Utensils, Search, Landmark, MoreVertical, Settings } from "lucide-react";
import { getInitialsAvatar } from "../../../demo/seedData";
import { SportsIcon, MoviesIcon, FoodIcon } from "../../../shared/components/Icons";

export const CreatePlanScreen = (props: any) => {
  const {
    createFlowStep, setCreateFlowStep,
    selectedExperience, setSelectedExperience,
    suggestedExperiences,
    newPlanTitle, setNewPlanTitle,
    newPlanCategory, setNewPlanCategory,
    newPlanTime, setNewPlanTime,
    newPlanLocation, setNewPlanLocation,
    newPlanCost, setNewPlanCost,
    newPlanSpots, setNewPlanSpots,
    audienceType, setAudienceType,
    circles,
    selectedCircleIds, setSelectedCircleIds,
    recipientSearchQuery, setRecipientSearchQuery,
    selectedFriendIds, setSelectedFriendIds,
    customPlanNotes, setCustomPlanNotes,
    pushToSupabase,
    activeUserId,
    userProfile,
    triggerToast,
    setPlans,
    setActiveTab,
    homeFeedRef,
    aiVibePrompt, setAiVibePrompt,
    isGeneratingAiPlan,
    handleAiGeneratePlan,
    carouselRef,
    handleScroll,
    dbUsers,
    newPlanUploadedImage, setNewPlanUploadedImage,
    handleHostPlanSubmit
  } = props;

  const [showMenu, setShowMenu] = useState(false);

  return (
    <div id="create_tab_pane" className="space-y-5 animate-fade-in max-w-sm mx-auto">
      {/* Lightweight Page Header */}
      <div className="flex items-center justify-between pb-1 relative">
        <h2 className="text-lg font-display font-bold text-zinc-100 tracking-tight">Create</h2>
        <div className="relative">
          <button
            id="create_menu_btn"
            onClick={() => setShowMenu(prev => !prev)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 z-50 bg-zinc-900 border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden min-w-[140px] animate-fade-in">
              <button
                id="create_settings_btn"
                onClick={() => { setActiveTab("profile"); setShowMenu(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-left text-xs font-sans text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MVP Stepper Progress Indicator */}
      <div className="flex items-center justify-between bg-zinc-955/40 border border-zinc-900 rounded-2xl p-3 mb-1 select-none">
        {[
          { step: "BROWSE" as const, label: "Custom" },
          { step: "DETAILS" as const, label: "Info" },
          { step: "RECIPIENTS" as const, label: "Invite" },
          { step: "EXTRA" as const, label: "Setups" },
          { step: "PREVIEW" as const, label: "Host" }
        ].map((s, idx) => {
          const stepOrder = ["BROWSE", "DETAILS", "RECIPIENTS", "EXTRA", "PREVIEW"] as const;
          const currentIdx = stepOrder.indexOf(createFlowStep);
          const active = s.step === createFlowStep;
          const done = stepOrder.indexOf(s.step) < currentIdx;

          return (
            <React.Fragment key={s.step}>
              <button
                type="button"
                disabled={!done && stepOrder.indexOf(s.step) > currentIdx}
                onClick={() => setCreateFlowStep(s.step as any)}
                className="flex items-center gap-1.5 focus:outline-none cursor-pointer text-left"
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition-all ${active
                  ? "bg-[#ff8b66] text-black ring-4 ring-[#ff8b66]/20 font-extrabold"
                  : done
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                    : "bg-zinc-900 text-zinc-500 border border-zinc-850"
                  }`}>
                  {done ? "✓" : idx + 1}
                </span>
                <span className={`text-[10px] font-mono tracking-tighter ${active ? "text-[#ff8b66] font-semibold" : "text-zinc-500"
                  }`}>
                  {s.label}
                </span>
              </button>
              {idx < 4 && (
                <div className={`flex-1 h-[1px] mx-1 ${stepOrder.indexOf(s.step) < currentIdx ? "bg-emerald-900" : "bg-zinc-900"
                  }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 4: BROWSE EXPERIENCES OR TRIGGER CREATE CUSTOM PLAN DIRECTLY */}
      {createFlowStep === "BROWSE" && (
        <div className="space-y-5 animate-fade-in text-left">
          <div className="space-y-1">
            <h2 className="text-xl font-display font-semibold text-zinc-100 tracking-tight">Spawn Spontaneous Hanging</h2>
            <p className="text-xs text-zinc-500">Pick template coordinates or plan from absolute scratch instantly.</p>
          </div>

          {/* 🌟 AI COORDINATION SPARK / PLANNER */}
          <div
            id="ai_plan_coordinator_card"
            className="relative bg-gradient-to-br from-zinc-950 to-zinc-900 border border-[#ff8b66]/35 rounded-3xl p-5 shadow-xl overflow-hidden"
          >
            <div className="absolute -left-12 -bottom-12 w-28 h-28 bg-[#ff8b66]/10 blur-2xl rounded-full" />
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#ff5d41]/5 blur-2xl rounded-full" />

            <div className="relative space-y-3.5 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#ff8b66]/10 border border-[#ff8b66]/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#ff8b66]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-sans font-bold text-white flex items-center gap-1.5 leading-none">
                      AI Social Coordinator
                    </h3>
                    <span className="text-[8px] font-mono text-brand-peach/80 font-bold uppercase tracking-wider">Gemini 3.5 Flash Powered</span>
                  </div>
                </div>
                <span className="text-[7.5px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-955/40 border border-emerald-900/30">● COORDINATE ONLINE</span>
              </div>

              <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                Describe your plan vibe (e.g. <span className="text-zinc-300 italic">"spontaneous football session tonight"</span> or <span className="text-zinc-300 italic">"late night coffee talk"</span>) and let Gemini instantly align all coordinates.
              </p>

              <div className="space-y-2">
                <textarea
                  value={aiVibePrompt}
                  onChange={(e) => setAiVibePrompt(e.target.value)}
                  placeholder="Tell AI your vibe..."
                  className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-brand-peach/50 focus:outline-none rounded-xl p-2.5 text-[11px] text-zinc-200 placeholder-zinc-650 resize-none h-14 transition-all no-scrollbar"
                />

                <button
                  type="button"
                  onClick={handleAiGeneratePlan}
                  disabled={isGeneratingAiPlan || !aiVibePrompt.trim()}
                  className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isGeneratingAiPlan
                    ? "bg-zinc-900 text-zinc-500 cursor-not-allowed"
                    : !aiVibePrompt.trim()
                      ? "bg-zinc-900 text-zinc-550 cursor-not-allowed"
                      : "bg-brand-peach text-zinc-955 hover:bg-opacity-90 active:scale-[0.98]"
                    }`}
                >
                  {isGeneratingAiPlan ? (
                    <>
                      <span className="w-3 h-3 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
                      <span>Aligning coordinates with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Plan with AI Spark ✨</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* OFFICIAL CREATE CUSTOM PLAN HERO CTA - Step 4 of Custom Flow */}
          <div
            id="create_custom_plan_hero"
            onClick={() => {
              // Initialize as standard custom template
              const customPreset = suggestedExperiences.find(s => s.category === "custom") || {
                id: "exp_custom",
                title: "Custom Spontaneous Plan",
                category: "custom" as const,
                tag: "CUSTOM",
                description: "Spawn spontaneous coordinator coordinates for your groups...",
                time: "TODAY • 8:30 PM",
                venue: "Cozy Cafe HQ",
                price: 0,
                image: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=600&q=80"
              };
              setSelectedExperience(customPreset as any);
              setNewPlanTitle("");
              setNewPlanLocation("");
              setNewPlanTime("TODAY • 8:30 PM");
              setNewPlanCost("0");
              setNewPlanSpots("6");
              setCreateFlowStep("DETAILS");
            }}
            className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-brand-peach/20 hover:border-brand-peach/40 rounded-3xl p-5 cursor-pointer shadow-xl transition-all select-none overflow-hidden group"
          >
            {/* Background ambient sunset glow */}
            <div className="absolute -right-12 -top-12 w-28 h-28 bg-[#ff8b66]/10 blur-2xl rounded-full group-hover:bg-[#ff8b66]/15 transition-all duration-300" />

            <div className="flex gap-4 items-center">
              <div className="w-11 h-11 rounded-2xl bg-[#ff8b66]/10 border border-[#ff8b66]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Plus className="w-5 h-5 text-[#ff8b66]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono tracking-widest text-[#ff8b66] uppercase font-bold bg-[#ff8b66]/10 px-2 py-0.5 rounded-full border border-[#ff8b66]/15">Lightweight</span>
                  <span className="text-[8px] font-mono text-emerald-400 font-bold">● FAST TO COMPLETE</span>
                </div>
                <h3 className="text-sm font-sans font-bold text-white mt-1.5 flex items-center gap-1">
                  Create Custom Plan
                  <Sparkles className="w-3.5 h-3.5 text-[#ff8b66] animate-pulse" />
                </h3>
                <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">Define your own activity name, venue / coordinates, and timings</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:text-white group-hover:translate-x-0.5 transition-all mr-1" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 py-1">
            <div className="h-[1px] bg-zinc-900 flex-1" />
            <span className="text-[8px] font-mono uppercase tracking-widest text-[#ff8b66]/50">Or choose spontaneous presets</span>
            <div className="h-[1px] bg-zinc-900 flex-1" />
          </div>

          {/* Categories Fast Filter Selector */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
            {[
              { key: "all", label: "All Suggested", icon: Sparkles },
              { key: "movies", label: "Movies", icon: Film },
              { key: "sports", label: "Sports", icon: Trophy },
              { key: "restaurants", label: "Table Booking", icon: Utensils }
            ].map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setNewPlanCategory(cat.key);
                }}
                className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-[10px] font-mono border transition-all cursor-pointer ${newPlanCategory === cat.key
                  ? "bg-[#ff8b66]/15 text-brand-peach border-brand-peach/30 font-semibold shadow-inner"
                  : "bg-zinc-955/40 text-zinc-400 border-zinc-900 hover:text-zinc-200"
                  }`}
              >
                <cat.icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Lightweight swipe-friendly experience carousel with partial next-card peek */}
          <div className="relative w-full overflow-hidden py-1">
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 px-1"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {suggestedExperiences
                .filter(item => {
                  if (newPlanCategory === "all") return item.category !== "custom";
                  return item.category === newPlanCategory;
                })
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedExperience(item);
                      setNewPlanTitle(item.title);
                      setNewPlanLocation(item.venue);
                      setNewPlanTime(item.time);
                      setNewPlanCost(item.price.toString());
                      setNewPlanSpots("6");
                      setCreateFlowStep("DETAILS");
                    }}
                    className="w-[85%] sm:w-[88%] shrink-0 snap-center rounded-3xl aspect-[10/12] relative overflow-hidden bg-zinc-955 border border-zinc-900 shadow-xl flex flex-col justify-between p-5 cursor-pointer hover:border-zinc-850 transition-all group"
                    style={{ scrollSnapAlign: "center" }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-102 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/20" />

                    {/* Tag and category branding */}
                    <div className="z-10 flex items-center justify-between">
                      <span className="bg-white/5 backdrop-blur-sm text-zinc-350 border border-white/5 text-[8px] font-mono uppercase tracking-[0.14em] px-2.5 py-1 rounded-full whitespace-nowrap">
                        {item.tag}
                      </span>
                      <span className="text-[8px] font-mono font-bold text-[#ff8b66] bg-[#ff8b66]/10 px-2.5 py-1 rounded-full border border-[#ff8b66]/20 uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>

                    {/* Title and tap CTA */}
                    <div className="z-10 space-y-3 mt-auto">
                      <div className="space-y-1">
                        <h3 className="text-base font-display font-medium text-white tracking-tight leading-none text-left">
                          {item.title}
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-sans line-clamp-2 leading-relaxed text-left">
                          {item.description}
                        </p>
                      </div>

                      <div className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-medium text-[10px] py-2 px-3 rounded-xl flex items-center justify-between transition-colors shadow-inner">
                        <span className="font-mono">Fill in spontaneous timings</span>
                        <ChevronRight className="w-3.5 h-3.5 text-brand-peach" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: FILL DRAFT ACTIVITY/PLAN DETAILS (Activity Name, Location, Date & Time) */}
      {createFlowStep === "DETAILS" && selectedExperience && (
        <div className="space-y-5 animate-fade-in text-left">

          {/* Back button */}
          <button
            type="button"
            onClick={() => setCreateFlowStep("BROWSE")}
            className="text-xs font-mono font-medium text-zinc-550 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to suggestions</span>
          </button>

          <div className="space-y-1">
            <h3 className="text-sm font-display font-semibold text-zinc-200">Set Core Coordinates</h3>
            <p className="text-[11px] text-zinc-500 font-sans">Enter name, spot & timing. Select suggestions to bypass typing.</p>
          </div>

          <div className="bg-zinc-905 border border-zinc-900 rounded-2xl p-4 space-y-4">

            {/* Title input + quick selection pills */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-405 font-mono uppercase tracking-widest block font-extrabold text-brand-peach">1. Activity Name</label>
              <input
                type="text"
                placeholder="e.g., Turf Football Session, Rooftop Sundowner"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-brand-peach transition-all"
                required
              />

              {/* Activity name recommendation pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                {[
                  "⚽ Turf Football",
                  "🍿 Cinema Crew",
                  "☕ Late Brew Coffee",
                  "🍜 Ramen Dinner",
                  "🍹 Drinks Lounge",
                  "🎮 FIFA League"
                ].map((pillText) => (
                  <button
                    key={pillText}
                    type="button"
                    onClick={() => setNewPlanTitle(pillText)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-semibold font-mono border transition-all ${newPlanTitle === pillText
                      ? "bg-brand-peach/15 text-brand-peach border-brand-peach/40"
                      : "bg-zinc-950/50 text-zinc-505 border-zinc-900 hover:text-zinc-300"
                      }`}
                  >
                    {pillText}
                  </button>
                ))}
              </div>
            </div>

            {/* Location input + quick locations */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-405 font-mono uppercase tracking-widest block font-extrabold text-brand-peach">2. Target Venue / Spot</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <MapPin className="w-3.5 h-3.5 text-[#ff8b66]" />
                </span>
                <input
                  type="text"
                  placeholder="e.g., Starbucks Corner, City Football Turf"
                  value={newPlanLocation}
                  onChange={(e) => setNewPlanLocation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-brand-peach transition-all"
                  required
                />
              </div>

              {/* Quick Location Pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                {[
                  "📍 Starbucks HQ",
                  "📍 Elite Turf Area",
                  "📍 Phoenix Sky Deck",
                  "📍 Downtown Pizzeria",
                  "📍 Brew House Cafe",
                  "📍 Local Park Loft"
                ].map((loc) => {
                  const cleanVal = loc.replace("📍 ", "");
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setNewPlanLocation(cleanVal)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-semibold font-mono border transition-all ${newPlanLocation === cleanVal
                        ? "bg-brand-peach/15 text-brand-peach border-brand-peach/40"
                        : "bg-zinc-950/50 text-zinc-505 border-zinc-900 hover:text-zinc-300"
                        }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timing Input + Spontaneous Pills */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-405 font-mono uppercase tracking-widest block font-extrabold text-brand-peach">3. Spontaneous Timing</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Clock className="w-3.5 h-3.5 text-[#ff8b66]" />
                </span>
                <input
                  type="text"
                  placeholder="e.g., TODAY • 8:30 PM, TOMORROW • 6:00 PM"
                  value={newPlanTime}
                  onChange={(e) => setNewPlanTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-brand-peach transition-all"
                  required
                />
              </div>

              {/* Quick timing button pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                {[
                  "⚡ Right Now!",
                  "⏰ TODAY • 8:30 PM",
                  "⏰ TODAY • 10:00 PM",
                  "⏰ TOMORROW • 6:00 PM",
                  "⏰ TOMORROW • 8:00 PM"
                ].map((tme) => {
                  const cleanVal = tme.replace("⚡ ", "").replace("⏰ ", "");
                  return (
                    <button
                      key={tme}
                      type="button"
                      onClick={() => setNewPlanTime(cleanVal)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-semibold font-mono border transition-all ${newPlanTime === cleanVal
                        ? "bg-brand-peach/15 text-brand-peach border-brand-peach/40"
                        : "bg-zinc-950/50 text-zinc-505 border-zinc-900 hover:text-zinc-300"
                        }`}
                    >
                      {tme}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <button
            type="button"
            onClick={() => {
              const titleToUse = newPlanTitle.trim();
              const locationToUse = newPlanLocation.trim();
              const timeToUse = newPlanTime.trim();

              if (!titleToUse) {
                triggerToast("Please enter or pick an Activity Name first.");
                return;
              }
              if (!locationToUse) {
                triggerToast("Please specify a target venue/spot first.");
                return;
              }
              if (!timeToUse) {
                triggerToast("Please select spontaneous timings.");
                return;
              }

              setCreateFlowStep("RECIPIENTS");
            }}
            className="w-full py-4 rounded-xl bg-zinc-105 hover:bg-zinc-200 text-zinc-955 font-display font-semibold text-xs uppercase tracking-wider transition-colors text-center cursor-pointer shadow-md flex items-center justify-center gap-1.5 font-bold"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 6: SELECT RECIPIENTS AUDIENCE (CIRCLE, FRIENDS OR MULTIPLE) */}
      {createFlowStep === "RECIPIENTS" && (
        <div className="space-y-5 animate-fade-in text-left">

          {/* Back button */}
          <button
            type="button"
            onClick={() => setCreateFlowStep("DETAILS")}
            className="text-xs font-mono font-medium text-zinc-550 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to core info</span>
          </button>

          <div className="space-y-1">
            <h3 className="text-sm font-display font-semibold text-zinc-200">Who's invited?</h3>
            <p className="text-[11px] text-zinc-500">Pick circles or individual friends.</p>
          </div>

          {/* Recipient Category Tab Pill Indicators */}
          <div className="grid grid-cols-3 gap-1 bg-zinc-905 p-1 rounded-xl">
            {[
              { key: "circle" as const, label: "Circle" },
              { key: "friends" as const, label: "Friends" },
              { key: "multiple" as const, label: "Multi Group" }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setAudienceType(tab.key);
                  setRecipientSearchQuery("");
                }}
                className={`py-1.5 text-[10px] font-mono rounded-lg transition-all border cursor-pointer ${audienceType === tab.key
                  ? "bg-zinc-950 text-white border-zinc-850 shadow-md font-semibold"
                  : "text-zinc-550 hover:text-zinc-350 border-transparent"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Real recipient list search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-zinc-650" />
            </span>
            <input
              type="text"
              placeholder={
                audienceType === "friends"
                  ? "Search by username or mobile..."
                  : "Search intimate buddy groups..."
              }
              value={recipientSearchQuery}
              onChange={(e) => setRecipientSearchQuery(e.target.value)}
              className="w-full bg-zinc-905 border border-zinc-850 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none"
            />
          </div>

          {/* AUDIENCE LIST CONTAINER */}
          <div className="bg-zinc-905/60 border border-zinc-900 rounded-3xl p-3 max-h-52 overflow-y-auto space-y-2 no-scrollbar">

            {/* Option A: Circle Member (Select exact ONE Circle) */}
            {audienceType === "circle" && (
              <div className="space-y-1.5">
                {circles
                  .filter(circle => circle.name.toLowerCase().includes(recipientSearchQuery.toLowerCase()))
                  .map((circle) => {
                    const isSelected = selectedCircleIds.includes(circle.id);
                    return (
                      <div
                        key={circle.id}
                        onClick={() => {
                          // Toggle Circle selection exclusively
                          setSelectedCircleIds([circle.id]);
                        }}
                        className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${isSelected
                          ? "bg-[#ff8b66]/10 border-[#ff8b66]/30"
                          : "bg-zinc-950/40 border-zinc-900 hover:border-zinc-850"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 text-left">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                            <img
                              src={circle.groupImage || circle.avatars[0]}
                              className="w-full h-full object-cover"
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs text-zinc-200 block font-semibold leading-none truncate">{circle.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono mt-1.5 block uppercase leading-none">{circle.membersCount} members</span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          checked={isSelected}
                          readOnly
                          className="accent-[#ff8b66] w-3.5 h-3.5 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                {circles.filter(circle => circle.name.toLowerCase().includes(recipientSearchQuery.toLowerCase())).length === 0 && (
                  <span className="text-xs text-zinc-650 block text-center py-4 font-mono">No matching group circles seen.</span>
                )}
              </div>
            )}

            {/* Option B: Friends Directory (Select multiple friends) */}
            {audienceType === "friends" && (
              <div className="space-y-1.5">
                {dbUsers
                  .filter(user => user.user_id !== activeUserId && user.full_name.toLowerCase().includes(recipientSearchQuery.toLowerCase()))
                  .map((user) => {
                    const isSelected = selectedFriendIds.includes(user.user_id);
                    return (
                      <div
                        key={user.user_id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFriendIds(prev => prev.filter(id => id !== user.user_id));
                          } else {
                            setSelectedFriendIds(prev => [...prev, user.user_id]);
                          }
                        }}
                        className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${isSelected
                          ? "bg-[#ff8b66]/10 border-[#ff8b66]/30"
                          : "bg-zinc-950/40 border-zinc-900 hover:border-zinc-805"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 text-left">
                          <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-[10px] font-mono text-zinc-300">
                            {user.full_name[0]}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs text-zinc-205 block font-semibold leading-none">{user.full_name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono mt-1 block">@{user.username}</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="accent-[#ff8b66] w-3.5 h-3.5 rounded pointer-events-none"
                        />
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Option C: Blast multiple groups checklist */}
            {audienceType === "multiple" && (
              <div className="space-y-1.5">
                {circles
                  .filter(circle => circle.name.toLowerCase().includes(recipientSearchQuery.toLowerCase()))
                  .map((circle) => {
                    const isSelected = selectedCircleIds.includes(circle.id);
                    return (
                      <div
                        key={circle.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCircleIds(prev => prev.filter(id => id !== circle.id));
                          } else {
                            setSelectedCircleIds(prev => [...prev, circle.id]);
                          }
                        }}
                        className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${isSelected
                          ? "bg-[#ff8b66]/10 border-[#ff8b66]/30"
                          : "bg-zinc-950/40 border-zinc-900 hover:border-zinc-800"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 text-left">
                          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                            <img
                              src={circle.groupImage || circle.avatars[0]}
                              className="w-full h-full object-cover"
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-xs text-zinc-205 font-medium truncate max-w-[170px] leading-none">{circle.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="accent-[#ff8b66] w-3.5 h-3.5 pointer-events-none"
                        />
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Feedback indicator section */}
          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-2xl text-center select-none">
            <span className="text-[10px] font-mono text-brand-peach font-semibold">
              {audienceType === "circle"
                ? selectedCircleIds.length > 0
                  ? `✓ Selected (1) Circle Target: ${circles.find(c => c.id === selectedCircleIds[0])?.name}`
                  : "Pick exactly one target buddy group circle"
                : audienceType === "friends"
                  ? selectedFriendIds.length > 0
                    ? `✓ Chosen (${selectedFriendIds.length}) recipient friends`
                    : "Configure select recipient friends checklist"
                  : selectedCircleIds.length > 0
                    ? `✓ Chosen (${selectedCircleIds.length}) group circles to blast`
                    : "Choose multiple group circles to target"
              }
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const hasCircleRecipients = audienceType === "circle" && selectedCircleIds.length > 0;
              const hasFriendsRecipients = audienceType === "friends" && selectedFriendIds.length > 0;
              const hasMultiRecipients = audienceType === "multiple" && selectedCircleIds.length > 0;

              if (!hasCircleRecipients && !hasFriendsRecipients && !hasMultiRecipients) {
                triggerToast("Please pick at least one recipient first before proceeding.");
                return;
              }

              // Tweak details and progress to custom note splitting step
              setCreateFlowStep("EXTRA");
            }}
            className="w-full py-4 rounded-xl bg-zinc-105 hover:bg-zinc-200 text-zinc-955 font-display font-semibold text-xs uppercase tracking-wider transition-colors text-center cursor-pointer shadow-md flex items-center justify-center gap-1.5 font-bold"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 7: SET UP NOTES & SPLIT EXPENSES (Optional) */}
      {createFlowStep === "EXTRA" && selectedExperience && (
        <div className="space-y-5 animate-fade-in text-left">

          {/* Back button */}
          <button
            type="button"
            onClick={() => setCreateFlowStep("RECIPIENTS")}
            className="text-xs font-mono font-medium text-zinc-550 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to recipients selection</span>
          </button>

          <div className="space-y-1">
            <h3 className="text-sm font-display font-semibold text-zinc-200">Extra details</h3>
            <p className="text-[11px] text-zinc-505 font-sans">Add optional notes or a split amount.</p>
          </div>

          <div className="bg-zinc-905 border border-zinc-900 rounded-2xl p-4 space-y-4">

            {/* Co-ordination notes (Optional) */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-405 font-mono uppercase tracking-widest block font-extrabold text-[#ff8b66]">1. Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g., Meet near Gate B inside Starbucks. Wear white sneakers, and don't be late!"
                value={customPlanNotes}
                onChange={(e) => setCustomPlanNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-brand-peach transition-all"
              />
            </div>

            {/* Split amount layout setup (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-zinc-405 font-mono uppercase tracking-widest block font-extrabold text-[#ff8b66]">2. Social Split Amount (Optional)</label>
                <span className="text-[9px] font-mono text-zinc-550 italic">Non-fintech, secondary</span>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 font-mono text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="0 (Free hang)"
                  value={newPlanCost === "0" ? "" : newPlanCost}
                  onChange={(e) => setNewPlanCost(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-brand-peach transition-all"
                />
              </div>

              {/* Fast presets split buttons to eliminate typing */}
              <div className="flex gap-1.5 py-0.5 max-w-full overflow-x-auto no-scrollbar">
                {[
                  { val: "0", display: "Free Hang" },
                  { val: "100", display: "₹100" },
                  { val: "250", display: "₹250" },
                  { val: "500", display: "₹500" },
                  { val: "1000", display: "₹1k" }
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setNewPlanCost(preset.val)}
                    className={`shrink-0 px-3 py-1 rounded-full text-[9px] font-mono border transition-all cursor-pointer ${newPlanCost === preset.val
                      ? "bg-brand-peach/15 text-brand-peach border-brand-peach/40 font-semibold"
                      : "bg-zinc-950/50 text-zinc-505 border-zinc-900 hover:text-zinc-300"
                      }`}
                  >
                    {preset.display}
                  </button>
                ))}
              </div>
            </div>

            {/* Spots limit dropdown */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-405 font-mono uppercase tracking-widest block font-extrabold text-[#ff8b66]">3. Spot Limit Cap</label>
              <select
                value={newPlanSpots}
                onChange={(e) => setNewPlanSpots(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="4">Limit to 4 intimate friends</option>
                <option value="6">Limit to 6 friend spots</option>
                <option value="8">Limit to 8 friend spots</option>
                <option value="12">Limit to 12 squad spot cap</option>
                <option value="20">Limit to 20 large meetup slots</option>
              </select>
            </div>

          </div>

          <button
            type="button"
            onClick={() => {
              // Force zero on blank
              if (!newPlanCost) setNewPlanCost("0");
              setCreateFlowStep("PREVIEW");
            }}
            className="w-full py-4 rounded-xl bg-zinc-105 hover:bg-zinc-200 text-zinc-955 font-display font-semibold text-xs uppercase tracking-wider transition-colors text-center cursor-pointer shadow-md flex items-center justify-center gap-1.5 font-bold"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 8 & 9: PREVIEW AND HOST SPONTANEOUS COORDINATE SCREEN */}
      {createFlowStep === "PREVIEW" && selectedExperience && (
        <div className="space-y-5 animate-fade-in text-left">

          {/* Back button */}
          <button
            type="button"
            onClick={() => setCreateFlowStep("EXTRA")}
            className="text-xs font-mono font-medium text-zinc-550 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to setups</span>
          </button>

          <div className="space-y-1">
            <h3 className="text-sm font-display font-semibold text-zinc-200">Review Slate Coordinate</h3>
            <p className="text-[11px] text-zinc-500 font-sans">Distraction-free summary preview cards. Host plan instantly.</p>
          </div>

          {/* THE BEAUTIFUL DRAFT CARD PREVIEW - Step 8 of Custom Flow */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-850 rounded-3xl p-5 space-y-4 shadow-2xl relative select-none">

            {/* Subtle banner decoration */}
            <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-950">
              <img
                src={newPlanUploadedImage || selectedExperience.image}
                className="w-full h-full object-cover opacity-60"
                alt="Plan cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

              {/* Date badge */}
              <span className="absolute bottom-3 left-3 bg-[#ff8b66]/20 backdrop-blur-md text-brand-peach font-mono font-bold text-[8px] uppercase tracking-widest px-3 py-1 rounded-full border border-brand-peach/30">
                SPONTANEOUS DRAFT
              </span>
            </div>

            {/* Core details readout */}
            <div className="space-y-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#ff8b66] font-bold">ACTIVITY COORDINATE</span>
                <h2 className="text-lg font-display font-semibold text-white tracking-tight leading-snug uppercase">
                  {newPlanTitle || "Untitled Coordinate"}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-2 border-t border-b border-zinc-900/60 py-3">

                {/* Timing details */}
                <div className="flex items-center gap-2.5">
                  <Clock className="w-3.5 h-3.5 text-brand-peach shrink-0" />
                  <span className="text-xs text-zinc-300 font-mono font-medium truncate">
                    {newPlanTime || "TBD TIMINGS"}
                  </span>
                </div>

                {/* Location Spot */}
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-peach shrink-0" />
                  <span className="text-xs text-zinc-350 truncate">
                    {newPlanLocation || "TBD COORDINATE VENUE"}
                  </span>
                </div>

                {/* Split cost badges */}
                <div className="flex items-center gap-2.5">
                  <Landmark className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
                  <span className="text-xs text-zinc-400 font-mono">
                    {parseFloat(newPlanCost) > 0 ? (
                      <span className="text-[#ff8b66] font-semibold">₹{newPlanCost} split amount</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Bring Spontaneous Vibes (Free)</span>
                    )}
                  </span>
                </div>

                {/* Targeted recipients summary screen */}
                <div className="flex items-center gap-2.5">
                  <Users className="w-3.5 h-3.5 text-zinc-555 shrink-0" />
                  <span className="text-xs text-zinc-300 font-sans">
                    {audienceType === "circle" && `Target Circle: ${circles.find(c => c.id === selectedCircleIds[0])?.name || "Workspace Circle"}`}
                    {audienceType === "friends" && `Target: ${selectedFriendIds.length} specific friends`}
                    {audienceType === "multiple" && `Multiple Blast: ${selectedCircleIds.length} group circles`}
                  </span>
                </div>
              </div>

              {/* Optional custom notes display quote text style */}
              {customPlanNotes.trim() && (
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-3 select-none text-left">
                  <span className="text-[8px] font-mono text-zinc-555 block uppercase tracking-wider mb-1 font-extrabold">COORDINATORS NOTE</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed italic font-serif">
                    “{customPlanNotes.trim()}”
                  </p>
                </div>
              )}

            </div>

            {/* Banner Upload Option integrated inside preview step */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-900 text-xs">
              <span className="text-[10px] text-zinc-500 font-mono">Tweak Banner cover?</span>
              <label className="text-[9px] font-mono text-[#ff8b66] hover:text-[#ffab8f] cursor-pointer bg-zinc-950/40 border border-zinc-850 px-2.5 py-1 rounded-lg">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === "string") {
                          setNewPlanUploadedImage(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <span>{newPlanUploadedImage ? "📷 Change image" : "📷 Upload file"}</span>
              </label>
            </div>
          </div>

          {/* Form to invoke the submission */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleHostPlanSubmit();
            }}
            className="space-y-3"
          >
            {/* STEP 9: OFFICIAL HOST PLAN TRIGGER */}
            <button
              id="host_plan_submit_btn"
              type="submit"
              className="w-full py-4 rounded-xl bg-brand-orange text-white font-display font-black text-xs uppercase tracking-widest hover:bg-opacity-80 active:scale-[0.99] transition-all text-center cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <span>Host Plan</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
