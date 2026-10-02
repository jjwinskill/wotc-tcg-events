# AI log

Append-only, newest last. Add a row whenever AI-generated output was rejected, corrected, or significantly reworked, whether a specialist's code, a reviewer finding, or a plan. The README's AI usage note is drawn from here.

**Caught by** is one of `human`, `gate-reviewer`, `lint`, `tests`, or `self` (the agent that produced it).

| Time (UTC) | Agent | Caught by | What it produced | What was wrong | What we did instead |
|---|---|---|---|---|---|
| 2026-10-02T01:30Z | lead | gate-reviewer | G0 plan draft | Demo seed key undefined (re-seed could reset registeredCount below the rows), no default start slot after 6 PM, .ics filename would 500 on non-ASCII names, AC-6 and the AC-9 UI unowned or untested, API test files racing on template upserts | Fixed all 10 findings in ARCHITECTURE.md before the human review |
| 2026-10-02T01:30Z | lead | human | G0 proposal: GET /api/config to prefill location from STORE_LOCATION | An endpoint, an env var and a schema for one form default | DEFAULT_LOCATION constant in packages/shared |
| 2026-10-02T01:30Z | lead | human | G0 template model with a template-level minPlayers only | Couldn't express that Booster Draft needs 8 while the other MTG formats need 4 | Added a nullable per-format minPlayers override |
| 2026-10-02T01:43Z | lead | gate-reviewer | G1 foundation: no shared effective-rules helper, zod default messages for missing fields, `retry: 3` on 4xx queries (about 7 s before a 404 shows), `PUBLIC_WEB_URL` not normalized (a trailing slash gave `//events`) | Gaps the reviewer caught in the lead's scaffold | Fixed before the contract freeze |
| 2026-10-02T01:43Z | gate-reviewer | self (typecheck) | Called the `String()` around the flattened zod message redundant | `fieldErrors` values are typed loosely, so typecheck fails without it | Kept `String()` |
| 2026-10-02T02:02Z | backend-engineer | self | Seed draft that added the full event's players with `if (input.templateId === 'one-piece')` | A branch on a game id, which AC-3 forbids in spirit even outside core code | Each demo entry carries an optional `players` list |
| 2026-10-02T02:14Z | backend-engineer | gate-reviewer | API branch: `registrationUrl` built in the service, `nameKey` that kept zero-width characters, an ASCII-only `.ics` slug that turned "Pokémon" into `pok-mon`, an inline `/templates` handler in `app.ts`, and a redundant Commander capacity row | Leaked HTTP into the service, let duplicate names through, mangled accented filenames, and duplicated one test assertion | Fixed all five in one `fix(api)` commit |
| 2026-10-02T02:14Z | gate-reviewer | tests | Slug fix recipe `normalize('NFKD').toLowerCase().match(/[a-z0-9]+/g)` | NFKD splits "é" into "e" plus a combining accent, which breaks the run: `poke-mon-league-challenge.ics` | Also strip `\p{M}` after NFKD |
| 2026-10-02T02:27Z | backend-engineer | human | A transaction-sizing comment in `store.ts` justified the timeouts with the concurrency test's 50 requests | It tied production code to a test fixture; real bursts could be any size | Reworded to describe the queueing mechanism only (amended before integration) |
