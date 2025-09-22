<!--
Sync Impact Report:
- Version change: 0.0.0 → 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] → I. Mission & Vision
  - [PRINCIPLE_2_NAME] → II. Core Architectural Principles
  - [PRINCIPLE_3_NAME] → III. Technology Stack
  - [PRINCIPLE_4_NAME] → IV. Comprehensive Testing Strategy
  - [PRINCIPLE_5_NAME] → V. Core Epics
- Added sections: None
- Removed sections: [SECTION_2_NAME], [SECTION_3_NAME]
- Templates requiring updates:
  - ⚠ pending: .specify/templates/plan-template.md
  - ⚠ pending: .specify/templates/spec-template.md
  - ⚠ pending: .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->
# Koin Constitution

## Core Principles

### I. Mission & Vision
Koin's mission is to make personal and collaborative finance management simple, fast, and motivating by tracking transactions (both income and expenses) and managing savings goals.

### II. Core Architectural Principles
The project will be a monorepo managed by Turborepo, containing separate packages for 'api', 'web', 'shared', and 'e2e-tests'. The 12-Factor App methodology applies to all packages. The 'Spaces Concept' is foundational, with all user data scoped within a 'Space'.

### III. Technology Stack
Backend will be Fastify with TypeScript, Vite, and Vitest. Frontend will be React with Vite, Vitest, Storybook, TypeScript, Tailwind CSS, and shadcn/ui. The database will be PostgreSQL, managed via Prisma ORM.

### IV. Comprehensive Testing Strategy
Tests will be separated into Unit (.test.ts), Integration (.integration.test.ts), and End-to-End (in the 'e2e-tests' package). Unit tests mock dependencies, while Integration tests use a real, containerized test database.

### V. Core Epics
Define the main functional areas: 'Transaction Management', 'User Authentication', 'Dashboard & Analytics', and 'Space Management'.

## Governance
All PRs/reviews must verify compliance with this constitution. Amendments require documentation, approval, and a migration plan.

**Version**: 1.0.0 | **Ratified**: 2025-09-22 | **Last Amended**: 2025-09-22
