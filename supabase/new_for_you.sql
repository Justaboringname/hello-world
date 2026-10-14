-- Week 5: "New for you", the posts a signed-in user hasn't rated yet. Paste
-- into the Supabase SQL Editor and run after meme_votes.sql. Safe to run more
-- than once.
--
--   unrated_feed()   other people's photos and memes the caller hasn't voted
--                    on, for the New for you tab on /rate and the counts on
--                    the home page and in the header
--
-- A photo counts as rated once the caller has voted on any of its captions.
-- The caller's own posts are left out.

-- before_created_at / before_kind / before_id: the last row of the previous
-- page. The next page starts right after it, so rating posts (which drops
-- them from this list) never makes the next page skip any. Leave all three
-- null for the first page.
create or replace function public.unrated_feed(
  before_created_at timestamptz default null,
  before_kind text default null,
  before_id bigint default null
)
returns table (kind text, id bigint, created_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select f.kind, f.id, f.created_at
    from (
      select 'photo'::text as kind, g.id, g.created_at
        from public.generations g
       where g.user_id is distinct from (select auth.uid())
         and not exists (
           select 1
             from public.captions c
             join public.caption_votes v on v.caption_id = c.id
            where c.generation_id = g.id
              and v.user_id = (select auth.uid())
         )
      union all
      select 'meme'::text as kind, m.id, m.created_at
        from public.memes m
       where m.user_id is distinct from (select auth.uid())
         and not exists (
           select 1
             from public.meme_votes v
            where v.meme_id = m.id
              and v.user_id = (select auth.uid())
         )
    ) f
   where before_created_at is null
      or (f.created_at, f.kind, f.id) < (before_created_at, before_kind, before_id)
   order by f.created_at desc, f.kind desc, f.id desc;
$$;

-- security invoker, so RLS still applies: members-only memes and the
-- caller's own votes only. Signed-out visitors have no votes to compare
-- against, so they can't call it at all.
revoke execute on function public.unrated_feed(timestamptz, text, bigint) from public, anon;
grant execute on function public.unrated_feed(timestamptz, text, bigint) to authenticated;

-- Check: the function exists and anon can't run it (expect true, false).
select has_function_privilege('authenticated', 'public.unrated_feed(timestamptz, text, bigint)', 'execute') as authenticated_can_run,
       has_function_privilege('anon', 'public.unrated_feed(timestamptz, text, bigint)', 'execute') as anon_can_run;
