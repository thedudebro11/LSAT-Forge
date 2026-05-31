# LSAT Forge — Codemap

Every file in the project, what it owns, and what to look for when making changes.
Keep this updated when adding files or significantly changing what a file does.

---

## Root

| File | Purpose |
|------|---------|
| `index.html` | App entry point. Loads Google Fonts (Syne 700/800, DM Sans 300/400/500, DM Mono 400/500). Sets `<title>`. |
| `vite.config.ts` | Vite config. React plugin only. No aliases defined yet. |
| `tailwind.config.js` | Tailwind content glob. No theme extensions — colors come from CSS variables. |
| `tsconfig.json` | TypeScript strict mode ON. `noUnusedLocals`, `noUnusedParameters` ON. |
| `package.json` | Dependencies. See §Dependencies below. |
| `.env` | Local env vars. Never commit. See `docs/ENV.md`. |

---

## `src/`

### `src/main.tsx`
App entry point rendered to `#root`.

**Provider tree (outermost → innermost):**
1. `QueryClientProvider` (TanStack Query)
2. `SessionContextProvider` (Supabase auth session — must be above AuthProvider)
3. `<App />` (contains `BrowserRouter` + `AuthProvider`)

If you add a new global provider, add it here. Keep the order constraint from INVARIANTS §7.

---

### `src/App.tsx`
React Router v6 route tree.

**Route structure:**
- Public routes (`/`, `/login`, `/signup`) — no shell, no auth guard
- Layout route — `<ProtectedRoute><AppShell/></ProtectedRoute>` (pathless)
  - All authenticated routes are children of this layout route
  - Pro-only routes additionally wrap their element in `<ProtectedRoute requirePro>`

**When adding a new route:** Add it as a child of the layout route if it needs the sidebar.
Add it at the top level if it's public or has its own full-screen layout.

---

### `src/index.css`
Global styles and design token definitions.

**CSS custom properties defined here:**
```
--bg-base, --bg-surface, --bg-elevated
--border, --border-strong
--text-primary, --text-secondary, --text-muted
--accent, --accent-hover, --accent-fg
--correct, --wrong, --warning, --info
```

**Additional rules:**
- `.bottom-tab-bar { display: none !important }` at 768px+ to hide mobile nav on desktop
- `.stat-grid-3` — 3-col grid with `min-width: 0` on children; collapses gracefully on narrow screens
- `.stat-num` — Syne 800, `1.75rem`; `clamp(1rem, 5.5vw, 1.75rem)` below 480px
- `.stat-num-lg` — Syne 800, `2.25rem`; same clamp below 480px (used by ResultsPage hero stats)
- Tailwind directives (`@tailwind base/components/utilities`)

**Do not** add color values in component files. Reference these variables.
**Do not** extend `tailwind.config.js` with color values — the variables are the source of truth.

---

### `src/lib/supabase.ts`
Exports the singleton Supabase client initialized with `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`. Import this everywhere you need a DB query. Do not create
a second Supabase client instance anywhere in the frontend.

---

### `src/types/index.ts`
All shared TypeScript interfaces. Keep in sync with `supabase/schema.sql`.

**Key type to watch:** `Profile` — fields must match the actual DB columns exactly.
The spec (`lsat-specs/02-DATA-MODEL.md`) contains stale field names. The canonical reference
is `supabase/schema.sql`. See INVARIANTS §2 for the tier values discrepancy.

**Current `Profile` interface:**
```typescript
interface Profile {
  id: string                  // = auth.users.id
  email: string
  full_name?: string
  avatar_url?: string
  tier: 'free' | 'monthly' | 'annual'
  questions_used: number
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: string  // no enum — Stripe owns these values
  subscription_period_end?: string
  created_at: string
  updated_at: string
}
```

**Session.status values** (updated — see INVARIANTS §12):
```typescript
status: 'in_progress' | 'paused' | 'completed' | 'abandoned'
```
Also has `checkpoint?: unknown` (JSONB column for pause/resume).

**Question interface** now includes optional fields for the trap-classifier feature:
```typescript
interface Question {
  // ...base fields...
  explanation?: string          // may be absent if wrong_explanations is used instead
  argument_gap?: string
  correct_explanation?: string
  wrong_explanations?: Array<{
    index: number
    trap_type: string
    trap_explanation: string
  }>
}
```

**ResponseRecord** now includes trap diagnosis fields:
```typescript
interface ResponseRecord {
  // ...base fields...
  selectedTrapType?: string
  correctDiagnosis?: boolean
}
```

---

