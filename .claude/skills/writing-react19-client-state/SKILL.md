---
name: writing-react19-client-state
description: Rules for React 19 component state and TanStack Query v5 server state that keep components simple and correct. Covers deriving instead of syncing, resetting with key, when an Effect is legitimate, refs, never patching third-party DOM, queryOptions factories, parsing responses with the shared schema, and mutations. Use when writing or reviewing React components, hooks, forms, or data fetching.
---

# Writing React 19 client state

Most React code in training data predates "You Might Not Need an Effect" (react.dev, 2023) and TanStack Query v5. The failure mode is code that **works and passes tests but is wrong**: state synced through Effects, setState during render, refs read during render, and library DOM patched by hand. **Every rule below comes from a failure observed in a real build.** Lint (`eslint-plugin-react-hooks` recommended plus `@tanstack/eslint-plugin-query` `flat/recommended-strict`) catches the unconditional cases. **The conditional cases are on you.**

## Component state
1. **Derive, don't sync.** If a value can be computed from props, state or query data, compute it during render.
   - ❌ `useEffect(() => { if (a !== b) setMessage(...) }, [a, b])`
   - ✅ `const message = a !== b ? ... : ''`
2. **Reset with `key`, not with an Effect or setState during render.** When the route param changes, local state must reset: `<BookingForm key={id} workshop={workshop} />`.
   - ❌ `if (data && x === undefined) setX(data.y)` during render
   - ✅ Mount the child once data exists, and use a `useState` initializer: `useState(() => data.y)`.
3. **Effects only synchronize with external systems:** subscriptions, timers, imperative DOM APIs. Work caused by an **event** (submit, click, mutation success) goes in that handler or in the mutation's `onSuccess`, not in an Effect watching state.
4. **Refs are not render inputs.** Never read `ref.current` during render, and don't pass ref-derived values as props during render (`react-hooks/refs`).
5. **Moving focus to new content:** render the new view with `<h1 tabIndex={-1} ref={focusOnMount}>`, where `const focusOnMount = (el: HTMLElement | null) => el?.focus()`. No Effect and no state.
6. **Never patch third-party DOM.** No `MutationObserver`, no `querySelector` into a library's internals, no rewriting its attributes. Use the library's documented options and render hooks. If it can't do something, accept the limit and log it as a cut.

## Server state (TanStack Query v5)
7. **`queryOptions()` factories** with hierarchical keys, shared by hooks, prefetching and invalidation:
   ```ts
   export const workshopQueries = {
     all: ['workshops'] as const,
     list: (range: Range) => queryOptions({ queryKey: ['workshops', 'list', range], queryFn: () => api.listWorkshops(range) }),
     detail: (id: string) => queryOptions({ queryKey: ['workshops', 'detail', id], queryFn: () => api.getWorkshop(id) }),
   };
   ```
8. **Use `skipToken` for "not ready yet"**, not `enabled: false` plus a non-null assertion (`range!`).
9. **Parse every response with the shared contract schema** in the API client: `WorkshopDto.parse(json)`. **Never `as T`.** The contract package exists so the client doesn't trust shapes blindly.
10. **Query data stays in the cache.** Never copy it into `useState`. Derive UI status (open, full, closed) from `query.data` plus mutation state.
11. **Mutations:** `onSuccess: () => queryClient.invalidateQueries({ queryKey: workshopQueries.all })`. Disable submit with the native `disabled={mutation.isPending}`, and map the server's error envelope to field errors. **One validation source:** the server and the shared zod schema. Don't hand-copy rules into the client.

## React 19 specifics
- Put `<title>` inside the page component, with a single string child: `` <title>{`Book a seat · ${name}`}</title> ``.
- Use `useId` for ids in reusable components.
- `useActionState` and form actions are optional. Don't mix them with TanStack mutations in the same form.

## Review checklist
- [ ] `grep -n "useEffect" -A6 src` shows no `set*(` that derives from props, state or query data
- [ ] There's no setState in a component body outside handlers
- [ ] Route-param pages reset with `key`
- [ ] There's no `MutationObserver` or `querySelector` against library markup
- [ ] Every query uses a `queryOptions` factory; there's no `enabled` + `!`
- [ ] The API client parses success bodies with the shared schemas, with no `as T`
- [ ] Query data is never copied into `useState`
- [ ] Lint is clean, with no inline disables
