import { validatePacketShape } from "./audit_schema.mjs";

const longTermTypes = new Set([
  "memory_candidate",
  "long_term_rule",
  "user_profile_update",
  "project_positioning"
]);

const customerDeliveryTypes = new Set([
  "fde_customer_delivery",
  "customer_delivery",
  "client_delivery"
]);

const absoluteTerms = [
  "always",
  "all",
  "never",
  "must",
  "only",
  "guaranteed",
  "proves",
  "所有",
  "全部",
  "永远",
  "从不",
  "必须",
  "必然",
  "唯一",
  "完全",
  "一定"
];

const unsupportedTerms = [
  "guaranteed",
  "proves",
  "will definitely",
  "必然",
  "一定会",
  "已经证明",
  "无需验证"
];

export function auditPacket(packet, options = {}) {
  const blockers = [];
  const warnings = [];
  const requiredFixes = [];
  const requiredEvidence = [];
  const sourceRefs = normalizeList(packet.source_refs);
  const auditRefs = normalizeList(packet.audit_refs);
  const claim = String(packet.claim || "");
  const type = String(packet.type || "");
  const riskLevel = String(packet.risk_level || "medium");
  const contextText = stringifyContext(packet.context);
  const shape = validatePacketShape(packet);

  for (const error of shape.errors) {
    addBlocker(blockers, "invalid_packet_shape", "critical");
    requiredFixes.push(error.message);
  }
  for (const warning of shape.warnings) {
    warnings.push(warning.message);
  }

  requireField(packet, "id", blockers, requiredFixes);
  requireField(packet, "title", blockers, requiredFixes);
  requireField(packet, "type", blockers, requiredFixes);
  requireField(packet, "claim", blockers, requiredFixes);

  if (!sourceRefs.length) {
    addBlocker(blockers, "missing_source_refs", "high");
    requiredFixes.push("Add concrete source_refs before this claim can enter any durable system.");
    requiredEvidence.push("At least one source reference tied to the original claim.");
  }

  if (!auditRefs.length) {
    addBlocker(blockers, "missing_audit_refs", "medium");
    requiredFixes.push("Add audit_refs or run a human/structural audit before durable use.");
    requiredEvidence.push("At least one audit reference that checks the claim before durable use.");
  }

  for (const missingRef of missingLocalRefs(sourceRefs, options.knownPaths)) {
    addBlocker(blockers, "missing_reference_target", "medium");
    requiredFixes.push(`Resolve missing source_ref target: ${missingRef}.`);
    requiredEvidence.push(`Readable source artifact: ${missingRef}`);
  }

  if (hasAbsoluteLanguage(claim) && !hasStrongEvidence(packet)) {
    addBlocker(blockers, "overgeneralization", "medium");
    requiredFixes.push("Narrow absolute wording or add stronger evidence for the universal claim.");
  }

  if (hasUnsupportedClaim(claim, contextText) && !hasStrongEvidence(packet)) {
    addBlocker(blockers, "unsupported_claim", "high");
    requiredFixes.push("Rewrite the claim as a hypothesis or add external evidence.");
    requiredEvidence.push("External evidence for the unsupported claim, or a narrower hypothesis statement.");
  }

  if (mentionsCircularReasoning(claim, contextText)) {
    addBlocker(blockers, "circular_reasoning", "critical");
    requiredFixes.push("Replace self-referential justification with independent evidence.");
    requiredEvidence.push("Independent evidence from outside the agent output being audited.");
  }

  if (hasConflictingEvidence(packet, contextText)) {
    addBlocker(blockers, "conflicting_evidence", "high");
    requiredFixes.push("Resolve or explicitly preserve conflicting evidence before routing.");
    requiredEvidence.push("A conflict note explaining which evidence wins and why.");
  }

  if (hasUnclearBoundary(packet)) {
    addBlocker(blockers, "unclear_boundary", "medium");
    requiredFixes.push("State the boundary: where this claim applies, and where it does not.");
  }

  if (isStale(packet)) {
    addBlocker(blockers, "stale_context", "medium");
    requiredFixes.push("Refresh time-sensitive context before using this claim.");
    requiredEvidence.push("Fresh source context or a time-bound expiry note.");
  }

  if (longTermTypes.has(type) && riskLevel === "high") {
    addBlocker(blockers, "unsafe_memory_write", "critical");
    requiredFixes.push("Require human review before any long-term memory write.");
  }

  if (customerDeliveryTypes.has(type)) {
    warnings.push("Customer/FDE delivery packets require human review even when structurally complete.");
  }

  if (packet.expected_decision && !["accept", "revise", "quarantine", "discard"].includes(packet.expected_decision)) {
    warnings.push(`Unknown expected_decision in packet: ${packet.expected_decision}`);
  }

  const routingDecision = decide({ blockers, type, riskLevel });
  const severitySummary = summarizeSeverity(blockers);
  const routingTarget = routingTargetFor(routingDecision);
  const humanReviewRequired = customerDeliveryTypes.has(type)
    || blockers.some((blocker) => blocker.severity === "critical")
    || riskLevel === "high";
  const contentSummary = buildContentSummary({ claim, type, sourceRefs, auditRefs, blockers, riskLevel });
  const humanReviewChecklist = buildHumanReviewChecklist({
    claim,
    type,
    sourceRefs,
    auditRefs,
    blockers,
    routingDecision,
    humanReviewRequired,
    confidence: structuralConfidence(blockers, sourceRefs, auditRefs)
  });

  return {
    packet_id: packet.id || "",
    packet_title: packet.title || "",
    packet_path: packet.__path || "",
    type,
    claim,
    routing_decision: routingDecision,
    blockers,
    severity_summary: severitySummary,
    warnings,
    content_summary: contentSummary,
    human_review_checklist: humanReviewChecklist,
    required_fixes: dedupe(requiredFixes),
    required_evidence: dedupe(requiredEvidence),
    revised_claim: suggestedRevision(claim, blockers),
    decision_reason: decisionReason(routingDecision, blockers, type),
    review_path: reviewPathFor({ routingDecision, humanReviewRequired }),
    routing_target: routingTarget,
    confidence: structuralConfidence(blockers, sourceRefs, auditRefs),
    human_review_required: humanReviewRequired,
    source_refs: sourceRefs,
    audit_refs: auditRefs,
    expected_decision: packet.expected_decision || "",
    expected_blockers: normalizeList(packet.expected_blockers),
    packet_hash: packet.__hash || "",
    size_bytes: packet.__size_bytes || 0
  };
}

