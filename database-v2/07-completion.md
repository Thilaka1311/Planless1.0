# Completion Domain

## Purpose

The Completion domain records the final outcome of a plan.

A completion represents what actually happened after the activity concluded.

Every completed plan has exactly one completion record.

Activity-specific completion data is stored in dedicated tables.

---

# Responsibilities

The Completion domain is responsible for:

* Recording plan completion
* Storing activity-specific results
* Validating completion data
* Serving as the source of truth for memories

The Completion domain is **not** responsible for:

* Plans
* Participants
* Chat
* Memories
* Wallet
* Notifications

---

# Design Principles

1. Every completed plan has exactly one completion.
2. Completion is the source of truth for what happened.
3. Every activity stores its own completion data.
4. Historical completion data is immutable.
5. Memories are generated from completion data.

---

# Tables

## plan_completions

Stores metadata common to every completed plan.

| Column       | Type        | Description               |
| ------------ | ----------- | ------------------------- |
| id           | UUID        | Primary key               |
| plan_id      | UUID        | References `plans.id`     |
| completed_by | UUID        | References `users.id`     |
| completed_at | TIMESTAMPTZ | Completion timestamp      |
| created_at   | TIMESTAMPTZ | Record creation timestamp |

---

## football_completion

Stores football-specific results.

| Column        | Type    | Description                      |
| ------------- | ------- | -------------------------------- |
| completion_id | UUID    | References `plan_completions.id` |
| team_a_score  | INTEGER | Team A score                     |
| team_b_score  | INTEGER | Team B score                     |
| mvp_user_id   | UUID    | References `users.id`            |

---

## badminton_completion

Stores badminton-specific results.

| Column        | Type | Description                      |
| ------------- | ---- | -------------------------------- |
| completion_id | UUID | References `plan_completions.id` |
| mvp_user_id   | UUID | References `users.id`            |

---

## movie_completion

Stores movie-specific results.

| Column        | Type    | Description                      |
| ------------- | ------- | -------------------------------- |
| completion_id | UUID    | References `plan_completions.id` |
| rating        | INTEGER | Rating (1–5)                     |
| review        | TEXT    | Optional review                  |

---

## dining_completion

Stores dining-specific results.

| Column        | Type    | Description                      |
| ------------- | ------- | -------------------------------- |
| completion_id | UUID    | References `plan_completions.id` |
| rating        | INTEGER | Rating (1–5)                     |
| review        | TEXT    | Optional review                  |

---

# Relationships

Plans

↓

Plan Completions

↓

Football Completion

Badminton Completion

Movie Completion

Dining Completion

Only one activity-specific completion record exists for each completed plan.

---

# Constraints

* Every completed plan has exactly one `plan_completion`.
* Every `plan_completion` belongs to exactly one plan.
* Every activity-specific completion references exactly one `plan_completion`.
* Football completion requires an MVP and both team scores.
* Badminton completion requires an MVP.
* Movie and Dining completion require a rating.
* Review is optional for Movie and Dining.

---

# Completion Workflow

Football

1. Enter Team A score.
2. Enter Team B score.
3. Select MVP.
4. Submit.

---

Badminton

1. Select MVP.
2. Submit.

---

Movies

1. Select rating.
2. Write review (optional).
3. Submit.

---

Dining

1. Select rating.
2. Write review (optional).
3. Submit.

---

# Design Philosophy

The Completion domain records facts.

It answers the question:

**"What actually happened?"**

It does not determine how those results are displayed.

The Memory domain is responsible for presenting completion data to users.
