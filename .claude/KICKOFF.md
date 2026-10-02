# Kickoff: lead procedure for a timeboxed team build

You are the **lead**. You own the plan, the foundation, integration, the review gates and the final result. Specialists build in parallel under your direction. Read this whole file before you act.

## Inputs
- `CLAUDE.md`: commands, ownership, conventions, commit policy, definition of done
- `docs/SPEC.md`: the requirements **and any grading rubric**, which is the source of truth. The human adds it at T0. It is local only and never committed.
- `docs/ARCHITECTURE.md`: **doesn't exist yet.** You and the human write it at G0.
- Agents in `.claude/agents/`:
  - builders: backend-engineer, frontend-engineer, infra-engineer
  - gate-reviewer (adversarial, read-only)
  - tech-writer
- Skills:
  - `building-express5-apis`
  - `writing-react19-client-state`
  - `checking-ui-accessibility`
- Lint template: `.claude/templates/eslint.config.mjs`

## Mode
The kickoff message names the mode.
- **Attended (the default):** a human reviews. At each gate, present the packet and **wait** for "Approved" or "Change X because Y". Apply the requested changes before you move on.
- **Unattended:** no human. Write the packets and mark the gates, but don't pause. Make the smaller choice and log it. If you're truly blocked, run `.claude/hooks/mark.sh "BLOCKED: <reason>"` and stop.

## Timebox
3 hours. At the start, run `.claude/hooks/mark.sh "RUN START"` and `date -u`. Mark every phase boundary and check `date -u` at each one. **Feature freeze at T+2:40.**

| Clock | Phase | Exit criteria | Gate |
|---|---|---|---|
| 0:00–0:25 | G0: plan | `docs/ARCHITECTURE.md` committed and approved | G0 |
| 0:25–0:40 | 0: foundation | scaffold, pinned deps, lint, contract, schema + migration, skeletons, `verify` green | G1 |
| 0:40–1:25 | 1: parallel build | the three branches reviewed, approved and integrated; `verify` green | G2 (per branch) |
| 1:25–1:45 | 2: integrate | clean full stack; every AC walked through by you, then by the human | G3 |
| 1:45–2:05 | 3: final review | the gate-reviewer's final mode and the mock grade, triaged | G4 |
| 2:05–2:40 | 4: fixes + docs | fixes integrated; facts in the README; the human writes the write-up and AI note | G5 |
| 2:40–3:00 | ship | fresh-clone check; the human reads the log and pushes | — |

## The gate protocol (every gate)
1. **A fresh gate-reviewer goes first.** Launch a **new** `gate-reviewer` (never reuse one) with the mode (`plan`, `diff` or `final`) and the exact scope. It runs in the foreground; wait for it.
2. **Fix before the human sees it.** Send blockers and majors back to the **same** specialist that wrote the code (message it, so it keeps its context), and check the fixes yourself. Record minors you decide to skip, with one line each.
3. **Write the packet** to `.run/review-gates.md` and print it:
   ```
   ## G<n>: <name> (<date -u>)
   Changed: <what exists now>
   Reviewer: <verdict>; fixed: <list>; skipped: <list + why>; open for you: <list>
   Read first: <3–6 exact files, most important first>
   Diff: git diff <from>..<to> -- <paths>
   Budgets: <area actual/budget>
   Decide: <2–4 questions only a human can answer>
   Human-reviewed? <ask: "Did you read these commits? (yes/no)". Only a yes gets a review tag at ship.>
   Suggested time: <minutes>
   ```
4. Run `.claude/hooks/mark.sh "REVIEW GATE G<n>"`. **Attended: wait.**
5. **Record what the human actually reviewed.** After the gate's commits are on `main`, append `Reviewed on main: <first-sha>^..<last-sha> (yes|no)` to the packet. These lines become the review tags at ship.
6. **Record the human's decision.** Each "Change X because Y" becomes a DECISIONS row with `Source: human`. If it rejects AI output, it also becomes an AI-LOG row with `Caught by: human`. These rows go into the commit that implements the change.

**What the human reads at each gate (keep this tiering):**

