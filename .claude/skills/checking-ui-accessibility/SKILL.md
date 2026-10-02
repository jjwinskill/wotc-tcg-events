---
name: checking-ui-accessibility
description: Audits and builds web UI to WCAG 2.2 AA, focused on the failures reviews commonly miss in single-page apps. These are actions still offered when they can't succeed, focus and titles on client-side navigation, silent dynamic changes, form validation and date/time input strategy, and themed or third-party widget contrast. Provides a per-state audit procedure, React fix patterns, axe-core test setup and a contrast-ratio script. Use when writing or reviewing UI components, forms, routing, themes, or when accessibility, a11y, WCAG, screen readers, keyboard or focus come up.
---

# Checking UI accessibility

**Project scope wins.** When the project's architecture defines an accessibility scope, build and audit only those items, and report the rest as deferred. Prefer native semantics (labels, `disabled`, `fieldset`, headings) over imperative focus or announcement code, and never sync state through Effects to drive announcements (see `writing-react19-client-state`).

**Standard: WCAG 2.2 AA.** Automated tools catch roughly a third of failures, so never claim conformance from axe results alone. Use this skill in two modes:
- **Build:** apply the patterns while writing UI.
- **Audit:** run the procedure below and report findings in the output format.

## Commonly missed: check these first
These pass casual review and automated scans, and they break real users. For each one, check every render state, not only the default view.

1. **Actions offered when they can't succeed.** A form, button or link stays usable when the domain state says it will fail (full, closed, sold out, expired, not permitted). Users complete the task and only then learn it was impossible.
   - A warning banner next to a live form **does not** fix this.
   - **Fix:** replace the action with the state (a heading, the reason, the next step) and keep the server as the source of truth. When a submit loses a race, switch to the same state and focus its heading. → patterns.md §1
2. **Client-side navigation is silent.**
   - Each route needs its own document `title` (for example "Book a seat · App"), in every branch: loading, not found, success.
   - **And** focus must land on the new page's h1 after an in-app navigation, but not on the initial page load. Otherwise focus sits on `<body>` or a removed element, and screen-reader users aren't told the page changed.
   - → patterns.md §2
3. **Content replaced under focus.** A success view, error view or re-render removes the focused element, so focus drops to `<body>`. Move focus to the new content's heading. A `role="status"` region inserted already filled is often not announced; live regions must exist before their text changes. → patterns.md §3
4. **Validation strategy.**
   - **One source of errors:** use `noValidate` on the form (keep `required` and similar attributes for their semantics) so browser bubbles don't pre-empt or contradict the app's accessible errors.
   - **On a failed submit:** focus an error summary whose items **link to** each invalid field, and mark those fields `aria-invalid` with `aria-describedby` pointing at their messages.
   - **Clear only the error for the field being edited**, never all of them.
   - → patterns.md §4
5. **Date and time inputs.** Avoid `datetime-local`: its segmented spinbuttons and picker popups behave inconsistently across browsers and assistive tech, and it can't express business rules like "30-minute slots". Use `<input type="date" min=…>` plus a labelled `<select>` of allowed times, grouped in a `fieldset`/`legend`. Block past or invalid dates on the server too. → patterns.md §5
6. **Silent dynamic changes.**
   - Values that change without user action (seats left, auto-filled defaults when a related field changes, results counts) need a **persistent** polite live region, or should be put where focus already is.
   - **Controls disabled until a prerequisite is met** need a visible hint saying so, tied with `aria-describedby`. Disabled controls are skipped by the Tab key and by screen-reader form navigation.
   - → patterns.md §6
7. **Pending submit buttons.** `disabled` on the focused button can drop focus, and it changes the label silently. Use `aria-disabled="true"` plus a guard in the handler, and announce "Saving…" through a persistent status region. → patterns.md §7
8. **Third-party widgets (calendars, date pickers, carousels).** Their default CSS often removes focus outlines, fades text with `opacity`, uses low-contrast default colors, or truncates at zoom.
   - Inspect the library's defaults and theme them through its CSS variables.
   - Grid views (month calendars) need a list/agenda alternative for small screens and screen readers.
   - "+N more" popovers must be keyboard reachable and must return focus when they close.
   - → patterns.md §8
9. **Images that carry information** (QR codes, charts): `role="img"` plus an `aria-label` saying what it is and what it links to, and a visible text alternative (the URL or the data). → patterns.md §9

## Also verify (usually caught, still required)
- **Names and semantics:**
  - every control has a programmatic label; icon-only buttons have names
  - headings are in order with one h1
  - landmarks (`header`, `main`, `nav`)
  - lists and definition lists use the right elements
- **Contrast** (compute it, never estimate it: `node <this skill folder>/scripts/contrast.mjs <fg> <bg> [min]`; in a project that is usually `.claude/skills/checking-ui-accessibility/scripts/contrast.mjs`):
  - Tailwind 4 palette colors are OKLCH. Use the theme's hex tokens or the browser's computed colors, and say so when you approximate.
  - text ≥ 4.5:1 (large text ≥ 3:1)
  - **non-text ≥ 3:1**: input borders, focus indicators, meaningful icons (1.4.11)
- **Keyboard:**
  - everything reachable and operable, no traps
  - focus visible (2.4.7) and not hidden behind sticky UI (2.4.11)
- **Layout:**
  - reflow at 320 CSS px and text at 200% without loss (1.4.10, 1.4.4)
  - targets ≥ 24×24 px (2.5.8)
- **Other:**
  - motion respects `prefers-reduced-motion`
  - error messages say what's wrong and how to fix it (3.3.1, 3.3.3)
  - meaning isn't conveyed by color alone (1.4.1)

## Audit procedure
1. **List the states** for each route or component in scope: loading, empty, error, validation errors shown, **each business state** (full, closed, expired…), success, and not found. Read every rendering branch; most findings live in the non-default ones.
2. **For each state**, walk "Commonly missed", then "Also verify".
3. **Third-party widgets:** check their default CSS and interaction behavior (item 8).
4. **Compute contrast** for every concrete color pair you're unsure about, using the script.
5. **Report** in this format. Every finding needs a file:line and a concrete fix. Don't pad.

```
Findings (most severe first):
1. [high|medium|low] <title> — WCAG <number + name> — <file>:<line>
   State: <which render state>   Who/what: <who is affected and what goes wrong>
   Fix: <smallest concrete change>
Done well: <brief>
Not verifiable from code: <what needs a browser, zoom or screen-reader pass>
```

**Severity:**
- **high:** blocks completing the task, loses the user's place or focus, or misleads (an action offered that can't succeed)
- **medium:** significant friction or an AA failure with a workaround
- **low:** polish

## Build mode
Apply the patterns in [references/patterns.md](references/patterns.md) as you write each view. Then test every state with axe, and test focus behavior, as described in [references/testing.md](references/testing.md). Include a contrast test over the theme's tokens. Finish with the manual pass in testing.md before calling UI done.
