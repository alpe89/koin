# ADR-005: Frontend Framework — Vite SPA, No SSR, Separate Static Landing Page

**Status:** Accepted
**Date:** 2026-04-05
**Deciders:** Founder, Software Architect

---

## Context

The planned frontend is a React 19 SPA built with Vite. Before finalising the system design, the founder raised the question of whether TanStack Start (a full-stack React framework with SSR) would be a better choice, motivated by SEO and web discoverability.

The decision required evaluating whether SSR provides meaningful value for Koin's actual use case, what TanStack Start costs relative to Vite, and how SSR interacts with the PWA requirement.

---

## Decision

Keep Vite as the build tool for the React 19 SPA. No SSR in the application. If a public-facing marketing presence is needed, it is deployed as a separate static site on `koin.app`, independent of the application.

---

## Reasoning

### SEO does not apply to the application

Every meaningful page in Koin is behind authentication. The dashboard, transactions, reports, and group management are private by design. Google cannot index authenticated content. The only pages that could benefit from SSR/SSG are a landing page and the invite acceptance page — neither of which is a reason to change the application framework.

The invite acceptance page (`/join?token=...`) is a single-use link shared directly between known users. There is no SEO value in indexing it.

### TanStack Start is not the right tool at this stage

TanStack Start is production-capable but its ecosystem is still settling. Documentation has gaps, the deployment adapter story for Cloudflare Pages and similar targets has rough edges, and the community surface area for troubleshooting is a fraction of Vite's. For a solo founder this translates directly to lost hours on framework problems rather than product.

Beyond maturity, the cost/benefit does not hold:

- The deployment model changes from static file hosting to a Node.js or edge runtime for the frontend, adding operational complexity.
- TanStack Start's server functions would create a second server-side execution context alongside the Fastify API — two backends to reason about.
- The only capability needed from TanStack Start is SSR for a landing page, which does not justify adopting the framework for the entire application.

### SSR and PWA are in tension

Service workers intercept all fetch requests including navigation. For an SSR app this creates a conflict: the service worker must decide whether to serve the SSR'd HTML from cache (stale, defeats SSR) or go network-first (defeats the installable PWA performance model).

The Vite SPA model resolves this cleanly. The app shell is a static `index.html`. The service worker caches it and serves it instantly from the home screen. All data comes from the API over the network. This is the correct model for an installable PWA behind authentication.

### The landing page problem has a simpler solution

A separate static site on `koin.app` (plain HTML or Astro) gives full SEO control — meta tags, OG tags, structured data — with zero impact on the application. It can be built and redesigned independently. Both can be deployed on Cloudflare Pages free tier.

---

## Alternatives Considered

**TanStack Start (full-stack SSR)**
Rejected. Adds framework and deployment complexity without meaningful benefit for an authenticated household app. SSR/PWA tension is a real technical cost. Ecosystem maturity is a real operational risk for a solo founder.

**Next.js**
Not evaluated in depth. Would carry the same SSR/PWA tension and adds a Vercel deployment preference. The project already has a Fastify backend — a Next.js API layer would be redundant.

**Vite SPA with prerendering (vike)**
Could prerender the landing/login page for SEO. Adds plugin complexity for marginal gain. The separate static site approach is cleaner.

---

## Consequences

- The application (`app.koin.app`) is a pure SPA. First contentful paint depends on the JS bundle loading. Acceptable because all users are authenticated — there is no public audience to optimise for.
- PWA installation and offline behaviour work cleanly with the static app shell model.
- If Koin ever adds public-facing pages (shareable reports, public group profiles), SSR should be reconsidered at that point. The Vite SPA can be migrated to TanStack Start or Next.js when the requirement is real. That migration is non-trivial but the component tree and API client code are reusable.
- The landing page on `koin.app` is a separate project and deploy pipeline. It has no dependency on the app or the API and can be handed off or redesigned without touching application code.
