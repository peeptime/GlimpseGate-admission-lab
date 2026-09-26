# CONTEXT.md — Shared Language for GlimpseGate-admission-lab

```yaml
provenance:
  authors: project_owner + Codex
  ai_assisted: true
  human_reviewed: declined
  purpose: Establishes the ubiquitous language used across this project.
           All code, docs, skills, and AI prompts derive terms from this file.
           Updates require a PR review; do not introduce new terms without updating this file first.
```

This file is inspired by [mattpocock/skills](https://github.com/mattpocock/skills)
and Domain-Driven Design's "Ubiquitous Language" pattern (Evans, 2003).

---

## Why a Shared Language?

Without a shared language, agents use 20 words where 1 will do.

**BEFORE** (verbose, ambiguous):
> "There's a problem when a lesson inside a section of a course is made 'real' (i.e. given a spot in the file system)"

**AFTER** (concise, precise):
> "There's a problem with the materialization cascade"

This project lives and dies by the precision of its claims. Every new term here
reduces miscommunication between humans, agents, and the codebase.

---

## Core Terms

### admission（准入）
The act of deciding whether a piece of AI-generated content can enter durable memory,
and at what level of confidence. NOT the same as "approval" — admission is about
traceability, not truth.

### admission protocol（准入协议）
The structured method this project uses to evaluate content before it enters memory.
Sequence: capture → segment → audit → route → deliver.

### audit packet（审计包）
The atomic unit of review. A structured object containing content, type, risk level,
source references, and audit references. All routing decisions are made on audit packets.

### routing decision（路由决策）
One of four levels determining what happens to a claim:
- **accept**: enters memory with provenance
- **revise**: rephrase or add evidence before memory
- **quarantine**: hold for human review
- **discard**: reject — does not enter memory

### evidence chain（证据链）
A structured record linking each claim to its source material, inference steps,
and confidence basis. Built by `buildEvidenceChain()`. Used by `buildAdmissionContract()`.

### admission contract（准入契约）
A closed record that captures: (1) the admitted object, (2) its evidence conditions,
(3) the routing decision made, and (4) provenance. Built by `buildAdmissionContract()`.
Immutable once created.

### fidelity（保真度）
The structural consistency of an audit result. A "high fidelity" audit has:
consistent routing across two runs, coherent evidence chain, no internal contradictions.
Measured by `verifyAuditStability()` and `quickStabilityCheck()`.

### memory gate（记忆门）
The integration point where a host agent or memory system calls the audit SDK
before writing to durable storage. Implemented as a pre-write hook.

### audit kernel（审计内核）
The core evaluation engine. Runs structural checks: fact vs. inference vs. preference,
overgeneralization, source credibility, lifecycle state, reviewer disagreement, and
anti-gaming detection. Defined in `src/mercury-audit/kernel.mjs`.

### scenario（场景）
A named domain context that applies default audit parameters.
Examples: `ai-coding`, `investment-research`, `legal-medical-risk`.
Scenarios affect risk levels, required evidence thresholds, and human review triggers.

### provenance（溯源）
Metadata about how a piece of content was produced. Includes `ai_assisted`,
`human_reviewed`, `reviewer`, `review_note`, and `audit_ref`.
Every admitted memory must carry provenance.

### blocker（阻塞项）
A structural problem that prevents a claim from being admitted.
Examples: missing source refs for a factual claim, unsupported causal inference,
conflicting reviewer signals. NOT a scoring metric — blockers are binary signals.

### failure mode（失效模式）
A known pattern where the audit system produces incorrect routing.
Documented in `docs/FAILURE-MODES.md`. Each failure mode has a proof case
and a mitigation strategy.

### evidence condition（证据条件）— added 2.3.0
The evidence an admission must carry before it may grant `can_use_as_fact`:
`evidence_refs` at traceable level or above (not AI-generated), or a named,
non-pending human review. For `circular_reasoning`, evidence must be independent
of the existing chain and review alone does not suffice. Checked in
`buildAdmissionContract`; result in `evidence_condition_check`.

### pending upgrade（待升级）— added 2.3.0
The record left in an admission contract when the requested admission was
downgraded (usually to `hypothesis`) because the evidence condition was not met.
States what was requested and what is missing. Intent is recorded, not laundered
into evidence.

### declared source level（声明来源级别）— added 2.3.0
A source level asserted by the caller with a prefix (`primary::`, `traceable::`,
`secondary::`, `ai::`) instead of inferred from the reference text. Marked
`declared: true`.

### Naming: GlimpseGate vs. Mercury — added 2.3.0
**GlimpseGate** is the project's public name. **Mercury** (Mercury Method Lab →
Mercury Admission Lab) is the legacy name. Legacy identifiers are kept
intentionally for compatibility: `src/mercury-audit/`, `08_skills/mercury-*`,
`MERCURY_*` constants, `mercury-*` provenance tags. Use "GlimpseGate" in new
prose; do not rename identifiers without a major version.
**Mercury Agent** (`cosmicstack-labs/mercury-agent`) is a separate, unrelated
runtime — see `docs/MERCURY-AGENT-RELATIONSHIP.md`.

