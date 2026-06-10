# Dua Platform — Backend Build Prompt

> **How to use this file:** Hand this entire file to an AI coding assistant (Claude, Cursor, GitHub Copilot, etc.) as the system/project prompt. Add new features to the relevant section before prompting. The assistant will have full context of the architecture, conventions, and current state.

---

## Project Overview

Build the backend API for **Dua Platform** — an anonymous dua-sending web app inspired by NGL/Chithi.me. Users create a public profile, share their link, and friends can anonymously send them duas (prayers). The owner reads their inbox.

This is a **production-grade Node.js REST API** designed to be simple to start and easy to scale. Ship Phase 1 first. Do not add Phase 2+ features unless explicitly listed in the Features section below.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node.js 20 (LTS) | |
| Framework | Express.js | No Fastify, no NestJS — keep it simple |
| ORM | Prisma | PostgreSQL only |
| Database | PostgreSQL 16 | Primary data store |
| Cache / Rate limit | Redis 7 | Rate limiting on anonymous endpoints |
| Auth | JWT (access token only) | HttpOnly cookie or Authorization header — your choice, be consistent |
| Validation | Zod | All request bodies validated before hitting controller |
| Password hashing | bcryptjs | saltRounds = 12 |
| Environment | dotenv | Never hardcode secrets |
| Testing | Jest + Supertest | Unit tests for services, integration tests for routes |

---

## Project Structure

Follow this exact structure. Do not deviate.

```
apps/api/
├── src/
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── dua.routes.js
│   │   ├── user.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── dua.controller.js
│   │   ├── user.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── dua.service.js
│   │   ├── user.service.js
│   │   └── admin.service.js
│   ├── repositories/
│   │   ├── dua.repo.js
│   │   ├── user.repo.js
│   │   └── admin.repo.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── adminAuth.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── validate.middleware.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   └── app.js
├── .env.example
├── package.json
└── Dockerfile
```

### Layer responsibilities

- **Route** — defines HTTP method + path + middleware chain only. No logic.
- **Controller** — reads `req`, calls service, writes `res`. No DB calls, no business logic.
- **Service** — all business logic. Calls repositories. Throws errors with descriptive messages.
- **Repository** — Prisma queries only. No logic, no HTTP awareness.
- **Middleware** — cross-cutting concerns: auth check, rate limit, request validation.

---

## Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

model User {
  id              String   @id @default(uuid())
  username        String   @unique
  email           String   @unique
  password        String
  name            String?
  bio             String?
  avatarUrl       String?
  isPaused        Boolean  @default(false)
  isBanned        Boolean  @default(false)
  role            Role     @default(USER)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  duas            Dua[]
  reportsFiled    Report[] @relation("ReportFiler")   // reports this user submitted
}

model Dua {
  id         String   @id @default(uuid())
  message    String
  isRead     Boolean  @default(false)
  isHidden   Boolean  @default(false)   // admin soft-delete
  createdAt  DateTime @default(now())
  ownerId    String
  owner      User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  reports    Report[]
}

model Report {
  id         String   @id @default(uuid())
  reason     String
  status     String   @default("pending")  // pending | resolved | dismissed
  createdAt  DateTime @default(now())
  duaId      String
  dua        Dua      @relation(fields: [duaId], references: [id], onDelete: Cascade)
  reporterId String?                       // null = reported anonymously
  filer      User?    @relation("ReportFiler", fields: [reporterId], references: [id])
}
```

> **Schema file location:** Prisma by default looks for `prisma/schema.prisma` at the project root. The file lives at `src/prisma/schema.prisma` in this project, so add `prismaSchemaPath` to `package.json`:
> ```json
> "prisma": {
>   "schema": "src/prisma/schema.prisma",
>   "seed": "node src/prisma/seed.js"
> }
> ```

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | None | Create account. Returns JWT + user object (no password). |
| POST | `/login` | None | Validate credentials. Returns JWT + user object. |
| POST | `/logout` | JWT | Stateless — just return 200 (or invalidate refresh token if added later). |

**Register body:**
```json
{
  "username": "rafi",
  "email": "rafi@example.com",
  "password": "minLength8"
}
```

**Login body:**
```json
{
  "email": "rafi@example.com",
  "password": "minLength8"
}
```

**Response shape (both):**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "uuid",
    "username": "rafi",
    "email": "rafi@example.com",
    "name": null,
    "bio": null,
    "avatarUrl": null
  }
}
```