function buildContentSummary({ claim, type, sourceRefs, auditRefs, blockers, riskLevel }) {
  const blockerIds = blockers.map((blocker) => blocker.id);
  return {
    core_claim: summarizeClaim(claim),
    attribution: sourceRefs.length
      ? `Claim is attributed to source_refs: ${sourceRefs.slice(0, 3).join(", ")}${sourceRefs.length > 3 ? ", ..." : ""}.`
      : "No source_refs are present; treat attribution as unverified until review.",
    confidence: blockerIds.some((id) => id === "missing_source_refs" || id === "circular_reasoning" || id === "unsupported_claim")
      ? "low"
      : auditRefs.length && !blockers.length ? "high" : "medium",
    confidence_basis: confidenceBasis({ blockers, sourceRefs, auditRefs, riskLevel }),
    ownership_note: ownerNote(type),
    visible_to_user: true
  };
}

function buildHumanReviewChecklist({ claim, type, sourceRefs, auditRefs, blockers, routingDecision, humanReviewRequired, confidence }) {
  const blockerIds = new Set(blockers.map((blocker) => blocker.id));
  const checklist = [];

  checklist.push({
    id: "source-statement",
    target_section: "Claim / Source refs",
    prompt: "请确认核心主张是否真的被原始来源支持。",
    claim_excerpt: summarizeClaim(claim, 140),
    source_hint: sourceRefs[0] || "missing_source_refs",
    recommended_option: sourceRefs.length ? "A" : "B",
    options: [
      { id: "A", label: "原文或可追溯来源支持", effect: "Source can remain attached to the claim." },
      { id: "B", label: "只是 AI 转述或推测", effect: "Keep or move to quarantine; add source_refs before durable use." },
      { id: "C", label: "不确定 / 需要人工补充说明", effect: "Record reviewer note and keep review open." }
    ]
  });

  checklist.push({
    id: "confidence-statement",
    target_section: "Confidence / Evidence gap",
    prompt: "请确认当前置信度是否匹配证据强度。",
    claim_excerpt: confidenceBasis({ blockers, sourceRefs, auditRefs, riskLevel: "medium" }),
    source_hint: blockerIds.size ? [...blockerIds].join(", ") : "no structural blockers",
    recommended_option: confidence === "high" ? "A" : "B",
    options: [
      { id: "A", label: "证据足够，维持当前置信度", effect: "Reviewer accepts the confidence statement." },
      { id: "B", label: "需要补充证据或降低置信度", effect: "Keep decision at revise/quarantine until evidence is added." },
      { id: "C", label: "不确定 / 需要第二人复核", effect: "Escalate to human review ledger." }
    ]
  });

  checklist.push({
    id: "attribution-statement",
    target_section: "Attribution / Audit refs",
    prompt: "请确认这条结论的归属是否正确：用户原话、现场观察、顾问框架，还是 AI 推断。",
    claim_excerpt: ownerNote(type),
    source_hint: auditRefs[0] || "missing_audit_refs",
    recommended_option: auditRefs.length ? "A" : "B",
    options: [
      { id: "A", label: "归属正确，可以保留", effect: "Attribution can be used in the report." },
      { id: "B", label: "归属需要改写", effect: "Revise attribution before report or memory use." },
      { id: "C", label: "不确定 / 自定义归属", effect: "Reviewer supplies a custom attribution note." }
    ]
  });

  if (humanReviewRequired || routingDecision !== "accept") {
    checklist.push({
      id: "route-confirmation",
      target_section: "Routing decision",
      prompt: `请确认处理方式是否应保持为 ${routingDecision}。`,
      claim_excerpt: `Current decision: ${routingDecision}`,
      source_hint: `${blockers.length} blocker(s), type=${type || "unknown"}`,
      recommended_option: routingDecision === "accept" ? "A" : "B",
      options: [
        { id: "A", label: "同意当前处理方式", effect: "Record reviewer agreement with the route." },
        { id: "B", label: "需要修改后再决定", effect: "Keep item open and add required fixes." },
        { id: "C", label: "不同意 / 另写处理方式", effect: "Record custom route note for review ledger." }
      ]
    });
  }

  return checklist;
}

