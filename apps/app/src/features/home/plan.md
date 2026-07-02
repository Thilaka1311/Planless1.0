## 1. Vision & Purpose

The Home feature is the user's **invitation feed**. Its purpose is to surface active plans that require the user's attention and enable quick, low-friction RSVP decisions.

Home is designed for speed and spontaneity. Rather than managing plans the user has already joined, it focuses exclusively on plans where the user has been invited but has not yet responded.

Each card provides enough context for the user to make a decision without navigating deeper into the application, including plan details, participant activity, available capacity, and timing.

The Home experience should feel dynamic and engaging, encouraging users to quickly browse incoming invitations and decide whether to join, waitlist, or ignore them.

Once a user responds to an invitation, that plan leaves the Home feed and transitions into the **Plans** feature, where ongoing participation and plan management take place.

## 2. Core Responsibilities

The Home feature is responsible for:

- Managing and rendering the vertical card-stack feed of plans through `PlanStack` and `PlanCard`.
- Rendering and managing category-based feed filters (`FeedFilters`).
- Coordinating the Hold-to-Join interaction, including touch gestures, hold duration tracking, and progress animations.
- Displaying and managing pending memory prompt banners.
- Coordinating swipe interactions and active card navigation within the feed.
- Calculating and applying card stack transformations, including translation offsets and scaling animations.
- Managing session-scoped dismissed memory prompt state.
- Reading and displaying plan information, including titles, cover images, locations, RSVP deadlines, and participant summaries.
- Displaying participant groups through the shared `ParticipantToggleBar`.
- Refreshing the feed state when the screen mounts.
- Initiating the Hold-to-Join action when the required hold duration is completed.
- Launching plan details from the Home feed.

## 3. User Journey

### 1. Entering Home

When the user opens the Home tab, the Home feed is initialized and the latest invitation feed is loaded. If there are pending action banners, they are displayed at the top of the screen.

If no invitations are available, the user is presented with the Home empty state.

---

### 2. Browsing Invitations

The user browses invitations through the vertically swipeable card stack.

Each card presents enough context for the user to evaluate the invitation, including:

- Plan details.
- Time and location.
- RSVP deadline.
- Participant summary.

---

### 3. Exploring a Plan

From any card, the user can:

- Expand participant information.
- View participant groups.
- Open the detailed plan view.
- Continue browsing without leaving the feed.

---

### 4. Responding to an Invitation

When the user decides to attend, they perform the Hold-to-Join interaction.

The Home feature provides:

- Hold gesture tracking.
- Progress animation.
- Completion feedback.
- Waitlist feedback when applicable.

After the response is completed, the invitation is removed from the Home feed.

---

### 5. Staying Up To Date

While the user remains on the Home screen, the feed stays synchronized with the latest data.

When the application regains focus after being backgrounded or offline, the Home feature refreshes its data before continuing.

## 4. Feed Composition

The Home screen is composed of a vertically swipeable stack of invitation cards representing plans that require the user's response.

### Plan Cards

Each card presents the essential information required for the user to evaluate an invitation. The card design is identical to the Review and Edit Plan cards, maintaining visual parity across all feeds.

A plan card contains:

- **Plan Cover Image**: Retrieved directly from the `cover_image` column in the database as the single source of truth. If a custom cover image was uploaded or selected, it renders immediately. If empty, it falls back to the default image for the selected activity category.
- **Plan Title**: Presented in uppercase tracking style.
- **Date and Time**: Dynamic layout displaying relative timing or formatted calendar dates.
- **Venue or Location**: Address or name of the venue.
- **Host Information**: Synchronized avatar and name attribution for the plan host.
- **RSVP Deadline Indicator**: Alerts the user if the response window is closing.
- **Participant Summary**: Uses the unified `ParticipantToggleBar` stack displaying actual profile photos and counts.
- **Hold-to-Join Interaction**: Direct RSVP action.
- **Entry Point to Detailed Plan View**: Tap gesture anywhere on the card to open immersive details.

### Persistent Home Elements

The Home screen consists of the following primary interface elements:

- Dashboard header.
- Category filter bar.
- Card stack.
- Hold-to-Join overlays.

