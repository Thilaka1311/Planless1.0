# Wallet

# 1. Product Vision

## Why the Wallet Exists

The Wallet exists to simplify shared expenses within a Circle.

Whenever one member pays on behalf of others, the Wallet automatically keeps track of who owes whom. Members no longer need to remember expenses, calculate balances manually, or ask each other how much they owe.

The Wallet provides a clear, accurate, and transparent record of outstanding balances between friends.

---

## Problem It Solves

Group activities often involve shared expenses such as sports bookings, restaurant bills, movie tickets, transportation, or other costs.

Without a dedicated system, members must manually calculate reimbursements, keep track of multiple payments, and repeatedly ask each other for updates.

The Wallet eliminates this friction by automatically recording shared expenses and maintaining the running balance between every pair of users.

Rather than displaying every payment equally, the Wallet focuses on the current financial relationship between users.

---

## Where the Feature Begins

The Wallet begins when a shared expense is created within a Plan.

Whenever one participant pays for other participants, the Wallet automatically calculates how much each member owes and updates the balances accordingly.

Users can also access the Wallet directly from the application to review their outstanding balances.

---

## Where the Feature Ends

The Wallet remains active until every outstanding balance has been settled.

As new shared expenses are created, existing balances are updated rather than creating disconnected records.

The Wallet continuously maintains each user's financial relationships across all Plans and Circles.

---

## Core Philosophy

The Wallet is relationship-based, not transaction-based.

The main Wallet screen should answer only two questions:

- **Who owes me?**
- **Who do I owe?**

If two users owe each other money across multiple expenses, the Wallet should automatically calculate the **net balance** and display only the final amount.

For example:

- Alice owes Bob ₹500.
- Bob owes Alice ₹200.

The Wallet should display:

**Alice owes Bob ₹300.**

The intermediate debts remain available in the Relationship Details screen, but the main Wallet always presents the net financial position between two users.

This keeps the experience simple, reduces clutter, and allows users to understand their financial obligations at a glance.

# 2. Core Responsibilities

The Wallet feature is responsible for tracking and maintaining financial balances between users across all shared expenses.

Its purpose is to provide a simple, transparent view of who owes whom without requiring users to manually calculate or remember payments.

---

## Balance Management

The Wallet automatically maintains the running balance between every pair of users.

Whenever a shared expense is created, updated, or settled, the Wallet recalculates the balances to reflect the current financial relationship.

Users should never have to perform manual calculations.

---

## Net Balance Calculation

The Wallet always displays the **net balance** between two users.

If two users owe each other money from different expenses, the balances should automatically offset each other.

For example:

- User A owes User B ₹800.
- User B owes User A ₹300.

The Wallet displays:

**User A owes User B ₹500.**

Only the final outstanding amount is shown on the Wallet home screen.

---

## Relationship-Based View

The Wallet organizes balances by person rather than by transaction.

The main Wallet screen displays one entry per user.

Each entry represents the complete financial relationship between the current user and that person.

Individual expenses are viewed only after selecting that relationship.

---

## Expense Attribution

Every balance must be traceable to its originating expense.

Each outstanding amount should always reference the Plan that created it.

This allows users to understand exactly why a balance exists without cluttering the Wallet home screen.

---

## Relationship Details

Selecting a user opens a detailed breakdown of all outstanding expenses contributing to the current balance.

This screen displays:

- The originating Plan.
- The Circle where the expense occurred.
- The expense amount.
- The participant's share.
- The current settlement status.

This provides complete transparency while keeping the main Wallet interface simple.

---

## Settlement Tracking

The Wallet tracks whether an expense has been settled.

Once an outstanding amount is settled, it no longer contributes to the net balance between the two users.

Historical settlement information may be retained for future features but does not appear as an active balance.

---

## Handoff

The Wallet feature owns only financial balances and settlements.

It does **not** create or manage:

- Plans
- Payments
- Circle membership
- User profiles
- Notifications

Instead, it consumes information from these features while remaining responsible for calculating, maintaining, and presenting the financial relationships between users.

# 3. Wallet Structure

The Wallet is built around financial relationships between users rather than individual transactions.

Instead of displaying every expense on the main screen, the Wallet summarizes the net balance between users while allowing each relationship to be explored in detail.

---

## Wallet Home

The Wallet home provides a high-level overview of the user's outstanding balances.

It is divided into two sections:

- **You Owe**
- **You Are Owed**

Each section displays a list of users along with the current net balance between the current user and that person.

Only users with an outstanding balance appear in these sections.

---

## Net Balances

Each relationship displays only the final net amount.

If two users owe each other money across multiple expenses, the Wallet automatically offsets those amounts.

For example:

- You owe Alex ₹500.
- Alex owes you ₹200.

The Wallet displays:

**You owe Alex ₹300.**

This keeps the Wallet simple and prevents duplicate entries for the same person.

