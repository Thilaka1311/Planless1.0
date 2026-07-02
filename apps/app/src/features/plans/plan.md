# Plans

# 1. Vision & Purpose

The Plans feature is the central coordination hub of Planless. It owns the complete lifecycle of a plan after it has been created, providing a single source of truth for participants, scheduling, attendance, capacity, and plan status.

Its purpose is to replace fragmented group coordination with a structured experience where everyone involved in a plan shares the same up-to-date information.

The Plans feature enables users to:

- View and manage active plans.
- Coordinate attendance with other participants.
- Track participant status and capacity.
- Manage plan ownership and permissions.
- Progress a plan through its lifecycle from creation to completion or cancellation.

The Plans feature owns every active plan regardless of its current lifecycle stage. It is responsible for maintaining the integrity of plan data, participant state, and plan state throughout the lifetime of the plan.

## 2. Core Responsibilities

The Plans feature is responsible for:

- Managing the lifecycle of every plan.
- Managing participant membership and RSVP state.
- Managing plan ownership, permissions, and roles.
- Managing plan details and settings.
- Enforcing capacity and waitlist rules.
- Coordinating participant rosters and team assignments.
- Managing plan cancellation and completion.
- Maintaining the integrity of plan data throughout its lifecycle.

### Responsibilities Delegated to Other Features

The Plans feature delegates responsibilities outside of active plan management to other features.

Examples include:

- Discovering new invitations.
- Creating new plans.
- Notifications.
- Historical memories and post-plan experiences.

While these features interact with plans, ownership of the plan itself remains with the Plans feature.

# 3. Business Rules

## Plan Lifecycle Rules

### Plan Statuses

A plan exists in exactly one of three lifecycle states:

- `LIVE`
- `COMPLETED`
- `CANCELLED`

A plan can only transition from `LIVE` to either `COMPLETED` or `CANCELLED`. Once a plan leaves the `LIVE` state, it cannot return to it.

---

## Participant Rules

A participant exists in exactly one of four RSVP states:

- `INVITED`
- `JOINED`
- `WAITLISTED`
- `SKIPPED`

A participant may only transition between states through valid lifecycle rules.

The host is always considered a joined participant and cannot leave, skip, or be removed from their own plan.

---

## Capacity Rules

Every plan has a maximum participant capacity.

The host always occupies one capacity slot.

When the plan reaches capacity:

- Additional participants join the waitlist.
- Joined participants are never automatically removed to make room for someone else.

If capacity becomes available, the earliest eligible waitlisted participant is promoted automatically.

---

## Ownership Rules

Every plan has exactly one host.

The host has full administrative control over the plan.

Ownership may be transferred only to an eligible participant.

A plan must never exist without a host.

---

## Permissions

### Host

The host can:

- Edit the plan.
- Manage participants.
- Cancel the plan.
- Complete the plan.
- Transfer ownership.
- Manage co-hosts.

### Co-host

A co-host may perform delegated management actions defined by the plan.

Co-host permissions can never exceed host permissions.

### Participant

Participants may only perform actions affecting their own participation unless additional permissions have been granted.

---

## Cancellation Rules

Only the host may cancel a plan.

Cancelling a plan changes its status to `CANCELLED`.

Cancelled plans remain stored as historical records and are excluded from active plan experiences.

### Plan Cancelled Confirmation Screen

After successfully cancelling a plan, the host is presented with a dedicated full-screen Plan Cancelled confirmation screen:
- **Visual Style**: Clean, minimal, premium aesthetic with black background, orange accent, and clean typography.
- **Cancellation Animation**: A smooth and intentional 1–1.5s animation where the status fades, a circle outline animates in, a cancellation symbol ("X") appears, and a subtle orange pulse/ring plays.
- **Content**: Centered "Plan Cancelled" title and supporting text ("Your plan has been cancelled. Participants will no longer be able to join or attend this plan.").
- **Actions**:
  - **Return Home** (Primary): Navigates the user to the Home feed.
  - **Go to Plans** (Secondary): Navigates directly to the Plans tab with the **Hosted** filter automatically selected.

---

## Completion Rules

