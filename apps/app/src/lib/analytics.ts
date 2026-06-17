/**
 * analytics.ts — Planless Centralized Analytics Helper
 *
 * Provides a lightweight method to log events to Supabase database.
 * Fails silently to prevent breaking any user workflows.
 */

export async function trackEvent(
  eventType: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    // Resolve user UUID from localStorage (matching session lookup logic in fetchInterceptor.ts)
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

    // Send the tracking payload to our Supabase database upsert endpoint.
    // The fetchInterceptor automatically appends the Bearer Token if present.
    await fetch("/api/db/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "analytics_events",
        records: [eventRecord]
      })
    });
  } catch (error) {
    // Fail silently so it never breaks user flows
    console.warn(`[Analytics Helper] Event tracking failed silently for type "${eventType}":`, error);
  }
}
