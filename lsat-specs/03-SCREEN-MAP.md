# LSAT Forge — Screen Map & Navigation

## Route Structure

```
/                       → Landing page (public)
/login                  → Auth page (public)
/signup                 → Auth page (public)
/dashboard              → Home after login (protected)
/practice               → Practice mode setup + session (protected)
/drill                  → Drill mode setup + session (protected)
/simulation             → Full test simulation (protected, pro only)
/weakspot               → Weak spot review session (protected, pro only)
/results/:sessionId     → Post-session results (protected)
/analytics              → Performance dashboard (protected, pro only)
/upgrade                → Paywall / pricing (protected)
/account                → Account settings (protected)
/success                → Post-Stripe success redirect (protected)
```

---

## Screen Descriptions

---

### / — Landing Page

**Purpose:** Convert visitors to signups. Explain the product clearly.

**Sections:**
1. Hero — headline, subheadline, CTA buttons (Start Free / See How It Works)
2. Problem — "LSAT prep is broken" — LawHub is clunky, books are static
3. How It Works — 3-step: Generate → Practice → Improve
4. Features grid — Unlimited questions, Full simulations, Smart analytics, Fresh every time
5. Pricing section — Free vs Pro cards with feature comparison
6. FAQ — 4-5 common objections
7. Footer — links, disclaimer that questions are AI-generated originals

**Key copy note:** Explicitly state "Questions are original AI-generated content modeled on LSAT logic — not sourced from official LSAT materials."

---

### /login + /signup — Auth Pages

**Single page with tab toggle between login/signup.**

Login fields: Email, Password, "Forgot password?" link
Signup fields: Full name, Email, Password
Social: "Continue with Google" button (above email form, separated by "or")
No email verification — go straight to dashboard on signup.

---

### /dashboard — Home

**Purpose:** Central hub. Shows status and quick launch options.

**Components:**
- Welcome header with name
- Free tier: questions remaining pill (e.g. "14 of 20 free questions used") + upgrade CTA
- Pro tier: streak / last session summary
- 4 mode cards: Practice, Drill, Simulation (pro lock), Weak Spot (pro lock)
- Recent sessions table (last 5) with score and date
- Quick stats row: Total questions, Avg accuracy, Tests completed

---

### /practice — Practice Mode

**Two states: Setup → Session**

**Setup state:**
- Question type selector (multi-select chips): All Types + 14 individual types
- Difficulty selector: Mixed / Easy / Medium / Hard
- Question count: 10 / 20 / 30
- "Generate Session" button
- Loading state while API generates questions

**Session state:**
- Progress bar (Q3/10)
- Question type tag
- Stimulus text (argument or passage)
- Question stem
- 5 answer choices (A-E)
- After answer: highlight correct/wrong + show explanation
- "Next" button
- Skip button (counts as wrong)
- Exit button (confirms before leaving)

---

### /drill — Drill Mode (Pro)

**Setup state:**
- Single question type selector (required)
- Difficulty: Easy / Medium / Hard
- Always 20 questions
- "Start Drill" button

**Session state:** Same as practice session UI.

**End state:** Score + accuracy for that type + comparison to historical average for that type.

---

### /simulation — Full Test Simulation (Pro)

**Pre-test screen:**
- Explain format: 3 sections, 35 min each, 1 min break between
- "This simulates real LSAT conditions" disclaimer
- Checklist: quiet space, no distractions, full 1h45m available
- "Begin Test" button — generates all 81 questions before starting

**Section screen:**
- Section header: "Section 1 — Logical Reasoning"
- Questions remaining + time remaining (countdown)
- Question display (same as practice but NO feedback, NO explanation)
- Answer flagging: small flag icon to mark for review
- Question navigator: numbered grid showing answered/flagged/unanswered
- "End Section" button (confirms)

**Break screen (between sections):**
- "Section complete. Break time."
- 1-minute countdown
- "Skip Break" button
- Brief message: next section info

**Results screen:**
- Section-by-section breakdown
- Total score + estimated LSAT range
- Accuracy by section
- Time per question average
- CTA: "See Full Analytics" → /analytics

---

### /weakspot — Weak Spot Review (Pro)

**Auto-generated — no setup screen.**

On load:
- Queries type_stats for user's lowest-accuracy types
- Generates 15 questions targeting bottom 3 types
- Shows loading state with "Analyzing your weak spots..."

**Session:** Same as practice session UI.

**End state:** Before/after comparison — "Your accuracy on Assumption questions went from 42% → 60% this session."

---

### /results/:sessionId — Results Page

**Shown after any completed session.**

**Components:**
- Big score display (e.g. 73%)
- Correct / Wrong / Time stats row
- Question-by-question breakdown table: Q number, type, result (✓/✗)
- Accuracy by question type (horizontal bar chart)
- CTA: "Practice Again" or "Go to Dashboard"
- For simulation: adds estimated score range prominently

---

### /analytics — Analytics Dashboard (Pro)

**Components:**
- Overall accuracy % (big number)
- Score trend line chart (last 10 sessions)
- Accuracy by question type (horizontal bar chart, all 14 types)
- Questions attempted lifetime
- Tests completed count
- Estimated score range based on all-time accuracy
- Weakest 3 types callout with "Drill This Type" CTA buttons
- Recent sessions table (last 10, with links to results)

---

### /upgrade — Paywall

**Shown when free user tries to access pro feature.**

**Components:**
- Lock icon + "This is a Pro feature"
- Context: what they were trying to do
- Pricing cards: Monthly ($29) and Annual ($199 — "Save 43%")
- Feature comparison list
- "Start Pro" buttons → Stripe Checkout
- "Continue Free" link back

---

### /account — Account Settings

**Components:**
- Profile section: name, email, avatar (from Google if OAuth)
- Subscription section:
  - Free: current plan + upgrade CTA
  - Pro: plan name, renewal date, "Cancel Subscription" link
- Danger zone: "Delete Account"

---

### /success — Post-Stripe Success

**Simple screen:**
- Confetti or checkmark animation
- "You're now Pro."
- Auto-redirect to /dashboard after 3 seconds

---

## Navigation

**Logged out:** Landing page only. Auth links in header.

**Logged in — Free:**
```
Dashboard | Practice | Upgrade (highlighted)
```

**Logged in — Pro:**
```
Dashboard | Practice | Drill | Simulation | Weak Spot | Analytics
```

**Header always shows:** Logo left, nav center, user avatar + dropdown right (Account / Logout)

**Mobile nav:** Hamburger → slide-out drawer with same links.
