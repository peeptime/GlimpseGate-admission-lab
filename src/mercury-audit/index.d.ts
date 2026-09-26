// Type declarations for the GlimpseGate admission SDK (API 0.8.0).
// Covers the stable integration surface. Lower-level helpers are exported at
// runtime but typed loosely on purpose until they are declared stable.

export type RoutingDecision = "accept" | "revise" | "quarantine" | "discard";
export type RiskLevel = "low" | "medium" | "high";
export type MemoryObjectType =
  | "fact" | "hypothesis" | "attribution" | "interpretation" | "open_question"
  | "preference" | "decision_record" | "temporary_note" | "reference";
export type ChoiceId = "A" | "B" | "C";

export const MERCURY_AUDIT_API_VERSION: string;
export const ADMISSION_CONTRACT_VERSION: string;
export const MERCURY_RULESET_VERSION: string;
export const MEMORY_OBJECT_TYPES: readonly MemoryObjectType[];

export interface AuditContext {
  id?: string;
  title?: string;
  type?: string;
  /**
   * Where the claim came from. Level is inferred from tokens
   * (conversation, transcript, commit, docs/, official, field-note, arxiv, ...)
   * or declared explicitly with a prefix: "primary::", "traceable::",
   * "secondary::", "ai::".
   */
  source_refs?: string | string[];
  audit_refs?: string | string[];
  risk_level?: RiskLevel;
  evidence_strength?: "weak" | "moderate" | "strong" | string;
  boundary?: string;
  scenario?: string;
  profile?: string;
  standard?: string;
  policy?: string;
  reviewer?: string;
  host_system?: string;
  intended_store?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AuditBlocker { id: string; severity: string; [key: string]: unknown }

export interface AuditResult {
  api_version: string;
  packet: Record<string, unknown>;
  decision: RoutingDecision;
  routing_decision: RoutingDecision;
  /** Blocker ids ("id:severity") plus "control:<name>" for kernel escalations. */
  reasons: string[];
  failure_modes: string[];
  blockers: AuditBlocker[];
  warnings: string[];
  required_fixes: string[];
  required_evidence: string[];
  human_review_required: boolean;
  human_review_checklist: unknown[];
  confidence: unknown;
  provenance: {
    ai_assisted: true;
    human_reviewed: "declined" | "pending" | "true" | string;
    reviewer: string;
    source_refs: string[];
    audit_refs: string[];
    generated_by: string;
    generated_at: string;
  };
  ruleset_version: string;
  [key: string]: unknown;
}

export interface FullAuditContext extends AuditContext {
  /** Full source text; enables fidelity (F1-F4) checks. */
  source_content?: string;
  /** Opt-in F5 stability gate. */
  check_stability?: boolean;
}

export interface FullAuditResult extends AuditResult {
  meta_audit: unknown;
  iteration_tracker: unknown;
  fidelity: { fidelity_score: number; [key: string]: unknown } | null;
  trace: unknown;
  fidelity_gate_passed: boolean;
  stability: unknown;
  stability_gate_passed: boolean | null;
}

export interface MemoryWriteCandidate extends AuditContext {
  content?: string;
  claim?: string;
}

export function audit(content: string | Record<string, unknown>, context?: AuditContext): AuditResult;
export function fullAudit(content: string | Record<string, unknown>, context?: FullAuditContext): FullAuditResult;
/** Defaults risk_level to "high". Throws if neither content nor claim is given. */
export function auditMemoryWrite(candidate: MemoryWriteCandidate): AuditResult;
/** True only for routing_decision "accept" with no human review required. */
export function shouldWriteMemory(result: AuditResult): boolean;
export function createAuditPacket(content: string, context?: AuditContext): Record<string, unknown>;

export interface EvidenceChain {
  packet_id?: string;
  core_claim: string;
  routing_decision: RoutingDecision;
  evidence_nodes: Array<{ ref: string; [key: string]: unknown }>;
  missing_evidence: Array<{ id: string; severity: string; description: string }>;
  suggested_choices: Array<{
    gap_id: string;
    options: Array<{ id: ChoiceId; label: string; action: string; admission_policy?: unknown }>;
  }>;
  [key: string]: unknown;
}

export function buildEvidenceChain(input: string | AuditResult, context?: AuditContext): EvidenceChain;

export interface AdmissionSelection {
  gap_id?: string;
  choice_id?: ChoiceId | string;
  object_type?: MemoryObjectType;
  claim?: string;
  reviewer?: string;
  human_reviewed?: "declined" | "pending" | "true";
  /** New evidence supplied with the choice. Required to admit a fact. */
  evidence_refs?: string | string[];
  note?: string;
}

export interface FutureUsagePolicy {
  can_use_as_fact: boolean;
  can_participate_in_reasoning: boolean;
  can_trigger_action: boolean;
  requires_source_recheck: boolean;
  citation_required: boolean;
}

export interface AdmissionContract {
  contract_version: string;
  packet_id: string;
  selected_choice: { gap_id: string; choice_id: ChoiceId; label: string; action: string };
  admitted_object: {
    object_type: MemoryObjectType;
    object_source: "claim" | "model_framing" | "user_judgment" | string;
    claim: string;
    routing_decision_at_admission: RoutingDecision | string;
    can_be_promoted_without_review: false;
  };
  future_usage_policy: FutureUsagePolicy;
  evidence_condition: string;
  evidence_condition_check: {
    required: string;
    applies: boolean;
    met: boolean;
    satisfied_by: "evidence_refs" | "named_review" | "not_required" | "none";
    qualifying_refs?: string[];
    missing: string[];
  };
  /** Present when the requested admission was downgraded for missing evidence. */
  pending_upgrade: null | {
    requested_object_type: MemoryObjectType;
    requested_usage: FutureUsagePolicy;
    admitted_as: MemoryObjectType;
    requires: string[];
    note: string;
  };
  forbidden_uses: Array<"factual_citation" | "action_trigger" | "reasoning_input">;
  [key: string]: unknown;
}

export function buildAdmissionContract(
  chain: EvidenceChain | Record<string, unknown>,
  selection?: AdmissionSelection,
  context?: { reviewer?: string; packet_id?: string }
): AdmissionContract;

export function classifySourceRef(ref: string): {
  level: "primary_or_direct" | "traceable" | "secondary" | "ai_generated" | "unknown";
  rank: number;
  ref: string;
  declared?: boolean;
};

// Loosely typed runtime exports (not yet declared stable).
export const assessSourceCredibility: (...args: any[]) => any;
export const assessLifecycle: (...args: any[]) => any;
export const assessDisagreement: (...args: any[]) => any;
export const mergeReviewerDecision: (...args: any[]) => any;
export const auditKernel: (...args: any[]) => any;
export const applyPolicy: (...args: any[]) => any;
export const listPolicies: (...args: any[]) => any;
export const resolvePolicy: (...args: any[]) => any;
export const getAuditProfile: (...args: any[]) => any;
export const listAuditProfiles: (...args: any[]) => any;
export const getAuditStandard: (...args: any[]) => any;
export const listAuditStandards: (...args: any[]) => any;
export const getAuditScenario: (...args: any[]) => any;
export const listAuditScenarios: (...args: any[]) => any;
export const scenarioDefaults: (...args: any[]) => any;
export const listSourceLevels: (...args: any[]) => any;
export const buildScenarioReviewGuidance: (...args: any[]) => any;
export const detectGamingAttempt: (...args: any[]) => any;
export const listGamingPatterns: (...args: any[]) => any;
export const compareRuleVersions: (...args: any[]) => any;
export const createRuleVersionRecord: (...args: any[]) => any;
export const needsReaudit: (...args: any[]) => any;
export const buildMissingEvidence: (...args: any[]) => any;
export const annotateChoicesWithAdmissionPolicy: (...args: any[]) => any;
export const detectMetaAuditContent: (...args: any[]) => any;
export const extractProblemResolutionPairs: (...args: any[]) => any;
export const verifyReportFidelity: (...args: any[]) => any;
export const applyFidelityGate: (...args: any[]) => any;
export const buildIterationTracker: (...args: any[]) => any;
export const getUnresolvedProblems: (...args: any[]) => any;
export const generateTraceReport: (...args: any[]) => any;
export const renderTraceMarkdown: (...args: any[]) => any;
export const generateFidelityChecklist: (...args: any[]) => any;
export const verifyAuditStability: (...args: any[]) => any;
export const applyStabilityGate: (...args: any[]) => any;
export const quickStabilityCheck: (...args: any[]) => any;
export const auditWithStabilityCheck: (...args: any[]) => any;
