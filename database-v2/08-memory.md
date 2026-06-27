# Memory Domain

## Purpose

The Memory domain represents the permanent record of a completed plan.

A memory is created once a plan has been successfully completed.

It serves as the historical experience that users revisit from their profiles, circles, and activity history.

Memories do not duplicate completion data. They reference the completion and provide a consistent way to present completed activities.

---

# Responsibilities

The Memory domain is responsible for:

* Publishing completed plans
* Preserving activity history
* Displaying activity highlights
* Powering profile memories
* Powering circle memories
* Supporting future achievements and leaderboards

The Memory domain is **not** responsible for:

* Plans
* Chat
* Completion logic
* Wallet
* Notifications

---

# Design Principles

1. Every completed plan generates exactly one memory.
2. A memory is permanent and immutable.
3. Completion data remains the source of truth.
4. Memories never duplicate activity-specific results.
5. Memories provide a unified experience across all activity types.

---

# Table

## memories

| Column           | Type        | Description                                                |
| ---------------- | ----------- | ---------------------------------------------------------- |
| id               | UUID        | Primary key                                                |
| public_id        | TEXT        | Human-readable ID (e.g. `M000001`)                         |
| plan_id          | UUID        | References `plans.id`                                      |
| completion_id    | UUID        | References `plan_completions.id`                           |
| featured_user_id | UUID        | Highlighted participant (MVP, winner, top performer, etc.) |
| created_at       | TIMESTAMPTZ | Memory creation timestamp                                  |

---

# Relationships

Each memory:

* References one plan.
* References one completion.
* May highlight one participant.
* Is visible to all participants of the completed plan.

---

# Featured Participant

The `featured_user_id` represents the primary highlight of the activity.

Examples:

Football

* MVP

Badminton

* MVP

Bowling (Future)

* Highest Score

Running (Future)

* Fastest Time

Chess (Future)

* Winner

Activities that do not have a highlighted participant simply leave this field as `NULL`.

---

# Constraints

* Every completed plan has exactly one memory.
* Every memory references exactly one completion.
* Every memory references exactly one plan.
* `featured_user_id` is optional.

---

# Memory Generation

A memory is created immediately after a successful completion.

Flow:

Plan

↓

Completion

↓

Memory

The completion remains the source of truth.

The memory references the completion for activity-specific information.

---

# User Experience

Memories appear in:

* User profiles
* Circle history
* Activity history
* Future achievements
* Future leaderboards

Opening a memory displays:

* Plan information
* Participants
* Activity-specific completion results
* Featured participant (when applicable)

All activity-specific information is retrieved from the Completion domain.

---

# Design Philosophy

A memory is not another copy of a completed plan.

It is the published, permanent record of a shared experience.

Completion stores **what happened**.

Memory stores **what users remember**.

This separation keeps the database normalized while making memories easy to browse, search, and extend as Planless grows.