### `src/constants/index.ts`
Static lookup tables:
- `QUESTION_TYPES` — 15 entries (14 LR types + `rc`), each `{ value, label }`
- `DIFFICULTY_OPTIONS` — `easy | medium | hard | mixed`
- `SCORE_ESTIMATION` — accuracy % ranges mapped to LSAT score bands (120–180)

---

## `src/context/`

### `src/context/SessionContext.tsx`
**Exports:** `SessionProvider`, `useSession`, `SessionMode`, `SessionCheckpoint`, and re-exports `Question`, `ResponseRecord` from `src/types/index.ts`

**State machine:** `idle → loading → active → reviewing → complete`

**Context value (full current API):**
```typescript
{
  state: SessionState
  currentQuestion: Question | undefined
  startSession: (params: GenerateParams) => Promise<void>
  answerQuestion: (chosenIndex: number) => void
  nextQuestion: () => void
  flagQuestion: (index: number) => void
  skipQuestion: () => void
  recordTrapDiagnosis: (selectedTrapType: string, correctDiagnosis: boolean) => void
  finishSession: () => Promise<void>
  completeSession: () => void
  reset: () => void
  pauseSession: () => Promise<void>    // saves checkpoint to DB, dispatches RESET
  resumeSession: (sessionId: string, mode: SessionMode, checkpoint: SessionCheckpoint) => void
}
```

**`pauseSession()`** calls the `pause-session` Edge Function with `{ sessionId, checkpoint }`.
On success, dispatches `RESET` (clears React state). The user is returned to the dashboard.

**`resumeSession()`** dispatches `RESUME` action which sets status to `active` and restores
questions, responses, and currentIndex from the checkpoint.

**`recordTrapDiagnosis()`** mutates the last response in the responses array to add
`selectedTrapType` and `correctDiagnosis` fields.

**`SessionCheckpoint` interface:**
```typescript
interface SessionCheckpoint {
  currentIndex: number
  questions: Question[]
  responses: ResponseRecord[]
}
```

**localStorage backup key:** `lsat_session_backup` — written on every answer, cleared on complete/pause.

---

### `src/context/AuthContext.tsx`
**Exports:** `AuthProvider`, `useAuth`

**What it provides:**
```typescript
{
  user: User | null           // Supabase auth user object
  profile: Profile | null     // Row from profiles table
  isLoading: boolean          // true while session or profile is loading
  isPro: boolean              // tier !== 'free' && subscription_status === 'active'
  questionsRemaining: number  // Math.max(0, 20 - questions_used)
  refreshProfile: () => Promise<void>  // call after billing changes
}
```

**When to call `refreshProfile()`:** After Stripe checkout completes (on `/success` page),
after canceling a subscription, or any time billing state may have changed externally.

**fetchProfile is wrapped in `useCallback` with `user?.id` dependency** — so `refreshProfile`
is a stable function reference and won't cause extra renders when passed as a prop.

---

## `src/components/`

### `src/components/ProtectedRoute.tsx`
**Props:** `children: ReactNode`, `requirePro?: boolean` (default `false`)

**Behavior:**
- `isLoading` → shows centered spinner
- `!user` → `<Navigate to="/login" replace />`
- `requirePro && !isPro` → `<Navigate to="/upgrade" replace />`
- Otherwise → renders `{children}`

This renders `{children}` (not `<Outlet/>`). When used as a layout route element, the children
is `<AppShell/>` which contains the `<Outlet/>`. That is what makes the layout route work.

---

### `src/components/AppShell.tsx`
**Exports:** `AppShell`

The authenticated layout. Renders using `<Outlet/>` (React Router v6 layout route pattern).

**Sections:**
1. Desktop sidebar (hidden below 768px via `className="hidden md:flex"`)
   - Logo: `LSAT` (white) + `FORGE` (accent), Syne 800
   - Nav links via `NavLink` with `style` function for active state (accent left border)
   - PRO badge on Drill, Simulation, Weak Spot, Analytics when `!isPro`
   - 7 nav items: Dashboard, Practice, Drill, Simulation, Weak Spot, Analytics, Account
   - User dropdown menu: triggered by avatar/name at bottom
     - Shows user name and email in dropdown header
     - Account Settings button → `/account`
     - Sign Out button (red hover state)
   - Avatar: inline with onError fallback to initial circle (accent bg)

2. Main content: `<FreeTierBanner/>` + `<Outlet/>`
3. Mobile bottom tab bar (visible below 768px)

**Sidebar width:** 240px. Main content has `md:ml-[240px]` offset.