Only a `LIVE` plan may be completed.

Completing a plan changes its status to `COMPLETED`.

Completed plans become read-only historical records.

---

## Team Rules

Only joined participants may belong to a team.

Participants that are no longer joined are automatically removed from team assignments.

---

## Data Integrity Rules

The following conditions must always remain true:

- Every plan has exactly one host.
- The host is always joined.
- Every participant has exactly one RSVP state.
- Every plan has exactly one lifecycle status.
- Capacity calculations are always based on joined participants.
- Waitlist ordering is deterministic and preserved.
- Historical plans retain their records after completion or cancellation.

# 4. User Journey

## Viewing a Plan

The user opens a plan to view its details, including the schedule, location, participants, capacity, and other relevant information.

The user can explore the participant list to understand who is attending, waiting for a spot, or has not yet responded.

---

## Managing Participation

Participants can respond to an invitation by joining or declining the plan.

If capacity is available, the participant joins immediately.

If the plan is full, the participant joins the waitlist.

Participants may leave a plan at any time and may later rejoin if they choose.

---

## Managing a Plan

Users with management permissions can update plan information, manage participants, adjust plan settings, organize teams where applicable, and oversee the overall coordination of the meetup.

Depending on their role, they may also transfer ownership, complete the plan, or cancel it.

---

## Closing the Plan

When the activity concludes, the plan can be marked as completed.

If the activity is no longer going ahead, the host may cancel the plan.

Once a plan leaves its active state, it is no longer treated as an active meetup.

# 5. Plan Composition

A plan is composed of the following sections.

## Basic Information

The core identity of the plan.

Contains:

- Public ID (prefixed with P followed by exactly six digits, e.g. P000001)
- Title
- Category
- Subcategory
- Description or notes

---

## Schedule

Defines when the activity takes place.

Contains:

- Date
- Time
- RSVP deadline

---

## Location

Defines where the activity takes place.

Contains:

- Venue
- Address
- Location details

---

## Participants

The collection of users associated with the plan.

Contains:

- Host
- Co-hosts
- Invited participants
- Joined participants
- Waitlisted participants
- Skipped participants

---

## Capacity

Defines the maximum number of participants that may join the plan and the current availability.

---

## Teams

Available for activities that require team organization.

Contains:

- Team A
- Team B
- Unassigned participants

---

## Cost

Defines any shared expenses associated with the plan.

Contains:

- Total cost
- Per-person contribution

---

## Discussion

Provides a shared space for participants to coordinate before and during the activity.

---

## Outcomes

Stores the results produced after the activity has concluded.

Examples include:

- Match results
- MVP selections
- Ratings
- Verdicts

---

## Settings

Contains configuration options that control the behaviour of the plan throughout its lifecycle.

# 6. Participant Lifecycle

## Participant States

A participant always exists in exactly one of the following states:

- `INVITED` — Waiting for a response.
- `JOINED` — Confirmed to attend the plan.
- `WAITLISTED` — Waiting for a place to become available.
- `SKIPPED` — No longer participating in the plan.

---

## Lifecycle

```
                 INVITED
               /    |     \
              /     |      \
           Join  Waitlist   Skip
             |      |        |
             ▼      ▼        ▼
          JOINED WAITLISTED SKIPPED
             |      |
             |      |
      Leave/Remove  Leave/Remove
             |      |
             ▼      ▼
          SKIPPED SKIPPED

WAITLISTED → JOINED when a spot becomes available
```

---

## State Transitions

### INVITED

A participant may:

- Join the plan.
- Join the waitlist if the plan is full.
- Skip the invitation.

---

### JOINED

A participant may:

- Continue participating.
- Leave the plan.
- Be removed from the plan.

Leaving or being removed ends the participant's active involvement.

---

### WAITLISTED

A participant remains in the queue until:

- A place becomes available.
- They leave the queue.
- They are removed.

When capacity becomes available, eligible participants are promoted automatically.

---

### SKIPPED

A skipped participant may rejoin the plan.

Depending on current capacity, they either:

- Join immediately.
- Re-enter the waitlist.

---

## Lifecycle Invariants

