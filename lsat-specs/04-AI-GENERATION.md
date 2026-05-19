# LSAT Forge — AI Question Generation Spec

## Overview

All questions are generated via Supabase Edge Functions calling the Anthropic API.
Questions are never stored — generated fresh per session.
The system prompt encodes LSAT logic patterns extracted from prep materials.

---

## Edge Function: generate-questions

**File:** `supabase/functions/generate-questions/index.ts`

**Called by:** Frontend on session start
**Auth:** Requires valid Supabase JWT (user must be logged in)
**Rate limit:** Check free tier cap before generating

### Request shape
```typescript
{
  mode: 'practice' | 'drill' | 'simulation' | 'weakspot',
  questionTypes: string[], // e.g. ['assumption', 'weaken'] or ['all']
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  count: number, // 10 | 15 | 20 | 27 (simulation section)
  section?: 'lr1' | 'lr2' | 'rc' // simulation only
}
```

### Response shape
```typescript
{
  questions: Question[],
  sessionId: string // created in DB before returning
}

type Question = {
  id: string, // client-side uuid
  type: string,
  difficulty: 'easy' | 'medium' | 'hard',
  stimulus: string,
  stem: string,
  choices: string[], // always 5
  correctIndex: number, // 0-4
  explanation: string
}
```

---

## System Prompts

### Logical Reasoning System Prompt

```
You are an expert LSAT question writer. You create original Logical Reasoning questions 
that match the style, structure, and difficulty of the real LSAT — but all content is 
entirely original and not sourced from any official LSAT materials.

LSAT Logical Reasoning question anatomy:
- Stimulus: A short argument (3-6 sentences). Contains premises and a conclusion.
  The conclusion is often indicated by: therefore, thus, hence, so, consequently, 
  which means that, clearly, obviously, it follows that.
  Premises indicated by: because, since, given that, as, for, owing to, due to.
- Question stem: Asks a specific question about the argument.
- Five answer choices (A-E): Exactly one is correct. Others are plausible traps.
- Explanation: Why the correct answer is right AND why each wrong answer fails.

QUESTION TYPE DEFINITIONS:

Main Point: Ask for the argument's primary conclusion.
  Stem patterns: "Which most accurately expresses the main conclusion?"
  Trap: Premises that sound like conclusions.

Must Be True / Inference: Ask what must follow from the premises.
  Stem patterns: "Which must be true based on the statements above?"
  Trap: Statements that are possibly true but not necessarily true.

Strengthen: Ask what would most support the conclusion.
  Stem patterns: "Which, if true, most strengthens the argument?"
  Correct answer: Bridges a gap or eliminates an alternative explanation.

Weaken: Ask what would most undermine the conclusion.
  Stem patterns: "Which, if true, most weakens the argument?"
  Correct answer: Introduces an alternative explanation or attacks a premise.

Assumption (Necessary): Ask for an unstated premise the argument requires.
  Stem patterns: "The argument assumes which of the following?"
  Test: Negating the correct answer must destroy the argument.

Assumption (Sufficient): Ask what, if assumed, would make the argument valid.
  Stem patterns: "Which, if assumed, allows the conclusion to follow?"

Flaw: Ask what error in reasoning the argument commits.
  Stem patterns: "The argument is most vulnerable to criticism because it..."
  Common flaws: Correlation/causation, hasty generalization, ad hominem, 
  false dilemma, affirming the consequent, circular reasoning.

Parallel Reasoning: Ask which answer has the same logical structure.
  Stem: "Which most closely parallels the reasoning above?"
  Must match: Logical form, not content.

Parallel Flaw: Same as parallel but matching a flawed argument's error.

Principle (Identify): Ask which principle the argument relies on.
  Stem: "Which principle underlies the argument?"

Principle (Apply): Give a principle, ask which situation it applies to.
  Stem: "Which situation conforms most closely to the principle?"

Point at Issue: Two speakers disagree — what's the core disagreement?
  Stem: "The dialogue most supports that the speakers disagree about..."

Method of Reasoning: How does the argument make its case?
  Stem: "The argument proceeds by..."
  Answers describe the logical move made (e.g. "citing a counterexample").

Role of Statement: What function does a specific part play?
  Stem: "The claim that X plays which role in the argument?"

DIFFICULTY CALIBRATION:
Easy: Simple argument structure, obvious correct answer, weak traps.
Medium: 2-3 premise arguments, one plausible trap answer, some subtlety.
Hard: Complex nested arguments, strong traps that are almost correct, 
      requires precise logical analysis to distinguish correct from trap.

STIMULUS TOPICS (vary these — do not repeat topics):
Use a wide range of domains: environmental policy, medical research, 
legal theory, economics, archaeology, literature, technology, nutrition, 
psychology, urban planning, history, philosophy, education policy, 
business strategy, biology, astronomy, sociology, art criticism.

OUTPUT FORMAT: Return only valid JSON. No preamble. No markdown fences.
```

### Reading Comprehension System Prompt

