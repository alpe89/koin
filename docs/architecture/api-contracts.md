# Koin — API Contracts

**Status:** Approved
**Date:** 2026-04-05
**Author:** Software Architect

---

## Conventions

- Base path: `/api/v1`
- All request and response bodies are `application/json`.
- All amounts are in EUR cents (integer). The frontend converts to/from decimal for display.
- All timestamps in responses are ISO 8601 UTC strings.
- All IDs are UUIDs.
- Authentication: `Authorization: Bearer <jwt>` header on every protected endpoint.
- Errors follow a consistent envelope:
  ```json
  {
    "error": {
      "code": "MACHINE_READABLE_CODE",
      "message": "Human readable description"
    }
  }
  ```
- HTTP status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 500 Internal Server Error.

---

## Auth

### `GET /api/v1/auth/google`
Initiates Google OAuth 2.0 flow. Redirects the browser to Google's authorization endpoint.

**Query params:** `redirect_uri` (optional, validated against allowlist)

**Response:** `302 Redirect` to Google

---

### `GET /api/v1/auth/google/callback`
Google redirects here after authorization.

**Query params:** `code`, `state`

**Behavior:**
1. Exchange `code` for Google tokens.
2. Fetch user profile from Google (`sub`, `email`, `name`, `picture`).
3. Upsert user by `google_sub`.
4. **If new user:** create a personal group named `"<first_name>'s Group"`, add user as owner, seed group categories — all in a single DB transaction.
5. Issue a signed RS256 JWT.
6. Redirect to frontend with JWT in URL fragment (`/#token=<jwt>`). Frontend stores in memory / secure storage.

**Response:** `302 Redirect` to frontend

---

### `POST /api/v1/auth/signout`
Protected. Stateless JWT — no server-side session to destroy. This endpoint exists so the client has a clean logout contract. It returns 204 and the client discards the token.

**Response:** `204 No Content`

---

### `GET /api/v1/auth/me`
Protected. Returns the authenticated user's profile.

**Response `200`:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "Jane Smith",
  "avatarUrl": "https://...",
  "defaultGroupId": "uuid | null"
}
```

---

## Users

### `PATCH /api/v1/users/me`
Protected. Update own profile fields.

**Request body:**
```json
{
  "displayName": "string (optional)",
  "defaultGroupId": "uuid | null (optional)"
}
```

**Response `200`:** Updated user object (same shape as `GET /auth/me`).

---

## Groups

### `POST /api/v1/groups`
Protected. Create a new group. Creator becomes owner. Categories are seeded automatically.

**Request body:**
```json
{
  "name": "string (required, 1–100 chars)"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "string",
  "ownerId": "uuid",
  "createdAt": "ISO8601"
}
```

---

### `GET /api/v1/groups`
Protected. List all active groups the authenticated user is a member of (excluding removed memberships).

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "ownerId": "uuid",
    "role": "owner | editor | viewer",
    "memberCount": 2,
    "createdAt": "ISO8601"
  }
]
```

---

### `GET /api/v1/groups/:groupId`
Protected. Get group details. User must be an active member.

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "string",
  "ownerId": "uuid",
  "role": "owner | editor | viewer",
  "createdAt": "ISO8601"
}
```

---

### `PATCH /api/v1/groups/:groupId`
Protected. Owner only. Update group name.

**Request body:**
```json
{
  "name": "string (required)"
}
```

**Response `200`:** Updated group object.

---

## Group Members

### `GET /api/v1/groups/:groupId/members`
Protected. Active members of the group. Any group member can call this.

**Response `200`:**
```json
[
  {
    "userId": "uuid",
    "displayName": "string",
    "avatarUrl": "string | null",
    "role": "owner | editor | viewer",
    "joinedAt": "ISO8601"
  }
]
```

---

### `PATCH /api/v1/groups/:groupId/members/:userId`
Protected. Owner only. Change a member's role.

**Request body:**
```json
{
  "role": "editor | viewer"
}
```

Cannot change the owner's own role via this endpoint. To transfer ownership (post-MVP), a dedicated endpoint is required.

**Response `200`:** Updated member object.

---

### `DELETE /api/v1/groups/:groupId/members/:userId`
Protected. Owner only. Remove a member from the group.

**Behavior:**
1. Set `group_members.removed_at = now()`.
2. Set `is_active = false` on all recurring rules owned by that user in this group.
3. If removed user's `default_group_id` points to this group, set it to `NULL`.

**Response `204 No Content`**

---

## Invitations

### `POST /api/v1/groups/:groupId/invitations`
Protected. Owner only. Generate a single-use invitation token.

**Request body:**
```json
{
  "role": "editor | viewer"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "token": "string",
  "inviteUrl": "https://app.koin.app/join?token=<token>",
  "role": "editor | viewer",
  "expiresAt": "ISO8601"
}
```

---

### `GET /api/v1/invitations/:token`
Public (no auth required). Preview invitation details before accepting.

**Response `200`:**
```json
{
  "groupName": "string",
  "role": "editor | viewer",
  "invitedBy": "string (display name)",
  "expiresAt": "ISO8601"
}
```

**Response `404`:** Token not found, already used, or expired.

---

### `POST /api/v1/invitations/:token/accept`
Protected. Authenticated user accepts the invitation.

**Behavior:**
1. Validate token: exists, unused, not expired.
2. Check user is not already an active member.
3. Insert `group_members` row.
4. Mark token as used (`used_by`, `used_at`).
5. Wrap steps 3–4 in a transaction.

**Response `200`:**
```json
{
  "groupId": "uuid",
  "groupName": "string",
  "role": "editor | viewer"
}
```

**Response `409`:** User is already a member.
**Response `404`:** Token invalid/expired/used.

---

## Categories

### `GET /api/v1/groups/:groupId/categories`
Protected. Any group member. Returns all categories for the group, ordered by type then sort_order.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "type": "expense | income",
    "sortOrder": 0
  }
]
```

