# LSAT Forge — Security Model

Documents every security boundary in the system. Read this before touching auth, billing,
database policies, or Edge Functions.

---

## Threat Model (brief)

| Threat | Mitigation |
|--------|-----------|
| Unauthenticated user accesses protected data | Supabase RLS — every table requires `auth.uid() = id/user_id` |
| Free user bypasses 20-question cap | Server-side check in `generate-questions` Edge Function |
| Free user accesses pro-only modes | Server-side check in `generate-questions` Edge Function |
| User reads another user's data | RLS policies — `using (auth.uid() = id)` on every table |
| Secret API keys exposed in browser | All secrets are Edge Function env vars; only `VITE_` vars reach the browser |
| Fake Stripe webhook fires | Webhook signature verification via `stripe.webhooks.constructEvent()` |
| User manually updates their own tier | `profiles` has no UPDATE policy for `tier` — only `stripe-webhook` (service role) can write it |
| SQL injection | Supabase JS client uses parameterized queries; no raw SQL in frontend |

---

## Layer 1: Supabase Auth (Identity)

All authenticated requests carry a Supabase JWT. The JWT is issued by Supabase Auth on
login and automatically refreshed by `@supabase/auth-helpers-react`.

**What the JWT contains:** `sub` (the user's UUID = `auth.users.id`), expiry, and role.
It does NOT contain `tier`, `isPro`, or any application-level data.

**Token storage:** Supabase stores tokens in `localStorage` under its own keys. Do not
manually read or write Supabase auth storage. Do not store auth tokens anywhere else.

**Session expiry:** Default Supabase JWT lifetime is 1 hour, auto-refreshed. If refresh
fails (network error), `useUser()` returns `null` and `ProtectedRoute` redirects to `/login`.

---

## Layer 2: Row Level Security (Authorization)

RLS is enabled on every table. No table has a permissive default — all access is denied
unless a policy explicitly allows it.

### `profiles`
```sql
-- SELECT: own row only
create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);

-- INSERT: own row only (used by handle_new_user trigger via service role, 
--         but also allows a user to insert their own row if trigger missed)
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- UPDATE: own row only
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
```

**Critical:** There is no UPDATE policy that allows a user to set `tier` to `'monthly'`
or `'annual'`. A logged-in user running:
```javascript
supabase.from('profiles').update({ tier: 'monthly' }).eq('id', user.id)
```
will succeed in updating OTHER fields (like `full_name`) but the `tier` field update will
be accepted by RLS... which means we need a Postgres column-level policy or the webhook
must use the service role key (which bypasses RLS entirely).

**Action required when building Edge Functions:** The `stripe-webhook` Edge Function must
use `SUPABASE_SERVICE_ROLE_KEY`, not the anon key. This means it can write any tier value,
bypassing RLS. That is intentional — webhook events are verified by Stripe signature.

**Recommended hardening:** Add a Postgres trigger on `profiles` that prevents `tier` and
`subscription_status` from being updated by the `anon` role. This closes the gap above.

### `sessions`
```sql
-- Users can SELECT, INSERT, UPDATE their own sessions
create policy "sessions: select own" on public.sessions
  for select using (auth.uid() = user_id);
create policy "sessions: insert own" on public.sessions
  for insert with check (auth.uid() = user_id);
create policy "sessions: update own" on public.sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### `responses`
```sql
create policy "responses: select own" on public.responses
  for select using (auth.uid() = user_id);
create policy "responses: insert own" on public.responses
  for insert with check (auth.uid() = user_id);
```

No UPDATE or DELETE policy on `responses` — answers are immutable once recorded.

### `type_stats`
```sql
create policy "type_stats: select own" on public.type_stats
  for select using (auth.uid() = user_id);
-- UPDATE/INSERT done only via update_type_stats() SQL function (security definer)
```

The `update_type_stats()` function is defined with `SECURITY DEFINER` — it runs as the
function owner (postgres superuser), bypassing RLS for the write. This is intentional.
Users can only READ their own stats row via RLS.

### `simulation_results`
```sql
create policy "simulation_results: select own" on public.simulation_results
  for select using (auth.uid() = user_id);
-- INSERT done by complete-session Edge Function using service role key
```

---

## Layer 3: Edge Function Auth Verification

Every Edge Function that performs a sensitive action must:

1. Extract the Bearer token from `Authorization` header
2. Call `supabase.auth.getUser(token)` with the **service role client**
3. Reject with 401 if user is null or error is returned

```typescript
// Pattern used in every Edge Function
const authHeader = req.headers.get('Authorization')
const token = authHeader?.replace('Bearer ', '')
const { data: { user }, error } = await supabase.auth.getUser(token)
if (error || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
```

This is NOT the same as trusting the JWT client-side. The Edge Function makes a server-to-
server call to Supabase to validate the token. A tampered or expired token returns an error.

---

## Layer 4: Business Rule Enforcement in Edge Functions

After auth verification, `generate-questions` enforces two additional rules:

```typescript
// Rule 1: Free tier cap
if (profile.tier === 'free' && profile.questions_used >= 20) {
  return new Response(JSON.stringify({ error: 'FREE_LIMIT_REACHED' }), { status: 403 })
}

// Rule 2: Pro-only modes
const proOnlyModes = ['drill', 'simulation', 'weakspot']
if (proOnlyModes.includes(mode) && profile.tier === 'free') {
  return new Response(JSON.stringify({ error: 'PRO_REQUIRED' }), { status: 403 })
}
```

These checks happen server-side. The client-side `ProtectedRoute requirePro` and
`FreeTierBanner` are UX conveniences only.

---

## Layer 5: Stripe Webhook Signature Verification

The `stripe-webhook` Edge Function must verify every incoming request:

```typescript
const signature = req.headers.get('stripe-signature')
const body = await req.text()  // must be raw text, not parsed JSON

let event
try {
  event = stripe.webhooks.constructEvent(
    body,
    signature,
    Deno.env.get('STRIPE_WEBHOOK_SECRET')
  )
} catch {
  return new Response('Invalid signature', { status: 400 })
}
```

**Do not parse the body as JSON before calling `constructEvent`.** Stripe signs the raw body
bytes. If you parse and re-serialize it, the signature check will fail.

**The webhook secret (`STRIPE_WEBHOOK_SECRET`) is different from the Stripe secret key.**
It is generated per-webhook endpoint in the Stripe dashboard.

---

## Environment Variable Security Boundary

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER BUNDLE (public — anyone can read)                  │
│  VITE_SUPABASE_URL          safe (it's just a URL)          │
│  VITE_SUPABASE_ANON_KEY     safe (RLS is the guard)         │
│  VITE_STRIPE_MONTHLY_PRICE_ID  safe (price IDs are public)  │
│  VITE_STRIPE_ANNUAL_PRICE_ID   safe                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SUPABASE EDGE FUNCTION SECRETS (never leaves server)       │
│  SUPABASE_SERVICE_ROLE_KEY   bypasses all RLS               │
│  ANTHROPIC_API_KEY           AI generation                  │
│  STRIPE_SECRET_KEY           all Stripe operations          │
│  STRIPE_WEBHOOK_SECRET       webhook verification           │
│  STRIPE_MONTHLY_PRICE_ID     lookup only (could be public)  │
│  STRIPE_ANNUAL_PRICE_ID      same                           │
└─────────────────────────────────────────────────────────────┘
```

**Never add a `VITE_` prefix to any secret.** Vite statically replaces `import.meta.env.VITE_*`
at build time — the value is literally embedded as a string in the JavaScript bundle.

---

## CORS Policy for Edge Functions

Edge Functions must return CORS headers for browser requests:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',     // tighten to your domain in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}

// Add to all responses
return new Response(body, {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})
```

In production, replace `'*'` with your Vercel domain to prevent other sites from calling
your Edge Functions using a visitor's credentials.

---

## Known Security Gaps (v1 accepted risks)

| Gap | Risk | Mitigation plan |
|-----|------|----------------|
| User can update `tier` via anon client (RLS allows UPDATE on own row) | Self-promotion to paid tier without paying | Add column-level trigger or separate `billing_state` table writable only by service role |
| No rate limiting on `generate-questions` | A pro user could make unlimited parallel calls | Add Supabase rate limiting or a request counter in `profiles` |
| Session backup in localStorage | Another tab/script could read in-progress session state | Acceptable for v1; not sensitive data (question text only, no PII) |
| Email confirmation is OFF | Anyone can sign up with a fake email | Turn ON before launch or add disposable email blocking |
