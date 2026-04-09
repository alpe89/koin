# Koin — Security Considerations

**Status:** Approved
**Date:** 2026-04-05
**Author:** Software Architect

---

## Threat Model (STRIDE Summary)

| Threat | Vector | Mitigation |
|---|---|---|
| Spoofing | Forged JWT | RS256 signature; public key verified on every request |
| Spoofing | Stolen JWT | 7-day expiry; HTTPS only; token in memory/IndexedDB |
| Tampering | Mutating another user's transactions | Role check on every mutating endpoint; ownership check for editor role |
| Tampering | SQL injection | Parameterized queries only; no string interpolation |
| Repudiation | Disputed transaction attribution | `created_by` + `created_by_name` immutable after insert |
| Information Disclosure | Accessing another group's data | Group membership verified on every group-scoped request |
| Information Disclosure | JWT payload exposure | Token passed in URL fragment; never in query string or logs |
| Denial of Service | Flooding transaction inserts | Rate limiting via `@fastify/rate-limit` |
| Elevation of Privilege | Accepting own-generated invite token | Invite accept checks user is not already a member; owner role not grantable via invitation |

---

## Authentication Security

### Google OAuth
- State parameter (CSRF token) validated on callback. A random nonce is generated per auth initiation, stored in a short-lived `HttpOnly Secure SameSite=Strict` cookie (`Path=/api/v1/auth`, `Max-Age=600`), and verified on callback. Mismatch returns `400`.
- Only `https://` redirect URIs are registered in Google Cloud Console.
- `google_sub` is the trust anchor — not email. Email changes in Google do not create a new Koin account.

### JWT
- RS256 (asymmetric). Private key never leaves the server environment.
- JWT payload contains no sensitive data (no passwords, no payment info).
- Token passed in URL fragment (`#token=...`) — not in query string, so it does not appear in server access logs or Referer headers.
- Frontend strips the fragment from the URL immediately after extraction.
- No JWT blocklist in v1. Consequence: a stolen token is valid until expiry (7 days). Acceptable risk for a household app with no financial settlement features. A blocklist can be added post-MVP if needed (requires a DB table — Redis not available per constraints).

### HTTPS
- All traffic over HTTPS. HTTP requests are redirected to HTTPS at the hosting layer.
- Cookies (OAuth state nonce): `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/api/v1/auth`, `Max-Age=600`.

---

## Authorization Security

### Group isolation
Every group-scoped endpoint verifies group membership before any data access:
```
1. Verify JWT signature and expiry
2. Extract user.id from JWT sub claim
3. Query group_members WHERE group_id = :gid AND user_id = :uid AND removed_at IS NULL
4. If no row → 403
5. Attach role to request context
```
Steps 1–4 run as a single Fastify `preHandler` hook, applied to all routes under `/api/v1/groups/:groupId/*`.

### Ownership checks on editor-role mutations
For edit/delete endpoints where editors can only touch their own records:
```sql
SELECT id FROM transactions
WHERE id = $1 AND group_id = $2 AND created_by = $3
```
If no row → 403. This runs after the group membership check.

### Invitation tokens
- Token is 32 bytes from `crypto.randomBytes`, base64url encoded — 256 bits of entropy. Brute force is not feasible.
- Single-use: `used_by` and `used_at` set atomically with the `group_members` insert in a single Postgres transaction.
- Expired tokens return 404 (not 410) to avoid leaking token state to unauthenticated callers.
- Owner role is not grantable via invitation — enforced by the Zod schema (`role: z.enum(['editor', 'viewer'])`).

---

## Input Validation

All request inputs are validated with Zod before they reach any business logic or database query.

| Field | Rule |
|---|---|
| `amountCents` | Integer, > 0, ≤ 99,999,999 |
| `date` | Valid ISO date, not more than 1 day in the future |
| `note` | Max 500 chars, plain text (never rendered as HTML) |
| `name` (group) | 1–100 chars, trimmed |
| `dayOfMonth` | Integer 1–28 |
| `role` | Enum: `editor`, `viewer` |
| `type` | Enum: `expense`, `income` |
| UUID params | UUID format validated — invalid UUIDs return 400 before any DB query |

---

## OWASP Top 10 Coverage

| Risk | Status | Notes |
|---|---|---|
| A01 Broken Access Control | Mitigated | Role check on every endpoint; group isolation enforced |
| A02 Cryptographic Failures | Mitigated | RS256 JWT; HTTPS only; no sensitive data in JWT payload |
| A03 Injection | Mitigated | Parameterized queries; Zod input validation |
| A04 Insecure Design | Mitigated | Threat model reviewed; ownership checks explicit |
| A05 Security Misconfiguration | Partial | Secrets via env vars; CORS configured to allowlist only |
| A06 Vulnerable Components | Ongoing | bun audit on CI |
| A07 Auth Failures | Mitigated | Google SSO only; no password storage; state param CSRF |
| A08 Software Integrity Failures | Partial | Lockfile committed; CI verifies lockfile integrity |
| A09 Logging Failures | Partial | Request logging in place; no sensitive fields logged |
| A10 SSRF | N/A | No user-supplied URLs fetched by the server |

---

## CORS Configuration

```
Allowed origins: APP_URL env var only
Allowed methods: GET, POST, PATCH, DELETE, OPTIONS
Allowed headers: Content-Type, Authorization
Credentials: false
```

---

## Rate Limiting

Applied globally via `@fastify/rate-limit`:
- Default: 100 requests per minute per IP.
- Auth endpoints (`/auth/google`, `/auth/google/callback`): 10 requests per minute per IP.
- Transaction creation: 30 requests per minute per user (identified by JWT `sub`).

---

## Data Privacy Notes

- No PII beyond email, display name, and avatar URL (all sourced from Google).
- Avatar URL is a Google-hosted URL — Koin does not store or proxy images.
- GDPR account deletion is out of scope for v1. Must be implemented before any public launch. When implemented: hard delete of user, anonymisation of `created_by_name` on transactions and rules (set to "Deleted User"), revocation of group memberships.
- No analytics, no third-party tracking scripts in v1.
