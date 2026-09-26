import { classifySourceRef } from "./source-credibility.mjs";

export const ADMISSION_CONTRACT_VERSION = "2026.09.26.1";

export const MEMORY_OBJECT_TYPES = [
  "fact",
  "hypothesis",
  "attribution",
  "interpretation",
  "open_question",
  "preference",
  "decision_record",
  "temporary_note",
  "reference"
];

const choicePolicy = {
  A: {
    admission_mode: "fact",
    evidence_condition: "primary_or_named_review",
    future_usage_policy: {
      can_use_as_fact: true,
      can_participate_in_reasoning: true,
      can_trigger_action: false,
      requires_source_recheck: true,
      citation_required: true
    }
  },
  B: {
    admission_mode: "hypothesis",
    evidence_condition: "partial_or_inferred",
    future_usage_policy: {
      can_use_as_fact: false,
      can_participate_in_reasoning: true,
      can_trigger_action: false,
      requires_source_recheck: true,
      citation_required: true
    }
  },
  C: {
    admission_mode: "open_question",
    evidence_condition: "unresolved_or_quarantined",
    future_usage_policy: {
      can_use_as_fact: false,
      can_participate_in_reasoning: false,
      can_trigger_action: false,
      requires_source_recheck: true,
      citation_required: false
    }
  }
};

const failureModePolicy = {
  missing_source_refs: {
    A: { admission_mode: "reference" },
    B: { admission_mode: "interpretation" },
    C: { admission_mode: "open_question" }
  },
  missing_audit_refs: {
    A: { admission_mode: "decision_record" },
    B: { admission_mode: "open_question" },
    C: { admission_mode: "temporary_note" }
  },
  overgeneralization: {
    A: { admission_mode: "fact" },
    B: { admission_mode: "hypothesis" },
    C: { admission_mode: "reference" }
  },
  unsafe_memory_write: {
    A: { admission_mode: "decision_record" },
    B: { admission_mode: "temporary_note" },
    C: { admission_mode: "open_question" }
  },
  circular_reasoning: {
    A: { admission_mode: "fact" },
    B: { admission_mode: "hypothesis" },
    C: { admission_mode: "open_question" }
  }
};

export function buildAdmissionContract(evidenceChain, selection = {}, context = {}) {
  const chain = evidenceChain || {};
  const selectedChoiceId = normalizeChoiceId(selection.choice_id || selection.choiceId || selection.selected || "B");
  const selectedGapId = selection.gap_id || selection.gapId || firstGapId(chain);
  const selectedOption = findSelectedOption(chain.suggested_choices || [], selectedGapId, selectedChoiceId);
  const requestedPolicy = policyFor(selectedGapId, selectedChoiceId);
  const requestedObjectType = normalizeObjectType(selection.object_type || selection.objectType || requestedPolicy.admission_mode);
  const condition = evaluateEvidenceCondition(chain, selection, context, selectedGapId, requestedPolicy, requestedObjectType);
  const policy = condition.met ? requestedPolicy : downgradedPolicy(requestedPolicy);
  const admittedObject = buildAdmittedObject(chain, condition.met ? selection : { ...selection, object_type: undefined, objectType: undefined }, policy);

  return {
    contract_version: ADMISSION_CONTRACT_VERSION,
    packet_id: chain.packet_id || context.packet_id || "admission_candidate",
    selected_choice: {
      gap_id: selectedGapId,
      choice_id: selectedChoiceId,
      label: selectedOption?.label || defaultLabel(selectedChoiceId),
      action: selectedOption?.action || ""
    },
    admitted_object: admittedObject,
    source_material: {
      refs: chain.evidence_nodes?.map((node) => node.ref) || [],
      preserved_as_source: true
    },
    model_framing: {
      core_claim: chain.core_claim || "",
      confidence: chain.confidence || "unknown",
      confidence_basis: chain.confidence_basis || "",
      framing_is_memory_object: admittedObject.object_source === "model_framing",
      warning: "Mercury framing is not source material unless explicitly admitted as interpretation."
    },
    user_judgment: {
      reviewer: context.reviewer || selection.reviewer || chain.provenance?.reviewer || "project_owner_pending",
      human_reviewed: selection.human_reviewed || "declined",
      judgment_recorded: Boolean(selection.choice_id || selection.choiceId || selection.selected),
      note: selection.note || ""
    },
    future_usage_policy: policy.future_usage_policy,
    evidence_condition: requestedPolicy.evidence_condition,
    evidence_condition_check: condition,
    pending_upgrade: condition.met ? null : {
      requested_object_type: requestedObjectType,
      requested_usage: requestedPolicy.future_usage_policy,
      admitted_as: policy.admission_mode,
      requires: condition.missing,
      note: "Choosing an evidence-seeking option records intent, not evidence. The object is admitted at the weaker level until the missing evidence is supplied."
    },
    forbidden_uses: forbiddenUses(policy.future_usage_policy),
    recheck: {
      required: policy.future_usage_policy.requires_source_recheck,
      trigger: "before factual citation, action planning, or durable promotion"
    },
    provenance: {
      ai_assisted: true,
      human_reviewed: "declined",
      reviewer: context.reviewer || chain.provenance?.reviewer || "project_owner_pending",
      generated_by: "mercury-admission-contract",
      audit_ref: "src/mercury-audit/admission-contract.mjs"
    }
  };
}

