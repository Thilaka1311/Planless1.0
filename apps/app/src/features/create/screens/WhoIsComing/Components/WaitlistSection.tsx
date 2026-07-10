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
}

export const WaitlistSection: React.FC<WaitlistSectionProps> = ({
  waitlist,
  draggedId,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  onItemTap
}) => {
  if (waitlist.length === 0) {
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
    </div>
  );
};
