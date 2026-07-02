# 8. Profile

# 1 — Product Vision

## Purpose

The Profile feature establishes a user's public identity within Planless. It allows users to represent themselves consistently across the application, making it easier for others to recognize, connect with, and participate in real-world activities together.

---

## Role in Planless

The Profile feature serves as the personal identity layer of Planless. Every user has a profile that is shared across plans, circles, chats, friendships, notifications, memories, and other social interactions.

A profile does not exist to build a social media presence. Instead, it provides the essential information needed for people to confidently organize and participate in real-world plans.

---

## User Experience Goal

The profile experience should be simple, authentic, and easy to maintain.

Users should be able to create a recognizable identity with minimal effort while giving others enough information to identify them and build trust during coordination.

The profile should support real-world interactions rather than encourage content creation or self-promotion.

---

## Design Principles

- **Identity First** — Every user should have a consistent identity throughout the application.
- **Authentic** — Profiles should represent real people participating in real-world activities.
- **Simple** — Only collect and display information that meaningfully supports coordination.
- **Consistent** — The same profile should be presented across every Planless feature.
- **Trustworthy** — Profile information should help users recognize and trust the people they are planning with.
- **Support Coordination** — Every aspect of the profile should make organizing and participating in activities easier, not distract from them.

I think one philosophy should guide the entire Profile feature:

> **Profiles exist to help people recognize who they're planning with—not to become personal social media pages.**
> 

That keeps Profile aligned with the overall philosophy of Planless: activities first, identity second, content never.

## 2 — Core Responsibilities

### Responsibilities

The Profile feature is responsible for managing a user's public identity within the Planless ecosystem.

Its core responsibilities are:

- Create and maintain each user's public profile.
- Display a consistent identity across all Planless features.
- Allow users to view and update their own profile information.
- Allow other users to view a user's public profile where appropriate.
- Provide the identity information required by plans, circles, chats, friendships, notifications, memories, and other features.
- Maintain a user's public presence throughout their lifecycle in Planless.

### Responsibility Boundaries

The Profile feature is responsible only for a user's identity and publicly visible information.

It does **not** manage:

- User authentication or session management.
- Friendships or social relationships.
- Plans, circles, chats, wallets, or notifications.
- Feature-specific permissions or business logic.
- Activity history beyond presenting information owned by other features.

### Feature Lifecycle

The Profile feature begins once a user has successfully authenticated and enters the onboarding process to establish their identity.

Its responsibility continues throughout the user's lifetime in Planless, providing a persistent identity that every other feature can reference and display.

## 3. Business Rules

The Profile feature enforces the following business rules.

### Profile Ownership

- Every Planless user has exactly one profile.
- A profile belongs to a single user and cannot be shared or transferred.
- Users may edit only their own profile.

### Profile Creation

- A profile is created as part of the onboarding process.
- A user must complete the required profile information before accessing the authenticated application.
- Once created, the profile becomes the user's permanent identity within Planless.

### Profile Visibility

- A user's profile may be viewed by other users where appropriate throughout the application.
- The same profile is presented consistently across all features.
- Public profile information should remain consistent regardless of where it is viewed.

### Profile Updates

- Users may update their profile information at any time.
- Profile updates are reflected throughout the application wherever that profile appears.
- Changes affect future interactions without altering historical records unless explicitly intended.

### Identity Consistency

- Every profile represents a single, persistent identity.
- Features reference the user's profile rather than maintaining independent identity information.
- The profile serves as the authoritative source of a user's public identity.

### Access Control

- Users may always view and manage their own profile.
- Other users may only view information that is intended to be publicly visible.
- Authentication is required before accessing profile functionality.

### Data Integrity

- Every user must have one valid profile.
- A profile cannot exist without an associated user.
- Other features must reference existing profiles when displaying user identity.

## 4 — User Journey

The Profile feature supports the following user journeys.

### Creating a Profile

1. The user completes authentication.
2. The user is guided through profile onboarding.
3. The user provides the required profile information.
4. The profile is created and becomes the user's public identity.
5. Responsibility is handed over to the rest of the application.

