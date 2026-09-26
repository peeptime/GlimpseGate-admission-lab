# GlimpseGate Routing Theory

```yaml
provenance:
  authors: project_owner + Codex
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  audited_by: Mercury Lab self-audit
  audit_ref: docs/PROOF-PACK-COVERAGE-MATRIX.md
```

GlimpseGate uses four routing decisions:

```text
accept / revise / quarantine / discard
```

This is not a mood scale. It is a control model for deciding whether an AI-generated claim can become durable memory, needs rewriting, must be isolated, or should be removed from the promotion path.

## Why Four Routes

Three routes are not enough because "not accepted" has two different meanings:

- useful but underspecified material should be revised
- dangerous material should be isolated from memory

Five routes are not necessary yet because "human review required" is a review path attached to the route, not a fifth route. A quarantined item can require human review; so can a high-risk revised item.

| Route | Meaning | Reversibility | Durable Memory Permission |
|---|---|---|---|
| `accept` | Supported, bounded, and reviewable enough for current use. | Reversible by later evidence. | Yes, within stated scope. |
| `revise` | Potentially useful, but wording, boundary, or evidence needs repair. | High. | No, not before repair. |
| `quarantine` | Useful as source evidence but unsafe for durable memory. | Medium. | No, isolate before reuse. |
| `discard` | Structurally invalid, circular, or misleading enough that repair would create more trust than the artifact deserves. | Low. | No. |

## Decision Axes

GlimpseGate routes by four axes:

| Axis | Low-Risk End | High-Risk End | Typical Failure Modes |
|---|---|---|---|
| Evidence strength | Inspectable source refs exist. | No source, weak source, or source cannot support claim. | FM-01, FM-11, FM-12 |
| Audit closure | Independent audit refs exist. | Claim asks for durable use without review path. | FM-02, FM-16, FM-17, FM-18 |
| Pollution risk | Wrong claim affects one draft. | Wrong claim steers future agents, user profile, policy, or delivery. | FM-04, FM-05, FM-22 |
| Boundary clarity | Claim states where it applies and expires. | Claim is universal, permanent, or context-free. | FM-08, FM-09, FM-10 |

The route is decided by the highest-risk unresolved axis. Strong evidence does not cancel high pollution risk; it only changes the required fix.

## Routing Rules

| Condition | Route | Reason |
|---|---|---|
| Source refs, audit refs, and boundary are present; no blocker triggered. | `accept` | The claim can be retained with its scope. |
| A claim is useful but too broad, underspecified, or missing a repairable boundary. | `revise` | Preserve the signal without preserving the unsafe wording. |
| A claim targets memory, project policy, user profile, or customer delivery while missing audit support. | `quarantine` | It may be evidence, but it cannot steer future work. |
| A claim uses circular proof, lacks source and audit support, or turns an agent output into its own authority. | `discard` | Keeping it would launder confidence into evidence. |

## Failure Mode To Route Matrix

The matrix records the default route, not an irreversible sentence. A stronger or weaker source can move a case one step, but high-risk memory writes should not be upgraded without review.

| FM | Short Name | Default Route | Can Upgrade To | Notes |
|---|---|---|---|---|
| FM-01 | missing_source_refs | quarantine | revise | If no source exists and claim is also unsupported, discard. |
| FM-02 | missing_audit_refs | revise | accept | Quarantine when the claim targets memory or delivery. |
| FM-03 | circular_reasoning | discard | quarantine | Upgrade only if independent evidence is added. |
| FM-04 | unsafe_memory_write | quarantine | revise | Accept only after human review and narrowed scope. |
| FM-05 | overgeneralized_user_preference | quarantine | revise | User preference memories require source evidence. |
| FM-06 | fde_consensus_laundering | quarantine | revise | Preserve dissent before converting to action. |
| FM-07 | customer_delivery_overconfidence | quarantine | revise | Customer-facing claims require human review. |
| FM-08 | one_case_to_policy | revise | accept | Accept only when many cases support the policy boundary. |
| FM-09 | template_lock_in | revise | accept | Keep as optional pattern unless evidence supports mandate. |
| FM-10 | boundary_missing | revise | accept | Add scope, date, owner, and non-applicability. |
| FM-11 | speculation_as_fact | revise | accept | Accept as hypothesis if labeled and bounded. |
| FM-12 | authority_laundering | revise | accept | Authority can be context, not proof. |
| FM-13 | demo_to_retention_leap | revise | accept | Need adoption or retention evidence. |
| FM-14 | agent_goodhart_metric | discard | quarantine | Metrics can be diagnostic, not normative release gates. |
| FM-15 | metric_gaming_surface | discard | quarantine | Quarantine if kept only for internal measurement design. |
| FM-16 | undeclared_ai_provenance | revise | accept | Add provenance and review ledger entry. |
| FM-17 | human_review_theater | revise | accept | Replace false review with declined/pending/true state. |
| FM-18 | self_audit_loop | discard | quarantine | Requires external review to re-enter. |
| FM-19 | category_choice_blind_spot | revise | accept | Keep category as hypothesis until external evidence arrives. |
| FM-20 | version_maturity_laundering | revise | accept | Version can document state, not prove maturity. |
| FM-21 | builder_loop | revise | accept | Shipping is acceptable when it closes an existing gap. |
| FM-22 | premature_positioning_memory | revise | accept | Positioning can remain draft until proof cases support it. |
| FM-23 | multi_agent_memory_contamination | quarantine | revise | *Proposed 2.3.0.* Another agent's summary is not primary evidence; re-attach the original source. |
| FM-24 | stale_truth_reuse | revise | accept | *Proposed 2.3.0.* Re-verify or relabel as historical. Matches the lifecycle control (expired / stale → revise + review). |
| FM-25 | test_passing_but_wrong | revise | accept | *Proposed 2.3.0.* Narrow the claim to the tested scope. |
| FM-26 | chart_overclaim | revise | accept | *Proposed 2.3.0.* Keep the data; rewrite the conclusion to what it supports. |
| FM-27 | unresolved_reviewer_disagreement | quarantine | revise | *Proposed 2.3.0.* Matches the kernel: disagreement escalation → quarantine. |
| FM-28 | audit_gaming_attempt | quarantine | — | *Proposed 2.3.0.* Matches anti-gaming gate: quarantine, or discard at critical severity. No upgrade path by rewording. |

> Rows FM-23…FM-28 were missing before 2.3.0 although `docs/FAILURE-MODES.md` defined them. Routes are proposals aligned with existing kernel behavior where one exists; `human_reviewed: declined`. See `docs/ADMISSION-TAXONOMY.md` §2 for which failure modes the engine detects versus which are review vocabulary only.

## Decision Tree

```text
1. Is the claim asking to steer durable memory, policy, user profile, or delivery?
   yes -> require source_refs + audit_refs + boundary + review path
   no  -> continue

2. Are source_refs missing?
   yes -> quarantine, unless the claim is circular/unsupported enough to discard
   no  -> continue

3. Are audit_refs missing?
   yes -> revise, or quarantine if risk is high
   no  -> continue

4. Is the proof loop circular or self-approving?
   yes -> discard
   no  -> continue

5. Is the claim too broad, stale, demo-derived, or authority-laundered?
   yes -> revise
   no  -> accept
```

## Consistency Test

Two auditors should be able to agree on:

- what the candidate claim is
- which axis is highest risk
- which FM family is primary
- whether the route is promotion, repair, isolation, or removal

They do not need to agree on every secondary FM. GlimpseGate should optimize for route consistency before label completeness.
