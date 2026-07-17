import React from "react";
import { Bell, Search, X } from "lucide-react";
import { UserProfile, NotificationItem } from "../core/types";

import { UserAvatar } from "../IMGfromDB/UserAvatar";

interface HomeHeaderProps {
  userProfile: UserProfile;
  setActiveTab: (tab: any) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  notifications: NotificationItem[];
  pendingMemoryCount: number;
  showSearch?: boolean;
  onToggleSearch?: () => void;
  title?: string;
  scrollY?: number;
  hideNotificationsIcon?: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userProfile,
  setActiveTab,
  showNotifications,
  setShowNotifications,
  notifications,
  pendingMemoryCount,
  showSearch = false,
  onToggleSearch,
  title = "PLANLESS",
  scrollY = 0,
  hideNotificationsIcon = false,
}) => {
  return (
    <header
      id="figma_coordinate_header"
      className="h-14 shrink-0 border-b border-zinc-950 bg-[#09090b]/99 backdrop-blur-md flex items-center justify-between px-4 z-30 select-none relative"
    >
      <div className="flex items-center gap-1.5 z-10">
        <button
          onClick={() => {
            setActiveTab("profile");
            setShowNotifications(false);
          }}
          className="relative group shrink-0 block focus:outline-none cursor-pointer"
          aria-label="View Profile Settings"
        >
          <UserAvatar
            src={userProfile.avatar}
            alt={userProfile.name}
            size="w-9 h-9"
            className="border-2 border-zinc-800 hover:border-[#ff8b66] transition-colors"
          />
        </button>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        {title === "PLANLESS" || title === "Plans" || title === "PLANS" ? (
          <h1 className="text-stone-100 font-sans font-black text-xl tracking-[0.25em] leading-none text-center">
            {title.toUpperCase()}
          </h1>
        ) : (
          <h1 className="text-stone-100 font-sans font-semibold text-[20px] tracking-[0.08em] leading-none text-center">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-1.5 z-10">
        {showSearch && onToggleSearch && (
          <button
            onClick={onToggleSearch}
            className="w-9 h-9 rounded-full flex items-center justify-center relative cursor-pointer text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
        )}
        {!hideNotificationsIcon && (
          <button
            id="bell_notification_trigger"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-9 h-9 rounded-full flex items-center justify-center relative cursor-pointer transition-all ${showNotifications ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            <Bell className="w-4.5 h-4.5" />
            {(notifications.some(n => !n.settled) || pendingMemoryCount > 0) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff5d41] rounded-full ring-2 ring-zinc-950 shadow animate-pulse" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
