# Admission Taxonomy — Axes, Coverage, And Open Questions

```yaml
provenance:
  authors: project_owner + Claude (AI-assisted iteration, v2.3.0)
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  status: analysis + proposals; nothing here changes runtime behavior except where stated
  audit_ref: src/mercury-audit/admission-contract.mjs, docs/FAILURE-MODES.md, docs/ROUTING-THEORY.md
```

This document examines the three classification systems GlimpseGate already
uses — **memory object types**, **failure modes**, and **source levels** — and
asks of each: *what axis is it actually measuring, where does it collapse two
axes into one, and what does the code really enforce?*

It is written as a method audit, not a feature proposal. Where a proposal is
made, it is marked **Proposal** and is non-breaking.

---

## 1. Memory Object Types Are Three Axes Folded Into One Enum

`MEMORY_OBJECT_TYPES` has nine values:

```text
fact, hypothesis, attribution, interpretation, open_question,
preference, decision_record, temporary_note, reference
```

They read as a flat list, but they answer **different questions**:

| Axis | Question it answers | Values present in the enum |
|---|---|---|
| **E — Epistemic status** | How settled is the content? | fact, hypothesis, open_question |
| **V — Voice / authorship** | Whose assertion is being stored? | attribution (a third party said it), interpretation (the model framed it), preference / decision_record (the user asserted or decided it) |
| **K — Kind of object** | What sort of thing is stored? | reference (a pointer, not a claim), decision_record (an act, not a proposition), preference (a disposition, not a world-claim) |
| **L — Lifetime** | How long may it persist? | temporary_note |

A fourth axis — **U, usage rights** (`can_use_as_fact`, `can_participate_in_reasoning`,
`can_trigger_action`) — is already explicit in `future_usage_policy`. That axis
is GlimpseGate's clearest structural contribution (see §5), and it is
the one axis that is *not* folded into the enum.

### What the fold costs

Because one enum carries four axes, some ordinary objects cannot be expressed:

| Wanted object | Why it has no slot |
|---|---|
| A **temporary hypothesis** (useful for this session, not settled) | `temporary_note` consumes L, so E is lost. |
| An **attributed hypothesis** ("Vendor X claims Y; unverified") | `attribution` consumes V, so E is lost — and attribution is where laundering usually starts (FM-12). |
| A **superseded / retracted fact** | No axis records revision state at all. |
| An **interpretation the user endorsed** | `interpretation` fixes V = model; endorsement moves it to user voice with no slot to show the transition. |

The missing revision state matters most. Adjacent systems treat it as
first-class: Tenure models superseded beliefs, Kumiho implements AGM-style
revision over immutable versions, and OWASP AISVS C8 includes expiry and
revocation controls (see `docs/RELATED-WORK.md`). GlimpseGate has
`lifecycle.mjs` (expired / stale / retired warnings) at the *audit* level, but an
admitted object cannot be marked `superseded_by` another.

### Proposal T1 (non-breaking)

Keep the nine-value enum as the public interface. Add a *derived*
`object_axes` block to the admission contract, computed from the type plus
the selection:

```yaml
object_axes:
  epistemic: fact | hypothesis | open_question | not_applicable
  voice: world | third_party | model | user
  kind: claim | pointer | act | disposition
  lifetime: durable | session | until: <date/condition>
  revision: current | superseded_by: <id> | retracted
```

This does not change routing. It makes the four collisions above expressible
and gives a place for revision state. Per SPEC.md P4, it requires a SPEC entry
and CONTEXT.md terms before implementation — so it is **not** implemented in
2.3.0.

---

## 2. Failure Modes: Documentation Coverage vs. Implementation Coverage

`docs/FAILURE-MODES.md` defines **28** failure modes. Two gaps were found in 2.3.0:

1. **Documentation drift.** `docs/ROUTING-THEORY.md` and the family table in
   `FAILURE-MODES.md` covered FM-01…FM-22 only. FM-23…FM-28 had no default
   route. 2.3.0 adds proposed routes (owner review pending) — see
   ROUTING-THEORY.md.
2. **Implementation coverage.** The SDK detects only a few failure modes by
   identifier. The rest exist as review vocabulary.

| Coverage level | Failure modes | Mechanism |
|---|---|---|
| **Detected by the rules engine** | FM-01 missing_source_refs, FM-02 missing_audit_refs, FM-03 circular_reasoning, FM-04 unsafe_memory_write; plus `overgeneralization` (closest to FM-05/FM-08, but not a documented FM name) | `scripts/audit-core/audit_rules.mjs` blockers |
| **Partially covered by a kernel control** | FM-24 stale_truth_reuse (lifecycle: expired / stale / retired), FM-27 unresolved_reviewer_disagreement (disagreement escalation → quarantine), FM-28 audit_gaming_attempt (anti-gaming gate) | `lifecycle.mjs`, `disagreement.mjs`, `anti-gaming.mjs` |
| **Review vocabulary only** | FM-05…FM-23 except as noted, FM-25, FM-26 | Human reviewer applies the label; no code path emits it |

