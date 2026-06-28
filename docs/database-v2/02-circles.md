# Circles Domain

## Purpose

A Circle is a reusable planning list that allows a group of friends to quickly organize plans together.

A Circle is **not** a chat room, community, or social feed.

Its only purpose is to make inviting the same group of people fast and effortless.

All conversations happen inside plans, not inside circles.

---

# Responsibilities

The Circles domain is responsible for:

* Organizing friends into reusable planning lists
* Managing circle membership
* Managing circle roles
* Allowing members to quickly host plans

The Circles domain is **not** responsible for:

* Chat
* Memories
* Plan history
* Leaderboards
* Wallet
* Notifications

---

# Table

## circles

| Column     | Type        | Description                        |
| ---------- | ----------- | ---------------------------------- |
| id         | UUID        | Primary key                        |
| public_id  | TEXT        | Human-readable ID (e.g. `C000001`) |
| name       | TEXT        | Circle name                        |
| created_by | UUID        | References `users.id`              |
| created_at | TIMESTAMPTZ | Creation timestamp                 |
| updated_at | TIMESTAMPTZ | Last updated timestamp             |

---

## circle_members

| Column    | Type        | Description                  |
| --------- | ----------- | ---------------------------- |
| id        | UUID        | Primary key                  |
| circle_id | UUID        | References `circles.id`      |
| user_id   | UUID        | References `users.id`        |
| role      | ENUM        | `creator`, `admin`, `member` |
| joined_at | TIMESTAMPTZ | When the user joined         |

---

# Circle Roles

## Creator

The creator owns the circle.

Permissions:

* Rename circle
* Delete circle
* Add/remove members
* Promote or demote admins
* Transfer creator role

---

## Admin

Admins help organize plans.

Permissions:

* Host plans
* Add members
* Remove members
* Edit circle details (optional)

Admins cannot transfer ownership or delete the circle.

---

## Member

Members participate in plans created from the circle.

Permissions:

* View the circle
* Leave the circle
* Accept or decline plan invitations

---

# Relationships

A circle has many members.

A user can belong to many circles.

Plans may optionally be created from a circle.

When a plan is created from a circle, the selected members are copied into `plan_participants`.

After a plan is created, it no longer depends on the circle.

Editing a circle never changes existing plans.

---

# Constraints

* `id` is the primary key.
* `public_id` must be unique.
* A user may only appear once per circle.
* Every circle must always have exactly one Creator.

---

# Design Principles

1. Circles exist only to speed up planning.
2. Plans are the center of the product.
3. Circle membership does not imply participation in every plan.
4. Historical plans remain unchanged even if the circle changes later.
5. Circle chat does not exist.

---

# User Experience

Creating a plan should feel similar to selecting recipients when sending a Snap.

Users can:

* Select individual friends.
* Select one or more circles.
* Modify the invited people before sending the plan.

Circles are simply reusable invitation lists.

They reduce friction without becoming another messaging platform.
