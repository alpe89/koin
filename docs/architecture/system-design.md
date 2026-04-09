# Koin — System Design

**Status:** Approved
**Date:** 2026-04-05
**Author:** Software Architect

---

## Architecture Overview

Koin is a **modular monolith** backend paired with a separately deployed React PWA frontend. There are no microservices, no message queues, and no additional infrastructure processes in v1. The architecture is deliberately simple to match the zero-infra-cost constraint and solo-founder context, while being structured so that future extraction (microservices, real queues, additional auth providers) is an adapter swap rather than a rewrite.

```
┌──────────────────────────────────────────┐
│         koin.app (optional)              │
│  Static landing page                     │
│  Plain HTML or Astro                     │
│  Deployed: Cloudflare Pages              │
│  Fully crawlable, SEO-optimised          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│         app.koin.app                     │
│  React 19 SPA + TypeScript               │
│  Vite build — static files only          │
│  CSS Modules + BEM                       │
│  Chart.js                                │
│  Service Worker (offline / installable)  │
│  Deployed: Cloudflare Pages              │
└─────────────────┬────────────────────────┘
                  │ HTTPS / REST JSON
                  │ Authorization: Bearer <JWT>
                  │ (cross-origin — CORS enforced)
┌─────────────────▼────────────────────────┐
│         api.koin.app                     │
│  Fastify + TypeScript + Zod              │
│  RS256 JWT verification                  │
│  Role enforcement (preHandler hook)      │
│  Modular monolith — 6 domain modules     │
│  Ports & adapters at infra boundaries    │
│  Typed in-process event bus              │
│  Deployed: Railway or Render             │
└─────────────────┬────────────────────────┘
                  │ node-postgres (pg)
                  │ connection pool (max 5)
┌─────────────────▼────────────────────────┐
│         PostgreSQL 16                    │
│  Hosted: Neon serverless (free tier)     │
│  Single database                         │
│  active_groups view                      │
└──────────────────────────────────────────┘
```

---

## Deployment Topology

The frontend application, the optional landing page, and the backend API are three independent deployment units. There is no static file serving from the Fastify process — `@fastify/static` is not used.

```
koin.app            Cloudflare Pages (separate project)
                    Static landing page — plain HTML or Astro
                    Fully crawlable, OG tags, SEO-optimised
                    No dependency on app or API code
                    Deploy: independent pipeline

app.koin.app        Cloudflare Pages
                    React 19 SPA — Vite build output
                    CDN-cached, globally distributed
                    No SSR — pure static files
                    Deploy trigger: push to main (apps/web/)

api.koin.app        Railway or Render (free tier)
                    Fastify API — single Node.js process
                    Deploy trigger: push to main (apps/api/)

Neon PostgreSQL     Serverless Postgres (free tier, 0.5 GB)
                    Accessible to API only — never to the client
```

### Why No SSR

The application is fully behind authentication. Every meaningful page is private. SSR provides no SEO benefit for authenticated content, and SSR introduces a direct conflict with the PWA service worker model: a service worker must choose between caching the server-rendered HTML document (stale) or going network-first (loses the installable PWA performance benefit). The Vite SPA static shell model resolves this cleanly — the service worker caches `index.html` and serves it instantly; all data comes from the API.

If Koin ever adds public-facing pages (shareable reports, public group profiles), SSR should be reconsidered at that point. See ADR-005.

### CORS Configuration

```typescript
fastify.register(cors, {
  origin: process.env.APP_URL,        // 'https://app.koin.app'
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false                  // JWT is in Authorization header, not a cookie
})
```

`credentials: false` is correct and intentional. `origin: '*'` is never used, including in development.

Local development: `APP_URL=http://localhost:5173`.

### OAuth Redirect URI

```
1.  User taps "Sign in" on https://app.koin.app
2.  Frontend navigates to https://api.koin.app/api/v1/auth/google
3.  API redirects browser to accounts.google.com (with CSRF state nonce)
4.  User consents on Google
5.  Google redirects to https://api.koin.app/api/v1/auth/google/callback?code=...
6.  API exchanges code, upserts user row, signs RS256 JWT
7.  API issues: 302 → https://app.koin.app/#token=<jwt>
8.  Frontend extracts token from fragment, strips fragment from URL, stores in IndexedDB
```

