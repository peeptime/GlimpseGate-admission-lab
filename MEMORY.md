# Mercury Lab Working Memory

```yaml
provenance:
  authors: project_owner + Codex
  ai_assisted: true
  human_reviewed: declined
  audited_by: Mercury Lab self-audit
  audit_ref: docs/AGENT-CONTEXT-BUDGET.md
```

This file is the short cross-session handoff. Keep it under 120 lines. Do not paste raw reports here.

## Current Snapshot

- Current public version: `2.0.2`
- Current posture: Mercury Admission Lab / Admission Contract
- Core proof: `docs/v0.9-proof-of-audit.md`
- Current proof packs: `docs/PROOF-PACK-001.md`, `docs/PROOF-PACK-002.md`
- Current runnable audit loop: `npm run audit`, `npm run audit:flow`, `npm run report`, `npm run test`, `npm run audit:profile`
- Current intake loop: `npm run capture -- --file <path>`, `npm run capture:dropzone`, `npm run capture:check`
- Current SDK loop: `npm run test:sdk`, `npm run demo:memory-hook`, `npm run benchmark:audit`
- Fast checks: `npm run cycle:status`, `npm run cycle:check`, `npm run dashboard:check`, `npm run capture:check`, `npm run validate:incr`, `npm run index:incr`, `npm run guide:latest`
- Current method docs: `docs/FAILURE-MODES.md`, `docs/ROUTING-THEORY.md`, `docs/PROOF-PACK-COVERAGE-MATRIX.md`, `docs/RELATED-WORK.md`, `docs/AGENT-AUDIT-BLUEPRINT.md`
- Current UX docs: `docs/START-HERE.md`, `docs/SCOPE.md`, `docs/EXPORT-GUIDE.md`, `docs/I18N-UX-POLICY.md`
- Current integration docs: `docs/SDK-API.md`, `docs/INTEGRATION-DEMO.md`, `docs/BENCHMARKS.md`, `docs/OWASP-AISVS-C8-MAPPING.md`
- Current kernel docs: `docs/AUDIT-KERNEL.md`, `docs/ECOSYSTEM-POSITION.md`, `docs/MERCURY-AGENT-RELATIONSHIP.md`
- Current scenario docs: `docs/SCENARIO-PACKS.md`, `docs/ADAPTER-CONTRACT.md`, `docs/REVIEW-UX-GUIDE.md`
- Current governance docs: `docs/RULE-VERSION-GOVERNANCE.md`, `docs/MEMORY-LIFECYCLE-GOVERNANCE.md`, `docs/HUMAN-REVIEW-DISAGREEMENT.md`, `docs/ANTI-GAMING-TESTS.md`
- Current v2.0 preflight docs: `docs/V2-PREFLIGHT-REQUIREMENTS.md`, `docs/V2-WORK-TRAIN.md`
- Current v2.0 case docs: `docs/REAL-CASES-SUMMARY.md`, `cases/2026-05/`, `examples/starter-kit/`, `examples/integration-demo/openclaw-hook.mjs`
- Current v2.0 interface docs: `src/mercury-audit/evidence-chain.mjs`, `docs/A2A-AGENT-CARD-BLUEPRINT.md`, `examples/a2a/agent-card.json`
- Current v2.0 final docs: `docs/PERFORMANCE-2.0.md`, `docs/ITERATION-GUIDE-2.0.0.md`, `docs/ITERATION-GUIDE-2.0.1.md`, `docs/ITERATION-GUIDE-2.0.2.md`, `08_skills/mercury-evidence-chain/`, `08_skills/mercury-memory-gate/`, `08_skills/mercury-case-capture/`
- Release gate: `npm run release:gate`
- Bad-memory proof must continue to export `routing_decision: discard`

## Known Open Risks

