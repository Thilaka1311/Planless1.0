# Users Domain

## Purpose

The `users` table stores the public profile for every Planless user.

Authentication is handled entirely by Supabase Auth (`auth.users`). This table only stores profile information required by the application.

---

# Responsibilities

The Users domain is responsible for:

* Public profile
* User identity inside Planless
* Profile information displayed throughout the app

The Users domain is **not** responsible for:

* Authentication
* Passwords
* Email verification
* OTP
* User statistics
* Wallet
* Friendships
* Circle memberships
* Plan participation
* Preferences

---

# Table

## users

| Column      | Type        | Description                              |
| ----------- | ----------- | ---------------------------------------- |
| id          | UUID        | Primary key. References `auth.users.id`. |
| public_id   | TEXT        | Human-readable user ID (e.g. `U000001`). |
| full_name   | TEXT        | User's display name.                     |
| profile_url | TEXT        | Profile image URL. Nullable.             |
| bio         | TEXT        | Optional profile bio.                    |
| created_at  | TIMESTAMPTZ | Record creation timestamp.               |
| updated_at  | TIMESTAMPTZ | Last update timestamp.                   |

---

# Relationships

The `users` table is referenced by:

* circle_members
* friendships
* plans
* plan_participants
* notifications
* messages
* transactions
* memories
* plan_outcomes

Every user-related foreign key references `users.id`.

---

# Constraints

* `id` is the primary key.
* `id` references `auth.users(id)`.
* `public_id` must be unique.
* `full_name` is required.
* `ON DELETE CASCADE` is enabled between `auth.users` and `users`.

---

# Design Principles

1. Authentication belongs to Supabase Auth.
2. User profiles belong to the `users` table.
3. Business data must not be stored here.
4. Statistics should always be derived from related tables.
5. Every feature should reference `users.id`, never `auth.users`.

---

# Future Extensions

Potential future additions:

* Verified badge
* Profile visibility settings
* Notification preferences
* Profile theme

These should only be added when the product requires them.
