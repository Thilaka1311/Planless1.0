# Planless — Master Plan

> This is the root planning document for the Planless application.
> It serves as the table of contents and architectural reference for all feature planning documentation.

---

## Overview

Planless is a spontaneous social planning application that enables users to create real-time meetup plans, invite friends and circles, manage RSVPs with capacity and waitlist logic, handle cost splitting, generate post-activity memories, and communicate via plan-scoped chat.

The application follows an **MVVM-inspired architecture**:

- **Model** — Postgres tables managed via Supabase, accessed through RLS-enforced queries.
- **ViewModel** — React Context stores and custom hooks that transform raw database state into presentation-ready data.
- **View** — React components that consume ViewModel outputs and bind user interactions to callbacks.

---

## Documentation Architecture

The codebase maintains a distributed documentation structure where the master `plan.md` acts as the navigation hub, and each individual feature folder owns a dedicated `plan.md` that serves as the living source of truth for its implementation.

```text
apps/app/src/
│
├── plan.md                       # Master Architectural Index (This File)
│
└── features/
    ├── auth/
    │   └── plan.md               # Session preservation & OTP login flows
    ├── profile/
    │   └── plan.md               # Avatar compression & user details editing
    ├── friendships/
    │   └── plan.md               # Symmetric friendship link normalization
    ├── circles/
    │   └── plan.md               # Circle creator roles & group actions
    ├── create/
    │   └── plan.md               # Form step configurations & category validations
    ├── plans/
    │   └── plan.md               # Plan RSVPs, capacities, & waitlist lifecycles
    ├── notifications/
    │   └── plan.md               # Notifications filters, categories & triggers
    ├── chat/
    │   └── plan.md               # Circle chat channels & optimistic messaging
    ├── wallet/
    │   └── plan.md               # (Planned) Wallet transactions ledger
    └── home/
        └── plan.md               # Feed card stacks & hold-to-accept actions
```

---

## Feature Index

| Feature | Purpose | Status | Dependencies | Plan |
|---------|---------|--------|--------------|------|
| **Auth** | Sign-in, registration, OTP validation, and session preservation. | ✅ Active | Profile, Supabase | [plan.md](features/auth/plan.md) |
| **Profile** | User details (name, bio, avatar) and storage buckets. | ✅ Active | Auth, Supabase | [plan.md](features/profile/plan.md) |
| **Friendships** | Lexicographical connection entries. | ✅ Active | Profile, Supabase | [plan.md](features/friendships/plan.md) |
| **Circles** | Custom member groups and role permissions. | ✅ Active | Profile, Friendships | [plan.md](features/circles/plan.md) |
| **Create** | Plan creation step customization and validation. | ✅ Active | Circles, Friendships, Plans | [plan.md](features/create/plan.md) |
| **Plans** | Plan lifecycle, RSVPs, waitlist promotions, and realtime feeds. | ✅ Active | Create, Profile, Supabase | [plan.md](features/plans/plan.md) |
| **Notifications**| Category filters and plan invite action links. | ✅ Active | Plans, Profile | [plan.md](features/notifications/plan.md) |
| **Chat** | Threaded system alerts and realtime chat. | ✅ Active | Plans, Circles | [plan.md](features/chat/plan.md) |
| **Wallet** | Budget deposits, split debits, and balance calculations. | 📝 Pending Plan | Plans, Profile | [plan.md](features/wallet/plan.md) |
| **Home** | Card stack feeds, filters, and accept actions. | ✅ Active | Plans, Profile, Notifications | [plan.md](features/home/plan.md) |

---

## Dependency Graph

Feature dependencies represent data synchronization pipelines and access bounds rather than strict linear chains:

```
                    ┌──────────┐
                    │   Auth   │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ Profile  │
                    └────┬─────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
       ┌────▼────┐  ┌────▼────┐  ┌───▼──────┐
       │ Friends │  │ Circles │  │  Wallet   │
       └────┬────┘  └────┬────┘  └───┬──────┘
            │            │            │
            └──────┬─────┘            │
                   │                  │
              ┌────▼─────┐            │
              │  Create  │            │
              └────┬─────┘            │
                   │                  │
              ┌────▼─────┐            │
              │  Plans   │◄───────────┘
              └────┬─────┘
                   │
         ┌─────┬──┴───┬──────────┐
         │     │      │          │
    ┌────▼──┐ ┌▼────┐ ┌▼───────┐ ┌▼──────┐
    │ Chat  │ │Home │ │Notifs  │ │Wallet │
    └───────┘ └─────┘ └────────┘ └───────┘
```

---

## Documentation Rules

To ensure documentation remains unified and structured, every feature `plan.md` must follow the same documentation standard:

* **Overview**: The high-level purpose of the feature.
* **Current Functionality**: Explicit lists of currently implemented features.
* **User Flows**: Sequence layout of user interactions and state transitions.
* **Architecture**: Breakdown of Screens, Components, Hooks, Contexts, and Services.
* **Database**: Tables used, mappings, and database operations.
* **State Management**: Context states, local states, and realtime subscription feeds.
* **Dependencies**: Mapped list of dependencies.
* **Security**: RLS setups and permission rules.
* **Source Files**: Primary files list with their corresponding files paths.
* **Known Issues**: Factual bugs or constraints.
* **Technical Debt**: Refactoring opportunities or schema residues.
* **Future Roadmap**: Planned updates that align with feature priorities.
* **Maintenance Notes**: Living policy rules.

---

## Current Documentation Status

| Feature | Documentation Status |
|---------|----------------------|
| Auth | ✅ Complete |
| Profile | ✅ Complete |
| Friendships | ✅ Complete |
| Circles | ✅ Complete |
| Create | ✅ Complete |
| Plans | ✅ Complete |
| Notifications | ✅ Complete |
| Chat | ✅ Complete |
| Wallet | 📝 Pending Plan Creation |
| Home | ✅ Complete |

---

## Living Documentation Policy

* **Code Changes Trigger Documentation Updates**: Every feature PR, modification, or bugfix that alters feature behavior must update the corresponding `plan.md` in the same commit.
* **Introduction of Features Requires a Plan**: New feature folders added under `src/features/` must contain an initial `plan.md` structured according to the Documentation Rules.
* **Implementation Remains the Authority**: The actual codebase is the single source of truth. Documentation should reflect and clarify how the system works today, avoiding outdated descriptions.
