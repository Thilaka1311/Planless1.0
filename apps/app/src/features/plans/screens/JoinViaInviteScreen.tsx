import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, MapPin, Users, LogIn, CheckCircle, Loader2 } from "lucide-react";
import { resolveInviteToken } from "../services/planInviteService";
import { supabase } from "../../../../lib/supabaseClient";
import { usePlansStore } from "../state/PlansContext";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { useToast } from "../../../shared/contexts/ToastContext";
import { formatDateTimeStandard } from "../../../shared/components/NativeDateTimeField";

interface JoinViaInviteScreenProps {
  /** The raw invite token extracted from the URL /join/:token */
  inviteToken: string;
  /** Called when the user dismisses this screen (goes back to normal app) */
  onDismiss: () => void;
}

interface PlanPreview {
  id: string;
  title: string;
  place_name: string;
  scheduled_at: string;
  host_id: string;
  hostName?: string;
  participantCount: number;
}

type ScreenState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "preview"; planUuid: string; preview: PlanPreview }
  | { phase: "joining" }
  | { phase: "joined"; planTitle: string };

export const JoinViaInviteScreen: React.FC<JoinViaInviteScreenProps> = ({
  inviteToken,
  onDismiss,
}) => {
  const { joinPlan } = usePlansStore();
  const { userProfile } = useProfileStore();
  const { showToast } = useToast();
  const [screen, setScreen] = useState<ScreenState>({ phase: "loading" });

  const resolveAndLoad = useCallback(async () => {
    setScreen({ phase: "loading" });
    try {
      // 1. Resolve the invite token
      const resolved = await resolveInviteToken(inviteToken);
      if (!resolved) {
        setScreen({ phase: "error", message: "This invite link is no longer active." });
        return;
      }

      const { plan_id } = resolved;

      // 2. Fetch plan details from Supabase
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .select("id, title, place_name, scheduled_at, host_id")
        .eq("id", plan_id)
        .maybeSingle();

      if (planError || !planData) {
        setScreen({ phase: "error", message: "Could not load plan details." });
        return;
      }

      // 3. Fetch host name
      const { data: hostData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", planData.host_id)
        .maybeSingle();

      // 4. Fetch participant count
      const { count } = await supabase
        .from("plan_participants")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", plan_id);

      const preview: PlanPreview = {
        id: planData.id,
        title: planData.title,
        place_name: planData.place_name,
        scheduled_at: planData.scheduled_at,
        host_id: planData.host_id,
        hostName: hostData?.full_name || "Unknown",
        participantCount: count || 0,
      };

      setScreen({ phase: "preview", planUuid: plan_id, preview });
    } catch (err) {
      console.error("[JoinViaInviteScreen] Error resolving invite:", err);
      setScreen({ phase: "error", message: "Something went wrong. Please try again." });
    }
  }, [inviteToken]);

  useEffect(() => {
    resolveAndLoad();
  }, [resolveAndLoad]);

  const handleJoin = async () => {
    if (screen.phase !== "preview") return;
    if (!userProfile) {
      showToast("Please log in to join this plan.");
      return;
    }

    const { planUuid, preview } = screen;
    setScreen({ phase: "joining" });

    try {
      // joinPlan already calls syncPlanFriendships internally
      await joinPlan(planUuid, userProfile);
      setScreen({ phase: "joined", planTitle: preview.title });
    } catch (err: any) {
      console.error("[JoinViaInviteScreen] Failed to join plan:", err);
      showToast(`Failed to join: ${err.message || "Unknown error"}`);
      setScreen({ phase: "preview", planUuid, preview });
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-50 px-6">
      <AnimatePresence mode="wait">
        {screen.phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-zinc-400"
          >
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B2C]" />
            <p className="text-sm font-semibold">Loading invite…</p>
          </motion.div>
        )}

        {screen.phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-white font-bold text-base">{screen.message}</p>
            <button
              onClick={onDismiss}
              className="mt-2 text-sm text-zinc-400 underline"
            >
              Go back
            </button>
          </motion.div>
        )}

        {(screen.phase === "preview" || screen.phase === "joining") && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">
                You've been invited
              </p>
              <h1 className="text-white text-2xl font-extrabold leading-tight">
                {screen.preview.title}
              </h1>
            </div>

            {/* Plan details card */}
            <div className="bg-[#0E0E12] border border-white/5 rounded-2xl p-5 space-y-3 mb-6">
              <div className="flex items-center gap-3 text-zinc-300 text-sm">
                <CalendarDays className="w-4 h-4 text-[#FF6B2C] shrink-0" />
                <span>{formatDateTimeStandard(new Date(screen.preview.scheduled_at))}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300 text-sm">
                <MapPin className="w-4 h-4 text-[#FF6B2C] shrink-0" />
                <span>{screen.preview.place_name}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300 text-sm">
                <Users className="w-4 h-4 text-[#FF6B2C] shrink-0" />
                <span>{screen.preview.participantCount} going · Hosted by {screen.preview.hostName}</span>
              </div>
            </div>

            {/* Join CTA */}
            {userProfile ? (
              <button
                id="join-via-invite-btn"
                type="button"
                onClick={handleJoin}
                disabled={screen.phase === "joining"}
                className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-4 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-lg shadow-[#FF6B2C]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {screen.phase === "joining" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Joining…</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Join Plan</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-zinc-400 text-xs text-center">
                  Sign in to join this plan. The invite will be remembered.
                </p>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="w-full border border-[#FF6B2C]/40 text-[#FF6B2C] py-4 rounded-2xl font-black text-sm tracking-wider uppercase transition"
                >
                  Sign In to Join
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onDismiss}
              className="w-full mt-3 text-zinc-500 text-xs underline text-center"
            >
              Not now
            </button>
          </motion.div>
        )}

        {screen.phase === "joined" && (
          <motion.div
            key="joined"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.15 }}
              className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-green-400" />
            </motion.div>
            <div>
              <h2 className="text-white text-xl font-extrabold">You're in!</h2>
              <p className="text-zinc-400 text-sm mt-1">
                You've joined <span className="text-white font-bold">{screen.planTitle}</span>
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                New friendships with co-participants have been added.
              </p>
            </div>
            <button
              id="join-success-done-btn"
              type="button"
              onClick={onDismiss}
              className="mt-2 bg-[#FF6B2C] hover:bg-[#FF8552] text-white px-8 py-3 rounded-2xl font-black text-sm tracking-wider uppercase transition"
            >
              Go to Plans
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
