-- Add checkpoint storage to sessions for cross-device resume
alter table public.sessions
add column if not exists checkpoint jsonb;

-- checkpoint stores: { currentIndex, questions, responses }
-- status column (text) now also accepts: 'paused' | 'abandoned'
-- in_progress is used for sessions created but not yet answered
