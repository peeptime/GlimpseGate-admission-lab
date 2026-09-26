import { createHash } from "node:crypto";
import { auditKernel } from "./kernel.mjs";
import { applyPolicy, listPolicies, resolvePolicy } from "./policy.mjs";
import { getAuditProfile, listAuditProfiles } from "./profiles.mjs";
import { getAuditStandard, listAuditStandards } from "./standards.mjs";
import { assessSourceCredibility, classifySourceRef, listSourceLevels } from "./source-credibility.mjs";
import { assessLifecycle } from "./lifecycle.mjs";
import { assessDisagreement, mergeReviewerDecision } from "./disagreement.mjs";
import { getAuditScenario, listAuditScenarios, scenarioDefaults } from "./scenarios.mjs";
import { buildScenarioReviewGuidance } from "./review-ux.mjs";
import { detectGamingAttempt, listGamingPatterns } from "./anti-gaming.mjs";
import { MERCURY_RULESET_VERSION, compareRuleVersions, createRuleVersionRecord, needsReaudit } from "./rule-versioning.mjs";
import { buildEvidenceChain, buildMissingEvidence } from "./evidence-chain.mjs";
import { ADMISSION_CONTRACT_VERSION, MEMORY_OBJECT_TYPES, annotateChoicesWithAdmissionPolicy, buildAdmissionContract } from "./admission-contract.mjs";

// ── New v2.0 fidelity modules ────────────────────────────────────────────
import { detectMetaAuditContent, extractProblemResolutionPairs } from "./meta-audit.mjs";
import { verifyReportFidelity, applyFidelityGate } from "./fidelity.mjs";
import { buildIterationTracker, getUnresolvedProblems } from "./iteration-track.mjs";
import { generateTraceReport, renderTraceMarkdown, generateFidelityChecklist } from "./trace.mjs";
import {
  verifyAuditStability,
  applyStabilityGate,
  quickStabilityCheck,
  auditWithStabilityCheck
} from "./fidelity-stability.mjs";

export const MERCURY_AUDIT_API_VERSION = "0.8.0";

export { applyPolicy, listPolicies, resolvePolicy };
export {
  assessDisagreement,
  assessLifecycle,
  assessSourceCredibility,
  auditKernel,
  ADMISSION_CONTRACT_VERSION,
  annotateChoicesWithAdmissionPolicy,
  buildAdmissionContract,
  buildEvidenceChain,
  buildMissingEvidence,
  buildScenarioReviewGuidance,
  classifySourceRef,
  compareRuleVersions,
  createRuleVersionRecord,
  detectGamingAttempt,
  detectMetaAuditContent,
  extractProblemResolutionPairs,
  getAuditScenario,
  getAuditProfile,
  getAuditStandard,
  getUnresolvedProblems,
  generateTraceReport,
  generateFidelityChecklist,
  listGamingPatterns,
  listAuditProfiles,
  listAuditScenarios,
  listAuditStandards,
  listSourceLevels,
  MEMORY_OBJECT_TYPES,
  MERCURY_RULESET_VERSION,
  needsReaudit,
  renderTraceMarkdown,
  scenarioDefaults,
  verifyReportFidelity,
  applyFidelityGate,
  buildIterationTracker,
  // F5
  verifyAuditStability,
  applyStabilityGate,
  quickStabilityCheck,
  auditWithStabilityCheck
};

export function createAuditPacket(content, context = {}) {
  const claim = String(content || "").trim();
  const id = context.id || `sdk_${hashText(`${claim}\n${JSON.stringify(context)}`).slice(0, 12)}`;

  return {
    id,
    title: context.title || "SDK memory write candidate",
    type: context.type || "memory_candidate",
    claim,
    source_refs: normalizeRefs(context.source_refs ?? context.sourceRefs),
    audit_refs: normalizeRefs(context.audit_refs ?? context.auditRefs),
    risk_level: context.risk_level || context.riskLevel || "medium",
    context: {
      capture_source: context.capture_source || context.source || "sdk_api",
      host_system: context.host_system || context.hostSystem || "",
      intended_store: context.intended_store || context.intendedStore || "",
      metadata: context.metadata || {}
    },
    evidence_strength: context.evidence_strength || context.evidenceStrength || "",
    boundary: context.boundary || context.scope || ""
  };
}

