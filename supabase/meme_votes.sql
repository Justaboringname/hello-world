-- Week 4, part 2: rate memes too, and turn the old /vault page into
-- members-only memes. Paste into the Supabase SQL Editor and run after
-- captions.sql. Safe to run more than once.
--
--   memes          + members_only flag and denormalized vote counts
--   meme_votes     one row per (meme, user): +1 or -1
--   rate_feed      photos and memes in one list, newest first, for /rate

-- 1. Memes: vote totals and a members-only flag ------------------------------
alter table public.memes
  add column if not exists members_only boolean not null default false,
  add column if not exists upvotes integer not null default 0 check (upvotes >= 0),
  add column if not exists downvotes integer not null default 0 check (downvotes >= 0);
alter table public.memes
  add column if not exists score integer generated always as (upvotes - downvotes) stored;

-- The memes that used to be hard-coded on /vault. Dated with the other memes
-- so they sit next to them in the feed rather than on top of new photos.
insert into public.memes (title, image_url, top_text, bottom_text, members_only, created_at)
select v.title, v.image_url, v.top_text, v.bottom_text, true,
       coalesce((select min(created_at) from public.memes), now())
  from (values
    ('Success Kid', 'https://i.imgflip.com/1bhk.jpg', 'Signed in with Google', 'Profile row made by a trigger'),
    ('Roll Safe', 'https://i.imgflip.com/1h7in3.jpg', 'Can''t forget your password', 'If you never made one'),
    ('X, X Everywhere', 'https://i.imgflip.com/1ihzfe.jpg', 'Auth cookies', 'Auth cookies everywhere'),
    ('Drake Hotline Bling', 'https://i.imgflip.com/30b1gx.jpg', 'Browsing as a guest', 'Signing in for more memes')
  ) as v (title, image_url, top_text, bottom_text)
 where not exists (
   select 1 from public.memes m where m.title = v.title and m.members_only
 );

-- 2. Meme votes --------------------------------------------------------------
create table if not exists public.meme_votes (
  meme_id bigint not null references public.memes (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (meme_id, user_id)
);

create index if not exists meme_votes_user_id_idx on public.meme_votes (user_id);

-- Keep memes.upvotes/downvotes in sync. Users have no UPDATE rights on memes,
-- so this runs as the table owner (security definer).
create or replace function public.apply_meme_vote()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.memes
       set upvotes = upvotes - (old.vote = 1)::int,
           downvotes = downvotes - (old.vote = -1)::int
     where id = old.meme_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.memes
       set upvotes = upvotes + (new.vote = 1)::int,
           downvotes = downvotes + (new.vote = -1)::int
     where id = new.meme_id;
  end if;

  return null;
end;
$$;

drop trigger if exists apply_meme_vote on public.meme_votes;
create trigger apply_meme_vote
  after insert or update or delete on public.meme_votes
  for each row execute function public.apply_meme_vote();

-- 3. Row level security ------------------------------------------------------
-- memes: signed-out visitors only see the public ones; signed-in users see
-- all of them, including members-only. Nobody can write through the API.
alter table public.memes enable row level security;

drop policy if exists "Anyone can read memes" on public.memes;
drop policy if exists "Anyone can read public memes" on public.memes;
create policy "Anyone can read public memes"
  on public.memes for select
  to anon
  using (not members_only);

drop policy if exists "Signed-in users can read all memes" on public.memes;
create policy "Signed-in users can read all memes"
  on public.memes for select
  to authenticated
  using (true);

-- meme_votes: private, same rules as caption_votes. A signed-in user can only
-- see, cast, change and take back their own votes.
alter table public.meme_votes enable row level security;
revoke all on public.meme_votes from anon;

drop policy if exists "Users can view their own meme votes" on public.meme_votes;
create policy "Users can view their own meme votes"
  on public.meme_votes for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can cast their own meme votes" on public.meme_votes;
create policy "Users can cast their own meme votes"
  on public.meme_votes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can change their own meme votes" on public.meme_votes;
create policy "Users can change their own meme votes"
  on public.meme_votes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their own meme votes" on public.meme_votes;
create policy "Users can remove their own meme votes"
  on public.meme_votes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 4. One feed for /rate ------------------------------------------------------
-- security_invoker: the view reads as the caller, so the RLS above still
-- decides which rows show up (signed-out visitors never see members-only memes).
create or replace view public.rate_feed
with (security_invoker = true) as
  select 'photo'::text as kind, id, created_at from public.generations
  union all
  select 'meme'::text as kind, id, created_at from public.memes;

revoke all on public.rate_feed from anon, authenticated;
grant select on public.rate_feed to anon, authenticated;

-- 5. Check: every table in public should say rls_enabled = true.
select tablename, rowsecurity as rls_enabled
  from pg_tables
 where schemaname = 'public'
 order by tablename;
