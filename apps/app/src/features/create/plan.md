- 
    
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
    
    Participants can be invited individually or through circles.
    
    The Create feature prevents duplicate invitations and ensures each participant is invited only once.
    
    ---
    
    ## Capacity Rules
    
    Every plan must define a valid participant capacity.
    
    Capacity must satisfy the minimum requirements for the activity and cannot contain invalid values.
    
    ---
    
    ## Cost Rules
    
    If costs are configured, all values must be valid before the plan can be created.
    
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
    
    **Navigation**
    
    - Continue.
    - Back.
    
    ---
    
    ## Step 4 — Configure Participants
    
    **Purpose**
    
    Choose who will be invited and configure participation.
    
    **Information Collected**
    
    - Friends.
    - Circles.
    - Capacity.
    - Waitlist settings.
    
    **User Actions**
    
    - Invite participants.
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
    - Back.
    
    ---
    
    ## Step 6 — Review
    
    **Purpose**
    
    Review the complete plan before creating it.
    
    **Information Collected**
    
    - Plan title.
    - Final confirmation.
    
    **User Actions**
    
    - Review every section.
    - Edit any previous section.
    - Create the plan.
    
    **Navigation**
    
    - Edit individual sections.
    - Back.
    - Create Plan.
    
    ---
    
    ## Step 7 — Plan Created
    
    **Purpose**
    
    Complete the creation process.
    
    **Outcome**
    
    - The new plan is created.
    - The Create feature hands ownership to the Plans feature.
    - Participants begin receiving the appropriate invitation experience throughout the application.
    
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
    
    - Cost per participant (Calculated by dividing the total plan cost by the maximum capacity limit `max_participants` rather than the joined count.)
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
> 

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

## 3.9 Failure Handling

When publishing cannot be completed:

- The draft remains editable.
- The user remains within the Review experience.
- No partial plan is created.
- No incomplete participant relationships are created.
- Users may retry publishing without recreating the draft.

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

---

## 4.3 Plan Customization

Once the draft has been created, every plan follows the same customization flow.

Users can configure:

- Cover image
- Title
- Date & Time
- RSVP deadline
- Location
- Participants
- Capacity
- Cost
- Additional plan settings

From this point onward, all plans behave identically regardless of how they were created.

---

## 4.4 Interactive Review

Before publishing, users are presented with an interactive Review screen.

The Review card is a live preview of the final Plan card and mirrors its appearance throughout the application.

Users can tap individual sections of the card to edit:

- Cover image
- Title
- Date & Time
- RSVP deadline
- Location
- Participants
- Cost

After making a change, users return directly to the Review screen, where the preview updates immediately.

---

## 4.5 Publishing

When the user confirms the plan, the application validates the draft and publishes it.

The plan is written to the database, participant relationships are created, the selected cover image is persisted, and the plan becomes **LIVE**.

---

## 4.6 Success Experience

After publishing, the user is shown the **Plan Created** confirmation screen.

This confirms that the plan has been created successfully and provides two actions:

- **Send Link**
- **Go to Plans**

Selecting **Go to Plans** opens the **Hosted** filter so the host can immediately manage the newly created plan.

---

## 4.7 Ownership Transfer

Once the plan has been published, responsibility transfers from the Create feature to the Plans feature.

From this point onward, the Plans feature manages the plan's lifecycle, including participant management, invitations, editing, host transfers, cancellation, completion, and all future interactions with the plan.

# 5. Feature Responsibilities

The Create feature is responsible for guiding users from discovering an activity to successfully publishing a plan.

Its responsibilities end once the plan has been created and ownership transfers to the Plans feature.

---

## 5.1 Discovery

The Create feature is responsible for presenting curated experiences that inspire users to create plans.

The Discovery Dashboard contains the following tabs:

- **All** — default landing tab; an aggregated view of all active Sports, Movies, and Dining sections displayed together as named category groups without splitting them into subcategory sections.
- **Sports** — filters to Sports items only, organized dynamically into sport-specific sections (currently Football and Badminton) using the `subcategory` field from the database.
- **Movies** — filters to Movies items only, organized dynamically into language-based sections (currently English, Hindi, Tamil, Kannada, and Telugu) using the `subcategory` field from the database.
- **Dining** — filters to Dining items only, organized dynamically into dining type sections (currently Cafes, Family Restaurants, and Restobars) using the `subcategory` field from the database.

The **All** tab is not a separate database category. It is a client-side aggregation that renders the Sports, Movies, and Dining sections together in order. Every active Discovery item automatically appears in its own category tab (in its corresponding subcategory section) and in the unified category section within the All tab. All groupings are data-driven, derived dynamically from the database, and designed to scale as new subcategories are added in the future.

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
- Title
- Date
- Time
- RSVP deadline
- Location
- Participants
- Capacity
- Cost
- Any additional plan settings

All changes are reflected immediately within the draft.

---

## 5.4 Interactive Review

Before publishing, the Create feature presents an interactive Review screen.

The Review card acts as a live preview of the final Plan card.

For Discovery-based plans, selecting a card immediately loads the Review screen pre-filled with the event details. For custom plans, the Review screen is reached at the end of the multi-step wizard.

Users can tap individual sections of the Review card to edit or complete them (e.g. date, time, RSVP deadline, capacity, cost, invitees) using the customizer steps, automatically returning to the Review screen once saved.

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

