# Chat

# 1. Product Vision

## Why the Chats Feature Exists

The Chats feature exists to make communication effortless before, during, and after activities within a Circle.

Rather than creating separate conversations for every plan, each Circle provides a single, persistent shared chat where members naturally coordinate, socialize, and stay connected over time.

The chat becomes the Circle's permanent communication space, while plans act as contextual activities discussed within that shared conversation.

---

## Problem It Solves

Group communication often becomes fragmented when every event creates a separate chat.

Members lose important conversations, duplicate discussions across multiple chats, and struggle to know where to communicate.

Planless eliminates this complexity by giving every Circle exactly one permanent shared chat.

Whether members are discussing an upcoming football match, deciding where to eat next week, or simply talking casually, every conversation happens in the same place.

This creates continuity, preserves context, and makes every Circle feel like a real community rather than a collection of disconnected events.

---

## Where the Feature Begins

The Chats feature begins when a user opens a Circle.

Every Circle immediately exposes its permanent shared chat, allowing members to communicate without creating or joining additional conversations.

If no messages exist, the user is presented with an inviting empty state encouraging them to start the conversation.

---

## Where the Feature Ends

The Chats feature never truly ends.

Unlike plans, which have a defined lifecycle, a Circle Chat remains active for the lifetime of the Circle.

As members create new plans, complete activities, invite friends, or simply continue conversations, the same shared chat persists and evolves alongside the Circle.

It serves as the long-term communication history and social hub for every member.

# 2. Core Responsibilities

The Chats feature is responsible for providing a persistent, real-time communication experience within every Circle.

Its responsibilities begin when a user enters the Circle Chat and continue for the lifetime of the Circle.

---

## Real-Time Messaging

Maintain a single shared conversation for every Circle.

Members should be able to send and receive messages instantly through real-time synchronization.

The chat should remain responsive and automatically update as new messages arrive.

---

## Persistent Conversation History

Maintain the complete message history for the Circle.

Messages are never tied to individual plans and remain accessible regardless of how many plans have been created, completed, or cancelled.

The Circle Chat serves as the permanent communication history for the community.

---

## Member Communication

Allow all Circle members to communicate within the shared conversation.

The Chats feature is responsible for:

- Sending messages
- Receiving messages
- Displaying message history
- Displaying sender information
- Maintaining chronological message order
- Displaying timestamps

---

## Plan Context

Although plans do not own their own chats, conversations may reference plans.

The Chats feature should support lightweight contextual links to plans when appropriate without creating separate conversations or message threads.

Selecting a referenced plan should navigate to the Plan Details screen while keeping the discussion inside the Circle Chat.

---

## Message Status

Provide simple visual feedback for message synchronization.

For the MVP, messages only require two states:

- **Sent** – The message has been successfully sent by the sender.
- **Received** – The message has been successfully received by the recipient(s).

Advanced messaging states such as:

- Sending
- Delivered
- Read Receipts
- Typing Indicators

are intentionally out of scope for this version of the Chats feature.

The focus is to provide a lightweight and reliable messaging experience while keeping the implementation simple.

---

## Empty State

When no messages exist, present a welcoming empty state encouraging members to start the conversation.

The empty state should reinforce that this is the Circle's permanent shared chat rather than a temporary event conversation.

---

## Handoff

The Chats feature owns only communication.

It does **not** create, manage, or modify:

- Plans
- Circle membership
- Circle permissions
- Notifications
- User profiles

Instead, it consumes information from these features while remaining focused solely on messaging.

For example:

- Authentication verifies the identity of each sender.
- User Profiles provide sender names and profile photos.
- Circles determine who can access the conversation.
- Plans provide contextual references when shared.

The Chats feature is responsible only for storing, synchronizing, and displaying messages within the Circle's permanent shared conversation.

# 3. Chat Structure

Every Circle contains exactly one permanent shared chat.

Unlike traditional event-based applications, conversations are **not** separated by individual plans. The Circle Chat acts as the single communication space for everything happening within the Circle.

---

## Single Shared Chat

Each Circle owns one permanent shared chat.

The shared chat is automatically created when the Circle is created and remains available for the lifetime of the Circle.

It cannot be deleted, archived, or replaced.

All Circle members communicate within this single conversation.

---

## Conversations

All discussions take place inside the shared Circle Chat.

Members may discuss:

- Upcoming plans
- Ongoing plans
- Completed plans
- Future ideas
- General conversations
- Announcements
- Casual discussions

No additional chat rooms are created for these activities.

---

## Plans

