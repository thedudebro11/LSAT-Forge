# LSAT Forge — Component Inventory & Design System

## Design Direction

**Aesthetic:** Dark academic utility. Clean, serious, fast. Not a flashy edtech startup — a focused tool for people who need to perform.
**Inspiration:** Linear.app meets a law school study room.
**NOT:** Purple gradients, bouncy animations, patronizing illustrations.

---

## Design Tokens

```css
:root {
  /* Backgrounds */
  --bg-base: #09090b;        /* Page background */
  --bg-surface: #111114;     /* Cards, panels */
  --bg-elevated: #18181b;    /* Hover states, inputs */

  /* Borders */
  --border: #27272a;
  --border-strong: #3f3f46;

  /* Text */
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted: #52525b;

  /* Accent */
  --accent: #e4e034;          /* Primary CTA, highlights */
  --accent-hover: #caca2c;
  --accent-fg: #09090b;       /* Text on accent backgrounds */

  /* Semantic */
  --correct: #22c55e;
  --wrong: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;

  /* Typography */
  --font-display: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'DM Mono', monospace;

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

---

## Typography

```
Google Fonts imports:
- Syne: 700, 800 (headings, labels, CTAs)
- DM Sans: 300, 400, 500 (body, UI text)
- DM Mono: 400, 500 (question numbers, scores, tags, code)
```

Scale:
```
display: Syne 800, 48-72px, tracking -0.03em
h1: Syne 800, 36px
h2: Syne 700, 24px
h3: Syne 700, 18px
label: DM Mono 500, 11px, uppercase, tracking 0.1em
body: DM Sans 400, 15px, line-height 1.7
small: DM Sans 400, 13px
mono: DM Mono 400, 13px
```

---

## Component List

### Layout Components

**AppShell**
- Authenticated layout wrapper
- Sidebar nav (desktop) + top bar
- Sidebar: Logo, nav links with icons, user avatar + plan badge at bottom
- Mobile: top bar + bottom tab bar

**PageHeader**
```
Props: title, subtitle?, breadcrumb?, action?
```

---

### Auth Components

**AuthCard**
- Centered card with logo
- Tab toggle: Login / Sign Up
- Google OAuth button (top, prominent)
- Divider "or"
- Email/password form
- Error state display

---

### Dashboard Components

**ModeCard**
```
Props: title, description, icon, href, locked (boolean), lockReason?
```
- Clickable card navigating to mode
- Locked state: shows lock icon + "Pro only" badge, click → /upgrade

**QuickStats**
```
Props: totalQuestions, avgAccuracy, testsCompleted
```
- 3-column row of stat boxes

**FreeTierBanner**
```
Props: questionsUsed, questionsTotal (20)
```
- Progress bar showing 14/20 used
- "Upgrade for unlimited" CTA
- Hidden for pro users

**RecentSessions**
```
Props: sessions[]
```
- Table: Date, Mode, Score, Questions
- "View" link per row → /results/:id

---

### Question Components

**QuestionCard**
Core question display. Used in all modes.
```
Props:
  stimulus: string
  stem: string
  choices: string[]
  questionType: string
  questionNumber: number
  totalQuestions: number
  mode: 'practice' | 'timed' | 'drill'
  onAnswer: (index: number) => void
  answered: boolean
  correctIndex?: number (shown after answer in practice mode)
  chosenIndex?: number
  explanation?: string (shown after answer in practice mode)
```

States:
- Unanswered: choices are clickable buttons
- Answered correct: chosen choice glows green, others dim
- Answered wrong: chosen choice glows red, correct glows green, explanation appears
- Timed mode: no feedback shown, just "Answered" state

**ChoiceButton**
```
Props: letter (A-E), text, state ('default'|'correct'|'wrong'|'dimmed'|'flagged')
```

**ExplanationBox**
- Animated slide-down after answer
- "Why this answer?" label
- Explanation text
- Only shown in practice/drill/weakspot modes

**ProgressBar**
```
Props: current, total
```
- Thin bar at top of quiz
- "Q3 / 10" label

**QuestionTypeTag**
```
Props: type
```
- Pill with question type name
- Color-coded by category (LR types one color, RC another)

---

### Timer Components

**SectionTimer**
```
Props: totalSeconds, onExpire
```
- Countdown MM:SS
- Turns amber at 5 minutes
- Turns red at 2 minutes, pulses
- Used in simulation mode only

**BreakTimer**
```
Props: seconds, onSkip, nextSectionName
```
- Large countdown
- "Skip Break" button

---

### Results Components

**ScoreDisplay**
```
Props: correct, total, mode
```
- Giant percentage
- Correct/Wrong/Time stats row
- Estimated LSAT range (simulation only)

**QuestionBreakdown**
```
Props: responses[]
```
- Table: Q#, Type, Result (✓/✗)
- Scrollable if long

**AccuracyByType**
```
Props: typeStats[]
```
- Horizontal bar chart
- Each bar: type name, accuracy %, bar fill
- Color: green if >70%, amber if 50-70%, red if <50%

---

### Analytics Components

**ScoreTrendChart**
```
Props: sessions[] (last 10 with scores)
```
- Line chart using recharts
- X: session date, Y: score %
- Shows trend line

**WeakSpotCallout**
```
Props: weakTypes[] (bottom 3 types)
```
- 3 cards showing type name + accuracy
- "Drill This" CTA button each

**LifetimeStats**
```
Props: profile
```
- Total questions, tests completed, days active

---

### Simulation Components

**TestHeader**
```
Props: sectionName, questionsRemaining, timeRemaining
```
- Sticky top bar during simulation
- Section name left, timer right, questions center

**QuestionNavigator**
```
Props: questions[], currentIndex, responses{}
```
- Grid of numbered buttons
- Colors: unanswered (empty), answered (filled), flagged (yellow dot)
- Click to jump to question

**FlagButton**
Small button on each question in simulation mode. Marks for review.

**SectionCompleteModal**
- Appears when user clicks "End Section" or time expires
- "You answered X of Y questions"
- "Continue to Break" button

---

### Paywall Components

**UpgradeModal**
```
Props: featureName, onClose
```
- Triggered when free user hits pro feature
- Brief value prop
- Monthly/Annual pricing cards
- CTA buttons → Stripe

**PricingCard**
```
Props: plan ('monthly'|'annual'), price, features[], highlighted
```

---

### Shared UI Primitives

**Button**
```
Props: variant ('primary'|'secondary'|'ghost'|'danger'), size, loading, disabled
```

**Input**
- Dark styled, border on focus

**Badge**
```
Props: text, variant ('default'|'pro'|'free'|'success'|'warning')
```

**Spinner**
- Used during question generation loading state

**EmptyState**
```
Props: title, description, action?
```

**Modal**
- Backdrop + centered card
- Accessible (focus trap, Escape to close)

---

## Loading States

Question generation takes 3-8 seconds. Show a loading screen with:
- Animated logo or subtle pulse
- Rotating messages:
  - "Generating your questions..."
  - "Calibrating difficulty..."
  - "Building your session..."
- Never show a bare spinner with no context

---

## Responsive Breakpoints

```
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px
```

Key responsive decisions:
- Sidebar nav collapses to bottom tab bar on mobile
- QuestionNavigator (simulation) collapses to a "Jump to" dropdown on mobile
- Analytics charts scroll horizontally on mobile
- Pricing cards stack vertically on mobile
