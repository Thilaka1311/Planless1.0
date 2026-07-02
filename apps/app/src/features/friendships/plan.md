# 5. Friendships

# 1. Product Vision

## Why does the Friendship feature exist?

The Friendship feature exists to help people stay connected after meeting through shared experiences on Planless.

Rather than encouraging users to build a social network before participating in activities, friendships naturally grow from real interactions. Once users meet through plans or circles, they can easily connect and continue organizing future activities together.

---

## What problem does it solve?

Without friendships, users would need to repeatedly invite the same people using external messaging platforms or recreate participant lists for every activity.

The Friendship feature provides a lightweight way to maintain long-term connections with people met through Planless, making future planning faster and more personal.

---

## What is the primary responsibility of the Friendship feature?

The primary responsibility of the Friendship feature is to manage the social relationships between users.

It is responsible for creating, maintaining, and removing friendships while providing a simple way for users to reconnect for future activities.

The feature intentionally avoids complex social networking concepts such as friend requests, followers, or public discovery.

---

## Where does the Friendship feature begin?

The Friendship feature takes ownership when a user chooses to add another user as a friend.

From that point onward, it manages the friendship relationship between both users.

---

## Where does the Friendship feature end?

The Friendship feature remains responsible for the relationship until one of the users removes the friendship.

Removing a friendship only removes the relationship between the two users.

It does not affect previous plans, circles, memories, or chat history shared between them.

# 2. Core Responsibilities

## Exclusive Responsibilities

The Friendship feature is responsible for managing social relationships between users within Planless.

Its responsibilities include:

- Creating friendships between users.
- Maintaining each user's friends list.
- Removing friendships.
- Providing friend information to other features.
- Generating friendship notifications when users are added.

---

## Delegated Responsibilities

The Friendship feature delegates responsibilities to other features where appropriate.

- **Plans** is responsible for introducing users through shared activities.
- **Circles** is responsible for bringing members together in persistent communities.
- **Notifications** is responsible for informing users when someone adds them as a friend.
- **Profile** is responsible for displaying a user's friends and friendship information.
- **Home** and **Create** consume the friends list when inviting people to plans.

---

## Feature Boundaries

The Friendship feature owns only the relationship between two users.

It does not manage:

- Friend conversations.
- Shared plans.
- Shared circles.
- User profiles.
- Invitations to plans.
- Notifications.
- Messaging.

Those responsibilities remain with their respective features.

---

## Friendship Philosophy

Friendships are intentionally lightweight.

Users become friends immediately when one user chooses to add another.

There are no friend requests, pending states, or approval workflows.

The friendship remains active until either user chooses to remove it.

Removing a friendship only removes the relationship between the two users.

It never affects previous plans, circles, chats, or memories shared between them.

# 3. Business Rules

The following rules govern how friendships are created and maintained within Planless.

---

## Friendship Creation

### Add Friend

**The Rule:** A user can add another user as a friend by tapping the **Add Friend** button on their profile.

**Why it exists:** Allows users to stay connected after meeting through activities on Planless.

**Result:** Both users immediately become friends.

A notification is sent to the other user informing them that they have been added as a friend.

No confirmation or approval is required.

---

## Friendship Visibility

### Friends List

**The Rule:** Once two users become friends, they appear in each other's Friends list.

**Why it exists:** Allows users to easily invite each other to future plans and circles.

---

## Friendship Removal

### Remove Friend

**The Rule:** Either user can remove the friendship at any time.

**Why it exists:** Gives every user complete control over their own Friends list.

**Result:** The friendship is immediately removed from both users' Friends lists.

Removing a friendship does not affect:

- Previous plans.
- Circle memberships.
- Memories.
- Chat history.

---

## Notifications

### Friend Added Notification

**The Rule:** When a friendship is created, the other user receives a notification informing them that they have been added as a friend.

**Why it exists:** Keeps users informed about new social connections within Planless.

The notification is informational only and does not require any action.

---

## Eligibility

### Who Can Be Added

A user can only add people whose profile is accessible through a shared Plan, Circle, or other in-app interaction.

Examples include:

- Participants in the same plan.
- Members of the same Circle.
- Users whose profiles are accessible through shared activities.

**Why it exists:** Ensures friendships are built through real interactions rather than random user discovery.

---

## Friendship Lifetime

A friendship remains active until one of the users removes it.

There are no pending requests, acceptance flows, expiration dates, or automatic removals.

