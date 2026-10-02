# Fix patterns (React 19 + React Router)

## Contents
1. State instead of action
2. Page titles and focus on navigation
3. Focus after content is replaced
4. Validation: error summary and field errors
5. Date and time inputs
6. Silent dynamic changes
7. Pending submit buttons
8. Third-party widgets
9. Informative images (QR codes)

## 1. State instead of action
```tsx
if (workshop.status !== 'open') {
  return (
    <section aria-labelledby="state-heading">
      <h1 id="state-heading" ref={focusIfNavigated} tabIndex={-1}>
        {workshop.status === 'full' ? 'This workshop is full' : 'Booking is closed'}
      </h1>
      <p>{workshop.name} · {formatWhen(workshop)}</p>
      <a href={inviteUrl(workshop.id)}>Add to calendar</a> {/* a useful next step */}
    </section>
  );
}
```
- The server still enforces the rule. If a submit returns 409 FULL or CLOSED, re-render this state (for example by refetching, or by setting a local status) and focus its heading.
- Don't render a disabled form "for context". It invites wasted effort and is skipped by assistive tech anyway.

## 2. Page titles and focus on navigation
```tsx
// React 19 moves <title> into <head>. The child must be a single string (use a template literal).
<title>{`Book a seat at ${workshop.name} · App`}</title>
```
Give **every branch** a title: loading ("Loading… · App"), not found, success.

```tsx
// Focus the page heading after an in-app navigation, but not on the initial page load.
import { useLocation } from 'react-router';
export function PageHeading({ children }: { children: React.ReactNode }) {
  const { key } = useLocation(); // 'default' on the initial entry
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (key !== 'default') ref.current?.focus(); }, [key]);
  return <h1 ref={ref} tabIndex={-1} className="focus:outline-none">{children}</h1>;
}
```
Render `PageHeading` in every state, loading included, so focus has somewhere to land while data loads.

## 3. Focus after content is replaced
```tsx
const focusOnMount = (el: HTMLElement | null) => el?.focus();

if (mutation.isSuccess) {
  return (
    <section aria-labelledby="done">
      <h1 id="done" ref={focusOnMount} tabIndex={-1}>You're booked for {workshop.name}</h1>
      ...
    </section>
  );
}
```
Moving focus to the heading makes screen readers read it, so no live region is needed. Use live regions only when focus must stay where it is (§6), and keep the region mounted before its text changes.

## 4. Validation: error summary and field errors
```tsx
<form noValidate onSubmit={onSubmit}>
  {errors.length > 0 && (
    <div ref={summaryRef} tabIndex={-1} aria-labelledby="err-title" className="…">
      <h2 id="err-title">Fix {errors.length === 1 ? 'this error' : `these ${errors.length} errors`}</h2>
      <ul>
        {errors.map((e) => (
          <li key={e.path}>
            <a href={`#${e.path}`} onClick={(ev) => { ev.preventDefault(); document.getElementById(e.path)?.focus(); }}>
              {LABELS[e.path]}: {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )}
  {/* fields: id matches e.path; aria-invalid and aria-describedby point at the inline message */}
</form>
```
- After a failed submit: `useEffect(() => { if (errors.length) summaryRef.current?.focus(); }, [submitCount])`.
- Keep `required`, `min` and similar attributes for their semantics. `noValidate` only stops the browser's bubbles.
- When the user edits a field, clear **that field's** error only. Leave the summary until the next submit.

## 5. Date and time inputs
```tsx
<fieldset>
  <legend>Start</legend>
  <label htmlFor="date">Date</label>
  <input id="date" type="date" min={todayLocalISO()} value={date} onChange={…} required />
  <label htmlFor="time">Start time</label>
  <select id="time" value={time} onChange={…} required>
    {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)} {/* "6:00 PM" */}
  </select>
</fieldset>
```
- Combine them in **local** time, then send ISO UTC: `new Date(\`${date}T${time}\`).toISOString()`. Unit-test that conversion.
- Default the date to today, so the empty "mm/dd/yyyy" placeholder never shows.
- `min` doesn't stop typed past dates in every browser, so validate on both the client and the server.

## 6. Silent dynamic changes
```tsx
{/* Mounted in every state; only its text changes. */}
<p aria-live="polite" aria-atomic="true">{workshop.capacity - workshop.bookedCount} of {workshop.capacity} seats left</p>
```
- **Auto-filled values** (for example, choosing a plan sets its defaults): put the new values in a hint tied to the changed controls, or announce once through a persistent polite region ("Duration set to 2 hours, capacity 16"). Don't announce on every keystroke.
- **Dependent controls:** prefer keeping them enabled, with a placeholder option. If you do disable them, add a hint ("Choose a plan first") linked with `aria-describedby`.
- **Don't nest `role="alert"` inside another live region.** Use one region per message stream.

## 7. Pending submit buttons
```tsx
<button type="submit" aria-disabled={pending || undefined} className="aria-disabled:opacity-60 …">
  {pending ? 'Booking…' : 'Book'}
</button>
<p role="status" className="sr-only">{pending ? 'Booking…' : ''}</p>
// in onSubmit: if (pending) return;
```

## 8. Third-party widgets
Check the library's default stylesheet for each of these:
- **Focus outlines removed** (`outline: 0`) and replaced with faint shadows. Restore a ≥ 3:1 `:focus-visible` outline.
- **Text faded with `opacity`** (adjacent-month days, past items). Use a solid muted color instead, and compute its contrast.
- **Default event or item colors.** Theme them through the library's CSS variables (for example, a calendar library such as FullCalendar exposes `--fc-*`) with checked pairs.
- **Truncation.** Titles that don't wrap at narrow widths or zoom. Put key status words first ("Full: …") and allow wrapping.

For grid views, also:
- provide an agenda/list view, the default below about 768px
- cap items per cell and use a "+N more" control; confirm the popover is reachable by keyboard, closes on Escape, and returns focus
- make past or unavailable cells non-interactive, conveyed in text, not only by color

## 9. Informative images (QR codes)
```tsx
<QRCodeSVG value={url} role="img" aria-label={`QR code: booking link for ${workshop.name}`} />
<a href={url}>{url}</a> {/* visible text alternative, also useful on the same device */}
```
