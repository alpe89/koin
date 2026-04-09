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

## Decision Documentation

All significant decisions (product, architectural, design, infrastructure) **must be documented** in the `docs/` folder before implementation begins. This is the source of truth for why things were built the way they were.

- `docs/product/` — PRDs, user stories, acceptance criteria
- `docs/architecture/` — technical design docs, ADRs (Architecture Decision Records)
- `docs/design/` — UX decisions, user flows, accessibility notes
- `docs/infra/` — deployment strategy, CI/CD decisions

Each document should capture: the decision made, the alternatives considered, and the rationale. No subagent should begin implementation without a corresponding doc being written and approved first.