**Google Cloud Console registrations required:**
- Authorised redirect URI: `https://api.koin.app/api/v1/auth/google/callback`
- Authorised JavaScript origin: `https://app.koin.app`
- Local dev redirect URI: `http://localhost:3000/api/v1/auth/google/callback`

`GOOGLE_REDIRECT_URI` in the backend environment must exactly match the registered redirect URI. A mismatch produces a Google OAuth error with no clear diagnostic — this is the single most common deployment gotcha for this setup.

### Required Environment Variables

```
# Database
DATABASE_URL              # postgres://...@neon.tech/koin

# Auth
JWT_PRIVATE_KEY           # RS256 PEM — never committed to the repository
JWT_PUBLIC_KEY            # RS256 PEM
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI       # must match Google Cloud Console exactly

# App
APP_URL                   # https://app.koin.app (CORS + invite URL assembly)
NODE_ENV                  # production | development
PORT                      # 3000
```

---

## Modular Monolith Structure

The backend is organised as six domain modules plus an infrastructure layer. Each module owns its routes, service logic, and DB queries. No module reaches into another module's internal files — cross-module communication uses exported service functions or domain events only.

```
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts          # GET /auth/google, /auth/google/callback, POST /auth/signout, GET /auth/me
│   │   ├── auth.service.ts         # exchangeCode(), issueJwt(), getMe()
│   │   └── auth.types.ts
│   ├── users/
│   │   ├── users.routes.ts         # PATCH /users/me
│   │   ├── users.service.ts        # updateUser()
│   │   └── users.types.ts
│   ├── groups/
│   │   ├── groups.routes.ts        # CRUD /groups, /groups/:id
│   │   ├── groups.service.ts       # createGroup(), getGroup(), renameGroup()
│   │   ├── members.service.ts      # listMembers(), removeMember(), changeRole()
│   │   ├── invitations.service.ts  # createInvitation(), getInvitation(), acceptInvitation()
│   │   └── groups.types.ts
│   ├── transactions/
│   │   ├── transactions.routes.ts  # CRUD /groups/:id/transactions
│   │   ├── transactions.service.ts # createTransaction(), updateTransaction(), deleteTransaction()
│   │   └── transactions.types.ts
│   ├── recurring/
│   │   ├── recurring.routes.ts     # CRUD /groups/:id/recurring-rules
│   │   ├── recurring.service.ts    # createRule(), updateRule(), deleteRule(), deactivateRulesForMember()
│   │   ├── recurring.handlers.ts   # domain event subscriptions
│   │   └── recurring.types.ts
│   └── reports/
│       ├── reports.routes.ts       # GET /groups/:id/dashboard, /groups/:id/reports/monthly
│       ├── reports.service.ts      # getDashboard(), getMonthlyReport()
│       └── reports.types.ts
├── infrastructure/
│   ├── db/
│   │   ├── pool.ts                 # node-postgres Pool singleton
│   │   └── migrations/             # numbered SQL files
│   ├── auth/
│   │   ├── auth-provider.port.ts   # AuthProvider interface
│   │   └── google.adapter.ts       # GoogleAuthAdapter
│   ├── jwt/
│   │   ├── jwt.port.ts             # JwtService interface
│   │   └── rs256.adapter.ts        # Rs256JwtAdapter
│   ├── scheduler/
│   │   ├── scheduler.port.ts       # RecurringScheduler interface
│   │   └── in-process.adapter.ts   # InProcessScheduler
│   └── events/
│       ├── event-bus.ts            # Typed EventEmitter wrapper
│       └── domain-events.ts        # KoinEvent union type
├── hooks/
│   ├── authenticate.ts             # JWT verification — attaches req.user
│   └── require-group-member.ts     # Membership + role resolution — attaches req.groupMember
└── server.ts                       # Fastify instance, plugin registration, adapter wiring
```

### Module Boundary Rules