| Gate | Human depth | Reviewer depth |
|---|---|---|
| G0 plan | Co-author, then read all of it | `plan` mode |
| G1 foundation | Read the contract, schema, migration and constraints | `diff` |
| G2 backend | Read the code that enforces the core invariants (transactions, constraints), the extension points, and the test list | `diff` |
| G2 frontend, infra | Skim the packet only (about 3 min); judges hands-on at G3 | `diff` (does the code reading) |
| G3 hands-on | Every primary flow end to end on desktop and phone, each error and limit state, a keyboard pass | — |
| G4 final | Fix-or-defer on each finding; bloat check | `final` with mock grade |
| G5 docs | **Writes** the design write-up and AI note; reads `git log` | — |

**Parallel branches:** keep a queue. Present one packet at a time, backend first, then frontend and infra in arrival order. A specialist whose branch is waiting for review stays idle, so it keeps its context for fixes.

## G0: plan (attended): the architecture wizard
Run this as a guided conversation, one step at a time. **The human decides; you propose options, record decisions, and write.** Never present a finished design to accept wholesale.

0. If `docs/SPEC.md` is missing, ask the human to add it, and wait. Then run `.claude/hooks/mark.sh "RUN START"` and `date -u`.
1. **Brief.** Summarize the spec in 10 lines or fewer: users, primary flows, hard requirements, deliverables, how it's evaluated, and explicit non-goals. Ask: "Anything I've misread?"
2. **Walk these topics in order.** For each: state what the spec requires, offer 2–3 options with one-line tradeoffs, ask for a decision, then **echo the decision back in one line** before you move on.
   1. **Stack and versions.** Check current versions with `npm view <pkg> dist-tags` before pinning. Flag RCs and majors that break peer dependencies.
   2. **Domain model.** Entities, fields, relationships. Which values are copied at creation time, and which stay linked?
   3. **Invariants.** What must never be violated, and **where each is enforced**: a database constraint, a transaction, the API. For every invariant, ask "what happens when two requests interleave?"
   4. **Extension points.** What must be addable without touching core code, and how a test proves it.
   5. **API contract and errors.** Endpoints, the error envelope, error codes, precedence when several errors apply.
   6. **UX per flow.** Inputs, every state (loading, empty, error, each limit state), and what replaces an action that can't succeed.
   7. **Accessibility scope.** What's in and what's explicitly out.
   8. **Run and infra.** The one-command start, ports, optional services (opt-in, never default), anything public-facing.
   9. **Testing.** A named test list: one test per invariant and primary flow, plus error classes.
   10. **Budgets.** Source and test lines per area.
   11. **Cuts.** What's deliberately not built, and why.
   12. **Known pitfalls.** Ask: "Any pitfalls you want written in as explicit rules?" Record each one as an AC or a convention.
3. **Draft `docs/ARCHITECTURE.md`** from the decisions, with these sections:
   - ACs (each traced to a spec line or a named human decision)
   - system overview with a service diagram (Mermaid)
   - domain model with a data-model diagram (Mermaid)
   - invariants and enforcement
   - extension points
   - API contract
   - frontend (including the accessibility scope)
   - containers
   - testing (named tests)
   - **budgets**
   - dependency manifest
   - work breakdown
   - non-goals and cuts
4. Fill CLAUDE.md's Stack, Commands and Layout sections from the decisions.
5. Run the gate-reviewer in `plan` mode, apply its findings, and present the draft plus the findings to the human.
6. On approval, commit `docs: architecture, acceptance criteria and key decisions` (with CLAUDE.md), with a DECISIONS row for each human call (`Source: human`). → **G0**

## Phase 0: foundation (you, alone)
1. **Scaffold** the workspaces and root scripts. **`verify` = `typecheck && lint && test`.** Copy `.claude/templates/eslint.config.mjs` to the root, and install the lint packages in the manifest.
   - Scope tsconfig and Vitest `include` to `apps/**` and `packages/**`.
   - Create `.env.example` and a matching `.env`.
2. **Install the whole manifest at pinned versions.** Specialists never touch lockfiles.
3. **Contract, schema and migration:**
   - the shared contract with every error code
   - the Prisma schema with its CHECK constraints in the migration
   - `docker compose up -d db`, plus a test global setup that **creates the test database if it's missing**, migrates it and empties it. Worktrees each use their own database name; see CLAUDE.md → Environment rules.
4. **Skeletons:** API config, error handler, health check (per the `building-express5-apis` skill); a web router with per-route titles; the query client. Get `verify` green with one smoke test.
5. **Commit on `main`, in 2–4 commits.** → gate-reviewer `diff` on `<kit commit>..HEAD` → **G1**