---

### Viewing Your Profile

1. The user opens their profile.
2. The user views their personal information and activity.
3. The user can review the information that represents them throughout Planless.

---

### Editing Your Profile

1. The user opens profile editing.
2. The user updates one or more profile details.
3. The changes are saved.
4. The updated profile is reflected throughout the application wherever it appears.

---

### Viewing Another User's Profile

1. The user navigates to another user's profile from anywhere in the application.
2. The user's public profile information is displayed.
3. The user may perform actions that relate to that person (such as managing a friendship), where permitted.
4. Responsibility for those actions is handed over to the appropriate feature.

---

### Profile Lifecycle

1. A profile is created during onboarding.
2. The profile serves as the user's persistent identity throughout Planless.
3. The user may update their profile over time.
4. Every feature references the same profile whenever that user's identity is displayed.

## 5 — Profile Object Composition

The Profile feature is composed of the following core parts.

### Profile

Represents a user's public identity within the Planless ecosystem.

A profile serves as the single source of truth for how a user is represented throughout the application.

---

### Personal Information

Represents the information that identifies a user to others.

This includes the user's public identity and any information required for other users to recognize them during real-world activities.

---

### Public Identity

Represents the persistent identity that other Planless features reference.

This identity remains consistent across plans, circles, chats, friendships, notifications, and memories.

---

### Profile Preferences

Represents user-controlled profile settings and preferences that affect how the user's profile is presented and experienced.

---

### Activity Summary

Represents a high-level overview of the user's activity within Planless.

Rather than owning activity itself, the profile aggregates information from other features to provide a unified view of the user's participation.

---

### Social Presence

Represents the user's relationships with the rest of the Planless ecosystem.

The profile acts as the central point from which users can interact with friendships, circles, plans, memories, and other shared experiences without owning those features.

---

### Feature Interaction

The Profile feature acts as the identity layer for the entire application.

1. Authentication establishes the user's identity.
2. The Profile feature creates and maintains the user's public profile.
3. Other features reference the profile whenever user identity is required.
4. Profile updates are reflected consistently across every feature that displays the user's identity.
5. The Profile remains the authoritative representation of the user throughout their lifetime in Planless.

## 6 — State Management

The Profile feature manages the state required to represent and maintain a user's public identity throughout the application.

### Profile State

Maintains the current user's profile information.

This state is:

- Created when the user completes profile onboarding.
- Updated whenever the user modifies their profile.
- Restored when the user signs in.
- Cleared when the user signs out.

---

### Profile View State

Tracks the profile currently being viewed.

This state supports viewing both the user's own profile and the profiles of other users throughout the application.

It is:

- Loaded when a profile is opened.
- Updated when navigating between profiles.
- Cleared when leaving the profile experience.

---

### Profile Synchronization

Profile state remains synchronized throughout the application.

Whenever profile information changes, every feature displaying that profile reflects the updated information, ensuring users see a consistent identity across Planless.

---

### State Sharing

The Profile feature provides a shared identity context for the rest of the application.

Other features consume profile information to:

- Display user identities.
- Associate users with plans, circles, chats, friendships, notifications, memories, and other activities.
- Present a consistent representation of each user throughout the application.

The Profile feature remains the single source of truth for user identity across Planless.

## 7 — Realtime Synchronization

The Profile feature keeps user identity synchronized across the application to ensure profile information remains accurate and consistent wherever it is displayed.

### Profile Updates

Changes made to a user's profile are propagated throughout the application as soon as they are saved.

Users should see updated profile information without needing to manually refresh the application.

---

### Identity Synchronization

The Profile feature continuously synchronizes a user's public identity across all Planless features.

Whenever profile information changes, every feature displaying that profile reflects the updated information.

---

### Shared Identity

The Profile feature provides a single, consistent identity for every user.

Plans, Circles, Friendships, Chat, Notifications, Memories, Wallet, and all other features reference this shared profile rather than maintaining separate copies of user information.

---

### State Consistency

