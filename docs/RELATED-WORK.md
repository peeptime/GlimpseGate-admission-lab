# Related Work

```yaml
provenance:
  authors: project_owner + Codex
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  audited_by: Mercury Lab self-audit
  updated: 2026-09-26 (v2.3.0 citation re-verification; AI-assisted)
  audit_ref: docs/ROUTING-THEORY.md
```

GlimpseGate Admission Lab (formerly Mercury Method Lab) should not behave as if it invented verification, provenance, or data governance. Its contribution is narrower:

> Decide whether an AI-generated claim deserves durable memory, project policy, or delivery status after it has already been produced.

This document maps GlimpseGate against adjacent work so future agents do not rebuild the world from scratch.

## Positioning Map

| Field | What It Usually Solves | What GlimpseGate Borrows | What GlimpseGate Adds |
|---|---|---|---|
| Hallucination detection | Detect whether model output is factually inconsistent or likely fabricated. | Treat model confidence as insufficient evidence. | Routes outputs before they become memory; includes provenance, review, and long-term pollution risk. |
| Fact verification | Extract claims and verify them against evidence. | Requires inspectable evidence and source claims. | Decides retention route, not only factual verdict. |
| AI safety / risk management | Reduce harms from AI systems and manage organizational risk. | Uses risk framing and governance discipline. | Focuses on memory ingestion and future-agent contamination. |
| Data quality / data governance | Manage data completeness, accuracy, lineage, and fitness. | Uses quality dimensions and lineage thinking. | Applies them to AI-generated claims and project memory. |
| Provenance / lineage | Record how information was produced and transformed. | Requires source, author, and review metadata. | Adds routing decisions and refusal points before durable use. |

## Direct Memory-Admission Work

Recent work points at the same control point GlimpseGate targets: write-time memory admission.
Titles and framings below were re-verified against the arXiv abstracts on 2026-09-26.

