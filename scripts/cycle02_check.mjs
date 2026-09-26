import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const strict = process.argv.includes("--strict");

const checks = [];
const warnings = [];

const packageJson = await readJson("package.json");
const productSurfaceUnfreeze = packageJson.version.startsWith("1.3.")
  && await exists("docs/PRODUCT-SURFACE-PRESSURE-TEST.md");
const methodDepthUnfreeze = packageJson.version.startsWith("1.4.")
  && await exists("docs/CYCLE-04-BLUEPRINT.md");
const reviewUxUnfreeze = packageJson.version.startsWith("1.5.")
  && await exists("docs/START-HERE.md")
  && await exists("docs/SCOPE.md");
const sdkIntegrationUnfreeze = packageJson.version.startsWith("1.6.")
  && await exists("docs/SDK-API.md")
  && await exists("docs/OWASP-AISVS-C8-MAPPING.md");
const auditKernelUnfreeze = packageJson.version.startsWith("1.7.")
  && await exists("docs/AUDIT-KERNEL.md")
  && await exists("docs/MERCURY-AGENT-RELATIONSHIP.md");
const scenarioPackUnfreeze = packageJson.version.startsWith("1.8.")
  && await exists("docs/SCENARIO-PACKS.md")
  && await exists("docs/ADAPTER-CONTRACT.md");
const proofGovernanceUnfreeze = packageJson.version.startsWith("1.9.")
  && await exists("docs/PROOF-PACK-002.md")
  && await exists("docs/RULE-VERSION-GOVERNANCE.md");
const v2PreflightUnfreeze = packageJson.version.startsWith("2.0.0-alpha.1")
  && await exists("docs/V2-PREFLIGHT-REQUIREMENTS.md")
  && await exists("docs/V2-WORK-TRAIN.md");
const v2CaseFoundationUnfreeze = packageJson.version.startsWith("2.0.0-alpha.2")
  && await exists("docs/REAL-CASES-SUMMARY.md")
  && await exists("examples/integration-demo/openclaw-hook.mjs")
  && await exists("examples/starter-kit/hello-audit.mjs");
const v2EvidenceInterfaceUnfreeze = packageJson.version.startsWith("2.0.0-alpha.3")
  && await exists("src/mercury-audit/evidence-chain.mjs")
  && await exists("docs/A2A-AGENT-CARD-BLUEPRINT.md")
  && await exists("examples/a2a/agent-card.json");
const v2PortableEvidenceChain = packageJson.version === "2.0.0"
  && await exists("docs/PERFORMANCE-2.0.md")
  && await exists("scripts/benchmark_v2_paths.mjs")
  && await exists("scripts/check_mercury_skills.mjs")
  && await exists("08_skills/mercury-evidence-chain/SKILL.md")
  && await exists("08_skills/mercury-memory-gate/SKILL.md")
  && await exists("08_skills/mercury-case-capture/SKILL.md");
const v2AdmissionReframe = packageJson.version === "2.0.1"
  && await exists("docs/ITERATION-GUIDE-2.0.1.md")
  && (await readText("README.en.md")).includes("Mercury Admission Lab")
  && (await readText("README.en.md")).includes("Known Boundaries")
  && (await readText("README.md")).includes("Mercury Admission Lab")
  && (await readText("README.md")).includes("已知边界");
const v2AdmissionContract = packageJson.version === "2.0.2"
  && await exists("docs/ITERATION-GUIDE-2.0.2.md")
  && await exists("src/mercury-audit/admission-contract.mjs")
  && (await readText("README.en.md")).includes("structured admission choices")
  && (await readText("README.md")).includes("Admission Contract");
// 2.3.0: the version gate used an allowlist of exact releases, so every release
// after 2.0.2 (2.1.x, 2.2.0) failed CI. A release now counts as a documented
// unfreeze line when it has its own iteration guide and a CHANGELOG entry.
const changelogText = await readText("CHANGELOG.md");
const documentedRelease = await exists(`docs/ITERATION-GUIDE-${packageJson.version}.md`)
  && new RegExp(`^## ${packageJson.version.replace(/\./g, "\\.")}(?=\\s)`, "m").test(changelogText);
