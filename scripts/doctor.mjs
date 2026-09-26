import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const requiredPaths = [
  "00_raw",
  "00_inbox",
  "00_inbox/ai-conversations",
  "01_segmented",
  "02_cleaned",
  "03_uncertain",
  "04_memory_candidates",
  "05_decision_logs",
  "06_action_plans",
  "07_audit_reports",
  "08_skills",
  "09_templates",
  "10_exports",
  "11_indexes",
  "config",
  "data",
  "docs",
  "docs/ADAPTER-CONTRACT.md",
  "docs/AGENT-AUDIT-BLUEPRINT.md",
  "docs/ANTI-GAMING-TESTS.md",
  "docs/AUDIT-KERNEL.md",
  "docs/BENCHMARKS.md",
  "docs/CYCLE-04-BLUEPRINT.md",
  "docs/ECOSYSTEM-POSITION.md",
  "docs/EXPORT-GUIDE.md",
  "docs/I18N-UX-POLICY.md",
  "docs/INTEGRATION-DEMO.md",
  "docs/ITERATION-GUIDE-1.7.0.md",
  "docs/ITERATION-GUIDE-1.8.0.md",
  "docs/ITERATION-GUIDE-1.9.0.md",
  "docs/ITERATION-GUIDE-2.0.0-alpha.1.md",
  "docs/ITERATION-GUIDE-2.0.0-alpha.2.md",
  "docs/ITERATION-GUIDE-2.0.0-alpha.3.md",
  "docs/ITERATION-GUIDE-2.0.0.md",
  "docs/HUMAN-REVIEW-DISAGREEMENT.md",
  "docs/MEMORY-LIFECYCLE-GOVERNANCE.md",
  "docs/MERCURY-AGENT-RELATIONSHIP.md",
  "docs/OWASP-AISVS-C8-MAPPING.md",
  "docs/PROOF-PACK-002.md",
  "docs/PROOF-PACK-COVERAGE-MATRIX.md",
  "docs/RELATED-WORK.md",
  "docs/RULE-VERSION-GOVERNANCE.md",
  "docs/ROUTING-THEORY.md",
  "docs/REVIEW-UX-GUIDE.md",
  "docs/SCENARIO-PACKS.md",
  "docs/SDK-API.md",
  "docs/SCOPE.md",
  "docs/START-HERE.md",
  "docs/THREE-MINUTE-START.md",
  "docs/V2-PREFLIGHT-REQUIREMENTS.md",
  "docs/V2-WORK-TRAIN.md",
  "docs/REAL-CASES-SUMMARY.md",
  "docs/A2A-AGENT-CARD-BLUEPRINT.md",
  "docs/PERFORMANCE-2.0.md",
  "examples/integration-demo/memory-write-hook.mjs",
  "examples/integration-demo/openclaw-hook.mjs",
  "examples/starter-kit/README.md",
  "examples/starter-kit/hello-audit.mjs",
  "examples/a2a/agent-card.json",
  "examples/a2a/message-task-demo.mjs",
  "examples/audit-scenarios/ai-coding.json",
  "examples/audit-scenarios/personal-knowledge.json",
  "examples/audit-scenarios/investment-research.json",
  "examples/audit-scenarios/enterprise-delivery.json",
  "examples/audit-scenarios/legal-medical-risk.json",
  "examples/audit-packets",
  "examples/ai-conversation-capture.md",
  "schemas",
  "schemas/audit-scenario.schema.json",
  "schemas/audit-profile.schema.json",
  "schemas/audit-standard.schema.json",
  "schemas/audit-packet.schema.json",
  "schemas/source-credibility.schema.json",
  "scripts",
  "scripts/benchmark_audit_sdk.mjs",
  "scripts/benchmark_v2_paths.mjs",
  "scripts/build_real_cases.mjs",
  "scripts/check_real_cases.mjs",
  "scripts/check_mercury_skills.mjs",
  "scripts/test_evidence_chain.mjs",
  "scripts/test_sdk_api.mjs",
  "src/mercury-audit/evidence-chain.mjs",
  "src/mercury-audit/disagreement.mjs",
  "src/mercury-audit/anti-gaming.mjs",
  "src/mercury-audit/index.mjs",
  "src/mercury-audit/kernel.mjs",
  "src/mercury-audit/lifecycle.mjs",
  "src/mercury-audit/policy.mjs",
  "src/mercury-audit/profiles.mjs",
  "src/mercury-audit/rule-versioning.mjs",
  "src/mercury-audit/source-credibility.mjs",
  "src/mercury-audit/standards.mjs",
  "src/mercury-audit/scenarios.mjs",
  "src/mercury-audit/review-ux.mjs",
  "08_skills/mercury-evidence-chain/SKILL.md",
  "08_skills/mercury-memory-gate/SKILL.md",
  "08_skills/mercury-case-capture/SKILL.md",
  "dashboard",
  "dashboard/index.html",
  "dashboard/app/main.js",
  "dashboard/app/styles.css",
  "dashboard/classic/index.html",
  "scripts/dashboard/http.mjs",
  "scripts/dashboard/router.mjs",
  "scripts/dashboard/admission-api.mjs",
  "config/permissions.json",
  "config/state-machine.json",
  "config/integrations.json",
  "config/model-providers.json",
  "config/methods.json",
  "config/architecture-entrypoints.json",
  "config/mercury-capabilities.json",
  ".env.example",
  "package.json"
];

