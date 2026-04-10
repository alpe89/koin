# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

This project uses a team of specialized subagents to deliver features. When building anything new, follow this pipeline:

1. **product-manager** — Define requirements, user stories, and acceptance criteria before any implementation starts.
2. **software-architect** — Translate requirements into technical design: data models, API contracts, system boundaries, security considerations.
3. **ux-design-reviewer** — Review UI/UX before and after implementation: accessibility, usability, user flows.
4. **react-ts-engineer** — Implement frontend (React + TypeScript).
5. **nodejs-backend-engineer** — Implement backend (Node.js, Fastify or NestJS, TypeScript).
6. **devops-shipping-engineer** — Set up CI/CD, deployment, and infrastructure.

### Tooling

- **product-manager** and **ux-design-reviewer** must use the **Stitch MCP server** for all design and UI work — do not use Figma or any Figma-related skills/tools.
- Stitch tools are available via `mcp__stitch__*` (e.g. `mcp__stitch__generate_screen_from_text`, `mcp__stitch__create_design_system`).
- The project lives at: https://stitch.withgoogle.com/projects/10845020093989134005 — always load this project when doing design work.

### Ground rules

- Always start with **product-manager** when deciding what to build — no implementation without requirements.
- **software-architect** must sign off on technical design before coding begins.
- Frontend and backend work can run in parallel once the architect has defined the contracts.
- **devops-shipping-engineer** is involved when the feature is ready to ship.
- Use `superpowers:dispatching-parallel-agents` when frontend and backend tasks are independent.
- Use `superpowers:brainstorming` before any creative or feature work.

## GitHub Issues & Workflow

All work is driven by GitHub issues on the Koin project board. Use the `gh` CLI for all GitHub interactions — never use the API directly or guess URLs.

- **List issues:** `gh issue list --repo alpe89/koin --label <label>`
- **Read an issue:** `gh issue view <number> --repo alpe89/koin`
- **List project board:** `gh project item-list 3 --owner alpe89`

### Issue assignment by agent

| Agent | Issues to pick up |
|---|---|
| **software-architect** | Issues labelled `infra` or `setup` |
| **react-ts-engineer** | Issues labelled `frontend` |
| **nodejs-backend-engineer** | Issues labelled `backend` |

### Rules

- Every agent **must read their assigned issue in full** (`gh issue view`) before starting work. The issue is the source of truth for scope and acceptance criteria.
- **frontend and backend agents may work in parallel** when their issues have no shared dependencies — use `superpowers:dispatching-parallel-agents`.
- **Only the product-manager may update GitHub issues and the project board** — status, labels, milestone, comments. Use `gh issue edit`, `gh issue comment`, and `gh project item-edit`. No other agent touches tickets directly.
- The product-manager updates the roadmap accordingly after each report.

### Agent reporting checkpoints

Every implementing agent (react-ts-engineer, nodejs-backend-engineer, software-architect, devops-shipping-engineer) **must report to the product-manager** at exactly three moments:

1. **On pickup** — as soon as the agent starts working on an issue, report: issue number, title, and what it plans to do.
2. **On blocker** — if the agent cannot proceed (missing info, dependency not ready, ambiguous spec), stop immediately and report: issue number, what is blocked, and why. Do not guess or invent solutions.
3. **On completion** — when an issue is done, report: issue number, what was built, any deviations from the spec, and whether the next issue in the milestone can be picked up immediately.

The product-manager acts on each report by updating the GitHub issue and board accordingly. No agent should move to the next issue without sending a completion report first.

### Frontend implementation standard

- **react-ts-engineer must follow the Stitch screens** for every UI feature before writing code.
- Stitch project: https://stitch.withgoogle.com/projects/10845020093989134005
- The implemented UI must match the Stitch screens closely enough for the **ux-design-reviewer** to review against them after implementation.
- Do not invent UI patterns or layouts not present in Stitch.

## Decision Documentation

All significant decisions (product, architectural, design, infrastructure) **must be documented** in the `docs/` folder before implementation begins. This is the source of truth for why things were built the way they were.

- `docs/product/` — PRDs, user stories, acceptance criteria
- `docs/architecture/` — technical design docs, ADRs (Architecture Decision Records)
- `docs/design/` — UX decisions, user flows, accessibility notes
- `docs/infra/` — deployment strategy, CI/CD decisions

Each document should capture: the decision made, the alternatives considered, and the rationale. No subagent should begin implementation without a corresponding doc being written and approved first.
