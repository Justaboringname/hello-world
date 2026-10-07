-- Week 4, part 2: rate memes, post your own memes, and turn the old /vault
-- page into members-only memes. Paste into the Supabase SQL Editor and run
-- after captions.sql. Safe to run more than once.
--
--   memes          + members-only flag, vote counts, and user uploads
--   meme_votes     one row per (meme, user): +1 or -1
--   rate_feed      photos and memes in one list, newest first, for /rate

-- 1. Memes: vote totals and a members-only flag ------------------------------
alter table public.memes
  add column if not exists members_only boolean not null default false,
  add column if not exists upvotes integer not null default 0 check (upvotes >= 0),
  add column if not exists downvotes integer not null default 0 check (downvotes >= 0);
alter table public.memes
  add column if not exists score integer generated always as (upvotes - downvotes) stored;

-- Memes people post themselves: the image lives in the photos bucket
-- (image_path), the seeded classics point at imgflip (image_url).
alter table public.memes
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade,
  add column if not exists author_name text,
  add column if not exists image_path text unique;
alter table public.memes alter column image_url drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'memes_one_image_source') then
    alter table public.memes add constraint memes_one_image_source
      check ((image_url is null) <> (image_path is null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'memes_text_lengths') then
    alter table public.memes add constraint memes_text_lengths
      check (
        char_length(title) between 1 and 80
        and coalesce(char_length(top_text), 0) <= 100
        and coalesce(char_length(bottom_text), 0) <= 100
      );
  end if;
end;
$$;

create index if not exists memes_created_at_idx on public.memes (created_at desc);
create index if not exists memes_user_id_created_at_idx on public.memes (user_id, created_at desc);

-- A posted meme gets the server's clock and the poster's "First L." name,
-- and each user can post at most 20 a day (also when calling the API
-- directly). The lock makes two posts at the same moment take turns.
create or replace function public.stamp_meme()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is not null then
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
    if (select count(*) from public.memes m
         where m.user_id = new.user_id
           and m.created_at > now() - interval '24 hours') >= 20 then
      raise exception 'You''ve posted 20 memes in the last 24 hours. Come back tomorrow!';
    end if;
    new.created_at := now();
    select nullif(
             concat_ws(' ', nullif(trim(p.first_name), ''), nullif(left(trim(p.last_name), 1), '') || '.'),
             ''
           )
      into new.author_name
      from public.profiles p
     where p.id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists stamp_meme on public.memes;
create trigger stamp_meme
  before insert on public.memes
  for each row execute function public.stamp_meme();

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

-- Signed-in users can post memes as themselves, with an image from their own
-- Storage folder, starting at zero votes. Never members-only, no edits.
drop policy if exists "Users can post their own memes" on public.memes;
create policy "Users can post their own memes"
  on public.memes for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and not members_only
    and upvotes = 0
    and downvotes = 0
    and image_url is null
    and split_part(image_path, '/', 1) = (select auth.uid()::text)
  );

-- How many members-only memes a signed-out visitor is missing. Only the
-- number leaves the database, never the memes themselves.
create or replace function public.members_only_meme_count()
returns bigint
language sql
stable
security definer set search_path = ''
as $$
  select count(*) from public.memes where members_only;
$$;

revoke execute on function public.members_only_meme_count() from public;
grant execute on function public.members_only_meme_count() to anon, authenticated;

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
