# LSAT Forge — Master Debug Guide

The golden rule: **never trust a vague error message**. Every catch block that says
"Invalid signature", "Unauthorized", or "Something went wrong" is hiding the real cause.
Expose the actual error first. Then diagnose.

---

## Rule 0 — Expose real errors before doing anything else

Whenever a Supabase Edge Function returns a vague error, change the catch block to this:

```ts
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  console.error('ACTUAL ERROR:', msg)
  return new Response(JSON.stringify({ error: msg }), { status: 400 })
}
```

Deploy it. Trigger the failure again. Read the real message. Then diagnose.
The vague message can be restored before going to production.

---

## 1 — Stripe Webhook returns 400 "Invalid signature"

**Step 1 — Is it actually a signature problem, or a swallowed error?**
Change the catch block per Rule 0. The real error might be completely unrelated.

**Known real errors that look like "Invalid signature":**
- `SubtleCryptoProvider cannot be used in a synchronous context` → use `constructEventAsync` not `constructEvent`. Deno/Edge runtimes don't have synchronous crypto.
- `No webhook secret provided` → `STRIPE_WEBHOOK_SECRET` is not set or is undefined in the function.
- `Webhook timestamp too old` → you are resending a stale event. The default tolerance is 300 seconds. A 7-hour-old event will always fail. Trigger a fresh event instead.

**Step 2 — Check the secret is actually set**
```bash
npx supabase secrets list --project-ref tohhpnxlshiwopoquokz
```
Confirm `STRIPE_WEBHOOK_SECRET` appears in the list.

**Step 3 — Make sure ALL keys are from the same Stripe environment**
The sandbox, test mode, and live mode each have different keys and webhook secrets.
Mixing them causes permanent "Invalid signature" no matter what you do.
Every secret must come from the same place: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs.

**Step 4 — Confirm the webhook URL matches exactly**
The URL registered in Stripe must be:
```
https://tohhpnxlshiwopoquokz.supabase.co/functions/v1/stripe-webhook
```

**Step 5 — Confirm the function is deployed with --no-verify-jwt**
Stripe sends no JWT. If the function was deployed without this flag, Supabase's gateway
rejects the request with 401 before your code runs.
```bash
npx supabase functions deploy stripe-webhook --project-ref tohhpnxlshiwopoquokz --no-verify-jwt
```

**Step 6 — After fixing secrets, always redeploy**
```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref tohhpnxlshiwopoquokz
npx supabase functions deploy stripe-webhook --project-ref tohhpnxlshiwopoquokz --no-verify-jwt
```

**Step 7 — Test with a fresh event only**
Never resend old events when debugging signature issues — use a real test purchase or
Stripe CLI to generate a fresh timestamp.

---

## 2 — Vercel shows old UI / changes not appearing after deploy

**Step 1 — Confirm git is clean and pushed**
```bash
git log --oneline -5
git status
```
If status says "nothing to commit, working tree clean" and "up to date with origin/main",
the code is on GitHub. The problem is elsewhere.

**Step 2 — Confirm Vercel built from the right commit**
Vercel Dashboard → Deployments → latest deployment → check the commit SHA matches
your local `git log`. If it doesn't, the push didn't trigger a deploy.

**Step 3 — Check which URL you're actually on after login**
After OAuth, check the browser URL. If it shows a preview URL like:
`lsat-forge-1zox76ybl-thedudebro11s-projects.vercel.app`
instead of `lsat-forge.vercel.app`, Supabase is redirecting to a stale deployment.

Fix: Supabase Dashboard → Authentication → URL Configuration → set Site URL to
`https://lsat-forge.vercel.app` and add `https://lsat-forge.vercel.app/**` to Redirect URLs.

**Step 4 — Add a visible console.log to the component and check if it appears**
```ts
console.log('AppShell v2 loaded')
```
If the log doesn't appear after deploy, Vercel served a cached build.
Force a fresh build by pushing a new commit with any trivial change.

**Step 5 — Hard refresh the browser**
`Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac) — bypasses browser cache.

---

## 3 — React infinite re-render / component re-rendering continuously

**Step 1 — Find which component is looping**
Add `console.log('render', Date.now())` at the top of the suspected component.
If it logs hundreds of times per second, you have a loop.

**Step 2 — Check useEffect dependency arrays**

- `[]` = runs once on mount. Use for subscriptions, event listeners.
- `[value]` = re-runs every time `value` changes. If `value` is an object or array created
  inline, it changes on every render → infinite loop.
- No array = runs on every render. Almost always wrong.

**Step 3 — Check for inline objects/arrays as dependencies**
```ts
// BAD — new object every render triggers the effect every render
useEffect(() => { ... }, [{ id: user.id }])

