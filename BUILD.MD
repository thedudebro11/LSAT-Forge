# LSAT Forge — Automated Build Plan

## Instructions for Claude Code
Work through each prompt below in order. After completing each prompt:
1. Verify it works (run type checks, check browser at localhost:5173, confirm no console errors)
2. Document what was built by updating `BUILD-LOG.md` with the prompt number, files created/modified, and any decisions made
3. Automatically continue to the next prompt without waiting for confirmation
4. If a prompt fails, fix the error before moving on — do not skip

---

## PROMPT 5 — Landing Page

Build the landing page for lsat-forge at route `/`:

1. Header:
   - Logo left: "LSAT" in white + "FORGE" in `#e4e034`, Syne 800
   - Right: "Log In" ghost button → `/login`, "Start Free" filled accent button → `/signup`
   - Sticky, dark background, bottom border

2. Hero section:
   - Headline: "The LSAT Prep Tool That Never Runs Out of Questions" — Syne 800, large
   - Subheadline: "AI-generated practice questions modeled on real LSAT logic. Unlimited. Fresh every time."
   - Two CTAs: "Start Free — No Card Required" (accent filled → /signup), "See How It Works" (ghost, smooth scrolls to features)
   - Small disclaimer: "All questions are original AI-generated content — not sourced from official LSAT materials"

3. Problem section (id="how-it-works"):
   - Heading: "LSAT prep is broken"
   - 3 cards: "LawHub is clunky and outdated", "Prep books run out of questions", "Tutors cost thousands"

4. Features grid:
   - Heading: "Everything you need to score higher"
   - 4 cards: "Unlimited Questions", "Full Test Simulation", "Smart Analytics", "Fresh Every Session" — each with short description

5. Pricing section:
   - Two cards: Free ($0, 3 limitations) and Pro ($29/mo or $199/yr, "Save 43%" badge)
   - Pro card highlighted with accent border
   - CTA buttons: "Get Started Free" → /signup, "Start Pro" → /upgrade

6. FAQ accordion — 5 items:
   - "Are these real LSAT questions?"
   - "How is this different from LawHub?"
   - "Can I cancel anytime?"
   - "How many questions are available?"
   - "What LSAT sections are covered?"

7. Footer: Logo, AI-generated content disclaimer, copyright

Use only CSS variables from the design system. Syne for headings. No images or illustrations.

---

## PROMPT 6 — Auth Page

Build the auth page used for both `/login` and `/signup`:

1. Single page component with tab toggle between Login and Sign Up
2. Centered card on dark background with logo at top
3. "Continue with Google" button (full width, above form) using `supabase.auth.signInWithOAuth({ provider: 'google' })`
4. Divider "or continue with email"
5. Login form: email + password + "Forgot password?" link
6. Signup form: full name + email + password
7. Submit buttons show loading spinner while request is pending
8. Error messages shown in red below form
9. On success: navigate to `/dashboard`
10. If already logged in: redirect to `/dashboard`
11. Use `supabase.auth.signInWithPassword` for login, `supabase.auth.signUp` for signup

---

## PROMPT 7 — Supabase Edge Functions

Create all Supabase Edge Functions in `supabase/functions/`:

1. `supabase/functions/_shared/auth.ts` — helper that extracts and verifies JWT from Authorization header, returns user or null

