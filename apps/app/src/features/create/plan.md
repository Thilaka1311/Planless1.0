# 3. Create

# 1. Product Vision

## Why the Create Feature Exists

The Create feature exists to transform a spontaneous idea into a structured plan that people can coordinate around. It provides a guided creation experience that collects all of the information required before a plan becomes active.

---

## Problem It Solves

Creating a group activity often requires multiple conversations to decide what to do, when to meet, where to meet, who is coming, and how the activity will be organized.

The Create feature removes this coordination overhead by guiding the creator through a structured workflow that defines every aspect of the plan before it is shared with participants.

---

## Where the Feature Begins

The Create feature begins when a user chooses to create a new plan, regardless of the entry point into the creation flow.

From that moment onward, the Create feature owns the entire plan creation experience.

---

## Where the Feature Ends

The Create feature ends when a new plan has been successfully created.

At that point, responsibility transfers to the Plans feature, which becomes responsible for managing the plan throughout its lifecycle.

---

## Primary Responsibility

The Create feature is responsible for defining a new plan before it becomes active.

This includes collecting all required information, validating user input, configuring the plan, selecting participants, and producing a complete plan ready for active coordination.

# 2. Core Responsibilities

## Exclusive Responsibilities

The Create feature is responsible for defining and creating new plans.

Its responsibilities include:

- Guiding users through the plan creation workflow.
- Collecting all information required to create a plan.
- Configuring plan settings.
- Selecting participants.
- Configuring invitations.
- Validating user input.
- Building the complete plan.
- Creating the new plan.

---

## Delegated Responsibilities

Once a plan has been successfully created, responsibility transfers to other features.

- **Plans** becomes responsible for managing the plan throughout its lifecycle.
- **Home** becomes responsible for surfacing invitations to participants.
- **Notifications** becomes responsible for delivering plan-related notifications.
- **Memories** becomes responsible for managing completed and cancelled plans.

---

## Feature Boundaries

The Create feature owns the process of creating a new plan.

Its responsibility begins when a user starts the creation flow and ends when the new plan has been successfully created.

After creation, the Create feature no longer manages the plan. All ongoing coordination, participation, editing, lifecycle management, and historical experiences are handled by their respective features.

# 3. Business Rules

The following rules define the requirements for creating a valid plan.

## Required Information

A plan cannot be created until all required information has been provided.

Required information includes:

- Activity
- Date
- Time
- Location
- Any other mandatory information required by the selected activity

---

## Activity Rules

A plan must be created for a valid activity.

Some activities may require additional configuration before the user can continue.

---

## Schedule Rules

A plan must be scheduled for a valid future date and time.

Any response deadline must occur before the planned activity begins.

---

## Participant Rules

Participants can be invited individually as friends or as members of a Circle.

The Create feature presents both Friends and Circles together within the same participant selection screen.

If a friend is already a member of a Circle that has been selected, they are excluded from the individual Friends list to prevent duplicate invitations. Each participant is invited only once.

---

## Capacity Rules

Every plan must define a valid participant capacity, represented in the UI as **Capacity (including the Host)**.

- The capacity value represents the total number of participants (including the Host).
- The default capacity is automatically set to the total number of invited participants plus the Host (e.g., 1 for Host-only, 4 for Host + 3 invited guests).
- Capacity must satisfy the minimum requirements for the activity and cannot contain invalid values.

---

## Cost Rules

If costs are configured, all values must be valid before the plan can be created.

- The per-person cost is calculated by dividing the total cost of the plan by the total participant capacity of the plan (including the Host).
- It is not divided by the number of currently invited or joined participants.

---

## Validation

The Create feature validates all required information before allowing a plan to be created.

Invalid or incomplete plans cannot be submitted.

---

## Initial Plan State

A newly created plan is initialized with its default lifecycle state and participant configuration, making it ready for active coordination by the Plans feature.

# 4. User Journey

## Starting a New Plan

The user begins the creation process by choosing to create a new plan from one of the available entry points in the application.

The Create feature takes ownership of the experience from this point onward.

---

## Defining the Plan

The user is guided through a structured creation flow where they define every aspect of the plan.

This includes selecting the activity, configuring the plan, choosing participants, and providing any additional information required before the plan can be created.

---

## Reviewing the Plan

Before creating the plan, the user is presented with a summary of everything they have configured.

They can review the information, make changes if necessary, and confirm that the plan is ready.

---

## Creating the Plan

Once the user confirms the plan, the Create feature validates the information and creates the new plan.

