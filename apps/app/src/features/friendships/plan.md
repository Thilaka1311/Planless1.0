# Plan: Social Graph (Friends System)

## Goal

Implement the complete friendship system for Planless.

The objective is to create a scalable relationship model that supports:

- Friend Requests
- Friends List
- Incoming Requests
- Outgoing Requests
- Removing Friends
- Future notifications
- Future mutual friends
- Future chat permissions
- Future invite permissions

This is the foundation for all social features.

---

# Design Principles

The friendship system should have a single source of truth.

Do not store friendships in multiple places.

All relationship state should be derived from one table.

The UI should simply reflect the current relationship state.

---

# Relationship States

Two users can only have one active relationship.

Supported states:

- NONE
- PENDING
- ACCEPTED
- REJECTED
- BLOCKED (future)

Definitions:

NONE
No relationship exists.

PENDING
One user has sent a request.
The other user has not responded.

ACCEPTED
Both users are friends.

REJECTED
A request was rejected.

BLOCKED
Reserved for future implementation.

---

# Database Design

## friendships

Columns:

- id
- requester_id
- recipient_id
- status
- created_at
- updated_at
- responded_at

Constraints:

- requester_id != recipient_id

- Only one active relationship may exist between two users.

- Prevent duplicate friend requests.

---

# User Flow

## Send Request

User searches for another user.

↓

Tap "Add Friend"

↓

Create friendship row

status = PENDING

requester_id = current user

recipient_id = target user

↓

Recipient receives notification (future)

---

## Incoming Requests

Open Friends screen

↓

Requests tab

↓

Display all rows where

recipient_id = current user

status = PENDING

---

Each card contains

- avatar
- username
- name
- mutual friends (future)

Actions

Accept

Reject

---

## Accept

Update

status = ACCEPTED

responded_at = now()

Realtime updates

Both users immediately become friends.

---

## Reject

Update

status = REJECTED

responded_at = now()

---

## Friends List

Display all rows where

status = ACCEPTED

AND

current user is either

requester

or

recipient

Display the opposite user.

---

## Remove Friend

Delete friendship

OR

change status

Decision:

(Delete vs archive will be decided during implementation.)

---

# Screens

## Friends Screen

Header

Friends

Statistics

Friends Count

Pending Requests Count

Segmented Control

Friends

Requests

---

Friends Tab

Search

Friend Cards

Empty State

---

Requests Tab

Incoming Requests

Accept

Reject

Empty State

"No pending requests."

---

# Services

Create a dedicated friendship service.

Functions:

sendFriendRequest()

acceptFriendRequest()

rejectFriendRequest()

cancelFriendRequest()

removeFriend()

getFriends()

getIncomingRequests()

getOutgoingRequests()

getRelationship()

---

# Realtime

Subscribe to friendship table.

Automatically update:

Friends list

Request count

Pending requests

Friend status

without requiring refresh.

---

# Future Features

Not part of MVP.

- Mutual friends

- Friend suggestions

- Blocks

- Close Friends

- Best Friends

- Friend activity

- Friend streaks

- Shared plans

- Shared memories

- Invite recommendations

---

# MVP Scope

Included

✅ Send request

✅ Receive request

✅ Accept

✅ Reject

✅ Friends list

✅ Friend count

✅ Incoming requests

✅ Outgoing requests

✅ Realtime

Excluded

❌ Blocking

❌ Suggestions

❌ Mutual friends

❌ Close friends

❌ Friend activity

❌ Friend recommendations

❌ Privacy controls

---

# Implementation Order

Phase 1

Design database schema

↓

Phase 2

Create friendship services

↓

Phase 3

Realtime subscriptions

↓

Phase 4

Friends screen

↓

Phase 5

Requests screen

↓

Phase 6

Integrate with Profile

↓

Phase 7

Integrate with Create Plan

↓

Phase 8

Notifications

↓

Phase  8

Polish