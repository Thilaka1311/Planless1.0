import React from 'react';
import { StackingFriends } from './StackingFriends';

interface Friend {
  id: string;
  dbUuid: string;
  name: string;
  avatar: string;
  isHost?: boolean;
}

interface WaitlistSectionProps {
  waitlist: Friend[];
  draggedId: string | null;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, listType: 'going' | 'waitlist', idx?: number) => void;
  onItemTap: (item: Friend) => void;
  onAddFriends?: () => void;
}

export const WaitlistSection: React.FC<WaitlistSectionProps> = ({
  waitlist,
  draggedId,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  onItemTap,
  onAddFriends
}) => {
  if (waitlist.length === 0 && !onAddFriends) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
        <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center' }}>
          No participants in Waitlist.
        </span>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => handleDragOver(e, 'waitlist')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
        minHeight: 200,
        transition: 'all 0.2s ease'
      }}
    >
      {waitlist.map((item, idx) => {
        const isItemDragged = draggedId === item.id;

        const handleDragOverCard = (e: React.DragEvent<HTMLDivElement>) => {
          handleDragOver(e, 'waitlist', idx);
        };

        const handleDragStartLocal = (e: React.DragEvent<HTMLDivElement>) => {
          const target = e.currentTarget;
          target.style.transform = 'scale(1.02) rotate(1deg)';
          target.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.7)';
          target.style.opacity = '0.96';
          
          handleDragStart(e, item.id);
          
          setTimeout(() => {
            target.style.transform = '';
            target.style.boxShadow = '';
            target.style.opacity = '';
          }, 0);
        };

        return (
          <StackingFriends
            key={item.id}
            item={item}
            index={idx + 1}
            showIndex
            draggable
            onDragStart={handleDragStartLocal}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOverCard}
            onClick={() => onItemTap(item)}
            isItemDragged={isItemDragged}
          />
        );
      })}

      {/* Add Friends button - rendered immediately as the next row inside the flex container */}
      {onAddFriends && (
        <button
          type="button"
          onClick={onAddFriends}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '12px 14px',
            background: 'transparent',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 8,
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            height: 54,
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Add Friends
        </button>
      )}
    </div>
  );
};
