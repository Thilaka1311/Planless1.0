# Create Feature — Product & Engineering Reference

---

# 1. Product Vision

## Purpose

The Create experience is where every Planless plan begins.

Rather than asking users to fill out an empty form, Planless starts with **discovery**. The goal is to inspire users with curated activities and experiences, making it easy to decide **what to do** before deciding **who to invite**.

The Create experience should feel fast, intuitive, and inspirational, helping users move from an idea to a published plan in just a few steps.

---

## Vision

Creating a plan should never feel like creating an event.

Instead, it should feel like discovering something exciting and instantly bringing people together around it.

The Create experience exists to reduce the biggest source of planning friction:

> "What should we do?"

Once that question is answered, Planless takes care of the coordination.

---

## Design Principles

The Create experience is built around four core principles.

### 1. Discover First

Users should browse ideas before entering details.

Every experience begins with inspiration rather than an empty form.

---

### 2. Create Quickly

Most information should already be prepared.

Selecting an activity should pre-fill as much of the plan as possible, allowing users to focus only on the details that matter.

---

### 3. Repeat Easily

Many plans are created repeatedly.

Frequently created activities should be accessible through **Quick Plans**, allowing users to recreate familiar plans with minimal effort.

---

### 4. Coordinate Seamlessly

Once a plan has been created, responsibility shifts to the Plans feature.

From that point onward, Planless manages invitations, participant coordination, updates, and the plan lifecycle.

---

## Feature Entry

The Create experience begins when the user taps the **Create** tab in the bottom navigation.

Users are immediately presented with the Discovery dashboard.

---

## Feature Exit

The Create experience ends once the plan has been successfully published and written to the database.

The user is then shown the **Plan Created** confirmation experience before being redirected to their **Hosted Plans**, where ongoing management continues within the Plans feature.

---

# 2. Core Responsibilities

The Create feature is responsible for transforming an idea into a published plan through a guided discovery-first experience.

Its core responsibilities are:

- Present curated experiences that inspire users to create plans.
- Provide Quick Plans for frequently created activities.
- Allow users to create fully custom plans.
- Create and maintain a temporary plan draft throughout the creation process.
- Allow users to customize every aspect of a plan before publication.
- Provide an interactive Review experience that accurately previews the final Plan card.
- Publish completed plans to the database.
- Transfer ownership of published plans to the Plans feature.

### Responsibility Boundaries

The Create feature is responsible only for discovery, draft creation, customization, review, and publishing.

It does **not** manage:

- Live plans after publication.
- Participant management after publication.
- Plan editing.
- Host transfers.
- Plan cancellation.
- Plan completion.
- Plan chat.
- Notifications.
- Circle management.
- Payments or wallets.

### Feature Lifecycle

The Create feature begins when the user enters the Create tab.

Its responsibility ends once the plan has been successfully published and ownership has been transferred to the Plans feature.

---

# 3. Business Rules

The Create feature follows a set of business rules to ensure every plan is created consistently, regardless of whether it originates from Discovery or a Quick Plan.

---

## 3.1 Discovery Content

Discovery content is curated by Planless.

Users cannot create, edit, or publish Discovery items.

New content is added manually through the internal content management system.

This allows the platform to maintain a high-quality, relevant, and consistent discovery experience.

Discovery is intended to inspire users rather than function as an open marketplace.

---

## 3.2 Discovery Categories

Every Discovery item belongs to one of the following permanent categories:

- Sports
- Movies
- Dining
- Drinks

Each category determines:

- Default cover image
- Default category
- Activity type
- Suggested metadata
- Create flow behavior

Additional categories may be introduced in the future without affecting the overall architecture.

---

## 3.3 Discovery Items

A Discovery item is not a plan.

It is a reusable template that helps users begin creating a plan.

Selecting a Discovery item creates a new draft containing pre-filled information.

The user may modify any of this information before publishing.

Publishing a plan never changes the original Discovery item.

---

## 3.4 Quick Plans

Quick Plans are personal templates created by individual users.