Plans belong to a Circle but do not own conversations.

Selecting a plan opens the Plan Details screen, where members can:

- View plan information
- Join or leave the plan
- View participants
- Edit the plan (if permitted)
- Manage the plan (if permitted)

However, all discussion about the plan continues inside the Circle's shared chat.

---

## Membership

Every member of a Circle automatically becomes a participant in the Circle Chat.

There is no separate process to join or leave the conversation.

When a member:

- Joins the Circle → they immediately gain access to the shared chat.
- Leaves or is removed from the Circle → they immediately lose access to the shared chat.

Chat membership is always determined by Circle membership.

---

## Message Ownership

Every message belongs to exactly one Circle Chat.

Each message stores:

- The sender
- The Circle Chat it belongs to
- The message content
- The time it was sent
- Its current status

Messages never belong to individual plans.

---

## Lifetime

The Circle Chat has the same lifetime as the Circle itself.

Creating, editing, cancelling, or completing plans does not affect the conversation.

The chat continues to grow as members interact over time, becoming the permanent communication history of the Circle.

# 4. Business & Data Rules

The Chats feature follows a simple and predictable communication model.

All messaging behaviour must comply with the following business rules.

---

## One Chat Per Circle

Every Circle owns exactly one shared chat.

A second chat cannot be created for the same Circle.

The shared chat is automatically created when the Circle is created and exists for the lifetime of the Circle.

---

## Circle Membership

Only active Circle members can access the Circle Chat.

Users who are not members of the Circle cannot:

- View messages
- Send messages
- Access chat history

When a user leaves or is removed from a Circle, they immediately lose access to the Circle Chat.

---

## Message Ownership

Every message belongs to:

- One Circle Chat
- One sender

A message cannot belong to multiple chats or multiple senders.

Once created, the sender of a message cannot be changed.

---

## Message Ordering

Messages are displayed in chronological order based on the time they were sent.

The newest messages appear at the bottom of the conversation.

The message history should remain consistent for every member of the Circle.

---

## Message Content

For the initial version, messages support plain text only.

Each message consists of:

- Text content
- Sender
- Timestamp
- Message status

Attachments, reactions, replies, voice notes, GIFs, stickers, and other rich content are intentionally out of scope for this version.

---

## Message Status

Every message has one of two states:

- **Sent**
- **Received**

No additional delivery states are required for the initial release.

---

## Plan References

Messages may reference an existing plan within the Circle.

Selecting a plan reference should navigate the user to the corresponding Plan Details screen.

Referencing a plan does not create a new chat or conversation.

---

## Persistence

All messages are permanently stored in the database.

Messages remain available until they are explicitly deleted according to future moderation or deletion rules.

Creating, editing, cancelling, or completing plans must never remove or modify chat history.

---

## Source of Truth

The database is the single source of truth for all conversations.

Every client must retrieve messages from the database and keep the conversation synchronized through the existing real-time infrastructure.

No client should maintain an independent copy of the conversation outside of local caching for performance.

# 5. User Journey & Navigation Flow

The Chats feature provides a persistent communication experience for every Circle.

Unlike temporary event chats, the conversation remains available throughout the lifetime of the Circle.

---

## Opening a Circle

The user enters a Circle from the Home or Circles screen.

The Circle overview displays:

- Circle information
- Active plans
- Members
- The shared Circle Chat

The shared chat is immediately available without any additional setup.

---

## Entering the Chat

Selecting the Chat opens the Circle's permanent conversation.

If messages already exist, the user is taken directly to the latest messages.

If no messages exist, the user is presented with an empty state encouraging them to start the conversation.

---

## Sending a Message

The user enters text into the message composer.

Selecting **Send** immediately publishes the message to the Circle Chat.

The message appears in chronological order and becomes visible to every active Circle member in real time.

---

## Receiving Messages

When another Circle member sends a message, it automatically appears within the conversation.

The message list updates in real time without requiring the user to refresh the page.

---

## Discussing Plans

Members may naturally discuss plans within the shared conversation.

When a plan is referenced in the chat:

- Selecting the reference opens the corresponding Plan Details screen.
- Closing the Plan Details returns the user to the same position within the Circle Chat.

Conversations always remain inside the shared Circle Chat.

---

## Leaving the Chat

Leaving the chat simply returns the user to the Circle screen.

The conversation continues to exist for every other Circle member.

Re-entering the Circle Chat always restores the latest conversation history.

---

## Leaving the Circle

When a user leaves or is removed from a Circle:

