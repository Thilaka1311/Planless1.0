# Chat Domain

## Purpose

The Chat domain enables communication between participants of a plan.

Every plan has exactly one chat.

The chat exists only to help participants coordinate before and during the activity.

Chats are not independent entities and cannot exist without a plan.

---

# Responsibilities

The Chat domain is responsible for:

* Sending messages
* Displaying messages
* Tracking message delivery

The Chat domain is **not** responsible for:

* Plans
* Participants
* Completion
* Memories
* Notifications

---

# Design Principles

1. Every chat belongs to exactly one plan.
2. Chats cannot exist without a plan.
3. Chats become active when a plan becomes **Open**.
4. Historical chats remain available after plan completion.
5. Chats are read-only after plan completion (future decision).

---

# Table

## messages

| Column          | Type        | Description                      |
| --------------- | ----------- | -------------------------------- |
| id              | UUID        | Primary key                      |
| plan_id         | UUID        | References `plans.id`            |
| sender_id       | UUID        | References `users.id`            |
| message         | TEXT        | Message content                  |
| delivery_status | ENUM        | Sent, Delivered                  |
| created_at      | TIMESTAMPTZ | Time sent                        |
| updated_at      | TIMESTAMPTZ | Last edited timestamp (nullable) |
| deleted_at      | TIMESTAMPTZ | Soft delete timestamp (nullable) |

---

# Delivery Status

Possible values:

* Sent
* Delivered

The application is responsible for updating the delivery status as messages reach recipients.

---

# Relationships

Each message:

* Belongs to one plan.
* Has one sender.
* Is visible only to participants of the associated plan.

---

# Constraints

* `id` is the primary key.
* `plan_id` references `plans.id`.
* `sender_id` references `users.id`.
* Empty messages are not allowed.

---

# Permissions

Participants can:

* Send messages.
* Read messages.
* Edit their own messages (optional).
* Delete their own messages (optional).

Only active participants may send messages.

Removed participants lose access to the chat.

---

# Plan Lifecycle Integration

### Draft

Chat does not exist.

### Open

Chat becomes active.

### Locked

Chat remains active.

### Completed

Chat remains visible as part of the plan history.

### Cancelled

Chat becomes read-only.

---

# Design Philosophy

Chats exist solely to support planning and coordination.

They are intentionally lightweight.

Planless is a planning platform, not a messaging platform.

Every conversation begins with a plan and remains attached to that plan throughout its lifecycle.
