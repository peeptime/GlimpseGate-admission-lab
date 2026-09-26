# ITERATION-GUIDE-2.2.0 — SPEC-First + Shared Language

```yaml
provenance:
  authors: project_owner + Codex
  ai_assisted: true
  human_reviewed: declined
  audited_by: self-audit
  audit_ref: docs/ITERATION-GUIDE-LATEST.md
```

## Version Summary

v2.2.0 establishes SPEC-first development discipline and a shared language for the project.
This is a **structural release** — no SDK breaking changes, but two new core documents
and an upgraded skill interface.

## Changes

### New Documents

- **`SPEC.md`** — Project specification defining scope, acceptance criteria, architecture,
  and stop list. Inspired by [modu-ai/moai-adk](https://github.com/modu-ai/moai-adk).
  Every feature PR must update SPEC.md or justify the deviation.

- **`CONTEXT.md`** — Shared language (ubiquitous language) for the project.
  Inspired by [mattpocock/skills](https://github.com/mattpocock/skills).
  All code, docs, skills, and AI prompts derive terms from this file.

- **`08_skills/mercury-evidence-chain/SKILL.md`** — Upgraded to reference CONTEXT.md,
  include routing matrix, code examples, before/after examples, and grounding prompts.

- **`08_skills/mercury-memory-gate/SKILL.md`** — Upgraded with full routing decision matrix,
  anti-gaming checklist, and provenance rules.

- **`08_skills/mercury-case-capture/SKILL.md`** — Upgraded with folder shape, capture rules,
  and quality checklist.

### Cleanup

- Archived 7 legacy ITERATION-GUIDE files (v0.4–v1.2.x) to `docs/ARCHIVED/`
- README.md and README.en.md updated to show "GlimpseGate-admission-lab" prominently
- README.md provenance audit_ref updated to `docs/ITERATION-GUIDE-LATEST.md`

### Version Bump

- `package.json`: `2.1.6` → `2.2.0`, codename → "SPEC-First + Shared Language"
- `config/project-meta.json`: `2.1.6` → `2.2.0`
- `docs/ITERATION-GUIDE-LATEST.md`: version header → `2.2.0`

## Before / After

### Before (v2.1.6)
- No shared language document
- No SPEC document
- Skills not referencing each other
- 100+ docs with no clear entry point

### After (v2.2.0)
- `CONTEXT.md` establishes shared vocabulary for humans and agents
- `SPEC.md` provides SPEC-first discipline with acceptance criteria
- All 3 skills reference CONTEXT.md and use consistent routing matrix
- README.md shows GlimpseGate-admission-lab prominently
- Legacy docs archived to `docs/ARCHIVED/`

## Next Steps

- ~~**v2.3.0**: GitHub Actions CI (lint + test on push)~~ — CI already existed (`.github/workflows/ci.yml`, 3-OS matrix). 2.3.0 went to admission hardening instead; see `docs/ITERATION-GUIDE-2.3.0.md`.
- **v2.4.0**: SDK v1.0 readiness (integration review gate)
- **v3.0.0**: Breaking changes only when needed for upstream compatibility

## Validation

```powershell
npm run validate:incr
npm run doctor
npm run benchmark:v2
npm run test
npm run skills:check
```