They exist to speed up the creation of frequently repeated plans.

Each Quick Plan may store:

- Title
- Category
- Subcategory
- Preferred location
- Default invitees
- Circle
- Capacity
- RSVP settings
- Cost settings
- Cover image preference

Launching a Quick Plan always creates a new draft.

Quick Plans never become live plans themselves.

Editing a Quick Plan only affects future drafts created from it.

Deleting a Quick Plan never affects plans that have already been published.

---

## 3.5 Custom Plans

Custom Plans are independent of Discovery.

No information is pre-filled other than sensible application defaults.

Users manually configure every aspect of the plan before publishing.

Custom Plans support the same features as Discovery-created plans once they enter the creation flow.

---

## 3.6 Draft Creation

Regardless of how a plan is started, every plan begins as a draft.

Drafts may originate from:

- A Discovery item
- A Quick Plan
- A Custom Plan

Once the draft has been created, all three follow the exact same customization, review, and publishing flow.

There is only one publishing pipeline within the application.

---

## 3.7 Publishing

Publishing a plan performs the following actions:

- Validates the draft.
- Uploads any required assets.
- Persists the plan to the database.
- Stores the selected cover image.
- Creates the participant records.
- Creates the host relationship.
- Sets the plan status to **LIVE**.
- Displays the Plan Created confirmation experience.

Once published, ownership transfers to the Plans feature.

---

## 3.8 Cover Images

Every plan has exactly one cover image.

The cover image may originate from:

- The default Discovery image.
- The Circle profile photo.
- A custom uploaded image.

The selected cover image is stored as part of the plan record in the database.

The database is the single source of truth for the plan cover image.

Every screen displaying the plan must retrieve the cover image from the database.

---

## 3.9 Failure Handling

When publishing cannot be completed:

- The draft remains editable.
- The user remains within the Review experience.
- No partial plan is created.
- No incomplete participant relationships are created.
- Users may retry publishing without recreating the draft.

---

# 4. User Journey & Navigation Flow

Every plan in Planless follows a single creation pipeline, regardless of how it begins.

Users may start from a Discovery item, a Quick Plan, or a Custom Plan, but all paths eventually converge into the same creation and publishing experience.

---

## 4.1 Opening Create

The journey begins when the user taps the **Create** tab.

The Discovery Dashboard is displayed immediately, allowing the user to browse curated experiences or start from one of their saved Quick Plans.

From here, the user chooses how they want to begin creating a plan.

---

## 4.2 Starting a Plan

There are three ways to begin creating a plan.

### Discovery

The user selects a curated experience from one of the Discovery categories.

The application creates a new draft using the Discovery item's predefined information, such as the title, category, cover image, and suggested location where applicable.

Selecting a Discovery card immediately redirects the user to the interactive Review screen, bypassing the step-by-step wizard.

---

### Quick Plans

The user selects one of their previously saved Quick Plans.

A new draft is created using the saved template.

The original Quick Plan remains unchanged and can be reused indefinitely.

---

### Custom Plans

The user chooses to create a plan manually.

A blank draft is created using the application's default values.

No Discovery content is applied, giving the user complete flexibility to create any type of plan.

The user is guided through the step-by-step wizard: **When → Who → Who Actually → Review**.

---

## 4.3 Creation Wizard (Custom Plans)

Custom plans follow a multi-step wizard managed by `CreatePlanScreen`. The current phases are:

| Phase | Screen | Purpose |
|---|---|---|
| `category` | `Discovery.tsx` | Browse and select activity |
| `when` | `WhenIsPlanScreen.tsx` | Set date, time, plan size, RSVP deadline |
| `who` | `WhoIsComingScreen.tsx` | Select friends and circles to invite |
| `who-actually` | `WhoIsActuallyComing.tsx` | Prioritise going vs. waitlist when over capacity |
| `review` | `CreatePlanReview.tsx` | Full interactive review before publishing |
| `confirmation` | inline in `Create.tsx` | Plan created success state |

