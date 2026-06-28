# Chat Feature

## Overview

The Chat feature provides real-time communication channels inside Planless. Messaging is structured around two channels: **General Circle Chat** (scoped to all members of a circle) and **Plan Thread Chat** (scoped to participants of a specific plan within a circle). The chat feed integrates user messages, automated system lifecycle alerts (e.g. joins, skips, waitlist promotions, host transfers, cancellations), and unread indicators.

---

## Current Functionality

* **Plan & Circle Chat**: Scopes messages by `circle_id` (general channel) and optional `plan_id` (plan-scoped sub-threads).
* **Real-time Messaging**: Dynamically updates the conversation feed utilizing Supabase Postgres change channels.
* **Retrieve & Order**: Fetches historical logs (limiting to 50 items) via a dedicated backend routing endpoint and reverses the query results to render ascending chronological order (oldest at the top, newest at the bottom).
* **Sender Metadata Resolution**: Displays sender display names, profile avatars, and tags messages sent by the current session as `isOwn = true`.
* **Auto-generated System Alerts**: Maps system activities (e.g., "U001 joined the plan", "Plan cancelled", "Teams locked") into standard system message pills within the feed.
* **Unread Indicators & Read Tracking**: Automatically tracks last-read timestamps to increment and render unread message dots across circle plan threads.
* **Optimistic Sending & Rollback**: Instantly appends a temporary message to the local feed upon submit, replacing it with the database-confirmed record on success, or rolling it back (deleting from screen) on write errors.

---

## User Flow

```
   ┌────────────────────────────────────────────────────────┐
   │ 1. Start: User opens a Circle or Plan chat screen      │
   └──────────────────────────┬─────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ 2. Set active     │
                    │ room context in   │
                    │ ChatContext store │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ 3. Hydrate feed   │
                    │ Query database,   │
                    │ reverse DESC list │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ 4. Listen Sockets │
                    │ Subscribe to      │
                    │ circle channel    │
                    └─────────┬─────────┘
                              │
                              ▼
             ┌────────────────┴────────────────┐
             │                                 │
     Receive │                                 │ Send Message
             ▼                                 ▼
    ┌─────────────────┐               ┌─────────────────┐
    │ 5. Incoming     │               │ 6. Optimistic   │
    │ message payload │               │ local append    │
    │ received        │               │ with temp ID    │
    └────────┬────────┘               └────────┬────────┘
             │                                 │
             │                                 ▼
             │                        ┌─────────────────┐
             │                        │ 7. DB insert via│
             │                        │ /api/db/upsert  │
             │                        └────────┬────────┘
             │                                 │
             │                                 ├────────────────┐
             │                          Success│           Error│
             │                                 ▼                ▼
             │                        ┌─────────────────┐ ┌─────────────┐
             │                        │ 8. Swap temp ID │ │ 9. Alert    │
             │                        │ with DB UUID    │ │ user &      │
             │                        └────────┬────────┘ │ delete item │
             │                                 │          └─────────────┘
             ▼                                 ▼
    ┌──────────────────────────────────────────┴────────┐
    │ 10. Render Message, scroll feed to bottom         │
    └───────────────────────────────────────────────────┘
```

---

## Architecture

* **Screens**:
  - `CircleChatScreen.tsx` ([CircleChatScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/screens/CircleChatScreen.tsx)): Primary chat screen containing header information, plan sub-details (e.g. teams section), scroll container, message feeds, and input text fields.
* **Context & State Providers**:
  - `ChatContext.tsx` ([ChatContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/chat/state/ChatContext.tsx)): Global context controller managing messages array (`messages`), active threads (`activeCircleId`, `activePlanId`), connection status (`connectionStatus`), and unread trackers (`unreadCounts`). Establishes realtime Supabase subscription sockets.

---

## Database

* **`circle_messages` Table**: The unified table storing messages for both circles and plan threads.
  - `id` (UUID, Primary Key)
  - `circle_id` (UUID -> `circles.id`)
  - `sender_id` (UUID, Nullable -> `users.id`) — Null for system actions.
  - `system_actor_id` (UUID, Nullable -> `users.id`) — Actor triggering system alert.
  - `plan_id` (UUID, Nullable -> `plans.id`) — Association link to map thread messages.
  - `parent_id` (UUID, Nullable -> `circle_messages.id`) — Parent link for nested messages.
  - `content` (Text)
  - `message_type` (Enum/Text: `user` or `system`)
  - `created_at` (Timestamp)
  - `edited_at` (Timestamp, Nullable)

---

## State Management

* **Location**: Active messaging lists and room states are held inside `ChatProvider`.
* **Derived State**: Computed dynamically inside `ChatContext` to filter plan thread messages from circle messages, check system flags, and compute unread indicators.
* **Realtime Sockets**: Subscribers listen for insert/update events on `circle_messages` filtered by the current `circle_id`, inserting new items into the local hook states immediately.

---

## Dependencies

### Depends On
* **Auth**: Requests session credentials to flag owned messages (`isOwn = true`).
* **Profile**: Resolves active profile names and photo avatars to show next to chat bubbles.
* **Plans**: Needs plan states to display subcategory details and lock/unlock actions.
* **Supabase**: Requires DB access for inserts and realtime channels.

### Used By
* **Circles**: Provides communication feeds inside the Circle Hub.
* **Plans**: Power sub-thread messaging menus within details modals.

---

## Security

* **RLS Policies**: Row-level verification policies restrict access:
  - **Read**: Authenticated users can only read messages belonging to a `circle_id` where they are registered members.
  - **Insert**: Users can only insert rows where `sender_id = auth.uid()`.

---

## Source Files

* [ChatContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/chat/state/ChatContext.tsx): Context store containing query utilities, optimistic dispatchers, and realtime socket events.
* [CircleChatScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/screens/CircleChatScreen.tsx): Message list view managing headers, team lineups, and input forms.

---

## Known Issues

* **Duplicate Database Queries**: The realtime insert listener queries the complete `users` table via `/api/db/fetch-all?tables=users` every time a message arrives to resolve sender names/avatars, creating excessive database load.
* **Deprecated Read Markers**: Unread calculation parameters fetch from deprecated table models (`circle_thread_reads` is currently inactive in V2), relying on local states instead.

---

## Technical Debt

* **Message Type Fallbacks**: Detection of `system` vs `user` message types relies on parsing content substrings (e.g. checking if message content includes `"joined the plan"`), instead of strictly relying on the database `message_type` column.
* **Screen Placement Mismatch**: The primary presentation file `CircleChatScreen.tsx` lives inside the `circles` directory rather than the `chat` feature directory.

---

## Future Roadmap

* **Sender Caching**: Cache user profiles locally in the provider to avoid refetching profiles for every new message.
* **Rich Attachments**: Support media sharing (images, location pins, and voice notes).

---

## Maintenance Notes

This document is a living specification. Whenever the Chat feature changes, `features/chat/plan.md` must be updated so it always reflects the current implementation.
