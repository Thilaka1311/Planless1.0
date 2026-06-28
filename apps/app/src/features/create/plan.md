# Create Plan Feature

## Overview

The Create Plan feature handles the initial configuration and instantiation of plans. It guides the user through selecting an activity category, specifying a subcategory, defining event metadata (title, location, date, time), inviting people (friends and entire circles), and configuring rules (RSVP deadlines, maximum participant capacity, entry fees, and waitlist limits).

Once configuration is complete, the feature submits the payload to the database and hands the plan over to the Plans feature for ongoing state tracking, RSVP handling, and lifecycle management.

---

## Current Functionality

* **Category Selection**: Users choose from top-level categories: `sports`, `movies`, `dining`, or `custom`.
* **Subcategory Selection**: If `sports` is selected, the flow dynamically narrows down options to specific subcategories (e.g. `football` or `badminton`).
* **Multi-Step Customizer Flow**:
  - **What**: Input a descriptive plan title.
  - **Where**: Set location details.
  - **When**: Pick the date and time.
  - **Who**: Search and select invitees (friends and/or circles).
  - **Cost**: Set an optional budget amount to split among participants.
  - **Settings**: Toggle waitlists and configure RSVP cutoffs.
* **Intelligent Capacity & RSVP Deadlines**:
  - Automatically calculates spots based on selected friends and circle counts.
  - Sets up response cutoff offsets (e.g., 1 hour, 3 hours, or custom date/time before the event).
* **Review Screen**: Displays a summary card detailing location, time, slots, cost split, and invitees prior to submission.
* **Plan Persistence & Dispatch**: Sends backend inserts for the plan, initial participant rows (assigning the creator as `HOST` and invitees as `PARTICIPANT`), and inserts notification triggers.

---

## User Flow

```
   ┌────────────────────────────────────────────────────────┐
   │ 1. Start: User selects high-level Category            │
   └──────────────────────────┬─────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Sports Category?  │
                    └───┬───────────┬───┘
                     Yes│           │No
                        ▼           ▼
        ┌───────────────────┐   ┌───────────────────────────┐
        │ 2. Select sub-    │   │ Bypass sub-select         │
        │    category       │   └───────────┬───────────────┘
        └─────────┬─────────┘               │
                  └─────────────┬───────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────┐
        │ 3. Multi-Step Form Customizer Flow                │
        │    Step 0: Title                                  │
        │    Step 1: Time & Date                            │
        │    Step 2: Location / Place search                │
        │    Step 3: Who (Invite Friends & Circles)         │
        │    Step 4: Cost Splitting & Budget                │
        │    Step 5: Cutoffs & Waitlist Settings            │
        └───────────────────────┬───────────────────────────┘
                                │ Customizer completed
                                ▼
        ┌───────────────────────────────────────────────────┐
        │ 4. Review Step: Final verification preview card   │
        └───────────────────────┬───────────────────────────┘
                                │ Submit
                                ▼
        ┌───────────────────────────────────────────────────┐
        │ 5. Database Transaction Flow                      │
        │    - Insert plan row                              │
        │    - Insert host participant row (JOINED)         │
        │    - Insert invitee participant rows (INVITED)    │
        │    - Insert notifications for all invitees        │
        └───────────────────────┬───────────────────────────┘
                                │ Success
                                ▼
        ┌───────────────────────────────────────────────────┐
        │ 6. Complete: Redirect to Plans tab / Active Feed  │
        └───────────────────────────────────────────────────┘
```

---

## Architecture

* **Screens**:
  - `CreatePlanScreen.tsx` ([CreatePlanScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/create/screens/CreatePlanScreen.tsx)): Main controller screen. Manages step state progression (`createPhase` and `customizerStep`), renders custom height transition card animations, and coordinates form submissions.
* **Hooks**:
  - `useCreatePlanForm.ts` ([useCreatePlanForm.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/create/hooks/useCreatePlanForm.ts)): Manages the multi-step form fields state. Resolves friend lists (`AVAILABLE_FRIENDS`), circle counts (`AVAILABLE_CIRCLES`), filters invitees to prevent duplicates, and computes dynamic cost-per-person limits.
