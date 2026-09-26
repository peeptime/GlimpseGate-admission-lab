# Methodology Integrity

```yaml
provenance:
  authors: project_owner + Codex
  ai_assisted: true
  human_reviewed: pending
  audited_by: Mercury Lab self-audit
  audit_ref: docs/ARCHIVED/ITERATION-GUIDE-0.9.md
```

## The Contradiction

Mercury Lab says AI-generated material must not promote itself into long-term memory. The same standard must apply to Mercury Lab's own documents, release notes, examples, and skills.

The problem is not AI-assisted drafting. The problem is unmarked AI-assisted drafting. If a changelog or core document says "AI collaboration" but does not state who reviewed it, what was reviewed, and which audit rule applies, the project violates its own audit contract.

## Correction

All project-facing outputs now need a provenance declaration:

```yaml
provenance:
  authors: project_owner + Codex
  ai_assisted: true
  human_reviewed: pending
  audited_by: Mercury Lab self-audit
  audit_ref: docs/METHODOLOGY-INTEGRITY.md
```

Use `pending` when human review has not happened yet. Use an explicit reviewer handle only after that reviewer has actually accepted the content.

## Changelog Rule

Every changelog entry must use one of these labels:

| Label | Meaning |
|---|---|
| `[HUMAN_ONLY]` | Human-written, no AI drafting or rewriting. |
| `[AI_ASSISTED]` | AI helped draft, edit, structure, or summarize; a human reviewed it. |
| `[AI_GENERATED]` | AI drafted the entry; human review is still pending unless stated otherwise. |
| `[LEGACY_PROVENANCE_UNKNOWN]` | Historical text predates the provenance policy; do not treat it as human-only. |

Do not delete old AI-collaboration statements. Rewrite them into auditable declarations.

## Self-Audit Rule

Mercury Lab must audit Mercury Lab:

- Core docs must include provenance.
- Examples must keep `source_refs` and `audit_refs` visible.
- Export contracts must reject high-level memory without sources or audit traces.
- Skills must declare allowed tools and trigger evaluation examples.

This keeps the project from asking downstream systems to obey standards that the project itself does not follow.