### display vocabulary（界面用词）— added 2.4.1
Friendly words used only in human-facing UI copy (zh): 存档 = accept, 返修 =
revise, 仓库 = quarantine storage, 关卡 = gate check, 解锁条件 = evidence
condition, 待解锁 = pending upgrade, 权限 = future usage policy. They explain;
they never replace identifiers. Rules and full mapping: `docs/COPY-STYLE.md`.

---

## Routing Signal Types

When you see these terms in audit results, they have precise meanings:

| Signal | Meaning |
|--------|---------|
| `direct_evidence` | User-provided fact with a verifiable source |
| `inference` | AI reasoning derived from evidence — may be correct or not |
| `assumption` | Unsupported claim treated as a working hypothesis |
| `overgeneralization` | Claim stated as universal that is only locally true |
| `preference_adjacent` | Claim that sounds like a user preference but is stated as fact |
| `gaming_attempt` | Input designed to manipulate the audit result |

---

## Review States

| State | Meaning |
|-------|---------|
| `draft` | Raw output, not yet audited |
| `audited` | Audit run completed, routing decision made |
| `revised` | Content rephrased and re-audited |
| `quarantined` | Awaiting human review |
| `admitted` | Accepted into memory with contract |
| `rejected` | Discarded — does not enter memory |

---

## File Naming Conventions

This project uses a strict naming convention for sortable file names:

```
00_raw/           — Original source material (AI outputs, conversations)
01_segmented/     — Claims extracted and labeled
02_cleaned/       — Revised after first-pass audit
03_uncertain/     — Content that needs evidence or human review
04_memory_candidates/ — Ready for full audit
05_decision_logs/ — Audit decisions made
06_action_plans/  — Human review checklists
07_audit_reports/ — Final audit reports
08_skills/        — Agent-usable skill definitions (SKILL.md format)
09_templates/     — Standard templates
10_exports/       — Admitted memories exported for use
11_indexes/       — Searchable indices of admitted content
```

---

## Version Semantics

| Change | Version Bump |
|--------|-------------|
| Breaks artifact, memory, or upstream compatibility contracts | `major` (x.0.0) |
| Adds compatible architecture capability, adapter, or workflow | `minor` (x.y.0) |
| Fixes docs, validation, scripts, or non-breaking metadata | `patch` (x.y.z) |

---

## What This Project Is NOT

- NOT a scoring or gamification system
- NOT a database or storage backend
- NOT a general-purpose Agent framework
- NOT a certification authority
- NOT a RAG, fine-tuning, or AI self-audit system

These boundaries are enforced in `docs/ITERATION-GUIDE-LATEST.md` as the **Stop List**.
