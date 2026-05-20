# LSAT Forge — Architecture & Decision Log

Documents every significant architectural choice, why it was made, and what would change
if the decision were reversed. Update this when you make a new architectural decision.

---

## System Overview

```
Browser (React + Vite)
    │
    ├── Supabase Auth (JWT sessions, Google OAuth)
    ├── Supabase DB (Postgres, RLS, 5 tables)
    ├── Supabase Edge Functions (Deno runtime)
    │       ├── generate-questions  → Anthropic API
    │       ├── complete-session
    │       ├── create-checkout-session  → Stripe
    │       ├── stripe-webhook           ← Stripe events
    │       ├── cancel-subscription
    │       └── create-portal-session
    └── Vercel (static hosting + SPA rewrite)
```

---

## ADR-001: Supabase as the only backend

**Decision:** Use Supabase (Auth + Postgres + Edge Functions) rather than a separate
Node/Express/Next.js API server.

**Rationale:**
- Row Level Security provides per-user data isolation at the DB layer without writing
  authorization middleware
- Auth, DB, and Functions are co-located — Edge Functions can use the service role key
  without a network hop to a separate service
- Free tier covers early development; pricing scales with usage
- Google OAuth, email/password, and JWT sessions are zero-config

**Trade-offs accepted:**
- Deno runtime in Edge Functions (not Node) — some npm packages don't work; use esm.sh
- Edge Function cold starts (~300ms) — not suitable for latency-sensitive streaming
- Limited compute in Edge Functions — long-running simulation generation (all 81 questions)
  should use parallel calls, not one large sequential call

**If reversed:** Would need Express or Next.js API routes, separate JWT middleware,
a connection pooler for Postgres (PgBouncer/Supabase Pooler), and more infra.

---

## ADR-002: Questions are generated fresh, never stored

**Decision:** The Anthropic API generates questions on-demand per session. Questions are
returned to the frontend and held in React state. Only the user's responses (chosen index,
correct index, time spent) are written to the DB.

**Rationale:**
- Eliminates the content moderation and quality-control problem of a static question bank
- No intellectual property risk from storing question text (questions are ephemeral)
- Storage cost is zero for question content
- "Never the same test twice" is a genuine product differentiator

**Trade-offs accepted:**
- Generation takes 3-8 seconds — requires a loading screen
- Anthropic API has a cost per session (estimated $0.05-$0.25 depending on mode)
- No question deduplication — a user could theoretically see a very similar question twice
- Offline mode is impossible
- If the API call fails mid-session, questions are lost (session backup in localStorage
  mitigates partial loss)

**If reversed:** Would need a `questions` table, a content ingestion pipeline, tags and
difficulty metadata at import time, and deduplication logic.

---

## ADR-003: `@supabase/auth-helpers-react` for session management

**Decision:** Use `SessionContextProvider` + `useUser()` / `useSessionContext()` from
`@supabase/auth-helpers-react` rather than manually subscribing to `supabase.auth.onAuthStateChange`.

**Rationale:**
- The helper library handles the auth state subscription, token refresh, and SSR concerns
- `useUser()` returns the authenticated user synchronously from context (no await needed)
- `useSessionContext()` provides `isLoading` so ProtectedRoute can show a spinner rather than
  briefly rendering protected content before redirecting

**Trade-offs accepted:**
- `@supabase/auth-helpers-react` is a separate package from `@supabase/supabase-js`; both
  must stay in sync on version
- The `SessionContextProvider` must wrap `AuthProvider` (see INVARIANTS §7)
- This package is older; Supabase's newer `@supabase/ssr` package is the preferred approach
  for Next.js. For Vite/React, `auth-helpers-react` remains appropriate.

---

## ADR-004: React Router v6 layout routes for the authenticated shell

**Decision:** Use a pathless layout `<Route element={<ProtectedRoute><AppShell/></ProtectedRoute>}>` 
with `<Outlet/>` inside `AppShell`, rather than wrapping each individual route's element.

**Rationale:**
- The sidebar and banner stay mounted as users navigate — no remount, no flash
- One place to enforce auth rather than repeating `<ProtectedRoute>` on every element
- Follows React Router v6's idiomatic pattern; using v5-style wrapper-per-route in v6
  causes subtle issues with the Outlet injection model

**Code shape:**
```tsx
// App.tsx
<Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/drill" element={<ProtectedRoute requirePro><DrillPage /></ProtectedRoute>} />
  ...
</Route>

// AppShell.tsx
<main>
  <FreeTierBanner />
  <Outlet />   ← router injects the child page here
</main>
```

**Trade-offs accepted:**
- Individual pro-gated routes still carry their own `<ProtectedRoute requirePro>` because
  the layout-level check only handles "is the user logged in?" The pro check is per-route.
- AppShell must use `<Outlet/>`, not `{children}` — it cannot be used as a plain wrapper
  component outside of a layout route context.

---

## ADR-005: TanStack Query (React Query) + React Context — no global state library

**Decision:** Server state (profiles, sessions, type_stats) is managed by React Query.
Active quiz session state is managed by a React Context + `useReducer`. No Redux, Zustand,
Jotai, or other global state library.

**Rationale:**
- React Query handles caching, refetching, background sync, and optimistic updates for
  all server data. Writing this manually would be significant boilerplate.
- Session state (questions array, current index, responses) is local to a quiz in progress.
  Once the session ends it's discarded. A full global state library is overkill.