// GOOD — primitive value, stable reference
useEffect(() => { ... }, [user.id])
```

**Step 4 — Check for state being set unconditionally in useEffect**
```ts
// BAD — sets state on every render → triggers render → repeat
useEffect(() => {
  setCount(count + 1) // no condition, no dep array guard
})
```

**Step 5 — Event listeners: always use empty dep array**
```ts
// CORRECT — add once, remove once
useEffect(() => {
  document.addEventListener('mousedown', handler)
  return () => document.removeEventListener('mousedown', handler)
}, [])
```

**Step 6 — Check context providers for inline value objects**
```ts
// BAD — new object every render re-renders all consumers
<Context.Provider value={{ user, profile }}>

// GOOD — memoize
const value = useMemo(() => ({ user, profile }), [user, profile])
<Context.Provider value={value}>
```

---

## 4 — Page stuck on loading spinner

**Step 1 — Find what isLoading is tied to**
In `AuthContext.tsx`, `isLoading` controls `ProtectedRoute`'s spinner.
If `isLoading` never becomes false, the spinner never goes away.

**Step 2 — Check for missing try/finally in async state setters**
```ts
// BAD — if the fetch throws, setLoading(false) never runs → permanent spinner
setLoading(true)
const data = await fetch(...)
setLoading(false)

// GOOD — always resets loading state
setLoading(true)
try {
  const data = await fetch(...)
} finally {
  setLoading(false)
}
```

**Step 3 — Check if loading state is too broad**
`isLoading = sessionLoading || profileLoading` means any background profile refresh
triggers the full-page spinner. Route guards should only block on session loading:
```ts
const isLoading = sessionLoading // not profileLoading
```

---

## 5 — Supabase Edge Function returns 401

**Cause**: JWT verification is enabled at the Supabase gateway level. For functions called
by external services (Stripe, webhooks, cron jobs) with no user JWT, deploy with:
```bash
npx supabase functions deploy <function-name> --project-ref tohhpnxlshiwopoquokz --no-verify-jwt
```

For functions called by authenticated users, the gateway JWT check is correct — don't
disable it.

---

## 6 — Stripe payment succeeds but user tier not updating to Pro

Work through these in order:

1. **Webhook not reaching the function** → Check Stripe Dashboard → Webhooks → Event deliveries. Is it 200, 400, or 401?
2. **Function failing silently** → Apply Rule 0. Redeploy. Trigger again. Read the real error.
3. **Wrong tier value being written** → DB uses `'monthly'` or `'annual'`, never `'pro'`. See `docs/INVARIANTS.md §2`.
4. **Profile not refreshed after payment** → `SuccessPage` calls `refreshProfile()` on mount. If the webhook hasn't processed yet, the profile still shows free. Wait 2-3 seconds and refresh.
5. **`isPro` logic wrong** → Lives only in `AuthContext.tsx`:
   ```ts
   const isPro = !!profile && profile.tier !== 'free' && profile.subscription_status === 'active'
   ```
   Check the actual `tier` and `subscription_status` values in the Supabase profiles table directly.

---

## 7 — Quick diagnostic commands

```bash
# Check what's committed vs what's on disk
git status
git diff

# Verify the last few commits
git log --oneline -5

# Check what a committed file actually contains
git show HEAD:src/components/AppShell.tsx | head -50

# List all Supabase secrets (names only, not values)
npx supabase secrets list --project-ref tohhpnxlshiwopoquokz

# Deploy any edge function
npx supabase functions deploy <name> --project-ref tohhpnxlshiwopoquokz --no-verify-jwt

# Set a secret
npx supabase secrets set KEY=value --project-ref tohhpnxlshiwopoquokz

# Full production build + type check
npx tsc --noEmit && npm run build

# Check bundle hash changed after a code change
ls dist/assets/
```

---

## 8 — When you're completely stuck — checklist

- [ ] Did you expose the real error? (Rule 0)
- [ ] Is the latest code actually committed and pushed? (`git status`)
- [ ] Is Vercel building from the right commit? (check Vercel dashboard)
- [ ] Are you on the right URL after login? (check browser address bar)
- [ ] Are all keys from the same environment? (all sandbox, or all test, or all live)
- [ ] Was the Edge Function deployed with `--no-verify-jwt` if it needs to be?
- [ ] Does the Supabase secrets list show all required secrets?
- [ ] Did you hard refresh the browser after a deploy?
- [ ] Is the Supabase Site URL set to `https://lsat-forge.vercel.app`?