All profile views within the application reference the same profile data.

Regardless of where a user's profile is displayed, users should experience a consistent identity and presentation.

---

### Cross-Feature Synchronization

The Profile feature serves as the authoritative source of user identity.

Whenever profile information changes, all dependent features automatically reflect the latest profile information while continuing to own their own feature-specific data.

## 8 — Architecture

The Profile feature is built around a centralized profile system that manages user identity and provides a consistent representation of every user throughout the application.

### Architectural Components

The feature consists of the following primary components:

- **Profile Service** — Creates, retrieves, updates, and manages user profiles.
- **Profile Store** — Maintains profile information and provides a shared identity state across the application.
- **Profile Presentation Layer** — Displays user profiles wherever identity is required.
- **Profile Editing Layer** — Allows users to manage and update their own profile information.
- **Profile Integration Layer** — Enables other features to consume profile information without owning it.

### Component Interaction

The profile flow follows a centralized architecture:

1. Authentication establishes the user's identity.
2. The **Profile Service** creates or retrieves the user's profile.
3. The **Profile Store** maintains the current profile state.
4. The **Profile Presentation Layer** displays profile information throughout the application.
5. The **Profile Editing Layer** updates profile information when the user makes changes.
6. The **Profile Integration Layer** provides profile data to all dependent features.

### Integration with the Application

Profile serves as the identity layer for the entire Planless ecosystem.

Every feature that displays or references a user depends on the Profile feature to provide a consistent identity. While features own their own data and business logic, they rely on Profile whenever user information is required.

### Architectural Principles

- **Centralized Identity Management** — Every user has a single profile that serves as the authoritative source of identity.
- **Shared Identity Context** — All features consume the same profile information rather than maintaining independent copies.
- **Separation of Responsibilities** — Profile owns user identity, while other features own their respective business logic and data.
- **Consistent Representation** — A user's identity is presented consistently across every feature in the application.
- **Loose Feature Coupling** — Features depend on the Profile feature for identity without becoming tightly coupled to its internal implementation.

## 9. Design Principles

The Profile feature is designed around the following principles.

### Identity Over Social Presence

Profiles exist to help people identify who they are planning with, not to build a social media presence. Every aspect of the profile should support real-world coordination rather than content creation or popularity.

### Simple by Design

A profile should contain only the information necessary to represent a user within the Planless ecosystem. Users should be able to create and maintain their profile with minimal effort.

### Consistent Identity

A user's profile should remain consistent across every feature. Regardless of where a profile appears, it should present the same identity and information.

### User Ownership

Users have full control over their own profile and can manage their public identity throughout their time on Planless.

### Trust Through Transparency

Profiles should provide enough information for users to confidently recognize and interact with one another while respecting privacy and maintaining simplicity.

### Shared Foundation

The Profile feature serves as the foundation for user identity across the application. Every feature should reference the shared profile rather than maintaining separate identity information.

### Future-Ready

The profile model should be flexible enough to support future enhancements without changing its core purpose: representing a user's identity within Planless.

## 10. Source Files

### `apps/app/src/features/profile/screens/ProfileScreen.tsx`

Owns the Profile user experience, including viewing personal profile information, managing profile settings, displaying user activity summaries, and initiating profile-related actions.

### `apps/app/src/features/profile/hooks/useProfileUpload.ts`

Manages profile image processing and uploads, ensuring profile pictures are prepared and stored before being associated with the user's profile.

### `apps/app/src/features/profile/state/ProfileContext.tsx`

Acts as the central profile state manager. It loads, maintains, synchronizes, and shares profile information throughout the application, providing a single source of truth for user identity.

---

### File Relationships

The Profile feature is coordinated by `ProfileContext.tsx`, which manages and shares profile state across the application.

`ProfileScreen.tsx` consumes this shared state to present and manage the user's profile.

When profile images are updated, `ProfileScreen.tsx` delegates image processing and upload responsibilities to `useProfileUpload.ts`, after which the updated profile information is synchronized through `ProfileContext.tsx`.