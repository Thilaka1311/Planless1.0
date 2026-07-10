# 12. Colours

# Platform Colors

The Planless platform is intentionally monochrome.

Color should never define the identity of the application. Instead, hierarchy, spacing, typography, and motion create the visual identity. A restrained monochrome foundation allows every experience to introduce its own personality without making the platform feel inconsistent.

These colors are used throughout the core application, including navigation, onboarding, settings, profile, wallet, search, notifications, dialogs, and shared components.

The platform should always remain recognizable regardless of the experience being viewed.

---

## Background

**Token**

`color-background`

**Value**

`#000000`

**Purpose**

The primary application background.

Used for:

- App background
- Navigation
- Screen backgrounds
- Root containers

---

## Surface

**Token**

`color-surface`

**Value**

`#111111`

**Purpose**

The default container color.

Used for:

- Cards
- Settings rows
- Search bars
- Inputs
- Bottom sheets
- List rows

---

## Surface Elevated

**Token**

`color-surface-elevated`

**Value**

`#1A1A1A`

**Purpose**

Used when a component should visually sit above surrounding content.

Examples include:

- Dialogs
- Popovers
- Expanded menus
- Active pickers
- Floating panels

---

## Surface Overlay

**Token**

`color-surface-overlay`

**Value**

`rgba(20, 20, 20, 0.82)`

**Purpose**

Glass-like overlays placed above existing content.

Used for:

- Modal backdrops
- Sticky action bars
- Floating controls
- Blurred overlays

---

## Border

**Token**

`color-border`

**Value**

`rgba(255,255,255,0.08)`

**Purpose**

Subtle structural separation.

Borders should remain visually quiet and should never become the dominant method of creating hierarchy.

Whenever possible, prefer whitespace before adding borders.

---

## Divider

**Token**

`color-divider`

**Value**

`rgba(255,255,255,0.05)`

**Purpose**

Separates related content inside a component.

Examples:

- Settings lists
- Participant lists
- Information sections

Avoid excessive divider usage.

Whitespace should remain the primary separator.

---

# Typography Colors

## Primary Text

**Token**

`color-text-primary`

**Value**

`#FFFFFF`

**Purpose**

Used for:

- Screen titles
- Card titles
- Buttons
- Hero values
- Primary information

This should be the most frequently used text color.

---

## Secondary Text

**Token**

`color-text-secondary`

**Value**

`#A1A1AA`

**Purpose**

Used for:

- Descriptions
- Supporting information
- Metadata
- Labels

Secondary text should never compete with primary information.

---

## Tertiary Text

**Token**

`color-text-tertiary`

**Value**

`#71717A`

**Purpose**

Used for:

- Captions
- Timestamps
- Disabled metadata
- Placeholder information

Use sparingly.

---

## Disabled Text

**Token**

`color-text-disabled`

**Value**

`rgba(255,255,255,0.30)`

**Purpose**

Communicates unavailable actions or inactive information.

Disabled content should remain readable while clearly appearing inactive.

---

# Action Colors

The Planless platform uses a monochrome action system.

Buttons communicate importance through hierarchy rather than color.

---

## Primary Action

**Token**

`color-action-primary`

**Background**

`#FFFFFF`

**Foreground**

`#000000`

**Purpose**

Used for the primary call-to-action on a screen.

Examples:

- Continue
- Create Plan
- Save
- Confirm
- Invite

There should only be one primary action within a major section.

---

## Secondary Action

**Token**

`color-action-secondary`

**Background**

`Transparent`

**Border**

`color-border`

**Foreground**

`color-text-primary`

**Purpose**

Supporting actions that should remain visible without competing with the primary action.

---

## Ghost Action

**Token**

`color-action-ghost`

**Background**

`Transparent`

**Foreground**

`color-text-secondary`

**Purpose**

Low-emphasis actions.

Examples:

- Later
- Skip
- Learn More
- View All

---

# Semantic Colors

These colors communicate application state.

They are not tied to any category.

---

## Success

**Token**

