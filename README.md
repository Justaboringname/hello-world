# Hello World

A Next.js app on Vercel backed by Supabase. Week 2 added a public memes page;
week 3 added Google sign-in, a `profiles` table, a Profile page, and a
members-only route. Week 4 turns it into a rating app: signed-in users post a
photo, Gemini writes three captions for it, and everyone votes on the funniest
one. Memes live in the same `/rate` feed: anyone signed in can post their own
and vote on any of them, and the old members-only `/vault` became
members-only memes ("Sign in to see more memes"). Week 5 is about coming
back: a **New for you** tab with only the posts you haven't rated, a page for
every meme, a "your posts" view on Profile, and a visual pass over the whole
app. Week 6 adds an [admin panel](admin/README.md): a second Next.js app in
`admin/`, on its own Vercel project, for superadmins only.

## Routes

| Route            | Access    | What it does                                                       |
| ---------------- | --------- | ------------------------------------------------------------------ |
| `/`              | public    | Caption of the Day, this week's top captions, top memes, and "N new posts are waiting for your vote" when signed in. Signed-out visitors also get a three-step "how it works" |
| `/rate`          | public    | Tabs: All, ✨ New for you (`?tab=new`, signed in), 😂 Memes (`?tab=memes`) and 📸 AI captions (`?tab=photos`), newest first. Voting needs sign-in. Signed-out visitors see the public memes and a "Sign in to see N more memes" card at the top; signed-in users also see the members-only memes |
| `/p/[id]`        | public    | One photo: shareable link, votes, and the exact prompt and model used |
| `/m/[id]`        | public    | One meme: shareable link and votes. A members-only meme asks signed-out visitors to sign in |
| `/create`        | signed in | ✨ AI captions: upload a photo, pick a vibe, get three Gemini captions (10 a day). 😂 Make a meme (`?mode=meme`): upload an image, add top/bottom text with a live preview, post it (20 a day). Either way you land on the new post's page with a "🎉 Posted!" banner and a Share button |
| `/login`         | public    | "Continue with Google"                                             |
| `/auth/callback` | public    | OAuth redirect URI; exchanges the code for a session cookie        |
| `/onboarding`    | signed in | Asks for first/last name if either is still empty after sign-in    |
| `/profile`       | signed in | Your posts and the 👍 each one got, plus your name and profile photo |
| `/memes`, `/vault` | public  | Redirect to `/rate?tab=memes` (see [`next.config.ts`](next.config.ts)) |

Signed-out visitors to a protected route are redirected to `/login` by
[`proxy.ts`](proxy.ts), and each protected page re-checks the session on the
server ([`lib/auth.ts`](lib/auth.ts)).

## Setup

### 1. Database (Supabase SQL Editor)

Run the files in this order. If you already ran `memes.sql` in an earlier
week, skip it: it creates the table and inserts its rows, so it can't run
twice. Run `profiles.sql`, `captions.sql`, `meme_votes.sql` and
`new_for_you.sql` again whenever they change; they are safe to re-run, and
newer versions add columns and functions the app needs.

Start with [`supabase/memes.sql`](supabase/memes.sql) (week 2), which creates
the `memes` table and its five starter memes. Then run
[`supabase/profiles.sql`](supabase/profiles.sql). It creates:

- `public.profiles` (`first_name`, `last_name` and `avatar_url` are nullable)
- an `on_auth_user_created` trigger on `auth.users` that inserts a profiles row
  the first time a user signs in
- row level security so users can only read and write their own row
- a public `avatars` Storage bucket; images live there, and only their URL is
  stored in Postgres

Then run [`supabase/captions.sql`](supabase/captions.sql) for week 4. It creates:

- `generations`: one row per posted photo, with the vibe, location, and the
  exact system prompt, prompt and model sent to Gemini
- `captions`: the AI captions for each photo, with `upvotes`, `downvotes` and
  `score` totals
- `caption_votes`: one row per (caption, user), `vote` is `1` or `-1`. A trigger
  keeps the caption totals in sync
- `create_generation()`: saves a photo's row and its captions in one
  transaction
- a public `photos` Storage bucket (JPEG/PNG/WebP, 3 MB)

Then run [`supabase/meme_votes.sql`](supabase/meme_votes.sql). It:

- adds `members_only`, `upvotes`, `downvotes` and `score` to `memes`, and
  moves the four memes that used to be hard-coded on `/vault` into the table
  as members-only
- lets signed-in users post memes: `user_id`, `author_name` and `image_path`
  (an image in their own folder of the `photos` bucket), with a trigger that
  stamps `created_at` and the author name
- adds `members_only_meme_count()`, so signed-out visitors see how many memes
  they're missing without seeing the memes