- Access to the Circle Chat is immediately revoked.
- The user can no longer view or send messages within that Circle.
- Other Circle members continue using the same shared conversation without interruption.

---

## End-to-End Flow

The complete Chat experience follows this lifecycle:

1. User opens a Circle.
2. User enters the shared Circle Chat.
3. User reads existing messages or starts the conversation.
4. Members exchange messages in real time.
5. Conversations continue regardless of how many plans are created, completed, or cancelled.
6. The shared chat remains the permanent communication hub for the Circle throughout its lifetime.

# 6. State Management

The Chats feature manages the state required to provide a consistent, real-time messaging experience within every Circle.

## Active Chat State

Stores the currently open Circle Chat and its associated information.

This state is:

- Created when a user opens a Circle Chat.
- Updated when the user navigates between Circles.
- Cleared when the user exits the Chat experience.

The Active Chat State provides the context required for loading messages, sending new messages, and subscribing to real-time updates.

---

## Message State

Stores the current conversation displayed within the active Circle Chat.

This state includes:

- Existing message history.
- Newly received messages.
- Newly sent messages.
- Message ordering.
- Message status.

The Message State is continuously updated as new messages are sent or received.

---

## Message Composer State

Tracks the current message being composed by the user.

This state is:

- Created when the user begins typing.
- Updated as the user edits the message.
- Cleared immediately after a successful send or when the message is discarded.

---

## State Synchronization

The Chats feature maintains a synchronized conversation for every member of the Circle.

Whenever a new message is sent or received, the conversation updates automatically so that all members viewing the chat see the same message history in the same chronological order.

---

## State Sharing

The Chats feature consumes shared application state provided by other features.

It relies on:

- **Authentication** to identify the current user.
- **User Profiles** to display sender names and profile photos.
- **Circles** to determine the active Circle and its members.

The Chats feature does not own or modify these states. It only consumes them to provide the messaging experience.

# 7. Realtime Synchronization

The Chats feature keeps every Circle conversation synchronized in real time, ensuring all members see the same conversation as messages are exchanged.

## Message Synchronization

Whenever a Circle member sends a message, the conversation is immediately synchronized for every active member of that Circle.

New messages should appear automatically without requiring the user to refresh the conversation.

The message list should remain consistent for every member viewing the chat.

---

## Conversation Updates

The Chats feature continuously responds to changes within the active Circle Chat, including:

- New messages being sent.
- Existing messages being received.
- Members joining the conversation after opening the chat.

All updates should be reflected automatically while preserving the correct chronological order of messages.

---

## Active Chat Synchronization

Only the currently active Circle Chat should maintain an active real-time connection.

When the user leaves a Circle Chat:

- Real-time listeners should be cleaned up.
- Active subscriptions should be released.
- Unnecessary network activity should stop.

Opening another Circle Chat should establish a new synchronization session for that conversation.

---

## Consistency

The database acts as the single source of truth for every Circle conversation.

All clients should receive the same messages in the same order, ensuring that every member experiences a consistent and reliable conversation regardless of the device they are using.

The Chats feature should never maintain independent conversation histories outside of temporary local state required for rendering the current session.

# 8. Architecture

The Chats feature is built around a centralized Circle Chat architecture that provides a single, persistent conversation for every Circle.

Unlike traditional event-based messaging systems, communication is organized around the Circle rather than individual plans.

## Architectural Components

The feature consists of the following primary components:

- **Circle Chat Coordinator** — Loads the active Circle Chat, manages the conversation lifecycle, and coordinates the messaging experience.
- **Message Service** — Retrieves message history, sends new messages, and synchronizes conversations with the database.
- **Realtime Synchronization Layer** — Listens for new messages and updates the active conversation in real time.
- **Message Composer** — Validates user input and creates new messages within the active Circle Chat.
- **Database Layer** — Stores Circle Chats, messages, and associated metadata as the permanent source of truth.

---

## Component Interaction

The Chats feature follows a centralized messaging architecture:

1. The user opens a Circle.
2. The **Circle Chat Coordinator** loads the Circle's shared chat.
3. The **Message Service** retrieves the existing conversation.
4. The **Realtime Synchronization Layer** subscribes to new messages for the active Circle Chat.
5. The **Message Composer** creates and submits new messages.
6. The **Database Layer** persists every message and broadcasts updates to connected Circle members.
7. Incoming messages are synchronized back to all active clients in real time.

---

## Integration with the Application

The Chats feature integrates closely with several core platform features.

It relies on:

- **Authentication** to identify the current user.
- **User Profiles** to display sender information.
- **Circles** to determine chat membership and access.
- **Plans** to provide contextual references when shared inside conversations.

