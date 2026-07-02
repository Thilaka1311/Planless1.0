# Circles

# 1. Product Vision

## Why does the Circles feature exist?

The Circles feature exists to provide a persistent home for groups of people who regularly spend time together.

Instead of recreating the same participant list for every activity, users can organize themselves into long-lived communities where conversations, members, and activities remain connected over time.

A Circle represents a real-world group, such as a football team, a college friend group, a movie club, or a family.

---

## What problem does it solve?

Planning recurring activities in the same group often leads to fragmented conversations and repeated setup.

The Circles feature solves this by giving every group:

- A permanent membership.
- A single shared conversation chat.
- A shared space where multiple plans can be created over time.

Instead of every plan existing in isolation with its own chat channel, conversations belong directly to the Circle community.

---

## What is the primary responsibility of the Circles feature?

The primary responsibility of the Circles feature is to provide a persistent collaborative space where members can communicate and organize activities.

Circles own the community.

Plans own individual events.

---

## Where does the Circles feature begin?

The Circles feature takes ownership when a user creates or joins a Circle.

From that point onward, it manages the group's members, conversations, settings, and collection of plans.

---

## Where does the Circles feature end?

The Circles feature remains responsible for the community throughout its lifetime.

Individual plans created inside a Circle are delegated to the Plans feature for lifecycle management.

When those plans are completed or cancelled, their outcomes are delegated to the Memories feature, while the Circle continues to exist as the persistent home of the community.

# 2. Core Responsibilities

## Exclusive Responsibilities

The Circles feature is responsible for managing persistent communities within Planless.

Its responsibilities include:

- Creating and managing circles.
- Managing circle identity (name, description, image).
- Managing circle membership.
- Managing member roles and permissions.
- Providing a single shared chat for every circle.
- Organizing plans created within the circle.
- Managing circle settings and administration.
- Managing invitations and membership requests.

---

## Delegated Responsibilities

The Circles feature delegates responsibility for individual activities to other features.

- **Create** is responsible for creating new plans within a circle.
- **Plans** is responsible for the complete lifecycle of every plan, including RSVPs, participant management, waitlists, team assignments, editing, completion, and cancellation.
- **Memories** is responsible for preserving completed activities, ratings, scores, and post-plan experiences.
- **Notifications** is responsible for delivering invitations, updates, and alerts related to circles and plans.

---

## Feature Boundaries

The Circles feature owns the community, not the activities themselves.

A circle may contain zero, one, or many plans.

Each plan created within a circle becomes an independent entity managed by the Plans feature while remaining associated with its parent circle.

The Circles feature continues to exist regardless of whether it currently contains active plans.

Deleting, completing, or cancelling a plan never deletes the circle itself.

The shared Circle chat is permanent and serves as the single source of chat communication. Plans do not own conversations.

# 3. Circle Structure

A Circle is a persistent community that serves as the home for its members, conversations, and activities.

Every Circle follows the same organizational structure:

---

## Single Shared Chat

Every Circle contains exactly one permanent shared chat.

This chat is the central conversation for the entire Circle. Members can discuss anything within this conversation, including upcoming plans, completed plans, announcements, or general discussion.

It is always available and cannot be archived or deleted.

---

## Plans

A Circle can contain zero, one, or many plans.

Each plan represents an individual activity being organized within the Circle.

Selecting a plan opens the details of the Plan itself, but conversations about that plan continue inside the single shared Circle chat. There are no separate Plan Chats, no Archived Plan Chats, and no channel hierarchy.

---

## Members

Every Circle maintains a list of its members.

Members remain part of the Circle independently of any individual plan.

Joining or leaving a plan does not affect Circle membership.

---

## Settings

Every Circle includes a settings area used to manage the community.

Settings include:

- Circle information.
- Member management.
- Roles and permissions.
- Circle preferences.
- Administrative controls.

Settings affect the Circle itself and never modify individual plans.

# 4. Business Rules

