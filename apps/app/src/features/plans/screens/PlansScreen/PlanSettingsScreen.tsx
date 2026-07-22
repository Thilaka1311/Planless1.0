import React, { useState } from "react";
import { ChevronLeft, Crown, Users } from "lucide-react";
import { Plan, UserProfile } from "../../../../core/types";
import { UserAvatar } from "../../../../IMGfromDB/UserAvatar";
import { PlanSizeSlider } from "../../../create/components/PlanSizeSlider";
import { useToast } from "../../../../shared/contexts/ToastContext";

interface PlanSettingsScreenProps {
  plan: Plan;
  userProfile: UserProfile;
  isCreatorHost?: boolean;
  onBack: () => void;
  onUpdateSettings?: (settings: {
    allowParticipantInvites?: boolean;
    maxParticipants?: number;
  }) => Promise<void> | void;
  onDemoteHost?: (userId: string) => Promise<void> | void;
}

export const PlanSettingsScreen: React.FC<PlanSettingsScreenProps> = ({
  plan,
  userProfile,
  isCreatorHost = false,
  onBack,
  onUpdateSettings,
  onDemoteHost,
}) => {
  const { showToast } = useToast();

  // Local Settings States
  const [allowInvites, setAllowInvites] = useState<boolean>(
    plan.allowParticipantInvites ?? false
  );
  const [maxParticipants, setMaxParticipants] = useState<number>(
    plan.capacity || plan.joinLimit || plan.maxSpots || 10
  );

  // Creator Host ID
  const hostId = plan.hostId;
  const members = plan.members || [];

  // 1. Identify Creator Host item
  const creatorMember = members.find(
    (m) => (m.userId || m.userUuid || m.user_id || m.id) === hostId
  );
  const creatorHost = {
    id: hostId || "host",
    name: creatorMember?.name || plan.creatorName || "Creator",
    avatar: creatorMember?.avatar || plan.creatorAvatar,
  };

  // 2. Identify Additional Hosts (role === 'HOST' or isHost, excluding primary creator)
  const additionalHosts = members
    .filter((m) => {
      const uId = m.userId || m.userUuid || m.user_id || m.id;
      const isCoHost = (m as any).role === "HOST" || (m as any).role === "CO_HOST" || m.isHost;
      return isCoHost && uId !== hostId;
    })
    .map((m) => ({
      id: m.userId || m.userUuid || m.user_id || m.id,
      name: m.name || "Host",
      avatar: m.avatar,
    }));

  const handleToggleInvites = async () => {
    const previousVal = allowInvites;
    const nextVal = !allowInvites;
    setAllowInvites(nextVal);
    try {
      if (onUpdateSettings) {
        await onUpdateSettings({ allowParticipantInvites: nextVal });
      }
    } catch (err) {
      setAllowInvites(previousVal);
      showToast("Failed to update setting. Please try again.");
    }
  };

  const handleCapacityChange = async (val: number) => {
    const previousCapacity = maxParticipants;
    setMaxParticipants(val);
    try {
      if (onUpdateSettings) {
        await onUpdateSettings({ maxParticipants: val });
      }
    } catch (err) {
      setMaxParticipants(previousCapacity);
      showToast("Failed to update maximum participants. Please try again.");
    }
  };

  const handleDemoteHost = async (userId: string) => {
    if (!onDemoteHost) return;
    try {
      await onDemoteHost(userId);
      showToast("✓ Host removed");
    } catch (err) {
      showToast("Failed to remove host. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col h-full overflow-hidden text-left font-sans select-none">
      {/* Top Header */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 px-4 py-3.5 flex items-center justify-between flex-shrink-0 pt-[calc(0.875rem+env(safe-area-inset-top,0px))]">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-white tracking-wide text-center">
          Plan Settings
        </h1>
        <div className="w-9" />
      </div>

      {/* Main Settings Scroll Container */}
      <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-6 pb-12">
        {/* ========================================== */}
        {/* SECTION 1 — PARTICIPANTS */}
        {/* ========================================== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Users className="w-4 h-4 text-[#FF6B2C]" />
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Participants
            </h2>
          </div>

          <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-4.5 space-y-5">
            {/* Setting 1: Allow participants to invite others */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 pr-2">
                <span className="text-sm font-semibold text-white block">
                  Allow Participants to Invite Others
                </span>
                <span className="text-xs text-zinc-400 block leading-relaxed">
                  Participants can invite additional people to this plan.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleInvites}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                  allowInvites ? "bg-[#FF6B2C]" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                    allowInvites ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Setting 2: Maximum Participants */}
            <div className="space-y-3">
              <div>
                <span className="text-sm font-semibold text-white block">
                  Maximum Participants
                </span>
                <span className="text-xs text-zinc-400 block leading-relaxed mt-0.5">
                  Set the maximum number of confirmed spots for this plan.
                </span>
              </div>

              <div className="pt-2 pb-1">
                <PlanSizeSlider
                  value={maxParticipants}
                  onChange={handleCapacityChange}
                  hasError={false}
                  min={2}
                  max={50}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* SECTION 2 — HOSTS */}
        {/* ========================================== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Crown className="w-4 h-4 text-[#FF6B2C]" />
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Hosts
            </h2>
          </div>

          <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-4.5 space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hosts can edit plan settings, manage waitlists, and invite participants. The creator host cannot be removed.
            </p>

            <div className="space-y-2.5">
              {/* Creator Host Card */}
              <div className="flex items-center justify-between p-3 bg-black/40 border border-white/[0.06] rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <UserAvatar
                      src={creatorHost.avatar}
                      alt={creatorHost.name}
                      size="w-9 h-9"
                      className="border border-white/10"
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6B2C] flex items-center justify-center border border-black">
                      <Crown className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-white truncate block">
                      {creatorHost.name}
                    </span>
                    <span className="text-[11px] text-[#FF6B2C] font-medium block">
                      Creator Host
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Hosts List */}
              {additionalHosts.length > 0 ? (
                additionalHosts.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-3 bg-black/40 border border-white/[0.06] rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <UserAvatar
                          src={h.avatar}
                          alt={h.name}
                          size="w-9 h-9"
                          className="border border-white/10"
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6B2C] flex items-center justify-center border border-black">
                          <Crown className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-white truncate block">
                          {h.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 block">
                          Host
                        </span>
                      </div>
                    </div>

                    {isCreatorHost && onDemoteHost && (
                      <button
                        type="button"
                        onClick={() => handleDemoteHost(h.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 active:scale-95 transition cursor-pointer flex-shrink-0"
                      >
                        Remove Host
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 bg-black/20 border border-dashed border-white/10 rounded-xl text-center">
                  <span className="text-xs text-zinc-500">
                    No additional hosts yet.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
