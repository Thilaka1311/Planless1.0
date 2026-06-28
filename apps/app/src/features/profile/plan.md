# Profile Feature

## Overview

The Profile feature manages a user's digital identity and preferences within Planless. It acts as the central coordinator for displaying user details (such as names, bios, and avatar pictures) across plans, circles, messages, and friend relationships, and exposes interfaces to edit these details.

---

## Current Functionality

* **Profile Creation after Authentication**: When a user registers with OTP and no corresponding row exists in the database `users` table, a minimal profile is generated with a generated unique ID (e.g. `U000001`).
* **Profile Completion Flow**: If a user logs in but has `profile_completed` marked as `false`, the application forces them into the Profile Setup screen where they must enter their full name, bio, and upload an optional profile photo.
* **Display Name & Bio**: Stores the user's chosen display name and a brief biography.
* **Profile Picture**: Supports custom profile image uploads or falls back to SVG/initials-based avatars generated from the user's name.
* **Public Profile Identifier**: Every profile contains a read-only, user-friendly sequential identifier (e.g., `U000001`) that is mapped to the internal Postgres UUID.
* **Profile Editing**: Users can update their name, bio, and profile picture from the settings pane inside `ProfileScreen.tsx`.
* **Profile Synchronization**: Changes saved by the user are written immediately to Supabase and propagate to the active React states via context hooks.
* **Session/Profile Restoration**: Startup hydration queries the Supabase database profile for the authenticated session ID, maps the properties, and loads them into memory.

---

## User Flow

```
   ┌────────────────────────────────────────────────────────┐
   │ 1. Startup: App queries Supabase for active session   │
   └──────────────────────────┬─────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Active session?   │
                    └───┬───────────┬───┘
                     No │        Yes│
      ┌─────────────────▼─┐         ▼
      │ Render Landing /  │   ┌──────────────────────────────────────────────┐
      │ OTP input screens │   │ 2. Fetch users row matching auth.uid()       │
      └───────────────────┘   └─────────────────────┬────────────────────────┘
                                                    │
                                          ┌─────────▼─────────┐
                                          │ Profile exists?   │
                                          └───┬───────────┬───┘
                                           No │        Yes│
            ┌─────────────────────────────────▼─┐         │
            │ 3. Call RPC to get sequential ID, │         │
            │    insert minimal users row       │         │
            └────────────────┬──────────────────┘         │
                             │                            │
                             ▼                            ▼
                    ┌─────────────────┐          ┌─────────────────┐
                    │  Profile setup  │          │    Has user     │
                    │   screen step   │          │  completed it?  │
                    └────────┬────────┘          └─┬─────────────┬─┘
                             │                     │No        Yes│
                             ▼                     ▼             ▼
                    ┌─────────────────┐    ┌───────────────┐ ┌───────────────┐
                    │ 4. User submits │    │ Onboarding    │ │ 7. Hydrate    │
                    │ name, bio, photo│    │ Flow complete │ │ ProfileStore  │
                    └────────┬────────┘    └───────┬───────┘ │ & localStorage│
                             │                     │         └───────────────┘
                             ▼                     ▼
                    ┌──────────────────────────────┴─┐
                    │ 5. Save users update & mark    │
                    │    profile_completed = true    │
                    └────────┬───────────────────────┘
                             │
                             ▼
                    ┌────────────────────────────────┐
                    │ 6. Hydrate app, enter main view│
                    └────────┬───────────────────────┘
                             │
      ┌──────────────────────┴──────────────────────┐
      │ 8. User edits details in Profile Settings   │
      └──────────────────────┬──────────────────────┘
                             │
                             ▼
                    ┌───────────────────────────────┐
                    │ 9. Save details, update       │
                    │    ProfileStore & localStorage│
                    └───────────────────────────────┘
```

---

## Architecture

* **Screens**:
  - `ProfileScreen.tsx` ([ProfileScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/profile/screens/ProfileScreen.tsx)): Rendered as the "Profile" tab. Houses user summaries, statistics (e.g., plans created, plans joined), list of past memories, and slide-over sheets for editing profile details, account details, sound feedback/notifications, and logging out.
* **Hooks**:
  - `useProfileUpload.ts` ([useProfileUpload.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/profile/hooks/useProfileUpload.ts)): Handles resizing raw images (cropping to a center 512x512 square canvas) and saving the compressed JPG blob to Supabase Storage.
