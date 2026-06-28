/**
 * mappers.ts — Convert raw DB rows into the UI Plan/Circle/Transaction models.
 */

import {
  Plan, Circle, Transaction, User, NotificationItem,
  DbCircle, DbCircleMember, DbPlan, DbPlanParticipant, DbTransaction
} from "../core/types";
import { normalizeStatus } from "./participantStatus";
import { getPlanCover } from "../features/plans/config/planCoverImages";

// ── avatar helper ───────────────────────────────────────────────────────────

export function initialsAvatar(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  const initials = parts.map(p => p[0]).slice(0, 2).join("").toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g_${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue},40%,35%)"/>
        <stop offset="100%" stop-color="hsl(${(hue + 45) % 360},45%,22%)"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#g_${initials})"/>
    <text x="50%" y="54%" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="700"
      font-size="34" fill="#f4f4f5" text-anchor="middle" dominant-baseline="middle" letter-spacing="-0.03em">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getInitialsAvatar(name: string): string {
  return initialsAvatar(name);
}

// Helper to legacy mapped structural structures used by components (to run without major path rewrites)
export const mapPlansToLegacyPlans = (
  plansList: DbPlan[],
  participants: DbPlanParticipant[],
  usersList: User[],
  activeUserId: string = "",
  circlesList: DbCircle[] = []
): Plan[] => {
  const activeUserObj = usersList.find(u => u.user_id === activeUserId || (u as any).id === activeUserId);
  const activeUuid = activeUserObj ? (activeUserObj as any).id : activeUserId;
  const activeShortId = activeUserObj ? activeUserObj.user_id : activeUserId;

  const rawPlansCount = plansList.length;
  const rawParticipantsCount = participants.length;
  const uuids = plansList.map(p => p.id || "");
  const uniqueUuids = [...new Set(uuids.filter(Boolean))];
  const duplicates = uuids.filter((item, index) => item && uuids.indexOf(item) !== index);

  console.log(`[mapPlansToLegacyPlans Audit] Raw plans count from database: ${rawPlansCount}`);
  console.log(`[mapPlansToLegacyPlans Audit] Raw plan_participants count: ${rawParticipantsCount}`);
  console.log(`[mapPlansToLegacyPlans Audit] Number of unique plan UUIDs: ${uniqueUuids.length}`);
  if (duplicates.length > 0) {
    console.error(`[mapPlansToLegacyPlans Audit] Duplicate plan UUIDs detected:`, duplicates);
  }

  // Optimize lookup: Map for O(1) searches
  const usersById = new Map<string, User>();
  const usersByShortId = new Map<string, User>();
  usersList.forEach(user => {
    if ((user as any).id) {
      usersById.set((user as any).id, user);
    }
    if (user.user_id) {
      usersByShortId.set(user.user_id, user);
    }
  });

  const findUserInList = (uId: string): User | undefined => {
    return usersById.get(uId) || usersByShortId.get(uId);
  };

  const isUsersHydrating = usersList.length <= 1;

  return plansList.map(p => {
    // Resolve circle name - circle_id is legacy in V2 schema
    const circleIdVal = null;
    const circleNameVal = "Custom Plan";
    const isCircleHydrating = false;

    if (!p.host_id) {
      console.error(`[Data Integrity Error] plan ${p.id} is missing a host_id!`);
      throw new Error(`Data Integrity Error: Plan ${p.id} is missing a host_id.`);
    }
    const hostIdVal = p.host_id;
    const isOwner = hostIdVal === activeUserId || hostIdVal === activeUuid || hostIdVal === activeShortId;

    let creator = findUserInList(hostIdVal);
    let hostNameVal = isUsersHydrating ? "Loading..." : "Anonymous Host";
    let hostAvatarVal = isUsersHydrating ? "" : initialsAvatar("Anonymous Host");

    if (creator) {
      hostNameVal = creator.full_name;
      hostAvatarVal = creator.profile_photo;
    }

    const creatorFallback = {
      user_id: hostIdVal,
      username: "host",
      full_name: hostNameVal,
      phone_number: "",
      profile_photo: hostAvatarVal,
      bio: "",
      college_or_work: "",
      created_at: "",
      wallet_balance: 0,
      active_status: true
    };

    // Filter participants for this plan
    const itemParticipants = participants.filter(pp => {
      return pp.plan_id === p.id;
    });

    // Deduplicate by user_id
    const uniqueParticipants: DbPlanParticipant[] = [];
    const seenUserIds = new Set<string>();
    for (const ip of itemParticipants) {
      if (!seenUserIds.has(ip.user_id)) {
        seenUserIds.add(ip.user_id);
        uniqueParticipants.push(ip);
      }
    }

    const members = sortParticipantsByResponseOrder(
      uniqueParticipants.map(ip => {
        const u = findUserInList(ip.user_id);
        if (!u) {
          if (!isUsersHydrating) {
            console.warn(
              "[PARTICIPANT_NOT_FOUND]",
              ip.user_id
            );
          }
          return {
            userId: ip.user_id,
            userUuid: ip.user_id,
            name: isUsersHydrating ? "Loading..." : "Participant",
            avatar: "",
            isHydrating: isUsersHydrating,
            joinState: normalizeStatus(ip.rsvp_status),
            reminderState: "none" as const,
            joinedAt: ip.responded_at || ip.created_at,
            waitlistedAt: null,
            seenAt: null,
            skippedAt: null,
            deliveredAt: null,
            updatedAt: ip.updated_at,
            createdAt: ip.created_at,
            checkedIn: false,
            removedByHost: ip.rsvp_status === "REMOVED"
          };
        }

        return {
          userId: u.id || u.user_id,
          userUuid: u.id,
          name: u.full_name,
          avatar: u.profile_photo,
          joinState: normalizeStatus(ip.rsvp_status),
          reminderState: "none" as const,
          joinedAt: ip.responded_at || ip.created_at,
          waitlistedAt: null,
          seenAt: null,
          skippedAt: null,
          deliveredAt: null,
          updatedAt: ip.updated_at,
          createdAt: ip.created_at,
          checkedIn: false,
          removedByHost: ip.rsvp_status === "REMOVED"
        };
      }).filter(Boolean) as any[]
    );

    const categoryVal = (p.category || "OTHER").toLowerCase();
    const subcategoryVal = (p.subcategory || "OTHER").toLowerCase();

    // Date/time parsing from p.scheduled_at
    const isIso = p.scheduled_at && p.scheduled_at.includes("T") && p.scheduled_at.includes("-");
    let dateVal = "TODAY";
    let timeVal = "";

    if (isIso) {
      try {
        const planDate = new Date(p.scheduled_at);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (planDate.toDateString() === today.toDateString()) {
          dateVal = "TODAY";
        } else if (planDate.toDateString() === tomorrow.toDateString()) {
          dateVal = "TOMORROW";
        } else {
          dateVal = planDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
        }

        const hh = String(planDate.getHours()).padStart(2, '0');
        const mm = String(planDate.getMinutes()).padStart(2, '0');
        timeVal = `${hh}:${mm}`;
      } catch (err) {
        console.warn("[Mappers] Failed to parse ISO scheduled_at:", p.scheduled_at, err);
        dateVal = "TODAY";
        timeVal = "";
      }
    } else {
      dateVal = p.scheduled_at ? String(p.scheduled_at).split(" • ")[0] : "TODAY";
      timeVal = p.scheduled_at ? String(p.scheduled_at).split(" • ")[1] || String(p.scheduled_at) : "";
    }

    const maxSpotsVal = p.max_participants || (members.length > 0 ? members.length : 10);
    const costVal = p.entry_fee !== undefined ? Number(p.entry_fee) : 0;
    const coverImageVal = getPlanCover(categoryVal, subcategoryVal);

    const goingCount = members.filter(m => m.joinState === "going").length;
    const seatsLeftVal = Math.max(0, maxSpotsVal - goingCount);

    const userRatingVal = undefined;
    const userReactionVal = undefined;
    const isHappenedVal = p.status === "COMPLETED";

    return {
      id: p.id,
      dbUuid: p.id,
      title: p.title,
      groupId: circleIdVal,
      hostId: hostIdVal,
      members: members,
      capacity: maxSpotsVal,
      date: dateVal,
      time: timeVal,
      location: p.place_name,
      paymentAmount: costVal,
      status: (p.status === "COMPLETED" ? "completed" : p.status === "CANCELLED" ? "cancelled" : "active") as any,
      datetime: p.scheduled_at,
      createdAt: p.created_at,
      waitlistEnabled: false,
      joinLimit: maxSpotsVal,
      response_cutoff_hours: undefined,
      response_deadline_at: p.rsvp_deadline,

      // UI Legacy Properties
      category: (categoryVal === "sports" ? "sports" : categoryVal === "dining" ? "restaurants" : categoryVal) as any,
      cost: costVal,
      confirmedCount: goingCount,
      maxSpots: maxSpotsVal,
      coverImage: coverImageVal,
      creatorId: hostIdVal,
      creatorName: creatorFallback.full_name,
      creatorAvatar: creatorFallback.profile_photo,
      joinedUsers: members,
      timeline: (dateVal.toLowerCase().includes("today") ? "today" : dateVal.toLowerCase().includes("tomorrow") ? "tomorrow" : "this_week") as any,
      description: p.description,
      seatsLeft: seatsLeftVal,
      notes: p.description || (categoryVal === "sports" ? "Bring your own jersey and water bottle." : undefined),

      // Sports Plan fields
      skillLevel: subcategoryVal === "football" ? "Competitive" : "Intermediate",
      matchFormat: subcategoryVal === "football" ? "7 vs 7" : "Friendly Match",
      sports_type: (subcategoryVal === "football" ? "Football" : subcategoryVal === "badminton" ? "Badminton" : undefined) as any,
      subcategory: subcategoryVal,
      waitlistUsers: [],
      attendanceLogged: false,

      // Restaurant Plan fields
      interestedUsers: [],
    };
  });
};

