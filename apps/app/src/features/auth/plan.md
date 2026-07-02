# Authentication

# 1. Product Vision

### Purpose

Authentication establishes a trusted identity for every person using Planless. It ensures that every action within the app is performed by a verified user, allowing plans, circles, chats, wallets, and memories to be securely associated with the correct individual.

---

### Role in Planless

Authentication is the entry point into the Planless ecosystem. It provides the identity foundation that every other feature depends on, enabling users to create plans, join communities, communicate with others, and maintain a persistent personal profile across devices and sessions.

---

### User Experience Goal

The authentication experience should be fast, simple, and unobtrusive. Users should be able to verify their identity with minimal friction, remain signed in across app launches, and transition naturally into setting up their profile before accessing the rest of the application.

---

### Design Principles

- **Trust First** — Only verified users can access the Planless ecosystem.
- **Minimal Friction** — Identity verification should require as little effort as possible.
- **Persistent Identity** — Users should not need to repeatedly authenticate during normal use.
- **Secure by Default** — Authentication protects user identity and all associated data throughout the application.
- **Complete Before Entry** — Access to the application is granted only after both authentication and required onboarding are complete.

## 2. Core Responsibilities

The Authentication feature is responsible for establishing and maintaining a trusted user identity throughout the Planless experience.

Its core responsibilities are:

- Verify the identity of every user before they can access the application.
- Establish, maintain, restore, and terminate authenticated user sessions.
- Control access to the Planless application by preventing unauthenticated users from accessing protected features.
- Guide newly authenticated users through the required onboarding flow before granting full access to the application.
- Provide a verified identity context that other features can rely on throughout the user's session.

### Responsibility Boundaries

Authentication is responsible only for identity verification, session lifecycle, access control, and onboarding entry.

It does **not** manage:

- User profile information after onboarding.
- Friendships, circles, plans, chats, wallets, or other product features.
- Feature-specific permissions, data management, or business logic beyond authentication and access control.

### Feature Lifecycle

The Authentication feature begins when a user needs to establish or restore their identity.

Its responsibility ends once the user has successfully authenticated, completed any required onboarding, and entered the authenticated application, at which point ownership is handed over to the relevant product features. Authentication resumes responsibility only when the user's session changes, expires, or is terminated.

## 3. Business Rules

The Authentication feature enforces the following business rules:

### Authentication

- Only authenticated users may access the Planless application.
- Users must successfully verify their identity before an authenticated session is established.
- An authenticated session is required to access any protected feature.

### Onboarding

- Authentication alone does not grant access to the application.
- Every new user must complete the required onboarding process before entering the authenticated experience.
- Users who have not completed onboarding are restricted until all required information has been provided.

### Session Management

- Authenticated sessions are maintained across app launches whenever the session remains valid.
- If a session is no longer valid, the user must authenticate again before accessing the application.
- Logging out immediately ends the authenticated session and removes access to all protected features.

### Access Control

A user is granted access only when:

- Their identity has been successfully authenticated.
- Any required onboarding has been completed.

Access is denied when:

- No authenticated session exists.
- The current session is no longer valid.
- Required onboarding has not been completed.

### Failure Handling

When authentication requirements are not satisfied:

- Authentication failures prevent a session from being established.
- Incomplete onboarding redirects the user to complete the required onboarding flow before continuing.
- Invalid or expired sessions require the user to authenticate again before accessing the application.

## 4. User Journey

The Authentication feature supports three primary user journeys.

### New User

1. The user begins the authentication process by verifying their identity.
2. Once authenticated, the user is guided through the required onboarding flow.
3. The user completes the required profile information.
4. After onboarding is complete, the user is granted access to the authenticated application.
5. Responsibility is handed over to the application's core features.

---

### Returning User

1. The user authenticates with their existing account or returns with an active session.
2. If the user's session is still valid, authentication is restored automatically.
3. If onboarding has already been completed, the user bypasses onboarding.
4. The user is taken directly into the authenticated application.
5. Responsibility is handed over to the application's core features.

---

### Logout

1. The user chooses to end their session.
2. The authenticated session is terminated.
3. Access to protected features is removed.
4. The user is returned to the unauthenticated experience.
5. Authentication resumes ownership until the user successfully authenticates again.

## 5. Authentication System Composition

The Authentication feature is composed of four core parts that work together to establish and maintain a trusted user identity.

### Access Control

Controls entry into the authenticated experience by determining whether a user is permitted to access the application. It ensures that only eligible users can proceed beyond the authentication flow.

### Identity Verification

Verifies a user's identity before an authenticated session is established. It is responsible for confirming that the user is who they claim to be.

### User Onboarding

Guides newly authenticated users through the required onboarding process before they can access the application. It ensures all required information is collected to establish the user's account.

### Session Management

Maintains the authenticated state throughout the user's experience. It restores existing sessions when possible, manages the session lifecycle, and terminates access when a session ends.

### Feature Interaction

These components work together as a single authentication experience:

1. **Session Management** determines whether an authenticated session already exists.
2. If authentication is required, **Access Control** directs the user into the authentication flow.
3. **Identity Verification** establishes the user's identity.
4. **User Onboarding** completes any required first-time setup.
5. Once all authentication requirements have been satisfied, control is handed over to the authenticated application.

## 6. State Management

The Authentication feature manages the state required to establish, maintain, and terminate a user's authenticated session.

### Authenticated User State

Stores the identity of the currently authenticated user and determines whether the user has access to the authenticated application.

