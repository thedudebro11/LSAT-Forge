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
- `.bottom-tab-bar { display: none !important }` at 768px+ media query to hide mobile nav on desktop
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

---

### `src/constants/index.ts`
Static lookup tables:
- `QUESTION_TYPES` — 15 entries (14 LR types + `rc`), each `{ value, label }`
- `DIFFICULTY_OPTIONS` — `easy | medium | hard | mixed`
- `SCORE_ESTIMATION` — accuracy % ranges mapped to LSAT score bands (120–180)

---

## `src/context/`

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
3. Mobile bottom tab bar (visible below 768px via `className="md:hidden"`)

**Sidebar width:** 240px. Main content has `md:ml-[240px]` offset. The mobile tab bar
adds `pb-16` to main content to prevent content being hidden behind it.

**Nav items configured in the `NAV_ITEMS` array at the top of the file.** Current items (7 total):
Dashboard, Practice, Drill (pro), Simulation (pro), Weak Spot (pro), Analytics (pro), Account (free).
To add a new nav item, add to that array. The `proGated` field controls whether the PRO badge shows.

**User dropdown:**
- Opens upward from the bottom user section
- Click-outside handler uses `[]` dependency array (not [dropdownOpen]) to add listener once on mount
- Shows name and email; Account and Sign Out buttons
- Dropdown is modal: click Account or Sign Out closes it

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
| `LandingPage.tsx` | `/` | Public | ✅ Built | Marketing page with CTA |
| `AuthPage.tsx` | `/login`, `/signup` | Public | ✅ Built | Tab toggle, Google OAuth + email/password |
| `DashboardPage.tsx` | `/dashboard` | Protected | ✅ Built | Greeting, 4 mode cards, stats row, recent sessions table, skeleton loading |
| `PracticePage.tsx` | `/practice` | Protected | ❌ Stub | Setup (question types, difficulty, count) + session flow |
| `DrillPage.tsx` | `/drill` | Pro | ❌ Stub | Single type selector + session flow (20 questions) |
| `SimulationPage.tsx` | `/simulation` | Pro | ❌ Stub | Pre-test screen, 81 questions across 3 sections with timing |
| `WeakSpotPage.tsx` | `/weakspot` | Pro | ❌ Stub | Auto-generated weak area session |
| `ResultsPage.tsx` | `/results/:sessionId` | Protected | ❌ Stub | Score, stats, accuracy by type, question breakdown |
| `AnalyticsPage.tsx` | `/analytics` | Pro | ❌ Stub | Charts, type accuracy, score trends, weak spot callout |
| `UpgradePage.tsx` | `/upgrade` | Protected | ❌ Stub | Pricing toggle (monthly $29 / annual $199 "Save 43%"), Stripe CTA |
| `AccountPage.tsx` | `/account` | Protected | ✅ Built | Profile editing, subscription status, manage billing, cancel sub, delete account |
| `SuccessPage.tsx` | `/success` | Protected | ✅ Built | Checkmark, "You're now Pro", 3-second auto-redirect to /dashboard with countdown |

---

## `supabase/`

### `supabase/schema.sql`
**The canonical database schema.** This is the source of truth. If this file and
`lsat-specs/02-DATA-MODEL.md` disagree, trust `schema.sql`.

**Run order matters:** The file runs top-to-bottom. Tables before their dependents.
Trigger must be created after the function it calls.

**Tables:** `profiles`, `sessions`, `responses`, `type_stats`, `simulation_results`

**Functions:**
- `increment_questions_used(p_user_id)` — increments counter, sets `updated_at`
- `is_over_free_limit(p_user_id)` — returns boolean, used in Edge Functions
- `update_type_stats(p_user_id, p_session_id)` — upserts rollup stats, IDEMPOTENT
- `handle_new_user()` — trigger function, auto-creates profile on auth.users INSERT

**Trigger:** `on_auth_user_created` fires AFTER INSERT on `auth.users`, calls `handle_new_user`.

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

**No icon library is installed.** All icons in `AppShell.tsx` are hand-written inline SVGs.
If you need many more icons, install `lucide-react` and replace the inline SVGs.

**No animation library is installed.** CSS `transition` handles the current animations.
For the session state machine loading screen and explanation slide-down, use CSS keyframes
or install `framer-motion` when building those components.
