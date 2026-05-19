# LSAT Forge — Build Order & Claude Code Prompts

## Overview

Feed these prompts to Claude Code in VS Code in order.
Each prompt is self-contained — do one, verify it works, then move to the next.
Never skip ahead. Each step depends on the previous.

---

## Pre-Build Checklist

Before starting any prompts:

1. Create Supabase project at supabase.com
2. Enable Google OAuth in Supabase Auth settings
3. Create Stripe account, add products ($29/mo, $199/yr), copy price IDs
4. Create Anthropic API key at console.anthropic.com
5. Have these env vars ready:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ANTHROPIC_API_KEY=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   STRIPE_MONTHLY_PRICE_ID=
   STRIPE_ANNUAL_PRICE_ID=
   VITE_STRIPE_MONTHLY_PRICE_ID=
   VITE_STRIPE_ANNUAL_PRICE_ID=
   ```

---

## PROMPT 1 — Project Scaffold

```
Create a new React + Vite + TypeScript project called lsat-forge with the following setup:

- Install dependencies: react-router-dom, @supabase/supabase-js, @supabase/auth-helpers-react, @tanstack/react-query, recharts, stripe
- Install dev dependencies: tailwindcss, postcss, autoprefixer, @types/react, @types/react-dom
- Configure Tailwind CSS
- Set up Google Fonts in index.html: Syne (700,800), DM Sans (300,400,500), DM Mono (400,500)
- Create .env.local with placeholder values for all environment variables listed in the spec
- Create src/lib/supabase.ts that initializes and exports the Supabase client
- Create src/types/index.ts with TypeScript interfaces for: Profile, Session, Response, TypeStat, SimulationResult, Question, GenerateParams
- Create src/constants/index.ts with QUESTION_TYPES array (all 14 LR types + rc with labels), DIFFICULTY_OPTIONS, and the score estimation mapping table
- Set up the base CSS variables in src/index.css matching the design tokens in 06-COMPONENTS.md
- Create the folder structure: src/components, src/pages, src/context, src/hooks, src/lib

Do not create any page content yet. Just the scaffold, config, and types.
```

---

## PROMPT 2 — Supabase Schema

```
Apply the following SQL to our Supabase project. Create a file supabase/schema.sql containing all of the SQL from 02-DATA-MODEL.md including:
- profiles table with RLS policies
- sessions table with RLS policies
- responses table with RLS policies
- type_stats table with RLS policies
- simulation_results table with RLS policies
- All helper functions: increment_questions_used, is_over_free_limit, update_type_stats
- The handle_new_user trigger for auto-creating profiles on auth signup

Also create supabase/config.toml for local development if it doesn't exist.

Print instructions for running this in the Supabase SQL editor.
```

---

## PROMPT 3 — Auth Context + Protected Routes

```
Build the authentication layer for lsat-forge:

1. Create src/context/AuthContext.tsx implementing the AuthContext interface from 07-STATE.md. It should:
   - Use @supabase/auth-helpers-react for user state
   - Fetch the user's profile from the profiles table
   - Expose: user, profile, isLoading, isPro, questionsRemaining, refreshProfile
   - isPro is true only when tier='pro' AND subscription_status='active'

2. Create src/components/ProtectedRoute.tsx that redirects to /login if not authenticated, and to /upgrade if requirePro=true and user is not pro.

3. Create src/App.tsx with React Router v6 setup. Routes:
   / → LandingPage (public)
   /login → AuthPage (public)
   /signup → AuthPage (public) -- same component, different tab
   /dashboard → DashboardPage (protected)
   /practice → PracticePage (protected)
   /drill → DrillPage (protected, pro)
   /simulation → SimulationPage (protected, pro)
   /weakspot → WeakSpotPage (protected, pro)
   /results/:sessionId → ResultsPage (protected)
   /analytics → AnalyticsPage (protected, pro)
   /upgrade → UpgradePage (protected)
   /account → AccountPage (protected)
   /success → SuccessPage (protected)