function summarizeClaim(claim, limit = 220) {
  const normalized = String(claim || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "No claim supplied.";
  return normalized.length > limit ? `${normalized.slice(0, limit - 1)}...` : normalized;
}

function confidenceBasis({ blockers, sourceRefs, auditRefs, riskLevel }) {
  if (!sourceRefs.length) {
    return "Low: no source_refs are present.";
  }
  if (blockers.some((blocker) => blocker.severity === "critical")) {
    return "Low: at least one critical blocker is present.";
  }
  if (!auditRefs.length) {
    return "Medium: source_refs exist, but audit_refs are missing.";
  }
  if (riskLevel === "high") {
    return "Medium: evidence exists, but the packet is high risk and still needs review.";
  }
  if (blockers.length) {
    return "Medium: evidence exists, but blockers need revision.";
  }
  return "High: source_refs and audit_refs are present and no blocker fired.";
}

function ownerNote(type) {
  if (customerDeliveryTypes.has(type)) {
    return "Customer/FDE material: preserve speaker, context, and dissent before delivery use.";
  }
  if (longTermTypes.has(type)) {
    return "Long-term memory candidate: do not attribute to the user unless the source explicitly supports it.";
  }
  return "General audit packet: distinguish user statement, AI inference, and project-owner judgment.";
}

export function auditPackets(packets, options = {}) {
  const start = performance.now();
  const knownPaths = options.knownPaths || new Set(packets.map((packet) => packet.__path).filter(Boolean));
  const results = packets.map((packet) => auditPacket(packet, { ...options, knownPaths }));
  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  return {
    schema_version: "0.2",
    generated_at: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      accept: count(results, "accept"),
      revise: count(results, "revise"),
      quarantine: count(results, "quarantine"),
      discard: count(results, "discard"),
      human_review_required: results.filter((result) => result.human_review_required).length,
      blockers: summarizeBlockers(results),
      duration_ms: durationMs,
      packets_per_second: durationMs > 0 ? Math.round((results.length / durationMs) * 100000) / 100 : results.length
    }
  };
}

