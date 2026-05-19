# LSAT Forge — Data Model & Supabase Schema

## Overview

Questions are NOT stored. Only user data, sessions, and responses are persisted.
All schema uses Supabase Postgres with Row Level Security (RLS).

---

## Tables

### users (extends Supabase auth.users)
```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  tier text not null default 'free', -- 'free' | 'pro'
  questions_used integer not null default 0, -- lifetime count for free tier
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text, -- 'active' | 'canceled' | 'past_due' | null
  subscription_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
```

### sessions
One row per practice session or full test attempt.
```sql
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mode text not null, -- 'practice' | 'drill' | 'simulation' | 'weakspot'
  status text not null default 'in_progress', -- 'in_progress' | 'completed' | 'abandoned'
  question_types text[], -- array of types selected
  total_questions integer,
  correct_count integer default 0,
  score_pct numeric(5,2),
  time_taken_seconds integer,
  started_at timestamptz default now(),
  completed_at timestamptz
);

alter table public.sessions enable row level security;
create policy "Users can CRUD own sessions"
  on public.sessions for all using (auth.uid() = user_id);
```

### responses
One row per question answered.
```sql
create table public.responses (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_type text not null,
  difficulty text not null, -- 'easy' | 'medium' | 'hard'
  chosen_index integer not null, -- 0-4
  correct_index integer not null,
  is_correct boolean not null,
  time_spent_seconds integer,
  answered_at timestamptz default now()
);

alter table public.responses enable row level security;
create policy "Users can CRUD own responses"
  on public.responses for all using (auth.uid() = user_id);
```

### type_stats (materialized view — rebuilt on session complete)
Pre-aggregated accuracy by question type per user. Avoids expensive queries on analytics page.
```sql
create table public.type_stats (
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_type text not null,
  total_attempted integer default 0,
  total_correct integer default 0,
  accuracy_pct numeric(5,2),
  last_updated timestamptz default now(),
  primary key (user_id, question_type)
);

alter table public.type_stats enable row level security;
create policy "Users can read own type stats"
  on public.type_stats for select using (auth.uid() = user_id);
create policy "Service role can write type stats"
  on public.type_stats for all using (true);
```

### simulation_results
Stores full test simulation scores separately for score trend tracking.
```sql
create table public.simulation_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete cascade not null,
  lr1_correct integer,
  lr1_total integer,
  lr2_correct integer,
  lr2_total integer,
  rc_correct integer,
  rc_total integer,
  total_correct integer,
  total_questions integer,
  estimated_score_low integer, -- e.g. 158
  estimated_score_high integer, -- e.g. 162
  completed_at timestamptz default now()
);

alter table public.simulation_results enable row level security;
create policy "Users can read own simulation results"
  on public.simulation_results for select using (auth.uid() = user_id);
create policy "Service role can insert simulation results"
  on public.simulation_results for insert using (true);
```

---

## Helper Functions

### Increment questions_used (called after each question answered)
```sql
create or replace function increment_questions_used(user_id uuid)
returns void as $$
  update public.profiles
  set questions_used = questions_used + 1,
      updated_at = now()
  where id = user_id;
$$ language sql security definer;
```

### Check if free user is over limit
```sql
create or replace function is_over_free_limit(user_id uuid)
returns boolean as $$
  select questions_used >= 20
  from public.profiles
  where id = user_id;
$$ language sql security definer;
```

### Update type_stats after session
```sql
create or replace function update_type_stats(p_user_id uuid, p_session_id uuid)
returns void as $$
  insert into public.type_stats (user_id, question_type, total_attempted, total_correct, accuracy_pct, last_updated)
  select
    p_user_id,
    question_type,
    count(*) as total_attempted,
    count(*) filter (where is_correct) as total_correct,
    round(count(*) filter (where is_correct)::numeric / count(*) * 100, 2) as accuracy_pct,
    now()
  from public.responses
  where user_id = p_user_id and session_id = p_session_id
  group by question_type
  on conflict (user_id, question_type) do update set
    total_attempted = type_stats.total_attempted + excluded.total_attempted,
    total_correct = type_stats.total_correct + excluded.total_correct,
    accuracy_pct = round((type_stats.total_correct + excluded.total_correct)::numeric /
                         (type_stats.total_attempted + excluded.total_attempted) * 100, 2),
    last_updated = now();
$$ language sql security definer;
```

---

## Supabase Auth Config

Enable in Supabase dashboard:
- Email/password: ON
- Google OAuth: ON (requires Google Cloud Console credentials)
- Email confirmation: OFF for now (frictionless onboarding)

### Auto-create profile on signup trigger
```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

## Score Estimation Logic

Map raw accuracy % to estimated LSAT score range (120-180 scale):
```
< 40% accuracy  → 120-139
40-50%          → 140-149
50-60%          → 150-154
60-70%          → 155-159
70-80%          → 160-164
80-87%          → 165-169
87-93%          → 170-174
93-100%         → 175-180
```

Stored as estimated_score_low and estimated_score_high in simulation_results.
