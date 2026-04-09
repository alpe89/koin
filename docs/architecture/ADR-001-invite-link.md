# ADR-001: Invitation Mechanism — Shareable Link with Single-Use Token

**Status:** Accepted
**Date:** 2026-04-05
**Deciders:** Founder, Software Architect

---

## Context

The PRD requires that a group owner can invite new members. The delivery mechanism was an open question. Two options were evaluated.

---

## Decision

Use a shareable invite link with a cryptographically random single-use token (48-hour expiry). The owner generates the link in-app, then shares it via any channel they choose (messaging app, email, etc.).

---

## Alternatives Considered

**Option A — Shareable invite link (chosen)**
Owner generates a signed token. Link is `/join?token=<token>`. Anyone with the link can join, subject to expiry and single-use enforcement.

**Option B — Email invitation**
Owner enters an email. Koin sends a transactional email via Resend or Postmark. Requires an external service dependency.

---

## Rationale

- Primary use case is a couple or small group of flatmates who already share a direct messaging channel. A shareable link matches their actual workflow.
- Zero external service dependency — aligns with zero-infra-cost constraint.
- 32-byte random token (256-bit entropy) makes brute force infeasible.
- Single-use enforcement and 48-hour expiry bound the attack surface.
- Option B can be added post-MVP as an enhancement without schema changes.

---

## Consequences

- Anyone who obtains the link can join the group (before expiry). Acceptable for a household context where the link is shared directly.
- No delivery guarantee — if the owner sends to the wrong chat, the wrong person could join. Mitigation: owner can see active invitations and revoke (future feature).
- No email service to configure, maintain, or pay for.