The following conditions are always true:

- A participant has exactly one active state.
- Every state transition follows a valid lifecycle path.
- The host always remains an active joined participant.
- Waitlisted participants never occupy confirmed capacity.
- Rejoining always evaluates the current state of the plan.

# 7. Host Actions

The host is responsible for coordinating and managing the plan throughout its lifecycle.

## Plan Management & Card-Based Editing

The host has full administrative control to modify plan details. Editing a plan uses the **interactive card editor** which visualizes changes in real-time and matches the layout and design rules of the Create Review screen:

- **Visual Consistency**: The Edit Plan screen renders the plan details on a true replica of the live Plan card.
- **Inline Customization**: Tapping individual sections on the card triggers specific editor panels:
  - Tapping **Title** or **Quick Notes** opens a text editor.
  - Tapping the **Hero Image** opens an action sheet:
    - *Use Default Image*: Uses the default image for the selected activity category.
    - *Use Group Profile Photo*: Replaces the cover image with the associated Circle's photo (if applicable).
    - *Choose Custom Image*: Uploads a custom file directly to Supabase storage.
  - Tapping **Location** opens a venue/address selector.
  - Tapping **Date/Time** or **RSVP Deadline** opens a native date-time picker.
  - Tapping **Cost** allows configuring total fees or free entry.
- **Database Synchronization (Single Source of Truth)**: Custom uploaded cover image URLs are persisted to the `cover_image` column in the `plans` database table. The database acts as the single source of truth; all plan cards (including Home feed, Plans feed, and Chat headers) retrieve and render the image directly from this column.
- **Participant Stack & Roster**: Tapping the participant section opens the roster management panel.
- **Changes Summary**: When saving, the host is presented with a summary listing only the modified fields (e.g., "Updated: Location, Cover Image") to confirm updates.
- **Cancellation Confirmation**: Only the host can cancel a plan. When clicked, it prompts for confirmation, transitions the plan's status to `CANCELLED`, and displays the cancellation confirmation success screen, routing the host to the **Hosted** filter list on the Plans dashboard.

---

## Participant Management

The host can:

- Invite participants.
- Remove participants.
- View participant status.
- Manage the waitlist.
- Promote participants when required.
- Assign or remove co-hosts.

---

## Team Management

For activities that support teams, the host can:

- Create teams.
- Assign participants to teams.
- Move participants between teams.
- Clear team assignments.

---

## Ownership

The host can:

- Transfer ownership of the plan.
- Manage administrative roles.

---

## Lifecycle Management

The host can:

- Complete the plan.
- Cancel the plan.

These actions transition the plan through its lifecycle and conclude active plan management.

# 8. Participant Actions

Participants can interact with a plan throughout its lifecycle based on their current participation state.

## Plan Interaction

Participants can:

- View plan details.
- View the participant list.
- View team assignments.
- View plan updates.

---

## Participation

Participants can:

- Accept an invitation.
- Decline an invitation.
- Join the waitlist.
- Leave the plan.
- Rejoin the plan.

These actions determine the participant's involvement in the plan.

---

## Communication

Participants can:

- Participate in the plan discussion.
- Coordinate with other participants.

---

## Team Participation

For activities that support teams, participants can:

- View team assignments.
- Join a team when permitted.
- Change teams when permitted.

---

## Viewing Results

After a plan concludes, participants can view the final outcomes associated with the activity, including any results or summaries generated by the plan.

# 9. State Management

The Plans feature owns the state required to manage plans throughout their lifecycle.

## Owned State

The Plans feature owns the following primary state:

- Plans
- Participants
- Plan outcomes

This state represents the authoritative data for every plan and is synchronized throughout the application.

---

## Shared State

The Plans feature consumes shared application state where required.

This includes:

- Current authenticated user
- User profile
- Application authentication state

This information is used to determine permissions, ownership, and participant identity.

---

## Derived State

The Plans feature derives additional information from its primary state, including:

- Participant counts
- Available capacity
- Waitlist counts
- Active plans
- Completed plans
- Cancelled plans
- Hosted plans
- Invited plans
- Participant role summaries

