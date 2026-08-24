# NUE Artist

Separated frontend / backend architecture for the NUE artist website.

```
nueArtist/
  frontend/   Next.js (App Router) + React + TypeScript + Tailwind CSS
  backend/    NestJS + Prisma + Supabase PostgreSQL
```

The original Laravel app (`nueArtistWebsite`) is unchanged. This project is a sibling folder migration.

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Configure DATABASE_URL (Supabase), JWT secrets

npm install
npx prisma generate
npx prisma db push
npm run start:dev    # http://localhost:3001/api
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001

npm install
npm run dev          # http://localhost:3000
```

## Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15, React 19, Tailwind v3 | Public website (identical UI to Laravel/Inertia) |
| Backend | NestJS 11, Prisma, PostgreSQL | REST API (identical business logic to Laravel) |
| Database | Supabase PostgreSQL | Shared data store |
| Auth | JWT + Refresh Tokens | Admin authentication |
| Storage | Local disk (R2-ready) | Media uploads |

## API Documentation

See [backend/README.md](backend/README.md) for full route listing.

Public endpoints consumed by the frontend:

- `GET /api/public/home`
- `GET /api/public/music`
- `GET /api/public/artist-biographies`

Admin endpoints for future admin dashboard integration:

- `POST /api/auth/login`
- `GET /api/admin/dashboard`
- Full CRUD for albums, posts, events, social-links, sample-links, biographies
