# LSAT Forge — Claude Code Instructions

This file is automatically loaded by Claude Code. It tells you what this project is,
what's already built, and the rules you must follow when making changes.

---

## What This Project Is

LSAT Forge is an AI-powered LSAT prep web app. Users practice logical reasoning questions
generated fresh on demand by the Anthropic API. Free tier: 20 questions lifetime. Pro tier
($29/mo or $199/yr): unlimited questions, full test simulation, analytics.

**Stack:** React 18 + Vite + TypeScript + Tailwind + Supabase (Auth, Postgres, Edge Functions)
+ Stripe + Anthropic API. Deployed on Vercel.

---

## Build Status — Resume From Here

| Prompt | Layer | Status | Notes |
|--------|-------|--------|-------|
| 1 | Project scaffold | ✅ Done | |
| 2 | Database schema | ✅ Done | `supabase/schema.sql` |
| 3 | Auth context + protected routes | ✅ Done | `src/context/AuthContext.tsx`, `src/components/ProtectedRoute.tsx` |
| 4 | App shell (sidebar, mobile nav, free tier banner) | ✅ Done | `src/components/AppShell.tsx`, `FreeTierBanner.tsx`, `PageHeader.tsx` |
| 5 | Landing page | ✅ Done | `src/pages/LandingPage.tsx` — full implementation |
| 6 | Auth page (login/signup) | ✅ Done | `src/pages/AuthPage.tsx` — Google OAuth + email/password |
| 7 | Supabase Edge Functions | ✅ Done | All 6 functions + `_shared/auth.ts` |
| 8 | React Query hooks | ✅ Done | All 7 hooks in `src/hooks/` |
| 9 | Session context + state machine | ✅ Done | `src/context/SessionContext.tsx`, `src/components/LoadingQuestions.tsx` |
| 10 | Question display components | ✅ Done | `QuestionCard`, `ChoiceButton`, `ExplanationBox`, `ProgressBar`, `QuestionTypeTag` |
| **11** | **Dashboard page** | **⬅ NEXT** | `src/pages/DashboardPage.tsx` — see spec below |
| 12 | Practice + Drill pages | ❌ Stub | `src/pages/PracticePage.tsx`, `DrillPage.tsx` |
| 13 | Simulation page | ❌ Stub | `src/pages/SimulationPage.tsx` |
| 14 | Results + Analytics pages | ❌ Stub | `src/pages/ResultsPage.tsx`, `AnalyticsPage.tsx` |
| 15 | Upgrade + Account + Success pages | ❌ Stub | `src/pages/UpgradePage.tsx`, `AccountPage.tsx`, `SuccessPage.tsx` |
| 16 | Polish + Deploy | ❌ Not started | vercel.json, .env.example, error boundary, skeletons |

**Next prompt to give Claude:** "Continue the LSAT Forge build from PROMPT 11 — Dashboard page."

---

## What Each Completed Layer Did

### Hooks (`src/hooks/`)
- `useProfile.ts` — exports `useProfile()` and `queryKeys` (shared key factory)
- `useSessions.ts` — exports `useSessions(limit)`, `useSession(id)`, `useSessionResponses(id)`
- `useTypeStats.ts` — exports `useTypeStats()`
- `useSimulationResults.ts` — exports `useSimulationResults()`
- `useGenerateQuestions.ts` — exports `useGenerateQuestions()`, `FreeLimitError`, `ProRequiredError`
- `useCompleteSession.ts` — exports `useCompleteSession()`
- `useUpgrade.ts` — exports `useUpgrade()`, `useManageBilling()`, `useCancelSubscription()`

### Session Context (`src/context/SessionContext.tsx`)
State machine: `idle → loading → active → reviewing → complete`
- `startSession(params)` — calls `generate-questions` edge function
- `answerQuestion(index)` — records response; in simulation goes directly to next Q; in practice/drill goes to `reviewing`
- `nextQuestion()` — advances from `reviewing` to next Q or `complete`
- `skipQuestion()` — records wrong answer, skips review step
- `finishSession()` — calls `complete-session`, invalidates queries, navigates to `/results/:id`
- `flagQuestion(index)` — toggles flag set (simulation only)
- Auto-saves to `localStorage` key `lsat_session_backup` on every answer, clears on complete
- Simulation has countdown timer via `setInterval` that dispatches `TICK` every second

