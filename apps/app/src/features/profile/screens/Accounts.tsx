import React from "react";
import { ArrowLeft, User, Info, AtSign, Mail, ChevronRight } from "lucide-react";
import { UserProfile, User as DbUser } from "../../../core/types";
import { UserAvatar } from "../../../IMGfromDB/UserAvatar";

interface AccountsProps {
  userProfile: UserProfile | null;
  currentUser: DbUser | undefined;
  activeUserId: string;
  onBack: () => void;
  onEditUsername: () => void;
  onEditName: () => void;
  onEditAbout: () => void;
}

export const Accounts = ({
  userProfile,
  currentUser,
  activeUserId,
  onBack,
  onEditUsername,
  onEditName,
  onEditAbout,
}: AccountsProps) => {
  // If database username exists, show it, otherwise show prompt 'Create your username'
  const usernameDisplay = currentUser?.username
    ? `${currentUser.username}`
    : "Create your username";

  const isNewUsername = !currentUser?.username;

  return (
    <div className="absolute inset-0 bg-[#0C0C0E] z-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="border-b border-white/[0.03] select-none flex-shrink-0">
        <div className="max-w-md mx-auto w-full px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white flex items-center justify-center transition active:scale-90"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-sans font-semibold text-white">
            Profile
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto w-full px-6 py-8 flex flex-col items-center">
          {/* Circular profile photo */}
          <div className="relative mb-8 select-none">
            <div className="relative w-[150px] h-[150px] rounded-full p-[3px] bg-gradient-to-tr from-[#FF6B2C] via-[#FF8C39] to-[#FF4F00] shadow-[0_0_32px_rgba(255,107,44,0.15)]">
              <UserAvatar
                src={userProfile?.avatar}
                alt={userProfile?.name || "User"}
                size="w-full h-full"
                className="border-[4px] border-black"
              />
            </div>
          </div>

          {/* Fields List */}
          <div className="w-full space-y-6 pt-2">
            {/* Item: Name */}
            <button
              onClick={onEditName}
              className="w-full flex items-start gap-4 px-1 py-1 rounded-xl hover:bg-zinc-900/20 active:scale-[0.99] transition text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-900/60 border border-white/[0.02] flex items-center justify-center text-zinc-400 mt-0.5 transition group-hover:text-[#FF6B2C] group-hover:border-[#FF6B2C]/30 group-hover:shadow-[0_0_12px_rgba(255,107,44,0.15)] group-hover:bg-[#FF6B2C]/5">
                <User className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 text-left">
                <span className="block text-[11px] font-sans font-medium text-zinc-500 uppercase tracking-wider">
                  Name
                </span>
                <span className="text-sm font-sans font-medium text-zinc-200 block mt-0.5">
                  {userProfile?.name || "User"}
                </span>
              </div>
            </button>

            {/* Item: About */}
            <button
              onClick={onEditAbout}
              className="w-full flex items-start gap-4 px-1 py-1 rounded-xl hover:bg-zinc-900/20 active:scale-[0.99] transition text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-900/60 border border-white/[0.02] flex items-center justify-center text-zinc-400 mt-0.5 transition group-hover:text-[#FF6B2C] group-hover:border-[#FF6B2C]/30 group-hover:shadow-[0_0_12px_rgba(255,107,44,0.15)] group-hover:bg-[#FF6B2C]/5">
                <Info className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 text-left">
                <span className="block text-[11px] font-sans font-medium text-zinc-500 uppercase tracking-wider">
                  About
                </span>
                <span className="text-sm font-sans font-medium text-zinc-200 block mt-0.5">
                  {userProfile?.bio || "Always spontaneous, never planless."}
                </span>
              </div>
            </button>

            {/* Item: Username (Tappable settings row with glow) */}
            <button
              onClick={onEditUsername}
              className="w-full flex items-start gap-4 px-1 py-1 rounded-xl hover:bg-zinc-900/20 active:scale-[0.99] transition text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-900/60 border border-white/[0.02] flex items-center justify-center text-zinc-400 mt-0.5 transition group-hover:text-[#FF6B2C] group-hover:border-[#FF6B2C]/30 group-hover:shadow-[0_0_12px_rgba(255,107,44,0.15)] group-hover:bg-[#FF6B2C]/5">
                <AtSign className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="block text-[11px] font-sans font-medium text-zinc-500 uppercase tracking-wider">
                  Username
                </span>
                <span className={`text-sm font-sans font-medium block mt-0.5 truncate ${isNewUsername ? "text-zinc-500" : "text-zinc-200"}`}>
                  {isNewUsername ? "Not set" : usernameDisplay}
                </span>
              </div>
            </button>

            {/* Item: Email */}
            <div className="flex items-start gap-4 px-1 py-1 rounded-xl hover:bg-zinc-900/20 active:scale-[0.99] transition text-left cursor-pointer group">
              <div className="w-9 h-9 rounded-xl bg-zinc-900/60 border border-white/[0.02] flex items-center justify-center text-zinc-400 mt-0.5 transition group-hover:text-[#FF6B2C] group-hover:border-[#FF6B2C]/30 group-hover:shadow-[0_0_12px_rgba(255,107,44,0.15)] group-hover:bg-[#FF6B2C]/5">
                <Mail className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 text-left">
                <span className="block text-[11px] font-sans font-medium text-zinc-500 uppercase tracking-wider">
                  Email
                </span>
                <span className="text-sm font-sans font-medium text-zinc-200 block mt-0.5">
                  {userProfile?.phone || "thilak@example.com"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