`color-success`

**Value**

`#22C55E`

Used for:

- Success states
- Completed actions
- Confirmations
- Positive feedback

---

## Warning

**Token**

`color-warning`

**Value**

`#F59E0B`

Used for:

- Pending actions
- Warnings
- Important notices

---

## Danger

**Token**

`color-danger`

**Value**

`#EF4444`

Used for:

- Errors
- Destructive actions
- Failed operations

---

## Information

**Token**

`color-information`

**Value**

`#3B82F6`

Used for:

- Informational messages
- Tips
- Guidance
- Neutral status indicators

---

# Platform Rules

The platform should always remain monochrome.

Do not introduce category colors into:

- Navigation
- Settings
- Profile
- Wallet
- Search
- Authentication
- Onboarding
- Notifications
- Shared infrastructure

The platform should always feel calm, neutral, and consistent.

Color belongs to experiences.

The platform provides the stage.

The experiences provide the personality.

# Experience Colors

The Planless platform remains visually neutral.

Experiences introduce personality through semantic accent colors.

Every plan belongs to an experience, and every experience may define its own accent color, gradients, imagery, and visual emphasis. These accents help users instantly recognize the type of activity they are viewing without changing the identity of the platform.

Experience colors are never decorative. They communicate context.

For example:

- A football match should feel energetic.
- A movie night should feel cinematic.
- A dinner reservation should feel warm and inviting.

The surrounding platform remains unchanged.

---

## Philosophy

The platform provides consistency.

Experiences provide personality.

This separation allows Planless to feel like one cohesive product while giving every activity its own visual identity.

Users should immediately recognize the experience they are viewing through subtle visual cues rather than overwhelming color.

---

## Semantic Tokens

Every experience must define its own semantic color tokens.

Avoid using hardcoded colors throughout the interface.

Components should reference semantic tokens instead of individual color values.

Example token naming:

- `color-category-sports`
- `color-category-movies`
- `color-category-restaurants`

Additional semantic tokens may include:

- `color-category-gradient-start`
- `color-category-gradient-end`
- `color-category-glow`
- `color-category-surface`
- `color-category-border`

Components should never know what color they are rendering.

They should simply request the semantic token for the current experience.

---

## Where Experience Colors Are Used

Experience colors may be used for:

- Primary actions inside an experience
- Category badges
- Progress indicators
- Active tabs
- Selected states
- Icons
- Team indicators
- Scoreboards
- Ratings
- Charts
- Timelines
- Hero accents
- Empty state illustrations
- Decorative glows
- Interactive highlights

---

## Where Experience Colors Should Never Be Used

Experience colors should never replace the platform language.

Avoid using category colors in:

- Navigation bars
- Authentication
- Onboarding
- Settings
- Profile
- Wallet
- Search
- Notifications
- Shared dialogs
- Global components

These areas belong to the platform and should always remain monochrome.

---

## One Experience Per Screen

Each screen should represent a single experience.

Never mix multiple experience colors within the same interface.

For example:

A football plan should only use Sports colors.

A movie plan should only use Movie colors.

A restaurant plan should only use Restaurant colors.

Mixing semantic colors weakens hierarchy and creates visual confusion.

---

## Extensibility

The experience color system should scale naturally as new categories are introduced.

Future experiences should follow the same semantic structure without requiring changes to existing components.

Examples:

- Travel
- Coffee
- Gaming
- Hiking
- Nightlife

Each new experience should define its own semantic tokens while inheriting the same platform language.

---

## Design Rules

Experience colors should:

- Reinforce context.
- Draw attention to important information.
- Strengthen recognition.
- Create emotional association.

Experience colors should never:

- Become the background of the application.
- Replace typography hierarchy.
- Overpower photography.
- Distract from content.
- Exist without meaning.

Color should always communicate what the experience is—not what the application is.

# Sports Experience

Sports is the most energetic experience within Planless.

It should feel immersive, competitive, and alive while remaining consistent with the Planless platform. The interface should disappear behind the excitement of the match, allowing players, teams, scores, and moments to become the focus.