---

## Handoff

After the plan has been successfully created, responsibility transfers to the Plans feature.

The newly created plan becomes available for active coordination, while invited participants begin receiving the appropriate plan experiences throughout the application.

# 5. Creation Flow

## Step 1 — Select Activity

**Purpose**

Choose the type of activity being planned.

**Information Collected**

- Activity category.
- Activity subtype (when required).

**User Actions**

- Select an activity.

**Navigation**

- Continue automatically after selection.
- Return to this step at any time before creating the plan.

---

## Step 2 — Configure Location

**Purpose**

Define where the activity will take place.

**Information Collected**

- Location.

**User Actions**

- Search for a location.
- Select a location.

**Navigation**

- Continue.
- Back.

---

## Step 3 — Configure Schedule

**Purpose**

Define when the activity will take place.

**Information Collected**

- Date.
- Time.
- RSVP deadline.

**User Actions**

- Select date.
- Select time.
- Configure RSVP deadline.

**Validation Rules**

- **RSVP Deadline (Respond By)**:
  - Must not be earlier than the current date and time.
  - Must not be later than the scheduled plan date and time.
  - **Error Message**: "Respond By time cannot be earlier than the current time or later than the plan time."
  - Users are blocked from continuing to the next step until the RSVP deadline is valid.

**Navigation**

- Continue (disabled or blocked if validation fails).
- Back.

---

## Step 4 — Configure Participants

**Purpose**

Choose who will be invited and configure participation.

**Participant Sources**

Participants can be invited from two sources within a single unified selection screen:

- **Friends** — individual people from the user's friends list.
- **Circles** — persistent communities the current user belongs to. Selecting a Circle invites all members of that Circle.

**Selection Screen Layout**

The participant selection screen is organized into the following sections:

### Recents

Displayed when no search is active.

Shows recently used Friends or Circles from previous plan creation sessions. Either source may appear here.

### Unified Alphabetical List

Friends and Circles are merged into a single alphabetical list. They are not separated by type.

The merged list is sorted alphabetically by display name. Each alphabetical section may therefore contain both Friends and Circles, ordered alphabetically by name.

For example:

**A**
- Aaron (Friend)
- Adventure Club (Circle)
- Alex (Friend)

**B**
- Badminton Squad (Circle)
- Ben (Friend)

- Each item in the list displays the appropriate avatar (photo for friends, circle image or icon for circles).
- Friends display their username as a subtitle.
- Circles display their member count as a subtitle.
- Friends who are already members of a selected Circle are excluded from the list to prevent duplicate invitations.
- An A–Z scroll gutter enables fast jumping to any letter group.

**Search**

A single search input filters the merged list simultaneously across both Friends and Circles. Results from both sources appear together, still in alphabetical order.

**Participant Summary**

Both the Waitlist step and the Review step display a unified participant summary:

- **Invited**: Displays `You + X = Total` (where `X` is the number of invited participants, and `Total` is the sum including the Host). This updates dynamically as users add or remove participants.
- **Plan Spots**: Represents the total configured participant capacity limit for the plan (including the Host).

The separate "Waitlist" section on the Review card is removed in favor of this simplified summary.

**Information Collected**

- Selected friends.
- Selected circles.
- Capacity.
- Waitlist settings.

**User Actions**

- Search for friends or circles.
- Select individual friends.
- Select circles.
- Configure participant limits.

**Navigation**

- Continue.
- Back.

---


## Step 5 — Configure Cost

**Purpose**

Configure any optional costs associated with the activity.

**Information Collected**

- Total cost.

**User Actions**

- Enter cost.

**Navigation**

- Continue.

## Step 6 — Review

**Purpose**

Review the complete plan before creating it, displayed as an interactive, fully integrated preview card that acts as an exact replica of the actual live Plan card used throughout the application.

**Interactive Review Card & Visual Parity**

- **Visual Parity**: The Review card matches the live Plan card exactly in layout, typography, spacing, hero image, category/circle badge, host information, date & time presentation, cost, and location.
- **Single Source of Truth**: The cover image behaves as a persistent part of the plan. When a custom image is uploaded or selected, it is saved directly to the database and syncs globally.
- **Cover Image Interaction**: Tapping the hero image on the Review card displays a dialog allowing the Host to:
  - **Use Default Image**: Falls back to the default image for the selected activity category.
  - **Use Group Profile Photo**: Available only if the plan is associated with a Circle, using the Circle's group photo.
  - **Choose Custom Image**: Launches a local file picker to upload a new cover image directly to Supabase storage.