**NAV_ITEMS array:** Each entry has `{ label, mobileLabel, to, Icon, proGated }`.
- `label` — used by desktop sidebar
- `mobileLabel` — used by mobile tab bar only (e.g. "Weak Spot" → "Weak" to prevent wrapping)
- `proGated` — shows PRO badge in desktop sidebar when `!isPro`

**Mobile tab bar behavior:**
- All 7 icons always visible, evenly spaced with `flex: 1`
- **Active tab only** shows its label (accent yellow); inactive tabs show icon only (gray)
- Label is always in DOM with `height: 10px` but `opacity: 0` when inactive — prevents height shift when switching tabs
- `aria-label={label}` on each NavLink for screen reader accessibility
- `whiteSpace: nowrap` and `overflow: hidden` prevent any label from wrapping

**Navigation protection (session-aware):**
- `handleNavClick` intercepts all NavLink clicks when a session is active
- **Practice / Drill / Weak Spot sessions** → shows a modal with three options:
  - Save & Leave → calls `pauseSession()`, navigates away
  - Stay in Session → dismisses modal
  - Abandon Session → marks session `abandoned` in DB, navigates away
- **Simulation sessions** → shows a lockout modal (cannot pause simulations)
  - Only option is to abandon (score not recorded) or return to test

**User dropdown:**
- Opens upward from the bottom user section
- Click-outside handler uses `[]` dependency array — listener added once on mount
- Dropdown is closed by clicking Account or Sign Out

---

### `src/components/TrapClassifier.tsx`
**Exports:** `TrapClassifier`

**Props:** `onSelect: (trapType: string) => void`

Shown after a user answers a practice/drill question incorrectly. Presents 5 labeled wrong-answer trap types (Opposite, Shell Game, Out of Scope, Distortion, Extreme Language). User picks which trap they fell for. This selection is recorded via `recordTrapDiagnosis()` in SessionContext and stored in the `responses` table as `selected_trap_type` / `correct_diagnosis`.

Used by QuestionCard → ExplanationBox flow. Only appears on wrong answers when `wrong_explanations` array is present on the question.

---

### `src/hooks/useFlagExplanation.ts`
**Exports:** `useFlagExplanation`

TanStack Query mutation hook. Calls the `flag-explanation` Edge Function with `{ question_type, stimulus, stem, explanation, rating, comment }`. Used in `ExplanationBox` to let users rate AI explanations as helpful or not helpful.

Returns standard `{ mutate, isPending, isSuccess, isError }`.

---

### `src/components/FreeTierBanner.tsx`
**Exports:** `FreeTierBanner`

Shows only when `profile.tier === 'free'` and user has not dismissed it this session.

**Dismiss state is local `useState`** — resets on page refresh. Not stored in localStorage.

**Layout:** Yellow-tinted strip below the sidebar, above page content. Contains progress bar
(used/20), "Upgrade to Pro →" button (navigates to `/upgrade`), and dismiss (✕) button.

---

### `src/components/PageHeader.tsx`
**Exports:** `PageHeader`

**Props:** `title: string`, `subtitle?: string`, `action?: ReactNode`

Simple presentational component. Title in Syne 700. Subtitle in DM Sans, `--text-secondary`.
Action is right-aligned (e.g., a button). No data fetching.

---

## `src/pages/`

| File | Route | Auth | Status | Notes |
|------|-------|------|--------|-------|
| `LandingPage.tsx` | `/` | Public | ✅ Done | Marketing page with CTA |
| `AuthPage.tsx` | `/login`, `/signup` | Public | ✅ Done | Tab toggle, Google OAuth + email/password |
| `DashboardPage.tsx` | `/dashboard` | Protected | ✅ Done | Greeting, 4 mode cards, stats, recent sessions, resume banner for paused sessions |
| `PracticePage.tsx` | `/practice` | Protected | ✅ Done | Setup screen + full session flow with pause, trap classifier |
| `DrillPage.tsx` | `/drill` | Pro | ✅ Done | Single type selector, 20 questions, pause, trap classifier |
| `SimulationPage.tsx` | `/simulation` | Pro | ✅ Done | Pre-test screen, 81 questions, 3 sections, timer, flag/navigator, break screens |
| `WeakSpotPage.tsx` | `/weakspot` | Pro | ✅ Done | Auto-targets lowest-accuracy types, pause, trap classifier |
| `ResultsPage.tsx` | `/results/:sessionId` | Protected | ✅ Done | Score hero (stat-num-lg), accuracy by type bars, question breakdown table |
| `AnalyticsPage.tsx` | `/analytics` | Pro | ✅ Done | Score trend chart (recharts), type accuracy bars, weak spot callout with Drill links |
| `UpgradePage.tsx` | `/upgrade` | Protected | ✅ Done | Monthly $29 / Annual $199 toggle, Stripe Checkout CTA |
| `AccountPage.tsx` | `/account` | Protected | ✅ Done | Profile editing, subscription status, manage billing, cancel sub |
| `SuccessPage.tsx` | `/success` | Protected | ✅ Done | 3-second auto-redirect to /dashboard with countdown |

