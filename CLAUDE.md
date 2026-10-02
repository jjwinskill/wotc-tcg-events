# Project guide for agents

The lead's procedure is in [.claude/KICKOFF.md](.claude/KICKOFF.md).
- **Requirements and grading rubric:** `docs/SPEC.md`. It's local only and never committed.
- **Architecture, acceptance criteria (AC-n), budgets and the named test list:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), written at G0.
- **Decision log:** [docs/DECISIONS.md](docs/DECISIONS.md). Append a row for each non-obvious choice and each human gate decision.
- **AI log:** [docs/AI-LOG.md](docs/AI-LOG.md). Append a row whenever AI output is rejected or corrected, saying who caught it.

## Stack, commands and layout
The lead fills these three sections at G0 from ARCHITECTURE.md, before Phase 0.

### Stack
_(set at G0)_

### Commands (root)
| Command | Does |
|---|---|
| `npm ci` then `npm run db:generate` | Required first in any fresh checkout or worktree |
| `npm run verify` | **typecheck && lint && test. It must pass before anything counts as done.** |
| _(the rest set at G0)_ | |

### Layout and ownership
Edit only the paths your role owns. If you need a change elsewhere, put it in your report.

| Path | Owner |
|---|---|
| Root config, `package.json` files, lockfile, `tsconfig*`, `eslint.config.mjs`, the shared contract package | lead |
| API app, including **all** API tests | backend-engineer |
| Web app, including its tests | frontend-engineer |
| Dockerfiles, compose, proxy config, `.dockerignore`, `.env.example` | infra-engineer |
| `README.md` | tech-writer drafts the facts; **the human writes the design write-up and the AI note** |
| `docs/DECISIONS.md`, `docs/AI-LOG.md` | everyone, append-only |

**The shared contract is frozen after Phase 0.** If you need a change, make the smallest additive change on your branch and flag it in your report.

## Conventions
- **TypeScript strict.** No `any` without a comment explaining why.
- **API:** routes → controller (HTTP only) → service (rules, throws `AppError`) → data layer. DI through factory functions with a single composition root. **Follow the `building-express5-apis` skill.**
- **Web:** **follow the `writing-react19-client-state` skill.** Derive, don't sync. `queryOptions` factories. Responses parsed with the shared schemas. Never patch library DOM.
- **Validation:** shared zod schemas at the boundary. The error envelope is `{ error: { code, message, details? } }`.
- **Integrity** lives in the database (constraints plus transactions), never in UI checks or in-memory locks.
- **Accessibility:** apply `checking-ui-accessibility` **only within the accessibility scope in ARCHITECTURE.md**, and prefer native semantics.
- **Lint is part of `verify`.** Never add an inline `eslint-disable`; fix the code.
- **Minimal code is graded.** Build only what the ACs ask for, and stay inside the **size budgets** in ARCHITECTURE.md. No speculative abstractions, unused exports, commented-out code, or comments that restate the code.
- **Tests:** write the named list in ARCHITECTURE.md → Testing. One assertion lives in one place, using `it.each` for families of cases. Never test a library's internals.
- **File changes go through Edit and Write**, not shell heredocs.
- **Timestamps** in DECISIONS and AI-LOG come from `date -u`. Never guess them.

## Commit policy
- **No target count. Every commit must communicate.** A reader of `git log --oneline` should learn exactly what changed in each step, and why from the body where it's not obvious.
  - **The subject names the specific behavior or artifact**, for example `feat(api): reject duplicate signups with a unique index on the normalized email`, never `update files`, `wip`, `fixes`, or `address review`.
  - **Review fixes say what they fix**, for example `fix(web): put server startsAt errors on the start-time field`. A gate name alone isn't a description.
- **Linear `main`.** Specialist branches are cherry-picked, not merged, so there are no merge commits.
- Each commit is a **reviewable vertical slice**. It builds, passes `verify`, and includes its own tests and its DECISIONS or AI-LOG rows.
- **No commits that only touch DECISIONS or AI-LOG.** No `fixup!` commits.
- **Before integration, fix your own branch with `git commit --amend`** (the latest commit), or as a new, properly described commit. Never use `--fixup`. Once something is on `main`, history is never rewritten.
- **Messages:** Conventional Commits. The subject says what changed; the body, when needed, says why.

## Environment rules
- **Only the lead runs the full stack.** Other agents may run `docker compose up -d db`, `docker compose config` and `docker compose build`.
- **Tests use `TEST_DATABASE_URL`, never the dev database.** Test servers bind to `127.0.0.1`.
- **Each worktree gets its own test database.** Test setup wipes its database, so parallel agents sharing one would wipe each other's data mid-run and cause flaky failures. Before your first test run in a worktree, edit that worktree's `.env` so the database name in `TEST_DATABASE_URL` ends in `_<your role>`, for example `…/app_test_backend`. The test global setup creates a missing database.
- **Stop every process you start.** Use `timeout <secs> <cmd>`, or kill by PID.
- **Git:** never push, force-push, rebase, or rewrite `main`.
- **Inside a worktree:** run git as plain, separate commands, with no loops, subshells, or `&&`/`;` chains that include git.
- **Worktrees** live at `.claude/worktrees/`. tsconfig, Vitest and ESLint must ignore them.
- **`.env` and `docs/SPEC.md`** are gitignored and copied into worktrees (`.worktreeinclude`).

## Definition of done
1. `npm run verify` (typecheck, lint, test) passes, and its summary is in your report.
2. The task's ACs are met and proven by the named tests.
3. You're inside the size budgets for your area. Report the actual numbers.
4. Commits follow the commit policy: specific subjects, slices with their tests.
5. Decisions and AI corrections are logged with real timestamps and their source.
6. Your report states what changed, how it was verified, and what's left undone.
