# Decision log

Append-only, newest last. Add one row for each non-obvious choice: scope cuts, deviations from ARCHITECTURE.md, dependency additions, tradeoffs a reviewer might question, and **every human gate decision** (Source = `human`).

| Time (UTC) | Source | Decision | Why / alternatives considered |
|---|---|---|---|
| 2026-10-02T01:30Z | human | Stack from the human's pinned manifest: TS 6.0.3, Express 5.2.1, Prisma 7.10.0 + adapter-pg, Postgres 18, React 19.3 + Vite 8, TanStack Query 5, FullCalendar 6.1.21, ics, qrcode.react | TS 7 breaks typescript-eslint (<6.1); prisma@latest is an 8.0 RC; FullCalendar 7 is split across majors. Postgres over SQLite for real row locks and CHECKs. |
| 2026-10-02T01:30Z | human | React Router 7.18.4 in data mode with no loaders or actions; react-router-dom banned | RR8 changes only touch framework mode and loaders, so it buys nothing here; 7.18.4 is patched in parallel and proven in earlier runs. Next.js rejected: its route handlers aren't Express, and it splits server state between RSC and TanStack Query. |
| 2026-10-02T01:30Z | human | Templates are DB rows (GameTemplate + GameFormat, composite FK) seeded from code definitions; events snapshot capacity, duration and min players | Gives FK integrity and reviewable seed diffs; snapshot means template edits never change existing events. |
| 2026-10-02T01:30Z | human | Per-format overrides: durationMinutes, minPlayers (Booster Draft 8, other MTG formats 4) and capacityStep (Commander 4, so 4–28) | Shows that formats within one game differ; capacity is a step multiple between the format min and the template max (≤ 30). |
| 2026-10-02T01:30Z | human | Capacity: guarded updateMany then insert in one ReadCommitted transaction, with a registeredCount counter and a CHECK backstop; ALREADY_REGISTERED beats REGISTRATION_CLOSED beats EVENT_FULL | The counter row serializes the last seat with no table scan or SERIALIZABLE retries. A returning player is told they're already in. |
| 2026-10-02T01:30Z | human | Registration closes at startsAt (409 REGISTRATION_CLOSED); no events in the past (400) | Correctness calls beyond the spec's minimum; each is one guard clause. |
| 2026-10-02T01:30Z | human | registrationUrl = PUBLIC_WEB_URL ?? request origin; README 'Scan from a phone' section plus an in-app localhost notice; no tunnel | The API can't see the host LAN IP from its container. The tunnel was cut as non-spec infra. |
| 2026-10-02T01:30Z | human | Location prefill comes from a DEFAULT_LOCATION constant in packages/shared, not GET /api/config | Rejected the endpoint, env var and schema as bloat for one prefilled field. |
| 2026-10-02T01:30Z | human | No roster; accept that ALREADY_REGISTERED reveals whether a name is registered, and say so in the README | Both follow from having no authentication in scope; with auth the duplicate check would reveal only the user's own registration. |
| 2026-10-02T01:30Z | human | Idempotent demo seed by default: templates always upserted, demo events inserted only into an empty table | The reviewer sees the calendar and the full state on first run, and re-seeding can never desync registeredCount. |
| 2026-10-02T01:30Z | human | Named test lists, size budgets and AC table from the human's decision sheet; API test 11 (registrationUrl) added at G0 | Test 11 was added because the gate-reviewer found AC-6 had no proving test. |