Friendships persist independently of future plans, circles, or activities.

# 4. User Journey

## Meeting New People

Users naturally meet other people by participating in plans and joining circles.

Whenever a user views another participant's profile, they have the option to add them as a friend.

Friendships are intended to grow from real-world interactions rather than through user discovery.

---

## Adding a Friend

While viewing another user's profile, the user taps the **Add Friend** button.

The friendship is created immediately.

Both users instantly become friends and appear in each other's Friends lists.

The other user receives a notification informing them that they have been added as a friend.

No approval or confirmation is required.

---

## Viewing Friends

Users can access their Friends list from their profile.

The Friends list provides a quick overview of everyone they have connected with through Planless.

From the Friends list, users can:

- View a friend's profile.
- Invite friends to plans.
- Invite friends to circles.
- Remove friends.

---

## Using Friendships

Once two users become friends, other features throughout Planless can use this relationship.

Examples include:

- Inviting friends to new plans.
- Inviting friends to circles.
- Viewing shared activities.
- Quickly finding familiar people when creating plans.

Friendships simplify future coordination but do not change how plans or circles function.

---

## Removing a Friend

A user can remove a friend at any time from that friend's profile.

Removing a friendship immediately removes both users from each other's Friends lists.

The removal affects only the friendship relationship.

Previous plans, circles, memories, and chat history remain unchanged.

---

## Continuing the Relationship

Even after a friendship is removed, both users may continue participating in the same plans or circles if they are invited.

Friendship only controls the social relationship and convenience features within Planless.

It does not prevent future interactions between users.

# 5. Friendship Object Composition

A friendship represents a mutual relationship between two users within Planless.

It enables users to reconnect, invite one another to future activities, and maintain long-term social connections.

---

## Connected Users

Defines the two users that make up the friendship.

**Information**

- User A
- User B

**Required**

Yes

Every friendship always connects exactly two users.

---

## Friendship Status

Represents whether the friendship currently exists.

**Information**

- Active
- Removed

**Required**

Yes

An active friendship exists until one of the users removes it.

---

## Created Information

Stores when the friendship was established.

**Information**

- Created date
- Created time

**Required**

Yes

This information provides historical context for the relationship.

---

## Shared Context

Represents how users became connected within Planless.

Examples include:

- Shared plans.
- Shared circles.

This information provides context for the friendship but does not affect the friendship itself.

**Required**

No

---

## Notifications

Represents the notification generated when a friendship is created.

**Information**

- Friend added notification

**Required**

No

Notifications are managed by the Notifications feature and are not owned by the Friendship feature.

---

## Relationship Lifecycle

A friendship begins when one user taps **Add Friend**.

The friendship remains active until either user removes it.

Removing a friendship only removes the relationship.

It does not affect:

- Previous plans.
- Circle memberships.
- Memories.
- Chat history.

# 6. State Management

## Owned State

The Friendship feature owns all state required to manage friendship relationships between users.

### Friends List

Stores every active friendship belonging to the current user.

The Friends list is the primary source of friendship information throughout Planless.

It is used by other features when inviting friends to plans and circles.

---

### Friendship Relationship

Stores the relationship between two users.

Each relationship records:

- The connected users.
- Friendship status.
- Creation information.

The Friendship feature owns the lifecycle of these relationships.

---

## Shared State Consumed

The Friendship feature consumes information owned by other features.

This includes:

- Authenticated user.
- User profiles.
- Plans.
- Circles.
- Notifications.

The Friendship feature references this information but does not own it.

---

## Derived State

The Friendship feature derives additional information from owned state.

Examples include:

- Total friends.
- Mutual friends.
- Mutual circles.
- Mutual plans.
- Recently added friends.

Derived information updates automatically whenever friendships or related features change.

---

## State Reset

The Friendship feature resets transient UI state when:

- The user signs out.
- The active profile changes.
- The Friends screen is refreshed.

Persistent friendship relationships remain unchanged unless one of the users removes the friendship.

# 7. Realtime Synchronization

The Friendship feature keeps friendship relationships synchronized across all devices belonging to a user.

Changes to friendships are reflected immediately throughout Planless, ensuring every feature has access to the latest Friends list.

---

## Friendship Creation

When a user adds another user as a friend, the friendship is created immediately.

Both users' Friends lists are updated automatically.

The newly added friend becomes available throughout the application without requiring a manual refresh.

---

## Friendship Removal