export function annotateChoicesWithAdmissionPolicy(choices = []) {
  return choices.map((choice) => ({
    ...choice,
    options: (choice.options || []).map((option) => ({
      ...option,
      admission_policy: publicPolicyFor(choice.gap_id, option.id)
    }))
  }));
}

function buildAdmittedObject(chain, selection, policy) {
  const objectType = selection.object_type || selection.objectType || policy.admission_mode;
  return {
    object_type: normalizeObjectType(objectType),
    object_source: selection.object_source || selection.objectSource || objectSourceFor(objectType),
    claim: selection.claim || chain.core_claim || "",
    routing_decision_at_admission: chain.routing_decision || "revise",
    can_be_promoted_without_review: false
  };
}

// v2.3.0: enforce evidence_condition. Before this, choosing option A
// (e.g. "Find independent evidence" on circular_reasoning) immediately produced
// a fact with can_use_as_fact=true, although no evidence was ever supplied.
// That is the confidence-laundering path ROUTING-THEORY.md says must not exist.
function evaluateEvidenceCondition(chain, selection, context, gapId, policy, objectType) {
  const grantsFact = policy.future_usage_policy.can_use_as_fact || objectType === "fact";
  if (!grantsFact) {
    return { required: policy.evidence_condition, applies: false, met: true, satisfied_by: "not_required", missing: [] };
  }

  const existingRefs = new Set((chain.evidence_nodes || []).map((node) => String(node.ref)));
  const suppliedRefs = normalizeRefs(selection.evidence_refs ?? selection.evidenceRefs);
  const qualifying = suppliedRefs
    .map(classifySourceRef)
    .filter((item) => item.rank >= 4 && item.level !== "ai_generated");
  const independent = qualifying.filter((item) => !existingRefs.has(String(item.ref)));

  const reviewer = selection.reviewer || context.reviewer || "";
  const namedReview = String(selection.human_reviewed || "").toLowerCase() === "true"
    && reviewer && !/pending/i.test(reviewer);

  const needsIndependence = gapId === "circular_reasoning";
  const evidenceOk = needsIndependence ? independent.length > 0 : qualifying.length > 0;
  // Circular reasoning cannot be closed by review alone: a reviewer signing
  // off on a self-referential proof is still self-referential.
  const met = evidenceOk || (!needsIndependence && Boolean(namedReview));

  const missing = [];
  if (!met) {
    if (needsIndependence) {
      missing.push("evidence_refs: at least one primary or traceable source not already in the evidence chain and not AI-generated");
    } else {
      missing.push("evidence_refs: at least one primary or traceable, non-AI-generated source");
      missing.push("or human_reviewed: \"true\" with a named (non-pending) reviewer");
    }
  }

  return {
    required: policy.evidence_condition,
    applies: true,
    met,
    satisfied_by: evidenceOk ? "evidence_refs" : (met ? "named_review" : "none"),
    qualifying_refs: (needsIndependence ? independent : qualifying).map((item) => item.ref),
    missing
  };
}

function downgradedPolicy(policy) {
  const fallback = choicePolicy.B;
  return {
    ...fallback,
    admission_mode: "hypothesis",
    future_usage_policy: { ...fallback.future_usage_policy }
  };
}

function normalizeRefs(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [String(value)];
}

function policyFor(gapId, choiceId) {
  const base = choicePolicy[choiceId] || choicePolicy.B;
  const override = failureModePolicy[gapId]?.[choiceId] || {};
  return {
    ...base,
    ...override,
    future_usage_policy: {
      ...base.future_usage_policy,
      ...(override.future_usage_policy || {})
    }
  };
}

function publicPolicyFor(gapId, choiceId) {
  const policy = policyFor(gapId, normalizeChoiceId(choiceId));
  return {
    admission_mode: policy.admission_mode,
    evidence_condition: policy.evidence_condition,
    future_usage_policy: policy.future_usage_policy
  };
}

function firstGapId(chain) {
  return chain?.suggested_choices?.[0]?.gap_id || chain?.missing_evidence?.[0]?.id || "human_review";
}

function findSelectedOption(choices, gapId, choiceId) {
  const choice = choices.find((item) => item.gap_id === gapId) || choices[0];
  return choice?.options?.find((option) => normalizeChoiceId(option.id) === choiceId);
}

function normalizeChoiceId(value) {
  const normalized = String(value || "B").trim().toUpperCase();
  return ["A", "B", "C"].includes(normalized) ? normalized : "B";
}

function normalizeObjectType(value) {
  const normalized = String(value || "hypothesis").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return MEMORY_OBJECT_TYPES.includes(normalized) ? normalized : "hypothesis";
}

function objectSourceFor(objectType) {
  if (objectType === "interpretation") return "model_framing";
  if (objectType === "decision_record" || objectType === "preference") return "user_judgment";
  return "claim";
}

function forbiddenUses(policy) {
  const forbidden = [];
  if (!policy.can_use_as_fact) forbidden.push("factual_citation");
  if (!policy.can_trigger_action) forbidden.push("action_trigger");
  if (!policy.can_participate_in_reasoning) forbidden.push("reasoning_input");
  return forbidden;
}

function defaultLabel(choiceId) {
  if (choiceId === "A") return "Admit with stronger evidence";
  if (choiceId === "C") return "Keep unresolved";
  return "Admit as limited knowledge";
}
