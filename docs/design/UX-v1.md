# Koin — UX Design Document v1

**Status:** Final (all open questions resolved)
**Date:** 2026-04-05
**Author:** UX Design Reviewer
**Based on:** PRD v1 (approved 2026-04-05), Stitch design exploration (https://stitch.withgoogle.com/projects/10845020093989134005)

---

## 1. Purpose

This document is the authoritative UX reference for the Koin v1 frontend implementation. It translates the approved PRD into concrete layout decisions, interaction patterns, component specifications, and accessibility requirements. The Stitch exploration screens are treated as visual inspiration — the palette, typography, and surface language are carried forward; the specific layouts and navigation model are reinterpreted for mobile-first use.

The frontend engineer should use this document to make implementation decisions. All open design questions have been resolved and are documented in §8.

---

## 2. Visual Direction

### 2.1 Colour Palette

The Solar Hearth palette from the Stitch exploration is adopted with one correction: the Stitch screens used desktop-skewed density and relatively muted primary colours. For a mobile PWA the primary accent must read clearly at small sizes and in bright outdoor light.

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#FDD73B` | FAB background, active nav indicator, primary CTA fill |
| `--color-primary-on` | `#705D00` | Text/icons placed on `--color-primary` surface (olive-gold; passes AA contrast on yellow) |
| `--color-secondary` | `#a23f00` | Destructive actions, expense amount colour |
| `--color-secondary-container` | `#fc7127` | Recurring rule badge, category chip selected state |
| `--color-income` | `#2e7d32` | Income amount colour (green; not in Stitch exploration — added for transaction polarity clarity) |
| `--color-surface` | `#f4fafd` | Page background, card background |
| `--color-surface-container` | `#e8eff1` | Elevated card, bottom sheet background |
| `--color-on-surface` | `#161d1f` | Primary body text |
| `--color-on-surface-muted` | `#4a5568` | Secondary/meta text (date, who-added, note) |
| `--color-outline` | `#7e7761` | Input borders, dividers |
| `--color-outline-variant` | `#d0c6ad` | Subtle dividers, placeholder text |
| `--color-error` | `#ba1a1a` | Form validation errors |
| `--color-error-container` | `#ffdad6` | Inline error background |

**What to keep from Stitch:** The warm off-white background (#f4fafd), the olive-on-yellow primary pairing, and the tertiary taupe (#6b5c48) for supplementary text/icons. These create a cohesive, non-clinical financial aesthetic that feels personal rather than bank-like.

**What to reconsider:** The Stitch exploration used the primary yellow (#FDD73B) only as a container colour and presented the darker olive (#705d00) as the main interactive colour. On mobile, inverting this — using the bright yellow as the FAB and key accent — gives better affordance at thumb distance. The olive becomes the on-primary text token, not the button fill.

**Teal and cyan are explicitly banned.** Do not introduce any blue-green tones. They conflict with the warm Solar Hearth identity.

### 2.2 Typography

**Font family:** Plus Jakarta Sans (variable font via Google Fonts). Single family across all weights.

| Scale | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| `--text-display` | 2rem (32px) | 700 | 1.2 | Hero metric (total spend this month) |
| `--text-headline-l` | 1.5rem (24px) | 700 | 1.3 | Screen titles |
| `--text-headline-m` | 1.25rem (20px) | 600 | 1.3 | Section headings, modal titles |
| `--text-body-l` | 1rem (16px) | 400 | 1.5 | Primary body, transaction amounts |
| `--text-body-m` | 0.875rem (14px) | 400 | 1.5 | Meta text, labels, notes |
| `--text-label` | 0.75rem (12px) | 500 | 1.4 | Navigation labels, category chips, badges |

Minimum rendered body text is 14px. Never go below 12px for anything interactive.

### 2.3 Tone

The app is built for a couple, not a corporation. Copy should be:
- Short and direct — no financial jargon
- Personal but not condescending
- Affirmative on success ("Saved!"), calm on empty states ("Nothing here yet")

CTA labels use verbs: "Save transaction", "Join group", "Sign in with Google". No "Submit", no "OK".

### 2.4 Shape & Elevation

| Token | Value | Usage |
|---|---|---|
| `--radius-full` | 9999px | FAB, primary CTAs, chips, badges |
| `--radius-card` | 1rem (16px) | Cards, bottom sheets, modals |
| `--radius-input` | 0.75rem (12px) | Text inputs, selects |
| `--radius-sm` | 0.5rem (8px) | Inner components, icon buttons |

Elevation is expressed through background colour shift, not drop shadows. Cards use `--color-surface-container`; modals/sheets use a white (#ffffff) inner surface. One exception: the FAB uses a soft shadow (`0 4px 16px rgba(22, 29, 31, 0.14)`) to lift it above content on scroll.

---

## 3. Layout and Navigation Model

### 3.1 Mobile-First Constraints

The Stitch designs are 1280px wide desktop layouts with a sidebar navigation rail. This must be entirely reinterpreted for 390px viewport (iPhone 15 reference width). Key principles:

- **Touch target minimum:** 44x44px on all interactive elements (WCAG 2.5.5). Navigation items, form controls, and icon buttons must meet this minimum even when visually smaller.
- **Thumb-zone priority:** Primary actions (FAB, bottom nav) live in the bottom 25% of the screen. Secondary actions live in the header. Destructive actions are never in the thumb-zone without a confirmation step.
- **No horizontal scrolling** on any screen at 320px–430px viewport width.

### 3.2 Navigation Structure

**Bottom navigation bar** (mobile) / **Left sidebar** (desktop, min-width: 1024px).

The app has four top-level destinations:

| Tab | Icon | Label | Route |
|---|---|---|---|
| Dashboard | `home` (Material) | Home | `/` |
| Transactions | `receipt_long` | Transactions | `/transactions` |
| Report | `bar_chart` | Report | `/report` |
| Group | `group` | Group | `/group` |

The bottom nav is a fixed bar pinned to the bottom of the viewport (above iOS safe-area inset). Height: 56px + bottom safe area. Each item: 44px touch target centred in its column. Active state: `--color-primary` indicator pill above the icon, label in `--color-primary-on`.

The FAB sits above the bottom nav, anchored to the bottom-right, offset `24px right / 80px bottom` (above the nav bar). It is visible on the Dashboard and Transactions screens only. It is **not rendered** on the Report and Group screens. It is **not rendered** for Viewer-role users on any screen.

**Group switching** is accessed via a group name header in the top bar of the Dashboard. Tapping it opens a bottom sheet listing all the user's groups plus a "Create new group" row. This is the only way to switch groups — there is no group selector in the bottom nav.

### 3.3 Page Structure Template

Every screen follows this shell:

```
[Status bar — handled by OS]
[Top app bar — 56px]
  [Leading: back chevron or menu icon]
  [Title: screen or group name]
  [Trailing: contextual action (e.g., avatar, month nav)]
[Content area — flex-grow, scrollable]
[Bottom nav bar — 56px + safe area]
[FAB — absolutely positioned above nav, conditional on screen and role]
```

The top app bar is not sticky on content-heavy screens (Transaction list, Report). It scrolls with the content and reappears on scroll-up (standard Android/iOS behaviour). Exception: the Dashboard top bar is sticky because the group switcher must always be reachable.

### 3.4 First-Time User Flow

Every user always belongs to a group. On first login, a personal group is **automatically created** for the user — no onboarding wizard, no separate group creation step. The user lands directly on the Dashboard of their auto-created group.

The auto-created group is named after the user (e.g., "Alex's Group") and can be renamed from the Group screen. Its empty-state dashboard prompts the user to either add their first transaction (via FAB) or invite someone (via the Group screen).

There is no "no group" state in the application. The "create group" flow exists for users who want additional groups — it is not part of the first-time experience.

---

## 4. Key Screens and Flows

### 4.1 Login / Authentication

**Route:** `/login` — only visible when unauthenticated. Authenticated users are redirected to `/`.

**What the user sees:**
- App logo and wordmark centred in the upper third
- Tagline (one line, max): something like "Track together, spend smarter"
- A single, full-width primary CTA: "Sign in with Google"
- Subtle footer: "By continuing you agree to our Terms and Privacy Policy" — 12px muted text

**Visual style:**
- Full-page background in `--color-surface` (the warm off-white)
- Logo: Koin wordmark — the Stitch exploration used a sun/warm icon; a coin or subtle glyph works
- Google button: follows Google's official brand guidelines (white pill button with Google logo, dark text). Do not use `--color-primary` fill on the Google button — that violates Google's SSO branding requirements.
- No email/password fields. No "forgot password". No other auth options.

**Primary CTA:** "Sign in with Google" — full-width, pill shape, Google-branded.

**Accessibility notes:**
- The Google button must carry `aria-label="Sign in with Google"` if the button text alone is insufficient for screen readers (e.g. if only a logo is shown)
- Ensure focus lands on the Google button on page load (no autofocus trap issues)

**Mobile consideration:** The login screen is a one-tap interaction on mobile — the Google OAuth sheet slides up natively. There is no keyboard input. Keep the screen visually uncluttered.

---

### 4.2 Dashboard

**Route:** `/` — home screen after login, showing the default group.

**What the user sees (top to bottom):**

1. **Top app bar** — group name (tappable, opens group switcher sheet), user avatar (tappable, opens profile/sign-out sheet)
2. **Month navigator** — inline pattern: `<` / `Month Year` / `>` centred in the top bar trailing area. The current month is the default. Future months are disabled (`aria-disabled="true"`). Navigating to a different month updates all data below.
3. **Headline metric card** — large display text showing total spend this month. Secondary line: income total. Card background: `--color-surface-container`. Full-bleed card that spans edge-to-edge with 16px horizontal margin.
4. **Pie/donut chart** — spending breakdown by category. Chart.js donut. 240px diameter on mobile. The donut centre displays the total spend figure (same value as the headline metric, repeated for at-a-glance reading while the chart is visible). Category legend below the chart: coloured dot + category name + amount + percentage. Tapping a segment highlights it and scrolls the legend to that category. **Empty state:** render a placeholder ring (grey outline, no segments) with the text "No expenses yet" centred in the donut. Do not render an empty Chart.js canvas.
5. **Line chart** — income vs. expenses over the last 6 months. Chart.js line. Full-width. Two lines: income (green, `--color-income`) and expenses (orange/secondary). X-axis: abbreviated month names. Y-axis: EUR amounts. **Empty state:** render a flat zero-line placeholder with the label "No data yet" — do not render an empty Chart.js canvas.
6. **Transaction list** — grouped by category, sorted by most-spent category first. Each category group has a header row (category name + total). Within each group, transactions are listed newest-first. Each transaction row: category icon (24px) + description/note (truncated to 1 line) + who added it (first name + avatar, 12px muted) + date + amount (right-aligned, coloured by type, explicit `+`/`−` sign).

**FAB:** Rendered for Owner and Editor only, bottom-right. `+` icon. Tapping opens the Add Transaction bottom sheet. Not rendered for Viewer-role users.

**Empty state (no transactions this month):** Replace the metric card, charts, and list with a single centred illustration and short message: "No transactions yet this month. Tap + to add your first one." The FAB should pulse subtly (single animation cycle, respects `prefers-reduced-motion`) to draw attention.

**Primary CTA:** FAB.

**Interaction notes:**
- Month navigation arrows must have a 44px touch target even if visually smaller chevrons
- Transaction rows are tappable — tapping a row opens a transaction detail sheet (view/edit/delete depending on role)
- Pie chart segments are tappable for legend focus only — not navigation targets

---

### 4.3 Add Transaction

**Trigger:** FAB tap from Dashboard or Transactions screen. Opens as a **bottom sheet modal** that slides up from the bottom edge.

**Sheet height:** Full-screen minus 48px top (leaves a visible backdrop strip, follows iOS modal convention). On desktop: centred modal, max-width 480px.

**What the user sees (top to bottom inside the sheet):**

1. **Sheet handle** — 4x32px pill centred at the top, `--color-outline-variant`
2. **Modal title** — "Add transaction" left-aligned, `--text-headline-m`
3. **Type toggle** — Two-option segmented control: "Expense" / "Income". Full-width. Default: Expense. Toggling changes the amount field's colour cue (expense: `--color-secondary`; income: `--color-income`).
4. **Amount field** — Large currency input. Currency symbol (€) as a leading inline prefix. Numeric keyboard triggered on mobile (`inputmode="decimal"`). Font size: `--text-display` (32px). This is the most important field — it must be visually dominant. Auto-focused when sheet opens.
5. **Category selector** — Horizontal wrapping grid of pill chips (icon + label). 12 expense categories / 5 income categories (switches with type toggle). Each chip: 44px min-height, `--radius-full`. Selected chip: `--color-secondary-container` background, `--color-on-surface` text.
6. **Date field** — Defaults to today. Tapping opens the native date picker (`<input type="date">`). Display format: "Mon, 5 Apr 2026" — human-readable, not ISO.
7. **Note field** — Optional text input. Placeholder: "Add a note (optional)". Single line, expands to 3 lines on focus. `inputmode="text"`.
8. **Recurring toggle** — Row with calendar-repeat icon + label "Make recurring" + a toggle switch (right-aligned). Default: off. When toggled on, a `--color-surface-container` card slides in below with a day-of-month picker (1–28, horizontal scroll of numbered chips).
9. **Save button** — Full-width, pill, `--color-primary` fill, "Save transaction" label. Disabled until Amount and Category are filled.
10. **Cancel link** — Below the save button: text-only "Cancel" link, centred, `--color-on-surface-muted`. No secondary button — text link keeps the visual hierarchy clear.

**Saving behaviour:**
- On successful save: sheet dismisses, a brief toast appears at the top of the screen ("Transaction saved"), and the dashboard data refreshes. Haptic feedback on mobile if available (via Vibration API).
- On error: inline error state on the affected field; sheet stays open.

**The under-10-second target:** Auto-focus on amount. Date defaults to today. For a simple expense: amount + category = 2 interactions. That is achievable in under 10 seconds.

**Role restriction:** Viewer role users do not see the FAB. The FAB is **not rendered** — not disabled, not hidden with CSS, simply absent from the DOM.

---

### 4.4 Transactions List

**Route:** `/transactions`

**What the user sees:**

1. **Top app bar** — "Transactions" title, month navigator (inline `<` / Month / `>`), "Recurring" chip link (right of title, navigates to `/transactions/recurring`), search icon (top-right)
2. **Transaction rows** — flat chronological list, newest first, grouped by date ("Today", "Yesterday", "Mon 4 Apr"). Each row: category icon (32px, coloured dot background) + merchant/description + category label + who added it (first name + avatar) + time/date + amount (right-aligned, type-coloured, explicit `+`/`−` sign). Recurring indicator icon (`event_repeat`, 16px) on the left of the row if applicable.
3. **List footer** — "End of month" when all transactions are loaded. No pagination — a single month of data is not large enough to require it.

**FAB:** Same as Dashboard — rendered for Owner/Editor only, opens Add Transaction sheet.

**Search:** Tapping the search icon in the top bar expands an inline search input that filters the visible list in real time. Filters by description/note text only. Esc / X closes and clears.

**Empty state:** "No transactions in [Month Year]" with a simple illustration and the prompt to use the FAB.

**Transaction detail:** Tapping a row opens a bottom sheet showing the full transaction data (all fields). Sheet has an edit button (if role permits) and a delete button (if role permits). Delete triggers a confirmation dialog ("Delete this transaction? This cannot be undone.") before executing. Swipe-to-reveal row actions are explicitly **not used** — they are a discoverability trap on mobile.

---

### 4.5 Recurring Rules

**Route:** `/transactions/recurring` — accessible via the "Recurring" chip link in the Transactions screen header.

**What the user sees:**

1. **List of active recurring rules** — each rule card shows: category icon + description + amount + type (badge: "Expense"/"Income") + day of month fires + who created it + created date. Edit and delete actions available to creator and owner.
2. **Empty state:** "No recurring transactions set up. Add one by tapping + and toggling 'Make recurring'."

**No separate create flow.** Recurring rules are only created via the Add Transaction bottom sheet. This is a PRD constraint.

**Delete confirmation:** "This rule will stop generating new transactions. Past auto-fired transactions will not be deleted." — two-line confirmation body, not just a generic "Are you sure?".

---

### 4.6 Monthly Report

**Route:** `/report`

**What the user sees:**

1. **Top app bar** — "Monthly Report" title, month navigator
2. **Summary card** — three-column row: Total Income / Total Expenses / Net Balance. Net balance is colour-coded: green if positive, `--color-secondary` (orange-red) if negative.
3. **Category breakdown** — list of categories with transactions in the selected month, sorted by total spent (descending). Each row: category icon + name + total amount + percentage of total expenses (shown as a thin progress bar below the amount row). Income categories shown separately in their own section below expenses.
4. **No export button.** This is explicitly out of scope for v1.

**FAB:** Not rendered on the Report screen. The report is read-only.

---

### 4.7 Group Management

**Route:** `/group`

**What the user sees:**

1. **Top app bar** — Group name, settings icon (owner only, opens group settings sheet)
2. **Members list** — each member: avatar + first name + role badge (Owner / Editor / Viewer). Edit role button (owner only). Remove member button (owner only, shows confirmation).
3. **Invite section** — only visible to owner. "Invite someone" heading. "Copy invite link" button — tapping generates a single-use link (48h expiry, per ADR-001) and copies it to the clipboard, with a brief toast: "Invite link copied — share it with whoever you want to invite." No email input field. The invitee receives the role of Editor by default; the owner can choose Viewer from a role selector before copying.
4. **Group settings sheet** (owner only): Group name edit field, save button. In v1, no group deletion (out of scope).

**Role badge colours:**
- Owner: `--color-primary-on` on `--color-primary` background
- Editor: `--color-surface-container` background, `--color-on-surface` text
- Viewer: `--color-outline-variant` background, muted text

**Empty state (solo group with no other members):** "Just you here. Copy an invite link to add someone."

---

## 5. Component Patterns

### 5.1 FAB

- Size: 56x56px (Material Design standard for mobile FAB)
- Shape: `--radius-full` (circular)
- Background: `--color-primary` (#FDD73B)
- Icon: `add` (Material Symbols, 24px), colour `--color-primary-on` (#705d00)
- Position: fixed, `bottom: calc(72px + env(safe-area-inset-bottom))`, `right: 24px`
- Shadow: `0 4px 16px rgba(22, 29, 31, 0.14)`
- **Not rendered on:** Report screen, Group screen, Login screen
- **Not rendered for:** Viewer-role users on any screen (conditionally absent from DOM, not CSS-hidden)

**ARIA:** `<button aria-label="Add transaction">`. Do not use `role="button"` on a non-button element.

### 5.2 Bottom Navigation

- Height: 56px + `env(safe-area-inset-bottom)`
- Background: `--color-surface-container`
- Top border: 1px `--color-outline-variant`
- Each item: icon (24px) + label (`--text-label`, 12px). Active: indicator pill (32x4px, `--color-primary`, radius-full) above the icon.
- Touch target: 44px minimum height per item, full column width

**ARIA:** `<nav aria-label="Main navigation">` wrapping a `<ul>` of `<li>` items. Active item has `aria-current="page"`.

### 5.3 Bottom Sheet / Modal

- Slides up from bottom on mobile; centred overlay on desktop (min-width 1024px)
- Background: `#ffffff` (white inner surface, slightly lifted from `--color-surface`)
- Border-radius: `--radius-card` on top two corners, 0 on bottom corners (mobile) / `--radius-card` all corners (desktop modal)
- Backdrop: `rgba(22, 29, 31, 0.48)` semi-transparent overlay behind the sheet
- Focus trap: Tab and Shift+Tab must cycle within the sheet while open. Focus returns to the triggering element (FAB) on close.
- Dismiss: swipe down on the handle (mobile), click backdrop, or Escape key

**ARIA:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the modal title. The first focusable element inside receives focus on open.

### 5.4 Cards

- Background: `--color-surface-container`
- Border-radius: `--radius-card`
- Padding: 16px
- No explicit border (elevation via background colour contrast)
- Horizontal margin: 16px from screen edge

### 5.5 Category Chips

- Height: 40px (minimum)
- Padding: 0 12px
- Border-radius: `--radius-full`
- Default: `--color-surface-container` background, `--color-on-surface` text
- Selected: `--color-secondary-container` background, `--color-on-surface` text
- Icon: 20px Material Symbol, left of label, 8px gap
- Wrapping grid (not horizontal scroll) — ensures all categories are visible without hidden overflow

### 5.6 Transaction Row

```
[Category icon dot: 40x40px, rounded, category colour bg]
  [Icon: 20px Material Symbol, white]
[Content column: flex-grow]
  [Description: --text-body-l, truncate 1 line]
  [Meta: --text-body-m muted — category label · recurring icon if applicable]
  [Attribution: --text-label muted — avatar (24px) + first name · date]
[Amount column: right-aligned]
  [Amount: --text-body-l, weight 600, type-coloured, explicit + or − prefix]
```

Row height: minimum 64px. Touch target: full row width.

### 5.7 User Avatar

The `.avatar` component is used throughout the app: in the top app bar, transaction rows, member lists, and group member cards.

| Size token | px | Usage |
|---|---|---|
| `--avatar-xs` | 24px | Transaction row attribution |
| `--avatar-sm` | 32px | Member list secondary |
| `--avatar-md` | 40px | Top app bar, member list primary |
| `--avatar-lg` | 56px | Profile sheet |

**Source:** Google SSO profile photo URL, loaded as an `<img>` with `loading="lazy"`.

**Fallback (initials):** When no avatar URL is available or the image fails to load, render a circle with the user's initials (max 2 characters — first letter of first name + first letter of last name if present). Background colour is determined deterministically from the display name string (hash → index into a fixed palette of 8 warm accessible colours). Text colour is always `#ffffff` or `#161d1f` depending on which passes AA contrast against the background.

**ARIA:** `<img alt="[Display name]'s avatar">` when a photo is present. When showing initials, use `aria-label="[Display name]'s avatar"` on the container.

### 5.8 Charts

**Pie/Donut (Chart.js):**
- Outer radius fills a 240px container on mobile
- Donut cutout: 65%
- Centre content: total spend figure for the selected month, rendered as a plugin overlay (not a Chart.js label — use a centred absolutely-positioned element within the chart container)
- Segment colours: assign from a fixed palette of 12 warm, accessible colours (ensure 3:1 contrast against `--color-surface` for WCAG 1.4.11 non-text contrast)
- Legend: below chart, 2-column grid at 360px+, 1-column below
- **Empty state:** render a placeholder grey ring (CSS, no Chart.js canvas) with "No expenses yet" centred inside. Do not instantiate Chart.js when there is no data.

**Line Chart (Chart.js):**
- Full-width, 200px height on mobile
- Two datasets: Income (green #2e7d32, 2px line), Expenses (orange #fc7127, 2px line)
- Points: 4px radius, filled
- Grid lines: `--color-outline-variant`, 1px
- Axis labels: `--text-label`, `--color-on-surface-muted`
- Tooltip: custom styled using Chart.js tooltip callbacks — `--color-surface-container` background, `--radius-sm`, matches app typography
- **Empty state:** render a flat baseline placeholder (CSS) with "No data yet" label. Do not instantiate Chart.js when there is no data.

### 5.9 Month Navigator

The inline month navigator appears in the top app bar trailing area on Dashboard, Transactions, and Report screens.

```
[← chevron button] [Month YYYY] [→ chevron button]
```

- Each chevron: 44px touch target, `aria-label="Previous month"` / `aria-label="Next month"`
- Month label: `--text-body-l`, weight 600
- Future months: `→` chevron has `aria-disabled="true"` and `pointer-events: none`. Do not navigate to future months.
- The current month label is announced to screen readers when it changes via `aria-live="polite"` on the label element.

---

## 6. Accessibility Notes

### 6.1 Colour Contrast

All text must meet WCAG 2.2 SC 1.4.3 (AA: 4.5:1 for normal text, 3:1 for large text / UI components).

Key pairs to verify in implementation:

| Foreground | Background | Usage | Notes |
|---|---|---|---|
| `#705d00` on `#FDD73B` | FAB icon, primary CTA | min 4.5:1 | Verify — olive on yellow is borderline; must be tested |
| `#161d1f` on `#f4fafd` | Body text on surface | ~17:1 | Passes easily |
| `#161d1f` on `#e8eff1` | Text on card | ~15:1 | Passes easily |
| `#4a5568` on `#f4fafd` | Muted meta text | ~7:1 | Passes AA |
| `#ffffff` on `#a23f00` | Secondary text/icons | ~5.5:1 | Passes AA |
| `#ffffff` on `#2e7d32` | Income colour | ~5.1:1 | Passes AA |
| `#ba1a1a` on `#f4fafd` | Error text | ~5.9:1 | Passes AA |

The olive-on-yellow FAB combination (#705d00 on #FDD73B) must be tested with a contrast checker before shipping. If it fails 4.5:1, the icon switches to `#161d1f` (near-black) which will pass against any yellow.

### 6.2 Touch Targets

All interactive elements: minimum 44x44px tap target (WCAG 2.5.5). Key elements to audit:
- Month navigation chevrons
- Category chips (40px visual, 44px touch)
- Bottom nav items
- Transaction row actions (edit, delete icons in the detail sheet)
- Role management buttons in Group screen

### 6.3 Focus Management

- Focus trap in bottom sheets and modals
- Focus returns to the trigger element (FAB) when a sheet is dismissed
- Skip-to-content link as the first focusable element on every page (visually hidden, visible on focus)
- Visible focus ring on all interactive elements — use `focus-visible` to show rings only for keyboard navigation

### 6.4 Screen Reader Considerations

- The pie chart must have an accessible text alternative: visually hidden `aria-describedby` text listing the category breakdown data. Chart.js does not generate accessible markup by default — requires manual augmentation.
- The line chart requires `aria-describedby` summarising the trend (e.g., "Income has exceeded expenses for 4 of the past 6 months").
- Transaction amounts must not rely on colour alone to convey polarity — explicit `+`/`−` prefix is required (WCAG 1.4.1).
- Role badges (Owner/Editor/Viewer) must be in accessible text — icon-only badges are not sufficient.
- Bottom sheet open/close state must be announced via `aria-modal` and focus management.

### 6.5 Motion

All animations must be disabled or reduced when `prefers-reduced-motion: reduce` is set:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6.6 Forms

- Every input must have a visible `<label>` or `aria-label`. Placeholder text is not a substitute for a label.
- Error messages must be associated with their input using `aria-describedby` and announced via `role="alert"` or `aria-live="assertive"`.
- The recurring day-of-month picker must be keyboard navigable.
- The type toggle (Expense/Income) must use `role="group"` with `aria-label`, and each option must be a proper radio input or a button with `aria-pressed`.

---

## 7. Design System Conventions (for CSS Modules + BEM)

BEM block names for key components:

| Component | BEM Block |
|---|---|
| Bottom navigation | `.bottom-nav` |
| Bottom sheet | `.bottom-sheet` |
| FAB | `.fab` |
| Transaction row | `.transaction-row` |
| Category chip | `.category-chip` |
| Month navigator | `.month-nav` |
| Metric card | `.metric-card` |
| Chart container | `.chart` |
| Role badge | `.role-badge` |
| Toast notification | `.toast` |
| User avatar | `.avatar` |

CSS custom properties (tokens) are defined globally on `:root` in a `tokens.css` file imported before all component stylesheets. Component modules import tokens by reference — they do not redefine colours inline.

---

## 8. Resolved Design Decisions

All open questions have been answered. This table is the record.

| # | Question | Decision |
|---|---|---|
| 1 | **Invitation delivery** | Shareable link only (no email). Owner taps "Copy invite link", shares via any channel. Per ADR-001. |
| 2 | **Viewer role FAB** | FAB is not rendered (absent from DOM) for Viewer-role users. Not disabled — simply not present. |
| 3 | **Edit/delete entry point** | Tap row → detail bottom sheet with edit/delete buttons. Swipe-to-reveal explicitly ruled out. |
| 4 | **First-time user / empty group state** | Personal group auto-created on first login. User lands on empty Dashboard immediately. No onboarding wizard. |
| 5 | **Recurring rules entry point** | "Recurring" chip link in the Transactions screen top bar. Not a top-level nav destination. |
| 6 | **Transaction row attribution** | First name + avatar (24px). Fallback: initials circle with deterministically assigned colour. |
| 7 | **Donut chart centre content** | Total spend figure rendered as an overlay in the donut centre. |
| 8 | **Offline support** | Post-MVP. Not in v1. Service worker caches app shell only; API calls require network. |

---

## 9. What Is Explicitly Out of Scope

The following are out of scope for v1 and must not appear anywhere in the UI — not as disabled states, not as "coming soon" placeholders:

- Savings targets / goals
- Custom categories
- Debt / settlement tracking
- Export (PDF, CSV)
- Push notification permission prompts
- Bank sync
- Multi-currency
- Group deletion
- Offline transaction entry (post-MVP)

If any of these surfaces appear as a disabled menu item or placeholder card, remove them. Placeholder UI for out-of-scope features creates confusion and false expectations.

---

## Appendix A: Screen Inventory

| Screen | Route | FAB visible | Nav destination | Status |
|---|---|---|---|---|
| Login | `/login` | No | No | Defined |
| Dashboard | `/` | Owner/Editor only | Yes (Home) | Defined |
| Transactions List | `/transactions` | Owner/Editor only | Yes (Transactions) | Defined |
| Add Transaction | Modal (no route) | — | — | Defined |
| Recurring Rules | `/transactions/recurring` | No | No (linked from Transactions) | Defined |
| Monthly Report | `/report` | No | Yes (Report) | Defined |
| Group Management | `/group` | No | Yes (Group) | Defined |
| Group Switcher | Bottom sheet (no route) | — | — | Defined |

## Appendix B: Stitch Screen Reference

The following Stitch screens were reviewed as source material. They are not binding specs — they are the visual palette and layout inspiration.

| Stitch Screen Title | Key takeaways |
|---|---|
| Login (Final) | Solar Hearth palette confirmed; single-CTA login pattern; warm illustration aesthetic |
| Dashboard (Final) | Metric cards, chart placement, transaction list grouping; translated from desktop rail nav to mobile bottom nav |
| Add Transaction (Refined Input) | Category chip grid, amount input dominance, recurring toggle inline; layout preserved for mobile with bottom sheet adaptation |
| Transactions List (Final) | Row anatomy (icon, description, meta, amount); date grouping; FAB "Quick Add" positioning confirmed |
| Groups & People (Final) | Member card structure, role badge concept; invite redesigned as shareable link (no email input) |
| Savings Targets (Final) | Out of scope for v1 — reviewed for palette consistency only |