* **Step Components**:
  - `CategorySelector.tsx`: Renders icons for core category selections.
  - `SportsSelector.tsx`: Subcategory selector for sport items.
  - `StepWhere.tsx`: Visual wrapper to configure locations.
  - `StepWhen.tsx`: Standard calendar picker.
  - `StepWho.tsx`: Multi-selector listing searchable friends and circles.
  - `StepCost.tsx`: Slide and input field for budgeting and cost splitting.

---

## Database

* **`plans` Table**: Inserts the core plan parameters (`title`, `category`, `subcategory`, `scheduled_at`, `place_name`, `place_address`, `rsvp_deadline`, `entry_fee`, `host_id`).
* **`plan_participants` Table**: Inserts multiple rows:
  - 1 Host Row: `role = 'HOST'`, `rsvp_status = 'JOINED'`, `responded_at = now()`.
  - N Invitee Rows: `role = 'PARTICIPANT'`, `rsvp_status = 'INVITED'`, `responded_at = null`.
* **`notifications` Table**: Inserts rows targeting invited UUIDs (`type = 'PLAN_INVITATION'`, `related_plan_id`).
* **`friendships` & `circles` Tables**: Read-only source operations queried to populate invitation lookup selectors.

---

## State Management

* **Form State**: Form parameters are held locally within the custom form hook (`useCreatePlanForm`).
* **Navigation & Animation**: Screens manage transitions locally via custom hooks, routing users back to editing forms if validation fails during review.
* **Context Intermediaries**: On submission, the form payload is formatted and sent to `PlansContext.createPlan` to perform the actual write requests.

---

## Validation

* **Title**: Checked to verify it is not empty.
* **Event Time**: verified that scheduled time does not reside in the past.
* **RSVP Cutoff**: Verified that the response deadline occurs prior to the scheduled event time.
* **Cost Split**: Prevents submitting negative values.

---

## Dependencies

### Depends On
* **Auth**: Requests session credentials to identify the active host.
* **Profile**: Reads display profiles to build invite details.
* **Friendships**: Filters accepted friends for invite lookup menus.
* **Circles**: Expands circle selections into target recipient lists.
* **Supabase**: Requires DB access for inserts and transactions.

### Used By
* **Plans**: Receives the newly generated plan record to track RSVPs and drive life cycles.
* **Home**: Shows the new card on the home feed.
* **Notifications**: Alerts invited users.

---

## Source Files

* [useCreatePlanForm.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/create/hooks/useCreatePlanForm.ts): Coordinates multi-step input parameters, filters out duplicate invitees, and computes cost splits.
* [CreatePlanScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/create/screens/CreatePlanScreen.tsx): Controls view layouts, custom animations, and manages submission execution steps.
* [StepWho.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/create/components/StepWho.tsx): Sub-component presenting searchable lists of friends and circles to invite.

---

## Known Issues

* **Static Category Fallback**: When submitting a Dining plan, the category field is converted from `'dining'` to `'restaurants'` to match specific table mappings, adding translation layers.
* **Deadline Edge Cases**: Choosing a custom deadline that occurs after the event is validated on submission but not in real-time during step entry, leading to late warnings.

---

## Technical Debt

* **Component Duplication**: Component folders contain legacy `active/` and `experimental/` folders containing duplicate versions of form step screens which could cause layout confusion.
* **Submission Separation**: Validation rules are split across both the UI screen controller (`CreatePlanScreen.tsx`) and the state provider (`PlansContext.tsx`), rather than normalized in a single validation schema.

---

## Future Roadmap

* **Creation Drafts**: Automatically save incomplete creation progress locally so users don't lose form inputs if they close the wizard.
* **Template Plans**: Save plan templates (e.g. "Weekly Football") to prefill location, category, and invite lists automatically.

---

## Maintenance Notes

This document is a living specification. Whenever the Create Plan feature changes, `features/create/plan.md` must be updated so it always reflects the current implementation.