const proofPack = await readText("docs/PROOF-PACK-001.md");
const proofPack002 = await readText("docs/PROOF-PACK-002.md");
const failureModes = await readText("docs/FAILURE-MODES.md");
const charterUsers = await readText("docs/CHARTER-USER-RECORDS.md");
const reviewLedger = await readText("docs/REVIEW-LEDGER.md");
const auditRules = await readText("scripts/audit-core/audit_rules.mjs");
const htmlReport = await readText("scripts/generate_audit_reports.mjs");
const liteMode = await readText("dashboard/lite.html");

check("version stays on an explicitly documented unfreeze line", packageJson.version.startsWith("1.2.") || productSurfaceUnfreeze || methodDepthUnfreeze || reviewUxUnfreeze || sdkIntegrationUnfreeze || auditKernelUnfreeze || scenarioPackUnfreeze || proofGovernanceUnfreeze || v2PreflightUnfreeze || v2CaseFoundationUnfreeze || v2EvidenceInterfaceUnfreeze || v2PortableEvidenceChain || v2AdmissionReframe || v2AdmissionContract || documentedRelease);
if (productSurfaceUnfreeze) {
  warnings.push("product surface / Lite intake patch line detected: method-layer Cycle 02 checks still apply, but v1.3.x is allowed for product UI and entry-friction fixes");
}
if (methodDepthUnfreeze) {
  warnings.push("Cycle 04 method-depth line detected: Cycle 02 honesty checks still apply, but v1.4.x is allowed for taxonomy, routing theory, coverage, and related-work docs");
  for (const path of [
    "docs/AGENT-AUDIT-BLUEPRINT.md",
    "docs/CYCLE-04-BLUEPRINT.md",
    "docs/PROOF-PACK-COVERAGE-MATRIX.md",
    "docs/RELATED-WORK.md",
    "docs/ROUTING-THEORY.md"
  ]) {
    check(`Cycle 04 method doc exists: ${path}`, await exists(path));
  }
  check("Failure Mode Dictionary has taxonomy layer", failureModes.includes("## Taxonomy Layer"));
}
if (reviewUxUnfreeze) {
  warnings.push("Human Review Checklist UX line detected: v1.5.x is allowed for review guidance, START-HERE, scope, i18n, and progressive-disclosure work");
  for (const path of [
    "docs/START-HERE.md",
    "docs/SCOPE.md",
    "docs/EXPORT-GUIDE.md",
    "docs/I18N-UX-POLICY.md"
  ]) {
    check(`review UX doc exists: ${path}`, await exists(path));
  }
  check("audit core emits content summary", auditRules.includes("content_summary"));
  check("audit core emits human review checklist", auditRules.includes("human_review_checklist"));
  check("HTML report renders checklist choices", htmlReport.includes("Human Review Checklist") && htmlReport.includes("复制复核记录"));
  check("Lite Mode defaults to Chinese review checklist layer", liteMode.includes("Human Review Checklist") && liteMode.includes("处理方式") && liteMode.includes("查看技术详情"));
}
if (sdkIntegrationUnfreeze) {
  warnings.push("Pre-storage SDK integration line detected: v1.6.x is allowed for local SDK/API, demo hook, benchmark, and OWASP C8 mapping work");
  for (const path of [
    "src/mercury-audit/index.mjs",
    "src/mercury-audit/policy.mjs",
    "scripts/test_sdk_api.mjs",
    "scripts/benchmark_audit_sdk.mjs",
    "examples/integration-demo/memory-write-hook.mjs",
    "docs/SDK-API.md",
    "docs/OWASP-AISVS-C8-MAPPING.md",
    "docs/INTEGRATION-DEMO.md",
    "docs/BENCHMARKS.md"
  ]) {
    check(`SDK integration artifact exists: ${path}`, await exists(path));
  }
  const sdkApi = await readText("src/mercury-audit/index.mjs");
  check("SDK exports audit API", sdkApi.includes("export function audit(") && sdkApi.includes("auditMemoryWrite"));
  check("package exports local SDK entry", Boolean(packageJson.exports?.["."]));
  check("package exposes SDK scripts", Boolean(packageJson.scripts?.["test:sdk"]) && Boolean(packageJson.scripts?.["demo:memory-hook"]) && Boolean(packageJson.scripts?.["benchmark:audit"]));
}
if (auditKernelUnfreeze) {
  warnings.push("Audit kernel independence line detected: v1.7.x is allowed for profile, standard, source, lifecycle, disagreement, and brand-relationship work");
  for (const path of [
    "src/mercury-audit/kernel.mjs",
    "src/mercury-audit/profiles.mjs",
    "src/mercury-audit/standards.mjs",
    "src/mercury-audit/source-credibility.mjs",
    "src/mercury-audit/lifecycle.mjs",
    "src/mercury-audit/disagreement.mjs",
    "schemas/audit-profile.schema.json",
    "schemas/audit-standard.schema.json",
    "schemas/source-credibility.schema.json",
    "docs/AUDIT-KERNEL.md",
    "docs/ECOSYSTEM-POSITION.md",
    "docs/MERCURY-AGENT-RELATIONSHIP.md"
  ]) {
    check(`audit kernel artifact exists: ${path}`, await exists(path));
  }
  const sdkApi = await readText("src/mercury-audit/index.mjs");
  check("SDK exports kernel surfaces", sdkApi.includes("auditKernel") && sdkApi.includes("listAuditProfiles") && sdkApi.includes("assessSourceCredibility"));
  check("README discloses Mercury Agent relationship", (await readText("README.en.md")).includes("not a fork, plugin, or official extension"));
}
if (scenarioPackUnfreeze) {
  warnings.push("Open scenario pack line detected: v1.8.x is allowed for scenario packs, adapter contract, and scenario-aware review UX");
  for (const path of [
    "src/mercury-audit/scenarios.mjs",
    "src/mercury-audit/review-ux.mjs",
    "schemas/audit-scenario.schema.json",
    "examples/audit-scenarios/ai-coding.json",
    "examples/audit-scenarios/personal-knowledge.json",
    "examples/audit-scenarios/investment-research.json",
    "examples/audit-scenarios/enterprise-delivery.json",
    "examples/audit-scenarios/legal-medical-risk.json",
    "docs/SCENARIO-PACKS.md",
    "docs/ADAPTER-CONTRACT.md",
    "docs/REVIEW-UX-GUIDE.md"
  ]) {
    check(`scenario pack artifact exists: ${path}`, await exists(path));
  }
  const sdkApi = await readText("src/mercury-audit/index.mjs");
  check("SDK exports scenario surfaces", sdkApi.includes("listAuditScenarios") && sdkApi.includes("review_guidance"));
  check("README surfaces scenario packs", (await readText("README.en.md")).includes("Scenario Packs v1.8.0"));
}
if (proofGovernanceUnfreeze) {
  warnings.push("Proof governance line detected: v1.9.x is allowed for Proof Pack 002, rule versioning, lifecycle governance, disagreement, and anti-gaming controls");
  for (const path of [
    "src/mercury-audit/anti-gaming.mjs",
    "src/mercury-audit/rule-versioning.mjs",
    "scripts/test_governance.mjs",
    "docs/PROOF-PACK-002.md",
    "docs/RULE-VERSION-GOVERNANCE.md",
    "docs/MEMORY-LIFECYCLE-GOVERNANCE.md",
    "docs/ANTI-GAMING-TESTS.md",
    "docs/HUMAN-REVIEW-DISAGREEMENT.md"
  ]) {
    check(`proof governance artifact exists: ${path}`, await exists(path));
  }
  const sdkApi = await readText("src/mercury-audit/index.mjs");
  check("SDK exports governance surfaces", sdkApi.includes("MERCURY_RULESET_VERSION") && sdkApi.includes("anti_gaming") && sdkApi.includes("needsReaudit"));
  check("Failure Mode Dictionary includes anti-gaming mode", failureModes.includes("FM-28: audit_gaming_attempt"));
}
if (v2PreflightUnfreeze) {
  warnings.push("2.0 evidence-chain preflight line detected: alpha.1 is allowed for requirement weighting, work-train mapping, and release-gate alignment");
  for (const path of [
    "docs/V2-PREFLIGHT-REQUIREMENTS.md",
    "docs/V2-WORK-TRAIN.md",
    "docs/ITERATION-STRATEGY-V2.md"
  ]) {
    check(`2.0 preflight artifact exists: ${path}`, await exists(path));
  }
  const preflight = await readText("docs/V2-PREFLIGHT-REQUIREMENTS.md");
  const workTrain = await readText("docs/V2-WORK-TRAIN.md");
  check("2.0 preflight records Strategy V2 as lower-weight", preflight.includes("lower-weight historical strategy input"));
  check("2.0 work train maps alpha releases", workTrain.includes("v2.0.0-alpha.2") && workTrain.includes("v2.0.0"));
}
if (v2CaseFoundationUnfreeze) {
  warnings.push("2.0 real case foundation line detected: alpha.2 is allowed for structured cases, OpenClaw hook, and Starter Kit");
  for (const path of [
    "docs/REAL-CASES-SUMMARY.md",
    "scripts/build_real_cases.mjs",
    "scripts/check_real_cases.mjs",
    "examples/integration-demo/openclaw-hook.mjs",
    "examples/starter-kit/README.md",
    "examples/starter-kit/hello-audit.mjs",
    "cases/2026-05"
  ]) {
    check(`2.0 case foundation artifact exists: ${path}`, await exists(path));
  }
  const summary = await readText("docs/REAL-CASES-SUMMARY.md");
  check("real case summary records at least 10 cases", /total_cases:\s*10/.test(summary));
  check("package exposes case and integration scripts", Boolean(packageJson.scripts?.["cases:build"]) && Boolean(packageJson.scripts?.["demo:openclaw"]) && Boolean(packageJson.scripts?.["demo:starter"]));
}
if (v2EvidenceInterfaceUnfreeze) {
  warnings.push("2.0 evidence interface line detected: alpha.3 is allowed for evidence-chain SDK, drag attach, and A2A blueprint");
  for (const path of [
    "src/mercury-audit/evidence-chain.mjs",
    "scripts/test_evidence_chain.mjs",
    "docs/A2A-AGENT-CARD-BLUEPRINT.md",
    "examples/a2a/agent-card.json",
    "examples/a2a/message-task-demo.mjs"
  ]) {
    check(`2.0 evidence interface artifact exists: ${path}`, await exists(path));
  }
  const sdkApi = await readText("src/mercury-audit/index.mjs");
  check("SDK exports evidence chain helpers", sdkApi.includes("buildEvidenceChain") && sdkApi.includes("buildMissingEvidence"));
  check("Lite Mode supports drag attach", liteMode.includes("handleFiles") && liteMode.includes("attachments"));
  check("package exposes evidence and A2A scripts", Boolean(packageJson.scripts?.["test:evidence"]) && Boolean(packageJson.scripts?.["demo:a2a"]));
}
if (v2PortableEvidenceChain) {
  warnings.push("2.0 portable evidence-chain line detected: final 2.0 is allowed for performance gates and lightweight Mercury skills");
  for (const path of [
    "docs/ITERATION-GUIDE-2.0.0.md",
    "docs/PERFORMANCE-2.0.md",
    "scripts/benchmark_v2_paths.mjs",
    "scripts/check_mercury_skills.mjs",
    "08_skills/mercury-evidence-chain/SKILL.md",
    "08_skills/mercury-memory-gate/SKILL.md",
    "08_skills/mercury-case-capture/SKILL.md"
  ]) {
    check(`2.0 final artifact exists: ${path}`, await exists(path));
  }
  check("package exposes 2.0 performance and skill checks", Boolean(packageJson.scripts?.["benchmark:v2"]) && Boolean(packageJson.scripts?.["skills:check"]));
  const performanceNotes = await readText("docs/PERFORMANCE-2.0.md");
  check("2.0 performance notes preserve local benchmark boundary", performanceNotes.includes("no external LLM") && performanceNotes.includes("not to claim production throughput"));
}
if (v2AdmissionReframe) {
  warnings.push("2.0.1 admission reframe line detected: patch is allowed for public naming, limitation disclosure, and empirical-validation roadmap");
  check("2.0.1 guide exists", await exists("docs/ITERATION-GUIDE-2.0.1.md"));
  check("README discloses no external validation", (await readText("README.en.md")).includes("External team adoption") && (await readText("README.md")).includes("已被外部团队采用"));
  check("README roadmap includes ground-truth validation", (await readText("README.en.md")).includes("Ground-Truth Track") && (await readText("README.md")).includes("Ground-Truth Track"));
  check("README keeps human review declined", (await readText("README.en.md")).includes("human_reviewed: declined") && (await readText("README.md")).includes("human_reviewed: declined"));
}
if (v2AdmissionContract) {
  warnings.push("2.0.2 admission contract line detected: patch is allowed for choice closure, admitted-object taxonomy, and future usage policy metadata");
  const sdkApi = await readText("src/mercury-audit/index.mjs");
  const contractModule = await readText("src/mercury-audit/admission-contract.mjs");
  check("2.0.2 guide exists", await exists("docs/ITERATION-GUIDE-2.0.2.md"));
  check("SDK exports Admission Contract helpers", sdkApi.includes("buildAdmissionContract") && sdkApi.includes("MEMORY_OBJECT_TYPES"));
  check("Admission Contract separates source/framing/judgment/object", contractModule.includes("source_material") && contractModule.includes("model_framing") && contractModule.includes("user_judgment") && contractModule.includes("admitted_object"));
  check("Admission Contract records future usage policy", contractModule.includes("future_usage_policy") && contractModule.includes("can_use_as_fact") && contractModule.includes("can_trigger_action"));
  check("README states no truth verdicts", (await readText("README.en.md")).includes("does not produce truth verdicts") && (await readText("README.md")).includes("does not produce truth verdicts"));
}

