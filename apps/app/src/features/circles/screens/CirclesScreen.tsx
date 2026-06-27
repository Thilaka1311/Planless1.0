import React, { useState } from 'react';
import { useToast } from "../../../shared/contexts/ToastContext";
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
    setActiveTab,
    dbUsers, setCircles, plans, setPaymentConfirmationPlanId, handleToggleJoin,
    setSelectedPlanId, setSelectedMemoryPlanId,
    handleCreateCircle
  } = props;
  const { showToast } = useToast();

  // Three views: chat | detail | add_members
  const [subView, setSubView] = React.useState<"chat" | "detail" | "add_members">("chat");
  const [chatType, setChatType] = useState<"general" | "plan">("general");
  const [activeChatPlanId, setActiveChatPlanId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  const [circleSearchQuery, setCircleSearchQuery] = useState('');

  React.useEffect(() => {
    const isDetailOrFlow = !!selectedCircle || !!circleCreateStep;
    props.onToggleBottomNav?.(isDetailOrFlow);
    return () => {
      props.onToggleBottomNav?.(false);
    };
  }, [selectedCircle, circleCreateStep, props.onToggleBottomNav]);

  React.useEffect(() => {
    if (selectedCircle && !props.activePlanChatId) {
      setSubView("chat");
    }
  }, [selectedCircle, props.activePlanChatId]);

  React.useEffect(() => {
    if (props.activePlanChatId) {
      const livePlan = plans.find(
        (p: any) => p.id === props.activePlanChatId || p.dbUuid === props.activePlanChatId
      );
      if (livePlan) {
        const planCircleId = livePlan.circleId || livePlan.circle_id;
        const matchedCircle = circles.find(
          (c: any) => c.id === planCircleId || c.dbUuid === planCircleId || c.circle_id === planCircleId
        );
        if (matchedCircle) {
          setSelectedCircle(matchedCircle);
          setChatType("plan");
          setActiveChatPlanId(props.activePlanChatId);
          setSubView("chat");
        }
      }
    }
  }, [props.activePlanChatId, circles, setSelectedCircle, plans]);

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
          </motion.div>
        ) : subView === "chat" ? (
          // ─── CIRCLE CHAT OR HUB ─────────────────────────────────────────
          chatType === "plan" ? (
            <CircleChatScreen
              key="chat"
              circle={selectedCircle}
              chatType={chatType}
              planId={activeChatPlanId || undefined}
              onBack={() => {
                props.setActivePlanChatId?.(null);
                setChatType("general");
                setActiveChatPlanId(null);
              }}
              onHeaderClick={() => setSubView("detail")}
              onNavigate={(screen) => {
                if (screen === 'immersive_plan' && activeChatPlanId) {
                  setSelectedPlanId?.(activeChatPlanId);
                }
              }}
              onLeavePlan={() => {
                showToast?.("You left the plan.");
                setChatType("general");
                setActiveChatPlanId(null);
                setSubView("chat");
                props.setActivePlanChatId?.(null);
                setSelectedPlanId?.(null);
              }}
              onEditPlan={(planIdToEdit) => {
                if (props.onEditPlan) {
                  props.onEditPlan(planIdToEdit);
                } else {
                  setSelectedPlanId?.(planIdToEdit);
                }
              }}
              onEndPlan={(planId) => {
                showToast?.("Ended plan thread.");
                setChatType("general");
                setActiveChatPlanId(null);
                setSubView("chat");
                props.setActivePlanChatId?.(null);
              }}
            />
          ) : (
            <CircleHubScreen
              key="hub"
              circle={selectedCircle}
              onBack={() => {
                setSelectedCircle(null);
              }}
              onHeaderClick={() => setSubView("detail")}
              plans={plans}
            />
          )
        ) : subView === "detail" ? (
          <CircleDetailScreen
            key="detail"
            circle={selectedCircle}
            plans={plans}
            activeUserId={activeUserId}
            onBack={() => setSubView("chat")}
            onAddMembers={() => setSubView("add_members")}
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
          />
        )}
      </AnimatePresence>    </div>
  );
};