---

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:username` | None | Public profile. Returns name, bio, avatarUrl, isPaused. Never return email or password. |
| PATCH | `/me` | JWT | Update own profile fields. Accepts: name, bio, avatarUrl, isPaused, username. |

**PATCH /me body (all fields optional):**
```json
{
  "name": "Rafi Ahmed",
  "bio": "Send me a dua 🤲",
  "isPaused": false
}
```

---

### Duas — `/api/duas`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/send/:username` | None | Anonymous send. Rate limited by IP. |
| GET | `/inbox` | JWT | Paginated inbox for logged-in user. |
| PATCH | `/:id/read` | JWT | Mark a single dua as read. |
| DELETE | `/:id` | JWT | Delete own dua. Verify ownership in service layer. |
| POST | `/:id/report` | None | Report a dua for abuse. Body: `{ reason }`. Rate limited. |

**POST /send/:username body:**
```json
{
  "message": "May Allah grant you success in your exams."
}
```

**GET /inbox query params:**
- `page` (default: 1)
- `limit` (default: 20)
- `unreadOnly` (optional, boolean)

**GET /inbox response:**
```json
{
  "duas": [
    {
      "id": "uuid",
      "message": "May Allah bless you.",
      "isRead": false,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### Admin — `/api/admin`

> All admin routes require JWT **and** `req.user.role === 'ADMIN'`. Create a separate `adminAuth.middleware.js` that checks both. Return `403` if the user is authenticated but not an admin.

| Method | Path | Description |
|---|---|---|
| GET | `/stats` | Dashboard counts: total users, duas today, reports pending, banned users. Optional `?chart=duas_daily` or `?chart=users_daily` returns last-7-days array `[{ date, count }]` for dashboard charts. |
| GET | `/users` | Paginated user list. Query: `?page=&limit=&search=&banned=` |
| GET | `/users/:id` | Single user detail + their last 20 duas + report count |
| PATCH | `/users/:id/ban` | Ban a user (`isBanned: true`). Body: `{ reason }` |
| PATCH | `/users/:id/unban` | Unban a user |
| DELETE | `/users/:id` | Hard delete user + all their duas (irreversible) |
| GET | `/duas` | Paginated list of all duas. Query: `?page=&hidden=&reported=` |
| DELETE | `/duas/:id` | Hard delete a specific dua |
| PATCH | `/duas/:id/hide` | Soft hide a dua (`isHidden: true`) |
| PATCH | `/duas/:id/unhide` | Unhide a dua (`isHidden: false`) |
| GET | `/reports` | Paginated reports. Query: `?status=pending|resolved|dismissed` |
| PATCH | `/reports/:id/resolve` | Mark report resolved + optionally hide the dua |
| PATCH | `/reports/:id/dismiss` | Dismiss report (dua stays visible) |

**GET /stats response:**
```json
{
  "users": { "total": 142, "today": 3, "banned": 2 },
  "duas": { "total": 891, "today": 47, "hidden": 5 },
  "reports": { "pending": 4, "resolved": 12, "dismissed": 3 }
}
```

**Ban logic in service layer:**
- When a user is banned: set `isBanned: true`, optionally hide all their received duas
- Banned users get `403` on **login attempt** — check `isBanned` inside `auth.service.js` `login()` function, **not** in `auth.middleware.js`. The middleware only verifies the JWT token; a banned user's existing token would still pass JWT verification. Blocking at login prevents new sessions from being created.
- Message: `"Your account has been suspended."`
- Note: existing sessions of a freshly-banned user remain valid until their JWT expires (7 days). This is acceptable for MVP. Phase 2 can add a token blocklist in Redis if immediate session revocation is needed.



### `adminAuth.middleware.js`
- Extends `auth.middleware.js` — first verify JWT (reuse the same logic), then check `req.user.role === 'ADMIN'`
- Return `401` if not authenticated, `403` if authenticated but not admin
- Never expose admin endpoints without this middleware

### `auth.middleware.js`
- Extract JWT from `Authorization: Bearer <token>` header
- Verify with `process.env.JWT_SECRET`
- Attach decoded user (`{ id, username, email }`) to `req.user`
- Return `401` if missing or invalid

### `rateLimit.middleware.js`
- Use `express-rate-limit` with Redis store (`rate-limit-redis`)
- **Important:** `express-rate-limit` v7+ uses `sendCommand` option for `rate-limit-redis`. Example setup:
  ```js
  import rateLimit from 'express-rate-limit';
  import RedisStore from 'rate-limit-redis';
  import { createClient } from 'redis';

  const redisClient = createClient({ url: process.env.REDIS_URL });
  await redisClient.connect();

  export const duaSendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
  });
  ```
- Anonymous dua send: **5 requests per 15 minutes per IP**
- Auth endpoints (login/register): **10 requests per 15 minutes per IP**
- Response on limit hit: `429 Too Many Requests` with JSON error

### `validate.middleware.js`
- Accept a Zod schema as argument, return a middleware function
- Validate `req.body` against schema
- On failure: return `400` with array of field errors
- Usage: `router.post('/send/:username', validate(sendDuaSchema), duaController.send)`

---

## Error Handling

All errors must return consistent JSON:

```json
{
  "error": true,
  "message": "Human readable message",
  "code": "OPTIONAL_ERROR_CODE"
}
```

Common status codes to use:
- `400` — validation error
- `401` — not authenticated
- `403` — authenticated but not authorized (e.g. deleting someone else's dua)
- `404` — resource not found
- `409` — conflict (username/email already taken)
- `429` — rate limit exceeded
- `500` — unexpected server error (log it, return generic message to client)

Create a global error handler in `app.js` as the last middleware.

---

## Security Requirements

- [ ] All passwords hashed with bcrypt (never stored plain)
- [ ] JWT secret loaded from env, never hardcoded
- [ ] `helmet` middleware on all routes
- [ ] `cors` configured — only allow frontend origin (from env var)
- [ ] Rate limiting on anonymous endpoints
- [ ] Input validation on all POST/PATCH bodies
- [ ] User can only modify/delete their own resources (check `req.user.id === resource.ownerId`)
- [ ] Never return `password` field in any response
- [ ] `isPaused` check on dua send: if owner has paused, return `403` with message "This user is not accepting duas right now."

---

## Environment Variables

```env
# apps/api/.env.example

NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://user:password@localhost:5432/dua_db

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

REDIS_URL=redis://localhost:6379

CORS_ORIGIN=http://localhost:5173

# Admin seed (used by prisma seed script to create first admin account)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=change-this-before-deploy

# Phase 2 — leave empty for now
EMAIL_FROM=
RESEND_API_KEY=
```

---

## Health Check

```
GET /health
```

Returns `200 OK`:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

This endpoint is used by Docker health checks and Uptime Kuma.

---

## Conventions & Code Style

- Use `async/await` everywhere. No `.then().catch()` chains.
- Wrap all async controller functions in a `catchAsync(fn)` helper to avoid repetitive try/catch.
- Use named exports (not default exports) for services and repositories.
- Use default export for Express router in route files.
- Use `console.error` for errors in development. In production, a proper logger (pino) can be added in Phase 2.
- Keep controllers thin — ideally under 15 lines each.
- Service functions should throw plain `Error` objects with descriptive messages. The global error handler maps them to HTTP responses.

---

## Dockerfile

```dockerfile
# Stage 1: install ALL deps (including devDeps for prisma generate)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# Stage 2: production image with only production deps
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Copy production node_modules fresh (no devDeps)
COPY package*.json ./
RUN npm ci --omit=dev
# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY src ./src
USER appuser
EXPOSE 5000
CMD ["node", "src/app.js"]
```

> **Note:** `prisma` and `@prisma/client` must be in `dependencies` (not `devDependencies`) so that `@prisma/client` is available at runtime. The `prisma` CLI package can be in `devDependencies` since it is only used during the build stage.

---

## Phase 1 Checklist (build this first)

- [ ] Project scaffold with all folders
- [ ] Prisma schema + first migration
- [ ] `GET /health`
- [ ] Auth: register, login
- [ ] Users: get public profile, update own profile
- [ ] Duas: send anonymous, read inbox (paginated), mark read, delete
- [ ] Rate limiting on send endpoint
- [ ] Global error handler
- [ ] Input validation (Zod) on all endpoints
- [ ] Jest tests for auth service and dua service
- [ ] Seed script creates one ADMIN role user for first login
- [ ] Admin routes: stats, user list/ban/delete, dua list/hide/delete, reports
- [ ] `adminAuth.middleware.js` protecting all `/api/admin/*` routes
- [ ] `POST /api/duas/:id/report` endpoint (anonymous, rate limited)

---

## Phase 2 Features (add here when ready)

<!-- Add new features below. Each feature should include: endpoint, request/response shape, DB changes needed, and any new middleware. -->

- [ ] **Email notifications** — Send email via Resend when a new dua arrives. Add `emailNotifications` boolean field to User model. Only send if enabled.
- [ ] **Mark all as read** — `PATCH /api/duas/read-all` — marks all of logged-in user's duas as read.

---

## Phase 3 Features (do not build yet)

- Custom domain support per user
- Public duas feed (opt-in per dua)
- Dua categories / tags
- Token blocklist in Redis (immediate ban session revocation)
- Analytics: dua count over time per user

---

## Notes for the AI Assistant

- Always follow the Route → Controller → Service → Repository pattern strictly.
- If a feature requires a DB schema change, write the Prisma migration first, then the code.
- Do not install unnecessary packages. If you need a package not listed here, ask first.
- Write the code for one layer at a time (schema → repo → service → controller → route → test).
- When generating tests, mock the repository layer — do not hit a real database in unit tests.
