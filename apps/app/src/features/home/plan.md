# Home Feature

## Overview

The Home feature acts as the primary dashboard and entrance landing for Planless users. It is designed around a **card-stack feed interface** where users can discover new plans, track upcoming meetups, RSVP, monitor capacity status, and complete memory details for completed events.

---

## Current Functionality

* **Plan Feed Stack**: Renders active and discoverable plans as a swipeable vertical layout.
* **Filter Pills**: Filters feeds dynamically to isolate plans by categories: "Matchday", "Blockbuster", "Cafe Ventures".
* **Urgency Cards & Deadline Badges**: Displays countdown alerts (e.g. "Response window closes in 2 hours") to drive fast RSVP decisions.
* **Hold-to-Accept Interaction**: Embeds interactive overlays letting users long-press to accept invites directly on feed cards.
* **Memory Prompts**: Automatically triggers post-plan memory banners when a plan is completed, encouraging users to write reviews or submit game scores.
* **Startup Hydration**: Refetches tables on mount to populate the feed with updated data.
* **Realtime Feed Updates**: Listens to database mutation streams to refresh properties instantly.

---

## User Flow

```
   ┌────────────────────────────────────────────────────────┐
   │ 1. Mount: HomeScreen pulls user profile from store     │
   └──────────────────────────┬─────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ 2. useHomeFeed()  │
                    │ triggers refresh  │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ 3. Hydrate Stack  │
                    │ Render PlanStack  │
                    │ card feed         │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │ Swipe cards  │ │ Long-press   │ │ View memory  │
     │ / filter     │ │ card to Join │ │ prompt banner│
     └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
            │                │                │
            │                ▼                ▼
            │         ┌──────────────┐ ┌──────────────┐
            │         │ Trigger RSVP │ │ Open Memory  │
            │         │ write, update│ │ details pane │
            │         │ local state  │ └──────────────┘
            │         └──────┬───────┘
            │                │
            └───────┬────────┘
                    │
                    ▼
             ┌──────────────────────────┐
             │ 4. Sync feeds live via   │
             │    realtime postgres     │
             │    socket subscriptions  │
             └──────────────────────────┘
```

---

## Architecture

* **Screens**:
  - `HomeScreen.tsx` ([HomeScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/home/screens/HomeScreen.tsx)): Feed coordinator. Manages card index navigation, active cards, scroll states, memory banner listings, and trigger dispatches.
* **Components**:
  - `PlanStack.tsx` ([PlanStack.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/home/components/PlanStack.tsx)): Coordinates layout of the cards, applying scaling transformations to background cards.
  - `PlanCard.tsx` ([PlanCard.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/home/components/PlanCard.tsx)): Visual layout containing cover images, locations, RSVP statuses, and delegation to the shared `ParticipantToggleBar` component.
  - `EmptyState.tsx` ([EmptyState.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/home/components/EmptyState.tsx)): Glassmorphic placeholder showing when no discoverable plans match current criteria.
  - `FeedFilters.tsx`: Renders top pill buttons to filter the active cards.
  - `HoldToAcceptOverlay.tsx`: Interactive circular long-press visual animation wrapper.
* **Hooks**:
  - `useHomeFeed.ts` ([useHomeFeed.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/home/hooks/useHomeFeed.ts)): Hook triggered on mount to invoke PlansContext refresh routines.
  - `usePlanVisibility.ts` ([usePlanVisibility.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/home/hooks/usePlanVisibility.ts)): Resolves participant status breakdowns (`JOINED`, `WAITLISTED`, `INVITED`, `SKIPPED`) to structure plan cards.
  - `useHoldToAccept.ts`: Monitors mouse/touch thresholds to handle holding durations and trigger callback dispatches.

---

## Database

* **`plans` Table**: Sourced by the home feed via `/api/db/fetch-all?tables=plans` (filtered by active schedules).
* **`plan_participants` Table**: Resolves which plans the user is invited to, joined, waitlisted, or skipped.
* **`users` Table**: Resolves creator display names and photo avatars.
* **`notifications` Table**: Inspects read flags and notifies of invite actions.

---

## State Management

* **Location**: Uses state definitions from `PlansContext` and `ProfileContext` to construct feeds.
* **Derived Feed State**: Sourced through `MainApp.tsx` and resolved dynamically as `discoverablePlans` based on status filters, and passed to `HomeScreen`.

---

## Feed Logic

A plan is included in `discoverablePlans` for a user if:
1. The user is a participant (host, co-host, or invitee) OR circle member of the plan's circle.
2. The plan status is NOT `cancelled`.
3. The plan scheduled time has not passed, OR it has completed but requires memory contributions.
4. It is sorted chronologically (soonest events showing first).

---

## Real-Time Synchronization

* **Postgres Channels**: Listens to changes on `plans` and `plan_participants` tables. Updates locally, triggering immediate card-stack updates.
* **Focus Restoration**: Listeners trigger automatic refreshes when the app is focused (`focus` event) or goes back online (`online` event).

---

## Security

* **RLS Policies**: Row-level policies (`022_plans_rls_policies.sql`) ensure users only fetch plans they are authorized to view.
* **Privacy Flags**: Filters verify that private circle plans are only visible to verified circle members.

---

## Source Files

* [HomeScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/home/screens/HomeScreen.tsx): Main screen controller managing memory prompts, swipe cards, and transitions.
* [PlanCard.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/home/components/PlanCard.tsx): Displays location details, dates, schedules, and RSVP stats.
* [usePlanVisibility.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/home/hooks/usePlanVisibility.ts)): Resolves participant listing categorizations.

---

## Known Issues

* **Animation Lag**: Successive rapid card swipes in low-end mobile devices can trigger animation frame-drops in JS transition layers.
* **Scroll Reset**: Navigating back from plan details occasionally triggers a momentary scroll jump.

---

## Technical Debt

* **Feed Generation Splitting**: Feed compiling rules are split between the controller file (`MainApp.tsx`), the feed hook (`useHomeFeed.ts`), and the store `PlansContext.tsx` rather than consolidated in a single logic module.

---

## Future Roadmap

* **Personalized Feeds**: Order feed stacks based on category affinities and frequent friends interactions.
* **Custom Widgets**: Support home screen widgets displaying upcoming plans.

---

## Maintenance Notes

This document is a living specification. Whenever the Home feature changes, `features/home/plan.md` must be updated so it always reflects the current implementation.
