# ITERATION-GUIDE-2.4.1 — Mechanic Words

```yaml
provenance:
  authors: project_owner (rule) + Claude (Hyperagent, AI-assisted)
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  audit_ref: docs/COPY-STYLE.md
```

## Why

The owner proposed a copy rule: game vocabulary is short, visual, and durable,
so use it to warm up cold UI terms, and use fewer adverbials. The audit kept
the rule, narrowed it to **mechanic** words (not memes), confined it to the
display layer (identifiers unchanged, canonical term visible), and added one
threshold-lowering change that does not touch vocabulary: options preview
their permissions before the user chooses.

## Owner Decisions Needed

- Read the zh UI and flag any word that feels forced or mocking.
- Confirm 丢弃 stays literal (no game word for the most serious route).

## Validation

```bash
npm run dashboard:check   # includes copy rules
npm test
```
