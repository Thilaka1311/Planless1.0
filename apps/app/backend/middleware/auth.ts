import { Request, Response, NextFunction } from "express";
import { getSupabaseClient } from "../server";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
  token?: string;
}

/**
 * Express middleware to authenticate calls exclusively using Supabase JWT tokens.
 */
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Missing token." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const client = getSupabaseClient();
  if (!client) {
    res.status(503).json({ error: "Supabase client is not initialized." });
    return;
  }

  try {
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      console.error("[authMiddleware] client.auth.getUser failed. error:", error, "user:", user);
      res.status(401).json({ error: "Invalid or expired authentication token." });
      return;
    }
    req.user = { id: user.id };
    req.token = token;
    next();
  } catch (err) {
    console.error("[authMiddleware] Supabase token verification exception:", err);
    res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}
