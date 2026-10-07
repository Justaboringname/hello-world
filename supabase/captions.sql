-- Week 4: AI captions on user photos, and votes on those captions.
-- Paste into the Supabase SQL Editor and run after profiles.sql. Safe to run
-- more than once.
--
--   generations    one row per uploaded photo, with the exact prompt and model
--   captions       the AI captions for a photo, with denormalized vote counts
--   caption_votes  one row per (caption, user): +1 or -1
--
-- Reads are public so signed-out visitors can browse. Every write is limited
-- to the signed-in user's own rows, and vote counts can only change through
-- the trigger on caption_votes.

-- 1. Generations ---------------------------------------------------------------
create table if not exists public.generations (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text, -- "First L." copied from profiles when the row is created
  image_path text not null unique, -- <user id>/<uuid>.<ext> in the photos bucket
  location text check (char_length(location) <= 60),
  vibe text not null check (char_length(vibe) <= 40),
  system_prompt text not null,
  prompt text not null,
  model text not null,
  created_at timestamptz not null default now()
);

create index if not exists generations_created_at_idx
  on public.generations (created_at desc);
create index if not exists generations_user_id_created_at_idx
  on public.generations (user_id, created_at desc);

-- The client never decides when a post was made or whose name is on it.
create or replace function public.stamp_generation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := now();
  select nullif(
           concat_ws(' ', nullif(trim(p.first_name), ''), nullif(left(trim(p.last_name), 1), '') || '.'),
           ''
         )
    into new.author_name
    from public.profiles p
   where p.id = new.user_id;
  return new;
end;
$$;

drop trigger if exists stamp_generation on public.generations;
create trigger stamp_generation
  before insert on public.generations
  for each row execute function public.stamp_generation();

-- 2. Captions ------------------------------------------------------------------
create table if not exists public.captions (
  id bigint generated always as identity primary key,
  generation_id bigint not null references public.generations (id) on delete cascade,
  position smallint not null check (position between 1 and 5),
  text text not null check (char_length(text) between 1 and 200),
  upvotes integer not null default 0 check (upvotes >= 0),
  downvotes integer not null default 0 check (downvotes >= 0),
  score integer generated always as (upvotes - downvotes) stored,
  unique (generation_id, position)
);

create index if not exists captions_score_idx on public.captions (score desc);

-- 3. Votes ---------------------------------------------------------------------
create table if not exists public.caption_votes (
  caption_id bigint not null references public.captions (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (caption_id, user_id)
);

create index if not exists caption_votes_user_id_idx
  on public.caption_votes (user_id);

-- Keep captions.upvotes/downvotes in sync. Users have no UPDATE rights on
-- captions, so this runs as the table owner (security definer).
create or replace function public.apply_caption_vote()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.captions
       set upvotes = upvotes - (old.vote = 1)::int,
           downvotes = downvotes - (old.vote = -1)::int
     where id = old.caption_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.captions
       set upvotes = upvotes + (new.vote = 1)::int,
           downvotes = downvotes + (new.vote = -1)::int
     where id = new.caption_id;
  end if;

  return null;
end;
$$;

drop trigger if exists apply_caption_vote on public.caption_votes;
create trigger apply_caption_vote
  after insert or update or delete on public.caption_votes
  for each row execute function public.apply_caption_vote();

-- 4. Create a generation and its captions in one transaction -------------------
-- security invoker: the RLS policies below still decide what the caller may
-- insert. Returns the new generation id.
create or replace function public.create_generation(
  image_path text,
  location text,
  vibe text,
  system_prompt text,
  prompt text,
  model text,
  captions text[]
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id bigint;
begin
  if coalesce(array_length(captions, 1), 0) not between 1 and 5 then
    raise exception 'Expected between 1 and 5 captions';
  end if;

  insert into public.generations (image_path, location, vibe, system_prompt, prompt, model)
  values (image_path, location, vibe, system_prompt, prompt, model)
  returning id into new_id;

  insert into public.captions (generation_id, position, text)
  select new_id, t.ord, t.caption
    from unnest(captions) with ordinality as t (caption, ord);

  return new_id;
end;
$$;

revoke execute on function public.create_generation from public, anon;
grant execute on function public.create_generation to authenticated;

-- 5. Row level security --------------------------------------------------------
alter table public.generations enable row level security;
alter table public.captions enable row level security;
alter table public.caption_votes enable row level security;

-- generations: anyone can read; signed-in users can only post as themselves,
-- with a photo from their own Storage folder. No updates or deletes.
drop policy if exists "Anyone can read generations" on public.generations;
create policy "Anyone can read generations"
  on public.generations for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can create their own generations" on public.generations;
create policy "Users can create their own generations"
  on public.generations for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and split_part(image_path, '/', 1) = (select auth.uid()::text)
  );

-- captions: anyone can read; users can only add captions to their own
-- generations, and only with zero votes. No updates or deletes.
drop policy if exists "Anyone can read captions" on public.captions;
create policy "Anyone can read captions"
  on public.captions for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can caption their own generations" on public.captions;
create policy "Users can caption their own generations"
  on public.captions for insert
  to authenticated
  with check (
    upvotes = 0
    and downvotes = 0
    and exists (
      select 1 from public.generations g
       where g.id = generation_id
         and g.user_id = (select auth.uid())
    )
  );

-- caption_votes: private. Users can only see, cast, change and take back their
-- own votes. Totals are public through captions.upvotes/downvotes instead.
-- Signed-out visitors don't get table access at all.
revoke all on public.caption_votes from anon;

drop policy if exists "Users can view their own votes" on public.caption_votes;
create policy "Users can view their own votes"
  on public.caption_votes for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can cast their own votes" on public.caption_votes;
create policy "Users can cast their own votes"
  on public.caption_votes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can change their own votes" on public.caption_votes;
create policy "Users can change their own votes"
  on public.caption_votes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their own votes" on public.caption_votes;
create policy "Users can remove their own votes"
  on public.caption_votes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 6. Photo storage -------------------------------------------------------------
-- Public bucket (anyone can view a photo by URL), 3 MB images only. Users can
-- only upload into photos/<their user id>/ and cannot overwrite or delete, so
-- a posted photo can't be swapped out after people vote on it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload photos to their own folder" on storage.objects;
create policy "Users can upload photos to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- 7. Check: every table in public should say rls_enabled = true.
select tablename, rowsecurity as rls_enabled
  from pg_tables
 where schemaname = 'public'
 order by tablename;
