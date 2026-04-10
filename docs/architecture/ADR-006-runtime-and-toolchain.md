# ADR-006: Runtime and Toolchain — Bun, oxlint, oxfmt

**Status:** Accepted
**Date:** 2026-04-10
**Deciders:** Founder, Software Architect

---

## Context

Before scaffolding the monorepo, the project needed to settle on:

1. **JavaScript runtime and package manager** — Node.js + npm/yarn vs. an alternative
2. **Linter** — ESLint vs. a faster alternative
3. **Formatter** — Prettier vs. a faster alternative

The guiding constraint is developer speed and zero-friction local tooling for a solo-founder project. The fewer moving parts, the better.

---

## Decision

- **Runtime & package manager:** Bun
- **Linter:** oxlint (OXC project)
- **Formatter:** oxfmt (OXC project)

All three tools are used across both `apps/api` (Fastify backend) and `apps/web` (React frontend).

---

## Reasoning

### Bun

Bun is a single binary that replaces Node.js, npm, and a test runner. It runs TypeScript natively without a compilation step in development, its package manager is significantly faster than npm or yarn, and it is compatible with the Fastify and Vite ecosystems used by this project. Railway (the chosen API host) supports Bun natively, requiring no Dockerfile customisation.

The productivity gain for a solo founder — one runtime, one package manager, no `ts-node` or `tsx` wrapper needed in dev — outweighs any ecosystem edge cases.

### oxlint + oxfmt (OXC)

OXC is a Rust-based JavaScript toolchain. Both tools are from the same project, share configuration, and integrate cleanly without the plugin-heavy setup ESLint requires.

- **oxlint** is production-stable. It covers the ESLint rule surface area needed for TypeScript + React projects.
- **oxfmt** reached beta in February 2026, passes 100 % of Prettier's JS/TS conformance tests, and is already used in production by vuejs/core, vercel/turborepo, and getsentry/sentry-javascript. It is 30× faster than Prettier and 3× faster than Biome.

The combination replaces ESLint + Prettier with two tools from a single, coherent project.

---

## Alternatives Considered

**Node.js + npm**
The baseline. Rejected in favour of Bun for speed and DX. The ecosystem compatibility risk is low — Bun's Node.js compatibility layer covers all packages used in this project.

**ESLint + Prettier**
The industry default. Rejected because configuration overhead is high (plugins, parsers, rule sets, format-on-save conflicts) and performance is poor at scale. oxlint + oxfmt deliver the same outcomes with less setup.

**Biome**
A strong alternative — also Rust-based, also fast, also a unified linter + formatter. Rejected because OXC is now the preferred direction within the VoidZero ecosystem (the same organisation behind Vite and Rolldown), giving better long-term alignment with the project's frontend stack.

---

## Consequences

- All scripts in `package.json` use `bun` and `bunx` — never `npm`, `npx`, or `yarn`.
- CI pipelines install dependencies with `bun install`.
- Linting runs with `bunx oxlint`.
- Formatting runs with `bunx oxfmt`.
- The Fastify API process in production starts with `bun run src/main.ts` (or compiled output).
- If a package is found to be incompatible with Bun, the compatibility shim layer should be investigated first before falling back to Node.js.
