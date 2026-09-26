# Failure Mode Dictionary v1.0

```yaml
provenance:
  authors: project_owner + Codex
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  review_note: "Dictionary entries are AI-assisted and case-grounded, but not human-approved until reviewed by the project owner."
  audited_by: Mercury Lab self-audit
  audit_ref: docs/PROOF-PACK-001.md
```

This dictionary gives Mercury Lab reusable names for failures that should block, quarantine, or revise AI-generated memories and delivery claims.

Each entry includes:

- **Definition**: what the failure is.
- **Proof Pack Reference**: where this mode appears.
- **Near Miss**: a similar situation that should not be mislabeled as this mode.

## Taxonomy Layer

The first 22 modes are no longer treated as a flat list. They are grouped into five top-level families so another auditor can decide where a new case belongs before inventing a new name.

This taxonomy is a working classification, not a claim of completeness. It is meant to help stronger downstream implementers build reliable audit flows without treating Mercury Lab as a certification authority.

| Family | Question It Answers | Failure Modes |
|---|---|---|
| Evidence Lineage Failures | Can the claim be traced to inspectable source and audit evidence? | FM-01, FM-02, FM-03, FM-12, FM-18, FM-23 |
| Memory Boundary Failures | Is the claim scoped tightly enough for durable reuse? | FM-04, FM-05, FM-08, FM-09, FM-10, FM-22, FM-24 |
| Delivery and Stakeholder Failures | Does the claim preserve real-world ambiguity before action? | FM-06, FM-07 |
| Validation Leap Failures | Does the claim confuse plausibility, demos, or strategy with validation? | FM-11, FM-13, FM-19, FM-20, FM-21, FM-25, FM-26 |
| Governance and Measurement Failures | Does the audit system preserve review honesty and avoid gameable targets? | FM-14, FM-15, FM-16, FM-17, FM-27, FM-28 |

> 2.3.0: FM-23…FM-28 added to families (previously unassigned). These families mix claim-level and process-level defects; `docs/ADMISSION-TAXONOMY.md` §2–3 proposes a two-level split and records which FMs the SDK engine actually detects (most are review vocabulary, not automated checks).

### Boundary Rules

- If the artifact lacks a source, start with FM-01 before judging whether the source would have been strong.
- If the artifact has a source but no review path, start with FM-02.
- If a claim can steer future agents, apply memory-boundary modes even when the claim sounds minor.
- If a customer or delivery context is involved, preserve disagreement before compressing the claim.
- If a release, demo, category story, or metric is being used as validation, treat it as a validation-leap or governance failure rather than a simple evidence gap.

### Current Coverage Gaps

These are not official failure modes yet because they do not have enough proof-pack support:

- Multi-agent contamination: one agent's output becomes another agent's source of truth.
- Stale-but-reused memory: a once-valid statement is reused after its time boundary expires.
- Code-output misvalidation: generated code passes a narrow test while violating the intended behavior.
- Chart or data overclaim: a visual or summary statistic is used to support a stronger claim than the data permits.
- Strategy survivorship bias: a visible successful case is treated as evidence for a whole category.

Until these gaps have proof cases, they should remain coverage targets rather than canonical FM numbers.

## FM-01: missing_source_refs

**Definition:** A claim asks to enter durable memory without showing where it came from. This is the most basic refusal point: if a future agent cannot inspect the original source, it cannot know whether the claim is a fact, a hypothesis, a preference, or a compressed retelling. Missing source refs are especially dangerous when the claim sounds operational.

**Proof Pack Reference:** Case 002, Case 003.

**Near Miss:** A sourced claim whose source is weak is not missing source refs. It may trigger unsupported claim or stale context instead.

## FM-02: missing_audit_refs

**Definition:** A claim has source material but no review path showing why it is safe to keep. Source presence is not the same as audit completion. This mode catches content that quotes or summarizes real material but skips the step that decides whether the material can become durable memory.

**Proof Pack Reference:** Case 003, Case 004.

**Near Miss:** A low-risk scratch note may lack audit refs because it is not asking for promotion. The failure begins when it wants durable status.

## FM-03: circular_reasoning

**Definition:** The claim uses itself, or another output from the same agent pass, as proof that the claim is correct. This creates a closed loop where confidence replaces evidence. It often appears in project closeouts that say blockers are resolved because the summary says they are resolved.

**Proof Pack Reference:** Case 003.

**Near Miss:** A summary that cites independent logs, tests, or reviewed artifacts is not circular merely because an agent wrote the summary.

## FM-04: unsafe_memory_write

**Definition:** A claim would update long-term memory in a way that could steer future agents, user modeling, or project policy, but it lacks enough evidence for that privilege. The danger is not just being wrong once; it is repeatedly biasing future work after the original uncertainty is forgotten.