- Historical artifacts still have some `missing_source_refs`; do not hide this by inventing sources.
- `promote: 0` is acceptable for the current proof-oriented release.
- Long sessions can make small text updates uneconomical if old context is carried forward.
- Skills that require reading full iteration guides by default are a token-cost risk.
- Cycle 02 charter users are still `0/3`; do not fabricate external use records.
- Cycle 02 AI-authored artifacts are `human_reviewed: declined` until the project owner reviews them.
- `v1.3.0` is a product-surface unfreeze, not a method-layer expansion.
- `v1.3.0` contradicted the original Cycle 02 forbidden version line; the debt is recorded in `docs/REVIEW-LEDGER.md`.
- `v1.3.1` capture lowers entry friction only; captures remain `human_reviewed: declined` with empty `audit_refs`.
- `v1.4.0` is a method-depth release, not a claim that Mercury is an external standard.
- The taxonomy is still AI-assisted and `human_reviewed: declined`.
- `v1.5.0` makes Human Review actionable with content summaries and A/B/C checklists, but review choices still require a named human before `human_reviewed: true`.
- `v1.6.0` adds a local SDK/API and memory-write hook demo, but it is not an npm-published package and not a production adapter.
- `v1.7.0` moves the SDK through a portable audit kernel with configurable profiles, standards, source credibility, lifecycle, and disagreement handling.
- `v1.8.0` adds reusable scenario packs and scenario-aware review guidance; still no production adapter.
- `v1.9.0` adds Proof Pack 002, ruleset versioning, anti-gaming tests, lifecycle governance, and human-review disagreement guidance; still AI-assisted and `human_reviewed: declined`.
- `v2.0.0-alpha.1` locks the 2.0 evidence-chain work train and records that `docs/ITERATION-STRATEGY-V2.md` is lower-weight diagnostic input, not a hard-freeze policy.
- `v2.0.0-alpha.2` adds reproducible local case folders, an OpenClaw-compatible hook demo, and a Starter Kit; these are still AI-assisted and `human_reviewed: declined`.
- `v2.0.0-alpha.3` adds the evidence-chain SDK helper, Lite drag attach, and A2A-compatible agent-card/message demo.
- `v2.0.0` finishes the work train with a local audit-plus-evidence benchmark and three lightweight portable Mercury skills.
- `v2.0.1` renames the public posture to Mercury Admission Lab, narrows claims to memory admission, and makes missing validation, cross-model audit, multi-agent contamination, and human trust anchor gaps explicit.
- `v2.0.2` adds Admission Contract: user choices now record source material, model framing, user judgment, admitted object type, and future usage policy.
- Current dashboard has runtime preferences in `config/preferences.json`; do not confuse them with durable project memory.
- `karpathy-guidelines` skill is installed locally; restart Codex before expecting automatic skill activation.
- `docs/ITERATION-STRATEGY-V2.md` is lower-weight historical strategy input: keep its problem diagnosis, but do not inherit its hard freeze/release restrictions.

## Token Economy Rules

- Start small: read this file, `docs/ITERATION-GUIDE-LATEST.md`, and `docs/CYCLE-02-COMMITMENT.md` before opening long docs.
- Run `npm run cycle:status` before reading Proof Pack or Failure Modes in full.
- Run `npm run dashboard:check` before reading full dashboard files.
- Run `npm run capture:check` before reading full Lite/capture implementation.
- Run `validate:incr` and `index:incr` before full scans during exploration.
- Read full `docs/ARCHIVED/ITERATION-GUIDE-0.9.md` only for disputed v0.9 acceptance criteria.
- For README/changelog/version updates, inspect only the affected sections and release surfaces.
- End long work with a short handoff here instead of relying on conversation memory.

## Next Good Work

- Keep version surfaces aligned.
- Keep method-layer case-first; use `v1.4.x` for taxonomy, routing theory, coverage, related-work, and blueprint docs.
- Use `v1.5.x` for Human Review Checklist, START-HERE, scope, i18n, and progressive-disclosure work.
- Use `v1.6.x` for the pre-storage SDK/API, policy layer, memory-write hook demo, benchmark, and OWASP C8 mapping.
- Use `v1.7.x` for audit kernel independence, profile/standard/source/lifecycle/disagreement contracts, and Mercury Agent relationship clarity.
- Use `v1.8.x` for scenario packs, adapter contract, and scenario-aware review UX.
- Use `v1.9.x` for Proof Pack 002, rule version governance, lifecycle governance, human-review disagreement, and anti-gaming tests.
- Use `docs/V2-PREFLIGHT-REQUIREMENTS.md` and `docs/V2-WORK-TRAIN.md` before starting any 2.0 package.
- Use `v2.0.2` as the stable admission-contract baseline before adding new 2.x scope.
- Do not add official failure modes without proof-pack or coverage-matrix support.
- Do not silently migrate old accepted memories to a new ruleset without a re-audit record.
- Do not let route-forcing or forged-review instructions pass as ordinary packet content.
- Do not present Mercury as a certification authority; keep it as a reference method others can adapt.
- Do not expose raw technical fields as the first user-visible layer when content summary and checklist can lead.
- Keep `00_inbox/ai-conversations/` as source evidence intake, not approved memory.
- Validate `dashboard/lite.html` and `dashboard/product-layer.js` with `npm run dashboard:check`.
- Review `docs/PROOF-PACK-001.md` and `docs/FAILURE-MODES.md` for human acceptance or edits.
- Collect three real charter user records in `docs/CHARTER-USER-RECORDS.md`.
- Keep Audit Packets small and evidence-first; do not turn this into a general Agent framework.
- Keep generated `dist/` reports out of commits; regenerate them for local review.
- Defer backend adapters, AI scoring, RAG, or fine-tuning audit features.
- Do not claim OWASP AISVS compliance; keep `docs/OWASP-AISVS-C8-MAPPING.md` as a mapping blueprint only.
