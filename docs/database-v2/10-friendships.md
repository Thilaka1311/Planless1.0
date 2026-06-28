# Friendships Domain

## Purpose

The Friendships domain manages social connections between users on Planless.

Unlike traditional social platforms, friend requests are initiated only after users have joined the same plan.

This ensures every friendship begins with a shared experience rather than a random search or unsolicited request.

---

# Responsibilities

The Friendships domain is responsible for:

* Sending friend requests
* Accepting or rejecting friend requests
* Managing friendships
* Removing friendships
* Powering friend selection during plan creation

The Friendships domain is **not** responsible for:

* Plans
* Chat
* Notifications
* Memories
* Wallet

---

# Design Principles

1. Friendships are created through shared experiences.
2. Users can only send friend requests to participants of the same plan.
3. Every friendship begins with a friend request.
4. Friend requests are optional.
5. A friendship exists only once between two users.

---

# Table

## friendships

| Column               | Type        | Description                                  |
| -------------------- | ----------- | -------------------------------------------- |
| id                   | UUID        | Primary key                                  |
| requester_id         | UUID        | References `users.id`                        |
| receiver_id          | UUID        | References `users.id`                        |
| created_from_plan_id | UUID        | References `plans.id`                        |
| status               | ENUM        | Pending, Accepted, Rejected                  |
| created_at           | TIMESTAMPTZ | Friend request creation timestamp            |
| responded_at         | TIMESTAMPTZ | Acceptance or rejection timestamp (nullable) |

---

# Relationships

Each friendship:

* Connects two users.
* Originates from one plan.
* Maintains its own request status.

---

# Friendship Workflow

1. Host creates a plan.
2. Participants receive the invitation link.
3. Participants join the plan.
4. The participant list becomes visible.
5. Users may send friend requests to any other participant.
6. The recipient may:

   * Accept
   * Reject
   * Leave the request pending
7. Once accepted, the users become friends.

---

# Constraints

* Users cannot send friend requests to themselves.
* Users can only send friend requests to participants of the same plan.
* Duplicate pending requests are not allowed.
* Existing friends cannot send another request.
* Every request references the plan where the users met.

Unique Constraint:

(requester_id, receiver_id, created_from_plan_id)

The application should prevent inverse duplicate requests.

For example, if John has already sent a request to Alex, Alex cannot send another request to John while the first request is pending.

---

# Friend Request Status

### Pending

The request has been sent and is awaiting a response.

### Accepted

The users become friends.

### Rejected

The request is declined.

No friendship is created.

---

# Removing Friends

Either user may remove an existing friendship.

Removing a friendship:

* Removes the relationship.
* Does not affect past plans.
* Does not affect memories.
* Does not affect chat history.

Users may become friends again in the future by participating in another shared plan.

---

# User Experience

The friendship flow is intentionally lightweight.

After joining a plan, users can open the participant list and send friend requests to anyone they met during that activity.

Recipients can:

* Accept
* Reject
* Ignore the request

Only accepted requests become friendships.

This allows users to build a network of people they have actually participated in activities with while keeping complete control over who becomes part of their friend list.

---

# Design Philosophy

Planless believes friendships should begin with real-world experiences.

Traditional social platforms encourage users to search for strangers and send friend requests.

Planless reverses this process.

Users first:

Plan

↓

Meet

↓

Participate

↓

Choose to Connect

Every friendship is rooted in a shared activity, making the social graph more meaningful, intentional, and authentic.
