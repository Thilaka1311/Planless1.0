# Memories System Product Specification

The **Memories** system serves as a personal, searchable timeline of everything meaningful that has occurred within Planless. Rather than functioning as a cold database audit log, Memories should feel warm, nostalgic, and narrative-driven—acting as the digital scrapbook of the user's social lifestyle and plans.

---

## 1. Vision & Purpose
Planless is not just about scheduling the future; it is about celebrating the past. The Memories feature collects significant moments, friendships, changes, and milestones, preserving them in a beautiful history panel. Even when plans are removed, completed, or transformed, the emotional footprint and facts of that event remain archived as a Memory.

---

## 2. Design & UX Principles
* **Warm & Narrative**: Memory logs should use engaging, human-centric copy (e.g. *"You scheduled Badminton at Nexus IMAX"* instead of *"event_id created"*).
* **Permanent Social Footprint**: If the underlying resource (like a deleted plan) disappears from the active feed, the memory itself is preserved.
* **Compact & Contextual**: Memories should be presented in a clean, chronological feed under **Settings → Memories** with clear category identifiers.
* **Privacy-First**: Memories are private archives for the user, allowing them to reflect on their plan history.

---

## 3. Supported Memory Events
As the system evolves, new social triggers will be captured.

### A. Core Plan Lifecycles
* **Host Cancels / Ditches Plan (Initial Event)**
  * **Trigger**: When a host ditches/cancels a plan, and the active plan record is permanently deleted from the active plans database table.
  * **UX Behavior**: A permanent memory is created stating that the plan was cancelled/deleted. This memory continues to appear in the user's **Settings → Memories** timeline even though the plan itself no longer exists.
* **Plans Created**: Chronology of when the user hosted or initiated a plan.
* **Plans Completed**: Celebratory records of plans that successfully concluded, including who attended.
* **Plans Cancelled**: Retrospective records of plans that did not make it.

### B. Social & Circle Achievements
* **New Friendships**: Date and profile link when two users connect.
* **Circle Activity**: Milestones such as circle creation, joining, or high engagement co-hosting.
* **Achievements & Milestones**: First plan hosted, 10th sport meetup completed, or total group count milestones.

---

## 4. Timeline & Lifecycles
* **Chronological Rhythm**: Memories are grouped by relative periods (Today, Yesterday, Last Month, 2026).
* **Immutability**: Once a memory is sealed, it cannot be edited by the user (except for deletion of the memory record itself if they choose to purge it).

---

## 5. Future Ideas & Roadmap
* **Visual Memories**: Letting users upload a photo after a plan is completed, attaching it to the memory timeline.
* **Memory Highlights**: A "Year in Review" compilation showing top co-hosts and favorite categories.

---

## 6. Open Questions
* **Notification Sync**: Should other participants in a cancelled/deleted plan receive a corresponding memory, or just a transient system notification?
* **Storage Retention**: Should there be a limit to how far back the free tier memories timeline extends?
