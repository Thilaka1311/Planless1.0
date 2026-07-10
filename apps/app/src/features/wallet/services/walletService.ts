export interface ExpenseBreakdown {
  id: string;
  publicId?: string;
  planId: string;
  planTitle: string;
  planCover?: string;
  circleId: string;
  circleName: string;
  date: string;
  totalAmount: number;
  yourShare: number;
  outstandingAmount: number;
  status: "PENDING" | "SETTLED";
  role: "debtor" | "creditor";
}

export interface WalletRelationship {
  userId: string;
  fullName: string;
  profilePhoto: string;
  netBalance: number; // Positive = they owe current user, Negative = current user owes them
  type: "owe" | "owed";
  expenses: ExpenseBreakdown[];
}

export interface WalletSummary {
  overallBalance: number;
  totalYouOwe: number;
  totalYouAreOwed: number;
  youOweList: WalletRelationship[];
  youAreOwedList: WalletRelationship[];
}

/**
 * Calculates net financial relationships (You Owe, You Are Owed) for the current user
 * based on wallet_expenses in the database.
 */
export const calculateWalletSummary = (
  currentUserId: string,
  dbWalletExpenses: any[],
  dbUsers: any[],
  dbPlans: any[],
  dbCircles: any[],
  dbPlanParticipants: any[]
): WalletSummary => {
  if (!currentUserId) {
    return {
      overallBalance: 0,
      totalYouOwe: 0,
      totalYouAreOwed: 0,
      youOweList: [],
      youAreOwedList: [],
    };
  }

  // Resolve current user UUID or ID
  const meUser = dbUsers.find(u => u.id === currentUserId || u.user_id === currentUserId);
  const meUuid = meUser?.id || currentUserId;

  // Filter only PENDING split payment expenses
  const activeExpenses = (dbWalletExpenses || []).filter(
    (exp) =>
      (exp.sender_id === meUuid || exp.receiver_id === meUuid) &&
      exp.status === "PENDING"
  );

  // Group by other user ID
  const groupedExpenses: Record<string, ExpenseBreakdown[]> = {};

  activeExpenses.forEach((exp) => {
    const isDebtor = exp.sender_id === meUuid;
    const otherUserId = isDebtor ? exp.receiver_id : exp.sender_id;
    if (!otherUserId) return;

    const plan = dbPlans.find((p) => p.id === exp.plan_id);
    const circle = exp.circle_id ? dbCircles.find((c) => c.id === exp.circle_id) : null;

    // Source of truth: resolve cost_per_participant from the plan_participant record
    const participantRecord = dbPlanParticipants.find(
      (pp: any) => pp.plan_id === exp.plan_id && pp.user_id === exp.sender_id
    );
    const actualShareVal = participantRecord 
      ? Number(participantRecord.cost_per_participant || 0) 
      : Number(exp.cost_per_participant || 0);

    const expense: ExpenseBreakdown = {
      id: exp.id,
      publicId: exp.public_id || undefined,
      planId: exp.plan_id || "",
      planTitle: plan?.title || "Shared Expense",
      planCover: plan?.cover_image || undefined,
      circleId: exp.circle_id || "",
      circleName: circle?.name || "Group",
      date: exp.created_at
        ? new Date(exp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Recent",
      totalAmount: plan?.total_cost ? Number(plan.total_cost) : actualShareVal,
      yourShare: actualShareVal,
      outstandingAmount: actualShareVal,
      status: exp.status,
      role: isDebtor ? "debtor" : "creditor",
    };

    if (!groupedExpenses[otherUserId]) {
      groupedExpenses[otherUserId] = [];
    }
    groupedExpenses[otherUserId].push(expense);
  });

  const youOweList: WalletRelationship[] = [];
  const youAreOwedList: WalletRelationship[] = [];

  let overallBalance = 0;
  let totalYouOwe = 0;
  let totalYouAreOwed = 0;

  Object.entries(groupedExpenses).forEach(([otherUserId, expenses]) => {
    const otherUser = dbUsers.find((u) => u.id === otherUserId || u.user_id === otherUserId);
    if (!otherUser) return;

    // Calculate net balance for this specific relationship
    // Creditor role = they owe me (+ve value)
    // Debtor role = I owe them (-ve value)
    let net = 0;
    expenses.forEach((e) => {
      if (e.role === "creditor") {
        net += e.outstandingAmount;
      } else {
        net -= e.outstandingAmount;
      }
    });

    const relationship: WalletRelationship = {
      userId: otherUser.id,
      fullName: otherUser.full_name || "Buddy",
      profilePhoto: otherUser.profile_url || "",
      netBalance: net,
      type: net >= 0 ? "owed" : "owe",
      expenses,
    };

    if (net > 0) {
      youAreOwedList.push(relationship);
      totalYouAreOwed += net;
      overallBalance += net;
    } else if (net < 0) {
      youOweList.push(relationship);
      totalYouOwe += Math.abs(net);
      overallBalance -= Math.abs(net);
    }
  });

  return {
    overallBalance,
    totalYouOwe,
    totalYouAreOwed,
    youOweList,
    youAreOwedList,
  };
};

/**
 * Settles a specific expense by calling the database proxy upsert
 */
export const settleTransaction = async (expenseId: string): Promise<boolean> => {
  try {
    const res = await fetch("/api/db/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "wallet_expenses",
        records: [
          {
            id: expenseId,
            status: "SETTLED",
            updated_at: new Date().toISOString(),
          },
        ],
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[walletService] Settle expense failed:", err);
    return false;
  }
};
