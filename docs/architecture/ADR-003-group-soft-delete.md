# ADR-003: Group Deletion — Soft Delete Column, No UI in v1

**Status:** Accepted
**Date:** 2026-04-05
**Deciders:** Founder, Software Architect

---

## Context

Group deletion is explicitly out of scope for v1 per the PRD. The architectural question is whether the schema should be designed as if deletion will never exist, or whether it should cheaply anticipate it.

---

## Decision

Add a `deleted_at TIMESTAMPTZ` column to the `groups` table now. No deletion UI is exposed in v1. Create an `active_groups` Postgres view that filters `WHERE deleted_at IS NULL`. All application code queries `active_groups` rather than the raw `groups` table.

---

## Alternatives Considered

**Option A — No soft delete column in MVP**
Simpler schema now. If deletion is ever needed, a migration adds the column and a view. Low migration cost but defers trivial work to a worse time.

**Option B — Soft delete column with view (chosen)**
Single column added now. Future deletion feature sets `deleted_at` and the application naturally hides the group everywhere. No migration needed at feature time.

---

## Rationale

- Cost of the column is negligible (one nullable timestamp).
- The `active_groups` view enforces the filter consistently — developers cannot accidentally forget `WHERE deleted_at IS NULL` if they always query through the view.
- Post-MVP deletion becomes a single SQL update plus a new API endpoint, with no schema migration.

---

## Consequences

- All query code must reference `active_groups` for SELECT queries, never the raw `groups` table directly. Must be enforced in code review.
- Admin/migration scripts that need to see all groups (including soft-deleted) query the raw table directly.
- Soft delete does not solve GDPR hard-deletion requirements — that requires a separate migration when implemented.