// Helper to map legacy Circles component expectations
export const mapCirclesToLegacyCircles = (
  circlesList: DbCircle[],
  members: DbCircleMember[],
  usersList: User[]
): Circle[] => {
  return circlesList.map(c => {
    const circleMemberRecords = members.filter(cm => cm.circle_id === c.circle_id || cm.circle_id === (c as any).id);
    const membersList = circleMemberRecords.map(cmr => {
      const u = usersList.find(usr => (usr as any).id === cmr.user_id || usr.user_id === cmr.user_id);
      if (!u) return null;
      return {
        userId: (u as any).id || u.user_id,
        name: u.full_name,
        phone: u.phone_number,
        avatar: u.profile_photo,
        role: cmr.role
      };
    }).filter(Boolean) as any[];

    return {
      id: c.circle_id,
      dbUuid: (c as any).id,
      name: c.name,
      membersCount: membersList.length,
      avatars: membersList.slice(0, 5).map(m => m.avatar),
      groupImage: c.cover_image,
      lastSpontaneousActivity: c.category === "football" ? "7-a-side booked: TODAY 8:00 PM" : "Late-night chats",
      description: c.description,
      type: c.category === "football" ? "Sports Match Crew" : "Spontaneous Hangout Circle",
      location: c.location_anchor,
      format: c.privacy === "private" ? "Spontaneous Private Crew" : "Public Community",
      playersOnField: membersList.length,
      timeWindow: "Flexible hours",
      membersList: membersList
    };
  });
};