---

## `supabase/`

### `supabase/schema.sql`
**The canonical database schema.** This is the source of truth. If this file and
`lsat-specs/02-DATA-MODEL.md` disagree, trust `schema.sql`.

**Run order matters:** The file runs top-to-bottom. Tables before their dependents.
Trigger must be created after the function it calls.

**Tables:** `profiles`, `sessions`, `responses`, `type_stats`, `simulation_results`, `flagged_explanations`

**Functions:**
- `increment_questions_used(p_user_id)` — increments counter, sets `updated_at`
- `is_over_free_limit(p_user_id)` — returns boolean, used in Edge Functions
- `update_type_stats(p_user_id, p_session_id)` — upserts rollup stats, IDEMPOTENT
- `handle_new_user()` — trigger function, auto-creates profile on auth.users INSERT

**Trigger:** `on_auth_user_created` fires AFTER INSERT on `auth.users`, calls `handle_new_user`.

**Applied migrations (in order):**
- `001_learning_features.sql` — adds `selected_trap_type` / `correct_diagnosis` columns to `responses`; creates `flagged_explanations` table with RLS
- `002_session_persistence.sql` — adds `checkpoint jsonb` column to `sessions`; documents that `status` now also accepts `'paused'` and `'abandoned'`

**`sessions.status` column values:** `'in_progress'` | `'paused'` | `'completed'` | `'abandoned'`
(was previously just `'active' | 'completed'` — old type definition was stale)

---

## `lsat-specs/`

Product and build specifications. These are the "what to build" documents.
They predate the implementation and some details are stale (see INVARIANTS §2).

| File | Contents |
|------|---------|
| `01-PRODUCT-SPEC.md` | Vision, pricing, question generation strategy, LSAT format reference |
| `02-DATA-MODEL.md` | DB schema — **partially stale** (tier='pro' is wrong; see INVARIANTS §2) |
| `03-SCREEN-MAP.md` | Route list and screen-by-screen UI descriptions |
| `04-AI-GENERATION.md` | Edge Function spec, system prompts, JSON output schema, cost estimation |
| `05-STRIPE.md` | Stripe flow, all webhook handlers, billing edge functions |
| `06-COMPONENTS.md` | Design tokens, component list with props, responsive breakpoints |
| `07-STATE.md` | State management approach, context interfaces, query keys, session state machine |
| `08-BUILD-PROMPTS.md` | Ordered Claude Code prompts for building the app end-to-end |

---

## Dependencies

```json
"dependencies": {
  "@supabase/auth-helpers-react": "^0.4.2",  // useUser, SessionContextProvider
  "@supabase/supabase-js": "^2.39.0",         // createClient, DB queries
  "@tanstack/react-query": "^5.17.0",         // server state caching
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.22.0",             // routing
  "recharts": "^2.10.0"                       // analytics charts (not yet used)
}
```

**Edge Functions summary (8 total):**

| Function | JWT required | What it does |
|---|---|---|
| `generate-questions` | Yes | Checks free limit + pro mode, calls Anthropic, creates session row, returns questions |
| `complete-session` | Yes | Inserts responses, updates session, calls `update_type_stats` RPC, increments `questions_used` |
| `pause-session` | Yes | Writes checkpoint JSONB to `sessions.checkpoint`, sets `status='paused'` |
| `flag-explanation` | Yes | Inserts row into `flagged_explanations` with user rating and optional comment |
| `create-checkout-session` | Yes | Creates/reuses Stripe customer, returns Checkout URL |
| `stripe-webhook` | **No** (`--no-verify-jwt`) | Handles 4 Stripe events, sets `tier`/`subscription_status` |
| `cancel-subscription` | Yes | Sets `cancel_at_period_end: true` on Stripe |
| `create-portal-session` | Yes | Returns Stripe billing portal URL |

---

**No icon library is installed.** All icons in `AppShell.tsx` are hand-written inline SVGs.
If you need many more icons, install `lucide-react` and replace the inline SVGs.

**No animation library is installed.** CSS `transition` handles the current animations.
For the session state machine loading screen and explanation slide-down, use CSS keyframes
or install `framer-motion` when building those components.
