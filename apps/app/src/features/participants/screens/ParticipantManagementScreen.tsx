import React, { useState, useEffect, useMemo } from 'react';
import { GoingSection } from '../components/GoingSection';
import { WaitlistSection } from '../components/WaitlistSection';
import { PlanDetailOverviewCard } from '../components/PlanDetailOverviewCard';
import { UserAvatar } from '../../../IMGfromDB/UserAvatar';
import { PlanSizeSlider } from '../../create/screens/WhenIsPlan/Components/PlanSizeSlider';
import { ContinueButton } from '../../create/components/ContinueButton';

export interface Friend {
  id: string;
  dbUuid: string;
  name: string;
  avatar: string;
  isHost?: boolean;
}

export type ParticipantTab = 'going' | 'waitlist' | 'invited';

export interface ParticipantManagementScreenProps {
  title?: string;
  subtitle?: string;
  category?: string;
  eventDate?: string;
  eventTime?: string;
  capacity: number;
  maxCapacity?: number;

  // Wizard mode: pass selectedFriends and the screen distributes by capacity.
  // The screen owns Going / Waitlist moves internally; only removes are surfaced externally.
  isHostSelected?: boolean;
  userProfile?: any;
  selectedFriends?: Friend[];

  // Editor mode: pass pre-grouped lists directly (Plans flow).
  // The screen renders these lists exactly as given — no internal redistribution.
  externalGoingList?: Friend[];
  externalWaitlist?: Friend[];
  externalInvitedList?: Friend[];

  // UI customizations
  mode?: 'wizard' | 'editor';
  continueText?: string;
  isLoading?: boolean;
  isHostUser?: boolean;

  // Callbacks
  onBack: () => void;
  onContinue?: (going: Friend[], waitlist: Friend[]) => void;
  onClose?: () => void;
  onAddFriends?: () => void;
  onAdjustCapacity?: (newCapacity: number) => void;

  // Action handlers
  // In wizard mode: only onRemoveParticipant is used externally (to sync form).
  //   Going/Waitlist moves are handled internally by the screen.
  // In editor mode: all three are used to call store actions.
  onMoveToGoing?: (friend: Friend) => Promise<void> | void;
  onMoveToWaitlist?: (friend: Friend) => Promise<void> | void;
  onMoveToInvited?: (friend: Friend) => Promise<void> | void;
  onRemoveParticipant?: (friend: Friend) => Promise<void> | void;
  onPromoteHost?: (friend: Friend) => Promise<void> | void;
}

// ──────────────────────────────────────────────
// Invited list section
// ──────────────────────────────────────────────
interface InvitedSectionProps {
  invitedList: Friend[];
}

const InvitedSection: React.FC<InvitedSectionProps> = ({ invitedList }) => {
  if (invitedList.length === 0) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
        <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center' }}>
          No pending invites.
        </span>
      </div>
    );
  }

  return (
    <>
      {invitedList.map((item) => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 14px',
            background: '#161619',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ position: 'relative', width: 28, height: 28, marginRight: 12, flexShrink: 0 }}>
            <UserAvatar src={item.avatar} alt={item.name} size="w-7 h-7" />
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1, color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>
            {item.name}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Invited
          </span>
        </div>
      ))}
    </>
  );
};

