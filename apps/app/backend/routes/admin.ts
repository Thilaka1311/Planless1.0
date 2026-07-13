import { Router } from "express";
import { getSupabaseClient } from "../server";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Middleware to verify the user has the 'admin' role in public.users
async function verifyAdminRole(req: AuthenticatedRequest, res: any, next: any) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const client = getSupabaseClient(req.token);
  if (!client) {
    return res.status(503).json({ error: "Database connection unavailable." });
  }

  try {
    const { data: userProfile, error } = await client
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error || !userProfile || userProfile.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Administrator privileges required." });
    }

    next();
  } catch (err: any) {
    console.error("[Admin Router Auth Error]", err);
    return res.status(500).json({ error: "Internal server error during authorization checks." });
  }
}

// All admin endpoints require auth and admin role verification
router.use(authMiddleware);
router.use(verifyAdminRole);

// Update any table row (Internal Admin utility)
router.post("/execute-update", async (req: AuthenticatedRequest, res) => {
  try {
    const client = getSupabaseClient();
    const { table, values, matches } = req.body; // e.g., { table: 'discovery_sections', values: { display_order: 6 }, matches: { title: 'Sports' } }

    let query = client.from(table).update(values);
    Object.keys(matches).forEach((key) => {
      query = query.eq(key, matches[key]);
    });

    const { data, error } = await query.select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("[adminRouter execute-update] Exception caught:", err);
    res.status(500).json({ error: err.message || "Failed to execute update." });
  }
});

export default router;
