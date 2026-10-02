# AI log

Append-only, newest last. Add a row whenever AI-generated output was rejected, corrected, or significantly reworked, whether a specialist's code, a reviewer finding, or a plan. The README's AI usage note is drawn from here.

**Caught by** is one of `human`, `gate-reviewer`, `lint`, `tests`, or `self` (the agent that produced it).

| Time (UTC) | Agent | Caught by | What it produced | What was wrong | What we did instead |
|---|---|---|---|---|---|
| 2026-10-02T01:30Z | lead | gate-reviewer | G0 plan draft | Demo seed key undefined (re-seed could reset registeredCount below the rows), no default start slot after 6 PM, .ics filename would 500 on non-ASCII names, AC-6 and the AC-9 UI unowned or untested, API test files racing on template upserts | Fixed all 10 findings in ARCHITECTURE.md before the human review |
| 2026-10-02T01:30Z | lead | human | G0 proposal: GET /api/config to prefill location from STORE_LOCATION | An endpoint, an env var and a schema for one form default | DEFAULT_LOCATION constant in packages/shared |
| 2026-10-02T01:30Z | lead | human | G0 template model with a template-level minPlayers only | Couldn't express that Booster Draft needs 8 while the other MTG formats need 4 | Added a nullable per-format minPlayers override |
