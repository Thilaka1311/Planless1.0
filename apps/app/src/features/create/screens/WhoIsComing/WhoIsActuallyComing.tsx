import React, { useState, useEffect } from 'react';
import { GoingSection } from './Components/GoingSection';
import { WaitlistSection } from './Components/WaitlistSection';
import { PlanDetailOverviewCard } from './Components/PlanDetailOverviewCard';
import { UserAvatar } from '../../../../IMGfromDB/UserAvatar';
import { AnimatePresence } from 'motion/react';
import { PlanSizeSlider } from '../WhenIsPlan/Components/PlanSizeSlider';
import { ContinueButton } from '../../components/ContinueButton';

interface Friend {
  id: string;
  dbUuid: string;
  name: string;
  avatar: string;
  isHost?: boolean;
}

interface WhoIsActuallyComingProps {
  form: any;
  onBack: () => void;
  onContinue: () => void;
  onAddFriends?: () => void;
  selectedCategory?: string;
}

export const WhoIsActuallyComing: React.FC<WhoIsActuallyComingProps> = ({
  form,
  onBack,
  onContinue,
  onAddFriends,
  selectedCategory = 'custom'
}) => {
  const selectedFriends: Friend[] = form.selectedFriends || [];
  const capacity = form.totalCapacity || 2;

  // Build the Host Item object if the host is part of the plan
  const hostItem: Friend | null = form.isHostSelected ? {
    id: 'host',
    dbUuid: form.userProfile?.dbUuid || 'host',
    name: form.userProfile?.name || 'You',
    avatar: form.userProfile?.avatar || form.userProfile?.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=You`,
    isHost: true
  } : null;

  // Ordered lists
  const [goingList, setGoingList] = useState<Friend[]>([]);
  const [waitlist, setWaitlist] = useState<Friend[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedOverList, setDraggedOverList] = useState<'going' | 'waitlist' | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Active segmented tab state
  const [activeTab, setActiveTab] = useState<'going' | 'waitlist'>('going');

  // Plan Details popover state
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);

  // Plan size adjustment slider open state
  const [isPlanSizeOpen, setIsPlanSizeOpen] = useState(false);

  // Click outside to collapse plan size slider
  useEffect(() => {
    if (!isPlanSizeOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.plan-size-card-container')) {
        setIsPlanSizeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isPlanSizeOpen]);

  // Format date parts to match WhenIsPlanScreen header summary
  const eventDateObj = form.eventDateTime ? new Date(form.eventDateTime) : new Date();
  const formattedDate = eventDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const formattedTime = eventDateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const planTitle = form.localTitle || "New Activity";

  // Bottom action sheet states
  const [selectedItem, setSelectedItem] = useState<Friend | null>(null);
  const [sheetType, setSheetType] = useState<'going' | 'waitlist' | null>(null);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  // Sync to form whenever local goingList updates
  useEffect(() => {
    if (goingList.length > 0) {
      form.setPriorityGuestIds(goingList.map(item => item.id));
    }
  }, [goingList]);

  // Initial distribution
  useEffect(() => {
    const allList = [
      ...(hostItem ? [hostItem] : []),
      ...selectedFriends
    ];

    let initialGoing: Friend[] = [];
    let initialWait: Friend[] = [];

    if (form.priorityGuestIds && form.priorityGuestIds.length > 0) {
      const resolvedGoing = form.priorityGuestIds
        .map((id: string) => allList.find(f => f.id === id))
        .filter(Boolean) as Friend[];
      
      if (resolvedGoing.length > capacity) {
        initialGoing = resolvedGoing.slice(0, capacity);
        const excess = resolvedGoing.slice(capacity);
        const nonPrioritized = allList.filter(f => !form.priorityGuestIds.includes(f.id));
        initialWait = [...excess, ...nonPrioritized];
      } else {
        initialGoing = resolvedGoing;
        initialWait = allList.filter(f => !form.priorityGuestIds.includes(f.id));
      }
    } else {
      initialGoing = allList.slice(0, capacity);
      initialWait = allList.slice(capacity);
    }

    setGoingList(initialGoing);
    setWaitlist(initialWait);
  }, [selectedFriends, capacity, form.isHostSelected]);

  // ── Drag & Drop Handlers (Waitlist ONLY) ──
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDraggedOverList(null);
    setHoveredIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, listType: 'going' | 'waitlist', idx?: number) => {
    e.preventDefault();
    setDraggedOverList(listType);
    if (idx !== undefined && listType === 'waitlist' && draggedId) {
      const draggedIdx = waitlist.findIndex(f => f.id === draggedId);
      if (draggedIdx !== -1 && draggedIdx !== idx) {
        const newWait = [...waitlist];
        const [removed] = newWait.splice(draggedIdx, 1);
        newWait.splice(idx, 0, removed);
        setWaitlist(newWait);
        setHoveredIndex(idx);
      }
    } else if (idx !== undefined) {
      setHoveredIndex(idx);
    } else if (e.target === e.currentTarget) {
      setHoveredIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetList: 'going' | 'waitlist') => {
    e.preventDefault();
    handleDragEnd();
  };

  // ── Action Sheet Functions ──
  const handleItemTap = (item: Friend, type: 'going' | 'waitlist') => {
    setSelectedItem(item);
    setSheetType(type);
    setShowConfirmRemove(false);
  };

  const moveToWaitlist = (item: Friend) => {
    setGoingList(prev => prev.filter(f => f.id !== item.id));
    setWaitlist(prev => [...prev.filter(f => f.id !== item.id), item]);
    closeSheet();
  };

  const moveToGoing = (item: Friend) => {
    let newGoing = [...goingList.filter(f => f.id !== item.id)];
    let newWait = [...waitlist.filter(f => f.id !== item.id)];

    if (newGoing.length >= capacity) {
      const displacedItem = newGoing[newGoing.length - 1];
      newGoing = newGoing.slice(0, newGoing.length - 1);
      newWait = [displacedItem, ...newWait];
    }

    if (item.isHost) {
      newGoing.unshift(item);
    } else {
      newGoing.push(item);
    }

    setGoingList(newGoing);
    setWaitlist(newWait);
    closeSheet();
  };

  const removeFromPlan = (item: Friend) => {
    setGoingList(prev => prev.filter(f => f.id !== item.id));
    setWaitlist(prev => prev.filter(f => f.id !== item.id));

    const updatedFriends = selectedFriends.filter(f => f.id !== item.id);
    form.setSelectedFriends(updatedFriends);

    if (item.isHost) {
      form.setIsHostSelected(false);
    }
    closeSheet();
  };

  const closeSheet = () => {
    setSelectedItem(null);
    setSheetType(null);
    setShowConfirmRemove(false);
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#000000] text-left relative"
      style={{
        fontFamily: 'Inter, sans-serif',
        width: '100%',
        color: '#FFFFFF'
      }}
    >
      {/* ── Standardized Header Top Bar ── */}
      <div
        className="w-full shrink-0 px-5 flex items-center bg-[#000000] border-b border-white/[0.08] relative z-40"
        style={{ height: '72px', boxSizing: 'border-box' }}
      >
        {/* BACK BUTTON */}
        <button
          type="button"
          onClick={onBack}
          style={{
            marginRight: 16,
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: 0,
            width: 24,
            height: 24
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        {/* TITLE & SUBTITLE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif', lineHeight: '1.2' }}>
            Arrange Participants
          </h2>
        </div>

        {/* TRAILING CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search Placeholder to prevent remaining badges from shifting left */}
          <div style={{ width: 32 }} />

          {/* SPORTS COMPASS BADGE */}
          {/* Dynamic Category badge */}
          {(() => {
            const getCategoryStyle = (category?: string) => {
              const cat = (category || 'custom').toLowerCase();
              if (cat === 'sports') {
                return {
                  color: '#10B981',
                  bg: 'rgba(16, 185, 129, 0.2)',
                  border: '1.5px solid #10B981',
                  shadow: 'rgba(16, 185, 129, 0.2)',
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 1px rgba(16, 185, 129, 0.4))' }}>
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                  )
                };
              } else if (cat === 'movies') {
                return {
                  color: '#A78BFA',
                  bg: 'rgba(139, 92, 246, 0.2)',
                  border: '1.5px solid #8B5CF6',
                  shadow: 'rgba(139, 92, 246, 0.2)',
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 1px rgba(139, 92, 246, 0.4))' }}>
                      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                      <line x1="7" y1="2" x2="7" y2="22" />
                      <line x1="17" y1="2" x2="17" y2="22" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <line x1="2" y1="7" x2="7" y2="7" />
                      <line x1="2" y1="17" x2="7" y2="17" />
                      <line x1="17" y1="17" x2="22" y2="17" />
                      <line x1="17" y1="7" x2="22" y2="7" />
                    </svg>
                  )
                };
              } else if (cat === 'dining') {
                return {
                  color: '#FB7185',
                  bg: 'rgba(244, 63, 94, 0.2)',
                  border: '1.5px solid #F43F5E',
                  shadow: 'rgba(244, 63, 94, 0.2)',
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 1px rgba(244, 63, 94, 0.4))' }}>
                      <path d="m16 2-2.3 2.3c-.9.9-1.1 2.3-.4 3.3l4.7 4.7c1 .7 2.4.5 3.3-.4L22 9.6M14 6l.7.7M18 2s-3 7-3 10m0 0a3 3 0 0 0-3 3M15 12h-3m3 3h-3M3 22l6.8-6.8M20 22l-7.7-7.7M6 18c-.8.8-2 1-3 1-.3 0-.6-.3-.6-.6 0-1 .2-2.2 1-3l7-7.2L13 11z" />
                    </svg>
                  )
                };
              } else {
                return {
                  color: '#FFFFFF',
                  bg: 'rgba(255, 255, 255, 0.15)',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  shadow: 'rgba(255, 255, 255, 0.1)',
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.4))' }}>
                      <path d="M8 2v4M16 2v4" />
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                    </svg>
                  )
                };
              }
            };
            const style = getCategoryStyle(selectedCategory);
            return (
              <button
                type="button"
                className="plan-details-toggle"
                onClick={() => setIsHeaderOpen(prev => !prev)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: style.bg,
                  border: style.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: style.color,
                  boxShadow: `0 0 10px ${style.shadow}`,
                  cursor: 'pointer',
                  transition: 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)',
                  transform: isHeaderOpen ? 'scale(0.96)' : 'scale(1)',
                  padding: 0,
                  outline: 'none'
                }}
              >
                {style.icon}
              </button>
            );
          })()}
        </div>

        <AnimatePresence>
          <PlanDetailOverviewCard
            planName={planTitle}
            date={formattedDate}
            time={formattedTime}
            activityType={selectedCategory}
            visible={isHeaderOpen}
            onClose={() => setIsHeaderOpen(false)}
          />
        </AnimatePresence>
      </div>

      {/* ── Instructions Panel ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255, 255, 255, 0.4)', lineHeight: 1.4 }}>
          Choose how friends join your plan.
        </p>
      </div>

      {/* ── Plan Size Adjustment Slider ── */}
      <div 
        className="plan-size-card-container"
        style={{ 
          margin: '16px 20px 0',
          padding: '12px 16px',
          background: 'rgba(8, 8, 8, 0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          height: isPlanSizeOpen ? 116 : 48,
          overflow: 'hidden',
          transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxSizing: 'border-box',
          gap: 12,
          cursor: isPlanSizeOpen ? 'default' : 'pointer'
        }}
        onClick={() => {
          if (!isPlanSizeOpen) setIsPlanSizeOpen(true);
        }}
      >
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            width: '100%', 
            alignItems: 'center',
            cursor: 'pointer' 
          }}
          onClick={(e) => {
            if (isPlanSizeOpen) {
              e.stopPropagation();
              setIsPlanSizeOpen(false);
            }
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>Adjust Plan Size</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 550, color: 'rgba(255, 255, 255, 0.35)', fontFamily: 'Inter, sans-serif' }}>{capacity} People</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', transform: isPlanSizeOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▼</span>
          </div>
        </div>
        <div 
          style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center',
            opacity: isPlanSizeOpen ? 1 : 0,
            visibility: isPlanSizeOpen ? 'visible' : 'hidden',
            transition: 'opacity 0.2s ease, visibility 0.2s ease'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <PlanSizeSlider
            value={capacity}
            onChange={(val) => {
              if (val >= 2 && val <= 50) {
                form.setTotalCapacity(val);
              }
            }}
            hasError={false}
          />
        </div>
      </div>

      {/* ── Segmented Control (Going | Waitlist) ── */}
      <div
        style={{
          display: 'flex',
          position: 'relative',
          background: '#1C1C1E',
          borderRadius: 9,
          padding: 2,
          margin: '16px 20px 8px',
          cursor: 'pointer',
          userSelect: 'none',
          border: '1px solid rgba(255, 255, 255, 0.04)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            bottom: 2,
            left: activeTab === 'going' ? '2px' : 'calc(50% + 1px)',
            width: 'calc(50% - 3px)',
            background: '#2C2C2E',
            borderRadius: 7,
            transition: 'left 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            zIndex: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}
        />

        <div
          onClick={() => setActiveTab('going')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 0',
            zIndex: 2,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: activeTab === 'going' ? '#FFFFFF' : '#8E8E93', transition: 'color 0.2s' }}>
            Going
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              marginTop: 2,
              color: '#1ED760'
            }}
          >
            {goingList.length} / {capacity}
          </span>
        </div>
        <div
          onClick={() => setActiveTab('waitlist')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 0',
            zIndex: 2,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: activeTab === 'waitlist' ? '#FFFFFF' : '#8E8E93', transition: 'color 0.2s' }}>
            Waitlist
          </span>
          <span style={{ fontSize: 10, fontWeight: 500, marginTop: 2, color: '#F59E0B' }}>
            {waitlist.length}
          </span>
        </div>
      </div>

      {/* ── Main List Container ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px 100px',
          gap: 8,
          flex: 1,
          overflowY: 'auto'
        }}
      >
        {activeTab === 'going' ? (
          /* ── GOING LIST ── */
          <GoingSection
            goingList={goingList}
            onItemTap={(item) => handleItemTap(item, 'going')}
          />
        ) : (
          /* ── WAITLIST LIST ── */
            <WaitlistSection
              waitlist={waitlist}
              draggedId={draggedId}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleDragOver={handleDragOver}
              onItemTap={(item) => handleItemTap(item, 'waitlist')}
              onAddFriends={onAddFriends}
            />
        )}
      </div>

      {/* ── Fixed Bottom Continue Button ── */}
      <ContinueButton
        disabled={goingList.length < capacity}
        onClick={onContinue}
        text={
          goingList.length < capacity
            ? `Continue (${goingList.length}/${capacity})`
            : `Continue (${goingList.length} Going • ${waitlist.length} Waitlisted)`
        }
      />

      {/* ── Custom Slide-Up Action Sheet Overlay ── */}
      {selectedItem && sheetType && (
        <div
          onClick={closeSheet}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              background: '#1C1C1E',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: '16px 20px 32px',
              color: '#FFFFFF',
              boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.3)',
              animation: 'slideUp 0.28s cubic-bezier(0.25, 1, 0.5, 1)'
            }}
          >
            {/* Sheet Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 36, height: 5, borderRadius: 2.5, background: 'rgba(255, 255, 255, 0.15)' }} />
            </div>

            {/* Title / Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <UserAvatar
                src={selectedItem.avatar}
                alt={selectedItem.name}
                size="w-10 h-10"
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{selectedItem.name}</span>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' }}>
                  {sheetType === 'going' ? 'Going List' : 'Waitlist'}
                </span>
              </div>
            </div>

            {!showConfirmRemove ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sheetType === 'going' ? (
                  <button
                    onClick={() => moveToWaitlist(selectedItem)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: 'none',
                      borderRadius: 12,
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Move to Waitlist
                  </button>
                ) : (
                  <button
                    onClick={() => moveToGoing(selectedItem)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: 'none',
                      borderRadius: 12,
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Move to Going
                  </button>
                )}

                <button
                  onClick={() => setShowConfirmRemove(true)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#EF4444',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  Remove from Plan
                </button>

                <button
                  onClick={closeSheet}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'none',
                    border: 'none',
                    borderRadius: 12,
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'center',
                    marginTop: 8
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              // ── Removal Confirmation Dialog inside sheet ──
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <span style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', margin: '8px 0' }}>
                  Remove "{selectedItem.name}" from this plan?
                </span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setShowConfirmRemove(false)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: 'none',
                      borderRadius: 12,
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => removeFromPlan(selectedItem)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#EF4444',
                      border: 'none',
                      borderRadius: 12,
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop animation CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