- **Host Profile Photo**: Syncs dynamically to the Host's profile photo in the header section, updating instantly when changed.
- **Participant Section & Collapsible Toggle**: Displays actual profile photos of the Host and invited guests (avatar stack, guest count), reusing the same collapsible toggle component and behavior as the live Plan card.
- **Participant Summary**:
  - **Invited**: Displays `You + X = Total` (where `X` is the invited guests, and `Total` is the sum including the Host).
  - **Plan Spots**: Represents the total Confirmed Capacity limit of the plan.
  - The legacy "Waitlist" summary section has been removed from the Review card.

**Interactive Editing**

- **Tap-to-Edit Sections**: The card itself is the primary editing interface. Users can tap individual parts of the card to modify them:
  - Tapping **Location** navigates the user back to the Where step.
  - Tapping **Date/Time** or **RSVP Deadline** navigates the user back to the When step.
  - Tapping the **Participant stack/count** navigates the user back to the Who step.
  - Tapping the **Cost** section navigates the user back to the Cost step.
- After editing in a previous step, the user returns directly to the Review card.

**Cancellation & Navigation**

- **Cancel Plan Dialog**: Tapping the **Cancel Plan** button in the top-right corner displays a confirmation overlay:
  - **Title**: Cancel Plan?
  - **Message**: Do you really want to cancel this plan? Any information you've entered during this creation flow will be discarded.
  - **Yes**: Discards all draft state and routes the user back to the initial Create Plan category selection ("What's the Move?").
  - **No**: Closes the dialog and keeps the user on the Review card.

---

## Step 7 — Plan Confirmation

**Purpose**

Display a dedicated full-screen confirmation to acknowledge that the plan has been created successfully before the user decides what to do next.

**Screen Layout**

- **Success Animation**: A smooth visual transition (with expanding orb rings and particles) indicating successful creation.
- **Success Message**: A clear message confirming the plan is live.
- **Action Buttons**:
  - **Send Link**: Generates and copies the unique plan invite link to the clipboard.
  - **Go to Plans**: Resets the wizard and navigates the user to the Plans tab with the **Hosted** filter automatically selected and displayed.

**Outcome**

- The new plan is created.
- The user is acknowledged and navigates to their next destination (e.g., the list of plans they are hosting).

# 6. Product Object Composition

A plan is composed of the following configurable information. All information is configured by the creator before the plan is created.

---

## Activity

Defines the type of activity being planned.

**Information**

- Category
- Subcategory (when applicable)

**Required**

Yes

---

## Identity

Defines how the plan is presented to participants.

**Information**

- Title
- Description or notes

**Required**

- Title: Required
- Description: Optional

---

## Schedule

Defines when the activity will take place.

**Information**

- Date
- Time
- RSVP deadline

**Required**

Yes

---

## Location

Defines where the activity will take place.

**Information**

- Location

**Required**

Yes

---

## Participants

Defines who will be invited to the activity.

**Information**

- Individual participants
- Circles

**Required**

Yes

---

## Capacity

Defines attendance limits for the activity.

**Information**

- Maximum participants
- Waitlist configuration

**Required**

Yes

---

## Cost

Defines any financial information associated with the activity.

**Information**

- Total cost

**Required**

Free/Cost

# 7. State Management

## Owned State

The Create feature owns all draft information while a plan is being created.

### Creation Progress

Tracks the user's current position within the creation workflow.

This state is created when the user starts creating a plan, updates as the user progresses through the wizard, and is discarded when the flow ends.

---

### Draft Plan

Stores all information entered by the user while creating the plan.

This includes:

- Activity
- Title
- Description
- Schedule
- RSVP deadline
- Location
- Participants
- Circles
- Capacity
- Waitlist configuration
- Cost
- Any other activity-specific configuration

The draft is continuously updated as the user edits the plan and is discarded when the creation flow ends.

---

### Submission State

Tracks whether the plan is currently being created.

This state exists only while the creation request is in progress and prevents duplicate submissions.

---

## Shared State Consumed

The Create feature consumes shared application data required to create a plan.

This includes:

- Authenticated user
- User profile
- Friends
- Circles

The Create feature reads this data but does not own it.

---

## Derived State

The Create feature derives additional information from the draft.

Examples include:

- Cost per participant
- Invited participant count
- Review summary
- Completion status of the creation flow

Derived state is recalculated automatically whenever the draft changes.

---

## State Reset

The Create feature clears all draft state when:

- The user cancels the creation flow.
- A plan is successfully created.
- The creation flow is restarted.

After reset, a new creation session begins with a fresh draft.

# 8. Realtime Synchronization

The Create feature is primarily a local draft experience. While creating a plan, it consumes shared application data that may update in real time.

## Shared Data Updates

The Create feature reflects updates to shared data used during plan creation.

This includes:

- Friends
- Circles
- Circle memberships

If these change while the creation flow is active, the available invitation options are updated accordingly.

---

## Network Recovery

If network connectivity is lost during plan creation, the user can continue editing the draft.

Once connectivity is restored, shared data is synchronized so the latest friends and circles are available before the plan is created.

---

## Draft Ownership

The draft exists only within the current creation session.

Drafts are not synchronized across devices and cannot be edited collaboratively by multiple users.

The Create feature always assumes a single creator for each draft.

# 9. Architecture

The Create feature is organized into multiple layers, each with a clearly defined responsibility. This separation ensures that the user interface, business rules, and draft state remain independent throughout the creation process.

## Presentation Layer

The presentation layer is responsible for guiding users through the plan creation workflow.

It presents each step of the creation process, collects user input, displays the current draft, and allows users to review and modify their plan before it is created.

---

## Business Logic Layer

The business logic layer is responsible for ensuring that a valid plan can be created.

It manages the creation workflow, validates user input, constructs the complete plan, and coordinates the creation process before handing the plan to the Plans feature.

---

## State Management Layer

The state management layer owns the draft plan throughout the creation process.

It manages the current progress of the workflow, stores the draft being created, derives review information, and clears the draft when the creation flow finishes.

---

## Shared Utilities

The Create feature uses shared utilities to support the creation experience.

These utilities provide reusable functionality such as formatting, activity configuration, and other helper logic without owning application state.

---

## Feature Dependencies

The Create feature integrates with other application features where necessary.

It consumes authentication information to identify the creator.

It consumes friends and circles to build invitation lists.

It creates new plans that are handed over to the Plans feature.

After creation, invited participants receive the appropriate experiences through the Home and Notifications features.

# 10. Design Principles

The Create feature is designed to make creating a plan simple, guided, and predictable.

## Simplicity

The creation process should minimize cognitive load by presenting only the information required at each stage.

---

## Progressive Disclosure

Information should be introduced gradually throughout the creation process. Users should never be overwhelmed by unnecessary configuration.

---

## Clarity

Users should always understand what information is required, what has already been configured, and what remains before the plan can be created.

---

## User Control

Users should be able to review and modify any part of the draft before creating the plan. Creating a plan should always be a deliberate, informed decision.

---

## Error Prevention

The Create feature should prevent invalid plans from being created by validating information before submission rather than requiring users to correct mistakes afterwards.

---

## Consistency

The creation experience should remain consistent throughout the workflow, using predictable interactions, terminology, and navigation patterns.

---

## Confidence

Before a plan is created, users should be given a complete summary of their draft so they can verify every detail with confidence.

# 11. Source Files

## Screens

### CreatePlanScreen.tsx

**Responsibility**

Coordinates the complete plan creation workflow.

**Purpose**

Acts as the primary entry point for creating a new plan, coordinating each step of the creation process and submitting the completed plan.

---

## Components

### CategorySelector.tsx

**Responsibility**

Activity category selection.

**Purpose**

Allows users to choose the type of activity they want to create.

---

### SportsSelector.tsx

**Responsibility**

Sports activity selection.

**Purpose**

Allows users to choose the specific sport for sports plans.

---

### StepWhere.tsx

**Responsibility**

Location configuration.

**Purpose**

Collects information about where the activity will take place.

---

### StepWhen.tsx

**Responsibility**

Schedule configuration.

**Purpose**

Collects the date, time, and RSVP deadline for the activity.

---

### StepWho.tsx

**Responsibility**

Participant configuration.

**Purpose**

Allows users to invite participants and configure attendance settings.

---

### StepCost.tsx

**Responsibility**

Cost configuration.

**Purpose**

Collects any optional financial information associated with the activity.

---

## Hooks

### useCreatePlanForm.ts

**Responsibility**

Draft plan management.

**Purpose**

Manages the draft plan throughout the creation process.

---

## Utilities

### constants.ts

**Responsibility**

Shared configuration.

**Purpose**

Provides reusable configuration values used throughout the Create feature.

---

### validation.ts

**Responsibility**

Validation utilities.

**Purpose**

Provides reusable validation logic used during plan creation.