# Koin — Product Requirements Document v1

**Status:** Approved  
**Date:** 2026-04-05  
**Author:** Product Manager (AI)  
**Approved by:** Founder

---

## 1. Overview

Koin is a mobile-first Progressive Web App for collaborative personal finance tracking. The primary use case is a couple (or small group of people) who want to track shared income and expenses, understand their monthly spending by category, and build healthy financial habits together.

The app is built by the founder for his wife — simplicity and reliability beat features every time.

---

## 2. Goals

- Make it trivially easy to log an expense or income on mobile in under 10 seconds.
- Give a household a clear picture of where their money goes each month, by category.
- Support recurring transactions (salary, mortgage, subscriptions) so the monthly baseline is always pre-populated.
- Work as a collaborative tool: multiple people can contribute to a shared group.
- Zero infrastructure cost for MVP.

---

## 3. Users & Roles

### Personas

- **Primary:** A couple managing shared household finances. One person sets up the group; both contribute transactions.
- **Secondary:** Flatmates splitting living costs.

### Group Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full control: manage members, edit/delete any transaction, manage recurring rules, manage categories (post-MVP) |
| **Editor** | Add, edit, and delete own transactions; manage own recurring rules |
| **Viewer** | Read-only: view transactions, dashboard, monthly report |

---

## 4. Authentication

- **Google SSO only** for v1. No email/password, no Apple Sign-In.
- Sessions are persistent (JWT, stateless).
- Users can sign out from any device.

---

## 5. Groups

### Creating & Managing Groups

- Any authenticated user can create one or more spending groups.
- The creator becomes the owner automatically.
- A group can be **private** (solo use) or **collaborative** (multiple members).
- Groups have a name set at creation time.

### Invitations

- The owner invites members by email address.
- Invitation delivery mechanism is TBD (open question — see §11).
- Invited users must have a Koin account (or create one via Google SSO) to join.

### Default / Favourite Group

- Each user can mark one group as their default.
- On login, the default group is shown immediately.
- Other groups are accessible via a navigation menu.

---

## 6. Transactions

### Adding a Transaction

- A **FAB (Floating Action Button)** is the primary entry point — always visible on mobile and desktop.
- The add form captures:
  - **Amount** (required) — EUR only
  - **Type** — Expense or Income
  - **Category** (required) — selected from the group's category list
  - **Date** (required, defaults to today)
  - **Note** (optional) — free text
  - **Recurring** (toggle) — see §7

### Attribution

- Every transaction records who added it.
- Attribution is displayed in the transaction list.

### Edit & Delete

- **Editors** can edit and delete their own transactions.
- **Owners** can edit and delete any transaction in the group.
- **Viewers** cannot modify transactions.

---

## 7. Recurring Transactions

Recurring transactions are a first-class feature — they are the backbone of monthly tracking.

### Creating a Recurring Rule

- The recurring toggle is **inline on the add-transaction form** — not a separate flow.
- When toggled on, the user selects the day of the month the transaction fires (days **1–28** only, to avoid month-length edge cases).
- The rule auto-fires a real transaction record on the selected day each month.
- Attribution on auto-fired transactions goes to the user who created the rule.

### Managing Rules

- A dedicated section lists all active recurring rules for the group.
- Rules can be edited or deleted by the creator (or the group owner).
- Recurring transactions are visually distinguished in the transaction list (e.g., a recurring indicator icon).

**Example use cases:** monthly salary (income, day 27), mortgage payment (expense, day 1), streaming subscriptions (expense, day 15).

---

## 8. Categories

- Koin ships with a **predefined set of categories** for v1.

### Predefined Categories (initial set)

**Expenses:** Housing, Food & Groceries, Transport, Car, Health, Pet, Entertainment, Shopping, Utilities, Education, Travel, Other

**Income:** Salary, Freelance, Investment, Bonus, Other

- Categories are **group-scoped** — each group has its own category list (starting from the predefined set).
- In v1, no custom categories. Post-MVP, group owners will be able to add custom ones.

---

## 9. Dashboard

The dashboard is the home screen after login (showing the default group).

### Headline Metric

**Total spend this month** — the number the user needs to understand at a glance.

### Transaction List

- All transactions for the selected month, grouped by category.
- Month navigation (← previous / next →).
- Each transaction shows: amount, category, date, note (if any), who added it, recurring indicator (if applicable).

### Charts

- **Pie/donut chart** — spending breakdown by category for the selected month.
- **Line chart** — income vs. expenses trend over time (last 6 months).

---

## 10. Monthly Report

An in-app summary view for the selected month, accessible to all group members.

### Contents

- Total income
- Total expenses
- Net balance (income − expenses)
- Category breakdown: each category with total spent and % of total expenses

No export functionality in v1 (no PDF, no CSV).

---

## 11. Open Questions

These must be resolved before the relevant features are built:

1. **Invitation delivery** — How does an invited user receive their invitation? Email (requires an email sending service), in-app notification, or a shareable link?
2. **Group deletion** — Can a group be deleted? What happens to its transaction history?
3. **Voluntary group leaving** — Can a member leave a group? What happens to transactions they added?
4. **Recurring rule ownership transfer** — If the creator of a recurring rule leaves the group, what happens to the rule and its future auto-fired transactions?

---

## 12. Out of Scope for v1

The following are explicitly deferred to post-MVP:

- Savings target / goal tracking
- Custom categories (admin-created)
- Debt / settlement tracking (who owes whom)
- Export (PDF, CSV)
- Apple Sign-In
- Bank sync / open banking
- Multi-currency
- Push notifications
- Group deletion
- Data export / account deletion (GDPR — must be addressed before public launch)

---

## 13. Non-Functional Requirements

- **Mobile-first** — the app must be fully functional and delightful on mobile (iOS Safari, Android Chrome).
- **PWA** — installable on iOS and Android home screens. Requires service worker and web app manifest.
- **Desktop** — fully functional on desktop browsers.
- **Performance** — the add-transaction flow must feel instant on a mid-range mobile device.
- **Zero infra cost** — MVP must run at €0/month infrastructure cost.
- **Currency** — EUR only for v1.
- **Language** — UI language TBD (English assumed for v1).

---

## 14. Success Criteria for MVP

- A couple can sign in with Google, create a shared group, and add transactions within 5 minutes of first visit.
- Recurring transactions auto-fire on the correct day without manual intervention.
- The dashboard correctly reflects all transactions for the current month.
- The app is installable on an iPhone and an Android phone.
- The app runs at €0/month infrastructure cost.