The `sports_select` and `customizer` phases exist in the phase type definition and may be used for future sport-specific sub-flows.

---

## 4.4 Navigation Guards & Deep Linking

`CreatePlanScreen` maintains two routing flags alongside `createPhase`:

- **`cameFromReview`** — When `true`, the `when` and `who-actually` screens return directly to `review` after Continue/Back, bypassing the linear wizard.
- **`returnToWhoActually`** — When `true`, the `who` (friend picker) screen routes back to `who-actually` after Continue/Back, rather than to `review`. This flag is set when the host taps **Add Friends** from the Waitlist tab on `WhoIsActuallyComing`.

These flags allow the review screen to act as the primary editing hub: tapping any section navigates to the relevant editor, which then returns directly to review without repeating the full wizard.

---

## 4.5 Interactive Review

Before publishing, the Create feature presents an interactive Review screen (`CreatePlanReview.tsx`).

The Review screen is the primary editing hub and mirrors the visual language of the live HomePlanDetails screen.

### Hero Section

- Full-width cover image with gradient overlay.
- Inline-editable plan title (tapping opens a `contentEditable` div; max 30 characters).
- Single metadata row below the title: **Calendar icon · Date · Separator · Clock icon · Time**. Tapping the row navigates back to `WhenIsPlanScreen` with `cameFromReview = true`.
- A frosted-glass **back button** (top-left).
- A **compass/overview icon button** (top-right) that toggles the `PlanDetailOverviewCard` popover.

### Participants Section

`ParticipantToggleBar` is rendered immediately below the hero. On the Review screen, it receives `onEditParticipants`, which renders an **Edit Participants** button inside the expanded participant list. Tapping it navigates to `WhoIsActuallyComing` with `cameFromReview = true`.

### Cost Section

The Cost section has two states:

- **Toggle off** — No cost input shown.
- **Editing state** — Toggle on, amount not yet confirmed. Shows a `₹` input and a circular **Lucide Check** button. The check button is disabled until a valid positive amount is entered. Confirming collapses the editor.
- **Confirmed summary state** — Displays `₹{splitCost} per person` and `Split from ₹{total} · N people`. Tapping anywhere on the summary reopens the editor with the existing amount pre-filled.

Cost per person is derived by dividing total cost by `planSize` (`totalCapacity`), not by the joined count.

### Publishing

A pinned bottom **Create Plan** button triggers `handleHostPlanSubmit`. On success, the phase transitions to `confirmation`.

---

## 4.6 Success Experience

After publishing, the user is shown the **Plan Created** confirmation screen.

This confirms that the plan has been created successfully and provides two actions:

- **Send Link** — copies the invite URL to the clipboard.
- **Go to Plans** — switches to the Plans tab with the Hosted filter active.

---

## 4.7 Ownership Transfer

Once the plan has been published, responsibility transfers from the Create feature to the Plans feature.

From this point onward, the Plans feature manages the plan's lifecycle, including participant management, invitations, editing, host transfers, cancellation, completion, and all future interactions with the plan.

---

# 5. Feature Responsibilities

## 5.1 Discovery

The Create feature is responsible for presenting curated experiences that inspire users to create plans.

The Discovery Dashboard contains the following tabs:

- **All** — default landing tab; an aggregated view of all active Sports, Movies, and Dining sections displayed together as named category groups without splitting them into subcategory sections.
- **Sports** — filters to Sports items only, organized dynamically into sport-specific sections (currently Football and Badminton) using the `subcategory` field from the database.
- **Movies** — filters to Movies items only, organized dynamically into language-based sections (currently English, Hindi, Tamil, Kannada, and Telugu) using the `subcategory` field from the database.
- **Dining** — filters to Dining items only, organized dynamically into dining type sections (currently Cafes, Family Restaurants, and Restobars) using the `subcategory` field from the database.

The **All** tab is not a separate database category. It is a client-side aggregation that renders the Sports, Movies, and Dining sections together in order. Every active Discovery item automatically appears in its own category tab and in the unified All tab. All groupings are data-driven and designed to scale as new subcategories are added in the future.

