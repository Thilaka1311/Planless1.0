# Wallet Domain

## Purpose

The Wallet domain manages participation fees for plans.

When a host creates a paid plan, every participant who joins owes the participation fee directly to the host.

The Wallet provides a simple ledger showing who has paid, who still owes money, and the payment history for every plan.

Unlike traditional expense-sharing applications, participants never owe each other. They only owe the plan host.

---

# Responsibilities

The Wallet domain is responsible for:

* Creating participation fee records
* Tracking participant payments
* Maintaining a payment ledger
* Showing outstanding balances
* Recording completed payments

The Wallet domain is **not** responsible for:

* Plans
* Participants
* Chat
* Completion
* Memories
* Notifications

---

# Design Principles

1. Every financial record belongs to a plan.
2. Participants only owe the host.
3. Every ledger entry represents one participant's obligation.
4. Payment history is immutable.
5. Every payment can always be traced back to the originating plan.

---

# Plan Integration

A host may optionally configure a participation fee when creating a plan.

Example:

Football

Ground Fee

₹120 per participant

Every participant who joins the plan automatically receives a ledger entry.

---

# Tables

## ledger

Represents a payment relationship between a participant and the host.

| Column     | Type        | Description                        |
| ---------- | ----------- | ---------------------------------- |
| id         | UUID        | Primary key                        |
| public_id  | TEXT        | Human-readable ID (e.g. `L000001`) |
| plan_id    | UUID        | References `plans.id`              |
| payer_id   | UUID        | References `users.id`              |
| payee_id   | UUID        | References `users.id` (Host)       |
| amount     | DECIMAL     | Participation fee                  |
| status     | ENUM        | Pending, Paid                      |
| created_at | TIMESTAMPTZ | Ledger entry creation              |
| paid_at    | TIMESTAMPTZ | Payment timestamp (nullable)       |

---

# Relationships

Plans

↓

Ledger

Each participant joining a paid plan creates one ledger entry.

The host becomes the payee.

The participant becomes the payer.

---

# Workflow

1. Host creates a plan.
2. Host enables a participation fee (optional).
3. Participants join the plan.
4. A ledger entry is created for each participant.
5. Participants pay the host.
6. The ledger status changes from **Pending** to **Paid**.

---

# Constraints

* Every ledger entry belongs to one plan.
* Every ledger entry has exactly one payer.
* Every ledger entry has exactly one payee.
* A participant may only have one ledger entry per plan.
* The host cannot owe themselves money.
* `paid_at` is only populated when the status becomes **Paid**.

Unique Constraint:

(plan_id, payer_id)

---

# Wallet Experience

The Wallet displays:

## You Owe

Shows every unpaid participation fee where the current user is the payer.

Example:

Football

Ground Booking

₹120

Pending

---

## Owed To You

Shows every unpaid participant where the current user is the host.

Example:

Football

8 Participants

6 Paid

2 Pending

Total Outstanding: ₹240

---

Selecting a participant displays:

* Associated plan
* Participation fee
* Payment status
* Payment history

Selecting a plan displays:

* Total expected collection
* Total amount collected
* Outstanding amount
* Paid participants
* Pending participants

---

# Payment Status

Pending

The participant has joined but has not yet paid the host.

Paid

The participant has completed payment.

The ledger becomes part of the permanent payment history.

---

# Design Philosophy

The Wallet is designed specifically for organized activities.

Financial relationships are centered around the host rather than between participants.

This keeps the payment model simple, transparent, and directly connected to the shared experience.

Every payment answers two questions:

* **Who owes the money?**
* **Which plan is the payment for?**

By keeping every ledger entry linked to a plan, users always have the context behind every transaction while giving hosts a clear overview of collections for each activity.
