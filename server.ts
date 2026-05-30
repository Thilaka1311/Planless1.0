import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Lazy initialization of Supabase client helper
let supabaseClient: any = null;
function getSupabaseClient() {
  if (!supabaseClient) {
    // Rely on environment variables, falling back to the publishable anon keys provided by user as defaults
    const url = process.env.SUPABASE_URL || "https://yuuzenyjxxuqahosflob.supabase.co";
    const key = process.env.SUPABASE_KEY || "sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF";
    
    if (url && key) {
      supabaseClient = createClient(url, key);
    }
  }
  return supabaseClient;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function normalizePhone(phone: string) {
  return String(phone).replace(/[^0-9+]/g, "");
}

async function findUserByPhone(client: any, phone: string) {
  const normalizedPhone = normalizePhone(phone).replace(/[^0-9]/g, "");
  const { data, error } = await client.from("users").select("*");
  if (error) {
    throw error;
  }
  if (!Array.isArray(data)) {
    return null;
  }
  return data.find((row: any) => {
    if (!row.phone_number) {
      return false;
    }
    const rowPhone = String(row.phone_number).replace(/[^0-9]/g, "");
    return rowPhone === normalizedPhone;
  }) || null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // 1. API ROUTES FIRST
  
  // Checks system config status for Supabase integration dashboard
  app.get("/api/config-status", (req, res) => {
    const url = process.env.SUPABASE_URL || "https://yuuzenyjxxuqahosflob.supabase.co";
    const key = process.env.SUPABASE_KEY || "sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF";
    res.json({
      configured: !!(url && key),
      supabase_url: url,
      supabase_has_key: !!key
    });
  });

  app.post("/api/auth/check-user", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        res.status(400).json({ error: "phone is required" });
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        res.status(503).json({ error: "Supabase client not configured." });
        return;
      }

      const user = await findUserByPhone(client, phone);
      res.json({ success: true, exists: Boolean(user), user });
    } catch (err: any) {
      console.error("[Auth Check User Exception]", err);
      res.status(500).json({ error: err.message || "User check failed." });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { phone, full_name, bio, profile_photo, college_or_work, password } = req.body;
      if (!phone || !full_name || !password) {
        res.status(400).json({ error: "phone, full_name, and password are required" });
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        res.status(503).json({ error: "Supabase client not configured." });
        return;
      }

      const existingUser = await findUserByPhone(client, phone);
      if (existingUser) {
        res.status(409).json({ error: "A user with this phone number already exists." });
        return;
      }

      const username = full_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "").slice(0, 15) || `user${Math.floor(Math.random() * 9000 + 1000)}`;
      const newUser = {
        username,
        full_name,
        phone_number: normalizePhone(phone),
        profile_photo: profile_photo || null,
        bio: bio || "Always spontaneous, never planless.",
        college_or_work: college_or_work || "SRM Chennai",
        created_at: new Date().toISOString(),
        wallet_balance: 0,
        active_status: true,
        password_hash: hashPassword(password),
      };

      const { data, error } = await client.from("users").insert([newUser]).select("*");
      if (error) {
        console.error("[Auth Signup Error]", error);
        const message = error.message || "Failed to create user.";
        if (message.includes("password_hash") || error.details?.includes("password_hash")) {
          res.status(500).json({ error: "Supabase users table is missing the password_hash column. Add it and retry." });
        } else {
          res.status(500).json({ error: message });
        }
        return;
      }

      res.json({ success: true, user: data[0] });
    } catch (err: any) {
      console.error("[Auth Signup Exception]", err);
      res.status(500).json({ error: err.message || "Signup failed." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, password } = req.body;
      if (!phone || !password) {
        res.status(400).json({ error: "phone and password are required" });
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        res.status(503).json({ error: "Supabase client not configured." });
        return;
      }

      const user = await findUserByPhone(client, phone);
      if (!user) {
        res.status(401).json({ error: "Invalid phone number or password." });
        return;
      }

      if (user.password_hash === undefined) {
        res.status(500).json({ error: "Supabase users table is missing the password_hash column." });
        return;
      }

      const passwordHash = hashPassword(password);
      if (user.password_hash !== passwordHash) {
        res.status(401).json({ error: "Invalid phone number or password." });
        return;
      }

      res.json({ success: true, user });
    } catch (err: any) {
      console.error("[Auth Login Exception]", err);
      res.status(500).json({ error: err.message || "Login failed." });
    }
  });
  app.post("/api/auth/login-or-signup", async (req, res) => {
    try {
      const { phone, name } = req.body;
      if (!phone) {
        res.status(400).json({ error: "phone is required" });
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        res.status(503).json({ error: "Supabase client not configured." });
        return;
      }

      // Check if user exists by phone
      let user = await findUserByPhone(client, phone);
      if (user) {
        // Case B: Same phone, different name -> Update existing user's name in the database and log them in
        if (name && name.trim() && user.full_name !== name.trim()) {
          const updatedName = name.trim();
          const { error: updateError } = await client
            .from("users")
            .update({ full_name: updatedName })
            .eq("user_id", user.user_id);
          if (updateError) {
            console.error("[Auth login-or-signup Update Name Error]", updateError);
          } else {
            user.full_name = updatedName;
          }
        }
        res.json({ success: true, user, isNew: false });
        return;
      }

      // If user does not exist, create new user record (Case A: Different phone number -> separate account)
      if (!name) {
        res.status(400).json({ error: "Name is required to register a new account." });
        return;
      }

      const username = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "").slice(0, 15) || `user${Math.floor(Math.random() * 9000 + 1000)}`;
      const cleanPhone = normalizePhone(phone);
      
      const newUser = {
        username,
        full_name: name.trim(),
        phone_number: cleanPhone,
        profile_photo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
        bio: "Always spontaneous, never planless.",
        college_or_work: "SRM Chennai",
        created_at: new Date().toISOString(),
        wallet_balance: 0,
        active_status: true,
      };

      const { data, error } = await client.from("users").insert([newUser]).select("*");
      if (error) {
        console.error("[Auth login-or-signup Signup Error]", error);
        res.status(500).json({ error: error.message || "Failed to create user." });
        return;
      }

      res.json({ success: true, user: data[0], isNew: true });
    } catch (err: any) {
      console.error("[Auth login-or-signup Exception]", err);
      res.status(500).json({ error: err.message || "Authentication failed." });
    }
  });



  // Pulls all data down from Supabase, detecting missing schemas gracefully
  app.get("/api/db/fetch-all", async (req, res) => {
    try {
      const client = getSupabaseClient();
      if (!client) {
        res.json({
          configured: false,
          tables_missing: true,
          missing_tables: ["users", "circles", "circle_members", "plans", "plan_participants", "transactions", "memories"],
          data: null
        });
        return;
      }

      const tables = [
        "users",
        "circles",
        "circle_members",
        "plans",
        "plan_participants",
        "transactions",
        "memories"
      ];

      const results: Record<string, any[]> = {};
      const missingTables: string[] = [];

      await Promise.all(
        tables.map(async (table) => {
          try {
            const { data, error } = await client.from(table).select("*");
            if (error) {
              // Standard missing table code in pg SQL is 42P01, or search for "does not exist"
              if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("relation")) {
                missingTables.push(table);
              } else {
                throw error;
              }
            } else {
              results[table] = data || [];
            }
          } catch (tableErr: any) {
            console.warn(`[Supabase Fetch Sync] Table ${table} not queryable yet:`, tableErr.message || tableErr);
            missingTables.push(table);
          }
        })
      );

      res.json({
        configured: true,
        tables_missing: missingTables.length > 0,
        missing_tables: missingTables,
        data: results
      });
    } catch (err: any) {
      console.error("[Supabase Fetch Error]:", err);
      res.status(500).json({ error: err.message || "Failed to sync tables from Supabase." });
    }
  });

  // Proxy route to instantly UPSERT one or multiple rows to any table seamlessly
  app.post("/api/db/upsert", async (req, res) => {
    try {
      const { table, records } = req.body;
      if (!table || !records || !Array.isArray(records)) {
        res.status(400).json({ error: "Invalid payload parameters. Expected 'table' name and 'records' array." });
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        res.status(503).json({ error: "Supabase client key or endpoint is not initialized." });
        return;
      }

      const isInsert = records.every(r => r.id === undefined || r.id === null);
      const query = isInsert ? client.from(table).insert(records) : client.from(table).upsert(records);
      
      const { data, error } = await query.select("*");
      if (error) {
        console.error(`[Supabase DB Operation Sync] Error writing to ${table}:`, error);
        res.status(500).json({ error: error.message, details: error.details, hint: error.hint });
        return;
      }

      res.json({ success: true, count: records.length, data });
    } catch (error: any) {
      console.error("[Supabase Sync Proxy Error]:", error);
      res.status(500).json({ error: error.message || "Internal server error syncing row database changes." });
    }
  });

  // Generic DB Delete Proxy
  app.post("/api/db/delete", async (req, res) => {
    try {
      const { table, match } = req.body;
      if (!table || !match || typeof match !== "object") {
        res.status(400).json({ error: "Invalid payload parameters. Expected 'table' name and 'match' object." });
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        res.status(503).json({ error: "Supabase client key or endpoint is not initialized." });
        return;
      }

      let query = client.from(table).delete();
      for (const [key, val] of Object.entries(match)) {
        query = query.eq(key, val);
      }

      const { data, error } = await query.select("*");
      if (error) {
        console.error(`[Supabase DB Operation Sync] Error deleting from ${table}:`, error);
        res.status(500).json({ error: error.message, details: error.details, hint: error.hint });
        return;
      }

      res.json({ success: true, count: data?.length || 0, data });
    } catch (error: any) {
      console.error("[Supabase Sync Proxy Error]:", error);
      res.status(500).json({ error: error.message || "Internal server error deleting database changes." });
    }
  });

  // Truncate / clear all data in Supabase sandbox for full demo resets
  app.post("/api/db/reset", async (req, res) => {
    try {
      const client = getSupabaseClient();
      if (!client) {
        res.json({ success: true, message: "No Supabase client configured. Local reset only." });
        return;
      }

      // Securely truncate all tables in correct relational sequence using CASCADE via database RPC
      const { error: truncateError } = await client.rpc("truncate_all_tables");
      if (truncateError) {
        console.warn("[Supabase Reset Warning] Failed to truncate tables via RPC:", truncateError);
      }

      // Reset all public ID sequential counters back to U001, C001, etc.
      const { error: seqError } = await client.rpc("reset_all_sequences");
      if (seqError) {
        console.warn("[Supabase Reset Warning] Failed to reset sequential counters:", seqError);
      }

      res.json({ success: true, message: "Supabase database truncated and sequential counters reset successfully!" });
    } catch (err: any) {
      console.error("[Supabase Reset Error]:", err);
      res.status(500).json({ error: err.message || "Failed to reset Supabase database." });
    }
  });

  // Remove all user-related data from Supabase only
  app.post("/api/db/delete-users", async (req, res) => {
    try {
      const client = getSupabaseClient();
      if (!client) {
        res.status(503).json({ error: "Supabase client not configured." });
        return;
      }

      // Securely truncate all tables in correct relational sequence using CASCADE via database RPC
      const { error: truncateError } = await client.rpc("truncate_all_tables");
      if (truncateError) {
        console.warn("[Supabase Delete Users Warning] Failed to truncate tables via RPC:", truncateError);
      }

      // Reset all public ID sequential counters back to U001, C001, etc.
      const { error: seqError } = await client.rpc("reset_all_sequences");
      if (seqError) {
        console.warn("[Supabase Delete Users Warning] Failed to reset sequential counters:", seqError);
      }

      res.json({ success: true, message: "All user-related data deleted and sequential counters reset successfully." });
    } catch (err: any) {
      console.error("[Supabase Delete Users Error]:", err);
      res.status(500).json({ error: err.message || "Failed to delete user data." });
    }
  });

  // AI coordinates generation endpoint
  app.post("/api/generate-plan", async (req, res) => {
    try {
      const { vibe, category } = req.body;
      if (!vibe) {
        res.status(400).json({ error: "Please provide a vibe description for the plan!" });
        return;
      }

      const client = getGeminiClient();
      const systemInstruction = 
        `You are the Planless AI Social Coordinator.\n` +
        `Planless is a social productivity and spontaneous coordination app for young friends, campus circles, and cohorts.\n` +
        `The app values lightweight social interactions, Spotify-style calmness, and real-life connections.\n\n` +
        `Generate a highly compelling, specific, and realistic spontaneous social plan matching the user's vibe: "${vibe}" and preferred category: "${category || 'any'}".\n\n` +
        `The output must be a valid raw JSON object matching this TypeScript format exactly, with NO markdown block wrappers (no \`\`\`json or \`\`\` text): \n` +
        `{\n` +
        `  "title": "Compelling Title (under 30 chars, e.g., '🍿 Cinema Crew', '⚽ Rain Turf Football', '🍹 Rooftop Sundowner')",\n` +
        `  "category": "movies" (for cinema, Netflix) | "sports" (for matches, gym) | "restaurants" (for dinner, cafes, drinks) | "custom" (for roadtrips, games, etc.),\n` +
        `  "date": "Today" | "Tomorrow" | "Weekend",\n` +
        `  "time": "e.g., 7:00 PM, 3:30 PM, 9:00 PM",\n` +
        `  "location": "A relatable venue (e.g., 'Skyline Arena Turf', 'Social Cafe', 'Sunset Glassbox Lounge', 'Regal Cinema')",\n` +
        `  "cost": number (estimated split amount in Rupees, e.g. 150, 450, 0),\n` +
        `  "maxSpots": number (sensible spots, e.g., 6, 12, 16),\n` +
        `  "description": "Short social description (under 120 chars) inviting friends and setting the warm positive vibe",\n` +
        `  "notes": "Cozy side-comment or preparation item (under 80 chars, e.g., 'Bring light jackets. We will grab snacks!')"\n` +
        `}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: vibe,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.8,
        },
      });

      const responseText = response.text ? response.text.trim() : "";
      if (!responseText) {
        throw new Error("Empty response generated by Gemini model.");
      }

      // Parse JSON safely
      const planData = JSON.parse(responseText);
      res.json(planData);
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate social plan." });
    }
  });

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // 2. VITE MIDDLEWARE (DEV) OR STATIC CHASSIS (PROD)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Seeding default canonical users into Supabase on startup if they don't exist
  async function seedDefaultUsers() {
    const client = getSupabaseClient();
    if (!client) {
      console.log("[Supabase Seed] Supabase client not configured yet.");
      return;
    }

    const defaultUsers = [
      { name: "Thilaka", phone: "9901598018" },
      { name: "Maanas", phone: "7892436109" },
      { name: "Bhaavya", phone: "7892186131" },
      { name: "Renjith", phone: "8073466546" },
    ];

    console.log("[Supabase Seed] Checking and seeding default users...");
    for (const item of defaultUsers) {
      try {
        const existing = await findUserByPhone(client, item.phone);
        if (!existing) {
          const userId = crypto.randomUUID();
          const username = item.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "").slice(0, 15) || `user${Math.floor(Math.random() * 9000 + 1000)}`;
          const cleanPhone = normalizePhone(item.phone);

          const newUser = {
            user_id: userId,
            username,
            full_name: item.name,
            phone_number: cleanPhone,
            profile_photo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}`,
            bio: "Always spontaneous, never planless.",
            college_or_work: "SRM Chennai",
            created_at: new Date().toISOString(),
            wallet_balance: 0,
            active_status: true,
          };

          const { error } = await client.from("users").insert([newUser]);
          if (error) {
            console.error(`[Supabase Seed] Failed to seed ${item.name}:`, error.message);
          } else {
            console.log(`[Supabase Seed] Seeded user ${item.name} successfully!`);
          }
        } else {
          console.log(`[Supabase Seed] User ${item.name} already exists. Skipping.`);
        }
      } catch (e: any) {
        console.error(`[Supabase Seed] Exception seeding ${item.name}:`, e.message || e);
      }
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Planless Fullstack App server booted on http://localhost:${PORT}`);
    // seedDefaultUsers();
  });
}

startServer();