// ──────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────
export const ParticipantManagementScreen: React.FC<ParticipantManagementScreenProps> = ({
  title = 'Arrange Participants',
  subtitle,
  category = 'custom',
  eventDate,
  eventTime,
  capacity,
  isHostSelected = false,
  userProfile,
  selectedFriends = [],
  externalGoingList,
  externalWaitlist,
  externalInvitedList,
  mode = 'wizard',
  continueText,
  isLoading = false,
  isHostUser = false,
  onBack,
  onContinue,
  onAddFriends,
  onAdjustCapacity,
  onMoveToGoing,
  onMoveToWaitlist,
  onMoveToInvited,
  onRemoveParticipant,
  onPromoteHost,
  maxCapacity,
}) => {
  // ── Wizard mode internal state ──
  // The host item is only constructed in wizard mode (create flow).
  const hostItem: Friend | null = isHostSelected
    ? {
        id: 'host',
        dbUuid: userProfile?.dbUuid || 'host',
        name: userProfile?.name || 'You',
        avatar:
          userProfile?.avatar ||
          userProfile?.profile_photo ||
          `https://api.dicebear.com/7.x/initials/svg?seed=You`,
        isHost: true,
      }
    : null;

  // Internal lists — only used (and updated) in wizard mode.
  // In editor mode these stay empty; the display lists come from external props.
  const [internalGoingList, setInternalGoingList] = useState<Friend[]>([]);
  const [internalWaitlist, setInternalWaitlist] = useState<Friend[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Re-distribute from props whenever selectedFriends or capacity changes (wizard only).
  // This is the SINGLE source of truth for wizard distribution — external move callbacks
  // do NOT touch these lists; they update form state (selectedFriends) which triggers this.
  useEffect(() => {
    if (mode !== 'wizard') return;
    const allList = [...(hostItem ? [hostItem] : []), ...selectedFriends];
    setInternalGoingList(allList.slice(0, capacity));
    setInternalWaitlist(allList.slice(capacity));
  }, [selectedFriends, capacity, isHostSelected, mode]);
  // ↑ Intentionally omitting `hostItem` from deps — it's derived from `isHostSelected`
  //   which IS a dep. Including the object would cause infinite re-renders.

  // In editor mode the screen renders external lists directly (no internal redistribution).
  const displayGoing = mode === 'editor' ? (externalGoingList ?? []) : internalGoingList;
  const displayWaitlist = mode === 'editor' ? (externalWaitlist ?? []) : internalWaitlist;
  const displayInvited = externalInvitedList ?? [];

  // ── Tab visibility — driven purely by presence of participants ──
  const hasGoingTab = displayGoing.length > 0;
  const hasWaitlistTab = displayWaitlist.length > 0;
  const hasInvitedTab = displayInvited.length > 0;

  // Build the ordered tab list: Invited -> Going -> Waitlist
  const visibleTabs = useMemo<ParticipantTab[]>(() => {
    const t: ParticipantTab[] = [];
    if (hasInvitedTab) t.push('invited');
    if (hasGoingTab) t.push('going');
    if (hasWaitlistTab) t.push('waitlist');
    
    // Fallback if absolutely everything is empty
    if (t.length === 0) {
      t.push('going');
    }
    return t;
  }, [hasInvitedTab, hasGoingTab, hasWaitlistTab]);

  // ── UI state ──
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);
  const [isPlanSizeOpen, setIsPlanSizeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ParticipantTab>('going');

  const initialMountRef = React.useRef(true);
  useEffect(() => {
    if (initialMountRef.current && visibleTabs.length > 0) {
      let defaultTab: ParticipantTab = 'going';
      if (visibleTabs.includes('invited')) {
        defaultTab = 'invited';
      } else if (visibleTabs.includes('going')) {
        defaultTab = 'going';
      } else if (visibleTabs.includes('waitlist')) {
        defaultTab = 'waitlist';
      }
      setActiveTab(defaultTab);
      initialMountRef.current = false;
    }
  }, [visibleTabs]);

  // If the active tab disappears, fall back to the first available tab.
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [visibleTabs, activeTab]);

  // Action sheet
  const [selectedItem, setSelectedItem] = useState<Friend | null>(null);
  const [sheetType, setSheetType] = useState<ParticipantTab | null>(null);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  // Capacity editing state (editor/Plans flow only)
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [tempCapacity, setTempCapacity] = useState(capacity);

  // Sync tempCapacity whenever actual capacity prop changes
  useEffect(() => {
    setTempCapacity(capacity);
  }, [capacity]);

  // Click outside collapses the plan-size slider
  useEffect(() => {
    if (!isPlanSizeOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.plan-size-card-container')) setIsPlanSizeOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isPlanSizeOpen]);

  // ── Drag & drop (waitlist reordering — wizard mode only) ──
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => setDraggedId(null);
  const handleDragOver = (e: React.DragEvent, listType: 'going' | 'waitlist', idx?: number) => {
    e.preventDefault();
    if (idx !== undefined && listType === 'waitlist' && draggedId && mode === 'wizard') {
      const draggedIdx = internalWaitlist.findIndex((f) => f.id === draggedId);
      if (draggedIdx !== -1 && draggedIdx !== idx) {
        const newWait = [...internalWaitlist];
        const [removed] = newWait.splice(draggedIdx, 1);
        newWait.splice(idx, 0, removed);
        setInternalWaitlist(newWait);
      }
    }
  };

  // ── Action sheet handlers ──
  const handleItemTap = (item: Friend, type: ParticipantTab) => {
    setSelectedItem(item);
    setSheetType(type);
    setShowConfirmRemove(false);
  };

  const moveToWaitlistAction = async (item: Friend) => {
    if (onMoveToWaitlist) {
      // Editor mode: delegate to store
      await onMoveToWaitlist(item);
    } else {
      // Wizard mode: update internal state only
      setInternalGoingList((prev) => prev.filter((f) => f.id !== item.id));
      setInternalWaitlist((prev) => [...prev.filter((f) => f.id !== item.id), item]);
    }
    closeSheet();
  };

  const moveToGoingAction = async (item: Friend) => {
    if (onMoveToGoing) {
      // Editor mode: delegate to store
      await onMoveToGoing(item);
    } else {
      // Wizard mode: update internal state, respecting capacity
      let newGoing = [...internalGoingList.filter((f) => f.id !== item.id)];
      let newWait = [...internalWaitlist.filter((f) => f.id !== item.id)];
      if (newGoing.length >= capacity) {
        const displaced = newGoing[newGoing.length - 1];
        newGoing = newGoing.slice(0, newGoing.length - 1);
        newWait = [displaced, ...newWait];
      }
      if (item.isHost) newGoing.unshift(item);
      else newGoing.push(item);
      setInternalGoingList(newGoing);
      setInternalWaitlist(newWait);
    }
    closeSheet();
  };

  const removeFromPlanAction = async (item: Friend) => {
    if (onRemoveParticipant) {
      // Both modes: delegate externally so the caller can sync form/store
      await onRemoveParticipant(item);
    } else {
      // Fallback (no external handler): update internal state
      setInternalGoingList((prev) => prev.filter((f) => f.id !== item.id));
      setInternalWaitlist((prev) => prev.filter((f) => f.id !== item.id));
    }
    closeSheet();
  };

  const closeSheet = () => {
    setSelectedItem(null);
    setSheetType(null);
    setShowConfirmRemove(false);
  };

  // ── Segmented tab indicator positioning ──
  const tabCount = visibleTabs.length;
  const activeTabIndex = Math.max(0, visibleTabs.indexOf(activeTab));
  const pillWidth = `calc(${100 / tabCount}% - 3px)`;
  const pillLeft =
    activeTabIndex === 0
      ? '2px'
      : `calc(${(activeTabIndex * 100) / tabCount}% + 1px)`;

  const tabLabelColor = (key: ParticipantTab) =>
    activeTab === key ? '#FFFFFF' : '#8E8E93';

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#000000] text-left relative"
      style={{ fontFamily: 'Inter, sans-serif', width: '100%', color: '#FFFFFF' }}
    >
      {/* ── Header ── */}
      <div
        className="w-full shrink-0 px-5 flex items-center bg-[#000000] border-b border-white/[0.08] relative z-40"
        style={{ height: '72px', boxSizing: 'border-box' }}
      >
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
            height: 24,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif', lineHeight: '1.2' }}>
            {title}
          </h2>
          {subtitle && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
              {subtitle}
            </span>
          )}
        </div>

        {eventDate && eventTime && (
          <button
            type="button"
            className="plan-details-toggle"
            onClick={() => setIsHeaderOpen((prev) => !prev)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)',
              transform: isHeaderOpen ? 'scale(0.96)' : 'scale(1)',
              padding: 0,
              outline: 'none',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="12 8 8 12 12 16 12 8" />
            </svg>
          </button>
        )}

        {eventDate && eventTime && (
          <PlanDetailOverviewCard
            planName={title}
            date={eventDate}
            time={eventTime}
            activityType={category}
            visible={isHeaderOpen}
            onClose={() => setIsHeaderOpen(false)}
          />
        )}
      </div>

      {/* ── Instructions (wizard only) ── */}
      {mode === 'wizard' && (
        <div style={{ padding: '24px 20px 0' }}>
          <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255, 255, 255, 0.4)', lineHeight: 1.4 }}>
            Choose how friends join your plan.
          </p>
        </div>
      )}

      {/* ── Capacity slider (only for host/editor mode) ── */}
      {onAdjustCapacity && isHostUser && maxCapacity !== undefined && (
        <>
          {!isEditingCapacity ? (
            <div
              style={{
                margin: '16px 20px 0',
                padding: '16px 20px',
                background: 'rgba(8, 8, 8, 0.72)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>
                  Participant Capacity
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'Inter, sans-serif' }}>
                  Current capacity: {capacity} people
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempCapacity(capacity);
                  setIsEditingCapacity(true);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: '8px 16px',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Edit Capacity
              </button>
            </div>
          ) : (
            <div
              className="plan-size-card-container"
              style={{
                margin: '16px 20px 0',
                padding: '16px 20px',
                background: 'rgba(8, 8, 8, 0.72)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 24,
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>
                  Participant Capacity
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'Inter, sans-serif' }}>
                  Capacity: {tempCapacity} people
                </span>
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <PlanSizeSlider
                  value={tempCapacity}
                  onChange={(val) => {
                    const clamped = Math.min(maxCapacity, Math.max(2, val));
                    setTempCapacity(clamped);
                  }}
                  hasError={false}
                  min={2}
                  max={maxCapacity}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsEditingCapacity(false)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 650,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAdjustCapacity(tempCapacity);
                    setIsEditingCapacity(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: '#1ED760',
                    border: 'none',
                    borderRadius: 12,
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 650,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Wizard mode Capacity slider (collapsible) ── */}
      {onAdjustCapacity && maxCapacity === undefined && (
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
            cursor: isPlanSizeOpen ? 'default' : 'pointer',
          }}
          onClick={() => { if (!isPlanSizeOpen) setIsPlanSizeOpen(true); }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', cursor: 'pointer' }}
            onClick={(e) => { if (isPlanSizeOpen) { e.stopPropagation(); setIsPlanSizeOpen(false); } }}
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
              transition: 'opacity 0.2s ease, visibility 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <PlanSizeSlider
              value={capacity}
              onChange={(val) => { if (val >= 2 && val <= 50) onAdjustCapacity(val); }}
              hasError={false}
            />
          </div>
        </div>
      )}

      {/* ── Segmented Tab Control ── */}
      {visibleTabs.length > 1 && (
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
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          {/* Sliding pill — position driven by visibleTabs array */}
          <div
            style={{
              position: 'absolute',
              top: 2,
              bottom: 2,
              left: pillLeft,
              width: pillWidth,
              background: '#2C2C2E',
              borderRadius: 7,
              transition: 'left 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
              zIndex: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />

          {/* Invited tab */}
          {hasInvitedTab && (
            <div
              onClick={() => setActiveTab('invited')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0', zIndex: 2, cursor: 'pointer' }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: tabLabelColor('invited'), transition: 'color 0.2s' }}>
                Invited ({displayInvited.length})
              </span>
            </div>
          )}

          {/* Going tab */}
          {hasGoingTab && (
            <div
              onClick={() => setActiveTab('going')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0', zIndex: 2, cursor: 'pointer' }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: tabLabelColor('going'), transition: 'color 0.2s' }}>
                Going ({displayGoing.length}{capacity > 0 ? ` / ${capacity}` : ''})
              </span>
            </div>
          )}

          {/* Waitlist tab */}
          {hasWaitlistTab && (
            <div
              onClick={() => setActiveTab('waitlist')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0', zIndex: 2, cursor: 'pointer' }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: tabLabelColor('waitlist'), transition: 'color 0.2s' }}>
                Waitlist ({displayWaitlist.length})
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Loading participants…</span>
        </div>
      ) : (
        /* ── Dynamic Tab Content ── */
        <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 20px 100px', gap: 8, flex: 1, overflowY: 'auto' }}>
          {activeTab === 'going' && (
            <GoingSection
              goingList={displayGoing}
              onItemTap={(item) => handleItemTap(item, 'going')}
            />
          )}
          {activeTab === 'waitlist' && hasWaitlistTab && (
            <WaitlistSection
              waitlist={displayWaitlist}
              draggedId={draggedId}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleDragOver={handleDragOver}
              onItemTap={(item) => handleItemTap(item, 'waitlist')}
              onAddFriends={onAddFriends}
            />
          )}
          {activeTab === 'invited' && hasInvitedTab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Invited
                </span>
                {onAddFriends && (
                  <button
                    type="button"
                    onClick={onAddFriends}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1ED760',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    + Add Participants
                  </button>
                )}
              </div>
              <InvitedSection invitedList={displayInvited} />
            </div>
          )}
        </div>
      )}

      {/* ── Continue button (wizard only) ── */}
      {mode === 'wizard' && onContinue && (
        <ContinueButton
          disabled={displayGoing.length < capacity}
          onClick={() => onContinue(displayGoing, displayWaitlist)}
          text={
            continueText ||
            (displayGoing.length < capacity
              ? `Continue (${displayGoing.length}/${capacity})`
              : `Continue (${displayGoing.length} Going • ${displayWaitlist.length} Waitlisted)`)
          }
        />
      )}

      {/* ── Action Sheet ── */}
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
            animation: 'fadeIn 0.2s ease-out',
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
              animation: 'slideUp 0.28s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 36, height: 5, borderRadius: 2.5, background: 'rgba(255, 255, 255, 0.15)' }} />
            </div>

            {/* Person header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <UserAvatar src={selectedItem.avatar} alt={selectedItem.name} size="w-10 h-10" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{selectedItem.name}</span>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' }}>
                  {sheetType === 'going' ? 'Going' : sheetType === 'waitlist' ? 'Waitlist' : 'Invited'}
                </span>
              </div>
            </div>

            {!showConfirmRemove ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Move actions */}
                {sheetType === 'going' && (
                  <button
                    onClick={() => moveToWaitlistAction(selectedItem)}
                    style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Move to Waitlist
                  </button>
                )}
                {(sheetType === 'waitlist' || sheetType === 'invited') && (
                  <button
                    onClick={() => moveToGoingAction(selectedItem)}
                    style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Move to Going
                  </button>
                )}

                {/* Make Host — editor mode, host user, non-host going member */}
                {onPromoteHost && isHostUser && sheetType === 'going' && !selectedItem.isHost && (
                  <button
                    onClick={async () => { await onPromoteHost(selectedItem); closeSheet(); }}
                    style={{ width: '100%', padding: '14px', background: 'rgba(245,158,11,0.08)', border: 'none', borderRadius: 12, color: '#F59E0B', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Make Host
                  </button>
                )}

                {/* Remove — available when the viewer is host or it's their own entry */}
                {(isHostUser || !selectedItem.isHost) && (
                  <button
                    onClick={() => setShowConfirmRemove(true)}
                    style={{ width: '100%', padding: '14px', background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 12, color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Remove from Plan
                  </button>
                )}

                <button
                  onClick={closeSheet}
                  style={{ width: '100%', padding: '14px', background: 'none', border: 'none', borderRadius: 12, color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'center', marginTop: 8 }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', margin: '8px 0' }}>
                  Remove "{selectedItem.name}" from this plan?
                </span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setShowConfirmRemove(false)}
                    style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => removeFromPlanAction(selectedItem)}
                    style={{ flex: 1, padding: '14px', background: '#EF4444', border: 'none', borderRadius: 12, color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};
