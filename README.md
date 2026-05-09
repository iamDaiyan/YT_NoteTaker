# RoboMission Inspo

RoboMission Inspo is a Next.js App Router app for collecting YouTube robotics reference clips and rich-text notes. It matches the original `Draft/index.html` experience, but stores each signed-in user's library in PostgreSQL so it can run on Vercel.

## Stack

- Next.js 15 with the App Router
- React 19
- Tailwind CSS
- NextAuth.js v5 with simple email credentials
- Prisma with PostgreSQL

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_TRUST_HOST="true"
```

3. Create or update the database schema:

```bash
npm run db:migrate:dev
```

4. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Login

The app uses a simple email login. A visitor enters an email address, and the app stores that person's video library and notes under that email.

This is intentionally lightweight and does not send verification emails or require a password. Use it for a small trusted app; add passwordless email verification or a real identity provider before using it for sensitive data.

## Vercel Deployment

Set these Vercel environment variables:

```bash
DATABASE_URL
AUTH_SECRET
AUTH_TRUST_HOST=true
```

Use this build command in Vercel:

```bash
npm run migrate:deploy && npm run build
```

The `postinstall` script runs `prisma generate`, and `migrate:deploy` applies the committed Prisma migrations before the Next.js production build.

## Useful Commands

```bash
npm run build
npm run lint
npm run migrate:deploy
npm run db:migrate:dev
npm run db:studio
```
