# Notifications Feature

## Overview

The Notifications feature manages user alert logs in Planless. It acts as an inbox that informs users of invitations, plan updates, waitlist promotions, host transfers, payment updates, and cancellations. It provides visual indicators for new alerts, filters to categorize notifications, actions to join events directly, and automatic mapping logic to match database columns to frontend structures.

---

## Current Functionality

* **Notification Retrieval**: Loads a user's notification list on app startup and handles refresh events via context stores.
* **Notification Categorization**: Allows filtering lists into tabs: "All", "Plans", "Payments", and "Activity".
* **Read/Unread State**: Triggers unread dots if `is_read = false`.
* **Mark as Read**: Opening a notification sheet or clicking its action marks it as read in the UI and pushes updates to Supabase (`is_read: true`).
* **Direct Actions**: Displays context buttons like "Accept & Join" directly in the inbox card to join plans without visiting details pages.
* **Smart Navigation**: Tapping a plan-related notification opens the details modal for the corresponding plan.
* **Real-time Sync**: Dynamically updates the notification inbox via realtime Postgres socket subscriptions.

---

## User Flow

```
   ┌────────────────────────────────────────────────────────┐
   │ 1. Event: Host creates plan, edits time, or waitlist   │
   │    promotes a user                                     │
   └──────────────────────────┬─────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ 2. Insert records │
                    │ into notifications│
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ 3. Sockets fire   │
                    │ Recipient client  │
                    │ receives update   │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ 4. Render Badge   │
                    │ Badge dot shows   │
                    │ on tab header     │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ 5. Open Inbox     │◄─────────────────────────────┐
                    └─────────┬─────────┘                              │
                              │                                        │
             ┌────────────────┼────────────────┐                       │
             │                │                │                       │
             ▼                ▼                ▼                       │
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
     │ Tap Action   │ │ Tap Card     │ │ View list    │                │
     │ "Accept"     │ │              │ │              │                │
     └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                │
            │                │                │                        │
            ▼                ▼                ▼                        │
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
     │ Accept RSVP, │ │ Open Detailed│ │ Leave        │                │
     │ mark read,   │ │ Plan modal,  │ │ unread       │                │
     │ update state │ │ mark read    │ └──────────────┘                │
     └──────┬───────┘ └──────┬───────┘                                 │
            │                │                                         │
            └───────┬────────┘                                         │
                    │                                                  │
                    ▼                                                  │
             ┌──────────────────────────┐                              │
             │ 6. Sync changes to DB,   │──────────────────────────────┘
             │    refresh and fade item │
             └──────────────────────────┘
```

---

## Notification Sources

* **Plans feature**:
  - `PLAN_INVITATION`: Sent to invited friends/circle members when a plan is created.
  - `WAITLIST_PROMOTED`: Sent to a waitlisted user when they are promoted to `JOINED` (due to a spot opening or host increasing capacity).
  - `PLAN_CANCELLED`: Sent to participants when a plan is cancelled by the host.
  - `PLAN_UPDATED`: Sent to participants when plan location, schedule, or notes are changed.
  - `HOST_TRANSFERRED` & `HOST_TRANSFERRED_TO_YOU`: Sent to old and new hosts when ownership is transferred.
  - `PARTICIPANT_JOINED`: Sent to hosts when a participant accepts an invite.
* **Circles feature**:
  - `CIRCLE_MEMBER_REMOVED`: Sent to members when they are removed by a co-host/host.
  - `CO_HOST_PROMOTED`/`CO_HOST_REMOVED`: Sent to members when their roles change.
  - `HOST_TRANSFERRED`: Sent to circle members when ownership changes.
* **Wallet feature**:
  - `payment`: Sent to debtors when split payments or entry fees are due.

---

## Architecture

* **Screens**:
  - `NotificationsScreen.tsx` ([NotificationsScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/notifications/screens/NotificationsScreen.tsx)): Inbox dashboard displaying notifications grouped by category pills ("All", "Plans", "Payments", "Activity"). Handles trigger routing for accept actions and back navigations.
