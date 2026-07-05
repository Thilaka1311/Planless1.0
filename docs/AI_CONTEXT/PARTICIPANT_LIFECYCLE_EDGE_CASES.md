# Participant Lifecycle Transition Specification

This document serves as the authoritative reference for all valid participant state transitions and validations in the RSVP system. The participant lifecycle is defined by exactly four states: `INVITED`, `JOINED`, `WAITLISTED`, and `SKIPPED`.

---

## 1. Participant State (`rsvp_status`)

The state machine for any participant (except the host) is represented strictly by the `rsvp_status` column in the database and visible everywhere in the UI:

| Participant State | Database `rsvp_status` | Description |
| --- | --- | --- |
| **INVITED** | `INVITED` | Participant is invited but has not yet accepted or declined. |
| **JOINED** | `JOINED` | Participant is actively attending the plan. |
| **WAITLISTED** | `WAITLISTED` | Participant has accepted but is queueing because all spots are occupied. |
| **SKIPPED** | `SKIPPED` | Participant is no longer actively participating in the plan. |

No other values are valid participant states. All user-facing screens, filters, toggles, badges, counters, and labels must use only these four states.

---

## 2. Skip Reason (Internal Backend Metadata)

When a participant transitions into the `SKIPPED` state, the backend records **why** they entered that state using the `skip_reason` database column (Postgres Enum):

* **`skip_reason = NULL`**: The participant declined the invitation (never joined).
* **`skip_reason = LEFT`**: The participant voluntarily left the plan after joining.
* **`skip_reason = REMOVED`**: The host removed the participant.

These are **not participant states** and do not affect the participant state machine. They are internal backend metadata used for analytics and coordinate/audit business logic, and must never be exposed to the UI.

---

## 3. Participant State Transition Matrix

| Initial State | Action / Trigger | Final State | Validation Rules & Constraints | Allowed / Blocked |
| --- | --- | --- | --- | --- |
| **INVITED** | User accepts (spots available) | **JOINED** | Allowed if current `goingCount < capacity`. | Allowed |
| **INVITED** | User accepts (spots full) | **WAITLISTED** | Triggered automatically if `goingCount >= capacity`. | Allowed |
| **INVITED** | User declines / skips | **SKIPPED** | No capacity constraints. Internal metadata tracks this as a voluntary decline. | Allowed |
| **INVITED** | Host removes participant | **SKIPPED** | Can only be performed by the Plan Host. Internal metadata records `REMOVED`. | Allowed |
| --- | --- | --- | --- | --- |
| **JOINED** | User leaves | **SKIPPED** | Triggers evaluation of waitlist to fill the open spot. Internal metadata records `LEFT`. | Allowed |
| **JOINED** | Host removes participant | **SKIPPED** | Triggers evaluation of waitlist. Host cannot remove themselves. Internal metadata records `REMOVED`. | Allowed |
| --- | --- | --- | --- | --- |
| **WAITLISTED** | User leaves | **SKIPPED** | Frees up waitlist queue position. Internal metadata records `LEFT`. | Allowed |
| **WAITLISTED** | Host removes participant | **SKIPPED** | Can only be performed by the Plan Host. Internal metadata records `REMOVED`. | Allowed |
| **WAITLISTED** | Spot opens (waitlist promotion) | **JOINED** | Evaluated automatically when a spot opens. | **Automatic** |
| --- | --- | --- | --- | --- |
| **SKIPPED** | User rejoins (spots available) | **JOINED** | Allowed if current `goingCount < capacity`. | Allowed |
| **SKIPPED** | User rejoins (spots full) | **WAITLISTED** | Triggered automatically if `goingCount >= capacity`. | Allowed |

---

## 4. Edge-Case Scenarios & Rules

### 4.1 User Repeatedly Joining and Leaving (Skipping)
- **Initial State:** `JOINED` or `WAITLISTED`.
- **Trigger/Action:** User joins, leaves, rejoins, and leaves again multiple times.
- **Rules:** 
  - Each transition to leave converts `rsvp_status` to `SKIPPED`. The metadata updates to reflect `LEFT`.
  - Rejoining is strictly user-initiated. The user must manually accept/rejoin.
  - Rejoining checks capacity *at that exact moment*. If spots are available, they transition back to `JOINED`. If the plan filled up during their absence, they transition to `WAITLISTED`.
  - When rejoining and waitlisted, their position in the waitlist queue is based on their newest rejoin response timestamp (`responded_at`). They do not retain their old position.

