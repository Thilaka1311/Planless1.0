/**
 * analytics.ts — Planless Centralized Analytics Helper
 *
 * Logs events directly to Supabase.
 * Fails silently to prevent breaking any user workflows.
 */
import { supabase } from "./supabaseClient";

export async function trackEvent(
  eventType: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    // Resolve user UUID from localStorage
    let userUuid: string | null = null;
    if (typeof window !== "undefined" && window.localStorage) {
      const query = new URLSearchParams(window.location.search);
      const sessionKey = query.get("session") || query.get("user") || "default";
      const localStorageKey = `planless_active_user_${sessionKey}`;

      let saved = localStorage.getItem(localStorageKey);
      if (!saved) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("planless_active_user_")) {
            saved = localStorage.getItem(key);
            if (saved) break;
          }
        }
      }
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          userUuid = parsed?.dbUuid || null;
        } catch (e) {
          // ignore
        }
      }
    }

    const eventRecord = {
      user_id: userUuid,
      event_type: eventType,
      event_properties: properties || {},
      created_at: new Date().toISOString()
    };

    await (supabase as any).from("analytics_events").insert(eventRecord);
  } catch (error) {
    // Fail silently so it never breaks user flows
    console.warn(`[Analytics Helper] Event tracking failed silently for type "${eventType}":`, error);
  }
}