### Edge Functions (`supabase/functions/`)
- `_shared/auth.ts` — `getAuthUser()`, `serviceClient()`, `json()`, `corsResponse()`, `CORS` headers
- `generate-questions/` — verifies JWT, checks free limit (≥20), checks pro-only modes, calls Anthropic claude-sonnet-4-20250514, creates session row, returns `{ questions, sessionId }`
- `complete-session/` — inserts responses, updates session, calls `update_type_stats` RPC, calls `increment_questions_used` RPC, inserts simulation_results if mode=simulation, returns updated profile
- `create-checkout-session/` — creates/reuses Stripe customer, creates Checkout session
- `stripe-webhook/` — handles 4 events; **sets tier 'monthly'/'annual' NOT 'pro'** (critical)
- `cancel-subscription/` — sets `cancel_at_period_end: true`
- `create-portal-session/` — returns Stripe billing portal URL

### Question Components (`src/components/`)
- `QuestionCard` — props: `question, questionNumber, totalQuestions, mode, onAnswer, answered, chosenIndex?, showExplanation?`; renders stimulus, stem, 5 `ChoiceButton`s, optional `ExplanationBox`
- `ChoiceButton` — states: `default | correct | wrong | dimmed`; disabled when `state !== 'default'`
- `ExplanationBox` — slide-down animation, accent left border
- `ProgressBar` — thin 2px accent bar + "Q3 / 10" DM Mono label
- `QuestionTypeTag` — DM Mono pill, RC is blue-tinted, LR is border-only

---

## PROMPT 11 — Dashboard (build this next)

```
Build /dashboard. Uses AppShell layout (already handles shell).
Page content:

1. Welcome header: "Good [morning/afternoon/evening], [first_name or 'there']."
   - Get first name from profile.full_name?.split(' ')[0]

2. 4 ModeCards in a 2×2 grid:
   - Practice: "Generate unlimited practice questions" → /practice, always unlocked
   - Drill: "Master one question type at a time" → /drill, locked if !isPro
   - Simulation: "81 questions, 3 sections, real timing" → /simulation, locked if !isPro
   - Weak Spot: "Target your lowest-accuracy areas" → /weakspot, locked if !isPro
   - Locked cards: show lock icon + "Pro only" badge, clicking navigates to /upgrade

3. Quick stats row (3 boxes):
   - Total Questions (sum of all sessions' total_questions)
   - Avg Accuracy (avg of score_pct across completed sessions)
   - Tests Completed (count of simulation sessions)

4. Recent Sessions table (last 5 from useSessions(5)):
   - Columns: Date, Mode, Score, Questions, View
   - View → /results/:id
   - Empty state: "No sessions yet. Start practicing above."

5. Skeleton loading states (show gray pulse boxes while data is loading)

Use useAuth() for user/profile/isPro, useSessions(5) for recent sessions.
Data: count total_questions and avg score_pct from sessions array.
```

## PROMPT 12 — Practice + Drill Pages

```
Both pages use SessionContext. Two states each: Setup → Session.

PRACTICE (/practice):
Setup:
- "Question Types" multi-select chips: "All Types" toggle + 14 individual LR types + RC
  (from QUESTION_TYPES constant, value/label pairs)
- "Difficulty" chips: Mixed, Easy, Medium, Hard
- "Questions" chips: 10, 20, 30
- "Generate Questions" button → calls startSession({ mode:'practice', questionTypes, difficulty, count })
- Show LoadingQuestions while status === 'loading'

Session (status === 'active' | 'reviewing'):
- QuestionCard with current question
- mode prop: 'practice'
- onAnswer: calls answerQuestion(index)
- answered: status === 'reviewing'
- chosenIndex: last response's chosenIndex
- showExplanation: status === 'reviewing'
- "Next Question" button (visible only when status === 'reviewing') → nextQuestion()
- "Skip" button (visible only when status === 'active') → skipQuestion()
- "Exit" button → confirm modal → reset() + navigate('/dashboard')

DRILL (/drill — Pro):
Setup:
- Single question type dropdown/selector (required — must pick one from QUESTION_TYPES)
- Difficulty chips: Easy, Medium, Hard (no Mixed)
- Always 20 questions
- "Start Drill" → startSession({ mode:'drill', questionTypes:[selected], difficulty, count:20 })

Session: Same as practice session UI.
Both: When status becomes 'complete' SessionContext auto-calls finishSession() → navigates to /results/:id
```

