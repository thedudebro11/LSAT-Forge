-- Add trap diagnosis fields to responses
alter table public.responses
  add column if not exists selected_trap_type text,
  add column if not exists correct_diagnosis boolean;

-- Flagged explanations table
create table if not exists public.flagged_explanations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_type text,
  stimulus text,
  stem text,
  explanation text,
  rating text check (rating in ('helpful', 'not_helpful')),
  comment text,
  created_at timestamptz default now()
);

alter table public.flagged_explanations enable row level security;

create policy "Users can insert own flags"
  on public.flagged_explanations for insert
  with check (auth.uid() = user_id);