4. Wrap App in: QueryClientProvider, SessionContextProvider (from Supabase), AuthProvider

All page components can be empty stubs returning <div>PageName</div> for now.
```

---

## PROMPT 4 — App Shell + Navigation

```
Build the authenticated app shell for lsat-forge. Reference 06-COMPONENTS.md for design tokens.

1. Create src/components/AppShell.tsx:
   - Sidebar on desktop (240px wide), bottom tab bar on mobile
   - Sidebar contains: Logo top, nav links middle, user info bottom
   - Nav links: Dashboard, Practice, Drill (pro badge if free), Simulation (pro badge if free), Analytics (pro badge if free)
   - User info: avatar (initial if no photo), email, plan badge (FREE or PRO)
   - Use the design tokens: bg-base #09090b, bg-surface #111114, border #27272a, accent #e4e034
   - Font: Syne for logo and nav labels, DM Sans for secondary text

2. Create src/components/PageHeader.tsx:
   Props: title, subtitle?, action?
   Simple header with Syne font title

3. Wrap all protected routes in AppShell

4. Add a FreeTierBanner component that shows when user is free:
   - "X of 20 free questions used" with a progress bar
   - "Upgrade to Pro" button → /upgrade
   - Dismisses for the session (not permanently)
   - Show at top of dashboard and practice setup pages only
```

---

## PROMPT 5 — Landing Page

```
Build the landing page for lsat-forge at route /.

Sections in order:
1. Header: Logo left, "Login" and "Start Free" buttons right
2. Hero: 
   - Headline: "The LSAT Prep Tool That Never Runs Out of Questions"
   - Subheadline: "AI-generated practice questions modeled on real LSAT logic. Unlimited. Fresh every time."
   - Two CTAs: "Start Free — No Card Required" (primary, → /signup) and "See How It Works" (ghost, scrolls to features)
   - Disclaimer in small text: "All questions are original AI-generated content — not sourced from official LSAT materials"
3. Problem section: 3 pain points in a grid — "LawHub is clunky", "Books run out", "Tutors cost thousands"
4. Features grid: 4 cards — Unlimited Questions, Full Test Simulation, Smart Analytics, Fresh Every Session
5. Pricing: Two cards side by side — Free (list features, "Get Started") and Pro Monthly $29/mo + Pro Annual $199/yr "Save 43%"
6. FAQ: 5 questions as accordion
7. Footer: Logo, disclaimer, links

Use the dark design system. Syne for all headings. Accent color #e4e034 for CTAs and highlights.
Do not use any illustrations or stock images. Typography and color only.
```

---

## PROMPT 6 — Auth Page

```
Build the auth page at /login and /signup for lsat-forge.

Single page with tab toggle between Login and Sign Up.

Components:
1. Centered card on dark background
2. Logo at top
3. Tab toggle: Login / Sign Up (pill style)
4. "Continue with Google" button (full width, above form)
5. Divider: "or continue with email"
6. Form fields (Login: email + password; Signup: name + email + password)
7. Submit button
8. Error state: red text below form
9. "Forgot password?" link on login tab

Implementation:
- Use Supabase Auth for Google OAuth: supabase.auth.signInWithOAuth({ provider: 'google' })
- Use Supabase Auth for email: supabase.auth.signInWithPassword / signUp
- On success: navigate to /dashboard
- If user hits /login while already logged in: redirect to /dashboard
- Show loading spinner on submit button while request is pending

Use the design tokens. Keep it clean and minimal.
```

---

## PROMPT 7 — Supabase Edge Functions

```
Create the Supabase Edge Functions for lsat-forge. Create files in supabase/functions/:

1. supabase/functions/generate-questions/index.ts
   Implement exactly as specified in 04-AI-GENERATION.md including:
   - JWT auth verification
   - Free tier limit check (20 questions)
   - Pro-only mode check
   - Anthropic API call with the full system prompts from the spec
   - Session creation in DB
   - Return { questions, sessionId }