**Proof Pack Reference:** Case 002.

**Near Miss:** A temporary note in a draft report is not an unsafe memory write until it is routed toward durable memory.

## FM-05: overgeneralized_user_preference

**Definition:** A narrow user request is rewritten into a permanent or universal preference. Words like "always," "never," "all future," or their Chinese equivalents are common signals. This mode protects users from being trapped by an agent's exaggerated memory of one interaction.

**Proof Pack Reference:** Case 002.

**Near Miss:** A user explicitly stating a durable preference with source evidence and review can be accepted. The issue is unsupported generalization.

## FM-06: fde_consensus_laundering

**Definition:** Field delivery notes containing disagreement, ambiguity, or exploratory interest are compressed into a false statement of customer consensus. It is a delivery-specific form of laundering because a professional summary makes unresolved stakeholder tension look approved.

**Proof Pack Reference:** Case 004.

**Near Miss:** A summary that says "some stakeholders are ready, others are not" preserves uncertainty and should not be labeled consensus laundering.

## FM-07: customer_delivery_overconfidence

**Definition:** A customer-facing or delivery-facing claim presents readiness, approval, or alignment more strongly than the evidence supports. The risk is practical: future implementation work may proceed as though a real customer commitment exists.

**Proof Pack Reference:** Case 004.

**Near Miss:** A confident recommendation can be acceptable when it is explicitly framed as a recommendation and not as customer approval.

## FM-08: one_case_to_policy

**Definition:** A pattern from one successful or promising case is promoted into a policy for all future cases. This mode is common when agents optimize for reusable templates. It should usually route to `revise`, preserving the pattern as optional rather than mandatory.

**Proof Pack Reference:** Case 005.

**Near Miss:** A policy built from many reviewed cases and scoped to a specific context is not one-case-to-policy.

## FM-09: template_lock_in

**Definition:** A useful artifact template becomes rigid project memory before the project knows which variables actually matter. This can make future agents force diverse cases into the same shape, losing evidence that does not fit the template.

**Proof Pack Reference:** Case 005.

**Near Miss:** Providing a starter template with an explicit "adapt as needed" boundary is not template lock-in.

## FM-10: boundary_missing

**Definition:** The claim may be true only within a specific project, customer, model, date, or workflow, but it is written without that boundary. Missing boundaries make future reuse hazardous because agents tend to apply stored memory outside its original domain.

**Proof Pack Reference:** Case 006.

**Near Miss:** A claim with a clear boundary and sufficient evidence should not be penalized simply because it is narrow.

## FM-11: speculation_as_fact

**Definition:** A hypothesis, forecast, or narrative inference is stored as though it were already verified. This mode is especially common in market, product, and strategy writing where plausible future behavior is described in present-tense certainty.

**Proof Pack Reference:** Case 001.

**Near Miss:** A clearly labeled hypothesis with falsification conditions is not speculation-as-fact.

## FM-12: authority_laundering

**Definition:** A claim gains undeserved certainty because it is attached to a credible founder, company, brand, investor, or technical achievement. The authority may be real, but it does not automatically validate the specific conclusion being stored.

**Proof Pack Reference:** Case 001.

**Near Miss:** Citing authority as one piece of context is acceptable when the final claim still depends on direct evidence.

## FM-13: demo_to_retention_leap

**Definition:** A compelling demo or prototype is treated as evidence for long-term adoption, retention, replayability, or business success. This is a product-validation error: demo plausibility and user retention are different evidence categories.

**Proof Pack Reference:** Case 001.

**Near Miss:** A demo can prove that an interaction is possible. It cannot by itself prove durable user behavior.

## FM-14: agent_goodhart_metric

**Definition:** A success metric is readable by the agent being audited and can therefore become a target to optimize rather than a signal of quality. In Mercury, this applies to metrics like fixed promote rates that can be gamed by discarding too much.

**Proof Pack Reference:** Case 007.

**Near Miss:** Internal diagnostic timings or non-normative counters are not Goodhart metrics if they are not used as success criteria.

## FM-15: metric_gaming_surface

**Definition:** A measurement invites agents to change behavior to satisfy the number while weakening the underlying audit purpose. It is broader than Goodhart: even a well-intended metric can become an attack surface if it controls release or approval.

**Proof Pack Reference:** Case 007.

**Near Miss:** A metric used only for local debugging and not for approval may be safe when clearly marked as non-decisive.

## FM-16: undeclared_ai_provenance

**Definition:** AI-assisted or AI-generated material appears without a clear declaration of who drafted it, whether a human reviewed it, and what audit rule applies. The failure is not using AI; the failure is hiding or blurring the review status.

