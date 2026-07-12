import { Router } from "express";
import { getSupabaseClient } from "../server";

const router = Router();

router.get("/sections", async (req, res) => {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return res.status(503).json({ error: "Database connection unavailable." });
    }

    const { data, error } = await client
      .from("discovery_sections")
      .select("*")
      .eq("status", "ACTIVE")
      .order("display_order", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error("[Discovery Router] DB error in GET /sections:", err.message || err);
    res.status(500).json({ error: err.message || "Failed to fetch discovery sections." });
  }
});

router.get("/items", async (req, res) => {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return res.status(503).json({ error: "Database connection unavailable." });
    }

    const { data, error } = await client
      .from("discovery_items")
      .select("*")
      .eq("status", "ACTIVE")
      .order("display_order", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error("[Discovery Router] DB error in GET /items:", err.message || err);
    res.status(500).json({ error: err.message || "Failed to fetch discovery items." });
  }
});

router.get("/by-category/:category", async (req, res) => {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return res.status(503).json({ error: "Database connection unavailable." });
    }

    const category = req.params.category.toUpperCase();

    // For ALL: fetch sections and items matching active categories
    if (category === "ALL") {
      const { data: secs, error: secErr } = await client
        .from("discovery_sections")
        .select("*")
        .in("category", ["SPORTS", "MOVIES", "DINING", "DRINKS"])
        .eq("status", "ACTIVE")
        .order("display_order", { ascending: true });

      if (secErr) throw secErr;
      if (!secs || secs.length === 0) {
        return res.json([]);
      }

      const sectionIds = secs.map((s: any) => s.id);
      const { data: items, error: itemErr } = await client
        .from("discovery_items")
        .select("*")
        .in("section_id", sectionIds)
        .eq("status", "ACTIVE")
        .order("display_order", { ascending: true });

      if (itemErr) throw itemErr;

      const mapped = secs.map((sec: any) => ({
        ...sec,
        items: (items || []).filter((item: any) => item.section_id === sec.id)
      }));

      return res.json(mapped);
    }

    // Single category fetch
    const { data: sections, error: secErr } = await client
      .from("discovery_sections")
      .select("*")
      .eq("category", category)
      .eq("status", "ACTIVE")
      .order("display_order", { ascending: true });

    if (secErr) throw secErr;

    if (!sections || sections.length === 0) {
      res.json([]);
      return;
    }

    const sectionIds = sections.map((s: any) => s.id);

    const { data: items, error: itemErr } = await client
      .from("discovery_items")
      .select("*")
      .in("section_id", sectionIds)
      .eq("status", "ACTIVE")
      .order("display_order", { ascending: true });

    if (itemErr) throw itemErr;

    const mapped = sections.map((sec: any) => ({
      ...sec,
      items: (items || []).filter((item: any) => item.section_id === sec.id)
    }));

    res.json(mapped);
  } catch (err: any) {
    console.error(`[Discovery Router] DB error in GET /by-category/${req.params.category}:`, err.message || err);
    res.status(500).json({ error: err.message || "Failed to fetch discovery data by category." });
  }
});

export default router;
