---
name: building-express5-apis
description: Pitfalls and patterns for Express 5 HTTP APIs in TypeScript. Covers what silently changed from Express 4, an error handler that never turns a client error into a 500, startup and shutdown, proxy and origin handling, and the few tests that catch these failures. Use when writing or reviewing Express routes, middleware, error handlers, server startup, or code that builds URLs from the request.
---

# Building Express 5 APIs

Most Express code on the internet is Express 4. Code written from that memory typechecks and passes happy-path tests in Express 5, but fails on error paths. **Every rule below comes from a failure observed in a real build.**

## 1. What changed in Express 5 (source: expressjs.com/en/guide/migrating-5.html)

| Express 5 behavior | Consequence |
|---|---|
| Rejected promises from async handlers go to the error handler | No `try/catch` or `asyncHandler` wrappers. Just `throw`. |
| `req.body` is `undefined` unless a parser matched | Validate `req.body ?? {}`, or let zod report "expected object" |
| `app.listen(port, cb)` passes errors to `cb(err)` | An ignored `err` means EADDRINUSE logs "listening" and hangs (§3) |
| Wildcards must be named (`/*splat`); optional segments use `{.:ext}`; no regex characters in paths | Old `'*'` routes throw at startup |
| `req.query` is a read-only getter, with the "simple" parser by default | Don't assign to it. Nested `a[b]=1` isn't parsed. |
| `req.host` keeps the port | Use it to build origins (§4) |
| `res.status()` takes integers 100–999 only; `res.redirect(status, url)` | Old argument orders throw |
| `express.urlencoded()` defaults to `extended: false` | Set it explicitly if you need nested forms |

## 2. The error handler: client errors are never 500s
Map in this order. The third branch is the one models forget:

```ts
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) return res.status(err.status).json(envelope(err.code, err.message, err.details));
  if (err instanceof ZodError) {
    const { formErrors, fieldErrors } = z.flattenError(err);          // keep BOTH
    return res.status(400).json(envelope('VALIDATION_FAILED', formErrors[0] ?? 'Invalid input', { formErrors, fieldErrors }));
  }
  const status = err?.status ?? err?.statusCode;                       // body-parser / http-errors
  if (Number.isInteger(status) && status >= 400 && status < 500 && err.expose)
    return res.status(status).json(envelope('BAD_REQUEST', err.message));   // 400 bad JSON, 413 too large, 415 charset…
  console.error(err);
  return res.status(500).json(envelope('INTERNAL', 'Something went wrong'));
};
```
- **Don't** whitelist body-parser `type`s one at a time (`entity.parse.failed`, `entity.too.large`). The next type, such as `charset.unsupported` or `encoding.unsupported`, becomes a 500.
- Mount it **last**, after the 404 handler.

## 3. Startup and shutdown
```ts
const server = app.listen(config.PORT, (err?: Error) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`api listening on :${config.PORT}`);
});
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => server.close(() => process.exit(0)));
```

## 4. Behind a proxy: origin and headers
- Use `app.set('trust proxy', 1)` for the **number of hops** (one nginx). Don't use `true`: then any client can spoof `X-Forwarded-*`.
- Build the origin as `` `${req.protocol}://${req.host}` ``. A configured override (`PUBLIC_WEB_URL`) wins when set.
- The proxy must forward `Host $http_host` (it keeps the port) and `X-Forwarded-Proto`.

## 5. Cheap hardening (do it, don't discuss it)
- `app.disable('x-powered-by')`. Use `helmet()` only if it's in the dependency manifest.
- Limit body parser size: `express.json({ limit: '10kb' })`.

## 6. Mapping data to responses never throws
A DTO mapper used by a **list** endpoint must degrade, not throw. If a referenced lookup row (a category, a plan) is missing, show its id as the label. One bad row must not 500 the whole list, and it must not take down a calendar view.

## 7. Transactions (Prisma)
- When correctness depends on isolation, state it explicitly: `prisma.$transaction(fn, { isolationLevel: 'ReadCommitted' })`. A guarded `updateMany` relies on READ COMMITTED re-checking the WHERE clause after the row lock is released.
- Throwing inside the callback rolls back. Map `P2002` (unique violation) to 409 **inside** the transaction's error path.

## 8. Tests that catch these failures (one per class, not per endpoint)
1. Malformed JSON gives 400 with the envelope.
2. `Content-Type: application/json; charset=latin1` gives 415 with the envelope, **not 500**.
3. An oversized body gives 413 with the envelope.
4. An unknown route gives 404 with the envelope.
5. Validation errors include the field name in `details.fieldErrors`.

Never assert the same 404 or 400 once per endpoint. One table-driven `it.each` covers them.

## Review checklist
- [ ] No `try/catch` that only calls `next(err)`, and no async wrapper helpers
- [ ] The error handler has the generic `status`/`expose` 4xx branch, and keeps `formErrors`
- [ ] The `app.listen` callback handles `err`, and SIGTERM closes the server
- [ ] `trust proxy` is a hop count, and origins come from `req.protocol` + `req.host`
- [ ] `x-powered-by` is disabled, and the JSON body limit is set
- [ ] No `throw` in DTO mappers used by list endpoints
- [ ] Wildcard and optional route syntax is Express 5 style
