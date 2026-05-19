# LSAT Forge — Environment Variables Reference

---

## Frontend (Vite — bundled into browser JS)

Set in `.env` locally. Set in Vercel project settings for staging/production.

All `VITE_` vars are statically inlined at build time. Anyone who loads the site can read them
from the JS bundle. Only put values here that are safe to be public.

| Variable | Where to get it | Safe to expose? |
|----------|----------------|----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL | Yes — it's just a URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon` `public` key | Yes — RLS enforces access |
| `VITE_STRIPE_MONTHLY_PRICE_ID` | Stripe Dashboard → Products → LSAT Forge Pro → Monthly price ID | Yes — price IDs are not secret |
| `VITE_STRIPE_ANNUAL_PRICE_ID` | Stripe Dashboard → Products → LSAT Forge Pro → Annual price ID | Yes |

---

## Supabase Edge Functions (server-side only)

Set via `supabase secrets set KEY=value` in the CLI, or in Supabase Dashboard →
Edge Functions → Manage secrets. Never use `VITE_` prefix for these.

| Variable | Where to get it | Why it's secret |
|----------|----------------|----------------|
| `SUPABASE_URL` | Same as above (auto-injected in Edge Functions) | Not secret, but kept server-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` `secret` key | Bypasses all RLS — full DB access |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | Billed per token — exposure = unlimited spend |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys → Secret key | Full Stripe account access |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret | Webhook request authentication |
| `STRIPE_MONTHLY_PRICE_ID` | Same as frontend version | Needed for price verification server-side |
| `STRIPE_ANNUAL_PRICE_ID` | Same as frontend version | Same |

---

## Local Development Setup

1. Copy the template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your values:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_STRIPE_MONTHLY_PRICE_ID=price_...
   VITE_STRIPE_ANNUAL_PRICE_ID=price_...
   ```

3. Set Edge Function secrets (run once, stored in Supabase):
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   supabase secrets set STRIPE_MONTHLY_PRICE_ID=price_...
   supabase secrets set STRIPE_ANNUAL_PRICE_ID=price_...
   ```

4. For local webhook testing, use the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```
   The CLI will print a `whsec_...` local signing secret — use that as `STRIPE_WEBHOOK_SECRET`
   during local development only.

---

## Vercel Production Setup

In Vercel Dashboard → Project → Settings → Environment Variables:

Add all `VITE_` variables for Production, Preview, and Development environments.
The Edge Function secrets are set in Supabase, not Vercel — they do not go here.

---

## `.env.example` (committed to git)

```bash
# Frontend — safe to expose
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_MONTHLY_PRICE_ID=
VITE_STRIPE_ANNUAL_PRICE_ID=

# Edge Functions — set via: supabase secrets set KEY=value
# SUPABASE_SERVICE_ROLE_KEY=
# ANTHROPIC_API_KEY=
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# STRIPE_MONTHLY_PRICE_ID=
# STRIPE_ANNUAL_PRICE_ID=
```

---

## Variable Naming Rules

- `VITE_` prefix → bundled into browser. For public values only.
- No prefix → server-side. Set in Supabase secrets via CLI.
- Never put a server-side secret in a `VITE_` variable. It will be readable by anyone.
