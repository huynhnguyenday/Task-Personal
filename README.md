# Task Manager

Personal task management application built with Next.js, React, Tailwind CSS, and MongoDB. The app is ready for deployment on Vercel.

## Local setup

Install dependencies and configure MongoDB:

```bash
npm install
copy .env.example .env.local
```

Set `MONGODB_URI` in `.env.local`, then run:

```bash
npm run dev
```

Open http://localhost:3000.

The MongoDB connection helper is available at `src/lib/mongodb.ts` for API routes and server actions.

## Verification

```bash
npm run lint
npm run build
```

## Deploy on Vercel

Import the repository into Vercel and add `MONGODB_URI` under Project Settings > Environment Variables. Use the same value as your local `.env.local`.
