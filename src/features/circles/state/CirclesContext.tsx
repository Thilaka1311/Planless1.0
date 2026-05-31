import React, { createContext, useContext, useState, ReactNode } from "react";
import { Circle, DbCircle, DbCircleMember, User } from "../../../core/types";
import { mapCirclesToLegacyCircles } from "../../../lib/mappers";

interface CirclesState {
  circles: Circle[];
  setCircles: React.Dispatch<React.SetStateAction<Circle[]>>;
  dbCircles: DbCircle[];
  setDbCircles: React.Dispatch<React.SetStateAction<DbCircle[]>>;
  dbCircleMembers: DbCircleMember[];
  setDbCircleMembers: React.Dispatch<React.SetStateAction<DbCircleMember[]>>;
  createCircle: (name: string, description: string, image: string, selectedFriendIds: string[], activeUserId: string, dbUsers: User[]) => Circle;
}

const CirclesContext = createContext<CirclesState | undefined>(undefined);

export const CirclesProvider = ({ 
  children, 
  userId = "" 
}: { 
  children: ReactNode; 
  userId?: string;
}) => {
  const [dbCircles, setDbCircles] = useState<DbCircle[]>([]);
  const [dbCircleMembers, setDbCircleMembers] = useState<DbCircleMember[]>([]);

  const [circles, setCircles] = useState<Circle[]>([]);

  const createCircle = (
    name: string, 
    description: string, 
    image: string, 
    selectedFriendIds: string[],
    activeUserId: string,
    dbUsers: User[]
  ) => {
    const circleId = `C_${Date.now()}`;
    const newDbCircle: DbCircle = {
      circle_id: circleId,
      name,
      description,
      category: "custom",
      created_by: activeUserId,
      cover_image: image,
      location_anchor: "Third Wave Coffee",
      privacy: "private",
      created_at: new Date().toISOString()
    };

    const newMembers: DbCircleMember[] = [
      {
        circle_member_id: `CM_self_${Date.now()}`,
        circle_id: circleId,
        user_id: activeUserId,
        role: "admin",
        joined_at: new Date().toISOString()
      },
      ...selectedFriendIds.map((fid, idx) => ({
        circle_member_id: `CM_friend_${idx}_${Date.now()}`,
        circle_id: circleId,
        user_id: fid,
        role: "member" as const,
        joined_at: new Date().toISOString()
      }))
    ];

    setDbCircles(prev => [...prev, newDbCircle]);
    setDbCircleMembers(prev => [...prev, ...newMembers]);

    // Map new legacy Circle
    const allMembersList = newMembers.map(cmr => {
      const u = dbUsers.find(usr => usr.user_id === cmr.user_id);
      return {
        userId: cmr.user_id,
        name: u?.full_name || "Member",
        phone: u?.phone_number || "",
        avatar: u?.profile_photo || ""
      };
    });

    const newLegacyCircle: Circle = {
      id: circleId,
      dbUuid: undefined,
      name,
      membersCount: allMembersList.length,
      avatars: allMembersList.slice(0, 5).map(m => m.avatar),
      groupImage: image,
      lastSpontaneousActivity: "Late-night chats",
      description,
      type: "Spontaneous Hangout Circle",
      location: "Third Wave Coffee",
      format: "Spontaneous Private Crew",
      playersOnField: allMembersList.length,
      timeWindow: "Flexible hours",
      membersList: allMembersList
    };

    setCircles(prev => [newLegacyCircle, ...prev]);
    return newLegacyCircle;
  };

  return (
    <CirclesContext.Provider value={{
      circles, setCircles,
      dbCircles, setDbCircles,
      dbCircleMembers, setDbCircleMembers,
      createCircle
    }}>
      {children}
    </CirclesContext.Provider>
  );
};

export const useCirclesStore = () => {
  const context = useContext(CirclesContext);
  if (context === undefined) {
    throw new Error("useCirclesStore must be used within a CirclesProvider");
  }
  return context;
};
