# Friendships Feature

## Overview

The Friendships feature manages peer connections between users in Planless. It establishes who can see each other, interact, and invite one another to plans or circles. It uses a **canonical, symmetric mapping** in the database to prevent duplicate connection rows and optimize lookups.

---

## Current Functionality

* **Friendship Creation**: Users connect either through explicit requests or automatic synchronization.
* **Accepted Friendships**: The core connection state (`status = 'ACCEPTED'`). Only accepted friendships are treated as active friends in user-facing lists (such as the Create Plan invite list).
* **Pending Friendships**: Friendships initiated by one user (`status = 'PENDING'`) waiting for a response from the receiver.
* **Rejected Friendships**: Rejected connections are dropped (deleted from the database).
* **Removing Friendships**: Unfriending deletes the row from the `friendships` table.
* **Automatic Friendships from Circles**: When members are added to a circle, the backend/service automatically inserts accepted friendship records among all circle members.
* **Automatic Friendships from Plans**: When a user joins or rejoins an active plan, the system automatically runs a synchronization job to create accepted friendships between the joining user and all existing active participants in that plan.
* **Friend Filtering & Availability**: Evaluates raw database friendship records against the active user's UUID. Filters for rows where the status is `ACCEPTED` and maps the opposite UUID to profile records to populate friends selection lists.

---

## User Flow

```
   ┌────────────────────────────────────────────────────────┐
   │ 1. Eligibility: Users join the same plan or circle    │
   └──────────────────────────┬─────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Trigger method?   │
                    └───┬───────────┬───┘
               Automatic│           │Explicit Request
                        ▼           ▼
        ┌───────────────────┐   ┌───────────────────────────┐
        │   syncPlan /      │   │ createFriendRequest()     │
        │   generateCircle  │   │ status = 'PENDING'        │
        │   Friendships     │   └───────────┬───────────────┘
        └─────────┬─────────┘               │
                  │                         ▼
                  │                 ┌───────────────┐
                  │                 │ receiver      │
                  │                 │ accepts?      │
                  │                 └───┬───────┬───┘
                  │                  Yes│     No│
                  ▼                     ▼       ▼
        ┌───────────────────┐   ┌───────────┐ ┌─────────────┐
        │ Insert ACCEPTED   │◄──┤  Accept   │ │ Decline     │
        │ friendship row    │   │Request    │ │ (Delete     │
        │ (using canonical  │   └───────────┘ │ row)        │
        │  UUID ordering)   │                 └─────────────┘
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │ Active Friendship │
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │ user removes?     │
        └─────────┬─────────┘
                  │Yes
                  ▼
        ┌───────────────────┐
        │ Delete row        │
        └───────────────────┘
```

---

## Architecture

* **Services**:
  - `friendshipService.ts` ([friendshipService.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/friendships/services/friendshipService.ts)): Core logic handler. Manages database inserts, updates, and deletes for friend requests, acceptances, removals, and automatic triggers (`generateCircleFriendshipsDirect`, `syncPlanFriendships`).
* **Utilities**:
  - `normalize.ts` ([normalize.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/friendships/utils/normalize.ts)): Contains `normalizeFriendshipUsers(uuidA, uuidB)` to sort UUIDs lexicographically before querying or inserting.

---

## Database

* **`friendships` Table**:
  - `id` (UUID, Primary Key)
  - `user_1_id` (UUID, Foreign Key -> `users.id`) — smaller lexicographical UUID
  - `user_2_id` (UUID, Foreign Key -> `users.id`) — larger lexicographical UUID
  - `requested_by` (UUID, Foreign Key -> `users.id`) — the UUID of the request initiator
  - `created_from_plan_id` (UUID, Nullable, Foreign Key -> `plans.id`) — references the origin plan
  - `status` (Enum: `PENDING`, `ACCEPTED`, `REJECTED`)
  - `created_at` (Timestamp)
  - `responded_at` (Timestamp, Nullable)
* **Constraints**:
  - `check_canonical_order`: `user_1_id < user_2_id` (enforces sorting consistency)
  - `unique_friendship`: Unique combination of `user_1_id` and `user_2_id`
* **Related Tables**:
  - `users`: To resolve profiles for mapped friend IDs.
  - `circle_members` & `plan_participants`: Inserts into these tables trigger automatic friendship creations.

---

## State Management

* **Location**: Friendship state (`dbFriendships`) is stored inside `ProfileContext` at the application root level.
* **Propagation**: Consumed downstream by hooks and filters.
* **Realtime**: Synced along with general tables.

---

## Friend Resolution

To determine if user A and user B are friends:

1. **Sort UUIDs**: Runs `normalizeFriendshipUsers(uuidA, uuidB)` to identify `user_1_id` (smaller) and `user_2_id` (larger).
2. **Database Query**: Filters the `friendships` table matching the two canonical columns.
3. **Availability Filter**:
   ```typescript
   // AVAILABLE_FRIENDS logic
   const friends = dbFriendships
     .filter(f => f.status === 'ACCEPTED')
     .map(f => (f.user_1_id === myUuid ? f.user_2_id : f.user_1_id));
   ```

---

## Dependencies

### Depends On
* **Profile**: Accesses `ProfileContext` state and user UUIDs to identify relationships.
* **Supabase**: Relies on the database client for queries and modifications.

### Used By
* **Circles**: Generates automatic friendships when circle memberships are set up.
* **Create**: Reads the `ACCEPTED` friend list to populate invitation search filters.
* **Plans**: Matches connection states to render invite candidates.
* **Chat**: Connects users to chat feeds and handles status flags.
* **Notifications**: Triggers system notices for friend updates.

---

## Security

* **RLS Policies**: Row-level policies require the authenticated session UUID (`auth.uid()`) to match either `user_1_id` or `user_2_id` to view or delete friendship rows.
* **Ownership**: Modifications (like accept or decline) enforce validation matching the recipient's identity.

---

## Source Files

* [friendshipService.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/friendships/services/friendshipService.ts): Houses core business logic for connection creation, acceptance, removal, and automatic plan/circle syncing.
* [normalize.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/friendships/utils/normalize.ts): Lexicographically sorts user UUIDs to guarantee a single canonical representation of each friendship link.

---

## Known Issues

* **Implicit Auto-Accepts**: Joining a circle or plan automatically accepts connections without explicit user permission.
* **Orphaned Entries on Rejection**: Although decline deletes the row, the status is set to `PENDING` rather than transition to `REJECTED`, as rejection simply deletes the row entirely.

---

## Technical Debt

* **State Placement**: Friendship state (`dbFriendships`) is stored inside `ProfileContext.tsx` rather than a dedicated `FriendshipsContext` provider.
* **Redundant Queries**: Automatic generation functions perform full table scans on friendships to detect duplicates instead of targeted index checks.

---

## Future Roadmap

* **Mutual Friend Counts**: Display the number of shared connections on user cards.
* **Explicit Connection Approvals**: Require invitations to be approved for circle or plan additions.

---

## Maintenance Notes

This document is a living specification. Whenever the Friendships feature changes, `features/friendships/plan.md` must be updated so it always reflects the current implementation.