---

## Relationship Details

Selecting a user opens a dedicated Relationship Details screen.

This screen is designed as a clean activity timeline rather than a ledger. It features a prominent Relationship Header displaying the friend's avatar, name, and the net balance (+/-) as the single source of truth.

Below the header, the Expense Timeline displays outstanding expenses as a clean list of horizontal rows, showing:

- Date (e.g., Jul 05)
- Plan cover image
- Plan title and Circle name grouped together
- Participant's outstanding share amount (e.g., +₹100 or -₹250)

Selecting a row opens the existing Expense Details modal. This provides complete transparency without overwhelming the Wallet home screen.

---

## Expense Ownership

Every outstanding balance originates from a shared expense.

Each expense belongs to:

- One Plan
- One Circle
- One payer
- One or more participants

The Wallet calculates each participant's outstanding amount from these expenses and aggregates them into the relationship balance.

---

## Balance Updates

The Wallet updates automatically whenever:

- A new shared expense is created.
- An existing expense is edited.
- A participant is added or removed from an expense.
- A payment is settled.

The displayed net balance always reflects the latest state of all outstanding expenses.

---

## Lifetime

The Wallet persists independently of individual Plans.

Even after a Plan has been completed, its outstanding expenses continue to exist until they have been settled.

A balance is removed from the Wallet only when every contributing expense between the two users has been fully settled.

This ensures the Wallet always represents the true financial relationship between users, regardless of when or where the expenses were created.

# 4. Business Rules

The Wallet feature maintains a consistent and transparent record of financial relationships between users.

All balances and settlements must comply with the following business rules.

---

## Financial Relationships

The Wallet maintains balances between pairs of users.

Every outstanding amount belongs to a financial relationship between exactly two users.

A relationship may contain one or many outstanding expenses.

---

## Net Balance

The Wallet always displays the net balance between two users.

If both users owe each other money, the Wallet offsets the amounts automatically and displays only the remaining balance.

The Wallet must never display duplicate entries for the same user.

---

## Outstanding Balances

Only unsettled expenses contribute to the Wallet balance.

Once an expense has been fully settled, it is removed from the active balance calculation.

Historical settlement information may be retained but does not appear in the active Wallet.

---

## Expense Attribution

Every outstanding balance must originate from a valid shared expense.

Each outstanding amount must always be traceable to:

- A Plan
- A Circle
- A payer
- One or more participants

The Wallet must never create balances that are not backed by an actual expense.

---

## Balance Calculation

Whenever a shared expense changes, the Wallet automatically recalculates all affected balances.

Examples include:

- Creating a new expense.
- Editing an existing expense.
- Removing an expense.
- Adding or removing participants.
- Settling an expense.

Users should never need to manually refresh or recalculate their balances.

---

## Relationship Details

Every balance displayed on the Wallet home screen must be explainable.

Selecting a relationship should display every outstanding expense contributing to the current balance.

The sum of those outstanding expenses must always equal the net balance shown on the Wallet home screen.

---

## Source of Truth

The database is the single source of truth for all Wallet balances.

The Wallet should derive its information from persisted expense records rather than storing manually editable balances.

Any change to an expense should automatically be reflected in the corresponding financial relationships.

---

## Data Integrity

The Wallet must always remain internally consistent.

At any point:

- Every outstanding balance must be backed by one or more unsettled expenses.
- Every expense must belong to a valid Plan.
- Every balance must be associated with valid users.
- The displayed net balance must accurately represent the sum of all outstanding obligations between two users.

# 5. Wallet System Composition

The Wallet feature is composed of four core parts that work together to maintain accurate financial relationships between users.

---

## Relationship Summary

Provides a high-level overview of every financial relationship.

The Wallet Home organizes balances into:

- **You Owe**
- **You Are Owed**

Each user appears only once, displaying the current net balance between the two users.

This serves as the primary entry point into the Wallet.

---

## Net Balance Engine

Calculates the financial relationship between two users.

Rather than displaying every individual expense on the Wallet Home, it aggregates all outstanding expenses and computes a single net balance.

Whenever an expense is created, updated, or settled, the balance is automatically recalculated to ensure the displayed amount always reflects the latest financial relationship.

---

## Relationship Details

Provides a detailed breakdown of the balance between two users.

Selecting a user from the Wallet Home opens the Relationship Details screen, which displays every outstanding expense contributing to the current balance.

Each entry explains why the balance exists while maintaining complete transparency.

---

## Settlement Management

Tracks the settlement state of outstanding expenses.

When an expense is settled, it is removed from the active balance calculation, and the financial relationship is recalculated automatically.

This ensures the Wallet always reflects only outstanding obligations.

---

## Feature Interaction

These components work together as a single financial management experience:

