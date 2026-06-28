# Activities Domain

## Purpose

The Activities domain defines every activity supported by Planless.

Activities determine how plans are created, how they are completed, how memories are generated, and what business rules apply.

Activities are part of the application configuration and are **not** stored as database records.

---

# Design Principles

1. Activities are predefined by Planless.
2. Users cannot create custom activities.
3. Every activity belongs to a category.
4. Every activity has a unique completion workflow.
5. Every activity defines its own memory layout.
6. Every activity may define additional business rules.

---

# Category Structure

## Sports

Activities:

* Football
* Badminton

---

## Movies

Activities:

* Cinema

---

## Dining

Activities:

* Restaurant
* Cafe

---

# Activity Specifications

## Football

### Category

Sports

### Team Support

Required

### Completion Workflow

1. Enter Team A score.
2. Enter Team B score.
3. Select MVP.
4. Submit.

### Memory

Displays:

* Activity
* Date
* Participants
* Final score
* Winner
* MVP

### Business Rules

* Teams are required.
* Winner is determined from the score.
* MVP is required.

---

## Badminton

### Category

Sports

### Team Support

Not Required

### Completion Workflow

1. Select MVP.
2. Submit.

### Memory

Displays:

* Activity
* Date
* Participants
* MVP

### Business Rules

* No scores are stored.
* No winner is calculated.
* No team generation.
* Leaderboards are based on MVP selections only.

---

## Cinema

### Category

Movies

### Team Support

Not Required

### Completion Workflow

1. Select rating (1–5).
2. Write review.
3. Submit.

### Memory

Displays:

* Activity
* Date
* Participants
* Rating
* Review

### Business Rules

* Rating is required.
* Review is optional.

---

## Restaurant

### Category

Dining

### Team Support

Not Required

### Completion Workflow

1. Select rating (1–5).
2. Write review.
3. Submit.

### Memory

Displays:

* Activity
* Date
* Participants
* Rating
* Review

### Business Rules

* Rating is required.
* Review is optional.

---

## Cafe

### Category

Dining

### Team Support

Not Required

### Completion Workflow

1. Select rating (1–5).
2. Write review.
3. Submit.

### Memory

Displays:

* Activity
* Date
* Participants
* Rating
* Review

### Business Rules

* Rating is required.
* Review is optional.

---

# Future Activities

New activities should define:

* Category
* Team support
* Completion workflow
* Memory layout
* Business rules

The database schema should not require modification when adding new activities unless the activity introduces entirely new business concepts.

---

# Design Philosophy

The database stores only the selected category and subcategory for each plan.

All activity behavior—including completion flows, memory layouts, validation rules, and team requirements—is defined by the application using this specification.

This keeps the database simple while allowing the product to grow without unnecessary schema changes.