This state is:

- Created when a user successfully authenticates.
- Restored when a valid session already exists.
- Updated when onboarding is completed or authentication status changes.
- Cleared when the user logs out or the session becomes invalid.

### Authentication Flow State

Tracks the user's progress through the authentication process, including authentication, onboarding, and session restoration.

This state is:

- Created when the authentication flow begins.
- Updated as the user progresses through each stage.
- Cleared once the user enters the authenticated application or exits the authentication flow.

### State Synchronization

Authentication state remains synchronized throughout the application to ensure every feature has a consistent view of the current user's identity and access status.

When the authentication state changes, the application immediately updates access to protected features and transitions the user to the appropriate experience.

### State Sharing

Authentication provides a shared identity context for the rest of the application.

Other features consume this context to:

- Identify the current user.
- Determine whether the user has access to protected functionality.
- Associate user actions with the authenticated account.

## 7. Realtime Synchronization

The Authentication feature keeps the user's authentication state synchronized across the application to ensure access is always based on the current session status.

### Authentication State Changes

Authentication continuously responds to changes in the user's session, including:

- Successful authentication.
- Session restoration.
- Session expiration or invalidation.
- User logout.
- Completion of required onboarding.

### State Propagation

Authentication state changes are immediately propagated throughout the application.

Whenever the authentication state changes, all protected features receive the updated authentication status and adjust access accordingly.

### Session Handling

When a valid session exists, the user remains in the authenticated experience.

When a session is no longer valid, access to protected features is immediately revoked and the user is returned to the authentication flow.

### Consistency

Authentication provides a single, consistent identity state for the entire application.

All features rely on this shared authentication state to determine the current user's identity and whether access to protected functionality should be granted.

## 8. Architecture

The Authentication feature is built around a centralized authentication system that manages user identity, session lifecycle, and application access.

### Architectural Components

The feature consists of the following primary components:

- **Application Coordinator** — Initializes authentication, restores existing sessions, and controls access to the authenticated application.
- **Authentication Flow** — Manages identity verification and first-time user onboarding.
- **Authentication Provider** — Handles user authentication, session creation, and session validation.
- **API Authentication Layer** — Ensures authenticated requests include the user's identity when communicating with backend services.
- **Server Authorization Layer** — Validates authenticated requests before allowing access to protected resources.

### Component Interaction

The authentication flow follows a centralized architecture:

1. The **Application Coordinator** determines whether an authenticated session already exists.
2. If authentication is required, control is transferred to the **Authentication Flow**.
3. The **Authentication Flow** communicates with the **Authentication Provider** to establish or restore the user's identity.
4. Once authentication requirements have been satisfied, control returns to the **Application Coordinator**, which grants access to the authenticated application.
5. All authenticated requests pass through the **API Authentication Layer**, where the user's identity is attached before being sent to the backend.
6. The **Server Authorization Layer** validates each authenticated request before allowing access to protected resources.

### Integration with the Application

Authentication serves as the entry point for the entire application.

It provides a centralized identity context that is shared across all protected features. Every authenticated feature depends on this shared context to identify the current user and determine whether access should be granted.

### Architectural Principles

- **Centralized Authentication** — Authentication is managed from a single, shared source of truth.
- **Session-Based Access Control** — Application access is determined by the current authentication session.
- **Protected Feature Boundary** — All protected features depend on successful authentication before becoming accessible.
- **Separation of Responsibilities** — Authentication is responsible only for identity, session management, and access control, while individual features manage their own business logic.
- 

## 9. Design Principles

The Authentication feature is designed around the following principles.

### Simple Authentication

Authentication should require as little effort as possible while maintaining a secure user experience. Users should be able to establish their identity quickly and access the application without unnecessary friction.

### Persistent Experience

Users should remain authenticated across normal app usage whenever possible, allowing them to return to the application without repeatedly completing the authentication process.

### Secure by Default

Authentication serves as the security boundary for the application. Only verified users with valid sessions are permitted to access protected features and data.

### Complete Before Entry

Users must complete all required onboarding before entering the authenticated application. This ensures every authenticated user has the minimum information required to participate in the Planless ecosystem.

### Consistent Identity

Every authenticated user should have a persistent identity that can be used consistently across all Planless features.

### Centralized Access Control

Authentication acts as the single authority for determining whether a user can access the authenticated application. All protected features rely on this shared authentication state rather than implementing their own authentication logic.

## 10. Source Files

### `apps/app/src/features/auth/screens/OnboardingFlow.tsx`

Owns the authentication flow, including user authentication, identity verification, and first-time onboarding. It coordinates the user's journey from entering the application until authentication requirements have been satisfied.

### `apps/app/src/App.tsx`

Acts as the root authentication coordinator. It restores existing sessions, manages the application's authenticated state, and determines whether to display the authentication flow or the authenticated application.

### `apps/app/src/lib/fetchInterceptor.ts`

Ensures authenticated API requests include the current user's authentication credentials before being sent to backend services.

### `apps/app/backend/middleware/auth.ts`

Validates incoming authenticated requests on the server before allowing access to protected backend resources.

---

### File Relationships

The Authentication feature is coordinated by `App.tsx`, which determines whether authentication is required.

When authentication is needed, control is transferred to `OnboardingFlow.tsx`, which manages identity verification and onboarding.

Once authenticated, `fetchInterceptor.ts` authenticates outgoing API requests, while `auth.ts` validates those requests on the backend before protected operations are performed.