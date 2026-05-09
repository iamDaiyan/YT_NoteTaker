# RoboMission Inspo

RoboMission Inspo is a Next.js app for collecting YouTube robotics reference clips and rich-text notes. The backend is Supabase: Supabase Auth handles email magic-link login, and Supabase Postgres stores each user's videos and notes with row-level security.

## Stack

- Next.js 15 with the App Router
- React 19
- Tailwind CSS
- Supabase Auth
- Supabase Postgres with RLS

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. In Supabase Auth settings, enable email login.
4. Add your site URLs to Auth redirect URLs:

```text
http://localhost:3000
https://YOUR_DEPLOY.vercel.app
```

If you use a Vercel preview URL, add that URL too.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

3. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`, enter your email, and use the magic link Supabase sends.

## Vercel Deployment

Set these Vercel environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Use the default build command:

```bash
npm run build
```

Make sure the deployed Vercel URL is listed in Supabase Auth redirect URLs.

## Useful Commands

```bash
npm run build
npm run lint
npm run dev
```