const cases = splitSections(proofPack, /^## Case \d{3}:[^\n]*$/gm);
check("Proof Pack 001 has at least 10 cases", cases.length >= 10);

const requiredCaseHeadings = [
  "### Raw Output",
  "### Why It Sounds Plausible",
  "### Evidence Gap",
  "### Memory Pollution Risk",
  "### Mercury Decision",
  "### Rule Learned"
];

for (const section of cases) {
  const title = section.title.replace(/^##\s*/, "");
  for (const heading of requiredCaseHeadings) {
    check(`${title} includes ${heading.replace("### ", "")}`, section.body.includes(heading));
  }
  check(`${title} declares routing_decision`, /routing_decision:\s*\w+/.test(section.body));
  check(`${title} declares failure_modes`, /failure_modes:\s*\n\s*-/.test(section.body));
}

if (proofGovernanceUnfreeze) {
  const governanceCases = splitSections(proofPack002, /^## Case \d{3}:[^\n]*$/gm);
  check("Proof Pack 002 has at least 6 governance cases", governanceCases.length >= 6);
  for (const section of governanceCases) {
    const title = section.title.replace(/^##\s*/, "");
    for (const heading of requiredCaseHeadings) {
      check(`${title} includes ${heading.replace("### ", "")}`, section.body.includes(heading));
    }
    check(`${title} declares routing_decision`, /routing_decision:\s*\w+/.test(section.body));
    check(`${title} declares failure_modes`, /failure_modes:\s*\n\s*-/.test(section.body));
  }
}

const modes = splitSections(failureModes, /^## FM-\d+:[^\n]*$/gm);
check("Failure Mode Dictionary has at least 20 modes", modes.length >= 20);

for (const mode of modes) {
  const title = mode.title.replace(/^##\s*/, "");
  check(`${title} includes Definition`, mode.body.includes("**Definition:**"));
  check(`${title} includes Proof Pack Reference`, mode.body.includes("**Proof Pack Reference:**"));
  check(`${title} includes Near Miss`, mode.body.includes("**Near Miss:**"));
}

const realRecords = Number(charterUsers.match(/real_records_collected:\s*(\d+)/)?.[1] ?? 0);
if (realRecords < 3) {
  warnings.push(`charter user records are external-dependent: ${realRecords}/3 collected`);
  if (strict) {
    check("strict charter user target met", false);
  }
}

const cycleEntries = reviewLedger.split("## Pre-Cycle Carryover")[0] ?? reviewLedger;
const pendingCycleEntries = [...cycleEntries.matchAll(/\|\s*[^|\n]+\s*\|\s*pending\s*\|/g)].length;
check("Cycle 02 ledger has no pending review entries", pendingCycleEntries === 0);
check("Review ledger uses declined for AI-only Cycle 02 outputs", cycleEntries.includes("| declined |"));

for (const result of checks) {
  console.log(`${result.ok ? "OK" : "FAIL"} ${result.name}`);
}

for (const warning of warnings) {
  console.log(`WARN ${warning}`);
}

if (checks.some((result) => !result.ok)) {
  process.exitCode = 1;
}

function check(name, ok) {
  checks.push({ name, ok: Boolean(ok) });
}

async function readText(path) {
  return readFile(join(root, path), "utf8");
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

async function exists(path) {
  try {
    await access(join(root, path));
    return true;
  } catch {
    return false;
  }
}

function splitSections(text, headingPattern) {
  const matches = [...text.matchAll(headingPattern)];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? text.length;
    const section = text.slice(start, end);
    const [title = "", ...bodyLines] = section.split(/\r?\n/);
    return {
      title,
      body: bodyLines.join("\n")
    };
  });
}