### Dynamic Updates

The Home feed updates as the underlying invitation data changes, ensuring that the information displayed on each card remains synchronized with the latest application state.

### Empty State

When there are no invitation cards to display, the Home screen presents an empty state informing the user that there are currently no invitations requiring their attention.

## 5. User Interactions

The Home feature supports the following user interactions.

### Browse Invitations

Users can browse invitation cards by swiping through the vertically stacked feed.

As the active card changes, the remaining cards animate into position to maintain the layered card-stack experience.

---

### Hold-to-Join

Users can join a plan directly from the Home feed using the Hold-to-Join interaction.

While the user is holding:

- A radial progress indicator is displayed.
- The interaction provides immediate visual feedback.

When the interaction completes:

- A confirmation overlay is displayed.
- If the plan is full, a waitlist confirmation is displayed instead.
- The invitation is removed from the Home feed.

---

### View Plan Details

Users can tap a plan card to open the detailed plan view for additional information.

---

### View Participants

Users can expand the participant section on a card to view the grouped participant lists displayed within the `ParticipantToggleBar`.

---

### Category Selection

Users can switch between available category tabs to browse invitations belonging to different activity categories.

---

### Pending Action Banners

Users can interact with pending action banners by:

- Opening the associated workflow.
- Dismissing the banner for the current session.

---

### Empty State Actions

When the Home feed is empty, users can use the available action to begin creating a new plan.

## 6. State Management

The Home feature manages the state required to render, navigate, and interact with the invitation feed.

### Local State

The Home feature owns local UI state for:

- Active card position within the card stack.
- Currently selected plan card.
- Pending action banner dismissal state for the current session.
- Hold-to-Join gesture progress and interaction state.

### Shared State

The Home feature consumes shared application state provided by other features, including:

- The list of discoverable invitations.
- Plan information.
- Participant information.
- Pending action data.

This shared state is used to render the Home experience but is not owned by the Home feature.

### Derived State

The Home feature derives additional UI state from the shared data, including:

- Pending action banners.
- Participant groupings displayed on plan cards.

### State Reset

The Home feature resets its local state when appropriate, including:

- Resetting the active card position when the Home screen is re-entered.
- Clearing the selected active card when the invitation feed becomes empty.
- Resetting interaction state after Hold-to-Join completes or is cancelled.

## 7. Realtime Synchronization

The Home feature keeps the invitation feed synchronized with the latest application state while the user is browsing.

### Feed Refresh

The Home feed refreshes when:

- The Home screen is opened.
- Invitation data changes.
- The user responds to an invitation.
- The application returns to the foreground.
- Network connectivity is restored.

### Live Updates

While the user is viewing the Home screen:

- Newly received invitations are added to the feed.
- Invitations that are no longer available are removed from the feed.
- Participant information is refreshed as invitation activity changes.
- Plan information is updated to reflect the latest available data.

### Browsing Continuity

The Home feature preserves the user's browsing experience during synchronization.

Realtime updates should not interrupt the user's current browsing position or reset the active card unless required by the updated data.

## 8. Architecture

The Home feature is organized around a layered architecture that separates presentation, interaction, and data consumption.

### Screen

**HomeScreen**

The primary entry point for the Home feature. It coordinates the overall screen layout, manages the invitation feed experience, and connects the various Home components into a single user interface.

### Components

The Home feature is composed of the following primary UI components:

- **PlanStack** — Presents invitation cards in a vertically swipeable card stack.
- **PlanCard** — Displays the details and interactions for an individual invitation.
- **HoldToAcceptOverlay** — Displays the Hold-to-Join interaction and feedback overlays.
- **EmptyState** — Presented when there are no invitations available.
- **FeedHeader** — Displays the Home screen header.

### Hooks

The Home feature uses dedicated hooks to organize feature-specific behavior:

- **useHomeFeed** — Coordinates the invitation feed and refresh behavior.
- **usePlanVisibility** — Prepares participant information for presentation.
- **useHoldToAccept** — Manages the Hold-to-Join interaction lifecycle.

### Dependencies

It integrates with shared plan data, participant data, navigation, and supporting feature workflows while remaining responsible only for the Home user experience.

