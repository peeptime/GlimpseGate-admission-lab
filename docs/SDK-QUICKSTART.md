# SDK Quickstart — Put a Gate in Front of Your Agent's Memory

```yaml
provenance:
  authors: project_owner + Claude (AI-assisted, v2.3.0)
  ai_assisted: true
  human_reviewed: declined
  sdk_api_version: 0.8.0
```

The SDK is plain ESM with **zero runtime dependencies** (Node ≥ 20). It does not
call an LLM, does not store anything, and does not decide truth. It tells your
host system **whether** a candidate memory may be written and **as what**.

## Install

Not published to npm (SPEC.md stop list: no npm publish before a formal
integration review). Install from GitHub:

```bash
npm install github:peeptime/GlimpseGate-admission-lab
```

```js
import { audit, shouldWriteMemory } from "@glimpsegate/admission-lab";
```

TypeScript declarations ship with the package (`src/mercury-audit/index.d.ts`).
The internal directory keeps its legacy `mercury-audit` name for compatibility.

## 1. The one-line gate

```js
import { auditMemoryWrite, shouldWriteMemory } from "@glimpsegate/admission-lab";

const result = auditMemoryWrite({
  content: "The user prefers Markdown as the source of truth for notes.",
  source_refs: ["conversation:2026-09-26-onboarding"],
  audit_refs: ["review-ledger:2026-09-26"],
  boundary: "Note-taking workflow in this workspace; revisit if tooling changes.",
  evidence_strength: "strong"
});

if (shouldWriteMemory(result)) {
  memoryStore.write(result.packet);            // accept + no human review needed
} else {
  reviewQueue.push(result);                    // revise / quarantine / discard
}
```

`auditMemoryWrite` defaults `risk_level` to `"high"` (memory writes steer future
agents). `shouldWriteMemory` is true only for `accept` with no human review
required.

## 2. Read *why*, not just the route

```js
result.routing_decision  // "accept" | "revise" | "quarantine" | "discard"
result.reasons           // ["missing_source_refs:high", "control:source_credibility_floor", ...]
result.required_fixes    // what would change the route
result.warnings
```

Since 2.3.0, `reasons` includes `control:<name>` for kernel controls that
escalated the route without a blocker (source floor, lifecycle, disagreement,
anti-gaming). Earlier versions could report "No refusal point triggered"
next to a `revise` route.

## 3. Tell the gate what your sources are

The source floor (default `traceable`) is checked by classifying each
`source_refs` string:

| Level | Matched tokens (whole-token, case-insensitive) |
|---|---|
| `primary_or_direct` (5) | official, primary, direct_user, field-note, signed-review |
| `traceable` (4) | conversation, transcript, commit, github, repo, audit, review-ledger, issue, pull, `docs/…`, `pr:…` |
| `secondary` (3) | paper, arxiv, article, benchmark, external, report, owasp, nist, w3c |
| `ai_generated` (2) | ai, agent, llm, model, summary, generated |
| `unknown` (1) | anything else — e.g. `chat:…`, `email:…` |

If your identifiers don't use these words, **declare the level** with a
prefix. The classification records `declared: true`, so reviewers can see it
was asserted by your system rather than inferred:

```js
source_refs: ["primary::email:ceo-2026-09-20", "traceable::slack:C123/p456"]
```

Only declare what your system can back up. Fabricating source levels is
FM-12 (authority laundering) by another name.

## 4. Let the user choose *how* something is admitted

When the route is not `accept`, build an evidence chain and let the user
pick an option per gap:

```js
import { audit, buildEvidenceChain, buildAdmissionContract } from "@glimpsegate/admission-lab";

const chain = buildEvidenceChain(audit(candidateText, context));
// chain.suggested_choices -> [{ gap_id, options: [{ id: "A"|"B"|"C", label, action, admission_policy }] }]

const contract = buildAdmissionContract(chain, {
  gap_id: "circular_reasoning",
  choice_id: "A",                               // "Find independent evidence"
  evidence_refs: ["primary::interview:2026-09-20"],
  reviewer: "alice"
});

contract.admitted_object.object_type   // "fact" only if the evidence condition is met
contract.future_usage_policy           // { can_use_as_fact, can_participate_in_reasoning, can_trigger_action, ... }
contract.forbidden_uses                // ["action_trigger", ...]
contract.pending_upgrade               // null, or what is still missing
```

**Choosing an evidence-seeking option is intent, not evidence** (2.3.0). A
contract that would grant `can_use_as_fact` requires either
`evidence_refs` at traceable level or above (non-AI-generated), or
`human_reviewed: "true"` with a named, non-pending reviewer. For
`circular_reasoning`, the evidence must be independent of the existing chain,
and review alone is not enough. Otherwise the object is admitted as a
`hypothesis` and `pending_upgrade` lists what is missing.

Store the contract next to the memory and enforce `forbidden_uses` at read
time. That read-time enforcement is your host system's job; the SDK only
produces the contract.

## 5. Full audit with source text (optional)

```js
import { fullAudit } from "@glimpsegate/admission-lab";

const r = fullAudit(reportText, { source_content: originalMaterial, check_stability: true });
r.fidelity_gate_passed; r.stability_gate_passed; r.trace;
```

`fullAudit` adds fidelity checks (does the report's reasoning trace back to
the source text) and an opt-in stability gate. It is slower, and meant for
audit reports rather than single memory writes.

## What the SDK does not do

- It does not detect all 28 documented failure modes. The engine detects a
  handful (missing source/audit refs, circular reasoning, unsafe memory write,
  overgeneralization) plus kernel controls; the rest are review vocabulary.
  See `docs/ADMISSION-TAXONOMY.md` §2.
- It does not defend against optimized memory-poisoning attacks
  (AgentPoison, MINJA). The anti-gaming gate catches explicit instructions,
  not adversarial triggers.
- It does not verify that your `source_refs` exist.

## Verify your integration

```bash
npm run test:consumer   # packs the SDK, installs it into a temp project, imports it
```