2. supabase/functions/complete-session/index.ts
   - Accept: { sessionId, responses[], totalTimeSeconds }
   - Insert all responses to responses table
   - Update session: status=completed, correct_count, score_pct, time_taken_seconds
   - Call update_type_stats SQL function
   - Increment profiles.questions_used
   - If mode=simulation: calculate score estimation and insert to simulation_results
   - Return updated profile

3. supabase/functions/create-checkout-session/index.ts
   Implement as specified in 05-STRIPE.md

4. supabase/functions/stripe-webhook/index.ts
   Implement all 4 webhook events as specified in 05-STRIPE.md

5. supabase/functions/cancel-subscription/index.ts
   Implement as specified in 05-STRIPE.md

6. supabase/functions/create-portal-session/index.ts
   Implement as specified in 05-STRIPE.md

7. supabase/functions/_shared/auth.ts
   Shared helper: getAuthUser(req) → User | null

Add all required environment variables to supabase/functions/.env
```

---

## PROMPT 8 — React Query Hooks

```
Create the data fetching layer for lsat-forge in src/hooks/:

1. src/hooks/useProfile.ts — fetches and caches user profile
2. src/hooks/useSessions.ts — fetches recent sessions list
3. src/hooks/useTypeStats.ts — fetches type_stats for analytics
4. src/hooks/useSimulationResults.ts — fetches simulation history
5. src/hooks/useGenerateQuestions.ts — mutation for calling generate-questions edge function, handles FreeLimitError and ProRequiredError
6. src/hooks/useCompleteSession.ts — mutation for calling complete-session edge function
7. src/hooks/useUpgrade.ts — mutation for create-checkout-session, redirects to Stripe URL on success

Implement using TanStack Query as specified in 07-STATE.md.
Include proper error handling and query key patterns from the spec.
```

---

## PROMPT 9 — Session Context + State Machine

```
Implement the quiz session state management for lsat-forge.

1. Create src/context/SessionContext.tsx implementing the SessionContext interface from 07-STATE.md
   - Use useReducer with the session state machine (IDLE → LOADING → ACTIVE → REVIEWING → COMPLETE)
   - Handle simulation sub-states (ACTIVE_SECTION_LR1 → BREAK → ACTIVE_SECTION_LR2 → BREAK → ACTIVE_SECTION_RC → COMPLETE)
   - Implement timer for simulation mode (useInterval, countdown from section start)
   - answerQuestion: records response, in practice mode → REVIEWING state, in timed mode → next question
   - completeSession: calls useCompleteSession mutation, navigates to /results/:sessionId
   - Add session backup to localStorage (save on every answer, clear on complete)

2. Create src/components/LoadingQuestions.tsx
   - Full-screen loading state shown while generate-questions is pending
   - Rotating messages every 2 seconds: "Generating your questions...", "Calibrating difficulty...", "Building your session..."
   - Subtle animation — not distracting
```

---

## PROMPT 10 — Question Components

```
Build the core question display components for lsat-forge. These are the most important UI components in the app.

1. src/components/QuestionCard.tsx
   Full implementation as specified in 06-COMPONENTS.md
   Props: stimulus, stem, choices, questionType, questionNumber, totalQuestions, mode, onAnswer, answered, correctIndex?, chosenIndex?, explanation?

2. src/components/ChoiceButton.tsx
   Props: letter, text, state ('default'|'correct'|'wrong'|'dimmed')
   - Default: dark card, hover lifts border to accent blue
   - Correct: green border + green letter, subtle green background tint
   - Wrong: red border + red letter, subtle red background tint
   - Dimmed: 40% opacity
   - Smooth 150ms transition

3. src/components/ExplanationBox.tsx
   - Slide down animation on mount
   - "Why this answer?" label in DM Mono
   - Explanation text in DM Sans
   - Accent-blue left border

4. src/components/ProgressBar.tsx
   - Thin 2px bar at top of quiz area
   - Accent yellow fill, smooth width transition
   - "Q3 / 10" label below right