* **Context Providers**:
  - `ProfileContext.tsx` ([ProfileContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/profile/state/ProfileContext.tsx)): Houses the central `userProfile` state. Manages the listing of application users (`dbUsers`) and friendship linkages (`dbFriendships`) synchronized during page updates.
* **Utilities & Shared Modules**:
  - `db.ts` ([db.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/lib/db.ts)): Exposes the `updateDbUser` wrapper to push edits to the database.
  - `UserAvatar.tsx` ([UserAvatar.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/shared/components/UserAvatar.tsx)): Shared UI component that displays the user's avatar image or dynamically falls back to their initials.

---

## Database

* **`users` Table**: All operations target this table directly or indirectly:
  - **Read**: Startup session restoration queries `users` by UUID (`id = auth.uid()`). Feature lists load user profile details via `/api/db/fetch-all?tables=users`.
  - **Insert**: Minimal rows are inserted with `profile_completed = false` and a sequential identifier from the generator upon first OTP verification.
  - **Update**: Updates save modifications to `full_name`, `bio`, `profile_url` (avatar path), and toggle `profile_completed` to `true`.
* **RPC `generate_user_public_id`**: Database function executed during user insertion to obtain a formatted public ID string.

---

## State Management

* **Location**: Active profile state is held inside `ProfileContext` via `useState` and cached in `localStorage` (`planless_profile_v2`).
* **Propagation**: Updates to the profile are pushed via the `updateProfile` context helper, which immediately writes to Supabase, updates local state, updates the cached entry, and cascades changes through the `dbUsers` cache.
* **Synchronization**: On authentication state changes, the root component queries the database and invokes context setters to keep variables synchronized with the active session.

---

## Dependencies

### Depends On
* **Auth**: Needs active Supabase session tokens and authentication states.
* **Supabase**: Relies on Supabase Database and Storage SDK integrations.

### Used By
* **Friendships**: To link friends by their public profiles and display user details.
* **Circles**: To identify circle creators and list circle members.
* **Create**: To identify the plan host and populate friends/circles invitation filters.
* **Plans**: To display hosts, participants, and manage waitlists.
* **Chat**: To attach names and avatars to sent messages.
* **Notifications**: To render profiles for actions like invites or comments.
* **Home**: To display personal statistics and memory feeds.

---

## Security

* **RLS Policies** (via `016_users_rls.sql` and `023_users_rls_friends_visibility.sql`):
  - **Read**: Authenticated users can query their own profiles and the profiles of accepted friends. All other read requests are blocked.
  - **Insert**: Users can only insert records where `id = auth.uid()`.
  - **Update**: Users can only update records where `id = auth.uid()`.
* **Storage Access**: Uploads are restricted to folder matching the user's auth UUID (`profile-images/<user_uuid>/`).

---

## Source Files

* [ProfileContext.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/profile/state/ProfileContext.tsx): Main provider storing context profile states, list of users, and database sync hooks.
* [useProfileUpload.ts](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/profile/hooks/useProfileUpload.ts): Resizes, square-crops, compresses, and uploads avatar images to Supabase Storage.
* [ProfileScreen.tsx](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/profile/screens/ProfileScreen.tsx): Account tab layout rendering user info, stats, and settings panels.

---

## Known Issues

* **Static College Info**: The profile view model forces a hardcoded college name (`"SRM Chennai"`) into the onboarding setup and profile display outputs.
* **Storage Leaks**: Replacing an avatar uploads a new file to Storage under a different timestamp but does not delete the old file, leaving orphaned images.

---

## Technical Debt

* **Duplicated Mapping Logic**: Transformations from raw DB user objects to `UserProfile` models are duplicated across `App.tsx` and onboarding callback handlers.
* **Context State Proliferation**: ProfileContext maintains state variables like `dbFriendships` which conceptually belong to a separate Friendship domain context.

---

## Future Roadmap

* **College/Work Input**: Allow users to type and edit their actual college or place of employment instead of relying on fallbacks.
* **Avatar Auto-cleanup**: Implement deletion triggers to remove old avatar files from Supabase storage when a user uploads a replacement.

---

## Maintenance Notes

This document is a living specification. Whenever the Profile feature changes, `features/profile/plan.md` must be updated so it always reflects the current implementation.