// Helper to legacy mapped transactions expected by UI lists
export const mapTransactionsToLegacy = (
  txs: DbTransaction[],
  usersList: User[],
  activeUserId: string = "",
  plansList: DbPlan[] = []
): Transaction[] => {
  // Resolve active user's UUID so we can correctly determine credit/debit direction
  const activeUserObj = usersList.find(u => u.user_id === activeUserId || u.id === activeUserId);
  const activeUuid = activeUserObj?.id || "";

  return txs.map(t => {
    // transactions.sender_id and receiver_id store users.id (UUID).
    // Fall back to user_id match for legacy/demo data that may have short IDs.
    const rxUser = usersList.find(u => u.id === t.receiver_id || u.user_id === t.receiver_id);
    const sxUser = usersList.find(u => u.id === t.sender_id || u.user_id === t.sender_id);
    const rx = rxUser?.full_name || "Self";
    const sx = sxUser?.full_name || "Self";

    let title = "Deposit";
    if (t.transaction_type === "split_payment" || t.transaction_type === "plan_payment") {
      // Determine direction: sender = this user → debit; else credit
      const isSender = t.sender_id === activeUuid || t.sender_id === activeUserId;
      title = isSender ? `Paid ${rx}` : `Received from ${sx}`;
    } else if (t.transaction_type === "deposit") {
      title = "Top-up Wallet";
    }

    // Credit/debit: if sender is the active user → debit; otherwise → credit
    const isSenderMatch = t.sender_id === activeUuid || t.sender_id === activeUserId;

    const planObj = plansList.find(p => p.id === t.plan_id);
    const planTitle = planObj ? planObj.title : null;

    return {
      id: t.transaction_id,
      title: title,
      amount: t.amount,
      type: (isSenderMatch ? "debit" : "credit") as "debit" | "credit",
      timestamp: t.timestamp,
      settled: (t.status as any) === "success" || (t.status as any) === "completed" || (t.status as any) === true,
      status: t.status,
      transactionType: t.transaction_type,
      planTitle: planTitle
    };
  });
};