The Discovery Dashboard is the primary entry point for every new plan.

---

## 5.2 Draft Creation

The Create feature creates a new draft regardless of how the user begins.

A draft may originate from:

- **A Discovery Item**: Selecting a Discovery card creates a draft, pre-fills all available fields (event title, category, subcategory, cover image, location, suggested cost, suggested capacity, description/note), and immediately redirects the user to the interactive Review screen, bypassing the step-by-step wizard.
- **A Custom Plan**: Launching a Custom Plan resets the form and starts the traditional multi-step creation wizard.

Once created, every draft is managed via the Review screen.

---

## 5.3 Plan Customization

The Create feature allows users to configure every aspect of a plan before publishing.

This includes:

- Cover image
- Title (inline-editable directly on the Review screen hero)
- Date & Time (editable by tapping the metadata row on the Review hero)
- RSVP deadline (configured in WhenIsPlanScreen)
- Location
- Participants (editable via "Edit Participants" in the ParticipantToggleBar on Review)
- Capacity (configured in WhenIsPlanScreen)
- Cost (toggle + confirm flow on the Review screen)
- Any additional plan settings

All changes are reflected immediately within the draft.

---

## 5.4 Interactive Review

Before publishing, the Create feature presents an interactive Review screen.

For Discovery-based plans, selecting a card immediately loads the Review screen pre-filled with the event details. For custom plans, the Review screen is reached at the end of the multi-step wizard.

Users can tap individual sections of the Review card to edit them (title inline, date/time via WhenIsPlanScreen, participants via WhoIsActuallyComing, cost via the confirm/edit flow), automatically returning to the Review screen once saved.

The Review screen is the primary editing experience and final validation step before publishing.

---

## 5.5 Publishing

When the user confirms the plan, the Create feature is responsible for:

- Validating the draft.
- Uploading any required assets.
- Persisting the plan to the database.
- Saving the selected cover image.
- Creating the Host relationship.
- Creating participant relationships.
- Setting the plan status to **LIVE**.
- Displaying the Plan Created confirmation screen.

---

## 5.6 Success Experience

After a successful publish, the Create feature displays the confirmation experience.

From here, users can:

- Share the plan using **Send Link**.
- Navigate directly to their **Hosted Plans**.

---

## 5.7 Ownership Transfer

After the confirmation screen, responsibility transfers to the Plans feature.

The Create feature no longer manages the plan.

All future actions—including editing, participant management, host transfers, cancellations, completion, and the ongoing lifecycle—are handled by the Plans feature.

---

# 6. Data Model & Persistence

The Create feature is responsible for transforming a user's intent into a published plan.

During this process, several types of data are involved. Each serves a distinct purpose within the creation lifecycle.

---

## 6.1 Discovery Items

Discovery Items represent curated experiences available within the Discovery Dashboard.

They exist solely to inspire plan creation and provide sensible defaults for new plans.

A Discovery Item may include information such as:

- Title
- Category
- Subcategory
- Cover image
- Suggested location
- Suggested duration
- Suggested cost
- Additional descriptive metadata

Discovery Items are managed by Planless and cannot be modified by end users.

Selecting a Discovery Item never changes the original item. Instead, it creates a new plan draft using its predefined information.

---

## 6.2 Discovery Categories

Discovery content is organized into permanent categories.

Current categories include:

- All (client-side aggregation)
- Sports
- Movies
- Dining

Each category defines how users begin the plan creation process and determines the default information applied to newly created drafts.

---

## 6.3 Quick Plans

Quick Plans are reusable templates created by individual users.

They are designed to reduce repetitive setup for frequently created plans.

A Quick Plan may contain:

- Title
- Category
- Subcategory
- Preferred location
- Default participants
- Associated Circle
- Capacity
- RSVP settings
- Cost settings
- Preferred cover image

Quick Plans are personal to the user and can be created, edited, or deleted at any time.