Unlike the core platform, Sports is allowed to use a stronger visual identity. Green becomes the semantic accent that communicates activity, participation, and momentum.

The goal is not to make the interface greener.

The goal is to make every match feel alive.

---

## Philosophy

The platform remains neutral.

The match provides the energy.

Sports should feel active without becoming visually loud.

Large photography, confident typography, and carefully placed green accents should communicate excitement while preserving readability.

The interface should never compete with the action itself.

---

# Semantic Tokens

## Primary Accent

**Token**

`color-category-sports`

**Value**

`#22C55E`

Purpose:

Primary semantic color for every sports experience.

---

## Accent Strong

**Token**

`color-category-sports-strong`

**Value**

`#16A34A`

Purpose:

Pressed states, selected controls, active indicators.

---

## Gradient Start

**Token**

`color-category-sports-gradient-start`

**Value**

`#22C55E`

---

## Gradient End

**Token**

`color-category-sports-gradient-end`

**Value**

`#16A34A`

---

## Glow

**Token**

`color-category-sports-glow`

**Value**

`rgba(34,197,94,0.12)`

Purpose:

Subtle emphasis behind active components.

Never use as decoration.

---

# Visual Characteristics

Sports interfaces should feel:

- Energetic
- Confident
- Immersive
- Fast
- Competitive
- Social

Avoid making Sports feel:

- Corporate
- Minimal to the point of lifelessness
- Decorative
- Cartoonish
- Over-designed

---

# Photography

Photography is the hero.

Whenever imagery exists, prioritize:

- Players
- Stadiums
- Courts
- Teams
- Equipment
- Action moments

Images should feel authentic.

Avoid stock-like imagery.

Large photography is preferred over multiple small images.

---

# Accent Usage

Green should communicate activity.

Recommended usage:

- Join buttons
- Confirmed participant states
- Scoreboards
- Team indicators
- Progress bars
- Selected filters
- Active tabs
- Badges
- Match status
- Live indicators
- Success states inside sports

Do not make every component green.

Green should guide attention.

---

# Typography

Typography should feel bold and confident.

Large match titles are encouraged.

Examples:

Football Tonight

Saturday Match

Badminton League

The score should receive the greatest visual emphasis.

Secondary information should remain quiet.

---

# Cards

Sports cards should feel immersive.

Include:

- Large cover photography
- Bold match title
- Team information
- Venue
- Time
- Participant count

Avoid excessive metadata.

The match should remain the focal point.

---

# Buttons

Inside Sports experiences:

Primary actions may inherit the Sports accent.

Examples:

Join Match

Lock Team

Confirm Line-up

Vote MVP

Outside Sports, buttons should return to the platform style.

---

# Progress

Progress indicators should use the Sports accent.

Examples:

RSVP progress

Team selection

Match completion

Tournament progress

Progress should communicate momentum.

---

# Teams

Teams should be visually grouped.

Avoid excessive separators.

Use spacing, typography, and subtle surfaces before introducing borders.

Player avatars should become the primary visual anchors.

---

# Motion

Sports interactions should feel slightly faster than the rest of the application.

Examples:

Quick participant updates

Smooth scoreboard changes

Animated team assignments

Live progress updates

Animations should reinforce momentum without becoming distracting.

---

# Emotional Goals

Sports should make users feel:

- Excited
- Competitive
- Ready to play
- Connected with teammates

The interface should encourage participation rather than administration.

---

# Sports Rules

Do:

- Use green intentionally.
- Prioritize photography.
- Highlight participation.
- Celebrate progress.
- Keep layouts compact and energetic.
- Emphasize scores and teams.

Don't:

- Turn the entire screen green.
- Use gradients as backgrounds.
- Replace typography with decoration.
- Overuse glow effects.
- Add unnecessary visual effects.
- Sacrifice readability for excitement.

Sports should feel like stepping into a live match, while still feeling unmistakably like Planless.

# Movies Experience

Movies is the most cinematic experience within Planless.

