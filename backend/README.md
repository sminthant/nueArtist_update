# NUE Artist Backend (NestJS)

NestJS + Prisma + Supabase PostgreSQL backend migrated from the Laravel application at `nueArtistWebsite`.

## Stack

- **NestJS 11** — API framework
- **Prisma ORM** — database access
- **Supabase PostgreSQL** — database
- **JWT + Refresh Tokens** — authentication (replaces Laravel session auth)
- **class-validator** — DTO validation (replaces Laravel Form Requests)
- **@nestjs/schedule** — hourly post expiration (replaces `posts:delete-expired` artisan command)

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL (Supabase), JWT_SECRET, JWT_REFRESH_SECRET

npm install
npx prisma generate
npx prisma db push   # or: npx prisma migrate dev

npm run start:dev    # http://localhost:3001/api
```

## API Routes

All routes are prefixed with `/api`.

### Public (no auth)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/public/home` | Home page data (matches Laravel `/`) |
| GET | `/public/music` | Music releases (matches Laravel `/music`) |
| GET | `/public/artist-biographies` | All biographies |
| GET | `/public/artist-biographies/:id` | Single biography |

### Auth

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/login` | Admin login `{ email, password, remember? }` |
| POST | `/auth/logout` | Revoke refresh token (JWT required) |
| POST | `/auth/refresh` | Refresh access token `{ refreshToken }` |
| GET | `/auth/me` | Current user (JWT required) |

### Admin (JWT required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/dashboard` | Dashboard stats |
| CRUD | `/admin/albums` | Albums (paginate 5, reorder) |
| CRUD | `/admin/posts` | Posts/announcements (paginate 5, expire_at) |
| CRUD | `/admin/events` | Events (filter upcoming/past, paginate 8) |
| CRUD | `/admin/social-links` | Social links (paginate 10) |
| CRUD | `/admin/sample-links` | Sample packs (search, paginate 10, reorder, toggle) |
| CRUD | `/admin/biographies` | Artist biographies (paginate 8) |
| GET/PATCH/DELETE | `/admin/profile` | Admin profile |

## Business Logic Parity

Migrated from Laravel with identical behavior:

- Album categories: `Latest Releases`, `NUE`, `Label Releases`, `Live sets`
- Album create increments all sort_order and sets new album to 0
- Posts soft-delete on expiration (within 5 minutes of expire_at), hourly scheduler
- Posts force-delete on admin destroy; Events/Biographies force-delete on destroy
- Albums soft-delete on destroy
- Sample link placeholder image swap (`via.placeholder.com` → `/static/PNG/CHROME RED.png`)
- Platform link validation (at least one of Spotify/SoundCloud/YouTube required)
- Login rate limiting (5 attempts, Laravel-compatible error messages)
- File uploads to local disk (`./uploads/`), served at `/storage/` (R2-ready)

## File Storage

Uploads stored in `./uploads/` with subfolders: `albums/`, `posts/`, `events/`, `biographies/`, `sample-links/`.

Only file paths stored in database. Cloudflare R2 env vars prepared in `.env.example`.

## Scheduler

`PostsExpirationService` runs hourly — soft-deletes posts where `expire_at <= now() + 5 minutes` (matches Laravel `posts:delete-expired`).

## Seed

On startup, `SeedService` creates admin user from `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` env vars if none exists.
