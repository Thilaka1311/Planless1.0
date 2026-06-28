# Database Enums

## Purpose

This document defines every PostgreSQL ENUM used throughout the Planless database.

Enums provide a consistent set of allowed values, improve data integrity, and simplify application logic.

Each enum should be created as a PostgreSQL ENUM type before creating the tables that reference it.

---

# Plan Status

Used by:

* `plans.status`

```text
DRAFT
OPEN
LOCKED
COMPLETED
CANCELLED
```

---

# Friendship Status

Used by:

* `friendships.status`

```text
PENDING
ACCEPTED
REJECTED
```

---

# Message Status

Used by:

* `chat_messages.status`

```text
SENT
DELIVERED
```

Description:
* `SENT` — The message has been created by the sender.
* `DELIVERED` — The message has been successfully delivered.

Planless V2 does not support read receipts.
There is intentionally no `SEEN` enum value.

---

# Notification Type

Used by:

* `notifications.type`

```text
PLAN_INVITATION

PARTICIPANT_JOINED
PARTICIPANT_LEFT

PLAN_CANCELLED
PLAN_REMINDER

FRIEND_REQUEST
FRIEND_REQUEST_ACCEPTED

PAYMENT_RECEIVED
PAYMENT_REMINDER

MEMORY_GENERATED
```

---

# Team

Used by:

* `plan_teams.team`

```text
TEAM_1
TEAM_2
```

Additional enum values may be introduced in the future if activities require more than two teams.

---

# Wallet Status

Used by:

* `ledger.status`

```text
PENDING
PAID
```

---

# Activity Category

Used by:

* `plans.category`

```text
SPORTS

MOVIES

DINING

ENTERTAINMENT

TRAVEL

FITNESS

STUDY

OTHER
```

---

# Activity Subcategory

Used by:

* `plans.subcategory`

```text
FOOTBALL

BADMINTON

CRICKET

BASKETBALL

VOLLEYBALL

TENNIS

PICKLEBALL

BOWLING

GO_KARTING

MOVIE

RESTAURANT

CAFE

ROAD_TRIP

GYM

STUDY_SESSION

OTHER
```

This enum will expand as Planless introduces additional supported activities.

---

# Completion Status

Used by:

* `completions.status`

```text
PENDING
SUBMITTED
VERIFIED
```

---

# RSVP Status

Used by:

* `plan_participants.rsvp_status`

```text
INVITED

JOINED

DECLINED

LEFT

REMOVED
```

---

# Plan Participant Role

Used by:

* `plan_participants.role`

```text
HOST

CO_HOST

PARTICIPANT
```

---

# Circle Role

Used by:

* `circle_members.role`

```text
CREATOR

ADMIN

MEMBER
```

---

# Naming Convention

All enum values follow these rules:

* Uppercase.
* Snake case where necessary.
* Immutable whenever possible.
* Shared across the entire application.

Examples:

```text
PLAN_REMINDER

FRIEND_REQUEST_ACCEPTED

TEAM_1

GO_KARTING
```

---

# Design Philosophy

Enums represent stable business concepts.

Unlike regular text fields, enum values should change very rarely because they become part of the database schema.

Adding new enum values is expected as Planless evolves, but existing values should remain stable to preserve compatibility with historical data.
