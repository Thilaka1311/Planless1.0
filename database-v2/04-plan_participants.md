# Plan Participants Domain

## Purpose

The `plan_participants` table represents a user's relationship with a plan.

It tracks invitations, RSVP decisions, waitlists, removals, attendance, and team assignments.

This table is the primary source of truth for all participant-related business logic in Planless.

---

# Responsibilities

The Plan Participants domain is responsible for:

* Tracking invitations
* Tracking invitation delivery
* Tracking RSVP responses
* Managing waitlists
* Managing participant removals
* Assigning teams
* Recording attendance

The Plan Participants domain is **not** responsible for:

* Plan information
* Chat messages
* Completion results
* Memories
* Wallet transactions

---

# Table

## plan_participants

| Column          | Type        | Description                                           |
| --------------- | ----------- | ----------------------------------------------------- |
| id              | UUID        | Primary key                                           |
| plan_id         | UUID        | References `plans.id`                                 |
| user_id         | UUID        | References `users.id`                                 |
| invited_by      | UUID        | References `users.id`                                 |
| delivery_status | ENUM        | Delivered, Seen                                       |
| rsvp_status     | ENUM        | Invited, Accepted, Declined, Waitlisted, Removed      |
| joined_at       | TIMESTAMPTZ | When the participant accepted                         |
| removed_at      | TIMESTAMPTZ | When the participant was removed                      |
| removed_by      | UUID        | References `users.id`                                 |
| team_id         | UUID        | References the team assigned for this plan (nullable) |
| created_at      | TIMESTAMPTZ | Invitation timestamp                                  |
| updated_at      | TIMESTAMPTZ | Last updated timestamp                                |

---

# Delivery Status

Tracks whether an invitation has been viewed.

Possible values:

* Delivered
* Seen

---

# RSVP Status

Tracks the participant's response.

Possible values:

* Invited
* Accepted
* Declined
* Waitlisted
* Removed

---

# Participant Lifecycle

A typical participant lifecycle is:

Delivered

↓

Seen

↓

Accepted

↓

Assigned to a Team (optional)

↓

Completed

Alternative paths:

Delivered

↓

Seen

↓

Declined

or

Delivered

↓

Seen

↓

Waitlisted

↓

Accepted

or

Accepted

↓

Removed

---

# Relationships

Each participant:

* Belongs to one plan
* References one user
* May belong to one team
* May participate in one completion record through the plan

---

# Constraints

* `id` is the primary key.
* A user may only appear once per plan.
* `plan_id` references `plans.id`.
* `user_id` references `users.id`.
* `invited_by` references `users.id`.
* `removed_by` references `users.id`.
* `team_id` is nullable.

Unique constraint:

(plan_id, user_id)

---

# Waitlist

Participants on the waitlist remain part of the plan.

If a confirmed participant leaves before the RSVP deadline, the next waitlisted participant is promoted.

Promotion order is determined by waitlist order.

---

# Team Assignment

Participants may optionally be assigned to a team.

Team assignment depends on the activity subcategory.

For example:

* Football
* Cricket
* Volleyball

Activities that do not require teams simply leave `team_id` as `NULL`.

---

# Design Principles

1. Every invited user has exactly one participant record.
2. Participant history is never deleted.
3. Status changes update the existing record rather than creating new records.
4. Historical participant data remains immutable after plan completion.
5. Participant data is the single source of truth for attendance and participation.

---

# User Experience

When a host creates a plan:

1. Recipients are selected.
2. One participant record is created for each recipient.
3. Invitations are delivered.
4. Participants respond.
5. Waitlists are managed automatically if required.
6. Teams are assigned when applicable.
7. Completion uses the final participant list as its source of truth.
