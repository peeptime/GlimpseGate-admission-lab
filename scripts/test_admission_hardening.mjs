// v2.3.0 regression tests: admission-contract evidence enforcement,
// source-ref classification, reason explainability, package self-reference.
import assert from "node:assert/strict";
import * as sdk from "@glimpsegate/admission-lab";

const { audit, buildAdmissionContract, classifySourceRef, MERCURY_AUDIT_API_VERSION } = sdk;

assert.equal(MERCURY_AUDIT_API_VERSION, "0.8.0");

// 1. Source classification uses token boundaries, not substrings.
for (const ref of ["email:ceo-2026-09", "meeting-detail:q3", "domain-expert-note"]) {
  assert.notEqual(classifySourceRef(ref).level, "ai_generated", `${ref} must not be read as AI-generated`);
}
assert.equal(classifySourceRef("ai-summary:run-1").level, "ai_generated");
assert.equal(classifySourceRef("llm output").level, "ai_generated");
assert.equal(classifySourceRef("conversation:2026-09-26").level, "traceable");
assert.equal(classifySourceRef("docs/SPEC.md").level, "traceable");
assert.equal(classifySourceRef("field-note:site-visit").level, "primary_or_direct");
const declared = classifySourceRef("primary::chat:2026-09-26");
assert.equal(declared.level, "primary_or_direct");
assert.equal(declared.declared, true);

// 2. Reasons explain kernel escalations instead of contradicting the route.
const floorMiss = audit("User prefers dark mode.", {
  source_refs: ["chat:2026-09-26"], audit_refs: ["review:1"], risk_level: "low", boundary: "UI only"
});
assert.equal(floorMiss.routing_decision, "revise");
assert.ok(floorMiss.reasons.includes("control:source_credibility_floor"), JSON.stringify(floorMiss.reasons));
assert.ok(!floorMiss.reasons.some((r) => /No refusal point/.test(r)));

// 3. Admission contract: choosing an evidence-seeking option is intent, not evidence.
const chain = {
  core_claim: "The analysis is correct.",
  routing_decision: "discard",
  evidence_nodes: [{ ref: "ai-summary:run-1" }],
  suggested_choices: [{ gap_id: "circular_reasoning", options: [] }]
};

const intentOnly = buildAdmissionContract(chain, { gap_id: "circular_reasoning", choice_id: "A" });
assert.equal(intentOnly.admitted_object.object_type, "hypothesis");
assert.equal(intentOnly.future_usage_policy.can_use_as_fact, false);
assert.equal(intentOnly.evidence_condition_check.met, false);
assert.equal(intentOnly.pending_upgrade.requested_object_type, "fact");
assert.ok(intentOnly.forbidden_uses.includes("factual_citation"));

const reviewOnlyCircular = buildAdmissionContract(chain, {
  gap_id: "circular_reasoning", choice_id: "A", human_reviewed: "true", reviewer: "project_owner"
});
assert.equal(reviewOnlyCircular.admitted_object.object_type, "hypothesis", "review cannot close a circular proof");

const reusedRef = buildAdmissionContract(chain, {
  gap_id: "circular_reasoning", choice_id: "A", evidence_refs: ["ai-summary:run-1"]
});
assert.equal(reusedRef.admitted_object.object_type, "hypothesis", "AI-generated / already-cited ref is not independent");

const independent = buildAdmissionContract(chain, {
  gap_id: "circular_reasoning", choice_id: "A", evidence_refs: ["primary::interview:2026-09-20"]
});
assert.equal(independent.admitted_object.object_type, "fact");
assert.equal(independent.future_usage_policy.can_use_as_fact, true);
assert.equal(independent.evidence_condition_check.satisfied_by, "evidence_refs");
assert.equal(independent.pending_upgrade, null);

const namedReview = buildAdmissionContract(chain, {
  gap_id: "overgeneralization", choice_id: "A", human_reviewed: "true", reviewer: "project_owner"
});
assert.equal(namedReview.admitted_object.object_type, "fact");
assert.equal(namedReview.evidence_condition_check.satisfied_by, "named_review");

const pendingReviewer = buildAdmissionContract(chain, {
  gap_id: "overgeneralization", choice_id: "A", human_reviewed: "true", reviewer: "project_owner_pending"
});
assert.equal(pendingReviewer.admitted_object.object_type, "hypothesis", "pending reviewer is not a named review");

const forcedFact = buildAdmissionContract(chain, {
  gap_id: "missing_source_refs", choice_id: "B", object_type: "fact"
});
assert.equal(forcedFact.admitted_object.object_type, "hypothesis", "object_type override cannot bypass the condition");

// Non-fact admissions are unaffected.
const openQ = buildAdmissionContract(chain, { gap_id: "unsafe_memory_write", choice_id: "C" });
assert.equal(openQ.admitted_object.object_type, "open_question");
assert.equal(openQ.evidence_condition_check.applies, false);
assert.equal(openQ.pending_upgrade, null);

console.log("OK admission hardening tests passed");
