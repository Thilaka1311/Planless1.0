# Plans Domain

## Purpose

The `plans` table represents an activity organized by a host.

A plan defines what is happening, where it is happening, when it is happening, the type of activity being organized, and whether participants are required to pay a participation fee.

A plan is the central entity of Planless.

It does **not** store participants, chat messages, completion data, memories, notifications, or wallet ledger entries. Those belong to their own domains.

---

# Responsibilities

The Plans domain is responsible for:

* Creating plans
* Defining the activity
* Defining the location
* Defining the schedule
* Managing the RSVP window
* Defining an optional participation fee
* Tracking the lifecycle of a plan

The Plans domain is **not** responsible for:

* Participants
* Chat messages
* Completion
* Memories
* Wallet ledger
* Notifications
* Statistics

---

# Table

## plans

| Column           | Type        | Description                                            |
| ---------------- | ----------- | ------------------------------------------------------ |
| id               | UUID        | Primary key                                            |
| public_id        | TEXT        | Human-readable ID (e.g. `P000001`)                     |
| host_id          | UUID        | References `users.id`                                  |
| category         | ENUM        | High-level activity category                           |
| subcategory      | ENUM        | Specific activity within the category                  |
| title            | TEXT        | Display title of the plan                              |
| description      | TEXT        | Optional description                                   |
| place_id         | TEXT        | Google Maps Place ID                                   |
| place_name       | TEXT        | Google Maps place name                                 |
| place_address    | TEXT        | Google Maps formatted address                          |
| scheduled_at     | TIMESTAMPTZ | Planned start time                                     |
| rsvp_deadline    | TIMESTAMPTZ | Last time participants can respond                     |
| max_participants | INTEGER     | Optional participant limit                             |
| entry_fee        | DECIMAL     | Optional participation fee charged to each participant |
| status           | ENUM        | Draft, Open, Locked, Completed, Cancelled              |
| created_at       | TIMESTAMPTZ | Record creation timestamp                              |
| updated_at       | TIMESTAMPTZ | Last update timestamp                                  |

---

# Relationships

Each plan:

* Has one host.
* Has many participants.
* Has many chat messages.
* Has one completion record.
* May create one memory.
* May generate wallet ledger entries when an entry fee is configured.

These relationships are managed by their respective domains.

---

# Lifecycle

A plan progresses through the following stages:

### Draft

The host is creating the plan.

### Open

Invitations have been sent.

Participants can RSVP.

Participants joining a paid plan automatically receive a wallet ledger entry.

### Locked

The RSVP deadline has passed.

No further participant changes are allowed.

The plan chat remains active.

### Completed

The activity has finished.

Completion data is submitted.

A memory is generated.

### Cancelled

The host cancelled the plan before completion.

No completion or memory is created.

---

# Constraints

* `id` is the primary key.
* `public_id` must be unique.
* `host_id` references `users.id`.
* `rsvp_deadline` must be earlier than or equal to `scheduled_at`.
* `max_participants`, when provided, must be greater than zero.
* `entry_fee`, when provided, must be greater than or equal to zero.

---

# Design Principles

1. A plan represents an invitation to an activity.
2. A plan is independent of circles after creation.
3. A plan does not own participant data.
4. A plan does not own chat messages.
5. A plan defines participation fees but does not manage payments.
6. A plan does not own completion data.
7. Historical plans become immutable once completed.

---

# Activity Classification

Every plan belongs to a category and a subcategory.

Examples:

* Sports → Football
* Sports → Badminton
* Movies → Cinema
* Dining → Restaurant
* Dining → Cafe

The subcategory determines:

* Completion workflow.
* Memory layout.
* Team generation.
* Activity-specific business rules.
* Future analytics.

---

# Recipient Selection

Plans are created by selecting recipients.

Recipients may be selected from:

* Individual friends.
* One or more circles.

During plan creation, every selected recipient is expanded into individual plan participants.

After the plan is created, it no longer depends on the originating circle(s).

---

# Google Maps Integration

Plan locations are selected exclusively using the Google Maps Places API.

Each plan stores:

* Google Place ID.
* Place name.
* Formatted address.

These values are stored directly in the plan to avoid unnecessary API requests when displaying plans, chats, and memories.

---

# Wallet Integration

A plan may optionally define a participation fee.

If an `entry_fee` is configured:

* Every participant who joins the plan automatically receives a wallet ledger entry.
* The participant becomes the payer.
* The host becomes the payee.
* The Wallet domain manages payment tracking and payment history.

If no `entry_fee` is configured, the plan is considered free and no wallet ledger entries are created.

### Examples

**Free Football Match**

* Entry Fee: `NULL` or `0`
* Participants can join freely.
* No wallet entries are created.

**Paid Football Match**

* Entry Fee: `₹120`
* Every participant who joins automatically owes the host `₹120`.
* A wallet ledger entry is created for every participant.

---

# User Experience

The typical user flow is:

1. Select a category.
2. Select a subcategory.
3. Enter plan details.
4. Choose a Google Maps location.
5. Optionally set a participation fee.
6. Select recipients.
7. Send invitations.
8. Participants RSVP.
9. Participants joining a paid plan automatically receive a wallet ledger entry.
10. Plan chat becomes active.
11. Complete the plan.
12. Generate a memory.

---

# Design Philosophy

The plan is the source of truth for organizing an activity.

It defines:

* What the activity is.
* Where it takes place.
* When it happens.
* Who is hosting it.
* Whether participation is free or paid.

Operational data—including participants, chat messages, wallet ledger entries, completions, and memories—is managed by its respective domain, allowing the Plans domain to remain focused solely on organizing experiences.
