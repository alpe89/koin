#!/usr/bin/env bash
# =============================================================================
# Koin — GitHub Issues, Labels, Milestones & Project board bootstrap
# Run from the repo root:  bash scripts/create-github-project.sh
# Requires: gh CLI authenticated, correct repo remote
# =============================================================================

set -uo pipefail

REPO="alpe89/koin"
OWNER="alpe89"

# ---------------------------------------------------------------------------
# Helper: get existing milestone number by title, or create it
# ---------------------------------------------------------------------------
get_or_create_milestone() {
  local title="$1"
  local desc="$2"
  local num
  num=$(gh api "repos/$REPO/milestones" --jq ".[] | select(.title == \"$title\") | .number" 2>/dev/null | head -1)
  if [[ -z "$num" ]]; then
    num=$(gh api "repos/$REPO/milestones" --method POST \
      --field title="$title" \
      --field description="$desc" \
      --field state="open" \
      --jq '.number')
  fi
  echo "$num"
}

# ---------------------------------------------------------------------------
# Helper: create an issue via API (accepts numeric milestone), add to project
# Usage: create_issue <project_number> <milestone_num> <title> <labels> <body>
# ---------------------------------------------------------------------------
create_issue() {
  local project_number="$1"
  local milestone_num="$2"
  local title="$3"
  local labels="$4"
  local body="$5"

  # Build label array for gh api
  local label_args=()
  IFS=',' read -ra label_list <<< "$labels"
  for lbl in "${label_list[@]}"; do
    label_args+=(--field "labels[]=$lbl")
  done

  local issue_num
  issue_num=$(gh api "repos/$REPO/issues" --method POST \
    --field title="$title" \
    --field body="$body" \
    --field milestone="$milestone_num" \
    "${label_args[@]}" \
    --jq '.number')

  local url="https://github.com/$REPO/issues/$issue_num"
  echo "  Created: $url"
  gh project item-add "$project_number" --owner "$OWNER" --url "$url"
}

# ---------------------------------------------------------------------------
# 1. Find or create the GitHub project
# ---------------------------------------------------------------------------
echo "==> Looking up GitHub project for $OWNER..."

PROJECT_NUMBER=$(gh project list --owner "$OWNER" --format json \
  | jq -r '.projects[] | select(.title | test("(?i)koin")) | .number' \
  | head -1)

if [[ -z "$PROJECT_NUMBER" ]]; then
  echo "  No Koin project found — creating one..."
  PROJECT_NUMBER=$(gh project create \
    --owner "$OWNER" \
    --title "Koin" \
    --format json \
    | jq -r '.number')
  echo "  Project created: #$PROJECT_NUMBER"
else
  echo "  Found existing project: #$PROJECT_NUMBER"
fi

# ---------------------------------------------------------------------------
# 2. Labels
# ---------------------------------------------------------------------------
echo "==> Creating labels..."

gh label create "backend"     --color "0075ca" --description "Backend / API work"          --repo "$REPO" --force
gh label create "frontend"    --color "e4e669" --description "Frontend / React work"        --repo "$REPO" --force
gh label create "infra"       --color "d93f0b" --description "Infrastructure / CI / deploy" --repo "$REPO" --force
gh label create "design"      --color "cc317c" --description "UX / visual design"           --repo "$REPO" --force
gh label create "db"          --color "5319e7" --description "Database / migrations"        --repo "$REPO" --force
gh label create "auth"        --color "0e8a16" --description "Authentication / security"    --repo "$REPO" --force
gh label create "pwa"         --color "1d76db" --description "PWA / service worker"         --repo "$REPO" --force
gh label create "enhancement" --color "a2eeef" --description "New feature or request"       --repo "$REPO" --force
gh label create "chore"       --color "ededed" --description "Non-feature maintenance work" --repo "$REPO" --force

# ---------------------------------------------------------------------------
# 3. Milestones
# ---------------------------------------------------------------------------
echo "==> Getting or creating milestones..."

