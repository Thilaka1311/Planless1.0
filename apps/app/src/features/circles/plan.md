# Circles Feature

## Overview

The Circles feature provides users with reusable, custom-created groups of friends (e.g. "Football Crew", "Dinner Buddies") to simplify and accelerate spontaneous plan organization. Instead of selecting attendees individually for every new event, users invite a circle, automatically distributing invites to all of its members.

---

## Current Functionality

* **Circle Creation**: Users choose a name, description, cover image, and select initial members from their friends list.
* **Circle Details**: View circle names, descriptions, member lists, and shared activity history.
* **Circle Deletion**: Creators can delete a circle, which cascades and deletes all related memberships.
* **Circle Membership & Management**:
  - **Adding Members**: Co-hosts and hosts can search for and add new members to the circle.
  - **Removing Members**: Co-hosts and hosts can remove members.
  - **Leaving a Circle**: Members can voluntarily leave the circle at any time.
* **Member Roles**: Supports three roles: `host` (creator), `co_host` (managers), and `member` (regular participants).
* **Host & Co-host Management**:
  - Hosts can promote members to co-hosts or demote co-hosts back to members.
  - Hosts can transfer complete ownership of the circle to another member.
* **Circle Synchronization**: Circles, members, and roles are synchronized live between the client and Supabase databases.
* **Automatic Friendships**: Direct additions of members into a circle trigger automatic accepted friendships among all circle members in the database.

---

## User Flow

```
   ┌────────────────────────────────────────────────────────┐
   │ 1. Creation: User sets name, description, image       │
   └──────────────────────────┬─────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ 2. Select initial │
                    │ friends list      │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ 3. Database Write │
                    │ Inserts circle and│
                    │ members           │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ 4. Auto-Friend    │
                    │ Generator triggers│
                    │ accepted links    │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ 5. Manage Circle  │◄─────────────────────────────┐
                    └─────────┬─────────┘                              │
                              │                                        │
             ┌────────────────┼────────────────┐                       │
             │                │                │                       │
      Host   ▼       Host/    ▼       Member   ▼                       │
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                    │
    │ Transfer    │ │ Promote/    │ │ Leave       │                    │
    │ ownership / │ │ Demote      │ │ circle      │                    │
    │ Delete      │ │ co-hosts /  │ └─────────────┘                    │
    │ circle      │ │ Add/Remove  │                                    │
    └─────────────┘ │ members     │                                    │
                    └──────┬──────┘                                    │
                           │                                           │
                           ▼                                           │
                    ┌───────────────────────────┐                      │
                    │ 6. Sync changes to DB,    │──────────────────────┘
                    │    refresh state & notif  │
                    └───────────────────────────┘
```

---

## Architecture

* **Screens**:
  - `CirclesScreen.tsx` ([CirclesScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/screens/CirclesScreen.tsx)): Tab navigation view displaying the user's active circles in a clean card list with search capabilities.
  - `CircleHubScreen.tsx` ([CircleHubScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/screens/CircleHubScreen.tsx)): Entry dashboard for a specific circle, displaying chat links, member lists, and active plans.
  - `CircleDetailScreen.tsx` ([CircleDetailScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/screens/CircleDetailScreen.tsx)): Detail view containing member details, role descriptions, and configuration modals.
  - `CreateCircleDetailsScreen.tsx` ([CreateCircleDetailsScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/screens/CreateCircleDetailsScreen.tsx)): Input screen for circle meta configuration.
  - `CreateCircleMembersScreen.tsx` ([CreateCircleMembersScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/screens/CreateCircleMembersScreen.tsx)): Member selection step during circle creation.
  - `AddMembersScreen.tsx` ([AddMembersScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/screens/AddMembersScreen.tsx)): Screen to search friends and add them to an existing circle.
* **Components**:
  - `CircleCard.tsx` ([CircleCard.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/components/CircleCard.tsx)): Visual card wrapper displaying circle covers and descriptions.
* **State & Providers**:
  - `CirclesContext.tsx` ([CirclesContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/state/CirclesContext.tsx)): Houses active circle state (`dbCircles`, `dbCircleMembers`, `circles`), exposes write actions (`createCircle`, `removeCircleMember`, `updateCircleMemberRole`, `transferCircleHost`), manages visibility reconciliation hooks, and handles realtime Supabase channels.