export function audit(contentOrPacket, context = {}) {
  const packet = isAuditPacket(contentOrPacket)
    ? normalizePacket(contentOrPacket, context)
    : createAuditPacket(contentOrPacket, context);
  const scenario = getAuditScenario(context.scenario || packet.scenario || context.audit_scenario);
  const defaults = context.scenario || packet.scenario || context.audit_scenario
    ? scenarioDefaults(scenario)
    : {};
  const knownPaths = new Set(context.knownPaths || context.known_paths || []);
  const policyResult = auditKernel(packet, {
    ...context,
    profile: context.profile || defaults.profile,
    standard: context.standard || defaults.standard,
    knownPaths
  });
  const reviewGuidance = buildScenarioReviewGuidance(policyResult, scenario);

  return {
    api_version: MERCURY_AUDIT_API_VERSION,
    packet,
    decision: policyResult.routing_decision,
    routing_decision: policyResult.routing_decision,
    reasons: buildReasons(policyResult),
    failure_modes: policyResult.blockers.map((blocker) => blocker.id),
    blockers: policyResult.blockers,
    warnings: policyResult.warnings,
    required_fixes: policyResult.required_fixes,
    required_evidence: policyResult.required_evidence,
    content_summary: policyResult.content_summary,
    human_review_checklist: policyResult.human_review_checklist,
    human_review_required: policyResult.human_review_required,
    confidence: policyResult.confidence,
    provenance: buildProvenance(packet, context),
    kernel: policyResult.kernel,
    source_credibility: policyResult.source_credibility,
    lifecycle: policyResult.lifecycle,
    review_disagreement: policyResult.review_disagreement,
    anti_gaming: policyResult.anti_gaming,
    ruleset_version: MERCURY_RULESET_VERSION,
    scenario,
    review_guidance: reviewGuidance,
    policy: policyResult.policy,
    raw_result: policyResult
  };
}

/**
 * v2.0 新增：全量审计（含忠实度验证）
 *
 * 完整流程：
 *  ① 元级审计识别（F3）→ 是否为已完成审计的材料？
 *  ② 轮次感知追踪（F2）→ 哪些问题已消解？
 *  ③ 报告忠实度验证（F1）→ 未消解的问题是否在原材料中有对应引用？
 *  ④ 溯源标注（F4）→ 每个结论附带原文引用
 *  ⑤ 如忠实度低，触发 human_review_required
 *
 * @param {string|Object} contentOrPacket
 * @param {Object} context - 可选 { source_content: string } 提供原材料全文以启用完整F1-F4
 * @returns {Object} full audit result with fidelity + trace
 */
export function fullAudit(contentOrPacket, context = {}) {
  const sourceContent = context.source_content || extractContent(contentOrPacket);

  // ① 元级审计识别
  const metaDetection = sourceContent ? detectMetaAuditContent(sourceContent) : null;

  // ② 轮次感知追踪（仅当检测到元级审计材料时）
  let iterationTracker = null;
  if (metaDetection?.is_meta && sourceContent) {
    iterationTracker = buildIterationTracker(sourceContent);
  }

  // ③ 标准审计（kernel）
  const baseAudit = audit(contentOrPacket, context);

  // ④ 忠实度验证 F1（需要原材料全文）
  let fidelityReport = null;
  let traceReport = null;
  let adjustedAudit = baseAudit;

  if (sourceContent) {
    fidelityReport = verifyReportFidelity(baseAudit, sourceContent);
    adjustedAudit = applyFidelityGate(baseAudit, fidelityReport);

    // ⑤ 溯源标注 F4
    traceReport = generateTraceReport(adjustedAudit, sourceContent, fidelityReport);
  }

  // ⑥ 生成忠实度调整后的 Human Review Checklist
  const fidelityChecklist = traceReport && fidelityReport
    ? generateFidelityChecklist(adjustedAudit, traceReport, fidelityReport)
    : [];

  // 合并 Checklist（忠实度项 + 原 Checklist）
  const mergedChecklist = [
    ...fidelityChecklist,
    ...(adjustedAudit.human_review_checklist || [])
  ];

  // ⑦ F5 稳定性检查（opt-in，避免破坏现有流程）
  let stabilityResult = null;
  let finalAudit = adjustedAudit;

  if (context.check_stability) {
    stabilityResult = verifyAuditStability(adjustedAudit);
    finalAudit = applyStabilityGate(adjustedAudit, stabilityResult);
  }

  return {
    ...finalAudit,
    human_review_checklist: mergedChecklist.length > 0 ? mergedChecklist : finalAudit.human_review_checklist,
    api_version: MERCURY_AUDIT_API_VERSION,
    // F1-F4 字段
    meta_audit: metaDetection,
    iteration_tracker: iterationTracker,
    fidelity: fidelityReport,
    trace: traceReport,
    fidelity_gate_passed: fidelityReport ? fidelityReport.fidelity_score >= 1.0 : true,
    // F5 字段（opt-in）
    stability: stabilityResult,
    stability_gate_passed: stabilityResult ? stabilityResult.is_stable : null,
    // routing 调整（综合 F1-F5）
    routing_decision: routingDecisionFromMetaAudit(
      finalAudit.routing_decision,
      iterationTracker,
      fidelityReport
    )
  };
}

