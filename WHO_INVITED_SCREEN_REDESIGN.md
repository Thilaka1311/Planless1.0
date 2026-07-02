# Product Design Specification: "Who's Invited" Redesign

This document serves as the living product design specification and single source of truth for the **Who's Invited** experience in Planless. It defines the screen hierarchy, visual principles, interaction models, and product rules.

This specification is modeled directly on the interaction hierarchy, space optimization, and scrolling mechanics of the design reference below. While branding elements (colors, gradients, typography, and visual assets) must remain visually consistent with the premium dark-mode Planless design system, the functional layout, density, and screen rhythm should follow this specification exactly.

---

## 1. Visual Reference & target layout

The layout, scrolling behaviors, and selection hierarchy defined in this document are based on the following target interface structure:

![Design Reference](file:///Users/thilak/.gemini/antigravity-ide/brain/cc99c03d-554a-4f21-96d8-1f22c6b5d86f/media__1782721876277.png)

This reference represents the gold standard for high-density contact selection, and this specification translates its layout rhythm and user experience directly into the Planless app.

---

## 2. Intentional Layout & Screen Hierarchy

From top to bottom, the screen composition must structure content sequentially to minimize vertical scrolling and maximize guest selection density:

### 2.1. Condensed Plan Header (Contextual Anchor)
* **Design Rule**: Occupies less than 12% of the screen height, coexisting elegantly with the active selection area.
* **Layout**: A compact, semi-transparent banner containing the category emoji (e.g. 🏸) aligned left, with the Title, Location, and Date stacked inside a single tight text block to leave 88% of vertical viewport space for user lists.

### 2.2. Prominent Search Bar (Dynamic Filter Layer)
* **Structure**: Placed immediately below the plan header. A full-width search input with a clear search icon prefix and an inline `X` clear trigger.
* **Affordances**: Focus states trigger a fine color boundary highlight (`#FF6B2C/20`), keeping focus active and encouraging typing to instantly prune large lists.

### 2.3. Invite Shortcuts (Primary Action Row)
* **Structure**: A horizontal scrollable deck of rounded shortcuts, positioned right under the search input.
* **Affordances**: Each shortcut displays its custom icon, name, and total member count. It represents the highest-priority quick-action tier. Horizontal scrolling uses soft edge-fading overlays to hint at off-screen shortcuts without introducing vertical clutter.

### 2.4. Recents & Best Friends (High-Frequency Grid)
* **Structure**: Positioned directly below the shortcuts row. Displays high-frequency and recent plan guests in a dense, multi-column card grid (2-column layout on standard screens).
* **Density**: Cards are compact and square-cornered, displaying the contact name, profile avatar, and a hollow checkmark circle that fills on tap.

### 2.5. Master Friends Directory (Dense List View)
* **Structure**: Stacked below the recents grid. An alphabetical list of all other user connections.
* **Rhythm**: High-density vertical rows, separating user rows using fine horizontal rules (`white/5`).
* **Alphabetical Scroll Jumper**: Includes a vertical A-Z alphabet index gutter on the right-most edge of the screen, allowing users to scroll rapidly to any letter index with a single thumb sweep.

### 2.6. Floating Action Confirmation Banner
* **Structure**: A persistent glassmorphic bottom bar containing the selection count (e.g. "Invite 5 Guests") and primary confirmation button, floating cleanly above scrollable lists.

---

## 3. Interaction Mechanics & Business Rules

### Selection Mechanics
* **Shortcut Toggles (Partial Selections)**:
  * Tapping a partially selected shortcut selects all remaining unselected members of that shortcut, moving the shortcut card state to *Fully Selected*.
  * Tapping a fully selected shortcut deselects all members, returning the card to *Unselected*.
* **Overlapping Deselection**:
  * If Friend X belongs to both Shortcut A and Shortcut B, and both shortcuts are selected, deselecting Shortcut A does **not** deselect Friend X because Friend X remains kept active by Shortcut B.
* **Deduplication**:
  * Multiple overlapping shortcuts resolve selections dynamically. Friends are never duplicated in the final selection count.

### Search Mechanics
* **Content-Aware Filtering**:
  * Typing in the search bar filters the Friends list dynamically.
  * The Shortcuts list filters concurrently: shortcuts are kept visible if either the shortcut name matches the query OR if any member inside that shortcut matches the query.

---

## 4. Visual & Touch-First Design Philosophy

* **Fast Over Decorative**: Eliminate slow page-wipe transitions. Updates to states and selection count happen instantaneously.
* **Dense but Never Cluttered**: Font size is kept to a crisp 11px to 14px range with wide tracking to optimize space. Row heights are minimized to pack maximum contacts onto a single viewport fold.
* **Tactile Feedback**: Tapping cards triggers a slight contraction animation (`scale: 0.98`) to provide physical button feedback.
* **Tactile Outlines**: Checked states display a bold orange fill with checkmark icon (`#FF6B2C`). Unchecked states render as a thin hollow circle (`white/10`) to invite taps.
* **Empty & Loading States**:
  * **Loading**: Translucent skeleton loaders matching the list/grid layouts.
  * **Empty Shortcuts**: A simple card displaying a `+` icon to guide users to configure their first group list.

---

## 5. Future Scalability (Open Questions & Additions)

* **Group Messaging Hooks**: How should selecting a shortcut interact with group chat generation if the plan is finalized?
* **Shared Shortcuts**: Will users be allowed to publish/share their invite shortcuts with other group members in the future?
* **Smart Recommendations**: Should Planless suggest auto-shortcuts based on machine learning analysis of past invitation history?