2. `supabase/functions/generate-questions/index.ts`:
   - Verify JWT auth
   - Check free tier limit: query profiles where id=user.id, if tier='free' and questions_used >= 20 return `{ error: 'FREE_LIMIT_REACHED' }` with status 403
   - Check pro-only modes: if mode is 'drill', 'simulation', or 'weakspot' and tier is 'free', return `{ error: 'PRO_REQUIRED' }` with status 403
   - Call Anthropic API at `https://api.anthropic.com/v1/messages` with model `claude-sonnet-4-20250514`, max_tokens 8000
   - Use this system prompt for LR questions:
     "You are an expert LSAT question writer. You create original Logical Reasoning questions that match the style, structure, and difficulty of the real LSAT — but all content is entirely original and not sourced from any official LSAT materials. Each question must have: a stimulus (3-6 sentence argument), a question stem, exactly 5 answer choices (A-E), one correct answer index (0-4), and a detailed explanation covering why the correct answer is right and why each wrong answer fails. Question types: main_point, inference, strengthen, weaken, assumption, flaw, parallel, principle, point_at_issue, method, role, parallel_flaw, sufficient_assumption, necessary_assumption. Difficulty: easy (simple argument, obvious answer), medium (2-3 premises, one plausible trap), hard (complex argument, strong traps). Topics must vary widely: law, science, economics, history, philosophy, medicine, technology, education, environment, psychology. Return ONLY a valid JSON array. No preamble, no markdown fences."
   - Use this system prompt for RC questions:
     "You are an expert LSAT Reading Comprehension question writer. Create original passages (450-550 words) with 5-7 questions each. Passage types: law/policy, science, humanities, social science. Each question needs: type, stem, 5 choices, correctIndex, explanation. Return ONLY valid JSON. No preamble, no markdown fences."
   - User prompt: "Generate {count} original LSAT-style {LR or RC} questions. Types: {types}. Difficulty: {difficulty}. Vary topics. Return a JSON array."
   - Create session in DB, return `{ questions, sessionId }`

3. `supabase/functions/complete-session/index.ts`:
   - Accept: `{ sessionId, responses[], totalTimeSeconds }`
   - Insert all responses to responses table
   - Update session: status='completed', correct_count, score_pct, time_taken_seconds, completed_at
   - Call `update_type_stats(user_id, session_id)` SQL function
   - Increment `profiles.questions_used` by response count
   - If mode='simulation': calculate estimated score using accuracy % and insert to simulation_results
   - Return updated profile

4. `supabase/functions/create-checkout-session/index.ts`:
   - Verify auth
   - Get or create Stripe customer (check stripe_customer_id in profiles, create if missing)
   - Create Stripe Checkout Session with priceId from request body
   - success_url: `{origin}/success?session_id={CHECKOUT_SESSION_ID}`
   - cancel_url: `{origin}/upgrade`
   - metadata: `{ supabase_user_id: user.id }`
   - Return `{ url: session.url }`

5. `supabase/functions/stripe-webhook/index.ts`:
   - Verify Stripe webhook signature
   - Handle: `checkout.session.completed` → set tier='pro', store subscription_id, status='active', period_end
   - Handle: `customer.subscription.updated` → update subscription_status and period_end
   - Handle: `customer.subscription.deleted` → set tier='free', status='canceled'
   - Handle: `invoice.payment_failed` → set status='past_due'

6. `supabase/functions/cancel-subscription/index.ts`:
   - Set `cancel_at_period_end: true` on Stripe subscription (do not cancel immediately)

7. `supabase/functions/create-portal-session/index.ts`:
   - Create Stripe billing portal session
   - Return `{ url }`

Add all env vars to `supabase/functions/.env`

---

## PROMPT 8 — React Query Hooks

Create data fetching hooks in `src/hooks/`:

1. `useProfile.ts` — fetches profiles row for current user, staleTime 30s
2. `useSessions.ts` — fetches sessions for current user ordered by started_at desc, limit 10
3. `useTypeStats.ts` — fetches type_stats for current user ordered by accuracy_pct asc
4. `useSimulationResults.ts` — fetches simulation_results ordered by completed_at desc, limit 10
5. `useGenerateQuestions.ts` — mutation calling generate-questions edge function via `supabase.functions.invoke`. On error: if error contains FREE_LIMIT_REACHED throw FreeLimitError, if PRO_REQUIRED throw ProRequiredError. On success: invalidate profile query.
6. `useCompleteSession.ts` — mutation calling complete-session edge function. On success: invalidate sessions, typeStats, profile queries.
7. `useUpgrade.ts` — mutation calling create-checkout-session edge function, on success redirect to returned URL via `window.location.href`

