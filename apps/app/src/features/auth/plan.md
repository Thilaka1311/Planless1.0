# Auth Feature

## Purpose

The Authentication feature is responsible for securely establishing and maintaining the identity of users in Planless. It acts as the gateway to the application, managing user registration, sessions, local profile caching, token propagation for API requests, backend verification, and public profile onboarding in the database.

---

## Current Functionality

* **OTP Authentication**: Sign-in is passwordless, utilizing Supabase's email OTP mechanism. Users receive a 6-digit code via email to authenticate.
* **Supabase Authentication**: Integrated directly with Supabase Auth for identity management, session tokens, and cryptographic validation.
* **Session Persistence**: Restores session details across app restarts by persisting the mapped user profile and session token to the browser's `localStorage` (via key `planless_profile_v2`).
* **Session Restoration**: On application startup, the system queries Supabase for an active session. If found, it fetches the corresponding record from the `users` table and hydrates the application state.
* **Automatic Login**: If a valid profile with a session token exists in `localStorage`, the UI skips the landing onboarding screens and enters the main application immediately.
* **Logout**: Clears active Supabase sessions using `supabase.auth.signOut()`, removes the local cache from `localStorage`, and resets the context profile state to `null`, redirecting the user to the landing screen.
* **Auth State Synchronization**: Listeners via `supabase.auth.onAuthStateChange` ensure that authentication state changes (such as token expirations, sign-outs, or signs-in) trigger a profile context hydration or reset immediately.
* **Protected Application Flow**: If `userProfile` is `null` or `profile_completed` is `false`, the app mounts the `<OnboardingFlow />` component, blocking access to all features and workspace tabs.
* **Profile Onboarding After Authentication**: Upon first-time authentication (when no corresponding row exists in the database `users` table), the application automatically executes an RPC helper to generate a formatted public ID (`UXXXXXX`), inserts a skeleton profile row, and guides the user through the `PROFILE_SETUP` onboarding step.

---

## User Flow

```
 ┌───────────────┐
 │    Landing    │
 └───────┬───────┘
         │ User taps "Get Started"
 ┌───────▼───────┐
 │  Email Input  │
 └───────┬───────┘
         │ User enters email; supabase.auth.signInWithOtp()
 ┌───────▼───────┐
 │   OTP Input   │
 └───────┬───────┘
         │ User inputs 6-digit code; supabase.auth.verifyOtp()
 ┌───────▼───────┐
 │ Check Profile │◄─────────────────────────────────────────────┐
 └───────┬───────┘                                              │
         │ Queries "users" table                                │ Session Restoration
         ├──────────────────────────┐                           │ on App Startup
  Profile│exists             Profile│does not exist             │
         ▼                          ▼                           │
 ┌───────────────┐          ┌───────────────┐                   │
 │Check Completed│          │ RPC ID Gen &  │                   │
 └───────┬───────┘          │ Insert Record │                   │
         │                  └───────┬───────┘                   │
  Yes    ├───────────┐              │                           │
  ┌──────▼──────┐    │ No           │                           │
  │ Enter App   │    └──────────────┼───────────────────────────┤
  └──────┬──────┘                   ▼                           │
         │                  ┌───────────────┐                   │
         │                  │ Profile Setup │                   │
         │                  └───────┬───────┘                   │
         │                          │ User submits details      │
         │                          │ (name, bio, avatar)       │
         │                          ▼                           │
         └─────────────────►┌───────────────┐                   │
                            │ Cache Profile │───────────────────┘
                            │ & Token Local │
                            └───────────────┘
```

---

## Architecture

* **Screens**:
  - `OnboardingFlow.tsx` ([OnboardingFlow.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/auth/screens/OnboardingFlow.tsx)): Manages the onboarding wizard state (`LANDING`, `EMAIL_INPUT`, `OTP_INPUT`, `PROFILE_SETUP`). Interacts with Supabase Auth and coordinates user sign-in/registration and profile completion.