M1=$(get_or_create_milestone "M1 — Foundation" "Monorepo setup, DB migrations, shared types, CI pipeline")
M2=$(get_or_create_milestone "M2 — Auth & Groups" "Google SSO, JWT, user/group/member/invitation API and frontend")
M3=$(get_or_create_milestone "M3 — Transactions" "Add/edit/delete transactions, categories, recurring rules engine")
M4=$(get_or_create_milestone "M4 — Dashboard & Reports" "Charts, monthly report, month navigation")
M5=$(get_or_create_milestone "M5 — PWA & Polish" "Service worker, manifest, installability, accessibility audit, performance")

echo "  Milestones: M1=$M1  M2=$M2  M3=$M3  M4=$M4  M5=$M5"

# ---------------------------------------------------------------------------
# 4. Issues — M1: Foundation
# ---------------------------------------------------------------------------
echo "==> Creating issues — M1: Foundation..."

create_issue "$PROJECT_NUMBER" "$M1" \
  "Initialise bun workspaces monorepo" \
  "chore,infra" \
  "## Done when
- Root \`package.json\` declares \`workspaces: [\"apps/*\", \"packages/*\"]\` using bun workspaces.
- \`apps/web\` — Vite + React 19 + TypeScript scaffolded; dev server runs on \`localhost:5173\`.
- \`apps/api\` — Fastify + TypeScript scaffolded; dev server runs on \`localhost:3000\`.
- \`packages/shared\` — empty TypeScript package with barrel export; importable from both \`web\` and \`api\`.
- \`bun run dev\` at root starts both apps concurrently.
- \`.gitignore\`, \`tsconfig\` base, and \`biome\` (or equivalent) lint config in place."

create_issue "$PROJECT_NUMBER" "$M1" \
  "Write and run database migrations (all 9 steps)" \
  "db,backend" \
  "## Done when
All migrations in \`apps/api/src/infrastructure/db/migrations/\` run in order against a Neon PostgreSQL 16 instance without errors:

1. \`users\` table
2. \`groups\` table
3. \`group_members\` table
4. \`group_invitations\` table
5. \`categories\` table
6. \`recurring_rules\` table
7. \`transactions\` table
8. Deferred FK: \`ALTER TABLE users ADD CONSTRAINT fk_users_default_group_id\`
9. \`CREATE VIEW active_groups\`

All indexes documented in \`docs/architecture/data-model.md\` are present. A migration runner script (\`bun run db:migrate\`) applies pending files in order."

create_issue "$PROJECT_NUMBER" "$M1" \
  "Define shared TypeScript types in packages/shared" \
  "chore,backend,frontend" \
  "## Done when
- \`packages/shared\` exports all API request/response shapes derived from \`docs/architecture/api-contracts.md\`.
- Types cover: User, Group, GroupMember, GroupInvitation, Category, Transaction, RecurringRule, Dashboard, MonthlyReport, and the common error envelope.
- Both \`apps/web\` and \`apps/api\` import from \`@koin/shared\` without TypeScript errors.
- No runtime code in this package — types only."

create_issue "$PROJECT_NUMBER" "$M1" \
  "Set up CI pipeline (lint, typecheck, test)" \
  "infra,chore" \
  "## Done when
- GitHub Actions workflow runs on every push to \`main\` and on every pull request.
- Pipeline steps: install (bun), lint, typecheck, unit tests.
- Pipeline must pass before merging to \`main\`.
- Workflow file lives at \`.github/workflows/ci.yml\`."

create_issue "$PROJECT_NUMBER" "$M1" \
  "Configure Cloudflare Pages deployment for apps/web" \
  "infra" \
  "## Done when
- \`apps/web\` is deployed to Cloudflare Pages on push to \`main\`.
- Build command: \`bun run build\` (Vite output to \`dist/\`).
- SPA fallback rule configured (all routes serve \`index.html\`).
- \`APP_URL\` environment variable set in Cloudflare Pages project settings.
- Preview deployments enabled for pull requests."

create_issue "$PROJECT_NUMBER" "$M1" \
  "Configure Railway/Render deployment for apps/api" \
  "infra" \
  "## Done when
- \`apps/api\` is deployed to Railway or Render free tier on push to \`main\`.
- All required environment variables provisioned (see \`docs/architecture/system-design.md\`):
  - \`DATABASE_URL\`, \`JWT_PRIVATE_KEY\`, \`JWT_PUBLIC_KEY\`
  - \`GOOGLE_CLIENT_ID\`, \`GOOGLE_CLIENT_SECRET\`, \`GOOGLE_REDIRECT_URI\`
  - \`APP_URL\`, \`NODE_ENV\`, \`PORT\`
- Health check endpoint \`GET /health\` returns \`200\`.
- Zero-downtime deploys configured."

# ---------------------------------------------------------------------------
# 5. Issues — M2: Auth & Groups
# ---------------------------------------------------------------------------
echo "==> Creating issues — M2: Auth & Groups..."

create_issue "$PROJECT_NUMBER" "$M2" \
  "Implement Google OAuth 2.0 flow (backend)" \
  "backend,auth" \
  "## Done when
- \`GET /api/v1/auth/google\` redirects the browser to Google's authorization endpoint with a CSRF nonce stored in an \`HttpOnly Secure SameSite=Strict\` cookie.
- \`GET /api/v1/auth/google/callback\` exchanges the code, upserts the user row, issues a signed RS256 JWT (7-day expiry), and redirects to \`\${APP_URL}/#token=<jwt>\`.
- On first login: personal group created (\`\"<first_name>'s Group\"\`), user added as owner, categories seeded — all in a single DB transaction.
- CSRF nonce verified on callback; mismatches return 400.
- \`POST /api/v1/auth/signout\` returns 204.
- \`GET /api/v1/auth/me\` returns the authenticated user object.
- Ports & adapters pattern followed: \`GoogleAuthAdapter\` implements \`AuthProvider\` interface."

create_issue "$PROJECT_NUMBER" "$M2" \
  "Implement JWT authentication middleware (backend)" \
  "backend,auth" \
  "## Done when
- \`hooks/authenticate.ts\` verifies the RS256 JWT from the \`Authorization: Bearer\` header.
- Invalid or missing tokens return \`401\`.
- Verified payload attached to \`req.user\` (id, email, displayName).
- \`hooks/require-group-member.ts\` resolves group membership and role from DB, attaches \`req.groupMember\`.
- Non-member requests return \`403\`.
- Both hooks registered as \`preHandler\` on all protected routes."

create_issue "$PROJECT_NUMBER" "$M2" \
  "Implement groups API (CRUD + member management)" \
  "backend" \
  "## Done when
All group endpoints from \`docs/architecture/api-contracts.md\` are implemented:

- \`POST /api/v1/groups\` — create group, seed categories, add creator as owner.
- \`GET /api/v1/groups\` — list groups for authenticated user.
- \`GET /api/v1/groups/:groupId\` — group detail (member only).
- \`PATCH /api/v1/groups/:groupId\` — rename group (owner only).
- \`GET /api/v1/groups/:groupId/members\` — list active members.
- \`PATCH /api/v1/groups/:groupId/members/:userId\` — change role (owner only).
- \`DELETE /api/v1/groups/:groupId/members/:userId\` — remove member, deactivate their recurring rules, clear their \`default_group_id\` if pointing here (owner only).
- Zod validation on all request bodies.
- Role enforcement via \`require-group-member\` hook."

create_issue "$PROJECT_NUMBER" "$M2" \
  "Implement group invitations API (shareable link)" \
  "backend" \
  "## Done when
- \`POST /api/v1/groups/:groupId/invitations\` — owner generates a single-use token (crypto.randomBytes(32), base64url, 48h expiry). Returns \`inviteUrl\`.
- \`GET /api/v1/invitations/:token\` — public; returns group name, role, inviter name, expiry. Returns 404 if expired/used/not found.
- \`POST /api/v1/invitations/:token/accept\` — authenticated; validates token, inserts \`group_members\` row, marks token used — all in one DB transaction. Returns 409 if already a member."

create_issue "$PROJECT_NUMBER" "$M2" \
  "Implement user profile API (PATCH /users/me)" \
  "backend" \
  "## Done when
- \`PATCH /api/v1/users/me\` accepts optional \`displayName\` and \`defaultGroupId\` fields.
- Updates the \`users\` row for the authenticated user.
- Returns the updated user object (same shape as \`GET /auth/me\`).
- Setting \`defaultGroupId\` to a group the user is not an active member of returns 403."

create_issue "$PROJECT_NUMBER" "$M2" \
  "Build sign-in screen and Google SSO flow (frontend)" \
  "frontend,auth" \
  "## Done when
- Unauthenticated users see a sign-in screen with a 'Sign in with Google' button.
- Clicking the button navigates to \`/api/v1/auth/google\`.
- On return (\`/#token=<jwt>\`): token extracted from URL fragment, fragment stripped immediately, token stored in IndexedDB (installed PWA) or sessionStorage (browser tab).
- Authenticated state initialised from stored token on app load.
- Signing out calls \`POST /api/v1/auth/signout\`, clears the stored token, and returns the user to the sign-in screen."

create_issue "$PROJECT_NUMBER" "$M2" \
  "Build group management UI (create, rename, switcher, default)" \
  "frontend" \
  "## Done when
- Users can create a new group (name field, submit).
- A group switcher in the navigation shows all groups the user belongs to.
- Users can set a group as their default via a settings action.
- The default group is loaded automatically on login.
- Group owners can rename their group.
- CSS Modules + BEM naming convention followed."

create_issue "$PROJECT_NUMBER" "$M2" \
  "Build member management UI (invite link, member list, remove, role change)" \
  "frontend" \
  "## Done when
- Group settings screen lists all active members with their role and join date.
- Owner can generate an invite link and copy it to clipboard.
- Owner can change a member's role (editor ↔ viewer) via an inline control.
- Owner can remove a member with a confirmation step.
- Invitation acceptance flow: \`/join?token=<token>\` shows group preview, then 'Join' button calls accept endpoint.
- Non-owners see the member list but no management controls."

# ---------------------------------------------------------------------------
# 6. Issues — M3: Transactions
# ---------------------------------------------------------------------------
echo "==> Creating issues — M3: Transactions..."

create_issue "$PROJECT_NUMBER" "$M3" \
  "Implement transactions API (CRUD + categories endpoint)" \
  "backend" \
  "## Done when
- \`GET /api/v1/groups/:groupId/categories\` — returns seeded categories ordered by type then sort_order.
- \`GET /api/v1/groups/:groupId/transactions?year=&month=\` — returns transactions + summary for the month.
- \`POST /api/v1/groups/:groupId/transactions\` — creates transaction; if \`recurringRule.enabled\` is true, inserts recurring rule with \`last_fired_at = date\` and links transaction to rule, all in one DB transaction.
- \`PATCH /api/v1/groups/:groupId/transactions/:id\` — owner edits any; editor edits own only.
- \`DELETE /api/v1/groups/:groupId/transactions/:id\` — owner deletes any; editor deletes own only.
- All Zod validation rules from \`docs/architecture/api-contracts.md\` enforced.
- \`transaction.created\` and \`transaction.deleted\` domain events published."

create_issue "$PROJECT_NUMBER" "$M3" \
  "Implement recurring rules API (CRUD)" \
  "backend" \
  "## Done when
- \`GET /api/v1/groups/:groupId/recurring-rules\` — lists all rules for the group.
- \`PATCH /api/v1/groups/:groupId/recurring-rules/:ruleId\` — owner edits any; editor edits own active rules only.
- \`DELETE /api/v1/groups/:groupId/recurring-rules/:ruleId\` — owner deletes any; editor deletes own only. Historical transactions retain \`recurring_rule_id = NULL\` via ON DELETE SET NULL.
- \`recurring_rule.created\` domain event published on creation.
- \`member.removed\` domain event handled: sets \`is_active = false\` on all rules for the removed user in that group."

create_issue "$PROJECT_NUMBER" "$M3" \
  "Implement in-process recurring transaction scheduler" \
  "backend" \
  "## Done when
- \`InProcessScheduler\` implements the \`RecurringScheduler\` port interface.
- Firing condition: \`is_active = true\` AND \`day_of_month <= today's day\` AND not yet fired this calendar month (checked via \`last_fired_at\`).
- On fire: inserts a \`transactions\` row with \`is_recurring_fired = true\` and updates \`last_fired_at\` — in a single Postgres transaction.
- \`pg_try_advisory_lock\` used to prevent concurrent double-fires.
- Triggered at: (1) server startup — \`checkAndFireAll()\` for missed-day recovery; (2) authenticated requests — \`checkAndFireDue()\` at most once per hour per instance; (3) \`transaction.created\` and \`recurring_rule.created\` events.
- At-least-once delivery; idempotency guaranteed by month check on \`last_fired_at\`."

create_issue "$PROJECT_NUMBER" "$M3" \
  "Build add-transaction FAB and form (frontend)" \
  "frontend" \
  "## Done when
- A Floating Action Button (FAB) is always visible on mobile and desktop.
- Tapping FAB opens the add-transaction form (bottom sheet on mobile, modal on desktop).
- Form fields: Amount (required, EUR), Type (expense/income toggle), Category (dropdown from group categories), Date (date picker, defaults to today), Note (optional text), Recurring toggle.
- When recurring is toggled on, a day-of-month selector (1–28) appears.
- Form submits to \`POST /api/v1/groups/:groupId/transactions\`.
- Client-side validation mirrors API rules (amount > 0, date not more than 1 day in future, etc.).
- Form closes and transaction list refreshes on success.
- Loading and error states handled."

create_issue "$PROJECT_NUMBER" "$M3" \
  "Build edit and delete transaction UI (frontend)" \
  "frontend" \
  "## Done when
- Each transaction in the list has an edit action (owner sees it on all; editor sees it on their own only).
- Edit opens a pre-filled form; submits to \`PATCH\` endpoint.
- Delete action shows a confirmation dialog before calling \`DELETE\` endpoint.
- Recurring indicator icon displayed on transactions linked to a recurring rule.
- Transaction list refreshes after edit or delete.
- Controls are hidden for viewers."

create_issue "$PROJECT_NUMBER" "$M3" \
  "Build recurring rules management screen (frontend)" \
  "frontend" \
  "## Done when
- A dedicated screen lists all active recurring rules for the current group.
- Each rule shows: amount, type, category, day of month, note (if any), who created it, last fired date.
- Owner sees edit/delete controls on all rules; editor sees them on their own only.
- Edit and delete actions call the respective API endpoints.
- Screen is accessible from group settings or a navigation link."

# ---------------------------------------------------------------------------
# 7. Issues — M4: Dashboard & Reports
# ---------------------------------------------------------------------------
echo "==> Creating issues — M4: Dashboard & Reports..."

create_issue "$PROJECT_NUMBER" "$M4" \
  "Implement dashboard and monthly report API" \
  "backend" \
  "## Done when
- \`GET /api/v1/groups/:groupId/dashboard?year=&month=\` returns:
  - \`totalExpenseCents\`, \`totalIncomeCents\`, \`netCents\` for the requested month.
  - \`categoryBreakdown\` array (category, total, % of type) for the requested month.
  - \`trend\` array — last 6 months including the requested month, ordered chronologically.
- \`GET /api/v1/groups/:groupId/reports/monthly?year=&month=\` returns income, expenses, net, and full category breakdown.
- Both endpoints use the \`reports\` module's own read queries — no imports from \`transactions\` module internals.
- Response shapes match \`docs/architecture/api-contracts.md\` exactly."

create_issue "$PROJECT_NUMBER" "$M4" \
  "Build dashboard screen with headline metric and transaction list (frontend)" \
  "frontend" \
  "## Done when
- Dashboard is the home screen after login, showing the default group.
- Headline metric: 'Total spend this month' displayed prominently.
- Transaction list for the selected month, grouped by category.
- Each transaction shows: amount, category, date, note (if any), who added it, recurring indicator icon if applicable.
- Month navigation (← previous / next →) changes the selected month and reloads data.
- Empty state shown when no transactions exist for the month."

create_issue "$PROJECT_NUMBER" "$M4" \
  "Build pie/donut chart and line chart (frontend)" \
  "frontend" \
  "## Done when
- Pie/donut chart: spending breakdown by category for the selected month. Uses Chart.js.
- Line chart: income vs. expenses trend over the last 6 months. Uses Chart.js.
- Both charts source data from the \`GET /dashboard\` response.
- Charts re-render when the selected month changes.
- Charts are responsive and readable at 375px wide (mobile).
- Charts have accessible labels (aria or text equivalent)."

create_issue "$PROJECT_NUMBER" "$M4" \
  "Build monthly report screen (frontend)" \
  "frontend" \
  "## Done when
- A 'Monthly Report' screen is accessible from the dashboard or navigation.
- Displays for the selected month: total income, total expenses, net balance, and a category breakdown table (name, total amount, % of total expenses).
- Month navigation works on this screen (same behaviour as the dashboard).
- Report is read-only — no editing from this screen.
- All group members (including viewers) can access this screen."

# ---------------------------------------------------------------------------
# 8. Issues — M5: PWA & Polish
# ---------------------------------------------------------------------------
echo "==> Creating issues — M5: PWA & Polish..."

create_issue "$PROJECT_NUMBER" "$M5" \
  "Implement service worker and PWA manifest" \
  "frontend,pwa" \
  "## Done when
- Vite PWA plugin (Workbox) configured in \`apps/web\`.
- Service worker strategy: cache-first for app shell assets, network-only for \`/api/*\` requests.
- Web app manifest includes: \`name\`, \`short_name\`, \`display: standalone\`, \`theme_color: #2563eb\`, \`background_color\`, \`start_url\`, icons at 192px, 512px, and 512px maskable.
- \`apple-mobile-web-app-capable\` meta tag present in \`index.html\`.
- App is installable on iOS Safari and Android Chrome.
- Lighthouse PWA audit passes with no critical failures."

create_issue "$PROJECT_NUMBER" "$M5" \
  "Create app icons (192px, 512px, 512px maskable)" \
  "design" \
  "## Done when
- Three icon files produced: 192×192px, 512×512px, and 512×512px maskable variant.
- Maskable variant respects the safe zone (key content within the inner 80% of the canvas).
- Icons placed in \`apps/web/public/\` and referenced correctly in the web app manifest."

create_issue "$PROJECT_NUMBER" "$M5" \
  "Accessibility audit and fixes" \
  "frontend,design" \
  "## Done when
- Automated accessibility audit run (axe or equivalent) with zero critical or serious violations.
- All interactive elements reachable by keyboard tab order.
- All images and icon buttons have descriptive \`aria-label\` or \`alt\` text.
- Colour contrast meets WCAG AA minimums across all screens.
- Focus indicators visible on all interactive elements.
- FAB accessible via keyboard and screen reader."

create_issue "$PROJECT_NUMBER" "$M5" \
  "Mobile performance review and optimisation" \
  "frontend" \
  "## Done when
- Add-transaction flow (FAB tap → form submit → list refresh) feels instant on a mid-range Android device (target < 300ms UI response to tap).
- Lighthouse Performance score ≥ 90 on mobile simulation.
- Initial JS bundle reviewed; any chunk > 100 KB gzip investigated and justified or split.
- Images and icons served in appropriate formats (WebP or SVG)."

create_issue "$PROJECT_NUMBER" "$M5" \
  "End-to-end smoke test on iOS Safari and Android Chrome" \
  "frontend,pwa" \
  "## Done when
Manual test on a real iOS Safari device and a real Android Chrome device confirms:
- User can sign in with Google.
- App is installable to the home screen.
- After install, app opens standalone (no browser chrome visible).
- JWT persists across app backgrounding (IndexedDB storage confirmed on iOS).
- User can add a transaction, see it on the dashboard, and delete it.
- Month navigation works correctly.
- App loads with no console errors."

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo ""
echo "==> All done!"
echo "    Repo:    https://github.com/$REPO/issues"
echo "    Project: https://github.com/users/$OWNER/projects/$PROJECT_NUMBER"
echo ""
gh issue list --repo "$REPO" --limit 40
