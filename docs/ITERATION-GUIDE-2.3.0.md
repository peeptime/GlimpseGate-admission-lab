# ITERATION-GUIDE-2.3.0 — Restart: Admission Hardening

```yaml
provenance:
  authors: project_owner + Claude (Hyperagent, AI-assisted)
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  audit_ref: CHANGELOG.md#230
```

## Why This Release

The project was frozen from 2026-05-21 to 2026-09-26. On restart, the codebase
was healthy (all tests and 375-file validation passing), so the iteration did
not add surface area. It checked whether **what the method claims** matches
**what the code enforces**, and fixed the gaps.

## What Changed (short)

| Area | Change |
|---|---|
| Method integrity | Admission contract now enforces `evidence_condition`; intent is no longer admitted as fact. |
| SDK | Valid package name, `files`, types, consumer install test, explainable `reasons`, whole-token source classification, declared source levels. |
| Consistency | Duplicate archive removed; FM-23…28 routed; name usage rule in CONTEXT.md; CHANGELOG backfilled for 2.1.6–2.2.0; stale "v2.3.0 = CI" roadmap corrected. |
| Methodology | `docs/ADMISSION-TAXONOMY.md`; `docs/RELATED-WORK.md` re-verified and extended with closest competitors. |

## Read Order For The Next Session

1. `SPEC.md` §7 (v2.3.0 gate — two items open)
2. `docs/ADMISSION-TAXONOMY.md` §6 — the open question
3. `docs/RELATED-WORK.md` — "Typed / Epistemic-Status Memory — Closest Competitors"
4. `docs/SDK-QUICKSTART.md`

## Owner Decisions Needed

- Accept, change, or reject proposed routes for FM-23…FM-28 (ROUTING-THEORY.md).
- Accept or revise the FM → ISO 25012 mapping and the object/meta split (ADMISSION-TAXONOMY.md §2–3).
- Decide whether `overgeneralization` (engine ID) becomes a numbered FM or maps formally to FM-05/FM-08.
- Choose which of Proposals T1 (object axes), T2 (FM split + implementation field), T3 (two-axis source grading) enter SPEC.md for 2.4.0.

## Next Steps

- **v2.4.0 (method):** run the choice-gate vs. automatic-typing disagreement ledger on existing cases (ADMISSION-TAXONOMY.md §6), with a second reviewer on a subset — the project's first inter-rater data.
- **v2.4.x (SDK):** revision state for admitted objects (`superseded_by`), if T1 is accepted; re-capture the benchmark baseline.
- Integration review gate before any npm publish (SPEC.md stop list, unchanged).

## Validation

```bash
npm test          # includes test:fidelity and test:consumer
npm run test:fast # quick local loop
npm run validate
npm run sync:check
```
