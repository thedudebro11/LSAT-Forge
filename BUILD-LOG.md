# LSAT Forge — Build Log

## Full App Audit (2026-05-19)

### Issues Found and Fixed

---

#### [CRITICAL] SimulationPage — Submit Test discarded session without saving

**File:** `src/pages/SimulationPage.tsx`

`handleEndSection` for the final section called `reset()` + `navigate('/dashboard')` — a leftover TODO stub. This discarded the entire simulation without calling `complete-session`, so no results were ever saved to Supabase and the user was sent to the dashboard with no feedback.

**Fix:** Added `completeSession()` to `SessionContext` (dispatches the existing `COMPLETE` action), exported it in the context value, and called it from `handleEndSection` when the user submits the final section. The existing `useEffect` in SessionContext watching `state.status === 'complete'` then automatically calls `finishSession()`, saves results, and navigates to the results page.

---

#### [BUG] ResultsPage — Time stat always showed "—"

**File:** `src/pages/ResultsPage.tsx`

The Time card accessed `session?.total_time_seconds` but the DB column (and what `complete-session` writes) is `time_taken_seconds`. The field was always undefined, so the card always showed `—`.

**Fix:** Changed to `session?.time_taken_seconds`.

---

#### [BUG] DashboardPage — "View →" caused full page reloads

**File:** `src/pages/DashboardPage.tsx`

The sessions table used a plain `<a href="/results/:id">` instead of React Router's `<Link>`. Every click triggered a full browser navigation, losing all React state and re-fetching everything from scratch.

**Fix:** Changed to `<Link to={...}>` (added `Link` to the react-router-dom import).

---

#### [NAV GAP] AppShell — No `/account` link anywhere in the UI

**File:** `src/components/AppShell.tsx`

The Account page was completely unreachable from the UI. There was no nav item for it in the sidebar or mobile tab bar. Users could only reach it by typing the URL directly.

**Fix:** Made the user info footer at the bottom of the sidebar clickable (`onClick={() => navigate('/account')}`). This is the standard pattern (clicking your avatar/name goes to account settings).

---

#### [NAV GAP] AppShell — No `/weakspot` nav link

**File:** `src/components/AppShell.tsx`

WeakSpot was only reachable via the Dashboard ModeCard. It had no sidebar entry or mobile tab item, so users who navigated away from the dashboard had no way back.

**Fix:** Added WeakSpot to `NAV_ITEMS` with `proGated: true` and a new `WeakSpotIcon` (warning/exclamation circle SVG). Appears in both desktop sidebar and mobile tab bar.

---

#### [NAV GAP] AppShell — Analytics showed no PRO badge for free users

**File:** `src/components/AppShell.tsx`

Analytics was `requirePro` in `App.tsx` but had `proGated: false` in `NAV_ITEMS`. Free users saw no PRO badge, clicked it, and were silently redirected to `/upgrade` with no explanation.

**Fix:** Changed `proGated: false` → `proGated: true` for Analytics in `NAV_ITEMS`. The PRO badge now appears for free users.

---

#### [MISSING FEATURE] AccountPage — No sign-out button

**File:** `src/pages/AccountPage.tsx`

There was no way to log out of the application from the UI at all.

**Fix:** Added a "Sign Out" button at the bottom of the actions section that calls `supabase.auth.signOut()` and navigates to `/`.

---

#### [MISSING FEATURE] AccountPage — Name was read-only

**File:** `src/pages/AccountPage.tsx`

The spec requires the name field to be editable. It was rendered as a static `<div>`.

**Fix:** Added inline edit flow — clicking "Edit" next to the name shows an input + Save/Cancel buttons. Save calls `supabase.from('profiles').update({ full_name })` then `refreshProfile()` to sync the sidebar immediately. Supports Enter to save, Escape to cancel.

---

#### [UX GAP] Analytics "Drill This →" didn't pre-select the type

**File:** `src/pages/AnalyticsPage.tsx`, `src/pages/DrillPage.tsx`

The weak spot callout had a "Drill This →" button that navigated to `/drill` without passing which type to drill. Users arrived at the drill setup page with nothing pre-selected and had to find the type manually from a dropdown of 15 options.

**Fix:** Navigation now passes `?type=<question_type>` as a query param. `DrillPage` reads it with `useSearchParams()` and uses it as the initial state for `questionType`.

---

#### [TYPES] types/index.ts — All interfaces were stale

**File:** `src/types/index.ts`

The `Session`, `Response`, `TypeStat`, `SimulationResult`, and `Question` interfaces didn't match the actual DB schema or the data shapes used throughout the app. For example, `Session` had `session_type` / `correct_answers` / `completed_questions` while the DB and all pages use `mode` / `correct_count` / `score_pct` / `time_taken_seconds` / `status`. Same mismatches for `Response` and `TypeStat`.

**Fix:** Rewrote all interfaces to match the actual DB columns and the data shapes used in pages and hooks. Also added `ResponseRecord` and updated `GenerateParams` to reflect the current API contract.

---

### Verified Working (No Changes Needed)

- `/` landing page — loads, CTAs present
- `/login` and `/signup` — both render `AuthPage`, Google OAuth + email/password wired up
- `/dashboard` — skeleton loading, ModeCards navigate correctly, stats calculated from sessions
- `/practice` — setup chips, session flow, exit modal all functional
- `/drill` — setup dropdown, session flow, exit modal functional
- `/simulation` — pre-test screen, break screens, question navigator, flag button all functional; submit now saves correctly (see fix above)
- `/weakspot` — fetches type_stats, shows weak types or "not enough data" fallback
- `/results/:sessionId` — accuracy-by-type bars, question breakdown table, CTAs functional
- `/analytics` — score trend chart, weak spot callout, accuracy bars; empty state shown when no data
- `/upgrade` — billing toggle, Stripe checkout via `useUpgrade()` → `create-checkout-session` → redirect
- `/account` — subscription status, billing management, cancel subscription
- `/success` — refreshes profile on mount, 3s countdown redirect to dashboard
- `ProtectedRoute` — unauthenticated → `/login`, non-Pro on Pro route → `/upgrade`
- `FreeTierBanner` — correct `used / 20` display, dismiss button, upgrade CTA
- `useUpgrade` → `create-checkout-session` → Stripe redirect ✓
- `useSessions` — filters `status = 'completed'`, ordered by `completed_at` desc ✓
- `useTypeStats` — fetches `type_stats` table, guards with `enabled: !!user` ✓
- Session flow — `startSession` → `answerQuestion` → `nextQuestion` → `finishSession` → `complete-session` edge function → `/results/:id` ✓
- CSS variables — all vars used in code (`--info`, `--border-strong`, etc.) are defined in `index.css` ✓
- TypeScript — `npx tsc --noEmit` passes with zero errors after all fixes ✓