export const NotificationMeta: Record<string, { label: string; icon: string }> = {
  PLAN_INVITATION: { label: "Invitation", icon: "✉️" },
  WAITLIST_PROMOTED: { label: "Promoted", icon: "⚡" },
  PLAN_CANCELLED: { label: "Cancelled", icon: "❌" },
  PLAN_UPDATED: { label: "Updated", icon: "✏️" },
  HOST_TRANSFERRED: { label: "Host Transfer", icon: "👑" },
  PARTICIPANT_JOINED: { label: "Joined", icon: "✅" },
  PARTICIPANT_SKIPPED: { label: "Skipped", icon: "🏃" },
  // Compatibility fallbacks:
  invitation: { label: "Invitation", icon: "✉️" },
  urgency: { label: "Urgent", icon: "⚠️" },
  payment: { label: "Payment", icon: "💳" },
  general: { label: "General", icon: "🔔" }
};

function formatRelativeTime(createdTime?: string): string {
  if (!createdTime) return "just now";
  try {
    const diffMs = new Date().getTime() - new Date(createdTime).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(createdTime).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "just now";
  }
}

export const mapNotificationsToLegacy = (
  notificationsList: any[],
  plansList: DbPlan[],
  usersList: User[],
  activeUserId: string = ""
): NotificationItem[] => {
  const activeUserObj = usersList.find(u => u.user_id === activeUserId || (u as any).id === activeUserId);
  const activeUuid = activeUserObj ? (activeUserObj as any).id : activeUserId;

  return (notificationsList || [])
    .filter(n => n.user_id === activeUuid)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .map(n => {
      const plan = plansList.find(p => p.id === n.related_plan_id);

      return {
        id: n.id,
        type: n.type as any,
        title: n.title,
        body: n.body || "",
        relativeTime: formatRelativeTime(n.created_at),
        actionText: n.type === "PLAN_INVITATION" || n.type === "invitation" ? "Accept & Join" : undefined,
        planId: plan ? plan.id : undefined,
        settled: n.is_read,
        cost: plan ? Number(plan.entry_fee) : undefined,
        creatorId: plan ? plan.host_id : undefined,
        createdAt: n.created_at
      };
    });
};