5. src/components/QuestionTypeTag.tsx
   - Small pill showing question type
   - DM Mono font, small caps
   - Border style (not filled)

Design: dark cards, subtle borders, clean. Match the design tokens exactly.
```

---

## PROMPT 11 — Dashboard Page

```
Build the /dashboard page for lsat-forge.

Components to render:
1. Welcome header: "Good [morning/afternoon], [first name]."
2. FreeTierBanner (if free user)
3. 4 ModeCards in a 2x2 grid:
   - Practice: "Generate unlimited practice questions" → /practice
   - Drill: "Master one question type at a time" → /drill (locked if free)
   - Full Test Simulation: "81 questions, 3 sections, real timing" → /simulation (locked if free)
   - Weak Spot Review: "Target your lowest-accuracy areas" → /weakspot (locked if free)
4. Quick stats row: Total Questions Attempted, Average Accuracy, Tests Completed
5. Recent Sessions table (last 5 sessions from useSessions hook)
   Columns: Date, Mode, Score, Questions, View link

Use the AppShell layout. All data from React Query hooks.
Show skeleton loading states while data is fetching.
Empty state for sessions: "No sessions yet. Start practicing above."
```

---

## PROMPT 12 — Practice + Drill Pages

```
Build the /practice and /drill pages for lsat-forge.

Both pages have two states: Setup and Session.

PRACTICE PAGE (/practice):
Setup state:
- "Question Types" — multi-select chip grid with all 14 LR types + "All Types" toggle
- "Difficulty" — 3 chips: Mixed, Easy, Medium, Hard
- "Questions" — 3 chips: 10, 20, 30
- "Generate Questions" button → calls useGenerateQuestions, shows LoadingQuestions screen

Session state:
- Renders QuestionCard with current question
- ProgressBar at top
- After answer: shows ExplanationBox
- Skip button (records as wrong, moves to next)
- "Next Question" button after answering
- "Exit" button with confirmation modal

DRILL PAGE (/drill — Pro only):
Setup state:
- Single question type selector (required — must select one)
- Difficulty selector
- Always 20 questions
- "Start Drill" button

Session state: Same as practice session UI.

End of session for both: call completeSession, navigate to /results/:sessionId

Both pages use SessionContext for state management.
```

---

## PROMPT 13 — Full Test Simulation Page

```
Build the /simulation page for lsat-forge (Pro only).

States: Pre-Test → Loading → Section Active → Break → Section Active → Break → Section Active → Results

PRE-TEST SCREEN:
- Title: "Full LSAT Simulation"
- Format explanation: 3 sections, 35 min each, ~1h45m total
- Checklist: quiet space, timer ready, won't be interrupted
- Important note: "No feedback during the test — results shown at the end"
- "Begin Test" button → triggers generation of all 81 questions (3 parallel calls to generate-questions)

LOADING SCREEN:
- "Preparing your test..." with animated progress
- Calls generate-questions 3 times in parallel: {mode:'simulation', section:'lr1', count:27}, {section:'lr2', count:27}, {section:'rc', count:27}
- On complete: transition to Section 1

SECTION ACTIVE STATE:
- TestHeader: Section name + question counter + countdown timer
- QuestionCard (NO feedback, NO explanation)
- FlagButton on each question
- QuestionNavigator panel (collapsible on mobile): grid of Q numbers showing answered/flagged/unanswered
- "End Section" button → confirmation modal → SectionCompleteModal

BREAK SCREEN:
- "Section [N] complete."
- 60-second countdown
- What's next section info
- "Skip Break" button

RESULTS (redirect to /results/:sessionId with simulation data):
- Shows section-by-section breakdown
- Estimated LSAT score range prominently displayed
- Time per question average
```

---

## PROMPT 14 — Results + Analytics Pages

```
Build the /results/:sessionId and /analytics pages for lsat-forge.