* **State & Context Integration**:
  - `MainApp.tsx` ([MainApp.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/components/MainApp.tsx)): Acts as the central state controller for notifications. Hydrates local arrays via `syncData`, initializes Supabase realtime subscription sockets, and defines the action handlers (`handleAcceptInviteFromNotif`, `handleOpenNotification`).
* **Utilities**:
  - `mappers.ts` ([mappers.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/lib/mappers.ts)): Holds the `mapNotificationsToLegacy` mapping helper, which matches database records to view models, fetches related plan entry fees, and computes relative timeline offsets.

---

## Database

* **`notifications` Table**:
  - `id` (UUID, Primary Key)
  - `user_id` (UUID -> `users.id`) — Recipient of the notification.
  - `type` (Enum/Text: `PLAN_INVITATION`, `WAITLIST_PROMOTED`, `PLAN_CANCELLED`, `PLAN_UPDATED`, `HOST_TRANSFERRED`, etc.)
  - `title` (Text)
  - `body` (Text)
  - `related_plan_id` (UUID, Nullable -> `plans.id`) — Mapped plan.
  - `is_read` (Boolean, Default `false`)
  - `created_at` (Timestamp)
  - `read_at` (Timestamp, Nullable)
* **Write Operations**:
  - **Insert**: Batch inserted by plan actions (creation/updates) or circle triggers via `/api/db/upsert`.
  - **Update**: Initiated by recipient user actions to toggle `is_read = true` matching target notification IDs.

---

## State Management

* **Location**: Local states are managed inside `MainApp.tsx` (`notifications` state hook).
* **Derived State**: Mapped using `mapNotificationsToLegacy` inside the root synchronization loop.
* **Supabase Realtime**: Realtime channels listen to the `notifications` table where `user_id` matches the active user UUID, updating the array when new rows are added or marked read.

---

## Dependencies

### Depends On
* **Auth**: Requests user session details to query corresponding alerts.
* **Profile**: Needs user definitions to identify recipient UUIDs.
* **Plans**: Inspects plans lists to resolve dates, host names, and entry fees.
* **Supabase**: Accesses database and realtime socket channels.

### Used By
* **Home**: Renders notification logs and completed memory events.
* **Plans**: Updates plan indicators and RSVP states.

---

## Security

* **RLS Policies** (via `024_notifications_rls_policies.sql`):
  - **Read**: Authenticated users can only read notifications where `user_id = auth.uid()`.
  - **Insert**: Allowed for any authenticated user, letting hosts write invitation rows for recipients.
  - **Update**: Authenticated users can only modify `is_read` on rows where `user_id = auth.uid()`.

---

## Source Files

* [NotificationsScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/notifications/screens/NotificationsScreen.tsx): Presentation screen handling filters, list items, and action triggers.
* [mappers.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/lib/mappers.ts): Contains mappers linking notifications with their corresponding plans and relative time formatting.

---

## Known Issues

* **Completed Memories UI Placement**: Completed memory items are rendered inside the notifications tab rather than the home tab, adding visual noise.
* **No Bulk Mark-as-Read**: Users must tap each notification individually to mark it read; there is no "Mark all as read" button.

---

## Technical Debt

* **Context Separation**: The notifications state lives directly in `MainApp.tsx` instead of a separate `NotificationsContext` provider, cluttering the root component.
* **Hardcoded Fallbacks**: Schema mappings fallback to `'general'` or `'invitation'` if type keys mismatch, adding translation layers.

---

## Future Roadmap

* **Notification Preferences**: Let users toggle specific notification channels (e.g. mute co-host promotion alerts while keeping plan invitations active).
* **Grouped Notifications**: Group multiple notifications from the same plan to keep the feed clean.

---

## Maintenance Notes

This document is a living specification. Whenever the Notifications feature changes, `features/notifications/plan.md` must be updated so it always reflects the current implementation.
