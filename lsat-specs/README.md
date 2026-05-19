# LSAT Forge — Spec Suite Index

## What This Is

Complete product specification for LSAT Forge — an AI-powered LSAT preparation platform.
Feed these files to Claude Code in VS Code to build the full product.

## Files

| File | Contents |
|------|----------|
| `01-PRODUCT-SPEC.md` | What it is, pricing, modes, tech stack, non-goals |
| `02-DATA-MODEL.md` | Full Supabase schema, RLS policies, SQL functions |
| `03-SCREEN-MAP.md` | Every screen, its purpose, and all components on it |
| `04-AI-GENERATION.md` | Anthropic API prompts, edge function code, question JSON schema |
| `05-STRIPE.md` | Full Stripe integration — checkout, webhooks, portal |
| `06-COMPONENTS.md` | Design tokens, component inventory, design system |
| `07-STATE.md` | React Query, Context, state machine, error handling |
| `08-BUILD-PROMPTS.md` | 16 ordered Claude Code prompts to build the full app |

## Build Instructions

1. Read `01-PRODUCT-SPEC.md` to understand the full product
2. Complete the Pre-Build Checklist in `08-BUILD-PROMPTS.md`
3. Open Claude Code in VS Code
4. Feed prompts 1-16 in order — do not skip ahead
5. Test each step before moving to the next

## Key Decisions Already Made

- **Questions:** AI-generated on demand via Anthropic API. Never stored. Always fresh.
- **Pricing:** Free (20 questions lifetime) / Pro $29/month or $199/year
- **Auth:** Supabase Auth with Google OAuth + email/password
- **Stack:** React + Vite + Tailwind + Supabase + Stripe + Vercel
- **Logic Games:** Not in v1. Too complex for reliable AI generation.
- **Content disclaimer:** All questions are original AI-generated content, not from LSAC.

## Questions Not Answered by These Specs

These will come up during build — decide before you hit them:

1. **Custom domain?** Buy it before deploying. Stripe needs a real URL for webhooks.
2. **Email provider?** Supabase sends basic auth emails. For marketing emails (welcome, upgrade confirmation) you'll want Resend or Postmark later.
3. **Analytics?** Consider adding Posthog or Plausible in Prompt 16 for product analytics.
4. **Logo?** The specs use text-based logo (LSAT FORGE in Syne 800). Commission a real logo post-launch.
