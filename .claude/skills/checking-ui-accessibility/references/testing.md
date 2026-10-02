# Testing accessibility

## Contents
- Automated axe checks in Vitest + jsdom
- What jsdom can't check, and what to do instead
- Contrast tests for design tokens
- Manual pass (the part automation misses)

## Automated axe checks in Vitest + jsdom

Call `axe-core` directly. Don't add a wrapper package.

```ts
// test/axe.ts
import axe from 'axe-core';
import { expect } from 'vitest';

export async function expectNoAxeViolations(container: Element) {
  const { violations } = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false }, // jsdom has no layout or paint; contrast is tested separately
      region: { enabled: false },           // components rendered alone sit outside the app's landmarks
    },
  });
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}
```

```ts
// src/pages/BookingPage.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe';

it('full workshop: shows the state, not the form, with no axe violations', async () => {
  mockWorkshop({ status: 'full' });                     // stub fetch or the API client
  const { container } = renderAt('/workshops/w1/book'); // your providers + router helper
  expect(await screen.findByText(/this workshop is full/i)).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /name/i })).toBeNull();
  await expectNoAxeViolations(container);
});
```

**Rules:**
- **Run axe once per page state:** loading, empty, error, validation errors shown, each business state (full, closed…), and success. Most violations only exist in one state.
- **Never run `axe.run` concurrently.** Keep the tests in a file sequential (the default). Parallel calls throw "Axe is already running".
- **Assert behavior with roles and names** (`getByRole('button', { name: /book/i })`) alongside axe. That also proves each control has an accessible name.
- **Focus assertions work in jsdom:**
  ```ts
  await user.click(submit);
  expect(await screen.findByRole('heading', { name: /you're booked/i })).toHaveFocus();
  ```
- **Page titles are testable:** with React 19, `<title>` renders into `document.head`, so assert `document.title` after navigating.

## What jsdom can't check, and what to do instead
| Can't check in jsdom | Do instead |
|---|---|
| Color contrast | A token contrast test (below), plus a browser pass on final colors |
| Visible focus indicator | Manual keyboard pass. Make sure theme tokens define a focus-ring color with ≥ 3:1 contrast against its neighbors. |
| Reflow at 320px or 400% zoom, target size | A browser at 390px width and 200% zoom |
| Screen-reader announcements | Assert that live regions exist before their content changes, then do a VoiceOver smoke test |

## Contrast tests for design tokens
Put the colors in one module (or read them from the Tailwind `@theme` block) and test every text/background pair that's actually used:

```ts
// src/theme/contrast.test.ts
import { ratio } from './contrast'; // copy of the skill's scripts/contrast.mjs logic, typed
const pairs = [
  { name: 'body on panel', fg: tokens.text, bg: tokens.panel, min: 4.5 },
  { name: 'muted on panel', fg: tokens.textMuted, bg: tokens.panel, min: 4.5 },
  { name: 'chip text on each category color', fg: tokens.chipText, bg: categoryColor, min: 4.5 }, // one row per color
  { name: 'focus ring vs panel', fg: tokens.focus, bg: tokens.panel, min: 3 },
];
it.each(pairs)('$name ≥ $min:1', ({ fg, bg, min }) => expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min));
```

For a one-off check, use `node scripts/contrast.mjs '<fg>' '<bg>' [min]` (alpha supported, e.g. `#ffffff99`). Never estimate contrast by eye.

**Text on a gradient or image:** test against the lightest point behind the text. Better, put the text on a solid or translucent panel and test against the panel's composited color.

## Manual pass (the part automation misses)
Automated tools catch roughly a third of WCAG failures. Before calling UI done:
1. **Keyboard only, from the address bar:**
   - Can every action be reached and triggered?
   - Is focus always visible and never trapped?
   - Does focus land somewhere sensible after each navigation and submit?
2. **390px width and 200% zoom:** no horizontal scroll, and nothing clipped or overlapping.
3. **Screen-reader smoke test** (VoiceOver: Cmd+F5): page title on navigation, form labels and errors, and success and error announcements.
4. **`prefers-reduced-motion: reduce`** (DevTools → Rendering): no non-essential motion.