**This is not automatically a defect.** Many of these (FM-17 human_review_theater,
FM-19 category_choice_blind_spot, FM-21 builder_loop) are judgments that a
keyword detector would fake rather than make — which is exactly the
Goodhart risk FM-14 and FM-15 name. The defect was that nothing in the
repo *said* which were detected and which were not, so a reader of
FAILURE-MODES.md could reasonably assume the SDK checks all 28.

**Naming drift to resolve:** the engine's `overgeneralization` blocker has no
FM number. Either map it formally to FM-05/FM-08, or add it as a documented
failure mode. The admission contract's `failureModePolicy` is keyed on this
engine ID, so this is where the contract and the taxonomy meet.

### Two levels in one taxonomy

Read against a standard data-quality model, the 28 failure modes split
cleanly into two levels:

- **Object-level** — defects in the *claim* (lineage, scope, currency, overreach).
- **Meta-level** — defects in the *audit process or project around it*
  (review honesty, metric gaming, self-audit, version-as-maturity, builder loop).

The existing five families mix the two: "Evidence Lineage" contains FM-18
self_audit_loop (meta), "Memory Boundary" contains FM-22
premature_positioning_memory (meta), and "Validation Leap" contains FM-20 and
FM-21 (both meta). The table below makes the split explicit.

---

## 3. Failure Modes Mapped To ISO/IEC 25012

ISO/IEC 25012 (data quality model) defines 15 characteristics: *inherent* —
Accuracy, Completeness, Consistency, Credibility, Currentness; *inherent and
system-dependent* — Accessibility, Compliance, Confidentiality, Efficiency,
Precision, Traceability, Understandability; *system-dependent* —
Availability, Portability, Recoverability.