1. **Settlement Management** records changes to shared expenses.
2. The **Net Balance Engine** recalculates the financial relationship between affected users.
3. The **Relationship Summary** updates the Wallet Home to display the latest net balances.
4. Selecting a relationship opens **Relationship Details**, allowing users to understand exactly which expenses contribute to the displayed balance.

This architecture keeps the Wallet Home simple while providing complete transparency whenever users need additional detail.

# 6. State Management

The Wallet feature manages the state required to calculate, display, and maintain financial relationships between users.

The Wallet always reflects the latest outstanding balances derived from shared expenses.

---

## Wallet Summary State

Stores the list of financial relationships for the current user.

This state includes:

- Users who owe the current user.
- Users the current user owes.
- The current net balance for each relationship.

This state is:

- Created when the Wallet is opened.
- Updated whenever balances change.
- Cleared when the user leaves the Wallet.

---

## Relationship State

Stores the currently selected financial relationship.

This state contains all outstanding expenses between the current user and the selected user.

It is:

- Created when a relationship is opened.
- Updated whenever one of the underlying expenses changes.
- Cleared when the user exits the Relationship Details screen.

---

## Balance State

Maintains the calculated net balance for every relationship.

Whenever a shared expense is created, updated, or settled, the affected balances are automatically recalculated.

The Wallet never stores manually editable balances.

Instead, every displayed balance is derived from the current outstanding expenses.

---

## Settlement State

Tracks whether an individual expense has been settled.

Settled expenses no longer contribute to the active Wallet balance.

Any settlement immediately updates the affected financial relationships.

---

## State Synchronization

The Wallet keeps all financial relationships synchronized with the latest expense data.

Whenever an expense changes, the Wallet automatically updates:

- Wallet Home
- Relationship Details
- Net balances

This ensures every screen displays the same financial information.

---

## State Sharing

The Wallet consumes shared state provided by other features.

It relies on:

- **Authentication** to identify the current user.
- **Plans** to determine where expenses originated.
- **Circles** to provide context for each expense.
- **User Profiles** to display user names and profile photos.

The Wallet does not own or modify these states.

It consumes them to calculate and present accurate financial relationships between users.

# 7. Realtime Synchronization

The Wallet feature keeps financial relationships synchronized with the latest shared expenses, ensuring users always see accurate balances.

## Balance Synchronization

Whenever a shared expense is created, updated, or settled, the Wallet automatically recalculates the affected financial relationships.

Updated balances should appear without requiring the user to manually refresh the Wallet.

---

## Relationship Updates

The Wallet continuously responds to changes affecting financial relationships, including:

- New shared expenses.
- Expense edits.
- Expense settlements.
- Participant additions.
- Participant removals.

Only the relationships affected by these changes should be recalculated.

---

## Wallet Synchronization

The Wallet Home and Relationship Details screen should always remain synchronized.

If a balance changes while the user is viewing either screen, the updated information should be reflected automatically.

The net balance and the underlying expense breakdown must always remain consistent.

---

## Active Relationship Synchronization

When a user is viewing a Relationship Details screen, any changes to the outstanding expenses between those two users should be reflected immediately.

The expense list and the displayed net balance should update together to maintain consistency.

---

## Consistency

The database is the single source of truth for all Wallet information.

Every user's Wallet should display balances calculated from the same underlying expense records.

The Wallet should never rely on locally maintained balances that can become inconsistent with the database.

This ensures that every user always sees an accurate representation of their outstanding financial relationships.

# 8. Architecture

The Wallet feature is built around a centralized balance management system that continuously maintains financial relationships between users.

Rather than storing manually editable balances, the Wallet derives all financial information from shared expenses created within Plans.

---

## Architectural Components

The feature consists of the following primary components:

- **Wallet Coordinator** — Loads the current user's Wallet, manages navigation between the Wallet Home and Relationship Details, and coordinates the overall Wallet experience.
- **Balance Engine** — Calculates the net financial relationship between users based on all outstanding shared expenses.
- **Relationship Service** — Retrieves relationship summaries and detailed expense breakdowns from the database.
- **Settlement Engine** — Updates balances whenever expenses are settled, edited, or modified.
- **Database Layer** — Stores shared expenses, participant obligations, settlements, and relationship data as the permanent source of truth.

---

## Component Interaction

The Wallet follows a centralized balance architecture:

1. A shared expense is created or updated within a Plan.
2. The **Settlement Engine** records the financial obligations created by that expense.
3. The **Balance Engine** recalculates the affected relationships.
4. The **Relationship Service** retrieves the updated balances.
5. The **Wallet Coordinator** updates the Wallet Home and Relationship Details screens.
6. Users always see the latest net balances without performing manual calculations.

---

## Integration with the Application

The Wallet integrates closely with several core platform features.

It relies on:

- **Authentication** to identify the current user.
- **Plans** as the source of shared expenses.
- **Circles** to provide context for each expense.
- **User Profiles** to display participant information.