---

## Transactions

### `GET /api/v1/groups/:groupId/transactions`
Protected. Any group member. Returns transactions for the group filtered by month.

**Query params:**
- `year` (integer, required)
- `month` (integer 1–12, required)

**Response `200`:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "categoryId": "uuid",
      "categoryName": "string",
      "createdBy": "uuid",
      "createdByName": "string",
      "amountCents": 1250,
      "type": "expense | income",
      "date": "YYYY-MM-DD",
      "note": "string | null",
      "isRecurringFired": false,
      "recurringRuleId": "uuid | null",
      "createdAt": "ISO8601"
    }
  ],
  "summary": {
    "totalExpenseCents": 0,
    "totalIncomeCents": 0,
    "netCents": 0
  }
}
```

---

### `POST /api/v1/groups/:groupId/transactions`
Protected. Editor or owner only.

**Request body:**
```json
{
  "categoryId": "uuid (required)",
  "amountCents": 1250,
  "type": "expense | income",
  "date": "YYYY-MM-DD",
  "note": "string | null",
  "recurringRule": {
    "enabled": false,
    "dayOfMonth": 1
  }
}
```

**Behavior when `recurringRule.enabled = true`:**
1. Insert into `recurring_rules` with `last_fired_at = date` (prevents the scheduler from double-firing in the same month).
2. Insert the transaction itself with `is_recurring_fired = false` (this is a manual/initial entry, not an auto-fire).
3. Link the transaction to the new rule via `recurring_rule_id`.

**Response `201`:** Created transaction object (same shape as list item above) plus `recurringRuleId` if a rule was created.

---

### `PATCH /api/v1/groups/:groupId/transactions/:transactionId`
Protected. Owner can edit any. Editor can edit only their own.

**Request body:** Any subset of `categoryId`, `amountCents`, `type`, `date`, `note`.

Recurring rule fields are not editable via this endpoint. To change a recurring rule, use the recurring rules endpoints.

**Response `200`:** Updated transaction object.

---

### `DELETE /api/v1/groups/:groupId/transactions/:transactionId`
Protected. Owner can delete any. Editor can delete only their own.

**Response `204 No Content`**

---

## Recurring Rules

### `GET /api/v1/groups/:groupId/recurring-rules`
Protected. Any group member. Returns all recurring rules for the group.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "categoryId": "uuid",
    "categoryName": "string",
    "createdBy": "uuid",
    "createdByName": "string",
    "amountCents": 150000,
    "type": "expense | income",
    "dayOfMonth": 1,
    "note": "string | null",
    "isActive": true,
    "lastFiredAt": "YYYY-MM-DD | null",
    "createdAt": "ISO8601"
  }
]
```

---

### `PATCH /api/v1/groups/:groupId/recurring-rules/:ruleId`
Protected. Owner can edit any. Editor can edit only their own active rules.

**Request body:** Any subset of `categoryId`, `amountCents`, `type`, `dayOfMonth`, `note`, `isActive`.

**Response `200`:** Updated rule object.

---

### `DELETE /api/v1/groups/:groupId/recurring-rules/:ruleId`
Protected. Owner can delete any. Editor can delete only their own.

Deletes the rule. Historical transactions linked to this rule have `recurring_rule_id` set to NULL (via `ON DELETE SET NULL`).

**Response `204 No Content`**

---

## Dashboard & Reports

### `GET /api/v1/groups/:groupId/dashboard`
Protected. Any group member.

**Query params:**
- `year` (integer, required)
- `month` (integer 1–12, required)

**Response `200`:**
```json
{
  "period": { "year": 2026, "month": 4 },
  "totalExpenseCents": 320000,
  "totalIncomeCents": 500000,
  "netCents": 180000,
  "categoryBreakdown": [
    {
      "categoryId": "uuid",
      "categoryName": "string",
      "type": "expense | income",
      "totalCents": 80000,
      "percentageOfType": 25.0
    }
  ],
  "trend": [
    {
      "year": 2026,
      "month": 1,
      "totalExpenseCents": 310000,
      "totalIncomeCents": 490000
    }
  ]
}
```

- `categoryBreakdown` — current month only.
- `trend` — last 6 months including the requested month, ordered chronologically.

---

### `GET /api/v1/groups/:groupId/reports/monthly`
Protected. Any group member.

**Query params:**
- `year` (integer, required)
- `month` (integer 1–12, required)

**Response `200`:**
```json
{
  "period": { "year": 2026, "month": 4 },
  "totalIncomeCents": 500000,
  "totalExpenseCents": 320000,
  "netCents": 180000,
  "categoryBreakdown": [
    {
      "categoryId": "uuid",
      "categoryName": "string",
      "type": "expense | income",
      "totalCents": 80000,
      "percentageOfType": 25.0
    }
  ]
}
```

---

## Validation Rules (Zod, applied on every mutating endpoint)

| Field         | Rule                                                                          |
|---------------|-------------------------------------------------------------------------------|
| `amountCents` | Integer, > 0, ≤ 99_999_999 (≈ €1M ceiling)                                   |
| `date`        | ISO date string `YYYY-MM-DD`, not more than 1 day in the future (clock skew) |
| `note`        | Max 500 chars                                                                 |
| `name` (group)| 1–100 chars, trimmed                                                          |
| `dayOfMonth`  | Integer 1–28                                                                  |
| `role`        | Enum: `editor`, `viewer` (owner not assignable via invitation)                |
| `type`        | Enum: `expense`, `income`                                                     |