Creating a plan from a Quick Plan always generates a new draft.

Quick Plans themselves never become live plans.

---

## 6.4 Plan Draft

Every plan begins as a draft.

A draft may originate from:

- A Discovery Item
- A Quick Plan
- A Custom Plan

While in draft form, users may freely modify any aspect of the plan before publishing.

A draft is temporary and exists only until it is either published or discarded.

The draft is managed by the `useCreatePlanForm` hook and shared across all screens via prop drilling from `CreatePlanScreen`.

**Draft fields include:**

| Field | Type | Notes |
|---|---|---|
| `localTitle` | string | Editable inline on Review hero |
| `localLocation` | string | Set in WhenIsPlanScreen |
| `eventDateTime` | Date | Date + time of the activity |
| `rsvpDeadline` | string \| null | Preset options or custom |
| `customDeadline` | Date | Used when rsvpDeadline = 'Custom' |
| `totalCapacity` | number \| undefined | Plan size; includes host |
| `selectedFriends` | Friend[] | Friends selected in WhoIsComing |
| `selectedCircles` | string[] | Circle IDs |
| `isHostSelected` | boolean | Whether host counts as a going slot |
| `priorityGuestIds` | string[] | Ordered going list from WhoIsActuallyComing |
| `waitlistEnabled` | boolean | Whether a waitlist is active |
| `costAmount` | number | Total cost; 0 = free |
| `quickNote` | string | Optional note/description |
| `customCoverImage` | string \| null | Custom image URL |
| `isSubmitting` | boolean | Publishing in progress guard |

---

## 6.5 Published Plan

Once the user confirms creation, the draft becomes a published plan.

Publishing persists the plan and its associated information, including:

- Host
- Participants
- Cover image
- Category
- Schedule
- RSVP deadline
- Capacity
- Cost
- Location
- Status

Published plans are managed by the Plans feature for the remainder of their lifecycle.

---

## 6.6 Cover Images

Every published plan has a single cover image.

The cover image may originate from:

- A default Discovery image
- A Circle profile image
- A custom uploaded image

The selected image is permanently associated with the plan when it is published.

The database is the single source of truth for the plan's cover image.

Every screen displaying a plan must retrieve the cover image from the published plan data.

---

## 6.7 Lifecycle

The Create feature owns the plan only until publication.

The lifecycle is:

1. Discovery or Quick Plan selection
2. Draft creation
3. Plan customization (wizard or inline on Review)
4. Interactive Review
5. Publishing
6. Plan Created confirmation
7. Ownership transferred to the Plans feature

From that point onward, all future interactions with the plan are handled by the Plans feature.

---

# 7. Feature Scope

## In Scope

The Create feature is responsible for:

- Presenting the Discovery Dashboard.
- Displaying curated Discovery content.
- Managing Quick Plans.
- Starting Custom Plans.
- Creating plan drafts.
- Allowing users to customize plan details.
- Managing the interactive Review experience.
- Uploading and selecting plan cover images.
- Publishing plans.
- Displaying the Plan Created confirmation experience.
- Persisting the completed plan to the database.

---

## Out of Scope

The Create feature is **not** responsible for:

- Managing live plans.
- Editing published plans.
- Host transfers.
- Participant management after publication.
- Plan chat.
- Notifications.
- Plan completion.
- Plan cancellation.
- Leaderboards.
- Payments.
- Circle management.

These responsibilities belong to their respective features.

---

## Dependencies

The Create feature depends on the following platform features:

- Authentication
- User Profiles
- Friends
- Circles
- Discovery Content
- Image Storage
- Database Persistence
- Plans

Each dependency provides data or services required during the creation process but remains independently owned.

---

## Success Criteria

The Create feature is considered complete when a user can:

- Discover an activity or choose a Quick Plan.
- Create or customize a draft.
- Review the plan using the interactive Review screen.
- Publish the plan successfully.
- Have the plan and its cover image fully persisted to the database.
- Immediately manage the new plan through the Plans feature.

---

# 8. State Management

