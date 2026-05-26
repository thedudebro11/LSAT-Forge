# Session Persistence

## How it works
- Active sessions are stored in memory (SessionContext) and backed up to localStorage
- When a user pauses, the current state is saved to `sessions.checkpoint` (JSONB) via the `pause-session` edge function
- On dashboard load, any paused session is detected and shown as a resume banner
- Resume restores questions, responses, and current position exactly

## Session statuses
- `in_progress` — active, not yet complete (created by generate-questions)
- `paused` — user saved and left, can resume on any device
- `completed` — finished normally, checkpoint cleared
- `abandoned` — user left without saving (nav modal → Abandon, or dismiss from dashboard)

## What gets saved in checkpoint
```json
{
  "currentIndex": 3,
  "questions": [...],
  "responses": [...]
}
```

## Cross-device resume
Works on any device because checkpoint is stored in Supabase, not localStorage.
The localStorage backup (`lsat_session_backup`) is cleared on successful pause.

## Navigation protection
- **Practice / Drill / Weak Spot**: NavLink clicks trigger a modal with three options:
  - Save & Leave → calls pause-session, navigates to /dashboard
  - Stay in Session → closes modal
  - Abandon Session → marks session abandoned, navigates away
- **Simulation**: NavLink clicks trigger a lockout modal. The only exit is abandoning,
  which discards the session without recording a score.

## Simulation sessions
Cannot be paused. User must complete or abandon. Abandoned simulations are
recorded with `status='abandoned'` and the score is not shown in analytics.

## Edge cases
- If pause-session API call fails, user stays in session and sees an inline error message
- If resume checkpoint is corrupted, questions array will be empty — session resets gracefully
- Only the most recent paused session is surfaced in the dashboard banner
- Dismissing the banner sets the session status to `abandoned`