function decide({ blockers, type, riskLevel }) {
  const ids = new Set(blockers.map((blocker) => blocker.id));
  if (ids.has("circular_reasoning") && ids.has("missing_source_refs")) {
    return "discard";
  }
  if (ids.has("missing_source_refs") && ids.has("missing_audit_refs") && ids.has("unsupported_claim")) {
    return "discard";
  }
  if (ids.has("invalid_packet_shape")) {
    return "quarantine";
  }
  if (ids.has("unsafe_memory_write") || (riskLevel === "high" && ids.has("missing_audit_refs"))) {
    return "quarantine";
  }
  if (longTermTypes.has(type) && ids.has("missing_audit_refs")) {
    return "quarantine";
  }
  if (ids.has("missing_source_refs")) {
    return "quarantine";
  }
  if (blockers.length) {
    return "revise";
  }
  return "accept";
}

function requireField(packet, field, blockers, requiredFixes) {
  if (packet[field] === undefined || packet[field] === "" || (Array.isArray(packet[field]) && !packet[field].length)) {
    addBlocker(blockers, `missing_${field}`, "high");
    requiredFixes.push(`Add required field: ${field}.`);
  }
}

function addBlocker(blockers, id, severity) {
  if (blockers.some((blocker) => blocker.id === id)) {
    return;
  }
  blockers.push({
    id,
    severity,
    message: blockerMessage(id)
  });
}

function blockerMessage(id) {
  const messages = {
    circular_reasoning: "The claim is justified by itself or by another unverified AI conclusion.",
    conflicting_evidence: "The packet acknowledges evidence that conflicts with the claim.",
    missing_audit_refs: "No audit reference supports durable use of the claim.",
    missing_claim: "The packet has no auditable claim.",
    missing_id: "The packet has no stable id.",
    missing_reference_target: "A local reference points to a file that is not present.",
    missing_source_refs: "No source reference supports the claim.",
    missing_title: "The packet has no human-readable title.",
    missing_type: "The packet has no packet type.",
    overgeneralization: "The claim uses absolute language without strong evidence.",
    stale_context: "The context is time-sensitive or stale.",
    unclear_boundary: "The packet does not say where the claim applies or stops applying.",
    unsafe_memory_write: "The claim is high-risk and targets durable memory or project positioning.",
    unsupported_claim: "The claim goes beyond the supplied evidence."
  };
  return messages[id] || "Audit blocker.";
}

function hasAbsoluteLanguage(claim) {
  const normalized = claim.toLowerCase();
  return absoluteTerms.some((term) => normalized.includes(term.toLowerCase()));
}

function hasUnsupportedClaim(claim, contextText) {
  const normalized = `${claim}\n${contextText}`.toLowerCase();
  return unsupportedTerms.some((term) => normalized.includes(term.toLowerCase()));
}

function hasStrongEvidence(packet) {
  const sourceRefs = normalizeList(packet.source_refs);
  const auditRefs = normalizeList(packet.audit_refs);
  if (packet.evidence_strength === "strong") {
    return sourceRefs.length > 0 && auditRefs.length > 0;
  }
  return sourceRefs.length >= 2 && auditRefs.length >= 2 && String(packet.risk_level || "") === "low";
}

function mentionsCircularReasoning(claim, contextText) {
  const normalized = `${claim}\n${contextText}`.toLowerCase();
  return normalized.includes("because the ai said so")
    || normalized.includes("self-referential")
    || normalized.includes("circular")
    || normalized.includes("循环论证")
    || normalized.includes("自证")
    // Absorbed from the former dashboard-only lite rules (v2.4.0), so the
    // SDK is the single source of routing truth for every surface.
    || normalized.includes("because the ai summary")
    || normalized.includes("summary says every blocker")
    || normalized.includes("ai 总结说");
}