| Work | What It Contributes | GlimpseGate Relationship |
|---|---|---|
| [Adaptive Memory Admission Control for LLM Agents](https://arxiv.org/abs/2603.04549) (Zhang et al., 2026; proposes A-MAC) | Treats memory admission as an explicit decision with interpretable factors (utility, confidence, novelty, recency, type prior). | Strongest academic neighbor on *admission as a decision*. A-MAC scores; GlimpseGate routes and records a human choice. A-MAC-style factors could be policy inputs while routes stay inspectable. |
| [Selective Memory for Artificial Intelligence: Write-Time Gating with Hierarchical Archiving](https://arxiv.org/abs/2603.15994) (Zahn, 2026) | Argues for write-time gating, with archiving instead of deletion. | Supports "audit before memory". Its archive-not-delete stance is close to GlimpseGate's `quarantine` + `source_material.preserved_as_source`. |
| [MemSAD: Gradient-Coupled Anomaly Detection for Memory Poisoning in Retrieval-Augmented Agents](https://arxiv.org/abs/2605.03482) (Gowda et al., 2026) | A **defense**: detects poisoned memory entries via a gradient-coupled anomaly score. | Earlier versions described MemSAD only as "framing" poisoning. It is a detector. It supports the need for quarantine/discard routes; GlimpseGate does not attempt adversarial detection. |
| [OWASP AISVS C8 — Memory, Embeddings & Vector Database Security](https://github.com/OWASP/AISVS/blob/main/1.0/en/0x10-C08-Memory-Embeddings-and-Vector-Database.md) | Security controls for memory stores, including validating sources before agent outputs are written to memory, and expiry/revocation. | GlimpseGate maps to parts of C8 as a pre-storage validation method, not a compliance layer (see `docs/OWASP-AISVS-C8-MAPPING.md`). C8's expiry/revocation has no counterpart in the admission contract yet. |

## Typed / Epistemic-Status Memory — Closest Competitors

Added in 2.3.0. These are the works closest to GlimpseGate's distinctive idea
(a typed memory object whose future use is constrained). They matter more than
the broader fields below, because they narrow what GlimpseGate can claim as new.

| Work | What It Does | Overlap | What GlimpseGate Adds / Lacks |
|---|---|---|---|
| [Mitigating Provenance-Role Collapse in Long-Term Agents via Typed Memory Representation](https://arxiv.org/abs/2605.25869) (Jin et al., 2026; MemIR) | Compiles history into typed memory atoms separating raw evidence, retrieval cues, and truth-bearing claims; **factual authorization is restricted to supported claim atoms**. Evaluated on LoCoMo and BEAM-100K. | High. Restricting factual authorization to supported claims is, in effect, GlimpseGate's `can_use_as_fact` right, applied automatically. | Adds: human choice as admission authority; usage rights beyond fact (reasoning, action); quarantine/discard routes; explicit record of intent vs. evidence (`pending_upgrade`, 2.3.0). **Lacks: any benchmark evaluation.** |
| [Structured Belief State and the First Precision-Aware Evaluation of LLM Memory Retrieval](https://arxiv.org/abs/2605.11325) (Flynt, 2026; Tenure) | Typed beliefs (BDI-inspired) with scope and supersession, injected by a proxy before inference; introduces PrecisionMemBench. | Medium. Typed beliefs and supersession overlap the object-type enum. | Tenure governs retrieval and supersession; GlimpseGate governs admission. GlimpseGate has no supersession/revision state (see `docs/ADMISSION-TAXONOMY.md` §1). |
| [Graph-Native Cognitive Memory for AI Agents: Formal Belief Revision Semantics for Versioned Memory Architectures](https://arxiv.org/abs/2603.17244) (2026; Kumiho) | Graph memory with immutable revisions; proves AGM postulates K*2–K*6 and Hansson belief-base postulates for its operations. | Low–medium. Typed items and revision. | Kumiho writes autonomously and formalizes revision; GlimpseGate gates writes by choice and has no formal semantics. AGM is the natural formal home for a future revision axis. |

**Honest novelty boundary (2.3.0 assessment).** "Typed memory with
evidence-restricted fact status" is **not** novel after MemIR. What does not
appear in the surveyed work is the combination of (1) a human choice as the
admission authority, (2) multi-dimensional usage rights per admitted object
(cite as fact / feed reasoning / trigger action), and (3) a failure-mode
vocabulary that includes defects in the audit process itself. Whether (1)
improves outcomes over automatic typing is untested — see
`docs/ADMISSION-TAXONOMY.md` §6.

## Agent Memory Systems (Write Policies)

| Work | Write / Update Policy | Relationship |
|---|---|---|
| [MemGPT: Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560) (Packer et al., 2023; now Letta) | The model itself edits tiered memory through function calls. | The model is the admission authority — the configuration GlimpseGate is designed to put a gate in front of. |
| [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) (Park et al., 2023) | Everything enters a memory stream; importance scores and reflections shape retrieval. | Canonical "store everything, rank later" baseline; reflections are model-generated memories — FM-18/FM-23 territory. |

## Memory Poisoning

| Work | Attack | Relationship |
|---|---|---|
| [AgentPoison: Red-teaming LLM Agents via Poisoning Memory or Knowledge Bases](https://arxiv.org/abs/2407.12784) (Chen et al., NeurIPS 2024) | Backdoor triggers planted in agent memory / RAG knowledge bases. | Motivates quarantine; GlimpseGate's regex-level anti-gaming gate is not a defense against optimized triggers. |
| [A Practical Memory Injection Attack against LLM Agents](https://arxiv.org/abs/2503.03704) (Dong et al., 2025; MINJA) | Injects malicious records into memory through ordinary queries alone. | Directly relevant: shows that write-time admission is an attack surface even without store access. |

## Foundations Borrowed For Taxonomy Work

- **Belief revision.** Alchourrón, Gärdenfors & Makinson (1985), "On the Logic of Theory Change: Partial Meet Contraction and Revision Functions", *Journal of Symbolic Logic* 50(2) — [PhilPapers](https://philpapers.org/rec/ALCOTL-2). Formal basis for a future revision/supersession axis.
- **Two-axis source grading.** Admiralty / NATO system (STANAG 2511): source reliability A–F × information credibility 1–6 — [overview](https://en.wikipedia.org/wiki/Admiralty_code). GlimpseGate's single rank measures channel type instead (see `docs/ADMISSION-TAXONOMY.md` §4).
- **Separate certainty grading.** GRADE (Guyatt et al., *BMJ* 2008) — [PMC2335261](https://pmc.ncbi.nlm.nih.gov/articles/PMC2335261/). Precedent for rating certainty of evidence separately from strength of recommendation, analogous to separating evidence strength from route.
- **Data quality model.** ISO/IEC 25012 — [iso.org/standard/35736](https://www.iso.org/standard/35736.html). Used for the failure-mode mapping in `docs/ADMISSION-TAXONOMY.md` §3.

## Hallucination Detection

Hallucination detection work usually asks whether a generated statement is factual or internally consistent. For example, SelfCheckGPT uses sampled model responses to look for consistency in a black-box setting, while TruthfulQA measures whether models reproduce common falsehoods.

GlimpseGate overlaps with this work when it flags unsupported claims, circular reasoning, and speculation-as-fact. The difference is that GlimpseGate can quarantine a true-but-unsafe claim if it lacks audit closure or would pollute future memory. Hallucination detection answers "is this likely false?" GlimpseGate asks "should this be retained, revised, isolated, or discarded?"

References:

- [SelfCheckGPT: Zero-Resource Black-Box Hallucination Detection for Generative Large Language Models](https://huggingface.co/papers/2303.08896)
- [TruthfulQA: Measuring How Models Mimic Human Falsehoods](https://aclanthology.org/2022.acl-long.229/)

## Fact Verification And Claim Detection

Fact verification systems such as FEVER formalize claim extraction and verification against textual evidence. ClaimBuster focuses on detecting check-worthy factual claims.

GlimpseGate should reuse the discipline of claim extraction: every Audit Packet needs a candidate claim, source refs, and audit refs. But GlimpseGate's output is not only a true/false/support/refute verdict. It is a routing decision with memory consequences. A claim can be true but still require `revise` because it lacks a boundary, or `quarantine` because it affects customer delivery.

References:

- [FEVER resources](https://fever.ai/resources.html)
- [Toward Automated Fact-Checking: Detecting Check-worthy Factual Claims by ClaimBuster](https://www.kdd.org/kdd2017/papers/view/toward-automated-fact-checking-detecting-check-worthy-factual-claims-by-cla)

## AI Risk Management

AI risk management frameworks organize risks, controls, and governance practices for AI systems. NIST AI RMF 1.0 is the closest broad reference point in this set.

GlimpseGate is much narrower. It is not a full AI risk management framework and should not present itself that way. Its useful role is a small control: before AI-generated material enters long-term memory or delivery artifacts, check evidence lineage, review closure, pollution risk, and boundary clarity.

Reference:

- [NIST AI Risk Management Framework 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10)

## Data Quality And Governance

Data quality work gives GlimpseGate vocabulary for quality dimensions, categories, and metrics. W3C's Data Quality Vocabulary explicitly models quality dimensions, categories, and metrics without requiring one fixed list for all domains.

GlimpseGate should follow that posture. Its failure-mode taxonomy is a domain-specific quality vocabulary for AI memory ingestion. It should not claim universal completeness; it should document categories, dimensions, and known gaps.

Reference:

- [W3C Data Quality Vocabulary](https://www.w3.org/TR/vocab-dqv/)

## Provenance And Lineage

W3C PROV provides a mature model for representing entities, activities, agents, and derivation. GlimpseGate's provenance block is intentionally simpler, but it should remain compatible in spirit: record who/what produced an artifact, how it was reviewed, and what evidence it derives from.

GlimpseGate adds a decision layer that PROV does not try to provide: after lineage is recorded, decide whether the claim may enter durable memory.

Reference:

- [PROV-O: The PROV Ontology](https://www.w3.org/TR/prov-o/)

## Non-Goals

- GlimpseGate is not a replacement for fact verification datasets.
- GlimpseGate is not a hallucination detector benchmark.
- GlimpseGate is not a full AI safety framework.
- GlimpseGate is not a general data governance standard.
- GlimpseGate is not a provenance ontology.

It is a small audit method for one narrow control point: AI-generated material trying to become durable memory, project decision, or delivery artifact.

## Research Gaps

The project still lacks:

- inter-rater reliability tests
- external auditor disagreement records
- cases outside text-heavy project artifacts
- a larger proof pack with code, chart, data, customer, and multi-agent examples
- ~~explicit mapping from failure modes to existing data-quality dimensions~~ — first draft in `docs/ADMISSION-TAXONOMY.md` §3 (2.3.0, owner review pending)
- any benchmark evaluation (closest competitors report LoCoMo / BEAM-100K results)
- a test of whether human choice-gating outperforms automatic evidence-based typing

These gaps should guide Cycle 04 and later work more than new UI features.