## PROMPT 13 — Simulation Page

```
/simulation — Pro only. Full 3-section test.

States: pre-test | loading | active | complete (SessionContext handles 'complete' auto-nav)

PRE-TEST screen:
- Title "Full LSAT Simulation"
- Format: "3 sections · 35 minutes each · ~1h 45m total"
- Checklist: quiet space, no distractions, no feedback during test
- "Begin Test" button → generates all 81 questions via 3 parallel startSession calls
  Actually: call generate-questions 3 times via supabase.functions.invoke directly (not startSession,
  since startSession only handles one set). Or call startSession once for LR1 (27q), then manually
  fetch LR2 and RC and combine. Use Promise.all for parallel fetches.
  Simplest: single startSession({ mode:'simulation', questionTypes:['all'], difficulty:'mixed', count:81 })
  The edge function handles count:81 in one call.

ACTIVE screen (status === 'active'):
- Top bar: section label (derive from question index: 0-26 = LR1, 27-53 = LR2, 54-80 = RC)
- Time remaining from state.timeRemaining (formatted MM:SS)
  Amber when < 5min (300s), red + pulse when < 2min (120s)
- QuestionCard with mode='timed' (no explanation)
- Flag button → flagQuestion(currentIndex)
- Question navigator: grid of numbered buttons, answered=filled, flagged=yellow dot
- "End Section / Submit" button → if questions remain in section: confirm modal; else auto-advances

BREAK screen: Show between sections (after Q26, after Q53) — 60s countdown, "Skip Break" button.
Derive from currentIndex whether a break should show.
```

## PROMPT 14 — Results + Analytics Pages

```
RESULTS (/results/:sessionId):
- useParams() for sessionId
- useSession(sessionId) for session row
- useSessionResponses(sessionId) for responses
- Big score: session.score_pct + "%"
- Stats row: Correct, Wrong, Time (format seconds → M:SS)
- For simulation sessions: estimated score range (query simulation_results for this session_id)
- AccuracyByType: group responses by question_type, calc accuracy per type, horizontal bars
  Green >70%, amber 50-70%, red <50%
- QuestionBreakdown: scrollable table — Q#, Type, ✓ or ✗
- CTAs: "Practice Again" → /practice, "Dashboard" → /dashboard

ANALYTICS (/analytics — Pro):
- useTypeStats() for type accuracy bars
- useSessions() for score trend
- useSimulationResults() for simulation history
- useAuth() for profile
- Sections: Lifetime Stats row, Overall Accuracy, Estimated Score Range, Score Trend Chart (recharts LineChart), AccuracyByType bars sorted worst→best, WeakSpot callout (bottom 3 types with "Drill This →" buttons → /drill), Recent Sessions table
- All empty states when no data yet
```

## PROMPT 15 — Upgrade + Account + Success Pages