---

## Database

* **`circles` Table**:
  - `id` (UUID, Primary Key)
  - `public_id` (Text, Unique)
  - `name` (Text)
  - `created_by` (UUID -> `users.id`)
  - `created_at` (Timestamp)
  - `updated_at` (Timestamp)
* **`circle_members` Table**:
  - `id` (UUID, Primary Key)
  - `circle_id` (UUID -> `circles.id`)
  - `user_id` (UUID -> `users.id`)
  - `role` (Enum: `CREATOR`, `ADMIN`, `MEMBER`)
  - `joined_at` (Timestamp)
* **Write Strategy**:
  - **Insert**: Creates new rows in `circles` and batch inserts memberships.
  - **Update**: Adjusts properties or transitions roles in `circle_members` via the backend upsert endpoints.
  - **Delete**: Cascades on `circles.id` deletion to clean up associated memberships.

---

## State Management

* **Location**: States live in `CirclesProvider` via contexts.
* **Derived State**: On changes to `dbCircles` or `dbCircleMembers`, `useEffect` hooks compute the mapped view models using the `mapCirclesToLegacyCircles` mapping utility.
* **Realtime Synchronization**: Realtime state listeners subscribe to Supabase events (`*` for table `circles` and `circle_members`). Triggered updates invoke local state setters to synchronize properties instantly.

---

## Dependencies

### Depends On
* **Auth**: Uses authentication identities to track creator scopes.
* **Profile**: Reads `ProfileContext` user details to associate display names with member listings.
* **Friendships**: Queries accepted connections to populate invitation menus.
* **Supabase**: Accesses database and realtime socket channels.

### Used By
* **Create**: Reads active circles list to display as plan invitation choices.
* **Plans**: Explodes circles into individual plan participant invitations during creation.
* **Chat**: Sets up channels for circle-scoped chat.
* **Notifications**: Dispatches alerts for actions (e.g. host transfers, membership changes).

---

## Roles & Permissions

| Role | Database Role | Permissions |
|------|---------------|-------------|
| **Host** | `host` / `creator` | Full control. Can add/remove members, promote/demote co-hosts, transfer ownership, and delete the circle. |
| **Co-host** | `co_host` / `admin` | Management capabilities. Can add/remove members. Cannot demote others, transfer ownership, or delete the circle. |
| **Member** | `member` | Read-only access. Can view circle details, participate in chat/plans, and leave the circle. |

---

## Security

* **RLS Policies**: Secure access and mutations at the database level.
  - **Read**: Authenticated users can only read circles they belong to.
  - **Insert**: Authenticated users can insert circles and associate themselves as hosts.
  - **Update/Delete**: Enforced checks verify the request user UUID matches a host or co-host member record.

---

## Source Files

* [CirclesContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/state/CirclesContext.tsx): Main provider storing context states, action functions, and realtime channels.
* [CirclesScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/screens/CirclesScreen.tsx): Index tab view displaying circles cards.
* [CircleDetailScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/circles/screens/CircleDetailScreen.tsx): Configuration screen managing members and roles.

---

## Known Issues

* **Realtime Race Conditions**: Quick successive edits during offline states can lead to temporary UI drift prior to visibility reconciliation.
* **Image Upload Mocking**: Custom cover images use mock image strings rather than a dedicated file storage upload flow.

---

## Technical Debt

* **Terminology Mismatch**: The database role schema uses upper case constraints (`CREATOR`, `ADMIN`, `MEMBER`), whereas the frontend models map roles using lower case structures (`host`, `co_host`, `member`), requiring mapping steps.
* **Realtime Recovery Overhead**: Visibility recovery triggers full table refetches on target collections rather than delta synchronization.

---

## Future Roadmap

* **Circle Invites**: Replace direct additions with a pending request system requiring members to accept circle invitations.
* **Circle Categories**: Support tagging circles (e.g. "Sports", "Work") for automated activity recommendations.

---

## Maintenance Notes

This document is a living specification. Whenever the Circles feature changes, `features/circles/plan.md` must be updated so it always reflects the current implementation.
