# Hello World

A Next.js app on Vercel backed by Supabase. Week 2 added the public
[`/memes`](app/memes/page.tsx) page; week 3 added Google sign-in, a `profiles`
table, a Profile page, and a members-only route. Week 4 turns it into a rating
app: signed-in users post a photo, Gemini writes three captions for it, and
everyone votes on the funniest one.

## Routes

| Route            | Access    | What it does                                                       |
| ---------------- | --------- | ------------------------------------------------------------------ |
| `/`              | public    | Caption of the Day, this week's top captions, and how many captions you haven't rated yet |
| `/rate`          | public    | Feed of photos and their AI captions; voting needs sign-in         |
| `/p/[id]`        | public    | One photo: shareable link, votes, and the exact prompt and model used |
| `/create`        | signed in | Upload a photo, pick a vibe, get three Gemini captions (10 a day)  |
| `/memes`         | public    | Rows from the `memes` table                                        |
| `/login`         | public    | "Continue with Google"                                             |
| `/auth/callback` | public    | OAuth redirect URI; exchanges the code for a session cookie        |
| `/onboarding`    | signed in | Asks for first/last name if either is still empty after sign-in    |
| `/profile`       | signed in | Edit first/last name and upload a profile photo                    |
| `/vault`         | signed in | Members-only memes                                                 |

Signed-out visitors to a protected route are redirected to `/login` by
[`proxy.ts`](proxy.ts), and each protected page re-checks the session on the
server ([`lib/auth.ts`](lib/auth.ts)).

## Setup

### 1. Database (Supabase SQL Editor)

Run [`supabase/profiles.sql`](supabase/profiles.sql). It creates:

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

It ends by listing every table in `public` with `rls_enabled`, which should be
`true` for all of them.

#### Row level security

| Table / bucket  | Signed out | Signed in |
| --------------- | ---------- | --------- |
| `memes`         | read       | (none; the page reads as `anon`) |
| `profiles`      | none       | read, create and update **own** row only |
| `generations`   | read       | read; create only as yourself, with a photo from your own Storage folder. No edits or deletes |
| `captions`      | read       | read; add only to your own generations, starting at 0 votes. No edits or deletes. Totals change only through the vote trigger |
| `caption_votes` | no access  | read, cast, change and remove **own** votes only |
| `photos` bucket | view by URL | upload into `photos/<your user id>/` only. No overwrite or delete, so a photo can't be swapped after people vote on it |
| `avatars` bucket | view by URL | read and write inside `avatars/<your user id>/` only |

The server also stamps `created_at` and the author name, so the client can't
backdate a post or post under someone else's name.

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
# Optional. Defaults to gemini-3.5-flash. Use a lighter model such as
# gemini-3.1-flash-lite if your key's free tier rejects the default.
GEMINI_MODEL=
```

`GEMINI_API_KEY` has no `NEXT_PUBLIC_` prefix, so it stays on the server. The
browser never calls Gemini directly.

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
2. **Rate.** Each caption has 👍/👎 buttons. Clicking one calls `castVote`
   ([`app/rate/actions.ts`](app/rate/actions.ts)), which upserts the user's row
   in `caption_votes`. Clicking the same button again deletes the row, and
   clicking the other one flips it. The button updates right away and then
   settles on the totals the server returns. Signed-out visitors see the
   totals, but the buttons link to sign-in, and the action refuses them too.
3. **Come back daily.** The home page crowns a Caption of the Day (the
   top-scoring caption on photos posted since midnight New York time), shows
   the week's top five, and tells signed-in users how many captions they
   haven't rated yet.

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

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
