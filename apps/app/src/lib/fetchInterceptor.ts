import { supabase } from "./supabaseClient";

export async function getActiveTokenAsync(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || null;
    console.log("[fetchInterceptor] Resolved token length:", token ? token.length : 0);
    return token;
  } catch (err) {
    console.error("[fetchInterceptor] Failed to get active Supabase session:", err);
    return null;
  }
}

// Store the original fetch reference
const originalFetch = window.fetch;

// Install the global fetch interceptor
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  let urlStr = "";
  if (typeof input === "string") {
    urlStr = input;
  } else if (input instanceof URL) {
    urlStr = input.href;
  } else {
    urlStr = input.url;
  }

  // Intercept requests targeting backend /api/ endpoints
  if (urlStr.startsWith("/api/") || urlStr.includes("/api/")) {
    const token = await getActiveTokenAsync();
    if (token) {
      let headers: Headers;
      if (init && init.headers) {
        headers = new Headers(init.headers);
      } else if (typeof input !== "string" && !(input instanceof URL) && input.headers) {
        headers = new Headers(input.headers);
      } else {
        headers = new Headers();
      }

      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      init = {
        ...init,
        headers
      };
    }
  }
  return originalFetch(input, init);
};
