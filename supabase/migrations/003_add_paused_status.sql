-- The sessions.status CHECK constraint was missing 'paused'.
-- Drop and recreate it to allow all four valid statuses.
alter table public.sessions
  drop constraint if exists sessions_status_check;

alter table public.sessions
  add constraint sessions_status_check
  check (status in ('in_progress', 'paused', 'completed', 'abandoned'));
