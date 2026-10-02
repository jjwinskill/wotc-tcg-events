# Tabletop event calendar

A small web app for a store that runs organized play. Organizers create events from game templates (Magic: The Gathering, Pokémon TCG, One Piece Card Game), see them on a calendar and download an `.ics` invite. Each event page shows a QR code for its registration link, and the server enforces capacity in a database transaction.

## Run it

`docker compose up --build`, then open http://localhost:8080. Demo events are seeded. `docker compose down -v` resets everything. From a clone, tests and dev mode first need `cp .env.example .env && npm ci && npm run db:generate && docker compose up -d db`. Then `npm run verify` runs typecheck, lint and tests, and `npm run db:migrate && npm run db:seed && npm run dev` serves the app on :5173.

## Scan from a phone

- Open the app at `http://<LAN-IP>:8080` on the computer. Find the IP with `ipconfig getifaddr en0` (macOS) or `hostname -I` (Linux).
- Or set `PUBLIC_WEB_URL=http://<LAN-IP>:8080` in `.env` and run `docker compose up -d`.
- The phone must be on the same Wi-Fi. Guest networks may isolate clients, and macOS may prompt to allow Docker connections.

## AI tooling

`.claude/` holds the agents, skills and hooks used to build this; `docs/DECISIONS.md` and `docs/AI-LOG.md` are the decision and correction logs.
The `reviewed/*` git tags mark the commits the human read.

## Design write-up

### How did you determine and enforce how many people can attend an event?

Each game template sets the bounds for an event's capacity: a default, a maximum (never above 30), a minimum number of players, and for some formats a step (Commander, for example, seats in pods of 4). When an organizer creates an event, the requested capacity is validated against those bounds and copied onto the event row, so a later template change never alters an existing event. Capacity lives in Postgres as `Event.capacity` plus a `registeredCount` counter. Two CHECK constraints back it up: `capacity BETWEEN 1 AND 30` and `registeredCount BETWEEN 0 AND capacity`.

Registering is one transaction. Instead of reading the count and then inserting, the API runs a single conditional update: increment `registeredCount` where the event matches, it hasn't started yet, and `registeredCount < capacity`. If a row is updated, the registration is inserted in the same transaction. A unique index on (event, normalized name) rejects a duplicate, and the rollback undoes the increment. If no row is updated, the API works out why and answers in this order: unknown event (404), already registered, registration closed, or full (each a 409 with a clear message).

When two people race for the last seat, both updates target the same row, so Postgres makes the second wait on the first one's row lock. When the first commits, Postgres re-checks the second update's condition against the new count (30 of 30). It matches nothing, and that player gets "This event is full." A 31st registration is never written, and if the code were ever wrong, the CHECK constraint would still refuse it. A test fires 50 concurrent registrations at a 30-seat event and asserts that exactly 30 succeed, and removing the guard makes that test fail.

### How does the template system work, and what would adding a 4th game require?

A template is data. It has an id, a name, default and maximum capacity, minimum players, a default duration, and its formats. Each format can override the duration, the minimum players or the default capacity, and can set a capacity step. Templates are rows in the `GameTemplate` and `GameFormat` tables, and an event references its format through a composite foreign key, so the database itself guarantees a format belongs to its game. Nothing in the API or the UI branches on a game's name. The create form is built from `GET /api/templates`.

There's no template admin UI, so adding a 4th game means adding one typed definition to `apps/api/src/templates/definitions.ts`, which is upserted at startup. No route, service, schema or UI changes. A test proves it with Euchre, a classic card game rather than a trading card game, with a capacity step of 4. The test seeds Euchre through the same upsert, then creates and fills an event. A game with genuinely new rules, such as teams, pairings or rounds, would need new fields and validation. I'd add those when there's a real case for them.

### What did you deliberately cut or fake, and what would you build next?

Cut or faked:

- A public roster. Without auth, a list of names is public data. For the same reason, "already registered" lets anyone check whether a name is signed up; with auth, that check would only reveal your own registration.
- A waitlist.
- Per-store time zones. I assume the organizer's browser is in the store's zone, and store UTC.
- A template admin UI.
- A public tunnel for phones. Use the machine's LAN IP or `PUBLIC_WEB_URL` instead.
- The seed events are demo data, and the seed isn't atomic: a crash midway leaves partial demo data.

Next, in order:

1. Authentication. Today anyone who can reach the app can create events, and a bad actor could flood the calendar.
2. An organizer dashboard behind auth, with the roster and full create, edit and cancel for events.
3. Player cancellation, which deletes the registration and decrements the counter in the same transaction, so the seat reopens immediately.
4. A waitlist that promotes the next player when a seat opens.

## AI usage

I used Claude Code (Opus 5.5). Before starting the clock, I ran three practice builds of this brief to baseline the quality AI produces on my chosen stack and to find its pitfalls. I encoded those pitfalls into the agents, skills, lint rules and review gates in `.claude/`, so the timed build started from an empty repo containing only that tooling. During the build, a lead agent orchestrated three specialists in parallel (infra, backend and frontend), each confined to its own paths in its own git worktree, and a fresh adversarial reviewer checked every change before it reached me. I decided the architecture, read the capacity and template code myself (the `reviewed/*` tags mark exactly which commits), and made the fix-or-defer calls.

One rejected output: the first template design put a single minimum-player count and default capacity on each game, so it couldn't say that Booster Draft needs 8 players while Commander starts with a pod of 4, and every Magic format defaulted to 16 seats. I moved both onto the format as overrides, resolved by one shared function that the API and the create form both use.