- `useContext` + `useReducer` gives a predictable state machine without adding a dependency.

**Trade-offs accepted:**
- No devtools for session context state (React Query has excellent devtools; the session
  reducer does not)
- If session state ever needs to be accessed from many unrelated parts of the tree, context
  prop-drilling avoidance becomes relevant — acceptable for the current scope

---

## ADR-006: All AI calls and payment calls happen in Edge Functions

**Decision:** The Anthropic API key and Stripe secret key are never in the frontend bundle.
All sensitive operations go through `supabase.functions.invoke()` which calls an Edge Function
that holds the keys in Supabase secrets.

**Rationale:**
- Browser bundles are public — any `VITE_ANTHROPIC_API_KEY` would be visible to anyone who
  opens DevTools → Network
- Edge Functions verify the Supabase JWT before any external API call, so unauthenticated
  users cannot trigger AI generation or payment flows
- Free-tier limits and pro-only mode checks are enforced in the Edge Function, not just
  the UI — a user cannot bypass them by calling the API directly

**Trade-offs accepted:**
- Edge Function cold starts add ~300ms to the first call after inactivity
- Debugging Edge Functions requires `supabase functions serve` locally or reading Supabase
  Function logs in the dashboard

---

## ADR-007: Stripe Checkout — never build a payment form

**Decision:** Use Stripe-hosted Checkout (redirect to `stripe.com/...`) rather than the
Stripe Elements embedded form.

**Rationale:**
- PCI compliance is Stripe's problem, not ours. A custom embedded form requires SAQ-D
  compliance attestation; Checkout is SAQ-A.
- Stripe Checkout handles 3DS, Apple Pay, Google Pay, and card saving automatically.
- Card data never touches our servers or browser code.

**Trade-offs accepted:**
- Users briefly leave the app domain. This causes a small drop in conversion vs. embedded
  forms. Acceptable for v1.
- Less control over the checkout page UI.

---

## ADR-008: Tailwind for layout, CSS variables for color

**Decision:** Tailwind utility classes handle spacing, flex/grid, responsive breakpoints,
and animations. Colors and typography come from CSS custom properties (`var(--accent)`, etc.)
defined in `src/index.css`, not from a Tailwind theme extension.

**Rationale:**
- Tailwind's responsive utilities (`md:flex`, `hidden md:block`) are concise and well-known
- Design tokens as CSS variables mean components can use them in inline `style` props and
  in plain CSS — not everything goes through Tailwind's `className` system
- If the design changes (e.g., switching from dark to light mode), updating 12 variables
  in one place recolors the whole app without touching component files

**Trade-offs accepted:**
- Mixing inline styles and Tailwind classes looks inconsistent in components. The rule is:
  colors → CSS variables via `style` prop; layout/spacing → Tailwind `className`.
- Tailwind's `purge` does not affect inline style values, so unused CSS variable names
  stay in the CSS but that is negligible.

---

## ADR-009: TypeScript strict mode enabled

**Decision:** `tsconfig.json` has `"strict": true`, `"noUnusedLocals": true`,
`"noUnusedParameters": true`.

**Rationale:**
- Prevents a class of runtime errors (null dereference, wrong argument type) at build time
- Forces explicit handling of `null` / `undefined` from Supabase query returns
- The entire src/ tree compiles with zero errors as a baseline

**Consequence:** Every Supabase query result typed as `T | null` must be null-checked before
use. Never use `!` (non-null assertion) on Supabase results — check and handle the null case.

---

## Component Responsibility Map

| Component              | Owns                                                        | Does NOT own |
|------------------------|-------------------------------------------------------------|--------------|
| `AuthContext`          | `user`, `profile`, `isPro`, `questionsRemaining`, `isLoading` | Routing, UI |
| `ProtectedRoute`       | Auth/pro redirect logic, loading spinner                    | Business logic |
| `AppShell`             | Sidebar layout, mobile tab bar, `<Outlet />`               | Page content |
| `FreeTierBanner`       | Question count display, session-scoped dismiss              | Profile mutation |
| `PageHeader`           | Title/subtitle/action slot layout                           | Data fetching |
| Edge Functions         | Auth verification, free limit, pro check, external API calls | UI |

---

## Status of Key Components (as of latest build)

**Completed:**
- `SessionContext` — quiz state machine (IDLE → LOADING → ACTIVE → REVIEWING → COMPLETE)
- All question display components (QuestionCard, ChoiceButton, ExplanationBox, ProgressBar, QuestionTypeTag)
- All data-fetching hooks (useProfile, useSessions, useTypeStats, useSimulationResults, useGenerateQuestions, useCompleteSession, useUpgrade)
- Core page implementations: LandingPage, AuthPage, DashboardPage, AccountPage, SuccessPage
- All Supabase Edge Functions (generate-questions, complete-session, create-checkout-session, stripe-webhook, cancel-subscription, create-portal-session)
- Landing page, Auth page, Stripe integration

**In progress or stub:**
- Practice page (`src/pages/PracticePage.tsx`)
- Drill page (`src/pages/DrillPage.tsx`)
- Simulation page (`src/pages/SimulationPage.tsx`)
- Weak Spot page (`src/pages/WeakSpotPage.tsx`)
- Results page (`src/pages/ResultsPage.tsx`)
- Analytics page (`src/pages/AnalyticsPage.tsx`)
- Upgrade page (`src/pages/UpgradePage.tsx`)