```
UPGRADE (/upgrade):
- useUpgrade() for checkout mutation
- Two pricing cards: Free ($0) + Pro (billing toggle monthly $29 / annual $199 "Save 43%")
- "Start Pro" → upgrade.mutate('monthly' or 'annual') → redirects to Stripe
- Show loading state on button while mutating
- "Continue Free" link → /dashboard
- Optional: read ?feature= query param to show context ("Full Test Simulation requires Pro")

ACCOUNT (/account):
- useAuth() for profile/isPro/refreshProfile
- useManageBilling(), useCancelSubscription()
- Sections:
  Profile: name (editable via supabase.from('profiles').update), email (read-only)
  Subscription:
    free: "Free Plan — X/20 questions used" + Upgrade CTA → /upgrade
    active: "Pro [Monthly/Annual] · Renews [date]" + "Manage Billing" button → useManageBilling()
    past_due: warning banner + "Update Payment" → useManageBilling()
    canceled: "Canceled · Access until [date]" + Upgrade CTA
  Cancel link: only for active subscribers, confirm modal → useCancelSubscription()
  Danger zone: "Delete Account" confirm modal → supabase.auth.signOut() + note to contact support

SUCCESS (/success):
- On mount: call refreshProfile() so isPro updates immediately
- Checkmark icon (large, accent colored)
- "You're now Pro." in Syne 800
- Subtitle: "Unlimited questions, full simulations, and analytics — all unlocked."
- Auto-redirect to /dashboard after 3 seconds (show countdown)
- useEffect with setTimeout + navigate
```

## PROMPT 16 — Polish + Deploy

```
1. Add vercel.json at project root:
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }

2. Create .env.example (no values, just keys):
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_STRIPE_MONTHLY_PRICE_ID=
   VITE_STRIPE_ANNUAL_PRICE_ID=

3. Add React Error Boundary wrapping <App /> in main.tsx:
   class ErrorBoundary extends React.Component with fallback UI

4. Add OG meta tags to index.html:
   title: "LSAT Forge — Unlimited AI-Powered LSAT Practice"
   description: "Practice with unlimited AI-generated LSAT questions..."
   og:title, og:description, og:type=website

5. Skeleton loading: In DashboardPage and AnalyticsPage, show gray pulse boxes
   while React Query is loading (isLoading === true)
   Use a simple <Skeleton /> component: div with bg-elevated + pulse animation

6. Update CLAUDE.md Build Status table to show all Done.

After all done, run: npm run build — fix any errors — then the app is ready to deploy.
```

---

## Critical Rules — Read Before Changing Anything

### 1. Tier values
DB uses `'free' | 'monthly' | 'annual'`. Never write `'pro'`. See `docs/INVARIANTS.md §2`.

### 2. `isPro` logic lives in `AuthContext` only
`profile.tier !== 'free' && profile.subscription_status === 'active'`

### 3. Provider order in App.tsx is fixed
`BrowserRouter > AuthProvider > SessionProvider > Routes`
In main.tsx: `QueryClientProvider > SessionContextProvider > App`

### 4. All API keys stay server-side
`ANTHROPIC_API_KEY` and `STRIPE_SECRET_KEY` are Supabase Edge Function secrets only.

### 5. Questions are never stored in the database

### 6. `type_stats` written only by `update_type_stats()` SQL RPC

### 7. Stripe webhook is the only thing that sets `tier`

---

## Design System (quick ref)

```
Colors (CSS vars):    --bg-base #09090b  --bg-surface #111114  --bg-elevated #18181b
                      --border #27272a   --accent #e4e034       --accent-fg #09090b
                      --text-primary #fafafa  --text-secondary #a1a1aa  --text-muted #52525b
                      --correct #22c55e  --wrong #ef4444  --warning #f59e0b

Fonts:  Syne 700/800 = headings/logo/CTAs
        DM Sans 400/500 = body/UI
        DM Mono 400/500 = mono/tags/scores

Pattern: Tailwind for layout. CSS vars in style= for all colors.
```

## File Locations

| What | Where |
|------|-------|
| Supabase client | `src/lib/supabase.ts` |
| Auth context | `src/context/AuthContext.tsx` |
| Session context | `src/context/SessionContext.tsx` |
| Route tree | `src/App.tsx` |
| Types | `src/types/index.ts` |
| Constants (QUESTION_TYPES etc) | `src/constants/index.ts` |
| All hooks | `src/hooks/` |
| All components | `src/components/` |
| All pages | `src/pages/` |
| Edge Functions | `supabase/functions/` |
| DB schema | `supabase/schema.sql` |
| Maintenance docs | `docs/` |
| Original specs | `lsat-specs/` |

## Commands

```bash
npm run dev          # local dev server
npx tsc --noEmit    # type check (must pass before any commit)
npm run build        # production build
```