The following rules govern the lifecycle and behavior of every Circle.

---

## Circle Creation

A Circle can only be created by an authenticated user.

The creator automatically becomes the Circle Host.

Every newly created Circle starts with:

- A host.
- A single shared conversation chat.
- An empty collection of plans.

---

## Membership

A user can belong to multiple Circles.

A Circle can contain multiple members.

Membership in a Circle is independent of participation in any individual plan.

Joining or leaving a plan never adds or removes a user from the Circle.

---

## Single Chat Rule

Every Circle contains exactly one conversation chat.

The shared chat always exists while the Circle exists. It cannot be archived, deleted, or replaced.

There are no separate plan-specific chats or archived chat channels.

---

## Plan Association

A Circle may contain zero, one, or many plans.

Every plan created inside a Circle belongs to exactly one Circle.

Plans belong to the Circle; they do not own separate chat channels.

---

## Circle Lifetime

A Circle continues to exist regardless of whether it contains active plans.

Completing, cancelling, or deleting plans never deletes the Circle.

A Circle can exist indefinitely without any active plans.

---

## Host Role

Every Circle must always have exactly one Host.

Host status can be transferred to another eligible member.

A Circle can never exist without a Host.

---

## Permissions

Administrative actions within a Circle are governed by member roles.

Only members with sufficient permissions can:

- Edit Circle information.
- Manage members.
- Manage roles.
- Configure Circle settings.
- Transfer Host role.

Regular members cannot perform administrative actions.

---

## Deletion

A Circle can only be deleted by its Host.

Deleting a Circle removes the Circle itself and all Circle-specific resources.

Individual plans are governed by the Plans feature and follow their own lifecycle rules.

## Roles

Every Circle member belongs to exactly one role.

The available roles are:

- host
- co_host
- member

The Host is the highest authority within the Circle, owning absolute permissions.

Co-hosts assist with managing the community, editing Circle info, and inviting/removing members, but cannot remove or replace the Host, demote other Co-hosts, or delete the Circle.

Members participate in the Circle chat and plans but do not have administrative privileges. They can invite friends to join if allowed by settings.

- **Circle Image & Group Photo**: A Circle has a persistent group image represented in code across `groupPhoto`, `groupImage`, or `cover_image` fields. During plan creation or editing, if a plan is associated with this Circle, the Host can choose to use this group photo as the plan's cover image.
- **Circle Plan Cover Images**: All preview cards or plan details shown within the Circle's "Plans" tab render the cover image using the `plans.cover_image` column from the database as the single source of truth, consistent with the rest of the application.

---

## Host

Every Circle has exactly one Host.

The Host role is assigned automatically when the Circle is created.

The Host role can be transferred to another eligible Co-host.

A Circle can never exist without a Host.

---

## Co-hosts

A Circle may have zero, one, or many Co-hosts.

Co-hosts assist the Host in managing the Circle.

The Host can promote Members to Co-hosts and demote Co-hosts back to Members.

---

## Members

Members are standard participants within the Circle.

Members can participate in the Circle chat and plans but cannot perform administrative actions.

# 5. User Journey

## Primary Circle Navigation

A Circle opens into its main screen with two primary sections toggleable at the top:

- **Chat**: Displays the Circle's single shared conversation.
- **Plans**: Displays all active and upcoming plans associated with that Circle.

---

## Creating a Circle

The user creates a new Circle by providing its identity and inviting members.

Once created, the Circle becomes a permanent community. The creator automatically becomes the Circle Host.

---

## Joining a Circle

A user joins a Circle after accepting an invitation.

Once they become a member, they gain access to:

- The single shared Circle Chat.
- The Circle Plans view.
- Circle members.
- Circle information and settings.

Membership continues until the user leaves or is removed from the Circle.

---

## Daily Communication

Members communicate exclusively through the single shared Circle Chat.

The chat serves as the central place for everyday conversations, planning ideas, announcements, and coordination of all current or completed activities.

---

## Creating Activities