It should feel immersive, elegant, and premium, allowing posters, movie stills, and cinematic artwork to become the center of attention. The interface should feel like entering a luxury cinema rather than browsing a ticketing application.

Unlike the core platform, Movies introduces a refined purple accent that represents entertainment, storytelling, and atmosphere.

The interface should never compete with the film.

It should frame it.

---

## Philosophy

The platform remains neutral.

The movie provides the emotion.

Movies should feel calm, dramatic, and immersive.

Large posters, restrained typography, and subtle purple accents should create a premium viewing experience without overwhelming the content.

The interface should disappear behind the artwork.

---

# Semantic Tokens

## Primary Accent

**Token**

`color-category-movies`

**Value**

`#8B5CF6`

Purpose:

Primary semantic color for movie experiences.

---

## Accent Strong

**Token**

`color-category-movies-strong`

**Value**

`#6D28D9`

Purpose:

Selected controls.

Pressed states.

Active navigation.

---

## Gradient Start

**Token**

`color-category-movies-gradient-start`

**Value**

`#8B5CF6`

---

## Gradient End

**Token**

`color-category-movies-gradient-end`

**Value**

`#6D28D9`

---

## Glow

**Token**

`color-category-movies-glow`

**Value**

`rgba(139,92,246,0.12)`

Purpose:

Soft emphasis behind active movie elements.

Never use purely as decoration.

---

# Visual Characteristics

Movie experiences should feel:

- Cinematic
- Premium
- Sophisticated
- Dramatic
- Elegant
- Immersive

Avoid making Movies feel:

- Playful
- Corporate
- Busy
- Colorful
- Over-designed

---

# Photography

Movie artwork is the hero.

Whenever available, prioritize:

- Official posters
- Movie stills
- Character photography
- Cinema environments
- IMAX imagery

Posters should dominate the interface.

Avoid small thumbnails whenever a larger visual can be used.

The artwork should create the atmosphere.

---

# Accent Usage

Purple communicates entertainment.

Recommended usage:

- Book buttons
- Confirm attendance
- Active tabs
- Ratings
- Progress indicators
- Movie badges
- Showtime indicators
- Selection states
- Interactive controls

Purple should never dominate the screen.

It should quietly guide attention.

---

# Typography

Typography should feel editorial.

Movie titles deserve visual emphasis.

Examples:

Interstellar

The Dark Knight

Mission Impossible

Secondary information should remain understated.

The poster should remain the primary visual element.

---

# Cards

Movie cards should feel like premium editorial layouts.

Include:

- Large poster artwork
- Movie title
- Showtime
- Cinema
- Runtime
- Participant count

Avoid unnecessary metadata.

The artwork should remain the focal point.

---

# Buttons

Inside Movie experiences:

Primary actions may inherit the Movie accent.

Examples:

Reserve Seat

Join Movie Night

Confirm Attendance

View Showtimes

Outside Movie experiences, buttons return to the monochrome platform style.

---

# Progress

Progress indicators should inherit the Movie accent.

Examples:

Attendance progress

Booking completion

Planning progress

Watchlist completion

Progress should feel refined rather than energetic.

---

# Motion

Movie interactions should feel smooth and cinematic.

Examples:

Slow poster fades

Elegant page transitions

Soft image reveals

Gentle content movement

Animations should feel deliberate and polished.

Avoid playful or exaggerated motion.

---

# Emotional Goals

Movie experiences should make users feel:

- Excited
- Curious
- Relaxed
- Anticipatory
- Immersed

The interface should encourage people to experience the film together.

---

# Movies Rules

Do:

- Prioritize large posters.
- Use purple sparingly.
- Create editorial layouts.
- Keep typography elegant.
- Let artwork dominate.
- Preserve generous spacing.

Don't:

- Turn the interface purple.
- Replace posters with icons.
- Add unnecessary gradients.
- Overuse glow effects.
- Make layouts visually busy.
- Sacrifice readability for decoration.

Movies should feel like walking into a premium cinema, while remaining unmistakably Planless.