**Proof Pack Reference:** Case 008.

**Near Miss:** AI-assisted text with explicit provenance and pending review is acceptable as draft material.

## FM-17: human_review_theater

**Definition:** A document displays review-looking fields while no actual human review has occurred. This is worse than leaving review blank because it creates false trust. Mercury must preserve the difference between `pending`, `declined`, and `true`.

**Proof Pack Reference:** Case 008.

**Near Miss:** `human_reviewed: declined` is not review theater when it honestly says review has not happened or was not accepted.

## FM-18: self_audit_loop

**Definition:** The same agent or artifact family produces the claim, audits the claim, and approves the claim without independent review. The form may look rigorous, but the loop is closed inside the system being evaluated.

**Proof Pack Reference:** Case 003, Case 008.

**Near Miss:** An AI-generated draft followed by explicit human review and logged changes is not a self-audit loop.

## FM-19: category_choice_blind_spot

**Definition:** A project adopts a category or positioning frame because it is intellectually coherent, not because it has survived outside evidence. This can make future agents optimize around a neat market story before real users confirm the category.

**Proof Pack Reference:** Case 009.

**Near Miss:** Category exploration is healthy when it remains a hypothesis and does not control durable project memory.

## FM-20: version_maturity_laundering

**Definition:** A version number, changelog density, or release cadence is treated as evidence of maturity. This is a repository-specific memory risk: future agents may assume `v1.x` means externally validated even when the project is still pre-traction.

**Proof Pack Reference:** Case 010.

**Near Miss:** A patch release can be real and useful. The failure is using release count as proof of method validation.

## FM-21: builder_loop

**Definition:** A project responds to uncertainty by shipping more artifacts instead of waiting for cases, review, and users. For Mercury, this is a first-class failure because the project can easily dilute its strongest insight by turning every concern into another feature.

**Proof Pack Reference:** Case 010.

**Near Miss:** Shipping a small patch that closes an existing audit gap is not builder loop when it reduces surface area.

## FM-22: premature_positioning_memory

**Definition:** A positioning statement is saved as stable memory before the evidence base is mature enough to support it. This often happens after a strong memo, strategy note, or external-sounding critique, even though positioning needs repeated case evidence.

**Proof Pack Reference:** Case 009, Case 010.

**Near Miss:** A positioning draft in a clearly marked exploratory document is not premature positioning memory.

## FM-23: multi_agent_memory_contamination

**Definition:** One agent's generated summary is treated by another agent as primary evidence. The risk compounds when Agent B stores Agent A's inference as durable memory without carrying the original transcript, source, or uncertainty boundary.

**Proof Pack Reference:** Case 011.

**Near Miss:** A multi-agent handoff that includes the original source, route, and review state is not contamination merely because more than one agent touched it.

## FM-24: stale_truth_reuse

**Definition:** A claim that was once true is reused as current truth after its review window, expiry condition, or superseding evidence has changed. This is not ordinary hallucination; it is time decay ignored by memory retrieval.

**Proof Pack Reference:** Case 012.

**Near Miss:** A historical note remains valid when it is clearly marked as historical and is not used to steer current decisions.

## FM-25: test_passing_but_wrong

**Definition:** Passing tests are used as proof that a code path, parser, or integration contract is generally correct, even though the tests cover only a narrow fixture or happy path.

**Proof Pack Reference:** Case 013.

**Near Miss:** A scoped claim such as "this fixture passes" is not wrong simply because broader correctness still needs more tests.

## FM-26: chart_overclaim

**Definition:** A chart, table, or count is used to prove a stronger causal, market, adoption, or urgency claim than the data supports. The visual evidence may be real while the conclusion overreaches.

**Proof Pack Reference:** Case 014.

**Near Miss:** A chart used to support a narrow descriptive claim is not overclaiming when it avoids causal or demand language.

## FM-27: unresolved_reviewer_disagreement

**Definition:** Human reviewers disagree about route, risk, or evidence sufficiency, but the artifact is promoted without preserving the disagreement, adjudicator, or final rationale.

**Proof Pack Reference:** Case 015.

**Near Miss:** Reviewers can disagree without blocking forever when the final route records who adjudicated and why.

## FM-28: audit_gaming_attempt

**Definition:** The packet instructs the audit system, agent, or reviewer to force a route, hide blockers, optimize acceptance metrics, or forge human review state. The instruction is itself evidence of manipulation risk.

**Proof Pack Reference:** Case 016.

**Near Miss:** A human asking how to fix evidence gaps is not gaming. The failure is trying to bypass the gate rather than satisfy it.