The Create feature manages the state required to guide a user from discovering an activity to successfully publishing a plan.

### Discovery State

Maintains the current Discovery experience, including the active category, search state, and selected Discovery Item.

This state is:

- Created when the user enters the Create feature.
- Updated as the user browses Discovery categories or performs searches.
- Cleared when the user exits the Create feature.

---

### Draft State

Stores the temporary plan currently being created.

The draft contains all editable information, including:

- Cover image
- Title
- Category
- Subcategory
- Date & Time
- RSVP deadline
- Location
- Participants
- Circles
- Capacity
- Waitlist configuration
- Cost
- Priority guest order

This state is:

- Created whenever a Discovery Item, Quick Plan, or Custom Plan is selected.
- Updated continuously throughout the creation process.
- Cleared when the draft is published or discarded.

### Draft Status

The active draft progresses through the following states:

- Initialized
- Editing
- Reviewing
- Publishing
- Published
- Discarded

The Create feature manages transitions between these states throughout the creation lifecycle.

---

### Phase / Routing State

`CreatePlanScreen` maintains the following routing state alongside `createPhase`:

| State | Type | Purpose |
|---|---|---|
| `createPhase` | string enum | Current wizard step |
| `cameFromReview` | boolean | Return directly to review after editing a sub-step |
| `returnToWhoActually` | boolean | Return to who-actually after adding friends from that screen |

---

### Review State

Maintains the interactive Review experience.

The Review state continuously reflects the latest version of the draft and updates immediately whenever changes are made.

---

### State Synchronization

The Create feature maintains a single shared draft throughout the entire creation flow.

Every screen references the same draft state (via the `form` prop passed from `CreatePlanScreen`), ensuring all changes remain synchronized regardless of where they are made.

---

# 9. Realtime Synchronization

The Create feature keeps draft information synchronized throughout the creation process.

### Draft Updates

Changes made anywhere within the Create flow are immediately reflected throughout the draft.

This includes:

- Title updates
- Cover image updates
- Schedule changes
- RSVP updates
- Location changes
- Participant changes
- Cost updates
- Capacity updates
- Priority guest order updates

---

### Discovery Synchronization

Discovery content remains synchronized with the curated content managed by Planless.

New Discovery Items become available as they are published.

Changes to Discovery Items do not affect plans that have already been created.

---

### Cover Image Synchronization

The selected cover image remains synchronized throughout the draft.

When the plan is published, the selected image is permanently associated with the published plan and stored in the database.

The published plan becomes the single source of truth for the cover image.

---

### Publishing Synchronization

When a plan is published:

- The draft is converted into a published plan.
- The published plan is persisted to the database.
- Participant relationships are created.
- The selected cover image is persisted.
- The newly created plan becomes immediately available throughout the application.

---

# 10. Architecture

The Create feature is built around a centralized draft creation system that transforms Discovery content, Quick Plans, or manual input into published plans.

### Architectural Components

The feature consists of the following primary components:

- **Discovery Dashboard** — Presents curated Discovery content and Quick Plans.
- **Discovery Provider** — Retrieves curated Discovery Items and categories.
- **Draft Manager (`useCreatePlanForm`)** — Creates and maintains the active plan draft. All form fields and their setters live here.
- **CreatePlanScreen (`Create.tsx`)** — Owns the wizard phase machine, routing guards, and submission logic. Passes the `form` object to every child screen.
- **Review System (`CreatePlanReview.tsx`)** — Provides the interactive Review experience with inline editing.
- **Publishing System** — Validates and publishes completed plans via `createPlan` from `usePlansStore`.
- **Media Storage Layer** — Uploads and retrieves plan cover images.
- **Database Layer** — Persists published plans and related data.

---

### Component Interaction

The Create flow follows a centralized draft architecture.

1. The user enters the Discovery Dashboard.
2. The user selects a Discovery Item, Quick Plan, or Custom Plan.
3. The Draft Manager creates a new draft.
4. The user customizes the draft (wizard steps or inline on Review).
5. The Review System presents a live preview of the final plan.
6. The Publishing System validates and persists the completed plan.
7. Ownership transfers to the Plans feature for ongoing management.

