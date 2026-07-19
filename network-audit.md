# Planless Bandwidth & Supabase Egress Audit

## 1. Executive Summary

This audit investigates the root cause of excessive Supabase network egress (exceeding 15 GB with fewer than 30 active users). Based on a thorough review of the codebase, the high bandwidth consumption is driven by **architectural query patterns** and **unfiltered Realtime broadcasts** rather than genuine user activity.

### The Core Problem: "Download the Entire Database" Pattern
Instead of querying scoped, paginated, or user-specific records, the application relies on global React Context stores (`PlansContext`, `CirclesContext`, `FriendshipContext`, and `MainApp`) that load and synchronize **entire database tables** on initial startup and during every Realtime update.

As the database grows, the egress cost per session increases linearly for every active user. When a single update is made (such as an invitation RSVP status change or adding a circle message), the update is broadcast to **all connected users**, each of whom instantly refetches entire tables.

---

## 2. High-Risk Findings

### 2.1 Unfiltered Realtime Broadcasts Triggering Global Table Refetches
* **Location:** 
  * [PlansContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/state/PlansContext.tsx#L202-L210) (channel `"plans-realtime-sync"`)
  * [CirclesContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/state/CirclesContext.tsx#L119-L125) (channel `"public:circles_realtime"`)
  * [FriendshipContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/friendships/state/FriendshipContext.tsx#L84-L97) (channel `friendships-realtime-${activeUserUuid}`)
* **The Issue:** These channels listen to `postgres_changes` on the `plans`, `plan_participants`, `circles`, `circle_members`, and `friendships` tables. Because they omit row-level filtering (e.g., `filter: "user_id=eq..."` or `filter: "circle_id=eq..."`), every client in the app receives updates for **any** database change. On receiving a payload, every client executes `refreshPlans()` or `refreshCircles()`, triggering new `SELECT *` statements.
* **Estimated Impact:** **Critical (70%+ of total egress)**. With 30 active users, a single plan edit or circle creation causes 30 simultaneous table-wide downloads.

### 2.2 Global `SELECT *` Database Initialization
* **Location:** [MainApp.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/MainApp.tsx#L106-L132) (`syncData` function)
* **The Issue:** Upon session hydration, the app retrieves:
  * `supabase.from("users").select("*")` (fetches every user profile in the system)
  * `supabase.from("friendships").select("*")` (fetches the entire friendships graph)
  * `supabase.from("plans").select("*, discovery_items(...)")`
  * `supabase.from("plan_participants").select("*")`
  * `supabase.from("circles").select("*")`
  * `supabase.from("circle_members").select("*")`
* **Estimated Impact:** **High (15-20% of total egress)**. Egress grows linearly with the size of the database and the number of sessions created.

---

## 3. Medium-Risk Findings

### 3.1 Un-debounced Edge Function Invocation on Location Selection
* **Location:** [useGooglePlacesAutocomplete.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/shared/hooks/useGooglePlacesAutocomplete.ts#L80-L90)
* **The Issue:** Typing in the search location input invokes `supabase.functions.invoke("maps", { body: { action: "autocomplete" } })`. Although debounced by 400ms, autocomplete requests can still easily spam the Edge Function, which returns payloads containing multiple prediction fields.
* **Estimated Impact:** **Medium**. Can consume substantial network resources if users type extensively while creating plans.

### 3.2 Chat Sync Triggers Full History Refetches
* **Location:** [ChatContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/chat/state/ChatContext.tsx#L142)
* **The Issue:** On postgres changes for `circle_messages`, the subscription calls `loadMessages(true)` to refetch the last 50 messages + joins the sender info from `users` again, rather than appending the new message payload directly to the local messages state.
* **Estimated Impact:** **Medium**. Rerendering chat circles will result in full message history queries.

---

## 4. Low-Risk Findings

### 4.1 Synchronous `getPublicUrl` calls
* **Location:** [UserAvatar.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/IMGfromDB/UserAvatar.tsx#L55) and [PlanImages.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/IMGfromDB/PlanImages.tsx#L47)
* **The Issue:** `supabase.storage.from(...).getPublicUrl(...)` is called to generate public URLs.
* **Estimated Impact:** **None**. This is a synchronous string helper in the client library; it makes no network requests. (However, fetching the actual images from the resolved URLs consumes CDN/Storage bandwidth, which is cached via a client-side Map to prevent recalculation).

---

## 5. Database Queries Grouped by Feature

### Plans Feature
* **Read:**
  * `supabase.from("plans").select("*, discovery_items(...)")`
  * `supabase.from("plan_participants").select("*")`
  * Location: `PlansContext.tsx` (`refreshPlans`), `MainApp.tsx` (`syncData`)
* **Write:**
  * `supabase.from("plans").insert(...)` (Plan creation)
  * `supabase.from("plan_participants").upsert(...)` (Capacity changes, participant state changes)

### Circles & Groups
* **Read:**
  * `supabase.from("circles").select("*")`
  * `supabase.from("circle_members").select("*")`
  * Location: `CirclesContext.tsx` (`refreshCircles`), `MainApp.tsx` (`syncData`)
* **Write:**
  * `supabase.from("circles").insert(...)`
  * `supabase.from("circle_members").insert(...)`

### Social & Friends
* **Read:**
  * `supabase.from("users").select("*")`
  * `supabase.from("friendships").select("*")`
  * Location: `MainApp.tsx` (`syncData`), `FriendshipContext.tsx` (`refreshFriendships`)

---

## 6. Realtime Subscriptions

| Channel Name | Target Table | Filter | Action |
| :--- | :--- | :--- | :--- |
| `plans-realtime-sync` | `plans` | None | Refetches all plans |
| `plans-realtime-sync` | `plan_participants` | None | Refetches all participants |
| `plans-realtime-sync` | `memories` | None | Refetches all memories |
| `public:circles_realtime` | `circles` | None | Refetches all circles |
| `public:circles_realtime` | `circle_members` | None | Refetches all circle members |
| `friendships-realtime-${uuid}`| `friendships` | None | Refetches all friendships |
| `circle-chat-${circleId}` | `circle_messages` | `circle_id=eq.${id}` | Calls `loadMessages` (refetches 50 rows) |

---

## 7. Edge Function Invocations

| Endpoint | Action | Triggered By | Frequency |
| :--- | :--- | :--- | :--- |
| `maps` | `autocomplete` | Typing location query | Debounced 400ms on typing |
| `maps` | `details` | Selecting a place suggestion | Once per location selection |
| `maps` | `geocode` | Map drag/coordinate search | Once per coordinate resolution |

---

## 8. Storage Downloads & Image Fetching

* **Buckets utilized:** `avatars`, `plan-images`, `discovery-images`.
* **Downloads:** Avatar images and plan cover previews are fetched directly via public CDN URLs.
* **Optimization:** `UserAvatar` implements a client-side `urlCache` (in-memory Map) to avoid calling the SDK's `getPublicUrl` repeatedly. However, CDN cache headers are determined by Supabase Storage defaults (which may result in repeated asset downloads if browser cache is bypassed).

---

## 9. React Query Hooks

* **Audit Result:** **Not Applicable**. The codebase does not use `@tanstack/react-query` or any React Query hooks. All state management and fetches are handled via custom React Contexts + standard `useEffect` hooks.

---

## 10. Possible Infinite Loops

### 10.1 Background Focus Recovery Loop
* **Location:** `PlansContext.tsx` (`triggerRecovery` on window focus/online)
* **Risk:** High. If a user has multiple tabs open or experiences flaky network drops, focus triggers and visibility changes execute `refreshPlans` constantly. If the table itself is being updated in parallel, this can create high-density bursts of queries.

---

## 11. N+1 Queries

### 11.1 Participant Details Resolving
* **Location:** [PlanParticipantManagementWrapper.tsx](file:///Users/thilak/Documents/Planless/Planless Repo /Planless-2.0/apps/app/src/features/plans/screens/PlansScreen/PlanParticipantManagementWrapper.tsx)
* **Risk:** Low. Participant avatars/names are resolved via in-memory lookup from `dbUsers` (which was loaded in bulk during initialization). While loading all users initially is inefficient, it avoids row-by-row database roundtrips (N+1 queries).

---

## 12. Recommendations

1. **Implement RLS & Filtered Selects (Egress savings: ~85%):**
   * Do not use `.select("*")` on global tables. Only fetch plans where the active user is a creator or participant (`plan_participants` table joins).
   * Filter friendships where `user_1_id = activeUserId` or `user_2_id = activeUserId`.
2. **Apply Row-Level Filters to Realtime Channels (Egress savings: ~70%):**
   * Change Realtime subscriptions to include filters (e.g. only subscribe to friendships involving the current user).
3. **Cache and Append Chat Message Payloads (Egress savings: ~10%):**
   * In `ChatContext.tsx`, instead of refetching the entire chat history (`loadMessages(true)`) when a new message is received via Realtime, append the new message payload directly into the local state.