/**
 * Derive routing decision from meta-audit material.
 * If all problems are resolved, upgrade from quarantine to revise.
 */
function routingDecisionFromMetaAudit(baseDecision, tracker, fidelity) {
  if (!tracker || !fidelity) return baseDecision;

  // All round problems resolved + fidelity high → upgrade
  if (tracker.unresolved_count === 0 && fidelity.fidelity_score >= 1.0) {
    if (baseDecision === "quarantine") return "revise";
    if (baseDecision === "revise") return "revise";
  }

  return baseDecision;
}

function extractContent(contentOrPacket) {
  if (typeof contentOrPacket === "string") return contentOrPacket;
  if (typeof contentOrPacket === "object" && contentOrPacket.claim) return contentOrPacket.claim;
  return null;
}

export function auditMemoryWrite(candidate = {}) {
  if (!candidate.content && !candidate.claim) {
    throw new Error("auditMemoryWrite requires candidate.content or candidate.claim.");
  }

  return audit(candidate.claim || candidate.content, {
    ...candidate,
    type: candidate.type || "memory_candidate",
    risk_level: candidate.risk_level || candidate.riskLevel || "high",
    capture_source: candidate.capture_source || "memory_write_hook"
  });
}

export function shouldWriteMemory(auditResult) {
  return auditResult.routing_decision === "accept" && !auditResult.human_review_required;
}

function normalizePacket(packet, context) {
  return {
    ...packet,
    source_refs: normalizeRefs(packet.source_refs ?? context.source_refs ?? context.sourceRefs),
    audit_refs: normalizeRefs(packet.audit_refs ?? context.audit_refs ?? context.auditRefs),
    risk_level: packet.risk_level || context.risk_level || context.riskLevel || "medium",
    context: packet.context || context.metadata || {}
  };
}

function buildReasons(result) {
  const blockerReasons = result.blockers.map((blocker) => `${blocker.id}:${blocker.severity}`);
  // v2.3.0: kernel controls can escalate the route without adding a blocker
  // (e.g. source floor, lifecycle). Earlier versions then reported the
  // structural "no refusal point" reason next to a non-accept route.
  const controlReasons = (result.kernel_controls || []).map((control) => `control:${control}`);
  const reasons = [...blockerReasons, ...controlReasons];
  return reasons.length ? reasons : [result.decision_reason];
}

function buildProvenance(packet, context) {
  return {
    ai_assisted: true,
    human_reviewed: "declined",
    reviewer: context.reviewer || "host_system_pending",
    source_refs: normalizeRefs(packet.source_refs),
    audit_refs: normalizeRefs(packet.audit_refs),
    generated_by: "mercury-audit-sdk",
    generated_at: new Date().toISOString()
  };
}

function isAuditPacket(value) {
  return Boolean(value && typeof value === "object" && value.claim);
}

function normalizeRefs(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [String(value)].filter(Boolean);
}

function hashText(text) {
  return createHash("sha256").update(text).digest("hex");
}