Use queryKeys pattern:
```typescript
export const queryKeys = {
  profile: (userId: string) => ['profile', userId],
  sessions: (userId: string) => ['sessions', userId],
  typeStats: (userId: string) => ['typeStats', userId],
  simulationResults: (userId: string) => ['simulationResults', userId],
}
```

---

## PROMPT 9 — Session Context and State Machine

1. Create `src/context/SessionContext.tsx`:
   - useReducer with states: idle → loading → active → reviewing (practice only) → complete
   - Simulation sub-states: active_lr1 → break → active_lr2 → break → active_rc → complete
   - Timer for simulation using setInterval countdown
   - `answerQuestion(index, timeSpent)`: in practice/drill/weakspot mode → go to reviewing state; in simulation → record and go to next question immediately
   - `completeSession()`: call useCompleteSession mutation, navigate to `/results/:sessionId`
   - Session backup to localStorage on every answer, cleared on complete
   - Export `useSession` hook

2. Create `src/components/LoadingQuestions.tsx`:
   - Full screen loading state
   - Rotating messages every 2 seconds: "Generating your questions...", "Calibrating difficulty...", "Building your session...", "Almost ready..."
   - Subtle pulse animation, no spinner

---

## PROMPT 10 — Question Components

Build core question UI components:

1. `src/components/QuestionCard.tsx`:
   - Props: stimulus, stem, choices, questionType, questionNumber, totalQuestions, mode, onAnswer, answered, correctIndex?, chosenIndex?, explanation?
   - Stimulus in italic dark card with accent left border
   - Question stem in Syne 600
   - 5 ChoiceButtons below
   - ExplanationBox slides in after answering (practice/drill/weakspot only)

2. `src/components/ChoiceButton.tsx`:
   - Props: letter (A-E), text, state ('default'|'correct'|'wrong'|'dimmed')
   - Default: dark card, hover shifts border to accent blue
   - Correct: green border + green letter + subtle green bg tint
   - Wrong: red border + red letter + subtle red bg tint
   - Dimmed: 40% opacity
   - 150ms transition on all states

3. `src/components/ExplanationBox.tsx`:
   - Slide down animation on mount
   - "Why this answer?" label in DM Mono uppercase
   - Explanation text in DM Sans
   - Accent-blue left border

4. `src/components/ProgressBar.tsx`:
   - Props: current, total
   - 2px thin bar, accent yellow fill, smooth width transition
   - "Q{current} / {total}" label

5. `src/components/QuestionTypeTag.tsx`:
   - Props: type
   - Small pill, DM Mono font, border style not filled

---

## PROMPT 11 — Dashboard Page

Build `/dashboard` page:

1. Welcome header: "Good [morning/afternoon/evening], [first name]."
2. FreeTierBanner (imported, shows automatically for free users)
3. 4 ModeCards in 2x2 grid:
   - Practice: "Generate fresh practice questions" → /practice (always unlocked)
   - Drill: "Master one question type" → /drill (locked with PRO badge if free)
   - Full Test Simulation: "81 questions, real timing" → /simulation (locked if free)
   - Weak Spot Review: "Target your weak areas" → /weakspot (locked if free)
   - Locked cards: clicking navigates to /upgrade instead
4. Quick stats row: Total Questions Attempted, Average Accuracy %, Tests Completed — pulled from useTypeStats and useSessions
5. Recent Sessions table: last 5 sessions, columns Date / Mode / Score / Questions — from useSessions
6. Skeleton loading states while data fetches
7. Empty state for sessions: "No sessions yet. Start practicing above."

---

## PROMPT 12 — Practice and Drill Pages

Build `/practice` and `/drill` pages, each with Setup and Session states:

PRACTICE PAGE:
- Setup: question type multi-select chips (All Types + 14 individual), difficulty chips (Mixed/Easy/Medium/Hard), question count chips (10/20/30), "Generate Questions" button
- On generate: call useGenerateQuestions, show LoadingQuestions component
- Session: QuestionCard + ProgressBar, skip button (records as wrong), next button after answering, exit button with confirmation
- On complete: call completeSession → navigate to /results/:sessionId

