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

Each game template bounds an event's capacity: a default, a maximum (never above 30), a minimum number of players, and for some formats a step (Commander seats pods of 4). The organizer's choice is validated against those bounds and copied onto the event, so a later template change never alters it. Capacity lives in Postgres as `Event.capacity` plus a `registeredCount` counter, backed by CHECK constraints (`capacity BETWEEN 1 AND 30`, `registeredCount BETWEEN 0 AND capacity`). Registering is one transaction: a single conditional update increments the counter only if the event hasn't started and `registeredCount < capacity`, then inserts the registration, and a unique index on the normalized name rejects a duplicate and rolls the increment back. If nothing is updated, the API answers in order: unknown event (404), then already registered, registration closed or full (each a 409). When two people race for the last seat, Postgres makes the second update wait on the row lock, re-checks its condition against the new count, and that player gets "This event is full." A test fires 50 concurrent registrations at a 30-seat event and expects exactly 30 to succeed; removing the guard makes it fail.

### How does the template system work, and what would adding a 4th game require?

A template is data: rows in `GameTemplate` and `GameFormat` holding default and maximum capacity, minimum players and duration, where each format can override the duration, minimum players or default capacity and can set a capacity step. An event references its format through a composite foreign key, so the database guarantees the format belongs to its game, and nothing in the API or UI branches on a game's name; the create form is built from `GET /api/templates`. Adding a 4th game means adding one typed definition to `apps/api/src/templates/definitions.ts`, which is upserted at startup, with no route, service, schema or UI changes. A test proves it with Euchre, a classic card game with a capacity step of 4. A game with genuinely new rules, such as teams, pairings or rounds, would need new fields and validation, which I'd add when there's a real case for them.

### What did you deliberately cut or fake, and what would you build next?

Cut or faked:

- The seed events are demo data, and the seed isn't atomic: a crash midway leaves partial demo data.
- Scanning the QR code works only on the same network (the LAN IP or `PUBLIC_WEB_URL`); the app isn't publicly hosted.

Next, in order:

1. Authentication. Today anyone who can reach the app can create events, and a bad actor could flood the calendar.
2. An organizer dashboard behind auth, with the roster and full create, edit and cancel for events.
3. Player cancellation, which deletes the registration and decrements the counter in the same transaction, so the seat reopens immediately.
4. A waitlist that promotes the next player when a seat opens.

## AI usage

I used Claude Code (Opus 5.5). Before starting the clock, I ran three practice builds of this brief to baseline the quality AI produces on my chosen stack and to find its pitfalls. I encoded those pitfalls into the agents, skills, lint rules and review gates in `.claude/`, so the timed build started from an empty repo containing only that tooling. During the build, a lead agent orchestrated three specialists in parallel (infra, backend and frontend), each confined to its own paths in its own git worktree, and a fresh adversarial reviewer checked every change before it reached me. I decided the architecture, read the capacity and template code myself (the `reviewed/*` tags mark exactly which commits), and made the fix-or-defer calls.

One rejected output: the first template design put a single minimum-player count and default capacity on each game, so it couldn't say that Booster Draft needs 8 players while Commander starts with a pod of 4, and every Magic format defaulted to 16 seats. I moved both onto the format as overrides, resolved by one shared function that the API and the create form both use.