## 9. Design Principles

The Home feature is designed around fast, focused, and low-friction decision making.

### Focused Experience

The Home screen presents one invitation at a time, allowing the user to focus on a single decision without unnecessary distractions or competing information.

### Intentional Interactions

Actions that affect participation, such as joining a plan, require deliberate user interaction. Visual feedback accompanies every interaction to clearly communicate progress and outcomes.

### Clear Information Hierarchy

Each invitation card prioritizes the information needed to make an RSVP decision quickly. Essential details are immediately visible, while supporting information is progressively disclosed through additional interactions.

### Motion with Purpose

Animations reinforce user actions and navigation. Motion is used to communicate transitions, progress, and feedback rather than for decoration.

### Responsive Feedback

Every user interaction provides immediate visual feedback, ensuring users always understand the current state of their actions.

### Graceful Empty States

When there are no invitations to display, the Home feature provides a clear and purposeful empty state that encourages the next meaningful action rather than presenting a dead end.

---

# 10. Home Feature Source Files Reference

## 1. Feature Screens

### `HomeScreen.tsx`

- **Path**: `apps/app/src/features/home/screens/HomeScreen.tsx`
- **Primary Responsibility**: Acts as the main view coordinator for the Home tab dashboard.
- **Contribution to Home**: Connects UI components (filters, card stack, banners), tracks active card index states, derives completed plan memory banners, and handles layout scroll setups.

---

## 2. Feature Components

### `PlanStack.tsx`

- **Path**: `apps/app/src/features/home/components/PlanStack.tsx`
- **Primary Responsibility**: Manages card stack arrangement and animations.
- **Contribution to Home**: Positions preview cards (`PlanCard`) in a layered vertical deck, applying scaling and translation transformations based on the active index.

### `PlanCard.tsx`

- **Path**: `apps/app/src/features/home/components/PlanCard.tsx`
- **Primary Responsibility**: Renders plan metadata and attendee details.
- **Contribution to Home**: Renders title, date/time, location, deadline badges, cover images, and embeds the participant toggle bar.

### `HoldToAcceptOverlay.tsx`

- **Path**: `apps/app/src/features/home/components/HoldToAcceptOverlay.tsx`
- **Primary Responsibility**: Coordinates hold-gesture visual feedback.
- **Contribution to Home**: Renders radial progress loading loaders, success checkmarks, and waitlist warning indicators directly on top of cards.

### `FeedFilters.tsx`

- **Path**: `apps/app/src/features/home/components/FeedFilters.tsx`
- **Primary Responsibility**: Category filter selection bar.
- **Contribution to Home**: Renders pill buttons to filter the card stack by sports, movies, or dining meetups.

### `EmptyState.tsx`

- **Path**: `apps/app/src/features/home/components/EmptyState.tsx`
- **Primary Responsibility**: Renders empty deck view.
- **Contribution to Home**: Shows a frosted panel when no invitations match active filters, providing a link to spawn a new plan.

### `FeedHeader.tsx`

- **Path**: `apps/app/src/features/home/components/FeedHeader.tsx`
- **Primary Responsibility**: Basic header layout.
- **Contribution to Home**: Standard header visual text block.

---

## 3. Feature Hooks

### `useHoldToAccept.ts`

- **Path**: `apps/app/src/features/home/hooks/useHoldToAccept.ts`
- **Primary Responsibility**: Circular hold gesture manager.
- **Contribution to Home**: Binds event listeners (touch/mouse down/up), calculates progress ticks, and fires RSVP join callbacks on completion.

### `useHomeFeed.ts`

- **Path**: `apps/app/src/features/home/hooks/useHomeFeed.ts`
- **Primary Responsibility**: Initial feed data synchronizer.
- **Contribution to Home**: Triggers plans store data fetches on mount to populate the cards feed.

### `usePlanVisibility.ts`

- **Path**: `apps/app/src/features/home/hooks/usePlanVisibility.ts`
- **Primary Responsibility**: Participant group visibility filter.
- **Contribution to Home**: Maps plan participant lists into structured arrays (`JOINED`, `WAITLISTED`, `INVITED`, `SKIPPED`) to feed the card participant bar.