When either user removes the friendship, the relationship is immediately removed.

Both users' Friends lists update automatically.

The removed friend immediately disappears from friend selectors, invitation lists, and other friendship-dependent interfaces.

---

## Notification Delivery

When a friendship is created, the other user receives a notification informing them that they have been added as a friend.

The notification is synchronized across the recipient's devices.

Notification delivery is owned by the Notifications feature.

---

## Cross-Feature Synchronization

Friendship updates automatically propagate to features that consume friendship information.

Examples include:

- Create (friend invite selector).
- Circles (member invitations).
- Profile (Friends list).
- Home (friend-based recommendations, if applicable).

These features always use the latest friendship information.

---

## Recovery

When a user reconnects after being offline or signs in on another device, the Friendship feature synchronizes the latest friendship relationships.

Recovery ensures that every device reflects the same Friends list.

---

## Consistency

The Friendship feature maintains a single shared friendship relationship between two users.

Any change to that relationship is reflected consistently across all connected devices and throughout every feature that consumes friendship data.

# 8. Architecture

The Friendship feature provides the relationship layer of Planless.

It manages long-term social connections between users, allowing people who have met through shared activities to stay connected and easily organize future experiences together.

---

## Presentation Layer

The presentation layer is responsible for displaying friendship information and providing friendship actions.

It allows users to:

- View their Friends list.
- View a friend's profile.
- Add friends.
- Remove friends.
- Select friends when creating plans or inviting members to Circles.

The presentation layer focuses on making friendship interactions simple, discoverable, and consistent throughout the application.

---

## Business Logic Layer

The business logic layer manages the lifecycle of friendships.

Its responsibilities include:

- Creating friendships.
- Removing friendships.
- Validating friendship eligibility.
- Preventing duplicate friendships.
- Synchronizing friendship relationships across the application.

It ensures that friendship relationships remain consistent regardless of where they are created.

---

## State Management Layer

The state management layer owns all friendship relationships.

It manages:

- Friends list.
- Friendship records.
- Friendship status.
- Friendship metadata.

It also provides friendship information to other features that depend on social relationships.

---

## Shared Utilities

The Friendship feature uses shared utilities that support relationship management without owning application state.

These utilities provide reusable functionality such as searching users, formatting profile information, and validating friendship actions.

---

## Feature Dependencies

The Friendship feature integrates with other application features through clearly defined ownership boundaries.

It consumes authentication and profile information to identify users.

It consumes Plans and Circles to provide context for how users met.

It provides friendship information to Create for inviting friends to plans.

It provides friendship information to Circles for inviting members.

It integrates with Notifications to inform users when they have been added as a friend.

Each feature retains ownership of its own responsibilities while using friendship relationships where appropriate.

# 9. Design Principles

The Friendship feature is designed to make building social connections effortless.

Friendships should emerge naturally from real-world interactions and remain simple to understand throughout the product.

---

## Friendships Through Experiences

Friendships are created because people have shared experiences together.

Planless encourages users to connect after participating in activities rather than before.

The Friendship feature exists to strengthen relationships that already began through Plans and Circles.

---

## Simplicity First

Creating a friendship should require minimal effort.

Adding a friend is a single action.

There are no friend requests, approval workflows, or pending states.

The experience should always feel immediate and frictionless.

---

## User Control

Every user has complete control over their Friends list.

Users can remove friendships at any time without affecting previous activities, conversations, or communities.

Removing a friendship only removes the relationship between the two users.

---

## Relationships Without Complexity

The Friendship feature intentionally avoids unnecessary social networking mechanics.

It does not include:

- Followers.
- Following.
- Friend requests.
- Acceptance workflows.
- Friend levels.
- Popularity metrics.

The focus remains on helping users reconnect for future activities rather than building a traditional social network.

---

## Consistency Across Planless

Friendships should behave consistently throughout the application.

Every feature that uses friendship information should rely on the same relationship model.

Whether inviting friends to plans, adding members to Circles, or viewing profiles, friendships should always feel predictable and familiar.

---

## Privacy

Friendships belong only to the two users involved.

Creating or removing a friendship should not publicly broadcast the relationship.

Users control who they remain connected with, and friendship changes should only affect features that rely on the Friends list.

---

## Real Connections

The Friendship feature is built around genuine human interactions.

People meet through activities.

Activities become friendships.

Friendships make future activities easier to organize.

The feature exists to strengthen real-world relationships rather than encourage social networking for its own sake.