const checks = [];

async function exists(path) {
  try {
    await access(join(root, path), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

for (const path of requiredPaths) {
  checks.push({
    name: `required path: ${path}`,
    ok: await exists(path)
  });
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
for (const scriptName of [
  "dashboard",
  "audit",
  "audit:flow",
  "audit:profile",
  "cycle:status",
  "cycle:check",
  "capture",
  "capture:demo",
  "capture:dropzone",
  "capture:watch",
  "capture:check",
  "dashboard:check",
  "benchmark:audit",
  "benchmark:v2",
  "demo:memory-hook",
  "demo:openclaw",
  "demo:starter",
  "cases:build",
  "cases:check",
  "test:evidence",
  "demo:a2a",
  "doctor",
  "guide:latest",
  "index",
  "index:incr",
  "import:viewpoint",
  "ingest:doc",
  "release:gate",
  "report",
  "sync:skills",
  "skills:check",
  "test",
  "test:governance",
  "test:sdk",
  "validate",
  "validate:incr",
  "test:llm",
  "test:ark",
  "start:llm",
  "start:ark"
]) {
  checks.push({
    name: `package script: ${scriptName}`,
    ok: Boolean(packageJson.scripts?.[scriptName])
  });
}

const skillDirs = await readdir(join(root, "08_skills"), { withFileTypes: true });
const skillCount = skillDirs.filter((entry) => entry.isDirectory()).length;
checks.push({
  name: "at least one skill exists",
  ok: skillCount > 0
});

const nodeMajor = Number(process.versions.node.split(".")[0]);
checks.push({
  name: "node >= 20",
  ok: nodeMajor >= 20
});

if (readEnv("MERCURY_MARKITDOWN_ENABLED") === "true") {
  const pythonResult = spawnSync("python", ["--version"], { encoding: "utf8" });
  const pyResult = spawnSync("py", ["-3", "--version"], { encoding: "utf8" });
  checks.push({
    name: "python or py available for markitdown ingest",
    ok: pythonResult.status === 0 || pyResult.status === 0
  });
}

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}`);
}

if (!readEnv("ARK_API_KEY")) {
  console.log("WARN ARK_API_KEY is not set; API smoke tests will fail until runtime credentials are provided.");
}

if (readEnv("MERCURY_MARKITDOWN_ENABLED") !== "true") {
  console.log("INFO MarkItDown ingest is disabled by default. Set MERCURY_MARKITDOWN_ENABLED=true only when conversion into 00_raw is needed.");
}

if (failed.length > 0) {
  process.exitCode = 1;
}

function readEnv(name) {
  if (process.env[name]) {
    return process.env[name];
  }
  if (process.platform !== "win32") {
    return "";
  }

  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-Command", `[Environment]::GetEnvironmentVariable('${name}','User')`],
    { encoding: "utf8" }
  );

  return result.status === 0 ? result.stdout.trim() : "";
}