1. A module's `service.ts` files are the only public API of that module.
2. A module may import from `infrastructure/` freely.
3. A module must not import from another module's internal files. Cross-module needs go through exported service functions or domain events.
4. The `reports` module has its own read queries — it does not import from `transactions/` or `groups/`. Sharing write-path service logic with a read-only aggregation module would couple them unnecessarily.

Each module is a credible extraction candidate if the monolith is ever split.

---

## Ports and Adapters at Infrastructure Boundaries

Applied only at the three boundaries where swapping the implementation is a realistic near-term need. Everything else is plain TypeScript — no DI framework, no decorators, no container.

### Auth Provider Port

```typescript
// infrastructure/auth/auth-provider.port.ts
export interface AuthProvider {
  exchangeCodeForProfile(code: string, redirectUri: string): Promise<UserProfile>
}
```

The `auth` module depends on `AuthProvider`, never on `GoogleAuthAdapter` directly. Adding Apple Sign-In post-MVP is a new adapter file and a config change.

### Scheduler Port

```typescript
// infrastructure/scheduler/scheduler.port.ts
export interface RecurringScheduler {
  start(): void
  stop(): void
}
```

Swapping to `PgCronScheduler` or `BullMQScheduler` is a new adapter file and one line in `server.ts`.

### Adapter Wiring in server.ts

```typescript
const authProvider = new GoogleAuthAdapter(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET)
const jwtService   = new Rs256JwtAdapter(env.JWT_PRIVATE_KEY, env.JWT_PUBLIC_KEY)
const scheduler    = new InProcessScheduler(db, eventBus)

scheduler.start()
registerEventHandlers(db, eventBus)
```

---

## Domain Events

The backend is structurally event-driven using a typed in-process event bus built on Node.js `EventEmitter`. Modules publish events after successful writes; other modules subscribe without being directly coupled to the publisher.

### Event Bus

```typescript
// infrastructure/events/event-bus.ts
import { EventEmitter } from 'node:events'
import type { KoinEvent } from './domain-events.js'

type EventType = KoinEvent['type']
type EventPayload<T extends EventType> = Extract<KoinEvent, { type: T }>['payload']

export type DomainEvent<T extends EventType> = {
  type: T
  payload: EventPayload<T>
  occurredAt: Date
}

class EventBus extends EventEmitter {
  publish<T extends EventType>(type: T, payload: EventPayload<T>): void {
    this.emit(type, { type, payload, occurredAt: new Date() } satisfies DomainEvent<T>)
  }

  subscribe<T extends EventType>(
    type: T,
    handler: (event: DomainEvent<T>) => Promise<void>
  ): void {
    this.on(type, handler)
  }
}

export const eventBus = new EventBus()
eventBus.setMaxListeners(20)
```

### Domain Event Catalogue

```typescript
// infrastructure/events/domain-events.ts
export type KoinEvent =
  | {
      type: 'transaction.created'
      payload: {
        transactionId: string
        groupId: string
        type: 'expense' | 'income'
        amountCents: number
        createdBy: string
        date: string  // YYYY-MM-DD
      }
    }
  | {
      type: 'transaction.deleted'
      payload: { transactionId: string; groupId: string }
    }
  | {
      type: 'recurring_rule.created'
      payload: { ruleId: string; groupId: string; dayOfMonth: number }
    }
  | {
      type: 'member.removed'
      payload: { groupId: string; userId: string }
    }
```

### Publisher / Subscriber Mapping

| Event | Publisher | Subscriber (v1) | Rationale |
|---|---|---|---|
| `transaction.created` | `transactions.service` | `InProcessScheduler` | Secondary fire trigger |
| `transaction.deleted` | `transactions.service` | _(none in v1)_ | Seam for future cache invalidation |
| `recurring_rule.created` | `recurring.service` | `InProcessScheduler` | New rule may be due immediately |
| `member.removed` | `members.service` | `recurring.handlers` | Deactivates rules for removed member — keeps modules decoupled |

### Outbox Pattern — Explicitly Deferred

