# Database Indexes

## Purpose

This document defines the indexes required for the Planless database.

Indexes improve query performance by allowing PostgreSQL to locate rows efficiently without scanning entire tables.

Only columns that are frequently searched, filtered, sorted, or joined should be indexed.

---

# Design Principles

1. Every primary key is automatically indexed.
2. Every foreign key should be indexed unless there is a specific reason not to.
3. Frequently queried columns should be indexed.
4. Avoid unnecessary indexes to reduce write overhead.
5. Composite indexes should match common query patterns.

---

# Users

## users

| Column(s) | Reason              |
| --------- | ------------------- |
| public_id | User profile lookup |

---

# Friendships

## friendships

| Column(s)                   | Reason                     |
| --------------------------- | -------------------------- |
| requester_id                | Sent friend requests       |
| receiver_id                 | Received friend requests   |
| (requester_id, receiver_id) | Prevent duplicate requests |

---

# Circles

## circles

| Column(s)  | Reason         |
| ---------- | -------------- |
| created_by | User's circles |

---

## circle_members

| Column(s)            | Reason                        |
| -------------------- | ----------------------------- |
| circle_id            | Members of a circle           |
| user_id              | Circles a user belongs to     |
| (circle_id, user_id) | Prevent duplicate memberships |

---

# Plans

## plans

| Column(s)    | Reason                 |
| ------------ | ---------------------- |
| host_id      | Host's plans           |
| category     | Activity filtering     |
| subcategory  | Activity filtering     |
| scheduled_at | Upcoming plans         |
| status       | Active/completed plans |

---

# Plan Participants

## plan_participants

| Column(s)          | Reason                         |
| ------------------ | ------------------------------ |
| plan_id            | Participants of a plan         |
| user_id            | Plans joined by a user         |
| rsvp_status        | RSVP filtering                 |
| role               | Host / Co-host lookup          |
| (plan_id, user_id) | Prevent duplicate participants |

---

# Teams

## plan_teams

| Column(s) | Reason              |
| --------- | ------------------- |
| plan_id   | Teams within a plan |

---

## team_members

| Column(s)      | Reason                      |
| -------------- | --------------------------- |
| team_id        | Members of a team           |
| participant_id | Participant's assigned team |

---

# Chat

## chat_messages

| Column(s)  | Reason                 |
| ---------- | ---------------------- |
| plan_id    | Messages in a plan     |
| sender_id  | User message history   |
| created_at | Chronological ordering |

---

# Completion

## completions

| Column(s) | Reason            |
| --------- | ----------------- |
| plan_id   | Completion lookup |

---

# Memories

## memories

| Column(s)  | Reason            |
| ---------- | ----------------- |
| plan_id    | Memory for a plan |
| created_at | Recent memories   |

---

# Wallet

## ledger

| Column(s) | Reason                      |
| --------- | --------------------------- |
| plan_id   | Payments for a plan         |
| payer_id  | Payments made by a user     |
| payee_id  | Payments received by a user |
| status    | Pending / Paid payments     |

---

# Notifications

## notifications

| Column(s)  | Reason                |
| ---------- | --------------------- |
| user_id    | User notifications    |
| is_read    | Unread notifications  |
| created_at | Notification ordering |

---

# Composite Indexes

The following composite indexes should be created:

| Columns                     | Reason                    |
| --------------------------- | ------------------------- |
| (plan_id, user_id)          | Unique participant lookup |
| (circle_id, user_id)        | Unique circle membership  |
| (requester_id, receiver_id) | Unique friend request     |
| (plan_id, team)             | Unique team per plan      |

---

# Automatic Indexes

The following indexes are automatically created by PostgreSQL and do not need to be added manually:

* Primary Keys
* Unique Constraints

---

# Design Philosophy

Indexes should optimize the queries users perform most frequently.

Planless prioritizes:

* Opening plans
* Viewing participants
* Loading chats
* Viewing memories
* Managing friendships
* Tracking wallet payments
* Reading notifications

Indexes should be reviewed periodically as new features are introduced and query patterns evolve.