- creates `meme_votes`: one row per (meme, user), `vote` is `1` or `-1`, with
  a trigger that keeps the meme totals in sync
- creates the `rate_feed` view (photos and memes, newest first) that `/rate`
  pages through. It is `security_invoker`, so the RLS below still applies

Both files end by listing every table in `public` with `rls_enabled`, which
should be `true` for all of them.

Finally, run [`supabase/new_for_you.sql`](supabase/new_for_you.sql) (week 5).
It adds one function and no tables:

- `unrated_feed()`: other people's photos and memes the signed-in user hasn't
  voted on yet, for the New for you tab and the counts. A photo counts as
  rated once you've voted on any of its captions. It is `security invoker`,
  so RLS still applies, and only signed-in users can call it. Its arguments
  are the last row of the previous page, so voting (which takes posts out of
  the list) never makes the next page skip any

Until it has run, the rest of the app works; the New for you tab shows an
error and the counts are hidden. The file ends with a check that should say
`true, false` (signed-in users can run it, signed-out visitors can't).

For the week 6 admin panel, run [`admin/supabase/admin.sql`](admin/supabase/admin.sql)
last. It adds `profiles.is_superadmin` (which nobody can set from the app) and
read/write policies for superadmins only. It doesn't change what anyone else
can do. See [`admin/README.md`](admin/README.md).

#### Row level security

| Table / bucket  | Signed out | Signed in |
| --------------- | ---------- | --------- |
| `memes`         | read public memes only | read all, including members-only; post memes only as yourself, with an image from your own Storage folder, never members-only, starting at 0 votes. No edits or deletes; totals change only through the vote trigger |
| `meme_votes`    | no access  | read, cast, change and remove **own** votes only |
| `profiles`      | none       | read, create and update **own** row only |
| `generations`   | read       | read; create only as yourself, with a photo from your own Storage folder. No edits or deletes |
| `captions`      | read       | read; add only to your own generations, starting at 0 votes. No edits or deletes. Totals change only through the vote trigger |
| `caption_votes` | no access  | read, cast, change and remove **own** votes only |
| `photos` bucket | view by URL | upload into `photos/<your user id>/` only. No overwrite or delete, so a photo can't be swapped after people vote on it |
| `avatars` bucket | view by URL | read and write inside `avatars/<your user id>/` only |

The server also stamps `created_at` and the author name, so the client can't
backdate a post or post under someone else's name.

Superadmins (week 6, [`admin/supabase/admin.sql`](admin/supabase/admin.sql))
get more on top of this table:
- **Read** every profile and every vote.
- **Edit** a photo's location and vibe, a caption's text, and a meme's text
  and members-only flag. Column privileges keep everything else, vote totals
  included, out of reach.
- **Add and delete** captions, and **delete** photos, memes and their files
  in the `photos` bucket.

`profiles.is_superadmin` can only be changed from the SQL Editor. Votes and
profiles also keep the server's `created_at` now, so the admin dashboard's
numbers can't be backdated.

### 2. Google OAuth client (Google Cloud Console)

APIs & Services → Credentials → Create credentials → OAuth client ID → Web
application.

- **Authorized JavaScript origins**: your Vercel URL and `http://localhost:3000`
- **Authorized redirect URIs**: `https://<project-ref>.supabase.co/auth/v1/callback`
  (copy it from Supabase → Authentication → Sign In / Providers → Google)

### 3. Supabase Auth

- Authentication → Sign In / Providers → Google: enable it, and paste the
  client ID and secret.
- Authentication → URL Configuration:
  - **Site URL**: your production Vercel URL
  - **Redirect URLs**: `http://localhost:3000/auth/callback`,
    `https://<production-domain>/auth/callback`, and
    `https://*-<vercel-team-slug>.vercel.app/auth/callback` so preview and
    commit-specific deployments work too

The app always asks Supabase to redirect to exactly `<origin>/auth/callback`
with no query string. The page to return to afterwards is kept in a short-lived
cookie instead.

### 4. Environment variables

In `.env.local` and in Vercel (Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
GEMINI_API_KEY=<key from https://aistudio.google.com/apikey>
# Optional. The model to try first; defaults to gemini-3.5-flash-lite.
GEMINI_MODEL=
```

`GEMINI_API_KEY` has no `NEXT_PUBLIC_` prefix, so it stays on the server. The
browser never calls Gemini directly.

On a free AI Studio key, Flash-Lite models get roughly 500 requests a day per
project and Flash models (e.g. `gemini-3.8-flash`) roughly 20, so the app uses
`gemini-3.5-flash-lite` by default. Google only shows the exact limits in AI
Studio.

Gemini sometimes answers `503 UNAVAILABLE` ("high demand") or `429` (rate
limit). [`lib/gemini.ts`](lib/gemini.ts) retries the same model once, then
hands the request to a second model (`gemini-3.1-flash-lite`, which has its
own quota). Any other API error, a timeout or a dropped connection also hands
off. Each attempt times out after 20 s, the first model gets at most 30 s so
the fallback always has a full attempt, and the whole thing gives up after
50 s, inside the 60 s the `/create` page allows. The model that actually answered is saved with the
captions and shown on the photo's page.

### 5. Vercel

Settings → Deployment Protection → turn off Vercel Authentication, so the site
opens in an incognito window.

## Week 4: how it works

1. **Create.** On `/create` the browser shrinks the photo to at most 1600 px
   (phone photos are often 5–15 MB) and sends it to the `createGeneration`
   Server Action ([`app/create/actions.ts`](app/create/actions.ts)). The action
   checks the session and the daily limit, sends the photo and prompt to Gemini
   ([`lib/gemini.ts`](lib/gemini.ts)) asking for JSON with exactly three
   captions, and only after that succeeds uploads the photo and calls
   `create_generation`. If Gemini fails, nothing is stored.
2. **Rate.** `/rate` mixes the photos and the memes in one feed. Every
   caption and every meme has 👍/👎 buttons. Clicking one calls `castVote`
   ([`app/rate/actions.ts`](app/rate/actions.ts)), which upserts the user's row
   in `caption_votes` or `meme_votes`. Clicking the same button again deletes the row, and
   clicking the other one flips it. The button updates right away and then
   settles on the totals the server returns. Signed-out visitors see the
   totals, but the buttons link to sign-in, and the action refuses them too.
3. **Come back daily.** The home page crowns a Caption of the Day (the
   top-scoring caption on photos posted since midnight New York time), shows
   the week's top five, and tells signed-in users how many posts are new to
   them (week 5).

### Designing for Sam

Sam is a Columbia junior from the Midwest who is new to New York, is
chronically online, and explores the city on weekends.

- **Why come back every day?** Caption of the Day resets at midnight, there's
  always a "N captions waiting for your vote" count, and posting is capped at
  10 photos a day, so voting is the thing you can always do.
- **How does it become a source of content?** Every photo has its own
  shareable `/p/[id]` page whose link preview shows the photo and the best
  caption. The four vibes (Midwest culture shock, Chronically online, Columbia
  life, Jaded New Yorker) are written for Sam's own life. Posts carry the
  author's first name and last initial, so the people who post get credit.
- **What would make Crackd.ai better?** Show all of a photo's captions side by
  side so voters compare them instead of judging one in isolation, show the
  vote totals and a 👑 on the leader, and be open about how each caption was
  made. This app does all three: captions are rated in context, and the "How
  these captions were made" panel shows the exact prompt and model.

## Week 5: get feedback and iterate

What changed, and why:

- **New for you** (`/rate?tab=new`). Before, the home page's "N captions and
  memes are waiting for your vote" counted single captions, so a photo you'd
  already voted on could still count twice, and the link went to a feed where
  you couldn't tell new posts from ones you'd already voted on. Now the count is of
  *posts*, it matches the tab's badge, and the tab lists only other people's
  posts you haven't rated. Rate a page, press **Next posts**, and nothing is
  skipped. When there's nothing left: "You're all caught up!"
- **A page for every meme** (`/m/[id]`), like photos already had. The home
  page's Top memes open the meme itself instead of the whole Memes tab, and
  feed titles link to it.
- **Posting tells you it worked.** After posting a meme or a photo you land on
  its page with "🎉 Your meme is live!" and a **Share** button (the phone's
  share sheet on phones, copy-link elsewhere). Before, a new meme dropped you
  into the feed with no confirmation.
- **Your posts on Profile**, with the 👍 each one has received and a total,
  so there's a reason to come back after posting.
- **Visual pass.**
  - The header and footer were in Arial while the pages used Geist; now it's
    Geist everywhere.
  - A soft grey page behind white cards, in light and dark mode.
  - A sticky header with an app icon (also the favicon and home-screen icon)
    and the current section highlighted.
  - Photos and memes that don't fill their frame sit on a blurred copy of
    themselves instead of grey or black bars.
- **Usability fixes.**
  - Bigger vote buttons on phones.
  - "Change photo" is visible on touch screens (it only appeared on hover).
  - A loading skeleton for `/rate`, and a spinner on nav and tab links while
    the next page loads.
  - A shorter `/rate` intro, so the feed starts higher on phones.
  - A friendly 404 page.

## Week 6: admin panel

The admin panel lives in [`admin/`](admin/) and deploys as a second Vercel
project from this repository (Root Directory: `admin`). Its README covers the
setup, how every route is kept behind Google sign-in plus
`profiles.is_superadmin`, and how the first admin gets in without being locked
out.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
