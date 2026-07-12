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

// Get all discovery items (active/inactive)
router.get("/discovery-items", async (req: AuthenticatedRequest, res) => {
  try {
    const client = getSupabaseClient(req.token);
    const { data, error } = await client
      .from("discovery_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch discovery items." });
  }
});

// Create discovery item
router.post("/discovery-items", async (req: AuthenticatedRequest, res) => {
  try {
    const client = getSupabaseClient();
    const payload = req.body;

    // Generate custom public_id if not provided
    const publicId = payload.public_id || `DISC${Math.floor(100000 + Math.random() * 900000)}`;

    const record = {
      ...payload,
      public_id: publicId,
      status: payload.status || "ACTIVE",
    };

    const { data, error } = await client
      .from("discovery_items")
      .insert([record])
      .select("*")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create discovery item." });
  }
});

// Update discovery item
router.put("/discovery-items/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;
    const payload = req.body;

    const { data, error } = await client
      .from("discovery_items")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update discovery item." });
  }
});

// Soft-delete discovery item (Sets status to 'INACTIVE')
router.delete("/discovery-items/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;
    console.log("[adminRouter DELETE] Soft-delete request received. Target ID:", id);

    const { data, error } = await client
      .from("discovery_items")
      .update({ status: "INACTIVE" })
      .eq("id", id)
      .select();

    console.log("[adminRouter DELETE] Database execution result. Error:", error, "Data returned:", data);

    if (error) throw error;
    res.json({ success: true, message: "Discovery item soft-deleted successfully.", data });
  } catch (err: any) {
    console.error("[adminRouter DELETE] Exception caught:", err);
    res.status(500).json({ error: err.message || "Failed to delete discovery item." });
  }
});

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