Any member with sufficient permissions can create a new plan within the Circle.

Creating a plan adds the activity to the Circle's Plans. Selecting a plan opens the Plan details, but all discussions and coordination continue in the shared Circle Chat.

---

## Participating in Plans

Members can join, leave, or participate in Circle plans independently.

Participation in a plan does not affect Circle membership.

A member can belong to the Circle even if they are not participating in any current plans.

---

## Long-Term Community

Over time, the Circle becomes the permanent home for its members.

The shared chat remains active, and the Plans tab maintains the list of upcoming and completed activities.

# 6. Circle Object Composition

A Circle is composed of the following configurable information. All information is managed by the Circle Host and Co-hosts according to their permissions.

---

## Identity

Defines the Circle itself.

**Information**

- Circle name
- Description
- Circle image

**Required**

- Name: Required
- Description: Optional
- Image: Optional

---

## Membership

Defines who belongs to the Circle.

**Information**

- Members
- Member count

**Required**

Yes

---

## Roles

Defines the permissions of each member.

**Information**

- Host
- Co-hosts
- Members

**Required**

Yes

---

## Shared Chat

The single conversation space for the Circle.

**Information**

- Messages
- Media
- Shared content
- System events

**Required**

Yes

---

## Plans Collection

Represents the collection of plans currently associated with the Circle.

**Information**

- Active plans
- Plan status

**Required**

No

---

## Settings

Defines the configuration of the Circle.

**Information**

- Circle information
- Member management
- Role management
- Administrative preferences

**Required**

Yes

# 7. Member Roles & Permissions

Every member of a Circle belongs to one of three roles.

Roles determine the actions a member can perform within the Circle.

---

## Host

The Host is the highest authority within the Circle.

There is exactly one Host for every Circle.

### Permissions

The Host can:

- Edit the Circle's identity.
- Manage Circle settings.
- Invite members.
- Remove members.
- Promote Members to Co-hosts.
- Demote Co-hosts to Members.
- Transfer the Host role.
- Delete the Circle.
- Create plans within the Circle.
- Participate in the Circle chat.

---

## Co-host

Co-hosts help manage the Circle.

A Circle may have zero, one, or many Co-hosts.

### Permissions

Co-hosts can:

- Invite members.
- Remove Members.
- Create plans within the Circle.
- Participate in the Circle chat.

Co-hosts cannot:

- Delete the Circle.
- Transfer the Host role.
- Remove the Host.
- Promote or demote other Co-hosts.
- Modify Host permissions.

---

## Member

Members are standard participants within the Circle.

### Permissions

Members can:

- View Circle information.
- Participate in the shared Circle Chat.
- View plans associated with the Circle.
- Create plans within the Circle (if allowed by Circle settings).
- Join or leave plans.
- Leave the Circle.

Members cannot:

- Edit Circle information.
- Manage members.
- Manage roles.
- Delete the Circle.
- Access administrative settings.

---

## Permission Invariants

The following rules always apply:

- Every Circle has exactly one Host (enforced via database constraint trigger `tr_enforce_circle_host_invariant`).
- A Circle may have multiple Co-hosts.
- Members always belong to exactly one role.
- The Host cannot remove themselves without first transferring the Host role.
- Host ownership can only be transferred to a Co-host.
- When Host ownership is transferred, the previous Host automatically becomes a Co-host.
- Circle avatar behavior: uploading a Circle photo is optional. If no custom image is provided, the default group icon is displayed. The Host's profile picture is never used as the Circle's avatar.
- Removing a member from a Circle automatically removes them from all active Circle plans.
- Changing a member's role affects future administrative actions but does not change their participation in existing plans.

# 8. Chat Model

Communication within a Circle is organized into a single shared chat:

- The shared chat represents the ongoing conversation of the community.
- All members participate in this central thread.
- Plans do not own conversations; separate plan chats and archives do not exist.

---

## Membership

Only Circle members can access the Circle's chat.

