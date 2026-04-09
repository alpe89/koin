# ADR-002: Member Removal Policy — No Voluntary Leaving in v1

**Status:** Accepted
**Date:** 2026-04-05
**Deciders:** Founder, Software Architect

---

## Context

The PRD raised open questions about voluntary group leaving and what happens to a departing member's transactions and recurring rules. Two real-world scenarios have genuinely different correct answers:

1. **Flatmates group**: the departing member's recurring transactions represent their personal costs. Deactivating their rules makes sense; their past transactions represent real shared history.
2. **Goal-oriented group** (e.g. saving for a trip): all entries belong to the shared goal; removing all of a leaver's entries might be more appropriate.

A single enforced policy cannot satisfy both cases without a group-type flag, which adds product complexity that cannot be validated at MVP scale.

---

## Decision

Voluntary leaving is not supported in v1. Only the group owner can remove a member.

When a member is removed by the owner:
- Their past transactions remain in place, attribution preserved via `created_by` FK and `created_by_name` snapshot.
- Their recurring rules are set to `is_active = false`. Rules are not transferred or deleted.
- The owner sees deactivated rules in the rules list and can recreate or delete them manually.

---

## Alternatives Considered

**Option A — Single removal policy (keep transactions, deactivate rules)**
Simple but wrong for one of the two real scenarios.

**Option B — Group type flag (household vs. goal)**
Would drive different leave policies per group. Adds product complexity that cannot be validated at MVP scale.

**Option C — Defer voluntary leaving entirely (chosen)**
No `leave_group` endpoint. Owner-remove is the only exit. Owner has full context and can perform manual cleanup.

---

## Rationale

- Building the wrong policy and having to migrate user data later is worse than shipping no policy.
- The primary user (a couple) has no need for voluntary leaving.
- Keeps the API surface smaller and the schema simpler.
- Does not preclude adding voluntary leaving post-MVP — the `removed_at` soft-delete column already supports it.

---

## Consequences

- Members cannot leave a group on their own in v1. Acceptable for the household use case.
- Recurring rules of removed members are deactivated, not transferred. Owner must manually recreate any they wish to continue.
- This decision must be revisited before Koin is opened to larger groups or public use.
