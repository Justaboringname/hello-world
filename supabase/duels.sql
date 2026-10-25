-- Semester project: Beat the Bot. A user writes a caption for a photo and a
-- Gemini judge compares it, blind, with Gemini's own best caption.
-- Paste into the Supabase SQL Editor and run after captions.sql. Safe to run
-- more than once.
--
--   duels  one row per try: the user's line, the bot's line, which label
--          (A or B) the user's line had, the judge's full verdict, the model
--          and the exact prompt.
--
-- Users can read only their own tries and can't write any. Rows are inserted
-- by the server with the service-role key after the judge has answered, so
-- nobody can record a win the judge didn't give.

create table if not exists public.duels (
  id bigint generated always as identity primary key,
  generation_id bigint not null references public.generations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  try_no smallint not null check (try_no between 1 and 3),
  human_text text not null check (char_length(human_text) between 1 and 100),
  bot_caption_id bigint references public.captions (id) on delete set null,
  bot_text text not null,
  human_label text not null check (human_label in ('A', 'B')),
  winner text not null check (winner in ('human', 'bot', 'tie')),
  verdict jsonb not null,
  judge_model text not null,
  judge_prompt text not null,
  created_at timestamptz not null default now(),
  unique (user_id, generation_id, try_no)
);

create index if not exists duels_user_id_created_at_idx
  on public.duels (user_id, created_at desc);

alter table public.duels enable row level security;

-- Signed-out visitors get no table access at all.
revoke all on public.duels from anon;

-- Your own tries only. Deliberately no insert, update or delete policies:
-- only the service role (which bypasses RLS) writes here.
drop policy if exists "Users can read their own duels" on public.duels;
create policy "Users can read their own duels"
  on public.duels for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Attempts: every judge call is reserved here first, inside one locked
-- transaction, so the limits count Gemini calls rather than saved results.
-- Parallel submits can't each slip past the checks, and a try whose result
-- never got saved still counts toward the daily limit.
create table if not exists public.duel_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  generation_id bigint not null references public.generations (id) on delete cascade,
  try_no smallint not null check (try_no between 1 and 3),
  -- pending (judge running) | done (duel saved) | failed (judge gave no verdict)
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists duel_attempts_user_id_created_at_idx
  on public.duel_attempts (user_id, created_at desc);
-- One live attempt per try. A failed one frees the slot, so a judge outage
-- doesn't use up one of the user's tries.
create unique index if not exists duel_attempts_live_try_idx
  on public.duel_attempts (user_id, generation_id, try_no)
  where status <> 'failed';

alter table public.duel_attempts enable row level security;
revoke all on public.duel_attempts from anon, authenticated;

-- Called by the server (service role) before the judge runs. Returns the
-- attempt id and the try number, or raises daily_limit / duel_over /
-- in_progress. A pending attempt older than two minutes is treated as dead.
create or replace function public.reserve_duel_attempt(
  p_user uuid,
  p_generation bigint,
  p_daily_limit int,
  p_tries int
)
returns table (attempt_id bigint, try_no smallint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_saved int;
  v_try smallint;
begin
  perform pg_advisory_xact_lock(hashtextextended('duel:' || p_user::text, 0));

  update public.duel_attempts a
     set status = 'failed'
   where a.user_id = p_user and a.status = 'pending' and a.created_at < now() - interval '2 minutes';

  if (select count(*) from public.duel_attempts a
       where a.user_id = p_user and a.created_at > now() - interval '24 hours') >= p_daily_limit then
    raise exception 'daily_limit';
  end if;

  if exists (select 1 from public.duels d
              where d.user_id = p_user and d.generation_id = p_generation and d.winner = 'human') then
    raise exception 'duel_over';
  end if;

  select count(*) into v_saved from public.duels d
   where d.user_id = p_user and d.generation_id = p_generation;
  if v_saved >= p_tries then
    raise exception 'duel_over';
  end if;
  v_try := v_saved + 1;

  if exists (select 1 from public.duel_attempts a
              where a.user_id = p_user and a.generation_id = p_generation
                and a.try_no = v_try and a.status = 'pending') then
    raise exception 'in_progress';
  end if;

  return query
    insert into public.duel_attempts as a (user_id, generation_id, try_no)
    values (p_user, p_generation, v_try)
    returning a.id, a.try_no;
end;
$$;

revoke execute on function public.reserve_duel_attempt(uuid, bigint, int, int) from public, anon, authenticated;
grant execute on function public.reserve_duel_attempt(uuid, bigint, int, int) to service_role;

-- Check: rls_enabled should be true for both tables, duels should have one
-- policy (SELECT) and duel_attempts none.
select tablename, rowsecurity as rls_enabled
  from pg_tables
 where schemaname = 'public' and tablename in ('duels', 'duel_attempts');
select tablename, policyname, cmd from pg_policies
 where schemaname = 'public' and tablename in ('duels', 'duel_attempts');
