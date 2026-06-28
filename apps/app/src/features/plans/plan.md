# Plans Feature

## Overview

The Plans feature is the core engine of the Planless application. It manages the complete active lifecycle of meetups after they have been created. This includes coordinating RSVPs, handling capacity constraints and waitlist transitions, managing team rosters, processing host transfers, executing plan edits/cancellations, and syncing states in real-time between clients.

---

## Current Functionality

* **Active Feeds & Detail Modals**: Displays plans categorized by active dates, times, and timelines on home and history feeds. Expands into interactive sheets revealing detail breakdowns, costs, and participant lists.
* **RSVP States**: Coordinates response pipelines for plan participants:
  - `INVITED` (Invited, has not responded).
  - `JOINED` (Accepted and actively participating).
  - `WAITLISTED` (Accepted but waiting for capacity).
  - `SKIPPED` (Declined or no longer participating / host ejected).
* **Capacity & Waitlist Management**:
  - Monitors spots using `getAvailableCapacity(planId)`.
  - When a user joins and capacity is full, the status shifts automatically to `WAITLISTED`.
  - Ejecting or leaving of a `JOINED` member (transition to `SKIPPED`) triggers automatic promotion of the next `WAITLISTED` member (via FIFO queue ordering).
  - Hosts can manually promote waitlisted users or adjust maximum plan capacity, triggering auto-rebalancing.
* **Host Transfers**: Permitted hosts can transfer complete ownership of a plan to any participant, converting the original host to a co-host role.
* **Plan Customization & Cancellation**: Allowed hosts/managers can edit schedules, titles, and locations, or cancel plans. E-mail triggers and system notifications notify participants.
* **Team Board & Assigments**: In sport subcategories (e.g. Football/Badminton), users can customize two teams (Team A/B) and drag/drop participants into specific lineups.
* **Real-time State Synchronization**: Subscribes to Supabase sockets to update client screens instantly when participant RSVPs or configurations change.

---

## User Flow

```
   ┌────────────────────────────────────────────────────────┐
   │ 1. Instantiation: Form submitted, plan created         │
   └──────────────────────────┬─────────────────────────────┘
                              │
                    ┌_________▼_________┐
                    │ 2. Invitees get   │
                    │ notification &    │
                    │ entry shows on feed│
                    └_________▼_________┘
                              │
                    ┌_________▼_________┐
                    │ 3. RSVP Decision  │◄─────────────────────────────┐
                    └───┬───────────┬___┘                              │
                        │           │                                  │
                  Accept▼           ▼Decline/Skip                      │
         ┌──────────────┴───────┐ ┌─────────────┐                      │
         │  Spots available?    │ │ RSVP state  │                      │
         └───┬─────────────┬____┘ │ set to      │                      │
          Yes│           No│      │ SKIPPED     │                      │
             ▼             ▼      └─────────────┘                      │
      ┌─────────────┐ ┌─────────────┐                                  │
      │ RSVP state  │ │ RSVP state  │                                  │
      │ set to      │ │ set to      │                                  │
      │ JOINED      │ │ WAITLISTED  │                                  │
      └──────┬──────┘ └──────┬──────┘                                  │
             │               │                                         │
             ▼               ▼                                         │
      ┌─────────────────────────────┐                                  │
      │ 4. Participant Board Interaction                               │
      │    - Assign / move teams (Sports plans)                        │
      │    - Skip plan (triggers waitlist promotion)                   │
      │    - Host edits details or transfers ownership                 │
      └──────────────────────┬──────┘                                  │
                             │                                         │
             ┌───────────────┼───────────────┐                         │
        Skip │          Edit │        Cancel │                         │
             ▼               ▼               ▼                         │
      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                  │
      │ Set status  │ │ Update DB,  │ │ Update plan │                  │
      │ to SKIPPED  │ │ sync stats, │ │ status to   │                  │
      │ & promote   │ │ notify users│ │ CANCELLED   │                  │
      │ waitlist    │               │               │                  │
      └──────┬──────┘ └──────┬──────┘ └──────┬──────┘                  │
             │               │               │                         │
             ▼               ▼               ▼                         │
      ┌─────────────────────────────────────────────┐                  │
      │ 5. Realtime sockets broadcast changes to all│──────────────────┘
      └─────────────────────────────────────────────┘
```

---

## Architecture

* **Screens**:
  - `PlansScreen.tsx` ([PlansScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/screens/PlansScreen.tsx)): Displays active and historical events categorized by tabs ("Host", "Invited", "Past").
  - `EditPlanScreen.tsx` ([EditPlanScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/screens/EditPlanScreen.tsx)): Configuration form panel allowing hosts to modify scheduled times, locations, and descriptions.
  - `ManageParticipantsScreen.tsx` ([ManageParticipantsScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/screens/ManageParticipantsScreen.tsx)): Specialized management view letting hosts change guest RSVP status categories.