## Phase 1: dispatch the specialists in parallel
Launch backend-engineer, frontend-engineer and infra-engineer **in the same turn**, in the background, each in its own worktree. Give each a self-contained prompt:
```
Task: <one sentence>
Read first: CLAUDE.md, docs/ARCHITECTURE.md sections <list>, ACs <list>
Scope (you own): <paths>
Acceptance criteria: <AC-n list>
Tests: <the named tests for your area, from ARCHITECTURE → Testing>
Budgets: <src LOC / test LOC for your area>
Constraints: contract frozen (flag changes); no new deps; stay in your paths; commit policy in CLAUDE.md.
When done: npm run verify green; reply with your agent's report format.
```
While they work, prepare the G3 walkthrough checklist. Don't edit files they own.

### Integrating a branch (after its G2 approval)
1. Run `git cherry-pick main..<branch>`. **History stays linear:** no merge commits. `.gitattributes` unions the DECISIONS and AI-LOG appends.
2. **Conflicts:** the owner's version wins inside its own paths. Resolve, then `git cherry-pick --continue`.
3. **Re-verify on `main`:** `npm ci && npm run db:generate && npm run verify`. Fix trivial integration issues yourself in a small `fix:` commit. Anything else goes back to the owner.

## Phase 2: integrate and walk through
1. **Clean full stack:** `docker compose down -v && docker compose up --build -d`. Wait for the web app and `/api/health`.
2. **Walk through every AC** in a browser (curl if no browser tool):
   - every primary flow end to end
   - every limit and error state the ACs name
   - each extension point's defaults
   - unknown routes and ids (404)
   - generated files (contents and headers)
   - 390px width
   - keyboard only

   Route failures to their owners.
3. **Optional visual QA pass** (only if it's before T+1:35): a **fresh** frontend-engineer with a 15-minute cap. Scope: spacing and alignment consistency, every state rendered, hover/focus/active states, tap targets, 390px and 1280px. **No new features or components.**
4. → **G3:** the human does the hands-on pass. Their fixes go to the owners, with DECISIONS rows.

## Phase 3: final review
Launch a fresh gate-reviewer in `final` mode on the whole repo, including the mock grade and budgets. Triage the findings: blockers and majors go to their owners, and each skip gets one line in DECISIONS. → **G4** (the human decides fix or defer, and looks at the bloat numbers)

## Phase 4: fixes and docs
1. Integrate the G4 fixes.
2. Dispatch the tech-writer. It writes the README's factual sections (run steps, notes on optional services, cut list, layout) and drafts raw material into `.run/writeup-notes.md`. **The human writes the design write-up and the AI note.** → **G5**
3. **Fresh-clone check:** `git clone . /tmp/fresh-<ts>`, then `docker compose up --build -d` in the clone, then smoke-test the main flow, then tear it down and `rm -rf /tmp/fresh-<ts>`.
4. **Pre-push check:**
   - `git log --oneline` reads as a story: every subject is specific (CLAUDE.md → Commit policy), with no `fixup!`, merge or log-only commits. Show the human any vague subject, and fix it only on unpushed commits with their approval.
   - `grep -nE "<!-- *AUTHOR|TODO:" README.md` is empty
5. **Tag what the human reviewed.** For every gate whose packet says `Reviewed on main: … (yes)`, create an annotated tag on the last commit of that range:
   `git tag -a reviewed/<gate> <last-sha> -m "Human review at <gate> (<date -u>): <decision>. Commits reviewed: <sha subject, one per line>"`
   Gate names: `g0-plan`, `g1-foundation`, `g2-backend`, `g2-frontend`, `g2-infra`, `g3-hands-on`. List them with `git tag -n20 -l 'reviewed/*'` for the human.
   - `docs/SPEC.md` is untracked
6. Mark `"RUN COMPLETE"`. The human pushes with `git push -u origin main --follow-tags`. **You never push.**

## Rules
- **Specialists own their paths.** Your integration fixes stay minimal and are named in their commit.
- **Check claims before you trust them.** "Tests pass" means you ran `verify` on `main`.
- **Stop every process you start**, using `timeout` or a kill by PID. Leave nothing listening except the compose stack.
- **Scope is ARCHITECTURE's ACs, and nothing else.** When unsure, pick the smaller option and log it.
- **Never push, never rewrite merged history, and never delete `.run/`.**
