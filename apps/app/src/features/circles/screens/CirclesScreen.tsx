import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, MoreVertical, Settings, X, Check, Search } from "lucide-react";
import { CircleDetailScreen } from "./CircleDetailScreen";
import { CircleChatScreen } from "./CircleChatScreen";
import { CircleHubScreen } from "./CircleHubScreen";
import { CreateCircleMembersScreen } from "./CreateCircleMembersScreen";
import { CreateCircleDetailsScreen } from "./CreateCircleDetailsScreen";
import { AddMembersScreen } from "./AddMembersScreen";
import { InterlockingRingsIcon } from "../../../components/InterlockingRingsIcon";
import { CircleCard } from "../../../components/CircleCard";
import { EmptyState } from "../../home/components/EmptyState";
import { SearchBar } from "../../../components/SearchBar";
import { getInitialsAvatar } from "../../../demo/seedData";

export const CirclesScreen = (props: any) => {
  const {
    circleCreateStep, setCircleCreateStep,
    circles,
    selectedCircle, setSelectedCircle,
    activeUserId,
    setIsInvitingFriends,
    setNewPlanCircleId, setNewPlanTitle, setSelectedExperience: setSelectedPreset,
    setAudienceType, setSelectedCircleIds, setActiveTab, setCreateFlowStep, triggerToast,
    dbUsers, setCircles, plans, setPaymentConfirmationPlan, handleToggleJoin,
    setSelectedPlan, setActiveStoryRecap, setSelectedMemoryPlan,
    handleCreateCircle
  } = props;

  // Four views: hub | chat | detail | add_members
  const [subView, setSubView] = React.useState<"hub" | "chat" | "detail" | "add_members">("hub");
  const [chatType, setChatType] = useState<"general" | "plan">("general");
  const [activeChatPlan, setActiveChatPlan] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  // State for the new creation slider sheet inside Circles list
  const [isCreateCircleOpen, setIsCreateCircleOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleTagline, setNewCircleTagline] = useState('');
  const [newCircleInvites, setNewCircleInvites] = useState<string[]>([]);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [successCircleName, setSuccessCircleName] = useState('');
  const [circleSearchQuery, setCircleSearchQuery] = useState('');

  React.useEffect(() => {
    if (selectedCircle && !props.activePlanChat) {
      setSubView("hub");
    }
  }, [selectedCircle, props.activePlanChat]);

  React.useEffect(() => {
    if (props.activePlanChat) {
      const planCircleId = props.activePlanChat.circleId || props.activePlanChat.circle_id;
      const matchedCircle = circles.find(
        (c: any) => c.id === planCircleId || c.dbUuid === planCircleId || c.circle_id === planCircleId
      );
      if (matchedCircle) {
        setSelectedCircle(matchedCircle);
        setChatType("plan");
        setActiveChatPlan(props.activePlanChat);
        setSubView("chat");
      }
    }
  }, [props.activePlanChat, circles, setSelectedCircle]);

  const filteredCircles = circles.filter((circle: any) => {
    const q = circleSearchQuery.toLowerCase();
    const hasActivePlan = plans.some((p: any) => (p.circleId === circle.id || p.circleId === circle.dbUuid) && !p.isHappened && p.status !== "cancelled" && p.title.toLowerCase().includes(q));
    return (
      circle.name.toLowerCase().includes(q) ||
      (circle.tagline && circle.tagline.toLowerCase().includes(q)) ||
      (circle.description && circle.description.toLowerCase().includes(q)) ||
      hasActivePlan
    );
  });

  const toggleInviteForNewCircle = (friendId: string) => {
    const isAlreadySelected = newCircleInvites.includes(friendId);
    if (isAlreadySelected) {
      setNewCircleInvites(newCircleInvites.filter(id => id !== friendId));
    } else {
      setNewCircleInvites([...newCircleInvites, friendId]);
    }
  };

  const handleCreateNewCircle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) {
      triggerToast("Please provide a name for the circle.");
      return;
    }
    
    const groupPhotosPool = [
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=240',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=240',
      'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&q=80&w=240',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=240',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=240'
    ];
    const hashIndex = Math.abs(newCircleName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % groupPhotosPool.length;
    const assignedPhoto = groupPhotosPool[hashIndex];

    handleCreateCircle(
      newCircleName.toUpperCase(),
      newCircleTagline || 'Spontaneous friend group',
      assignedPhoto,
      newCircleInvites
    );

    setSuccessCircleName(newCircleName.toUpperCase());

    // Reset form
    setNewCircleName('');
    setNewCircleTagline('');
    setNewCircleInvites([]);
    setIsCreateCircleOpen(false);
    setShowCreateSuccess(true);
  };

  const eligibleUsers = dbUsers.filter((u: any) => u.user_id !== activeUserId);

  return (
    <div id="circles_tab_pane" className="flex-1 flex flex-col relative overflow-hidden h-full bg-[#050505]">
      <AnimatePresence mode="wait">
        {circleCreateStep === "members" ? (
          <CreateCircleMembersScreen
            dbUsers={dbUsers}
            activeUserId={activeUserId}
            onBack={() => setCircleCreateStep(null)}
            onNext={(selectedIds) => {
              setSelectedFriendIds(selectedIds);
              setCircleCreateStep("details");
            }}
          />
        ) : circleCreateStep === "details" ? (
          <CreateCircleDetailsScreen
            selectedMemberIds={selectedFriendIds}
            dbUsers={dbUsers}
            onBack={() => setCircleCreateStep("members")}
            onSubmit={(name, description, image) => {
              handleCreateCircle(name, description, image, selectedFriendIds);
              setCircleCreateStep(null);
              setSelectedFriendIds([]);
            }}
          />
        ) : !selectedCircle ? (
          // ─── ALL CIRCLES LIST ──────────────────────────────────────────
          <motion.div
            key="view_all_circles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="view_all_circles_container"
            className="flex-1 flex flex-col relative overflow-hidden h-full"
          >
            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto scrollbar-none px-6 pt-2 pb-24">
              {/* Premium Minimal Header Block */}
              <div className="mb-3.5 mt-1 flex justify-between items-center">
                <div>
                  <h2 className="font-display font-semibold text-[28px] tracking-tight text-white mb-0.5">
                    Circles
                  </h2>
                  <p className="text-zinc-550 text-[13px] font-sans tracking-wide">
                    Your people.
                  </p>
                </div>

                <div className="relative">
                  <button
                    id="circles_menu_btn"
                    onClick={() => setShowMenu(prev => !prev)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-9 z-50 bg-zinc-900 border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden min-w-[140px] animate-fade-in animate-duration-200">
                      <button
                        id="circles_settings_btn"
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

              {/* Premium Minimalist Search Bar */}
              <SearchBar 
                value={circleSearchQuery} 
                onChange={setCircleSearchQuery} 
                placeholder="Search circles" 
                pulseIcon={false}
              />

              {/* Circles Listing or Empty state */}
              {circles.length === 0 ? (
                <EmptyState
                  variant="dashed"
                  icon={<InterlockingRingsIcon className="w-10 h-10 text-[#FF6B2C]" strokeWidth={1.8} />}
                  title="Your index is empty"
                  description="Create your first circle to start organizing spontaneous plans."
                />
              ) : filteredCircles.length === 0 ? (
                <EmptyState
                  variant="dashed"
                  title="No matching circles"
                  description="Try searching for another group or establish a new circle."
                />
              ) : (
                /* Premium lightweight Index Cards */
                <div className="space-y-2">
                  {filteredCircles.map((circle: any) => {
                    const circleActivePlans = plans.filter(
                      (p: any) => (p.circleId === circle.id || p.circleId === circle.dbUuid) && !p.isHappened && p.status !== "cancelled"
                    );
                    return (
                      <CircleCard 
                        key={circle.id} 
                        circle={circle} 
                        onClick={() => setSelectedCircle(circle)} 
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Circular Floating Action Button (FAB) */}
            <button
              type="button"
              onClick={() => setIsCreateCircleOpen(true)}
              className="absolute bottom-24 right-6 w-[50px] h-[50px] bg-[#D95A23] text-white rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-[1.03] focus:outline-none z-35 group"
              style={{ boxShadow: '0 4px 12px rgba(217, 90, 35, 0.2), inset 0 1px 0 rgba(255,255,255,0.12)' }}
              aria-label="Create Circle"
            >
              <InterlockingRingsIcon className="w-[34px] h-[21px] text-white group-hover:scale-105 transition-transform" strokeWidth={1.8} withPlus={true} />
            </button>
          </motion.div>
        ) : subView === "hub" ? (
          // ─── CIRCLE HUB ────────────────────────────────────────────────
          <CircleHubScreen
            key="hub"
            circle={selectedCircle}
            userPlans={plans}
            onBack={() => setSelectedCircle(null)}
            onSelectGeneralChat={() => {
              setChatType("general");
              setActiveChatPlan(null);
              setSubView("chat");
            }}
            onSelectPlanThread={(planId) => {
              const matchedPlan = plans.find(
                (p: any) => p.id === planId || p.plan_id === planId || p.dbUuid === planId
              );
              setChatType("plan");
              setActiveChatPlan(matchedPlan);
              setSubView("chat");
            }}
            onNavigateToCreate={() => {
              setNewPlanCircleId?.(selectedCircle.id);
              setNewPlanTitle?.(`Meetup with ${selectedCircle.name}`);
              setSelectedPreset?.("custom");
              setAudienceType?.("circle");
              setSelectedCircleIds?.([selectedCircle.id]);
              setActiveTab?.("create");
              setCreateFlowStep?.("DETAILS");
              triggerToast?.(`Creating plan for ${selectedCircle.name} ⚡`);
            }}
            onNavigateToSettings={() => setSubView("detail")}
          />
        ) : subView === "chat" ? (
          // ─── CIRCLE CHAT ───────────────────────────────────────────────
          <CircleChatScreen
            key="chat"
            circle={selectedCircle}
            chatType={chatType}
            plan={activeChatPlan}
            onBack={() => {
              setSubView("hub");
              props.setActivePlanChat?.(null);
            }}
            onNavigate={(screen) => {
              if (screen === 'immersive_plan' && activeChatPlan) {
                setSelectedPlan?.(activeChatPlan);
              }
            }}
            onLeavePlan={() => {
              triggerToast?.("Left plan coordination.");
              setSubView("hub");
              props.setActivePlanChat?.(null);
            }}
            onEditPlan={(planToEdit) => {
              if (props.onEditPlan) {
                props.onEditPlan(planToEdit);
              } else {
                setSelectedPlan?.(planToEdit);
              }
            }}
            onEndPlan={(planId) => {
              triggerToast?.("Ended plan thread.");
              setSubView("hub");
              props.setActivePlanChat?.(null);
            }}
          />
        ) : subView === "detail" ? (
          // ─── UNIFIED CIRCLE DETAIL + SETTINGS ─────────────────────────
          <CircleDetailScreen
            key="detail"
            circle={selectedCircle}
            plans={plans}
            activeUserId={activeUserId}
            onBack={() => setSubView("hub")}
            onAddMembers={() => setSubView("add_members")}
            setSelectedPlan={setSelectedPlan}
            setSelectedMemoryPlan={setSelectedMemoryPlan}
            setPaymentConfirmationPlan={setPaymentConfirmationPlan}
            handleToggleJoin={handleToggleJoin}
            setActiveStoryRecap={setActiveStoryRecap}
            setNewPlanCircleId={setNewPlanCircleId}
            setNewPlanTitle={setNewPlanTitle}
            setSelectedPreset={setSelectedPreset}
            setAudienceType={setAudienceType}
            setSelectedCircleIds={setSelectedCircleIds}
            setActiveTab={setActiveTab}
            setCreateFlowStep={setCreateFlowStep}
            triggerToast={triggerToast}
            setCircles={setCircles}
            setSelectedCircle={setSelectedCircle}
            dbUsers={dbUsers}
          />
        ) : (
          // ─── DEDICATED ADD MEMBERS FLOW ───────────────────────────────
          <AddMembersScreen
            key="add_members"
            circle={selectedCircle}
            dbUsers={dbUsers}
            activeUserId={activeUserId}
            onBack={() => setSubView("detail")}
            setCircles={setCircles}
            setSelectedCircle={setSelectedCircle}
            triggerToast={triggerToast}
          />
        )}
      </AnimatePresence>

      {/* --- CREATE CIRCLE SUCCESS STATE OVERLAY --- */}
      {showCreateSuccess && (
        <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in animate-duration-200 select-none">
          <div className="w-20 h-20 rounded-full bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 flex items-center justify-center text-[#FF6B2C] mb-6 shadow-xl shadow-[#FF6B2C]/5">
            <InterlockingRingsIcon className="w-12 h-12" strokeWidth={2.4} />
          </div>
          
          <h3 className="font-display font-bold text-lg tracking-wider text-white mb-2 uppercase">
            {successCircleName} Established
          </h3>
          <p className="text-zinc-550 text-xs max-w-[240px] leading-relaxed mb-8">
            Your private close circle coordinator is fully configured and ready to organize spontaneous plans.
          </p>

          <button 
            type="button"
            onClick={() => setShowCreateSuccess(false)}
            className="py-2.5 px-8 rounded-xl bg-white text-black font-semibold text-xs tracking-wide transition active:scale-95 shadow-lg shadow-white/5 hover:bg-neutral-100"
          >
            Done
          </button>
        </div>
      )}

      {/* --- CREATE NEW CIRCLE IMMERSIVE OVERLAY SLIDER SHEET --- */}
      {isCreateCircleOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-45 flex flex-col justify-end">
          {/* Dismiss backdrop spacer tap handler */}
          <div className="flex-1" onClick={() => setIsCreateCircleOpen(false)}></div>
          
          {/* Bottom sheet dialog container */}
          <form 
            onSubmit={handleCreateNewCircle}
            className="w-full bg-[#050505] border-t border-white/10 rounded-t-[32px] p-6 space-y-5 shadow-2xl relative overflow-y-auto max-h-[85%] pb-10"
          >
            {/* Pull down slider pill accent */}
            <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-2 mb-4"></div>
            
            {/* Top row controls */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-semibold text-lg text-white">
                  Establish Circle
                </h3>
                <p className="text-zinc-550 text-[10.5px]">
                  Introduce your close circle coordinator.
                </p>
              </div>
              
              <button 
                type="button"
                onClick={() => setIsCreateCircleOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-90 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form inputs */}
            <div className="space-y-4">
              {/* Circle name */}
              <div>
                <label className="block text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 font-bold">Circle Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. CASUAL FOOTBALLERS, RAMEN CLUB"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  className="w-full bg-[#0D0D10]/95 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 tracking-wide focus:outline-none focus:border-[#FF6B2C]/40 text-transform-uppercase uppercase font-bold transition"
                />
              </div>
              
              {/* Circle description */}
              <div>
                <label className="block text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 font-bold">Circle Hook / Tagline</label>
                <input 
                  type="text" 
                  placeholder="e.g. Always coordinate food. Spontaneous runs."
                  value={newCircleTagline}
                  onChange={(e) => setNewCircleTagline(e.target.value)}
                  className="w-full bg-[#0D0D10]/95 border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-[#FF6B2C]/40 transition animate-none"
                />
              </div>

              {/* Invite members list checkboxes */}
              <div>
                <label className="block text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider mb-2 font-bold">Coordinate Members ({newCircleInvites.length} selected)</label>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-none pr-1">
                  {eligibleUsers.map((friend: any) => {
                    const isAlreadySelected = newCircleInvites.includes(friend.user_id);
                    return (
                      <div 
                        key={friend.user_id}
                        onClick={() => toggleInviteForNewCircle(friend.user_id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isAlreadySelected 
                            ? 'bg-[#FF6B2C]/5 border-[#FF6B2C]/25' 
                            : 'bg-white/[0.02] border-white/5'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={friend.profile_photo || getInitialsAvatar(friend.full_name)} 
                            alt={friend.full_name} 
                            className="w-7.5 h-7.5 rounded-full object-cover" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getInitialsAvatar(friend.full_name);
                            }}
                          />
                          <div>
                            <span className="text-xs font-semibold text-zinc-200 block">{friend.full_name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono block leading-none mt-0.5 uppercase">@{friend.username}</span>
                          </div>
                        </div>
                        
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition ${
                          isAlreadySelected ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white' : 'border-zinc-700'
                        }`}>
                          {isAlreadySelected && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Primary submit action */}
            <div className="pt-2 text-center">
              <button 
                type="submit"
                className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-3.5 rounded-xl font-semibold text-xs tracking-wide transition shadow-lg shadow-[#FF6B2C]/10 active:scale-98"
              >
                ESTABLISH PRIVATE CIRCLE
              </button>
              
              <button 
                type="button"
                onClick={() => setIsCreateCircleOpen(false)}
                className="mt-2.5 text-[10.5px] text-zinc-500 hover:text-white transition"
              >
                Dismiss creation draft
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
