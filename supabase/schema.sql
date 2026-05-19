-- ============================================================
-- LSAT Forge — Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- PROFILES
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   text not null,
  full_name               text,
  avatar_url              text,
  tier                    text not null default 'free'
                            check (tier in ('free', 'monthly', 'annual')),
  questions_used          integer not null default 0,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_status     text,
  subscription_period_end timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ──────────────────────────────────────────────────────────────
-- SESSIONS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  mode                text not null check (mode in ('practice', 'simulation', 'drill')),
  status              text not null default 'in_progress'
                        check (status in ('in_progress', 'completed', 'abandoned')),
  question_types      text[] not null default '{}',
  total_questions     integer not null,
  correct_count       integer not null default 0,
  score_pct           numeric(5, 2),
  time_taken_seconds  integer,
  started_at          timestamptz not null default now(),
  completed_at        timestamptz
);

alter table public.sessions enable row level security;

create policy "sessions: select own"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "sessions: insert own"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions: update own"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────
-- RESPONSES
-- ──────────────────────────────────────────────────────────────
create table if not exists public.responses (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.sessions(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  question_type       text not null,
  difficulty          text not null check (difficulty in ('easy', 'medium', 'hard')),
  chosen_index        integer not null,
  correct_index       integer not null,
  is_correct          boolean not null,
  time_spent_seconds  integer,
  answered_at         timestamptz not null default now()
);

alter table public.responses enable row level security;

create policy "responses: select own"
  on public.responses for select
  using (auth.uid() = user_id);

create policy "responses: insert own"
  on public.responses for insert
  with check (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────
-- TYPE_STATS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.type_stats (
  user_id          uuid not null references auth.users(id) on delete cascade,
  question_type    text not null,
  total_attempted  integer not null default 0,
  total_correct    integer not null default 0,
  accuracy_pct     numeric(5, 2),
  last_updated     timestamptz not null default now(),
  primary key (user_id, question_type)
);

alter table public.type_stats enable row level security;

create policy "type_stats: select own"
  on public.type_stats for select
  using (auth.uid() = user_id);

create policy "type_stats: insert own"
  on public.type_stats for insert
  with check (auth.uid() = user_id);

create policy "type_stats: update own"
  on public.type_stats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────
-- SIMULATION_RESULTS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.simulation_results (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  session_id           uuid references public.sessions(id) on delete set null,
  lr1_correct          integer not null default 0,
  lr1_total            integer not null default 0,
  lr2_correct          integer not null default 0,
  lr2_total            integer not null default 0,
  rc_correct           integer not null default 0,
  rc_total             integer not null default 0,
  total_correct        integer not null default 0,
  total_questions      integer not null default 0,
  estimated_score_low  integer not null,
  estimated_score_high integer not null,
  completed_at         timestamptz not null default now()
);

alter table public.simulation_results enable row level security;

create policy "simulation_results: select own"
  on public.simulation_results for select
  using (auth.uid() = user_id);

create policy "simulation_results: insert own"
  on public.simulation_results for insert
  with check (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ──────────────────────────────────────────────────────────────

-- Bump the questions_used counter by 1 for a user
create or replace function public.increment_questions_used(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set questions_used = questions_used + 1,
      updated_at     = now()
  where id = p_user_id;
$$;

-- Returns true when a free-tier user has reached the question limit (default: 10)
create or replace function public.is_over_free_limit(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select questions_used >= 10
      from public.profiles
      where id = p_user_id
        and tier = 'free'
    ),
    false
  );
$$;

-- Recalculate type_stats for every question type touched in the given session.
-- Reads from all historical responses so the result is idempotent (safe to call
-- multiple times for the same session without double-counting).
create or replace function public.update_type_stats(p_user_id uuid, p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select
      question_type,
      count(*)                                        as total_attempted,
      count(*) filter (where is_correct)              as total_correct,
      round(
        count(*) filter (where is_correct) * 100.0
          / nullif(count(*), 0),
        2
      )                                               as accuracy_pct
    from public.responses
    where user_id = p_user_id
      and question_type in (
        select distinct question_type
        from public.responses
        where session_id = p_session_id
      )
    group by question_type
  loop
    insert into public.type_stats
      (user_id, question_type, total_attempted, total_correct, accuracy_pct, last_updated)
    values
      (p_user_id, r.question_type, r.total_attempted, r.total_correct, r.accuracy_pct, now())
    on conflict (user_id, question_type) do update
      set total_attempted = excluded.total_attempted,
          total_correct   = excluded.total_correct,
          accuracy_pct    = excluded.accuracy_pct,
          last_updated    = now();
  end loop;
end;
$$;


-- ──────────────────────────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGN-UP
-- ──────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
