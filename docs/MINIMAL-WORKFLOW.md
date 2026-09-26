# Minimal Workflow

```yaml
provenance:
  authors: project_owner + Codex
  ai_assisted: true
  human_reviewed: pending
  audited_by: Mercury Lab self-audit
  audit_ref: docs/ARCHIVED/ITERATION-GUIDE-0.9.md
```

Mercury Lab can be understood with four directories.

## 1. Put Source Material In `00_raw`

Raw files are the source of truth. Do not rewrite them to make later conclusions cleaner.

Example:

`00_raw/2026-05-03-20260503t141705z-ai变现路子审计-v8-2维度迁移分析.md`

## 2. Put Candidate Memory In `04_memory_candidates`

This is where a claim asks to become durable memory.

Example:

`04_memory_candidates/2026-05-04-ai-monetization-bad-memory.md`

The candidate may be wrong. That is normal. The point is to make the request visible before it enters a brain.

## 3. Put Audit Trace In `07_audit_reports`

Audit reports explain whether a candidate can be promoted, reviewed, archived, or discarded.

Example:

`07_audit_reports/2026-05-04-bad-memory-intercept-audit.md`

## 4. Keep Formats In `09_templates`

Templates keep recurring artifacts comparable:

- `09_templates/memory_candidate_template.yaml`
- `09_templates/audit_report_template.md`
- `09_templates/decision_log_template.md`

## Complete Path

```text
00_raw -> 04_memory_candidates -> 07_audit_reports -> routing_decision
```

Optional but useful:

- `05_decision_logs`: record the human decision after audit.
- `11_indexes`: generated search and export views.
- `10_exports`: generated handoff bundles for downstream memory systems.

## Commands

```powershell
npm run validate
npm run index
npm run export:memory -- --include-archive
```

The first-time reader only needs to answer two questions:

- Where do I put original material? `00_raw`
- Where do I find the audit result? `07_audit_reports` or the exported routing bundle.