* **Detailed Plan Modal**:
  - `index.tsx` ([index.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/components/DetailedPlanModal/index.tsx)): Combines custom ActionButtons, PlanDetailsInfo, and the shared ParticipantToggleBar component into a slide-over sheet.
* **Components**:
  - `ParticipantToggleBar.tsx` ([ParticipantToggleBar.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/components/ParticipantToggleBar.tsx)): Shared participant list and toggle bar component.
  - `ParticipantBoard.tsx` ([ParticipantBoard.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/components/ParticipantBoard.tsx)): Drag-and-drop board for team rosters and lineups.
  - `EditablePlanPreviewCard.tsx`: Visual preview block.
* **Context & Hooks**:
  - `PlansContext.tsx` ([PlansContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/state/PlansContext.tsx)): Global context controller managing states (`dbPlans`, `dbPlanParticipants`), mapping outputs, and coordinating updates.
  - `usePlanParticipants.ts` ([usePlanParticipants.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/hooks/usePlanParticipants.ts)): Houses participant status logic, RSVP updates, waitlist promotions, and capacity checks.
  - `usePlanLifecycle.ts` ([usePlanLifecycle.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/hooks/usePlanLifecycle.ts)): Coordinates plans status changes (Edit, Cancel, Complete) and dispatching updates.
  - `usePlanTeams.ts`: Manages team rosters.

---

## Database

* **`plans` Table**: Core properties (id, public_id, title, category, status, scheduled_at, rsvp_deadline, max_participants, host_id).
* **`plan_participants` Table**: Tracks user relations (role, rsvp_status, responded_at).
* **`plan_teams` Table**: Stores team categories (TEAM_1, TEAM_2) per plan.
* **`team_members` Table**: Maps `plan_participants.id` to specific `plan_teams.id`.

---

## State Management

* **Context State**: Profile variables (`dbPlans`, `dbPlanParticipants`) are updated live via contexts.
* **Derived State**: Computed using mapping utilities (`mapPlansToLegacyPlans`) to inject creator info and participant lists.
* **Supabase Realtime**: Realtime channels listen for changes on `plans`, `plan_participants`, `plan_teams`, and `team_members` to push immediate state updates to clients.

---

## Permissions

* **Host**: Can modify plan details, transfer ownership, remove any participant, promote waitlists, drag/drop users into teams, and cancel plans.
* **Co-host**: Can add participants, modify team lists, and complete plans. Cannot transfer ownership or delete plans.
* **Participant**: Can accept/decline invites, join, leave, view details, and assign themselves to a team.

---

## Security

* **RLS Policies** (via `022_plans_rls_policies.sql`):
  - **Read**: Users can only view plans where they are hosts, invitees, or members of the circle associated with the plan.
  - **Write**: Modifications verify that the authenticated user UUID matches allowed host/co-host permissions in the database.

---

## Source Files

* [PlansContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/state/PlansContext.tsx): Holds database states, subscription triggers, and mappings.
* [usePlanParticipants.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/hooks/usePlanParticipants.ts): Participant-specific business logic (RSVPs, waitlists).
* [usePlanLifecycle.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/hooks/usePlanLifecycle.ts): Handles lifecycle transitions (Complete, Cancel, Edit).
* [ParticipantToggleBar.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/components/ParticipantToggleBar.tsx): Shared component for displaying participants.
* [DetailedPlanModal/index.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/plans/components/DetailedPlanModal/index.tsx): Renders details and coordinates action buttons.

---

## Known Issues

* **Realtime Race Conditions**: Quick successive actions (e.g. double clicking RSVP button) can trigger multiple API updates prior to socket callbacks, causing duplicate inserts.
* **Team assignments cleanup**: Deleting a participant does not automatically clean up their corresponding `team_members` row, requiring manual reconciliation.

---

## Technical Debt

* **Roster Sync Overload**: Roster updates trigger full layout re-renders on the parent feed screen because states are shared in a global context.
* **Casing Discrepancies**: Casing differences exist between database models (`JOINED`, `INVITED`) and UI variables (`going`, `waitlist`), requiring mapping steps.

---

## Future Roadmap

* **Realtime Indicators**: Renders live indicators showing when users are typing or viewing a plan.
* **Moderation Controls**: Mute controls to restrict problematic invitees from posting or interacting.

---

## Maintenance Notes

This document is a living specification. Whenever the Plans feature changes, `features/plans/plan.md` must be updated so it always reflects the current implementation.