The Wallet does not manage these features directly.

Instead, it consumes their data while remaining solely responsible for maintaining financial relationships.

---

## Architectural Principles

- **Relationship-Based Accounting** — Financial relationships exist between users rather than between isolated transactions.
- **Net Balance First** — The Wallet Home displays only the final amount owed between two users.
- **Expense Transparency** — Every displayed balance can be traced back to the individual expenses that created it.
- **Database as Source of Truth** — All balances are derived from persisted expense records rather than manually maintained values.
- **Automatic Recalculation** — Any change to a shared expense immediately updates the affected financial relationships.
- **Separation of Responsibilities** — The Wallet manages balances and settlements only, while Plans remain responsible for creating shared expenses and Circles remain responsible for membership.

# 9. Design Principles

The Wallet feature is designed around the following principles.

### Relationship First

The Wallet should focus on financial relationships rather than individual transactions.

Users should immediately understand who they owe and who owes them without being overwhelmed by every expense.

---

### Net Balance

The Wallet Home should always display the net balance between two users.

If multiple shared expenses exist in both directions, they should automatically offset one another to present a single, clear amount.

This reduces clutter and simplifies financial tracking.

---

### Transparency

Every balance shown in the Wallet must be explainable.

Users should always be able to open a relationship and view the individual expenses contributing to the displayed amount.

Nothing should appear as a "magic number."

---

### Automatic Accounting

Users should never manually calculate balances.

The Wallet should automatically maintain financial relationships whenever expenses are created, modified, or settled.

The system should perform all calculations consistently and accurately.

---

### Persistent Financial History

Outstanding balances should persist independently of the lifecycle of a Plan.

Completing or cancelling a Plan should not remove unpaid expenses.

Financial obligations remain active until they have been settled.

---

### Consistent Experience

Every user involved in a shared expense should see the same financial relationship.

The Wallet should present consistent balances derived from the same underlying expense records, ensuring all participants have a shared understanding of outstanding obligations.

---

### Clear Separation of Responsibilities

The Wallet is responsible only for calculating and presenting financial relationships.

It does not manage:

- Plans
- Circle membership
- Payments
- User profiles
- Notifications

Instead, it consumes information from these features while remaining focused solely on maintaining accurate balances between users.

# 10. Source Files

### `apps/app/src/features/wallet/screens/WalletScreen.tsx`

Acts as the primary entry point for the Wallet feature.

It is responsible for:

- Loading the current user's Wallet.
- Displaying the "You Owe" and "You Are Owed" sections.
- Displaying the overall net balance.
- Navigating to Relationship Details.
- Rendering empty states when no outstanding balances exist.

---

### `apps/app/src/features/wallet/screens/RelationshipDetailsScreen.tsx`

Displays the complete financial relationship between the current user and another user.

It is responsible for:

- Displaying the selected user's information and net relationship balance in the header.
- Listing every outstanding expense contributing to the balance as a clean horizontal timeline row.
- Displaying the date, cover image, plan info, and the individual outstanding share amount.
- Navigating to the plan's details modal when clicked.
- Keeping the relationship details synchronized with the latest database records.

---

### `apps/app/src/features/wallet/components/WalletRelationshipCard.tsx`

Represents a single relationship on the Wallet Home.

Each card displays:

- User profile photo.
- User name.
- Net balance.
- Whether the current user owes money or is owed money.

Selecting the card opens the Relationship Details screen.

---

### `apps/app/src/features/wallet/components/ExpenseBreakdownCard.tsx`

Represents an individual outstanding expense within a relationship.

Each card displays:

- Plan name.
- Circle name.
- Date.
- Expense amount.
- User's share.
- Outstanding amount.
- Settlement status.

The component provides transparency into how the relationship balance is calculated.

---

### `apps/app/src/features/wallet/services/walletService.ts`

Owns communication with the backend.

Responsibilities include:

- Loading Wallet relationships.
- Calculating net balances.
- Retrieving relationship details.
- Retrieving outstanding expenses.
- Synchronizing balance updates.
- Managing settlement data.

Business logic for balance calculation and Wallet retrieval should remain inside this service rather than UI components.

---

### File Relationships

The Wallet feature is coordinated by `WalletScreen.tsx`, which manages the overall Wallet experience.

`WalletRelationshipCard.tsx` renders the summarized financial relationships shown on the Wallet Home.

Selecting a relationship opens `RelationshipDetailsScreen.tsx`, where `ExpenseBreakdownCard.tsx` displays every outstanding expense contributing to the current balance.

`walletService.ts` acts as the communication layer between the application and the database, ensuring that balances are accurately calculated, synchronized, and presented consistently throughout the Wallet.

Together, these components provide a relationship-based financial system that automatically maintains outstanding balances between users while keeping the experience simple, transparent, and easy to understand.