Every v1 event subscriber has self-correcting behaviour if an event is lost (scheduler has `last_fired_at` idempotency; rule deactivation is correctable manually). No v1 event has a hard delivery guarantee. Add the outbox before any event that requires exactly-once delivery for financial correctness.

### Migration to a Real Queue

The `eventBus` singleton is the seam. Replacing `InProcessEventBus` with `BullMQEventBus` is one new file and one line in `server.ts`. No module changes.

---

## Authentication Flow

### JWT Details

- Algorithm: RS256. Private key from `JWT_PRIVATE_KEY` env var. Never committed.
- Expiry: 7 days. No refresh token in v1.
- Payload: `sub` (user UUID), `email`, `displayName`, `iat`, `exp`. No role claim.
- Token in URL fragment — never in server logs or `Referer` headers. Frontend strips fragment immediately.

### Token Storage

- **IndexedDB** for installed PWA (sessionStorage wiped on iOS Safari backgrounding).
- **sessionStorage** acceptable in standard browser tab.
- Never `localStorage`.

### Sign-Out

Client-side token deletion only. `POST /api/v1/auth/signout` returns `204`. No server-side blocklist in v1.

### CSRF Protection

Random nonce per auth initiation stored in a short-lived `HttpOnly Secure SameSite=Strict` cookie, verified on callback.

---

## Role Enforcement

Roles are per-group, resolved by the `require-group-member` preHandler:

```sql
SELECT role FROM group_members
WHERE group_id = $1 AND user_id = $2 AND removed_at IS NULL
```

| Action | Minimum role |
|---|---|
| View transactions, dashboard, report | viewer |
| Add transaction | editor |
| Edit / delete own transaction | editor |
| Edit / delete any transaction | owner |
| Manage own recurring rules | editor |
| Manage any recurring rule | owner |
| Invite / remove members, change roles | owner |
| Rename group | owner |

Editor-scoped mutations require a secondary ownership check after the role check.

---

## Recurring Transaction Scheduler

**Design:** lazy in-process, no cron, no queue.

**Firing condition:** `is_active = true` AND `day_of_month <= today.day` AND not yet fired this calendar month.

**Fire action:** insert `transactions` row + update `last_fired_at` in a single Postgres transaction. `pg_try_advisory_lock` prevents concurrent double-fires.

**Trigger points:**
1. Server startup — `checkAndFireAll()` for missed-day recovery
2. Authenticated requests — `checkAndFireDue()`, once per hour per instance
3. `transaction.created` and `recurring_rule.created` events — secondary same-day triggers

**Failure handling:** `last_fired_at` not updated on failure — next run retries. At-least-once, double-fire prevented by month check.

**Migration:** replace `InProcessScheduler` with a new adapter. No schema or module changes.

---

## PWA Architecture

- **Service Worker:** cache-first for app shell, network-only for `/api/*`. Vite PWA plugin (Workbox).
- **Manifest:** `display: standalone`, `theme_color: #2563eb`, 192px + 512px + 512px maskable icons.
- **iOS Safari:** `apple-mobile-web-app-capable` meta tag required. JWT in IndexedDB.

---

## Database Connection

- `node-postgres` (`pg`), pool size 5.
- All queries parameterized — no string interpolation.
- Multi-statement writes in explicit `BEGIN / COMMIT`.

---

## Error Handling

| Condition | Status |
|---|---|
| Zod validation failure | `422` with field-level detail |
| Missing / invalid JWT | `401` |
| Insufficient role | `403` |
| Not found | `404` |
| Business rule violation | `409` |
| Unhandled exception | `500` generic message (stack logged server-side) |

All requests assigned a correlation ID (`X-Request-Id`), included in error responses.

---

## Monorepo Structure

```
koin/
├── apps/
│   ├── web/              # React 19 SPA — Vite, Cloudflare Pages
│   └── api/              # Fastify backend — Railway or Render
│       └── src/
│           ├── modules/  # 6 domain modules
│           ├── infrastructure/
│           ├── hooks/
│           └── server.ts
├── packages/
│   └── shared/           # Shared TypeScript types (API contract shapes)
├── docs/
└── package.json          # bun workspaces root
```
