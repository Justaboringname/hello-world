# Hello World

A Next.js app on Vercel backed by Supabase. Week 2 added the public
[`/memes`](app/memes/page.tsx) page; week 3 adds Google sign-in, a `profiles`
table, a Profile page, and a members-only route.

## Routes

| Route            | Access    | What it does                                                       |
| ---------------- | --------- | ------------------------------------------------------------------ |
| `/`              | public    | Gated UI: a sign-in button when signed out, a welcome card when in |
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

The same ones as week 2, in `.env.local` and in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
```

### 5. Vercel

Settings → Deployment Protection → turn off Vercel Authentication, so the site
opens in an incognito window.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