- All
- Sports
- Movies
- Dining

Each category defines how users begin the plan creation process and determines the default information applied to newly created drafts.

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
3. Plan customization
4. Interactive Review
5. Publishing
6. Plan Created confirmation
7. Ownership transferred to the Plans feature

From that point onward, all future interactions with the plan—including editing, participant management, host transfers, cancellation, completion, and notifications—are handled by the Plans feature.

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

# 8. State Management

The Create feature manages the state required to guide a user from discovering an activity to successfully publishing a plan.

### Discovery State

Maintains the current Discovery experience, including the active category, search state, and selected Discovery Item.

This state is:

- Created when the user enters the Create feature.
- Updated as the user browses Discovery categories or performs searches.
- Cleared when the user exits the Create feature.

---

### Quick Plans State

Maintains the user's reusable Quick Plans.

This state is:

- Loaded when the Create feature is opened.
- Updated whenever a Quick Plan is created, edited, or deleted.
- Synchronized across the user's account.

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
- Capacity
- Cost
- Additional plan settings

This state is:

- Created whenever a Discovery Item, Quick Plan, or Custom Plan is selected.
- Updated continuously throughout the creation process.
- Cleared when the draft is published or discarded.

## Draft Status

The active draft progresses through the following states:

- Initialized
- Editing
- Reviewing
- Publishing
- Published
- Discarded

The Create feature manages transitions between these states throughout the creation lifecycle.

---

### Review State

Maintains the interactive Review experience.

The Review state continuously reflects the latest version of the draft and updates immediately whenever changes are made.

---

### State Synchronization

The Create feature maintains a single shared draft throughout the entire creation flow.

Every screen references the same draft state, ensuring all changes remain synchronized regardless of where they are made.

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

---

### Discovery Synchronization

Discovery content remains synchronized with the curated content managed by Planless.

New Discovery Items become available as they are published.

Changes to Discovery Items do not affect plans that have already been created.

---

### Quick Plans Synchronization

Quick Plans remain synchronized across the user's account.

Creating, editing, or deleting a Quick Plan immediately updates the available Quick Plans throughout the Create feature.

---

### Cover Image Synchronization

The selected cover image remains synchronized throughout the draft.

When the plan is published, the selected image is permanently associated with the published plan and stored in the database.

The published plan becomes the single source of truth for the cover image.

---

### Consistency

Every screen within the Create feature displays the latest version of the active draft.

Once published, all plan data is synchronized with the Plans feature.

---

## Publishing Synchronization

When a plan is published:

- The draft is converted into a published plan.
- The published plan is persisted to the database.
- Participant relationships are created.
- The selected cover image is persisted.
- The newly created plan becomes immediately available throughout the application.

# 10. Architecture

The Create feature is built around a centralized draft creation system that transforms Discovery content, Quick Plans, or manual input into published plans.

### Architectural Components

The feature consists of the following primary components:

- **Discovery Dashboard** — Presents curated Discovery content and Quick Plans.
- **Discovery Provider** — Retrieves curated Discovery Items and categories.
- **Quick Plans Manager** — Manages reusable user-created plan templates.
- **Draft Manager** — Creates and maintains the active plan draft.
- **Review System** — Provides the interactive Review experience.
- **Publishing System** — Validates and publishes completed plans.
- **Media Storage Layer** — Uploads and retrieves plan cover images.
- **Database Layer** — Persists published plans and related data.

---

### Component Interaction

The Create flow follows a centralized draft architecture.

1. The user enters the Discovery Dashboard.
2. The user selects a Discovery Item, Quick Plan, or Custom Plan.
3. The Draft Manager creates a new draft.
4. The user customizes the draft.
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
- **Interactive Review** — Users preview the final plan before publishing.
- **Database as the Source of Truth** — Published plans and cover images are always retrieved from the database.
- **Separation of Responsibilities** — The Create feature owns discovery, drafting, review, and publishing, while the Plans feature owns the lifecycle of published plans.

## Ownership Boundary

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

### Single Draft Pipeline

Every plan follows the same creation pipeline regardless of whether it begins from a Discovery Item, a Quick Plan, or a Custom Plan.

This ensures a consistent user experience and simplifies future feature development.

---

### Progressive Disclosure

The Create experience should present only the information required at each stage of creation.

Users should never feel overwhelmed by unnecessary options before they are needed.

---

# 12. Source Files

### `CreatePlanScreen.tsx`

Coordinates the overall Create experience, including Discovery, draft creation, customization, Review, and publishing.

### `DiscoveryService`

Retrieves curated Discovery content and category information used throughout the Discovery Dashboard.

### `QuickPlansService`

Manages the creation, retrieval, updating, and deletion of user-created Quick Plans.

### `PlansContext`

Owns the active draft, publishing workflow, and interaction with the Plans feature.

### `Image Storage Service`

Handles uploading, retrieving, and persisting plan cover images.

### `Backend Create APIs`

Validate, persist, and publish plans to the database.

---

### File Relationships

The Create feature is coordinated by the draft management system.

Discovery content, Quick Plans, and Custom Plans all create a shared draft that is maintained throughout the creation experience.

Once the draft is published, the publishing system persists the plan and transfers ownership to the Plans feature.