RESULTS PAGE (/results/:sessionId):
- Fetch session and responses from Supabase using sessionId param
- ScoreDisplay: large score %, correct/wrong/time stats row
- For simulation: estimated LSAT score range in large display (e.g. "160-164")
- AccuracyByType: horizontal bar chart showing accuracy per question type answered
- QuestionBreakdown: scrollable table with Q#, Type, Result (✓/✗)
- CTAs: "Practice Again" → /practice, "Go to Dashboard" → /dashboard
- Share score button (copies text like "I scored 73% on LSAT Forge! 🎯")

ANALYTICS PAGE (/analytics — Pro only):
- LifetimeStats row: Total Questions, Tests Completed, Days Active
- Overall accuracy % (large number with label)
- EstimatedScoreRange based on all-time accuracy (use mapping table from 02-DATA-MODEL.md)
- ScoreTrendChart: line chart of last 10 sessions' scores using recharts
  - X axis: session dates, Y axis: score %
  - Accent color line, dots at each data point
- AccuracyByType: horizontal bars for ALL 14 question types
  - Green if >70%, amber if 50-70%, red if <50%
  - Sorted worst to best
- WeakSpotCallout: top 3 lowest-accuracy types as cards with "Drill This" CTA
- RecentSessions: last 10 sessions table with links to results

All data from useTypeStats, useSimulationResults, useSessions hooks.
Show empty states when no data yet.
```

---

## PROMPT 15 — Upgrade + Account Pages

```
Build the /upgrade and /account pages for lsat-forge.

UPGRADE PAGE (/upgrade):
- Shown when free user hits a pro feature, also accessible directly
- Context message at top if coming from a feature: "Full Test Simulation requires Pro"
- Two pricing cards side by side:
  Monthly: $29/month — list of features
  Annual: $199/year — "Save 43%" badge — same features — "Most Popular" highlight
- Feature comparison list below cards
- "Start Pro — Monthly" and "Start Pro — Annual" buttons → call useUpgrade mutation → redirect to Stripe
- "Continue with Free" link at bottom
- Use the dark design system. Make Pro feel worth it.

ACCOUNT PAGE (/account):
- Profile section: name, email (read-only if Google login)
- Subscription section:
  Free users: "Free Plan — 14/20 questions used" + upgrade CTA
  Pro monthly: "Pro Monthly — Renews [date]" + "Manage Billing" button → create-portal-session edge function
  Pro annual: "Pro Annual — Renews [date]" + "Manage Billing" button
  Past due: warning banner + "Update Payment" button
- "Cancel Subscription" link (only for pro, confirm modal before calling cancel-subscription)
- Danger zone: "Delete Account" (confirm modal, calls supabase.auth.admin.deleteUser)

SUCCESS PAGE (/success):
- Centered: checkmark icon, "You're now Pro."
- Subtitle: "Unlimited questions, full simulations, and analytics — all unlocked."
- Auto-redirect to /dashboard after 3 seconds with countdown shown
- Calls refreshProfile() on mount so isPro updates immediately
```

---

## PROMPT 16 — Polish + Deploy

```
Final polish pass and deployment setup for lsat-forge.

1. Add loading skeletons to all data-dependent components (dashboard stats, analytics charts, recent sessions)

2. Add toast notifications for:
   - Session completed successfully
   - Upgrade successful (also covered by /success page)
   - Error states (generation failed, network error)
   - Subscription canceled

3. Add error boundary wrapping the whole app with a friendly fallback screen

4. Create vercel.json:
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }

5. Create .env.example with all variable names (no values)

6. Update README.md with:
   - What the app is
   - Local dev setup instructions
   - Supabase setup steps
   - Stripe webhook setup steps
   - Deploy to Vercel instructions

7. Add meta tags to index.html:
   - Title: "LSAT Forge — Unlimited AI-Powered LSAT Practice"
   - Description: "Practice with unlimited AI-generated LSAT questions. Full test simulations, smart analytics, and detailed explanations."
   - OG tags for social sharing

8. Verify all routes work, all edge functions are deployed to Supabase, Stripe webhook is registered.

Print a final deployment checklist.
```
