Contexts own state.

Hooks own behavior.

Components own UI.

Database owns persistence.

Derived data is never stored.

Supabase is source of truth.

UUIDs are used for:
- relationships
- joins
- foreign keys
- mutations

Text IDs are used only for:
- sharing
- public references
- debugging

No hardcoded production data.

No duplicate business logic.

No feature may introduce a second source of truth.

Database state always wins over local state.

Business logic lives in hooks.

Contexts orchestrate hooks, they do not implement business logic.

Components never mutate database state directly.

If a feature requires >100 lines of new business logic, create a new domain hook.

# Local State Rule

Local component state may only be used for:

- temporary form edits
- modal visibility
- animations
- UI-only toggles

Local state must never become a second source of truth for database data.

If state originates from:
- Supabase
- Context
- Store
- Props

it should be rendered directly whenever possible.

If local state mirrors props, a synchronization strategy must exist and be documented.

Waitlist Rules

Source of truth:
- plan_participants.waitlisted_at

Promotion:
- oldest waitlisted_at is promoted first

Demotion:
- any participant moved to waitlist receives
  waitlisted_at = now()

joined_at:
- only represents when a participant entered
  the active going pool

joined_at must never be used to determine
waitlist ordering.