Derived state is recalculated whenever the underlying plan or participant data changes.

---

## Transient State

The feature maintains temporary state used while interacting with plans.

Examples include:

- Currently selected plan
- Loading state
- Refresh state
- Submission state
- Error state
- Temporary interaction state

This state exists only while the user is actively interacting with the feature.

---

## State Synchronization

State changes are propagated throughout the Plans feature so that all screens display consistent information.

Updates caused by participant actions, host actions, or plan lifecycle changes are reflected across the feature without requiring manual refreshes.

---

## State Reset

Plans state is refreshed or reset when appropriate, including:

- User authentication changes.
- Initial application startup.
- Manual refresh actions.
- Realtime synchronization events.

State resets never violate the integrity of plan or participant data.

# 10. Realtime Synchronization

The Plans feature keeps plan information synchronized for every participant throughout the lifecycle of a plan.

## Plan Synchronization

Changes to a plan are reflected for every participant with access to the plan.

This includes updates to:

- Plan information
- Schedule
- Location
- Capacity
- Participant list
- Team assignments
- Plan status

Participants should always see the latest available information.

---

## Participant Synchronization

Changes to participant activity are synchronized across the plan.

This includes:

- Joining
- Leaving
- Waiting for a spot
- Being removed
- Role changes

Participant counts and roster information remain consistent for everyone viewing the plan.

---

## Team Synchronization

For activities that support teams, changes to team assignments are reflected for all participants viewing the plan.

---

## Lifecycle Synchronization

When a plan changes lifecycle state, every participant receives the updated state.

Examples include:

- Plan completion.
- Plan cancellation.

These changes are reflected consistently across all active plan experiences.

---

## Recovery

The Plans feature automatically reconciles its state after interruptions such as:

- Returning to the application.
- Network reconnection.
- Recovering from temporary synchronization failures.

Participants should always return to the most recent valid state of the plan.

---

## Consistency

The Plans feature maintains a consistent view of every plan for all participants.

Conflicting actions are resolved so that every participant ultimately observes the same plan state.

# 11. Architecture

The Plans feature is organized into multiple layers, each with a clearly defined responsibility. This separation ensures that business logic, state management, and user interface concerns remain independent, making the feature easier to maintain and extend.

## Presentation Layer

The presentation layer is responsible for rendering the user interface and handling user interactions. It displays plan information, participant information, teams, and plan management screens. It does not contain business rules.

## Business Logic Layer

The business logic layer contains the rules that govern how plans behave. It manages participant actions, host actions, waitlists, capacity, lifecycle transitions, and other plan-related operations. This layer ensures that all plan operations follow the business rules defined by the feature.

## State Management Layer

The state management layer owns the current state of all plans within the application. It keeps plan data, participant data, and outcome data synchronized across every screen that depends on the Plans feature.

## Shared Utilities

The Plans feature includes shared utilities that provide reusable functionality across multiple parts of the feature. These utilities support the business logic and presentation layers without owning application state.

## Feature Dependencies

The Plans feature integrates with other application features where necessary.

It consumes authentication information to determine user identity and permissions.

It receives newly created plans from the Create feature.

It provides active plan data to the Home feature.

It provides completed and cancelled plans to the Memories feature.

It interacts with the Notifications feature to support plan-related notifications while remaining the owner of all plan data and business logic.

# 12. Design Principles

The Plans feature is designed to make organizing and participating in activities simple, reliable, and collaborative.

## Clarity

Users should always understand the current state of a plan, including its status, participants, and available actions. Information should be presented clearly so that users can make decisions with confidence.

## Collaboration

A plan should serve as the shared coordination space for everyone involved. Participants should always have access to the same information, enabling groups to organize activities together without confusion.

## User Control

Users should remain in control of their own participation. Administrative actions should be reserved for users with the appropriate permissions, while participants should always be able to manage their own involvement.

## Consistency

Actions should behave consistently throughout the feature. Similar interactions should produce predictable results regardless of where they occur.

## Simplicity

The feature should prioritize essential information while making advanced functionality available only when needed. Users should never feel overwhelmed by unnecessary complexity.

## Reliability