```
You are an expert LSAT Reading Comprehension question writer. You create original 
RC passages and questions that match the real LSAT's style and difficulty.

RC PASSAGE ANATOMY:
- Length: 450-550 words
- One main argument or thesis
- 2-3 supporting points with evidence
- At least one counterargument or complication addressed
- Dense academic prose — not casual

PASSAGE TYPES:
Law/Policy: Legal theory, court decisions, regulatory debates
Science: Biology, physics, environmental science, medicine
Humanities: Literature, art history, philosophy, music
Social Science: Sociology, economics, anthropology, psychology

QUESTION TYPES FOR RC:
Main Point: What is the passage's central claim?
Author's Attitude: What is the author's stance toward X?
Inference: What can be inferred from the passage?
Detail: According to the passage, which is true?
Function: Why does the author mention X?
Strengthen/Weaken (rare): What would support/undermine the argument?
Analogical Reasoning: Which situation is most analogous to X in the passage?

PASSAGE SET STRUCTURE:
- One passage (450-550 words)
- 5-7 questions about that passage
- Questions in order: Main Point first, then detail/inference, then harder inference/function

OUTPUT FORMAT: Return only valid JSON. No preamble. No markdown fences.
```

---

## JSON Output Schema

### LR Question
```json
{
  "id": "uuid-here",
  "type": "weaken",
  "difficulty": "medium",
  "stimulus": "Researchers studying sleep patterns found that...",
  "stem": "Which one of the following, if true, most weakens the argument?",
  "choices": [
    "The study included participants from diverse age groups.",
    "Some participants reported feeling more alert after shorter sleep.",
    "The researchers failed to account for caffeine consumption among participants.",
    "Sleep duration varies significantly across different cultures.",
    "The study was conducted over a period of six months."
  ],
  "correctIndex": 2,
  "explanation": "Answer C weakens the argument because... Answer A is wrong because... Answer B is a trap because..."
}
```

### RC Question Set
```json
{
  "passage": "The doctrine of promissory estoppel...",
  "questions": [
    {
      "id": "uuid",
      "type": "main_point",
      "stem": "Which best expresses the main point of the passage?",
      "choices": ["...", "...", "...", "...", "..."],
      "correctIndex": 1,
      "explanation": "..."
    }
  ]
}
```

---

## Edge Function Implementation

```typescript
// supabase/functions/generate-questions/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // 1. Verify auth
  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader?.replace('Bearer ', '')
  )
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // 2. Check free tier limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, questions_used')
    .eq('id', user.id)
    .single()

  const body = await req.json()
  const { mode, questionTypes, difficulty, count, section } = body

  if (profile.tier === 'free' && profile.questions_used >= 20) {
    return new Response(JSON.stringify({ error: 'FREE_LIMIT_REACHED' }), { status: 403 })
  }

  // 3. Check pro-only modes
  const proOnlyModes = ['drill', 'simulation', 'weakspot']
  if (proOnlyModes.includes(mode) && profile.tier !== 'pro') {
    return new Response(JSON.stringify({ error: 'PRO_REQUIRED' }), { status: 403 })
  }

  // 4. Build prompt
  const isRC = section === 'rc' || (mode === 'practice' && questionTypes.includes('rc'))
  const systemPrompt = isRC ? RC_SYSTEM_PROMPT : LR_SYSTEM_PROMPT

  const types = questionTypes.includes('all') 
    ? ['main_point', 'inference', 'strengthen', 'weaken', 'assumption', 'flaw', 'parallel', 'principle']
    : questionTypes

  const userPrompt = `Generate ${count} original LSAT-style ${isRC ? 'Reading Comprehension' : 'Logical Reasoning'} questions.
Question types to include: ${types.join(', ')}
Difficulty: ${difficulty}
Vary the topics. Make all content entirely original.
Return a JSON array of question objects matching the schema exactly.`

  // 5. Call Anthropic
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  })

  const aiData = await response.json()
  const rawText = aiData.content[0].text
  const questions = JSON.parse(rawText)

  // 6. Create session in DB
  const { data: session } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      mode,
      status: 'in_progress',
      question_types: types,
      total_questions: count
    })
    .select()
    .single()

  return new Response(JSON.stringify({ questions, sessionId: session.id }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## Edge Function: complete-session

Called when user finishes a session. Saves responses, updates stats.

```typescript
// Request
{
  sessionId: string,
  responses: Array<{
    questionType: string,
    difficulty: string,
    chosenIndex: number,
    correctIndex: number,
    isCorrect: boolean,
    timeSpentSeconds: number
  }>,
  totalTimeSeconds: number
}

// Actions taken:
// 1. Insert all responses to responses table
// 2. Update session: status='completed', correct_count, score_pct, time_taken_seconds
// 3. Call update_type_stats()
// 4. Increment profiles.questions_used by response count
// 5. If simulation: insert to simulation_results with score estimation
// 6. Return updated profile (so frontend knows new questions_used count)
```

---

## Cost Estimation

| Scenario | Tokens (approx) | Cost |
|----------|----------------|------|
| 10 LR questions | ~3,000 in + 4,000 out | ~$0.05 |
| 20 LR questions | ~3,000 in + 7,000 out | ~$0.08 |
| Full simulation (81 questions, 3 calls) | ~12,000 in + 25,000 out | ~$0.25 |

At $29/month, even a heavy user running 2 full simulations/day costs ~$15/month in API. Margin holds.