The Chats feature does not manage these features directly. Instead, it consumes their data while remaining solely responsible for communication.

---

## Architectural Principles

- **One Chat Per Circle** — Every Circle owns exactly one permanent shared conversation.
- **Centralized Messaging** — All communication takes place within the Circle Chat.
- **Persistent Conversations** — Messages remain available throughout the lifetime of the Circle.
- **Database as Source of Truth** — All messages are persisted centrally and synchronized across clients.
- **Realtime by Default** — Conversations update automatically without requiring manual refresh.
- **Separation of Responsibilities** — Chats manages communication only, while other features remain responsible for plans, circles, permissions, and user management.

# 9. Design Principles

The Chats feature is designed around the following principles.

### One Conversation Per Circle

Every Circle should have exactly one permanent shared chat.

Members should never have to decide where a conversation belongs. Whether discussing a current plan, a future idea, or a casual topic, everything happens within the same conversation.

---

### Conversation First

The chat should prioritize communication above all else.

The interface should remain lightweight and distraction-free, allowing messages to be the primary focus while keeping Circle information and active plans easily accessible.

---

### Real-Time by Default

Communication should feel immediate.

Messages should appear automatically for all active Circle members without requiring manual refreshes or additional user interaction.

---

### Persistent History

The Circle Chat serves as the permanent communication history of the Circle.

Conversations should continue naturally over time regardless of how many plans are created, completed, or cancelled.

The chat grows alongside the Circle rather than being tied to individual activities.

---

### Simple Messaging

The initial messaging experience should remain intentionally simple.

Support is limited to:

- Plain text messages
- Sender information
- Timestamps
- Message status (Sent / Received)

More advanced messaging features can be introduced in future iterations without changing the core architecture.

---

### Consistent Experience

Every Circle member should experience the same conversation.

Messages should appear in the same order, contain the same information, and remain synchronized across all supported devices.

---

### Clear Separation of Responsibilities

The Chats feature is responsible only for communication.

It does not manage:

- Plans
- Circle membership
- Permissions
- User profiles
- Notifications

Instead, it consumes information from these features while remaining focused solely on providing a reliable messaging experience.

# 10. Source Files

### `apps/app/src/features/chat/screens/CircleChatScreen.tsx`

Acts as the primary entry point for the Chats feature.

It coordinates the Circle Chat experience by:

- Loading the active Circle Chat.
- Displaying the conversation.
- Managing real-time synchronization.
- Handling message sending.
- Displaying the message composer.
- Rendering the empty state when no messages exist.

---

### `apps/app/src/features/chat/components/ChatHeader.tsx`

Displays information about the active Circle.

It is responsible for rendering:

- Circle profile photo
- Circle name
- Member count
- Navigation controls

The header provides context while keeping the conversation as the primary focus.

---

### `apps/app/src/features/chat/components/MessageList.tsx`

Renders the conversation for the active Circle Chat.

Responsibilities include:

- Displaying messages in chronological order.
- Automatically updating when new messages arrive.
- Managing scroll behaviour.
- Displaying the empty state when the conversation has no messages.

---

### `apps/app/src/features/chat/components/MessageBubble.tsx`

Represents an individual chat message.

Each message displays:

- Sender profile photo
- Sender name
- Message content
- Timestamp
- Message status (Sent / Received)

The component automatically adjusts its layout depending on whether the message belongs to the current user or another Circle member.

---

### `apps/app/src/features/chat/components/MessageComposer.tsx`

Provides the interface for composing and sending new messages.

It is responsible for:

- Capturing user input.
- Validating messages.
- Sending messages.
- Clearing the composer after successful submission.

---

### `apps/app/src/features/chat/services/chatService.ts`

Owns communication with the backend.

Responsibilities include:

- Loading chat metadata.
- Retrieving message history.
- Sending new messages.
- Managing real-time subscriptions.
- Synchronizing conversations with the database.

Business logic should remain inside this service rather than UI components.

---

### File Relationships

The Chats feature is coordinated by `CircleChatScreen.tsx`, which manages the overall messaging experience.

`ChatHeader.tsx`, `MessageList.tsx`, `MessageBubble.tsx`, and `MessageComposer.tsx` work together to render the user interface while remaining focused on presentation.

`chatService.ts` acts as the communication layer between the application and the database, ensuring that all messages are persisted and synchronized in real time.

Together, these components provide a single, persistent Circle Chat that serves as the communication hub for every Circle throughout its lifetime.