Participants should be able to trust that plan information is accurate, up to date, and synchronized for everyone involved. The Plans feature should always represent the current state of the activity.

# 13. Source Files:

## 1. Feature Screens

### `PlansScreen.tsx`

- **Path**: `apps/app/src/features/plans/screens/PlansScreen.tsx`
- **Responsibility**: Coordinates the active plan dashboard feed.
- **Purpose**: Fetches user-specific plans and splits them into "Host", "Invited", and "Past" feeds.
- **Interaction**: Consumes data from `PlansContext` and opens the detailed modal on card tap.

### `EditPlanScreen.tsx`

- **Path**: `apps/app/src/features/plans/screens/EditPlanScreen.tsx`
- **Responsibility**: Interactive card-based editor for updating meetup details.
- **Purpose**: Displays a live, full-bleed card matching the Create Plan Review screen. Allows the Host to customize title, cover images, date & time, RSVP deadline, location, cost, and guest lists inline.
- **Interaction**: Triggers Supabase storage uploads for cover images, integrates the participant management panel, and commits changes back to the database via `usePlanLifecycle`.

### `ManageParticipantsScreen.tsx`

- **Path**: `apps/app/src/features/plans/screens/ManageParticipantsScreen.tsx`
- **Responsibility**: Roster administration screen.
- **Purpose**: Displays guest list summaries, ejection history, and waitlist queues.
- **Interaction**: Connects to `usePlanParticipants` to eject participants or promote waitlisted users.

### `JoinViaInviteScreen.tsx`

- **Path**: `apps/app/src/features/plans/screens/JoinViaInviteScreen.tsx`
- **Responsibility**: Dynamic landing sheet for invited guests.
- **Purpose**: Displays the RSVP action buttons (Accept/Decline).
- **Interaction**: Invokes `joinPlan` or `skipPlan` from `usePlanParticipants`.

---

## 2. Feature Components

### `ParticipantToggleBar.tsx`

- **Path**: `apps/app/src/features/plans/components/ParticipantToggleBar.tsx`
- **Responsibility**: Shared roster display.
- **Purpose**: Renders confirmation counts and collapsible listings of attendees.
- **Interaction**: Renders on home cards and plans detail modals.

### `ParticipantBoard.tsx`

- **Path**: `apps/app/src/features/plans/components/ParticipantBoard.tsx`
- **Responsibility**: Lineup visual manager.
- **Purpose**: Manages drag-and-drop actions for team alignments (Team A, Team B, Unassigned columns).
- **Interaction**: Interacts with `usePlanTeams` to write team rosters to the database.

---

## 3. Feature Hooks

### `usePlanParticipants.ts`

- **Path**: `apps/app/src/features/plans/hooks/usePlanParticipants.ts`
- **Responsibility**: State transaction manager for participant RSVP status.
- **Purpose**: Encapsulates logic for joining, leaving, skipping, rejoining, and promoting waitlisted players.
- **Interaction**: Submits updates to the participant database table and syncs the cache.

### `usePlanLifecycle.ts`

- **Path**: `apps/app/src/features/plans/hooks/usePlanLifecycle.ts`
- **Responsibility**: Plan metadata mutation hook.
- **Purpose**: Coordinates changes to plan statuses (`LIVE`, `COMPLETED`, `CANCELLED`).
- **Interaction**: Invokes database updates for details and statuses.

---

## 4. Contexts, Services, and Utilities

### `PlansContext.tsx`

- **Path**: `apps/app/src/features/plans/state/PlansContext.tsx`
- **Responsibility**: In-memory store and Supabase subscription layer.
- **Purpose**: Keeps plan collections synchronized in real-time.

### `planInviteService.ts`

- **Path**: `apps/app/src/features/plans/services/planInviteService.ts`
- **Responsibility**: Guest invite dispatcher.
- **Purpose**: Sends notifications and links to invited guests.

### `planCoverImages.ts`

- **Path**: `apps/app/src/features/plans/config/planCoverImages.ts`
- **Responsibility**: Asset configuration mapping.
- **Purpose**: Matches cover photos to specific categories (e.g. Badminton, Cafe).