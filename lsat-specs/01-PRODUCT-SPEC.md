# LSAT Forge — Product Specification

## What It Is

LSAT Forge is an AI-powered LSAT preparation platform. It generates original, LSAT-style practice questions on demand using the Anthropic API — meaning the question bank is effectively infinite and never repeats. Users practice logical reasoning, reading comprehension, and full test simulations in a clean, fast web app.

It is NOT a clone of official LSAT materials. All questions are original and generated to match the logic, structure, and difficulty of the real LSAT.

---

## Target User

Law school applicants aged 22-30, actively studying for the LSAT. They are:
- Already spending money on prep (books, LawHub, tutors)
- Time-constrained and results-driven
- Comfortable with web apps
- Primarily on laptop while studying, occasionally mobile

---

## Core Value Proposition

- Unlimited fresh questions — never the same test twice
- Instant explanations for every answer
- Full test simulation with real timing (35 min sections)
- Performance analytics showing exactly where they're weak
- Modern, fast UI vs LawHub's clunky interface

---

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Supabase (Auth, Postgres, Edge Functions)
- **AI:** Anthropic API (claude-sonnet-4-20250514) via Supabase Edge Functions
- **Payments:** Stripe (subscriptions)
- **Hosting:** Vercel
- **Auth:** Supabase Auth with Google OAuth + email/password

---

## Pricing

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 20 questions lifetime, practice mode only |
| Pro Monthly | $29/month | Unlimited questions, all modes, full analytics |
| Pro Annual | $199/year | Same as monthly, billed annually |

Free tier has a hard 20-question lifetime cap — no reset, no credit card required. When they hit the cap they see the upgrade prompt.

---

## Question Generation Strategy

All questions generated via Anthropic API using structured system prompts that encode:
- LSAT question type taxonomy (14 LR types, RC passage types)
- Argument structure patterns extracted from official prep materials
- Difficulty calibration (Easy / Medium / Hard)
- 5-answer-choice format with exactly one correct answer
- Explanation generation alongside question generation

Questions are generated in batches:
- Practice mode: 10 questions per batch
- Full test simulation: 80 questions total (generated in 3 parallel calls by section)
- Questions are NOT stored in database — generated fresh each session
- User RESPONSES and SCORES are stored in database

---

## LSAT Structure Reference (for simulation accuracy)

**Real LSAT format:**
- Section 1: Logical Reasoning (26-28 questions, 35 min)
- Section 2: Logical Reasoning (26-28 questions, 35 min)  
- Section 3: Reading Comprehension (27 questions, 35 min)
- Unscored variable section (not shown to user)
- Writing Sample (not scored, not included)

**Our simulation:**
- Section 1: LR — 27 questions, 35 min
- Section 2: LR — 27 questions, 35 min
- Section 3: RC — 27 questions, 35 min
- Break screen between sections (1 min)
- Score report at end

**LR Question Types to generate:**
1. Main Point / Conclusion
2. Must Be True / Inference
3. Strengthen
4. Weaken
5. Assumption (Necessary)
6. Assumption (Sufficient)
7. Flaw in Reasoning
8. Parallel Reasoning
9. Parallel Flaw
10. Principle (Apply)
11. Principle (Identify)
12. Point at Issue
13. Method of Reasoning
14. Role of Statement

**RC Passage Types:**
- Law/Policy
- Science
- Humanities
- Social Science
Each passage 450-550 words with 5-7 questions

---

## Modes

### Practice Mode (Free + Pro)
- Select question type(s) or "All Types"
- Questions served one at a time
- Immediate feedback after each answer
- Full explanation shown
- No timer
- Free users: counts toward 20-question cap

### Drill Mode (Pro only)
- Choose one question type
- 20 questions in a row
- Score at end with breakdown
- Targets question types with lowest accuracy

### Full Test Simulation (Pro only)
- 3 sections, 35 min each
- Real countdown timer
- No feedback during test
- Full score report at end
- Stores result in user history

### Weak Spot Review (Pro only)
- Analyzes user's historical performance
- Auto-generates session targeting lowest-accuracy question types
- 15 questions per session

---

## Analytics Dashboard (Pro only)

Metrics tracked per user:
- Overall accuracy %
- Accuracy by question type (14 LR types + RC)
- Questions attempted (lifetime)
- Full tests completed
- Score trend over time (line chart)
- Estimated LSAT score range based on accuracy

---

## Non-Goals (v1)

- Logic Games section (too complex for AI generation in v1)
- Writing sample
- Mobile app
- Social/community features
- Instructor marketplace
- Content from official LSAC materials