---

### Integration with the Application

The Create feature serves as the entry point for every new plan.

It integrates with multiple platform features to gather user information, participants, circles, Discovery content, and media while remaining responsible only for plan creation.

Once a plan has been published, ownership transfers to the Plans feature.

---

### Architectural Principles

- **Discovery First** — Every plan begins with inspiration rather than an empty form.
- **Single Draft Pipeline** — Discovery Items, Quick Plans, and Custom Plans all converge into one creation pipeline.
- **Interactive Review as Hub** — The Review screen is both the preview and the primary editing entry point for all plan fields.
- **Deep-Link Navigation** — Routing guards (`cameFromReview`, `returnToWhoActually`) allow sub-step editors to return directly to the Review screen rather than replaying the full wizard.
- **Database as the Source of Truth** — Published plans and cover images are always retrieved from the database.
- **Separation of Responsibilities** — The Create feature owns discovery, drafting, review, and publishing, while the Plans feature owns the lifecycle of published plans.

---

### Ownership Boundary

The Create feature owns a plan only while it exists as a draft.

Once the draft has been successfully published:

- Ownership transfers to the Plans feature.
- The Create feature no longer manages the plan.
- All future lifecycle operations are handled by the Plans feature.

---

# 11. Design Principles

The Create feature is designed around the following principles.

### Discovery Before Creation

Users should discover activities before configuring plan details.

The Create experience should inspire users rather than present an empty form.

---

### Fast Plan Creation

Creating a plan should require as little effort as possible.

Discovery Items and Quick Plans should pre-fill information wherever appropriate.

---

### Reusable Planning

Frequently created activities should be reusable through Quick Plans, reducing repetitive setup.

---

### Interactive Review

Users should always preview the final plan before publishing.

The Review experience should accurately represent the final Plan card and allow editing directly from the preview.

---

### Consistent Experience

Every plan should follow the same creation pipeline regardless of how it was started.

Discovery Items, Quick Plans, and Custom Plans should provide a consistent user experience after the draft has been created.

---

### Database as the Source of Truth

Published plans, cover images, participants, and associated metadata should always be retrieved from the database.

Temporary client-side state should never become the authoritative source once a plan has been published.

---

### Minimal Friction

The Create experience should minimize the number of decisions and actions required to publish a plan while preserving flexibility for customization.

---

### Single Draft Pipeline

Every plan follows the same creation pipeline regardless of whether it begins from a Discovery Item, a Quick Plan, or a Custom Plan.

This ensures a consistent user experience and simplifies future feature development.

---

### Progressive Disclosure

The Create experience should present only the information required at each stage of creation.

Users should never feel overwhelmed by unnecessary options before they are needed.

---

# 12. Source Files

## Screens

### `screens/Create.tsx`

**Responsibility**: Phase machine coordinator.

Owns `createPhase`, `cameFromReview`, `returnToWhoActually`, and the plan submission handler `handleHostPlanSubmit`. Instantiates `useCreatePlanForm` and passes the `form` object to every child screen. Routes between all wizard phases and handles the confirmation overlay.

---

### `screens/Discovery.tsx`

**Responsibility**: Discovery Dashboard.

Renders the category tab bar and curated Discovery cards. When a card is selected it pre-fills the form and jumps directly to the `review` phase.

---

### `screens/CreatePlanReview.tsx`

**Responsibility**: Interactive review and final confirmation.

Displays the full plan preview with an immersive hero (cover image, inline-editable title, date/time metadata row), `ParticipantToggleBar` with Edit Participants support, and a two-state Cost section (editing → confirmed summary). Accepts `onBack`, `onEditDate`, `onEditParticipants`, `onSubmit`, and `isSubmitting` as props. Inline title editing uses `contentEditable` with the browser Range/Selection API.

---

### `screens/WhenIsPlan/WhenIsPlanScreen.tsx`