This mapping closes the research gap listed in RELATED-WORK.md ("explicit
mapping from failure modes to existing data-quality dimensions"). It is a
first draft by an AI assistant; it needs owner and, ideally, second-reviewer
agreement before it is cited as settled.

| FM | Short name | Level | Primary ISO 25012 characteristic | Note |
|---|---|---|---|---|
| FM-01 | missing_source_refs | object | Traceability | |
| FM-02 | missing_audit_refs | object | Credibility | Review path is how credibility is earned here. |
| FM-03 | circular_reasoning | object | Credibility | ISO has no notion of *self-derived* evidence — a GlimpseGate-specific refinement. |
| FM-04 | unsafe_memory_write | object | — (risk, not quality) | Concerns consequence of admission, not the data's quality. |
| FM-05 | overgeneralized_user_preference | object | Accuracy (scope) | |
| FM-06 | fde_consensus_laundering | object | Accuracy / Completeness | Dissent dropped = incomplete record. |
| FM-07 | customer_delivery_overconfidence | object | Precision | Stated certainty exceeds warrant. |
| FM-08 | one_case_to_policy | object | Accuracy (scope) | |
| FM-09 | template_lock_in | object | Accuracy (scope) | |
| FM-10 | boundary_missing | object | Completeness | Missing scope / expiry metadata. |
| FM-11 | speculation_as_fact | object | Credibility | Also an epistemic-status error (axis E). |
| FM-12 | authority_laundering | object | Credibility | |
| FM-13 | demo_to_retention_leap | object | Accuracy | |
| FM-14 | agent_goodhart_metric | **meta** | — | Process integrity; outside data quality. |
| FM-15 | metric_gaming_surface | **meta** | — | |
| FM-16 | undeclared_ai_provenance | object | Traceability | |
| FM-17 | human_review_theater | **meta** | (Credibility of the review record) | |
| FM-18 | self_audit_loop | **meta** | — | |
| FM-19 | category_choice_blind_spot | **meta** | — | |
| FM-20 | version_maturity_laundering | **meta** | — | |
| FM-21 | builder_loop | **meta** | — | |
| FM-22 | premature_positioning_memory | **meta** | Currentness (of positioning) | Borderline; about the project's self-description. |
| FM-23 | multi_agent_memory_contamination | object | Traceability | Lineage lost across agents. |
| FM-24 | stale_truth_reuse | object | Currentness | |
| FM-25 | test_passing_but_wrong | object | Accuracy (scope) | |
| FM-26 | chart_overclaim | object | Accuracy | |
| FM-27 | unresolved_reviewer_disagreement | **meta** | Consistency (of review) | |
| FM-28 | audit_gaming_attempt | **meta** | — | Adversarial; closer to security than quality. |

### What the mapping shows

- **Object-level FMs concentrate on five characteristics:** Traceability,
  Credibility, Accuracy (mostly *scope* accuracy), Completeness, Currentness.
  The system-dependent half of ISO 25012 (Availability, Portability,
  Recoverability, Efficiency…) is untouched. That is consistent with
  GlimpseGate's narrow claim: it is about admission, not storage.
- **Nine of 28 FMs have no ISO counterpart at all**, all at the meta level.
  This is where GlimpseGate is doing something data-quality standards do not:
  auditing the honesty of the audit. That is either the project's most
  distinctive contribution or its biggest scope risk. It should be argued for
  explicitly rather than left implicit.
- **"Scope accuracy" carries six FMs** (FM-05, 08, 09, 13, 25, 26). ISO folds
  this into Accuracy. GlimpseGate may be justified in treating *scope*
  as its own dimension — that would be a defensible taxonomic claim.
- **FM-04 is not a quality defect.** It is a consequence judgment. Keeping it
  in the same list as quality defects is part of why "routing" and "scoring"
  keep getting confused.

### Proposal T2

Split the failure-mode index into two families at the top level —
**claim defects** (object-level) and **process defects** (meta-level) — and add
an `implementation: engine | control | review_only` field to each FM entry.
Documentation-only; no runtime change.

---

## 4. Source Levels Measure the Channel, Not the Source or the Claim

`classifySourceRef` assigns one rank (`primary_or_direct` 5 → `unknown` 1)
by pattern-matching the *reference string* — words like `transcript`,
`commit`, `arxiv`, `llm`.

The intelligence community's Admiralty / NATO system (STANAG 2511) grades two
things independently:

- **Source reliability** A–F — how trustworthy the *provider* has been.
- **Information credibility** 1–6 — how well *this item* is corroborated.

GlimpseGate's rank measures neither exactly. It measures the **type of
channel** (a transcript, a paper, a model output), which is a proxy for
*traceability*, not reliability or credibility. A transcript of a known
unreliable speaker ranks 4; a single uncorroborated line in an official
document ranks 5.

2.3.0 makes two small, honest improvements:

1. **Token-boundary matching.** Substring matching classified `email:…`,
   `meeting-detail:…`, `domain-expert-note` as AI-generated (they contain
   "ai"). Fixed; regression tests added.
2. **Declared levels.** `primary::`, `traceable::`, `secondary::`, `ai::`
   prefixes let the caller assert a level. The result carries
   `declared: true` so a reviewer can see the level was asserted, not
   inferred. This is a stopgap: it moves the judgment to the caller and
   records that it did so.

### Proposal T3

Rename the current rank to what it is — `channel_traceability` — and add
optional, caller-supplied `source_reliability` (A–F) and
`information_credibility` (1–6) fields, Admiralty-style. The source floor
would keep using channel traceability until there is evidence that the
two-axis grade routes more consistently.

---

## 5. The Admission Contract After 2.3.0

The contract's distinctive idea is that a human choice produces a **typed
object with explicit usage rights**. Before 2.3.0 that idea had a hole:
choosing an *evidence-seeking* option ("Find independent evidence",
"Narrow scope") immediately granted `can_use_as_fact: true`, even though no
evidence had been supplied. The base policy declared
`evidence_condition: primary_or_named_review` but nothing enforced it.

2.3.0 enforces it:

- Any admission that would grant `can_use_as_fact` (or an explicit
  `object_type: fact`) must supply `evidence_refs` at traceable level or
  above that are not AI-generated, **or** a named, non-pending
  `human_reviewed: "true"`.
- For `circular_reasoning` the evidence must also be **independent** — not
  already in the evidence chain — and review alone does not suffice: a
  reviewer signing a self-referential proof is still self-referential.
- If the condition is not met, the object is admitted as `hypothesis`, and
  the contract carries `pending_upgrade` stating what was requested and
  what is missing. Intent is recorded; it is not laundered into evidence.

This is the change in 2.3.0 that most directly serves the project's thesis.

---

## 6. The Most Important Open Question

> **Does the human choice add information that automatic typing does not?**

MemIR (2026) already restricts factual authorization to evidence-supported
claim atoms, automatically, and reports benchmark results (LoCoMo,
BEAM-100K). If automatic typing gets the same routing on the same
candidates, GlimpseGate's choice gate is ceremony. If it does not — if human
choices systematically catch contamination that automatic typing admits —
that is the project's core empirical claim, and nothing in the repo tests it yet.

A minimal test that fits the project's constraints (no external LLM in the
core, no scoring targets):

1. Take the existing real cases (`cases/`, `cases:check` reports 10) plus
   Proof Pack cases.
2. For each, record (a) the route and object type an automatic
   evidence-only rule would assign and (b) the owner's A/B/C choice and
   resulting contract.
3. Record every disagreement with a one-line rationale. Do not compute a
   score; publish the disagreement ledger.
4. Have a second person independently make the same choices on a subset.
   This is also the first inter-rater reliability data the project has
   (listed as a gap in RELATED-WORK.md since 1.x).

Until that exists, the honest statement is: *the choice gate is a design
hypothesis with a clear rationale, not a demonstrated improvement.*
