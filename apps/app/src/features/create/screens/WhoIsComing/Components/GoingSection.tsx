import React from 'react';
import { StackingFriends } from './StackingFriends';

interface Friend {
  id: string;
  dbUuid: string;
  name: string;
  avatar: string;
  isHost?: boolean;
}

interface GoingSectionProps {
  goingList: Friend[];
  onItemTap: (item: Friend) => void;
}

export const GoingSection: React.FC<GoingSectionProps> = ({ goingList, onItemTap }) => {
  if (goingList.length === 0) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
        <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center' }}>
          No participants in Going.
        </span>
      </div>
    );
  }

  return (
    <>
      {goingList.map((item) => (
        <StackingFriends
          key={item.id}
          item={item}
          onClick={() => onItemTap(item)}
        />
      ))}
    </>
  );
};