* **Hooks**:
  - `useProfileUpload` ([OnboardingFlow.tsx#L7](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/auth/screens/OnboardingFlow.tsx#L7)): Triggered during profile onboarding to handle uploading the user's avatar image to the Supabase `profile-images` storage bucket.
* **Context Providers / App State**:
  - `App.tsx` ([App.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/App.tsx)): Acts as the primary state container for the authenticated profile (`userProfile` state). It subscribes to auth state changes, maps database users to view models, and gates the screen view hierarchy.
* **Services & Utilities**:
  - `supabaseClient.ts` ([supabaseClient.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/lib/supabaseClient.ts)): Provides the initialized Supabase client singleton using the public Vite environment variables.
  - `fetchInterceptor.ts` ([fetchInterceptor.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/lib/fetchInterceptor.ts)): Intercepts all browser fetch calls to `/api/` endpoints to retrieve the current session token from Supabase and attach it as a Bearer token in the `Authorization` header.
* **Backend Middleware**:
  - `authMiddleware` ([auth.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/backend/middleware/auth.ts)): Intercepts incoming backend route requests. Extracts the JWT from the `Authorization` header, verifies it with the Supabase client (`client.auth.getUser(token)`), and populates `req.user.id` and `req.token`.

---

## Database

* **`users` Table**: The canonical profiles table. Auth links directly using the UUID `id` from Supabase Auth (`auth.users.id`). The onboarding flow reads from and updates this table:
  - `id` (UUID, Primary Key)
  - `public_id` (Text, Unique) — generated using RPC `generate_user_public_id()`
  - `full_name` (Text)
  - `profile_url` (Text, Nullable)
  - `bio` (Text)
  - `profile_completed` (Boolean)
* **RPC `generate_user_public_id`**: A database function that draws from the `user_public_id_seq` sequence to produce format-standard sequential user IDs (`U000001`, `U000002`).

---

## State Management

* **Location**: State is defined at the root component level (`App.tsx`) as `userProfile`.
* **Propagation**: The profile state is passed down to layouts and feature providers through props and contextual stores.
* **Synchronization**: On startup and session changes, a database fetch synchronizes the memory model of the authenticated profile with the database row. Updates during profile creation write directly to the database and update the local profile cache immediately.

---

## Dependencies

* **Auth depends on**:
  - **Profile**: To upload profile images and trigger onboarding updates.
* **Features depending on Auth**:
  - **All features** (Plans, Friends, Circles, Chat, Wallet, Notifications) depend on the authenticated user profile state (`userProfile`) to authenticate queries, establish active roles, and insert new data rows matching their active user UUID.

---

## Security

* **Supabase JWT**: Cryptographically signed access token issued by Supabase Auth upon OTP verification.
* **Session Validation**: Checked on startup and verified backend-side using the `authMiddleware`.
* **Protected API Requests**: The client-side fetch interceptor attaches active session tokens automatically.
* **Row-Level Security (RLS)**: Policies defined in migrations (e.g. `016_users_rls.sql`) secure data directly in the database. When the backend executes queries under the user JWT, Postgres verifies that the actions comply with RLS constraints (e.g. `auth.uid() = id`).

---

## Current Limitations

* **OTP Delivery**: Relies on email delivery (no SMS OTP support in the current frontend UI layout).
* **Mock Properties**: The user profile model maps the hardcoded string `"SRM Chennai"` to the `college_or_work` property fallback.
* **Single Device Flow**: If a user is deleted from the remote database while their local session remains in `localStorage`, the local profile state may cause errors until the session is explicitly reset or the token expires.

---

## Technical Debt

* **No Dedicated AuthContext**: Auth state is maintained in `App.tsx` directly rather than encapsulated inside a dedicated `AuthContext` provider.
* **Profile Mapping Proliferation**: Code that transforms public.users rows into `UserProfile` exists in duplicate blocks in `App.tsx` and in onboarding completion callbacks.

---

## Future Roadmap

* **SMS OTP Integration**: Enable signing in with phone numbers and SMS validation.
* **Multi-Factor Authentication**: Add Support for MFA codes.
* **Onboarding Steps Expansion**: Let users configure initial circles or search for contacts immediately after setup.

---

## Source Files

* [OnboardingFlow.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/auth/screens/OnboardingFlow.tsx): Frontend multi-step wizard screen handling registration, OTP verification, and profile onboarding.
* [App.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/App.tsx): Root application file containing state declarations, session restoration logic, and state change listeners.
* [auth.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/backend/middleware/auth.ts): Express middleware verifying client authorization JWTs.
* [fetchInterceptor.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/lib/fetchInterceptor.ts): Client-side fetch wrapper appending authentication headers to API requests.

---

## Maintenance Notes

This document is a living specification. Whenever the authentication feature changes, `features/auth/plan.md` must be updated so it always reflects the current implementation.