export function getDeadlineText(deadlineAt?: string): string {
  if (!deadlineAt) return "";
  const now = new Date().getTime();
  const deadline = new Date(deadlineAt).getTime();
  const diff = deadline - now;
  if (diff <= 0) {
    return "Responses Closed";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const date = new Date(deadlineAt);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `Responses Close: ${hh}:${mm}`;
  }

  if (hours > 0) {
    return `Closes in ${hours}h ${minutes}m`;
  }
  return `Closes in ${minutes}m`;
}

export function formatPlanDate(datetime: string | undefined): string {
  if (!datetime) return "Date pending";
  try {
    const d = new Date(datetime);
    if (isNaN(d.getTime())) return datetime;

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let dateStr = "";
    if (d.toDateString() === today.toDateString()) {
      dateStr = "Today";
    } else if (d.toDateString() === tomorrow.toDateString()) {
      dateStr = "Tomorrow";
    } else {
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const day = d.getDate();
      dateStr = `${weekday}, ${month} ${day}`;
    }

    const timeHH = String(d.getHours()).padStart(2, '0');
    const timeMM = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${timeHH}:${timeMM}`;
    return `${dateStr} • ${timeStr}`;
  } catch (err) {
    console.error("[formatPlanDate] Error formatting datetime:", datetime, err);
    return datetime;
  }
}

export function sortParticipantsByResponseOrder(membersList: any[]): any[] {
  const going: any[] = [];
  const waitlist: any[] = [];
  const seen: any[] = [];
  const skipped: any[] = [];
  const delivered: any[] = [];
  const removed: any[] = [];

  for (const m of membersList) {
    const status = m.joinState || "";
    if (status === "going") {
      going.push(m);
    } else if (status === "waitlist") {
      waitlist.push(m);
    } else if (status === "seen") {
      seen.push(m);
    } else if (status === "skipped") {
      skipped.push(m);
    } else if (status === "removed") {
      removed.push(m);
    } else {
      delivered.push(m);
    }
  }

  const getEpoch = (timestamp: any, fallback1?: any, fallback2?: any): number => {
    if (timestamp) {
      const parsed = Date.parse(timestamp);
      if (!isNaN(parsed)) return parsed;
    }
    if (fallback1) {
      const parsed = Date.parse(fallback1);
      if (!isNaN(parsed)) return parsed;
    }
    if (fallback2) {
      const parsed = Date.parse(fallback2);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  };

  going.sort((a, b) => getEpoch(a.joinedAt, a.updatedAt, a.createdAt) - getEpoch(b.joinedAt, b.updatedAt, b.createdAt));
  waitlist.sort((a, b) => getEpoch(a.waitlistedAt, a.updatedAt, a.createdAt) - getEpoch(b.waitlistedAt, b.updatedAt, b.createdAt));
  seen.sort((a, b) => getEpoch(a.seenAt, a.updatedAt, a.createdAt) - getEpoch(b.seenAt, b.updatedAt, b.createdAt));
  skipped.sort((a, b) => getEpoch(a.skippedAt, a.updatedAt, a.createdAt) - getEpoch(b.skippedAt, b.updatedAt, b.createdAt));
  delivered.sort((a, b) => getEpoch(a.deliveredAt, a.updatedAt, a.createdAt) - getEpoch(b.deliveredAt, b.updatedAt, b.createdAt));
  removed.sort((a, b) => getEpoch(a.updatedAt, a.createdAt) - getEpoch(b.updatedAt, b.createdAt));

  return [...going, ...waitlist, ...seen, ...skipped, ...delivered, ...removed];
}
