# GlimpseGate Admission Lab

**Send AI outputs through an evidence gate before deciding whether they deserve durable memory.**

Formerly: `Mercury Method Lab` · `Mercury Admission Lab`
Repository: `peeptime/GlimpseGate-admission-lab`
Version: `2.4.1`
Latest release: [v2.2.0 SPEC-First + Shared Language](https://github.com/peeptime/GlimpseGate-admission-lab/releases/tag/v2.2.0)

**Core Docs:** [SPEC.md](SPEC.md) · [CONTEXT.md](CONTEXT.md)

**Architecture Map**: [HTML (human)](architecture.html) · [JSON (agent)](architecture.json)

```yaml
provenance:
  authors: project_owner + Codex
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  review_note: |
    This project is still an AI-assisted method lab. It does not claim
    third-party validation, production adoption, or human-reviewed authority.
  audit_ref: docs/ITERATION-GUIDE-2.1.0.md
```

---

## One Sentence

GlimpseGate Admission Lab is a **choice-gated knowledge admission protocol** for LLM outputs, agent memory, and knowledge-transfer artifacts.

It does not ask how credible content appears. It asks whether that content deserves to be retained, reused, written into durable memory, or delivered to another person.

```text
Scoring = how credible this content appears.
Admission = whether this content deserves to be remembered.
```

GlimpseGate focuses on admission.

---

## What GlimpseGate Produces

GlimpseGate does not produce truth verdicts. GlimpseGate produces structured admission choices.

In 2.0.2, a user choice can be closed into an **Admission Contract** that separates:

- `source_material`: the original refs that should remain inspectable.
- `model_framing`: GlimpseGate's claim extraction, evidence ordering, and confidence basis.
- `user_judgment`: the selected choice and review state.
- `admitted_object`: the memory object that may enter a knowledge base.

The admitted object has an explicit type such as `fact`, `hypothesis`, `attribution`, `interpretation`, `open_question`, `preference`, `decision_record`, `temporary_note`, or `reference`.

This prevents a quiet slide from "the material mentioned X" to "GlimpseGate framed X confidently" to "the knowledge base treats X as fact."

---

## Why Rename In 2.0.1

`Mercury Method Lab` sounded broader than the project can honestly claim. `Mercury Admission Lab` is narrower:

- The core action is an admission gate, not a general audit standard.
- The current value is in naming, evidence chains, failure modes, and memory-admission rules.
- The current limits are explicit: no external adoption proof, no labeled benchmark, no precision/recall, no cross-model certification, and no human trust anchor yet.
- AI-assisted outputs keep `human_reviewed: declined` unless a named human reviewer actually signs off.

---

## Current Capability

```text
AI output / user material
  -> extract the core claim
  -> build a source-linked evidence chain
  -> record source attribution, confidence basis, and missing evidence
  -> offer missing-evidence A/B/C choices
  -> generate an Admission Contract for the selected choice
  -> run the memory-write gate
  -> accept / revise / quarantine / discard
  -> preserve as a case, audit report, or portable skill handoff
```

Main entry points:

- `buildEvidenceChain()` builds source-linked claim chains and missing-evidence choices.
- `buildAdmissionContract()` records what a selected choice admits, under what evidence condition, and with what future usage rights.
- `auditMemoryWrite()` gates durable memory writes.
- `cases/2026-05/` stores reproducible local cases.
- `08_skills/mercury-*` packages the core behavior for other agents.
- `fullAudit()` runs F1-F5 checks (fidelity, iteration tracking, meta-audit, trace, stability) before routing decisions. Use `check_stability: true` to enable F5 stability gate.
- `test:fidelity` runs the full F1-F5 integration test suite.
- `benchmark:v2` measures the local structured path; it is not an accuracy benchmark.

---

## Known Boundaries

GlimpseGate Admission Lab does not claim:

- External team adoption.
- Production validation.
- Third-party human review.
- Cross-model certification.
- Quantified precision / recall.
- A solved multi-agent shared-memory contamination model.
- Adversarial prompt-injection hardening.
- Replacement for fact checking, RAG, AI scoring, or security certification.

These are release priorities, not footnotes.

---

## 2.1.0 Changes

This release adds the **F5 Stability Engine** and formalizes type-aware admission constraints:

- **F5 Fidelity Engine** (`verifyAuditStability` + `applyStabilityGate`): detects routing inconsistency, low-fidelity+accept combos, and confidence-routing mismatches. Unstable results auto-downgrade: `accept → revise → quarantine`. `discard` is terminal and never downgraded.
- **Type-aware routing**: each of the 9 admission object types has its own evidence requirements and usage constraints, documented in `docs/TYPE-MECE-ANALYSIS.md`.
- **Procedural knowledge handling**: `reference`-type objects can carry `provenance_type: procedural_knowledge` with scoped usage rules.
- **SDK API**: `verifyAuditStability` and `applyStabilityGate` are now exported from the main entry.
- **Tests**: 21 new integration tests for F1-F5 × routing, all passing.

## 2.0.2 Roadmap (superseded)

The next focus is proving whether the admission gate works:

1. **Admission Contract Review**: test whether users understand what object they admitted and what it may be used for.
2. **Ground-Truth Track**: build 30-100 labeled examples covering known wrong answers, credible answers, and failure modes, then measure precision / recall.
3. **Cross-Model Audit**: separate generation and audit models, and record disagreement instead of relying on same-source self-approval.
4. **Programmable Checks**: use code or APIs for URLs, numbers, executable facts, and format checks whenever possible.
5. **Adversarial Injection Tests**: test route-forcing, opposing evidence, and audit-prompt manipulation.
6. **Multi-Agent Contamination Track**: promote shared-memory contamination from a coverage gap to a mainline risk.
7. **Human Trust Anchor**: get at least one key document or audit path reviewed by a named human.

---

## 30-Second Start

```powershell
npm install
npm run demo:starter
npm run demo:openclaw
npm run cases:check
npm run test:evidence
npm run benchmark:v2
npm run skills:check
```

Open the local UI:

```powershell
npm run dashboard
```

Then visit:

```text
http://127.0.0.1:4788/lite.html
```

---

## Portable Skills

| Skill | Purpose |
|---|---|
| `mercury-evidence-chain` | Turn messy material into source-linked evidence chains and missing-evidence A/B/C choices |
| `mercury-memory-gate` | Route candidate memories before durable storage |
| `mercury-case-capture` | Preserve AI outputs, audit results, and review state as portable case folders |

Sync them locally:

```powershell
npm run sync:skills
```

Validate them:

```powershell
npm run skills:check
```

---

## Related Work

GlimpseGate Admission Lab treats these as reference coordinates, not original inventions:

- A-MAC: decomposed memory admission control.
- MemSAD: anomaly detection and attack modeling for memory systems.
- SelfCheckGPT: black-box consistency checks for hallucination detection.
- OWASP AISVS C8: memory, embedding, and vector database security.

---

## Key Documents

| Need | Document |
|---|---|
| Start by role | `docs/START-HERE.md` |
| Scope boundary | `docs/SCOPE.md` |
| 2.0.2 handoff | `docs/ITERATION-GUIDE-2.0.2.md` |
| SDK API | `docs/SDK-API.md` |
| Audit kernel | `docs/AUDIT-KERNEL.md` |
| Scenario packs | `docs/SCENARIO-PACKS.md` |
| Adapter contract | `docs/ADAPTER-CONTRACT.md` |
| Proof Pack 002 | `docs/PROOF-PACK-002.md` |
| Failure modes | `docs/FAILURE-MODES.md` |
| Routing theory | `docs/ROUTING-THEORY.md` |
| Related work | `docs/RELATED-WORK.md` |
| OWASP AISVS C8 mapping | `docs/OWASP-AISVS-C8-MAPPING.md` |

---

## Local Verification

Before release:

```powershell
npm run release:gate
```

Faster edit checks:

```powershell
npm run validate:incr
npm run index:incr
npm run skills:check
```

`dist/` is generated output. Markdown / YAML / JSON are the auditable records.

---

## Principles

```text
Do not store inference as fact.
Do not let AI audit and approve itself.
Do not fabricate source_refs, audit_refs, or human_reviewed:true.
Do not treat captured material as approved memory.
Do not define success metrics that invite agent gaming.
```

GlimpseGate's value is not producing more content. It is making unsafe content harder to retain.
