/**
 * mappers.ts — Convert raw DB rows into the UI Plan/Circle models.
 *
 * Rules:
 * - All IDs are UUIDs. Never compare text public IDs (U001, P001) in logic.
 * - "isOwner" = plan.created_by === myUuid
 * - Participant status drives every badge / filter decision.
 */

import { DbUser, DbPlan, DbParticipant, participantsForPlan, findUser } from "./db";
import { Plan, Circle, Transaction } from "../core/types";

// ── avatar helper (inline — no external import needed) ──────────────────────

export function initialsAvatar(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  const initials = parts.map(p => p[0]).slice(0, 2).join("").toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue},40%,35%)"/>
        <stop offset="100%" stop-color="hsl(${(hue + 45) % 360},45%,22%)"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#g)"/>
    <text x="50%" y="54%" font-family="system-ui,sans-serif" font-weight="700"
      font-size="34" fill="#f4f4f5" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ── cover image fallback by category ────────────────────────────────────────

const COVER_BY_CATEGORY: Record<string, string> = {
  movies:      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600",
  sports:      "https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=600",
  restaurants: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600",
  custom:      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=600",
};

export function coverForCategory(category: string): string {
  return COVER_BY_CATEGORY[category] ?? COVER_BY_CATEGORY.custom;
}

// ── datetime helpers ─────────────────────────────────────────────────────────

function dateLabel(iso: string): string {
  if (!iso) return "TODAY";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.round((d.getTime() - now.getTime()) / 86_400_000);
    if (diffDays <= 0)  return "TODAY";
    if (diffDays === 1) return "TOMORROW";
    return d.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase();
  } catch { return "TODAY"; }
}

function timeLabel(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

// ── main mapper ──────────────────────────────────────────────────────────────

/**
 * Map every plan + its participants into the legacy UI Plan shape.
 *
 * @param myUuid  The UUID (users.id) of the currently logged-in user.
 */
export function mapPlans(
  dbPlans: DbPlan[],
  participants: DbParticipant[],
  users: DbUser[],
  myUuid: string
): Plan[] {
  return dbPlans.map(p => {
    const isOwner = p.created_by === myUuid;

    const creator = findUser(users, p.created_by);
    const creatorName   = creator?.full_name   ?? "Host";
    const creatorAvatar = creator?.profile_photo ?? initialsAvatar(creatorName);

    // All participants for this plan
    const planParts = participantsForPlan(participants, p.id);

    // Build member list (only "going" users shown as confirmed members)
    const members = planParts
      .filter(pp => pp.status === "going")
      .map(pp => {
        const u = findUser(users, pp.user_id);
        return {
          userId:        pp.user_id,
          name:          u?.full_name    ?? "Member",
          avatar:        u?.profile_photo ?? initialsAvatar(u?.full_name ?? "M"),
          joinState:     "going" as const,
          reminderState: "none"  as const,
          joinedAt:      pp.joined_at,
          checkedIn:     pp.payment_status === "paid",
        };
      });

    const category = (p.activity_type as any) ?? "custom";
    const date     = dateLabel(p.datetime);
    const time     = timeLabel(p.datetime);
    const cost     = Number(p.split_amount ?? 0);
    const maxSpots = p.max_people ?? 6;
    const cover    = p.cover_image || coverForCategory(category);

    return {
      // ── identity ──
      id:      p.plan_id,     // public sequential ID (P001 etc.) used by UI
      dbUuid:  p.id,          // UUID used for all DB lookups

      // ── plan data ──
      title:          p.title,
      description:    p.description,
      location:       p.location,
      date,
      time,
      category,
      cost,
      maxSpots,
      capacity:       maxSpots,
      coverImage:     cover,
      notes:          p.notes ?? undefined,
      status:         p.status as "active" | "completed" | "cancelled",
      createdAt:      p.created_at,
      timeline:       (date === "TODAY" ? "today" : date === "TOMORROW" ? "tomorrow" : "this_week") as any,

      // ── creator ──
      creatorId:     isOwner ? "u_self" : p.created_by,
      creatorName,
      creatorAvatar,
      hostId:        isOwner ? "u_self" : p.created_by,
      groupId:       p.circle_id,
      circleId:      p.circle_id,

      // ── participants ──
      members,
      joinedUsers:    members,
      confirmedCount: members.length,
      paymentAmount:  cost,
      seatsLeft:      Math.max(0, maxSpots - members.length),

      // ── sport / restaurant stubs ──
      waitlistUsers:   [],
      interestedUsers: [],
      skillLevel:      category === "sports" ? "Competitive" : undefined,
      matchFormat:     category === "sports" ? "7 vs 7" : undefined,
      cuisineType:     category === "restaurants" ? "Indian cuisine" : undefined,
      tableAvailability: category === "restaurants" ? "Available" : undefined,
      estimatedCost:   `₹${cost} / person`,
      attendanceLogged: false,
    } as Plan;
  });
}
