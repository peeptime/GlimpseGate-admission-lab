# ITERATION-GUIDE-2.4.0 — Gate GUI v3

```yaml
provenance:
  authors: project_owner + Claude (Hyperagent, AI-assisted)
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  audit_ref: docs/DASHBOARD.md
```

## Why This Release

The owner asked for a GUI that is humane and has real motion design, in a
simple, fractal, Houdini-like direction, together with packaging, frontend,
backend, and architecture work. Auditing the old GUI found that its biggest
problem was not visual: the GUI did not use the SDK, and the server had no
request guard. Both were fixed before the visual work, and the visual work
was built on top of them.

## Read Order

1. `docs/DASHBOARD.md` (architecture, API, design rationale)
2. `scripts/dashboard/admission-api.mjs`
3. `dashboard/app/views/gate.js`

## Owner Decisions Needed

- Review v3 on a real screen; list anything from `/classic/` that is still used.
- When to remove `/classic/`.
- Whether to add a light theme.

## Next Steps

- Remove `/classic/` once v3 covers what is still used there.
- Automated visual smoke test (headless browser in CI) if the GUI keeps changing.
- The method work from 2.3.0 (choice gate vs. automatic typing disagreement ledger) is still the most important open item. The Gate view is now a suitable place to record those choices.

## Validation

```bash
npm test               # includes dashboard API contract + security tests
npm run dashboard:check
npm run dashboard      # manual: http://127.0.0.1:4788
```