When a member leaves or is removed from the Circle, they immediately lose access the shared chat.

---

## System Messages

The Circle may generate system messages inside the shared chat for key community changes:

- Member joined the Circle.
- Member left or was removed from the Circle.
- A new Plan was created within the Circle.

System messages for minor status changes or sub-actions are omitted to avoid cluttering the conversation.

# 9. State Management

## Owned State

The Circles feature owns all state required to manage persistent communities and their conversations.

### Circle Collection

Stores every Circle the current user belongs to.

Each Circle contains its own identity, members, settings, and associated plans.

---

### Active Circle

Tracks the Circle currently being viewed.

Changing the active Circle updates the visible members, shared chat, plans, and settings.

---

### Members

Stores the current membership of each Circle.

---

### Shared Chat

The Circles feature owns the single shared Circle conversation.

---

### Circle Settings

Stores configuration information for each Circle.

---

## Shared State Consumed

The Circles feature consumes information owned by other features.

This includes:

- Authenticated user
- User profile
- Friends
- Plans
- Notifications

---

## Derived State

The Circles feature derives additional information from owned state.

Examples include:

- Member count
- Online members
- Active plan count
- Unread message counts

---

## State Reset

The Circles feature resets transient UI state when:

- The user switches Circles.
- The user leaves a Circle.
- The user signs out.

Persistent Circle data remains intact unless the Circle itself is deleted.

# 10. Realtime Synchronization

The Circles feature provides a shared, real-time community experience.

Changes made by one member are reflected for all other eligible members without requiring manual refreshes.

---

## Membership Updates

Changes to Circle membership are synchronized in real time.

---

## Shared Chat

Messages sent in the shared chat are delivered to all Circle members in real time.

---

## Plan Updates

When plans are created within a Circle, they immediately appear in the Circle's Plans view for members.

---

## Circle Updates

Changes to Circle information are synchronized in real time.

# 11. Architecture

The Circles feature provides the persistent community layer of Planless.

It manages long-lived communities where members can communicate, organize activities, and build a shared history over time.

---

## Presentation Layer

The presentation layer is responsible for presenting the Circle experience to members.

It allows users to:

- Browse their Circles.
- View Circle information.
- Switch between the primary **Chat** and **Plans** tabs at the top of the Circle view.
- Participate in the shared chat.
- View the plans associated with the Circle.
- Manage members and settings according to their permissions.

---

## Business Logic Layer

The business logic layer is responsible for enforcing the rules that govern a Circle.

It ensures that every Circle behaves consistently regardless of how members interact with it.

---

## State Management Layer

The state management layer owns the persistent state of every Circle.

---

## Shared Utilities

The Circles feature uses shared utilities that support the community experience.

---

## Feature Dependencies

The Circles feature integrates with other application features through clearly defined ownership boundaries.

- It consumes authentication and profile information to identify members.
- It consumes the Friends feature for invitations.
- It delegates plan creation to the Create feature.
- It delegates plan lifecycle management to the Plans feature.
- It delegates completed activities to the Memories feature.
- It integrates with Notifications to inform members about Circle activity.

# 12. Design Principles

The Circles feature is designed to foster long-term communities.

---

## Community First

A Circle represents an ongoing community, not a single activity.

Members belong to a shared space where conversations continue beyond individual plans.

---

## Persistent Communication

Communication has continuity.

The single shared chat serves as the community's persistent home, keeping discussions unified.

---

## One Circle, One Conversation, Many Plans

A Circle serves as a single unified community space. It is structured around:
- **One Circle**: The persistent social container.
- **One Chat**: The single shared conversation thread for all community talk.
- **Many Plans**: Multiple activities organized inside the community that do not fragment the central discussion.

---

## Activities Within Communities

Plans are temporary experiences that exist within a Circle.

Creating, completing, or cancelling a plan never disrupts the continuity of the Circle itself.

---

## Clear Organization

Information is easy to navigate. Members can switch between Chat and Plans tabs at any time.