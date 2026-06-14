export function getActiveToken(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  
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
      if (parsed && parsed.token) {
        return parsed.token;
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
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
    const token = getActiveToken();
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
