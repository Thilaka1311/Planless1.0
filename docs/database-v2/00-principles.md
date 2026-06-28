# Planless Database V2 Principles

## Vision

The Planless database is designed to be simple, scalable, and easy to understand.

Every table exists to model a real business concept within the product. The schema should prioritize clarity over cleverness and should remain maintainable as the product grows.

---

# Core Principles

## 1. One Table, One Responsibility

Every table should represent a single business entity.

Examples:

* A user
* A circle
* A plan
* A participant
* A memory

Tables should never combine multiple responsibilities.

---

## 2. Store Facts, Not Statistics

The database stores events and relationships.

Statistics should always be derived.

Examples:

Store:

* Completed plans
* MVP selections
* Ratings
* Attendance

Do not store:

* Football wins
* Attendance percentage
* Total hosted plans
* Leaderboard rankings

These can be calculated when needed.

---

## 3. Normalize Before Optimizing

Avoid duplicating information.

Each piece of data should have one authoritative source.

If information exists elsewhere in the database, reference it using foreign keys instead of copying it.

---

## 4. Authentication is Separate from Profiles

Authentication is managed by Supabase Auth.

Application profile information is stored in the `users` table.

Authentication data and business data should never be mixed.

---

## 5. UUIDs are Internal

Every table uses a UUID as its primary key.

UUIDs are used for all relationships.

Users should never see UUIDs.

---

## 6. Public IDs are External

Every user-facing entity has a readable `public_id`.

Examples:

* Users → U000001
* Circles → C000001
* Plans → P000001

Public IDs exist for debugging, support, sharing, and user-facing interfaces.

---

## 7. Relationships Use Foreign Keys

Relationships should always be represented using foreign keys.

Avoid storing duplicate references or serialized relationship data.

---

## 8. Every Table Should Be Easy to Understand

A new engineer should understand a table within a few minutes.

If a table becomes difficult to explain, it likely has more than one responsibility.

---

## 9. Design First, Implement Second

All schema changes begin with updating the database documentation.

SQL migrations are generated only after the design has been reviewed and approved.

The documentation is the source of truth.

---

## 10. Security by Default

All tables use Row Level Security (RLS).

The frontend accesses data through authenticated user policies.

Backend services use the Supabase Service Role only when elevated privileges are required.

---

## 11. Keep the Core Small

The core entities of Planless are:

* Users
* Friendships
* Circles
* Circle Members
* Plans
* Plan Participants
* Messages
* Completions
* Memories
* Notifications

New features should extend these entities whenever possible instead of introducing unnecessary tables.

---

## 12. Every Column Must Have a Purpose

Every column should answer a business requirement.

Unused, speculative, or duplicated columns should not exist.

Features should justify schema changes—not the other way around.

---

# Database Philosophy

The database models the real-world concepts behind Planless.

Features are built on top of these concepts.

The schema should remain stable even as the application evolves.

A clean database is easier to understand, easier to maintain, easier for AI coding agents to work with, and more resilient as the product grows.