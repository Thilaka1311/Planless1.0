import React, { useState, useEffect } from 'react';
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

  // Wizard mode: pass selectedFriends and the screen distributes them
  isHostSelected?: boolean;
  userProfile?: any;
  selectedFriends?: Friend[];

  // Editor mode: pass pre-grouped lists directly
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

  // Action Handlers (editor mode – called externally, screen stays reactive)
  onMoveToGoing?: (friend: Friend) => Promise<void> | void;
  onMoveToWaitlist?: (friend: Friend) => Promise<void> | void;
  onMoveToInvited?: (friend: Friend) => Promise<void> | void;
  onRemoveParticipant?: (friend: Friend) => Promise<void> | void;
  onPromoteHost?: (friend: Friend) => Promise<void> | void;
}

// ──────────────────────────────────────────────
// Invited list section (read-only in this build)
// ──────────────────────────────────────────────
interface InvitedSectionProps {
  invitedList: Friend[];
  onItemTap: (item: Friend) => void;
}

const InvitedSection: React.FC<InvitedSectionProps> = ({ invitedList, onItemTap }) => {
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
          onClick={() => onItemTap(item)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 14px',
            background: '#161619',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#222227'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#161619'; }}
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
}) => {
  // ── Wizard mode: build host item and distribute from selectedFriends ──
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

  // ── Internal local state for wizard mode ──
  const [goingList, setGoingList] = useState<Friend[]>([]);
  const [waitlist, setWaitlist] = useState<Friend[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Sync wizard lists from props
  useEffect(() => {
    if (mode === 'wizard') {
      const allList = [...(hostItem ? [hostItem] : []), ...selectedFriends];
      setGoingList(allList.slice(0, capacity));
      setWaitlist(allList.slice(capacity));
    }
  }, [selectedFriends, capacity, isHostSelected, mode]);

  // In editor mode the lists come entirely from props
  const displayGoing = mode === 'editor' ? (externalGoingList ?? []) : goingList;
  const displayWaitlist = mode === 'editor' ? (externalWaitlist ?? []) : waitlist;
  const displayInvited = externalInvitedList ?? [];
  const hasInvitedTab = displayInvited.length > 0 || mode === 'editor';

  // ── UI state ──
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);
  const [isPlanSizeOpen, setIsPlanSizeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ParticipantTab>('going');

  // Action sheet state
  const [selectedItem, setSelectedItem] = useState<Friend | null>(null);
  const [sheetType, setSheetType] = useState<ParticipantTab | null>(null);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  // Click outside to collapse plan size slider
  useEffect(() => {
    if (!isPlanSizeOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.plan-size-card-container')) setIsPlanSizeOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isPlanSizeOpen]);

  // ── Drag & drop (wizard / waitlist reordering) ──
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => setDraggedId(null);

  const handleDragOver = (e: React.DragEvent, listType: 'going' | 'waitlist', idx?: number) => {
    e.preventDefault();
    if (idx !== undefined && listType === 'waitlist' && draggedId && mode === 'wizard') {
      const draggedIdx = waitlist.findIndex((f) => f.id === draggedId);
      if (draggedIdx !== -1 && draggedIdx !== idx) {
        const newWait = [...waitlist];
        const [removed] = newWait.splice(draggedIdx, 1);
        newWait.splice(idx, 0, removed);
        setWaitlist(newWait);
      }
    }
  };

  // ── Action sheet ──
  const handleItemTap = (item: Friend, type: ParticipantTab) => {
    setSelectedItem(item);
    setSheetType(type);
    setShowConfirmRemove(false);
  };

  const moveToWaitlistLocal = async (item: Friend) => {
    if (onMoveToWaitlist) {
      await onMoveToWaitlist(item);
    } else {
      setGoingList((prev) => prev.filter((f) => f.id !== item.id));
      setWaitlist((prev) => [...prev.filter((f) => f.id !== item.id), item]);
    }
    closeSheet();
  };

  const moveToGoingLocal = async (item: Friend) => {
    if (onMoveToGoing) {
      await onMoveToGoing(item);
    } else {
      let newGoing = [...goingList.filter((f) => f.id !== item.id)];
      let newWait = [...waitlist.filter((f) => f.id !== item.id)];
      if (newGoing.length >= capacity) {
        const displaced = newGoing[newGoing.length - 1];
        newGoing = newGoing.slice(0, newGoing.length - 1);
        newWait = [displaced, ...newWait];
      }
      if (item.isHost) newGoing.unshift(item);
      else newGoing.push(item);
      setGoingList(newGoing);
      setWaitlist(newWait);
    }
    closeSheet();
  };

  const removeFromPlanLocal = async (item: Friend) => {
    if (onRemoveParticipant) {
      await onRemoveParticipant(item);
    } else {
      setGoingList((prev) => prev.filter((f) => f.id !== item.id));
      setWaitlist((prev) => prev.filter((f) => f.id !== item.id));
    }
    closeSheet();
  };

  const closeSheet = () => {
    setSelectedItem(null);
    setSheetType(null);
    setShowConfirmRemove(false);
  };

  // ── Tab indicator positioning ──
  const tabCount = hasInvitedTab ? 3 : 2;
  const tabWidth = `calc(${100 / tabCount}% - 3px)`;
  const tabLeft =
    activeTab === 'going'
      ? '2px'
      : activeTab === 'waitlist'
      ? `calc(${100 / tabCount}% + 1px)`
      : `calc(${(2 * 100) / tabCount}% + 1px)`;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          </div>
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

      {/* ── Subtitle / instructions ── */}
      {mode === 'wizard' && (
        <div style={{ padding: '24px 20px 0' }}>
          <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255, 255, 255, 0.4)', lineHeight: 1.4 }}>
            Choose how friends join your plan.
          </p>
        </div>
      )}

      {/* ── Capacity slider (wizard only) ── */}
      {onAdjustCapacity && (
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

      {/* ── Segmented Control ── */}
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
        {/* Sliding pill */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            bottom: 2,
            left: tabLeft,
            width: tabWidth,
            background: '#2C2C2E',
            borderRadius: 7,
            transition: 'left 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
            zIndex: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />

        {/* Going tab */}
        <div
          onClick={() => setActiveTab('going')}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0', zIndex: 2, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: activeTab === 'going' ? '#FFFFFF' : '#8E8E93', transition: 'color 0.2s' }}>Going</span>
          <span style={{ fontSize: 10, fontWeight: 500, marginTop: 2, color: '#1ED760' }}>
            {displayGoing.length}{capacity > 0 ? ` / ${capacity}` : ''}
          </span>
        </div>

        {/* Waitlist tab */}
        <div
          onClick={() => setActiveTab('waitlist')}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0', zIndex: 2, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: activeTab === 'waitlist' ? '#FFFFFF' : '#8E8E93', transition: 'color 0.2s' }}>Waitlist</span>
          <span style={{ fontSize: 10, fontWeight: 500, marginTop: 2, color: '#F59E0B' }}>{displayWaitlist.length}</span>
        </div>

        {/* Invited tab (only when in editor mode or there are invited members) */}
        {hasInvitedTab && (
          <div
            onClick={() => setActiveTab('invited')}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0', zIndex: 2, cursor: 'pointer' }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: activeTab === 'invited' ? '#FFFFFF' : '#8E8E93', transition: 'color 0.2s' }}>Invited</span>
            <span style={{ fontSize: 10, fontWeight: 500, marginTop: 2, color: 'rgba(255,255,255,0.4)' }}>{displayInvited.length}</span>
          </div>
        )}
      </div>

      {/* ── Loading state ── */}
      {isLoading ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Loading participants…</span>
        </div>
      ) : (
        /* ── Main list ── */
        <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 20px 100px', gap: 8, flex: 1, overflowY: 'auto' }}>
          {activeTab === 'going' && (
            <GoingSection
              goingList={displayGoing}
              onItemTap={(item) => handleItemTap(item, 'going')}
            />
          )}
          {activeTab === 'waitlist' && (
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
          {activeTab === 'invited' && (
            <InvitedSection
              invitedList={displayInvited}
              onItemTap={(item) => handleItemTap(item, 'invited')}
            />
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

      {/* ── Action Sheet overlay ── */}
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
            {/* Handle */}
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
                {/* Move action */}
                {sheetType === 'going' && (
                  <button
                    onClick={() => moveToWaitlistLocal(selectedItem)}
                    style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Move to Waitlist
                  </button>
                )}
                {sheetType === 'waitlist' && (
                  <button
                    onClick={() => moveToGoingLocal(selectedItem)}
                    style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Move to Going
                  </button>
                )}
                {sheetType === 'invited' && (
                  <button
                    onClick={() => moveToGoingLocal(selectedItem)}
                    style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Move to Going
                  </button>
                )}

                {/* Promote to host (editor mode, host user only, non-host item in going) */}
                {onPromoteHost && isHostUser && sheetType === 'going' && !selectedItem.isHost && (
                  <button
                    onClick={async () => { await onPromoteHost(selectedItem); closeSheet(); }}
                    style={{ width: '100%', padding: '14px', background: 'rgba(245, 158, 11, 0.08)', border: 'none', borderRadius: 12, color: '#F59E0B', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    Make Host
                  </button>
                )}

                {/* Remove – only show for host or self */}
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
                    onClick={() => removeFromPlanLocal(selectedItem)}
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