function hasConflictingEvidence(packet, contextText) {
  if (packet.conflicting_evidence === true || packet.conflicting_evidence === "true") {
    return true;
  }
  const normalized = `${stringifyContext(packet.context)}\n${contextText}`.toLowerCase();
  return normalized.includes("conflicting evidence")
    || normalized.includes("contradicts")
    || normalized.includes("冲突证据")
    || normalized.includes("相互矛盾");
}

function hasUnclearBoundary(packet) {
  if (packet.boundary || packet.scope) {
    return false;
  }
  const type = String(packet.type || "");
  return type === "project_positioning" || type === "fde_customer_delivery";
}

function isStale(packet) {
  const contextText = stringifyContext(packet.context).toLowerCase();
  return contextText.includes("stale") || contextText.includes("过期") || contextText.includes("outdated");
}

function structuralConfidence(blockers, sourceRefs, auditRefs) {
  if (!sourceRefs.length || blockers.some((blocker) => blocker.severity === "critical")) {
    return "low";
  }
  if (!auditRefs.length || blockers.length) {
    return "medium";
  }
  return "high";
}

function suggestedRevision(claim, blockers) {
  const ids = new Set(blockers.map((blocker) => blocker.id));
  if (!claim) return "";
  if (ids.has("overgeneralization")) {
    return claim
      .replace(/\ball\b/gi, "some")
      .replace(/\balways\b/gi, "often")
      .replace(/\bmust\b/gi, "should")
      .replace(/所有/g, "部分")
      .replace(/必须/g, "应该")
      .replace(/必然/g, "可能");
  }
  if (ids.has("unsupported_claim")) {
    return `Hypothesis pending evidence: ${claim}`;
  }
  return "";
}

function decisionReason(routingDecision, blockers, type) {
  if (routingDecision === "accept") {
    return "No refusal point triggered; source and audit references are present.";
  }
  const blockerText = blockers.map((blocker) => blocker.id).join(", ") || "no blockers";
  return `${type || "packet"} routed to ${routingDecision} because: ${blockerText}.`;
}

function reviewPathFor({ routingDecision, humanReviewRequired }) {
  const path = ["packet", "structural_audit", routingDecision];
  if (humanReviewRequired) {
    path.push("human_review");
  }
  return path;
}

function routingTargetFor(decision) {
  const targets = {
    accept: "dist/memory-flow/accepted_memory",
    revise: "dist/memory-flow/revision_queue",
    quarantine: "dist/memory-flow/quarantine_memory",
    discard: "dist/memory-flow/discarded_memory"
  };
  return targets[decision] || "dist/memory-flow/review";
}

function summarizeSeverity(blockers) {
  return {
    critical: blockers.filter((blocker) => blocker.severity === "critical").length,
    high: blockers.filter((blocker) => blocker.severity === "high").length,
    medium: blockers.filter((blocker) => blocker.severity === "medium").length,
    low: blockers.filter((blocker) => blocker.severity === "low").length
  };
}

function summarizeBlockers(results) {
  const counts = {};
  for (const result of results) {
    for (const blocker of result.blockers) {
      counts[blocker.id] = (counts[blocker.id] || 0) + 1;
    }
  }
  return counts;
}

function missingLocalRefs(refs, knownPaths = new Set()) {
  return refs.filter((ref) => looksLocal(ref) && !knownPaths.has(ref));
}

function looksLocal(ref) {
  return /^(00_|01_|02_|03_|04_|05_|06_|07_|08_|09_|10_|11_|docs\/|examples\/|schemas\/|scripts\/|README|CHANGELOG|MEMORY)/.test(ref);
}

function stringifyContext(context) {
  if (!context) return "";
  if (typeof context === "string") return context;
  return Object.values(context).join("\n");
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [String(value)].filter(Boolean);
}

function dedupe(values) {
  return [...new Set(values)];
}

function count(results, decision) {
  return results.filter((result) => result.routing_decision === decision).length;
}
