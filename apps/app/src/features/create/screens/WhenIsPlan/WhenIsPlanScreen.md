# Plan Details Screen ("When is the plan?")

## Overview

The Plan Details screen is the second step of the Planless create flow. It is responsible for defining **when the plan happens**, **when people can respond**, and **how many people can join**.

The experience is intentionally designed to feel premium, minimal, and native, following Apple-inspired interaction patterns.

---

# Header & Hero Layout

The hero occupies the top of the screen and displays a full-color background image with no blur or saturation filters.

Layout structure:
```
[X]                     MATCHDAY                     [Sports Badge]

                 Wednesday, July 8 • 7:30 PM

                 [⏰ Respond 1 Hour Before]
```

- **Primary Title**: Centered MATCHDAY title in a bold, large font (44–48px).
- **Date & Time**: Positioned directly below the title on a single line (*"Wednesday, July 8 • 7:30 PM"*).
- **Summary Pills**: Contains a compact Respond by pill underneath the date line with a Sport green icon.

---

# Settings Cards

The screen features four settings cards. Exactly one card is expanded at a time during configuration. Tapping a card collapses the active card and expands the selected one.

## 1. Date
- **Collapsed**: Displays selected date on the right.
- **Expanded**: Shows inline custom wheel picker. Starting card expanded by default.

## 2. Time
- **Collapsed**: Displays selected time on the right.
- **Expanded**: Shows inline custom hour/minute picker.

## 3. Respond by:
- **Collapsed**: Displays selected deadline on the right.
- **Expanded**: Shows inline radio options (< 1 Hour, < 12 Hours, < 24 Hours).
- **Validation**: Subtracted window must result in a deadline strictly in the future. Otherwise, shows: *"Not enough time left for everyone to respond. Choose a later response deadline or a later plan time."*

## 4. Plan Size
- **Collapsed**: Displays selected capacity on the right (e.g. `14 People`).
- **Expanded**: Shows a custom premium slider. Displays the selected people count directly beneath the slider in the expanded area.
- **Validation**: Capacity must be between `2` and `50`. Otherwise, displays inline center-aligned error message.
- **Locks**: Toggling/collapsing is blocked while the capacity value is invalid.

---

# Continue Button

The Continue button remains hidden during configuration. Only when all four required values are defined and all cards are collapsed does it fade in smoothly directly above the validation banners at the bottom of the screen.
- **Rules**: Opening any card fades the Continue button out immediately (fades out in 200ms, and card expansion is delayed by 250ms so it disappears first).

---

# Sub-Components

### 1. [PlanSizeSlider](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/create/screens/WhenIsPlanScreen/Components/PlanSizeSlider.tsx)
- Custom-built range control utilizing mouse and touch coordinators.
- Features a premium track with Sports Green gradient fills, a white circular thumb with Sport Green borders, and soft dragging glow shadows.
- Displays a floating tooltip bubble containing the current number (or `> 50`) that follows the thumb horizontally.

### 2. [RSVP](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/create/screens/WhenIsPlanScreen/Components/RSVP.tsx)
- Render element for response deadlines.
- Contains custom radio indicators, description fields, and conditional height expanders for error warnings.

### 3. [WheelPicker](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/create/screens/WhenIsPlanScreen/Components/WheelPicker.tsx)
- Handles inline scroll selectors for Date and Time cards.
- Manages selected hours, minutes, day, month, and year values.

### 4. [WheelColumn](file:///Users/thilak/Documents/Planless/Planless%20Repo%20/Planless-2.0/apps/app/src/features/create/screens/WhenIsPlanScreen/Components/WheelColumn.tsx)
- Implements touch-sensitive scrolling wheel columns with snap-align items and smooth vertical offsets.