DRILL PAGE (pro only):
- Setup: single required question type selector, difficulty selector, always 20 questions
- Session: same as practice
- End: completeSession → /results/:sessionId

Both use SessionContext for state.

---

## PROMPT 13 — Full Test Simulation Page

Build `/simulation` page (pro only):

States: pre-test → loading → section active → break → section active → break → section active → complete

PRE-TEST: Title, format explanation (3 sections × 35 min), checklist, "Begin Test" button

LOADING: Call generate-questions 3 times in parallel for lr1 (27q), lr2 (27q), rc (27q). Show "Preparing your test..." with progress.

SECTION ACTIVE:
- TestHeader component: section name + question counter + SectionTimer countdown (35 min)
- QuestionCard with NO feedback and NO explanation shown
- FlagButton on each question
- QuestionNavigator: numbered grid showing answered/flagged/unanswered status, collapsible on mobile
- "End Section" button with confirmation modal

BREAK SCREEN: "Section complete", 60s countdown, next section info, "Skip Break" button

On all sections complete: call completeSession → navigate to /results/:sessionId

---

## PROMPT 14 — Results and Analytics Pages

RESULTS PAGE (`/results/:sessionId`):
- Fetch session + responses using sessionId param
- Large score % display
- Simulation only: estimated LSAT score range displayed prominently (e.g. "160–164")
- Correct / Wrong / Time stats row
- AccuracyByType: horizontal bar chart per question type (green >70%, amber 50-70%, red <50%)
- QuestionBreakdown: scrollable table Q# / Type / Result
- CTAs: "Practice Again" → /practice, "Go to Dashboard" → /dashboard
- "Share Score" button copies text to clipboard

ANALYTICS PAGE (`/analytics` — pro only):
- LifetimeStats: total questions, tests completed
- Overall accuracy % large display
- Estimated score range from all-time accuracy using SCORE_ESTIMATION constant
- ScoreTrendChart: recharts line chart of last 10 session scores, accent color line
- AccuracyByType bars for all 14 question types sorted worst to best
- WeakSpotCallout: 3 lowest-accuracy types as cards with "Drill This" CTA → /drill
- Recent sessions table last 10 with links

---

## PROMPT 15 — Upgrade, Account, Success Pages

UPGRADE PAGE (`/upgrade`):
- Context message at top if navigated from a locked feature
- Two pricing cards: Monthly $29/mo and Annual $199/yr with "Save 43%" badge and "Most Popular" highlight
- Feature comparison list
- Buttons call useUpgrade mutation with appropriate priceId
- "Continue with Free" link

ACCOUNT PAGE (`/account`):
- Profile: name, email (read-only)
- Subscription status with renewal date for pro users
- "Manage Billing" button → create-portal-session edge function → redirect
- "Cancel Subscription" with confirmation modal → cancel-subscription edge function
- Danger zone: "Delete Account" with confirmation modal

SUCCESS PAGE (`/success`):
- Checkmark, "You're now Pro."
- Calls refreshProfile() on mount
- Auto-redirects to /dashboard after 3 seconds with visible countdown

---

## PROMPT 16 — Polish and Deploy

1. Add skeleton loading states to all data-dependent components
2. Add toast notifications (implement a simple toast system) for: session complete, upgrade success, errors, subscription canceled
3. Add error boundary wrapping entire app with friendly fallback
4. Create `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
5. Create `.env.example` with all variable names, no values
6. Update `README.md` with local dev setup, Supabase setup, Stripe webhook setup, Vercel deploy instructions
7. Add meta tags to `index.html`: title, description, OG tags
8. Run final type check: `npx tsc --noEmit`
9. Print final deployment checklist

---

## After All Prompts Complete

Update `BUILD-LOG.md` with final summary of everything built, all files created, and any outstanding items for post-launch.