# Restaurants Experience

Restaurants is the most social experience within Planless.

It should feel warm, welcoming, and inviting, encouraging people to gather around food rather than simply reserve a table.

Unlike the rest of the platform, Restaurants introduces a rich red accent inspired by dining, conversation, and shared experiences.

The interface should feel comfortable rather than energetic.

The restaurant remains the hero.

---

# Philosophy

Food brings people together.

The interface should disappear behind beautiful food photography, thoughtful spacing, and inviting layouts.

Everything should feel premium without becoming luxurious or formal.

Think warmth.

Think hospitality.

Think conversations that last for hours.

---

# Semantic Tokens

## Primary Accent

Token

`color-category-restaurants`

Value

`#D93B4A`

Purpose

Primary semantic color for restaurant experiences.

---

## Accent Strong

Token

`color-category-restaurants-strong`

Value

`#B91C33`

Purpose

Pressed states.

Selections.

Primary interactions.

---

## Gradient Start

Token

`color-category-restaurants-gradient-start`

Value

`#E5484D`

---

## Gradient End

Token

`color-category-restaurants-gradient-end`

Value

`#B91C33`

---

## Glow

Token

`color-category-restaurants-glow`

Value

`rgba(217,59,74,0.12)`

Purpose

Subtle emphasis behind active dining actions.

Never decorative.

---

# Visual Characteristics

Restaurant experiences should feel

- Warm
- Friendly
- Comfortable
- Premium
- Human
- Social

Avoid making restaurants feel

- Corporate
- Technical
- Minimal to the point of emptiness
- Loud
- Aggressive

---

# Photography

Photography carries the experience.

Prioritize

- Food photography
- Restaurant interiors
- Table setups
- Coffee
- Desserts
- Shared meals
- Ambient lighting

Food should always be the visual hero.

Avoid relying on icons when photography exists.

---

# Accent Usage

Restaurant red communicates hospitality.

Recommended usage

- Reserve buttons
- Join Dinner
- Confirm attendance
- Restaurant badges
- Rating highlights
- Active filters
- Selected tabs
- Progress indicators

The interface should never become entirely red.

Red guides attention.

Black and white remain the foundation.

---

# Typography

Typography should feel relaxed and approachable.

Restaurant names deserve emphasis.

Examples

The Pasta Room

Sora Izakaya

Blue Tokai

Subtitle information should remain quiet.

Photography should remain the strongest visual element.

---

# Cards

Restaurant cards should feel welcoming.

Include

- Large hero photography
- Restaurant name
- Cuisine
- Location
- Rating
- Friends attending

Avoid cluttering cards with unnecessary metadata.

Generous spacing is preferred over density.

---

# Buttons

Inside Restaurant experiences

Primary actions inherit the Restaurant accent.

Examples

Reserve Table

Join Dinner

Book Spot

Confirm

Outside Restaurant experiences

Buttons return to the monochrome Planless style.

---

# Reviews

Reviews become the centerpiece.

Restaurant experiences should encourage

- Friend reviews
- Food photos
- Recommendations
- Favorite dishes
- Conversation

The social layer should feel more important than ratings alone.

---

# Motion

Animations should feel calm.

Examples

Soft fades

Comfortable transitions

Gentle image reveals

Slow card expansion

Nothing should feel overly playful.

---

# Emotional Goals

Restaurant experiences should make users feel

- Hungry
- Comfortable
- Curious
- Social
- Welcomed

The experience should encourage people to go out together.

---

# Restaurant Rules

Do

- Prioritize food photography.
- Use warm red sparingly.
- Keep layouts spacious.
- Highlight friend reviews.
- Make restaurants feel inviting.
- Keep interactions calm.

Don't

- Make the interface entirely red.
- Replace food photography with icons.
- Overuse gradients.
- Overdecorate cards.
- Make layouts feel like booking software.
- Sacrifice readability.

Restaurant experiences should feel like walking into your favorite café with friends, while remaining unmistakably Planless.