### 4.2 Rejoining after Host Removal
- **Initial State:** `SKIPPED` (after host removes participant; backend metadata reason is `REMOVED`).
- **Trigger/Action:** User triggers a rejoin action.
- **Rules:**
  - The participant rejoins on their own. The host cannot force-add or restore them.
  - Evaluates current capacity. If `goingCount < capacity`, transitions to `JOINED`. If `goingCount >= capacity`, transitions to `WAITLISTED`.

### 4.3 Waitlist Promotion Cascades (Multiple Spots Open)
- **Initial State:** Multiple waitlisted users (`User A`, `User B`, `User C`) in `WAITLISTED` state.
- **Trigger/Action:** Multiple spots open up simultaneously (e.g. host increases spots by 2, or multiple joined users leave).
- **Rules:**
  - Promotes waitlisted users one after another sorted chronologically by their `responded_at` timestamp.
  - The first `N` waitlisted users are promoted to `JOINED`, where `N` is the number of newly opened spots.

### 4.4 Capacity Decreases While Waitlist Exists
- **Initial State:** Plan is full. `goingCount == capacity`. Waitlist is active with queueing users.
- **Trigger/Action:** Host decreases available capacity (`capacity - N`).
- **Rules:**
  - Currently `JOINED` users are not evicted.
  - No waitlisted users are promoted.
  - Any future acceptance or rejoin attempt by `SKIPPED`/`INVITED` users is directed to the `WAITLISTED` state until `goingCount < new_capacity`.

---

## 5. Blocked & Invalid Transitions

The following transitions are strictly invalid and must be rejected or prevented by the system:

| Initial State | Attempted Action | Why Invalid | Expected System Behavior |
| --- | --- | --- | --- |
| **JOINED** | Re-invited to plan | Active participant cannot be reverted back to invited. | **Ignore/Reject**. No state change. |
| **WAITLISTED** | Re-invited to plan | Queueing participant cannot be reverted back to invited. | **Ignore/Reject**. No state change. |
| **SKIPPED** | Host force-adds participant | Host cannot add a participant back once they have left or been removed. Only user can rejoin. | **Prevent/Block**. API returns error. |
| **SKIPPED** | Host re-invite participant | Host cannot re-invite a participant once they have left or been removed. Only user can rejoin. | **Prevent/Block**. API returns error. |
| **HOST (JOINED)** | Host sets self to `INVITED` | Host must remain joined to coordinate the plan. | **Prevent/Block**. UI option hidden. |
| **HOST (JOINED)** | Host sets self to `WAITLISTED` | Host occupies the primary slot and cannot queue. | **Prevent/Block**. UI option hidden. |
| **HOST (JOINED)** | Host sets self to `SKIPPED` / leaves | Host cannot leave the plan. They must cancel it or transfer ownership. | **Prevent/Block**. UI option hidden, API returns error. |
| **HOST (JOINED)** | Host removes self | Host cannot remove themselves from their own plan. | **Prevent/Block**. Host option disabled, API returns error. |
| **Any State** | Create duplicate participant record | A user can have only one participant record per plan. | **Prevent**. Enforced by DB unique index `(plan_id, user_id)`. |
| **Any State** | Invite already existing participant | Cannot re-add/invite a user who already has a plan membership. | **Ignore/Reject**. Host addition returns message. |
| **Any State** | Create multiple waitlist entries | A participant can only occupy one queue slot. | **Prevent**. Unique index constraint. |

---

## 6. Participant System Invariants

The following invariants must always hold true at all times in Planless:

1. **Uniqueness**: A user can have only one record in the `plan_participants` table per plan.
2. **Singular Active Status**: A participant can only have one active `rsvp_status` at any time.
3. **Host Presence**: The host always remains in the `JOINED` state (`role = 'HOST'`, `rsvp_status = 'JOINED'`).
4. **Host Immunity**: The host can never be removed from the plan through the participant lifecycle.
5. **No Duplicate Queues**: Waitlist entries must remain unique per plan.
6. **No Duplicate State Transitions**: Transition actions must never result in duplicate records.
7. **Skipped User Autonomy**: Rejoining the plan after entering `SKIPPED` status is always initiated by the participant, never by the host.
8. **UI Transparency**: All user-facing participant listings, filters, toggles, badges, counters, and labels must use only the four canonical states (`INVITED`, `JOINED`, `WAITLISTED`, `SKIPPED`). Internal backend metadata (such as `LEFT` or `REMOVED`) must never affect this visibility.
9. **State/Reason Dependency**: If `rsvp_status != SKIPPED`, then `skip_reason` must always be `NULL`.

