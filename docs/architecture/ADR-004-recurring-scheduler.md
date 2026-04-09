# ADR-004: Recurring Transaction Scheduler — Lazy In-Process with Request-Triggered Catch-Up

**Status:** Accepted
**Date:** 2026-04-05
**Deciders:** Founder, Software Architect

---

## Context

Recurring transactions must auto-fire on the correct day each month without manual intervention. The system must work at zero infrastructure cost — no persistent cron job, no message queue, no separate worker process. Free-tier hosting may spin down the server between requests.

---

## Decision

Implement a lazy in-process scheduler:

1. **On server startup**: run `checkAndFireAll()` — queries all active recurring rules and fires any that are due and not yet fired this month.
2. **On authenticated requests**: a Fastify `onRequest` hook calls `checkAndFireDue()`, rate-gated to run at most once per hour per server instance (in-process timestamp check).
3. **Via domain events**: `transaction.created` and `recurring_rule.created` events trigger `checkAndFireDue()` as secondary same-day fire points.
4. **Idempotency**: `last_fired_at` (a `DATE` column on `recurring_rules`) is the anchor. A rule is only fired if `last_fired_at` is NULL or is in a prior month relative to today.
5. **Concurrency safety**: a Postgres advisory lock (`pg_try_advisory_lock`) per rule prevents double-firing when concurrent requests trigger the scheduler simultaneously.

---

## Alternatives Considered

**Option A — External cron (e.g. GitHub Actions scheduled workflow)**
Free, reliable timing. Requires a publicly accessible API endpoint with a shared secret. Adds operational complexity. Viable post-MVP.

**Option B — Database-level scheduled job (pg_cron extension)**
Reliable, runs even when the app server is down. Not available on Neon free tier. Requires a paid managed Postgres tier. Not viable for zero-infra MVP.

**Option C — Lazy in-process scheduler (chosen)**
Zero external dependencies. Works on any hosting tier. Correct for the use case: the app is used daily, guaranteeing at least one request per day that triggers the scheduler.

---

## Rationale

- The household context means the app will receive at least one authenticated request on any given day. Same-day firing is virtually guaranteed.
- `last_fired_at` makes the operation idempotent — the fire action is safe to attempt multiple times.
- Postgres advisory locks prevent concurrent double-fires without application-level locking infrastructure.
- Startup check handles the "server was down on the firing day" scenario.

---

## Consequences

- Firing is request-triggered, not time-triggered. If no user logs in on the firing day, the transaction fires on the next login. Acceptable for a household app — a salary firing one day late is not a UX problem.
- If the server is offline for multiple calendar months, only the most recent missed month is caught up on restart.
- This design cannot be used for time-sensitive financial operations (e.g. payments). Koin does not initiate payments, so this is not a concern.
- Migrating to a real scheduler post-MVP requires only replacing the in-process scheduler adapter. The `last_fired_at` idempotency column and the transaction insert logic are unchanged.
