# ITERATION-GUIDE-2.5.0 — Feedback Language

```yaml
provenance:
  authors: project_owner (direction) + Claude (Hyperagent, AI-assisted)
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  audit_ref: CHANGELOG.md#250
```

## Why

2.4.1 made the UI chrome readable, but everything the SDK says (fixes, gaps,
options) was still English, and the SDK's checklist was Chinese-only. The
same feedback serves three ecosystems with different needs, so each item now
carries its language, register, a stable code, and whether it is a
translation. A translation is framing, not source: marked, with the original
one click away.

## After this release

The project enters **observation mode** (`docs/OBSERVATION-MODE.md`):
- default next step: `docs/BLUEPRINT-2.6.0.md` at the owner's pace
- `docs/BLUEPRINT-2.7.0.md` parts start only on their triggers
- no dates; bug and security fixes stay allowed

## Owner Decisions Needed

- Review the zh feedback catalog (`scripts/dashboard/feedback-lang.mjs`).
- Confirm observation mode and the watch list.
- Pick the second reviewer for 2.6.0 when you start it.

## Validation

```bash
npm test                   # includes feedback-language coverage
npm run dashboard:check
```