**Responsibility**: Schedule and plan size configuration.

Collects date, time (via the wheel picker), plan size (via `PlanSizeSlider`), and RSVP deadline (via `RSVP`). Accepts an optional `cameFromReview` prop; when true, Continue returns to the review phase instead of advancing to `who`.

**Sub-components** (`WhenIsPlan/Components/`):

| File | Purpose |
|---|---|
| `WheelPicker.tsx` | Scrollable column-based time picker |
| `WheelColumn.tsx` | Single scrolling column for WheelPicker |
| `PlanSizeSlider.tsx` | Drag slider for setting `totalCapacity` |
| `RSVP.tsx` | RSVP deadline selector (preset + custom date) |

---

### `screens/WhoIsComing/WhoIsComingScreen.tsx`

**Responsibility**: Friend and circle selection.

Allows the host to invite individual friends and circles. Sets `selectedFriends`, `selectedCircles`, and `isHostSelected` on the form. When total invitees exceed `totalCapacity`, Continue routes to `who-actually`; otherwise it goes directly to `review`.

---

### `screens/WhoIsComing/WhoIsActuallyComing.tsx`

**Responsibility**: Going / waitlist prioritisation.

Shown when the number of invited participants exceeds capacity. Displays a segmented **Going | Waitlist** control. Going list items can be dragged to reorder. Tapping any participant opens an action sheet (Move to Going / Move to Waitlist / Remove from Plan).

Accepts an optional `onAddFriends` prop. When provided, an **Add Friends** button appears at the bottom of the Waitlist tab. Tapping it sets `returnToWhoActually = true` in `CreatePlanScreen` and navigates to `WhoIsComingScreen`, which returns to `WhoIsActuallyComing` on Continue or Back.

**Sub-components** (`WhoIsComing/Components/`):

| File | Purpose |
|---|---|
| `GoingSection.tsx` | Renders the going list |
| `WaitlistSection.tsx` | Renders the waitlist with drag-and-drop support |
| `FriendsSelector.tsx` | Friend search and selection UI |
| `StackingFriends.tsx` | Stacked avatar preview for selected friends |
| `PlanDetailOverviewCard.tsx` | Compact popover showing plan name, date, time, and activity type; triggered by the compass icon button on the hero |

---

## Components

### `components/ExitEditingDialog.tsx`

A confirmation dialog shown when the user attempts to leave the creation flow with an unsaved draft.

> **Note:** `AnalogClock.tsx` and `CalendarView.tsx` previously existed in this directory but are **not imported anywhere** and are safe to delete.

---

## Hooks

### `hooks/useCreatePlanForm.ts`

**Responsibility**: Draft plan state management.

Manages every editable field of the plan draft and exposes setter functions. Also computes derived values such as `selectedFriends` (resolved from friend IDs) and `AVAILABLE_CIRCLES`. Shared across all wizard screens via the `form` prop from `CreatePlanScreen`.

---

## Services

### `services/locationService.ts`

**Responsibility**: Location search.

Provides utilities for querying and selecting plan locations.

---

## Utils

### `utils/constants.ts`

**Responsibility**: Shared configuration.

Provides reusable configuration values used throughout the Create feature, including `getCategoryImage` for resolving cover images by category.

---

### `utils/validation.ts`

**Responsibility**: Validation utilities.

Provides reusable validation logic used during plan creation.

---

## Related Shared Components

The following components from outside the Create feature are used within the Create flow:

| Component | Location | Used In |
|---|---|---|
| `ParticipantToggleBar` | `features/plans/components/` | `CreatePlanReview.tsx` |
| `UserAvatar` | `shared/components/` | Various screens |
| `NativeDateTimeField` | `shared/components/` | WhenIsPlanScreen |
| `ToastContext` | `shared/contexts/` | CreatePlanReview, Create |
| `getPlanCover` | `features/plans/config/` | CreatePlanReview |
| `formatPlanDate` | `lib/mappers` | CreatePlanReview |