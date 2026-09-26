let data = null;
let selectedPath = "";
let selectedDetail = null;
let artifactFilter = "all";
let artifactSearch = "";
let lastIntakeResult = null;
let commandOutputTouched = false;
const localeStorageKey = "mercury-locale-v3";
const capabilitiesOpenStorageKey = "mercury-capabilities-open-v1";
let locale = normalizeLocale(localStorage.getItem(localeStorageKey));

const $ = (selector) => document.querySelector(selector);

const ownerRoles = [
  "collector",
  "cleaner",
  "memory-curator",
  "decision-owner",
  "auditor",
  "operator"
];

const translations = {
  zh: {
    brandSubtitle: "\u667a\u80fd\u4f53\u4f18\u5148\u5165\u53e3",
    railPrimary: "\u4e3b\u8def\u5f84",
    railSubmit: "\u63d0\u4ea4\u89c2\u70b9",
    railIntake: "\u5165\u53e3\u961f\u5217",
    railArtifacts: "\u5185\u90e8 artifact",
    systemSurfaces: "\u7cfb\u7edf\u80fd\u529b",
    eyebrow: "\u667a\u80fd\u4f53\u4f18\u5148\u63d0\u4ea4\u5c42",
    pageTitle: "\u5148\u63d0\u4ea4\u89c2\u70b9\uff0c\u518d\u8ba9\u6d41\u6c34\u7ebf\u627f\u63a5\u3002",
    refresh: "\u5237\u65b0",
    languageLabel: "\u8bed\u8a00",
    executionModeTitle: "\u6267\u884c\u6a21\u5f0f",
    executionModeApi: "API \u6a21\u5f0f",
    executionModeAgent: "Agent \u6a21\u5f0f",
    executionModeFallback: "\u5f53\u524d\u6a21\u5f0f\uff1a{mode}",
    executionModeSaved: "\u6267\u884c\u6a21\u5f0f\u5df2\u5207\u6362\u4e3a {mode}",
    analysisPersonaTitle: "\u5206\u6790\u4eba\u683c",
    analysisPersonaV80: "V8.0 \u7a81\u56f4",
    analysisPersonaV81: "V8.1 \u540c\u9891",
    analysisPersonaV85: "V8.5 \u7ea0\u504f",
    analysisPersonaFallback: "\u5f53\u524d\u4eba\u683c\uff1a{persona}",
    analysisPersonaSaved: "\u5206\u6790\u4eba\u683c\u5df2\u5207\u6362\u4e3a {persona}",
    deploymentTitle: "\u90e8\u7f72\u51c6\u5907\u5ea6",
    deploymentDesc: "\u65b0\u7528\u6237\u8dd1\u5206\u6790\u524d\uff0c\u53ea\u9700\u786e\u8ba4\u8fd9\u51e0\u4e2a\u63a5\u7ebf\u70b9\u3002",
    deploymentReady: "\u53ef\u8fd0\u884c",
    deploymentNeedsSetup: "\u9700\u914d\u7f6e {count} \u9879",
    deploymentOptional: "\u53ef\u9009",
    deploymentRequired: "\u5fc5\u9700",
    deploymentOk: "\u5df2\u5c31\u7eea",
    versionHintOk: "\u7248\u672c\uff1a\u540e\u7aef {app} \u00b7 \u524d\u7aef {asset} \u00b7 package {pkg} \u00b7 Node {node}",
    versionHintMismatch: "\u7248\u672c\u63d0\u793a\uff1a\u540e\u7aef {app} \u9884\u671f\u524d\u7aef {expected}\uff0c\u5f53\u524d\u52a0\u8f7d {asset}\u3002\u8bf7\u5f3a\u5237\u65b0\u9875\u9762\uff1b\u5982\u679c\u4ecd\u7136\u4e0d\u4e00\u81f4\uff0c\u91cd\u542f dashboard\u3002",
    artifactTableTitle: "Artifact \u5de5\u4f5c\u53f0",
    artifactTableDesc: "\u9009\u4e2d\u6587\u4ef6\u540e\u53ef\u67e5\u770b\u8be6\u60c5\u3001\u4fee\u6539\u5143\u6570\u636e\u3001\u63a8\u8fdb\u72b6\u6001\u3002",
    artifactFile: "\u6587\u4ef6",
    artifactType: "\u7c7b\u578b",
    artifactStatus: "\u72b6\u6001",
    artifactOwner: "\u8d1f\u8d23\u89d2\u8272",
    artifactReview: "\u590d\u67e5\u65e5\u671f",
    artifactSearch: "\u641c\u7d22 artifact",
    detailTitle: "Artifact \u8be6\u60c5",
    noSelection: "\u9009\u4e2d\u4e00\u4e2a artifact \u5f00\u59cb\u5904\u7406\u3002",
    currentState: "\u5f53\u524d\u72b6\u6001",
    nextTransitions: "\u53ef\u7528\u6d41\u8f6c",
    metadataEditor: "\u5143\u6570\u636e\u7f16\u8f91",
    contentPreview: "\u5185\u5bb9\u9884\u89c8",
    history: "\u5386\u53f2",
    fieldStatus: "\u72b6\u6001",
    fieldOwner: "\u8d1f\u8d23\u89d2\u8272",
    fieldReviewAt: "\u590d\u67e5\u65e5\u671f",
    fieldNote: "\u8bb0\u5f55\u5907\u6ce8",
    saveMetadata: "\u4fdd\u5b58\u5143\u6570\u636e",
    createTitle: "\u65b0\u5efa Artifact",
    createDesc: "\u521b\u5efa\u53ef\u8ffd\u8e2a\u7684\u51b3\u7b56\u3001\u884c\u52a8\u8ba1\u5212\u3001\u5ba1\u8ba1\u62a5\u544a\u3001\u8bb0\u5fc6\u5019\u9009\u6216\u539f\u59cb\u8bb0\u5f55\u3002",
    fieldTitle: "\u6807\u9898",
    fieldType: "\u7c7b\u578b",
    fieldSourceRef: "\u6765\u6e90\u5f15\u7528",
    createButton: "\u521b\u5efa\u53ef\u8ffd\u8e2a artifact",
    submitTitle: "\u628a\u6750\u6599\u4e22\u8fdb\u5b58\u50a8",
    submitDesc: "\u7c98\u8d34\u6587\u672c\u6216\u4e0a\u4f20\u6587\u4ef6\u3002\u7cfb\u7edf\u8d1f\u8d23\u547d\u540d\u3001\u5b58\u50a8\u3001\u8def\u7531\u548c\u8fd4\u56de\u5e72\u51c0\u7684\u5165\u53e3\u5224\u65ad\u3002",
    submitterLabel: "\u63d0\u4ea4\u8005",
    routeLabel: "\u5efa\u8bae\u8def\u7531",
    sourceKindLabel: "\u6765\u6e90\u7c7b\u578b",
    materialLabel: "\u6750\u6599\u6587\u672c",
    materialPlaceholder: "\u76f4\u63a5\u7c98\u8d34\u6574\u6bb5\u89c2\u70b9\u3001\u95ee\u9898\u3001\u4f1a\u8bae\u8bb0\u5f55\u3001\u8349\u7a3f\u3001\u7f51\u9875\u6458\u5f55\u3002\u53ef\u4ee5\u4e0d\u5199\u6807\u9898\u3002",
    fileLabel: "\u9644\u52a0\u6587\u4ef6",
    fileHint: "\u56fe\u7247\u3001Markdown\u3001txt\u3001pdf\u3001docx \u6216\u5176\u4ed6\u6587\u6863\u5148\u5b58\u50a8\uff0c\u540e\u7eed\u518d\u89e3\u6790\u3002",
    submitButton: "\u5b58\u50a8\u5e76\u8fd0\u884c\u5165\u53e3\u5224\u65ad",
    submitNote: "\u4f60\u53ea\u63d0\u4f9b\u6750\u6599\uff0c\u7cfb\u7edf\u8d1f\u8d23\u547d\u540d\u3001\u5b58\u50a8\u3001\u8def\u7531\u548c\u9996\u6b21\u56de\u5e94\u3002",
    quickArtifacts: "\u67e5\u770b\u5386\u53f2 artifacts \u2192",
    intakeResultEmpty: "\u63d0\u4ea4\u6750\u6599\u540e\uff0c\u8fd9\u91cc\u4f1a\u51fa\u73b0\u7cfb\u7edf\u7684\u5e72\u51c0\u5165\u53e3\u9648\u8ff0\u3002",
    flowTitle: "\u4e0b\u4e00\u6b65\u53d1\u751f\u4ec0\u4e48",
    flowStep1Title: "\u5b58\u50a8",
    flowStep1Desc: "\u628a\u7528\u6237\u539f\u59cb\u6750\u6599\u4fdd\u7559\u5230 submissions/inbox\u3002",
    flowStep2Title: "\u56de\u5e94",
    flowStep2Desc: "\u7acb\u5373\u8fd4\u56de\u5e72\u51c0\u9648\u8ff0\u3001\u8def\u7531\u548c\u95ee\u9898\u3002",
    flowStep3Title: "\u961f\u5217",
    flowStep3Desc: "\u4e3a OpenClaw \u6216\u7231\u9a6c\u4ed5\u7c7b\u667a\u80fd\u4f53\u751f\u6210 envelope\u3002",
    flowStep4Title: "\u5904\u7406",
    flowStep4Desc: "\u539f\u59cb artifact \u8fdb\u5165\u6e05\u6d17\u3001\u5224\u65ad\u3001\u5ba1\u8ba1\u6216\u884c\u52a8\u8f6c\u8bd1\u3002",
    intakeTitle: "\u5165\u53e3\u961f\u5217",
    intakeDesc: "\u6700\u8fd1\u63d0\u4ea4\uff0c\u7b49\u5f85\u63d0\u5347\u4e3a\u539f\u59cb\u8bc1\u636e\u3002",
    promoteButton: "\u63d0\u5347\u5230 00_raw",
    promotedLabel: "\u5df2\u63d0\u5347",
    noSubmissions: "\u8fd8\u6ca1\u6709\u6750\u6599\u3002\u5148\u5728\u4e0a\u65b9\u7c98\u8d34\u6587\u672c\u6216\u4e0a\u4f20\u6587\u4ef6\u3002",
    cleanStatement: "\u5e72\u51c0\u9648\u8ff0",
    systemQuestions: "\u7cfb\u7edf\u95ee\u9898",
    noOpenQuestions: "\u6682\u65e0\u8ffd\u95ee\uff0c\u53ef\u76f4\u63a5\u8fdb\u5165\u4e0b\u4e00\u6b65\u3002",
    nextStep: "\u4e0b\u4e00\u6b65",
    storedAt: "\u5df2\u5b58\u50a8",
    intakeReady: "\u5165\u53e3\u5224\u65ad\u5df2\u751f\u6210",
    continueProcessing: "\u7ee7\u7eed\u5904\u7406",
    submitAnother: "\u518d\u6b21\u63d0\u4ea4",
    artifactsFocused: "\u5df2\u8df3\u5230 Artifact \u5de5\u4f5c\u53f0",
    executionTitle: "\u6267\u884c",
    executionDesc: "\u8fd0\u884c\u9879\u76ee\u767d\u540d\u5355\u5185\u7684\u7ef4\u62a4\u547d\u4ee4\u3002",
    waitingExecution: "\u7b49\u5f85\u6267\u884c...",
    logTitle: "\u751f\u547d\u5468\u671f\u65e5\u5fd7",
    logDesc: "\u6bcf\u6b21 GUI \u53d8\u66f4\u90fd\u4f1a\u8ffd\u52a0\u5230 data/lifecycle-log.jsonl\u3002",
    noLog: "\u6682\u65e0 GUI \u53d8\u66f4\u65e5\u5fd7\u3002",
    metricArtifacts: "Artifacts",
    metricNeedsReview: "\u5f85\u590d\u67e5",
    metricMissingStatus: "\u7f3a\u5931\u72b6\u6001",
    metricAuditReports: "\u5ba1\u8ba1\u62a5\u544a",
    metricReusable: "\u53ef\u590d\u7528",
    commandDoctor: "\u8bca\u65ad",
    commandIndex: "\u91cd\u5efa\u7d22\u5f15",
    commandValidate: "\u6821\u9a8c",
    commandSyncSkills: "\u540c\u6b65 Skills",
    commandTestLlm: "\u6d4b\u8bd5 LLM",
    runningScript: "\u6b63\u5728\u8fd0\u884c",
    runningButton: "\u8fd0\u884c\u4e2d...",
    commandFailed: "\u547d\u4ee4\u6267\u884c\u5931\u8d25",
    outputScript: "\u811a\u672c",
    outputOk: "\u6210\u529f",
    outputExitCode: "\u9000\u51fa\u7801",
    allFilter: "\u5168\u90e8",
    noTransition: "\u6ca1\u6709\u540e\u7eed\u72b6\u6001",
    saved: "\u5df2\u4fdd\u5b58",
    created: "\u5df2\u521b\u5efa",
    failed: "\u5931\u8d25",
    loading: "\u6b63\u5728\u52a0\u8f7d\u5de5\u4f5c\u53f0...",
    ready: "\u5de5\u4f5c\u53f0\u5df2\u5c31\u7eea",
    loadFailed: "\u52a0\u8f7d\u5931\u8d25",
    emptyArtifacts: "\u6ca1\u6709\u5339\u914d\u7684 artifact\u3002",
    capabilityPurpose: "\u539f\u59cb\u7528\u9014",
    capabilityCurrentUse: "\u5f53\u524d\u7528\u9014"
  },
  en: {
    brandSubtitle: "Agent-first intake",
    railPrimary: "Primary path",
    railSubmit: "Submit viewpoint",
    railIntake: "Intake queue",
    railArtifacts: "Internal artifacts",
    systemSurfaces: "System surfaces",
    eyebrow: "Agent-first submission layer",
    pageTitle: "Submit a viewpoint, then let the pipeline carry it.",
    refresh: "Refresh",
    languageLabel: "Language",
    executionModeTitle: "Execution mode",
    executionModeApi: "API mode",
    executionModeAgent: "Agent mode",
    executionModeFallback: "Current mode: {mode}",
    executionModeSaved: "Execution mode switched to {mode}",
    analysisPersonaTitle: "Analysis persona",
    analysisPersonaV80: "V8.0 Breakthrough",
    analysisPersonaV81: "V8.1 Reality sync",
    analysisPersonaV85: "V8.5 Correction",
    analysisPersonaFallback: "Current persona: {persona}",
    analysisPersonaSaved: "Analysis persona switched to {persona}",
    deploymentTitle: "Deployment readiness",
    deploymentDesc: "Check the few things a new user must wire before running analysis.",
    deploymentReady: "Ready",
    deploymentNeedsSetup: "{count} required",
    deploymentOptional: "Optional",
    deploymentRequired: "Required",
    deploymentOk: "Ready",
    versionHintOk: "Version: server {app} · client {asset} · package {pkg} · Node {node}",
    versionHintMismatch: "Version hint: server {app} expects client {expected}, but this page loaded {asset}. Hard refresh the page; if it still differs, restart dashboard.",
    artifactTableTitle: "Artifact workbench",
    artifactTableDesc: "Select a file to inspect, edit metadata, and move it through lifecycle states.",
    artifactFile: "File",
    artifactType: "Type",
    artifactStatus: "Status",
    artifactOwner: "Owner role",
    artifactReview: "Review date",
    artifactSearch: "Search artifacts",
    detailTitle: "Artifact detail",
    noSelection: "Select an artifact to start working.",
    currentState: "Current state",
    nextTransitions: "Next transitions",
    metadataEditor: "Metadata editor",
    contentPreview: "Content preview",
    history: "History",
    fieldStatus: "Status",
    fieldOwner: "Owner role",
    fieldReviewAt: "Review date",
    fieldNote: "Log note",
    saveMetadata: "Save metadata",
    createTitle: "Create artifact",
    createDesc: "Start a tracked decision, action plan, audit report, memory candidate, or raw note.",
    fieldTitle: "Title",
    fieldType: "Type",
    fieldSourceRef: "Source ref",
    createButton: "Create tracked artifact",
    submitTitle: "Drop material into storage",
    submitDesc: "Paste text or attach files. The system names, stores, routes, and returns a clean intake statement.",
    submitterLabel: "Submitter",
    routeLabel: "Routing hint",
    sourceKindLabel: "Source kind",
    materialLabel: "Material text",
    materialPlaceholder: "Paste a full viewpoint, question, meeting note, draft, or web excerpt. No title required.",
    fileLabel: "Attach files",
    fileHint: "Images, markdown, txt, pdf, docx, or other documents are stored first. Parsing can happen later.",
    submitButton: "Store and run intake",
    submitNote: "You provide material. The system handles naming, storage, routing, and first response.",
    quickArtifacts: "View historical artifacts \u2192",
    intakeResultEmpty: "Submit material to see the system's clean intake statement here.",
    flowTitle: "What happens next",
    flowStep1Title: "Store",
    flowStep1Desc: "Keep the user's raw material under submissions/inbox.",
    flowStep2Title: "Respond",
    flowStep2Desc: "Return a clean statement, route, and questions immediately.",
    flowStep3Title: "Queue",
    flowStep3Desc: "Create an envelope for OpenClaw or Hermes-like agents.",
    flowStep4Title: "Process",
    flowStep4Desc: "Raw artifact enters cleaning, judgment, audit, or action translation.",
    intakeTitle: "Intake queue",
    intakeDesc: "Recent submissions waiting for promotion into raw evidence.",
    promoteButton: "Promote to 00_raw",
    promotedLabel: "Promoted",
    noSubmissions: "No material yet. Paste text or attach files above.",
    cleanStatement: "Clean statement",
    systemQuestions: "System questions",
    noOpenQuestions: "No open questions. Continue to the next step.",
    nextStep: "Next step",
    storedAt: "Stored",
    intakeReady: "Intake result ready",
    continueProcessing: "Continue processing",
    submitAnother: "Submit another",
    artifactsFocused: "Artifact workbench in view",
    executionTitle: "Execution",
    executionDesc: "Run allowlisted project maintenance commands.",
    waitingExecution: "Waiting for execution...",
    logTitle: "Lifecycle log",
    logDesc: "Every GUI change is appended to data/lifecycle-log.jsonl.",
    noLog: "No GUI lifecycle events yet.",
    metricArtifacts: "Artifacts",
    metricNeedsReview: "Needs review",
    metricMissingStatus: "Missing status",
    metricAuditReports: "Audit reports",
    metricReusable: "Reusable",
    commandDoctor: "Doctor",
    commandIndex: "Index",
    commandValidate: "Validate",
    commandSyncSkills: "Sync Skills",
    commandTestLlm: "Test LLM",
    runningScript: "Running",
    runningButton: "Running...",
    commandFailed: "Command failed",
    outputScript: "script",
    outputOk: "ok",
    outputExitCode: "exitCode",
    allFilter: "all",
    noTransition: "No next state",
    saved: "Saved",
    created: "Created",
    failed: "Failed",
    loading: "Loading workbench...",
    ready: "Workbench ready",
    loadFailed: "Load failed",
    emptyArtifacts: "No matching artifacts.",
    capabilityPurpose: "Original purpose",
    capabilityCurrentUse: "Current use"
  }
};

const statusLabels = {
  staged: { zh: "\u5df2\u9884\u5165", en: "staged" },
  deferred: { zh: "\u6682\u7f13", en: "deferred" },
  indexed: { zh: "\u5df2\u7d22\u5f15", en: "indexed" },
  draft: { zh: "\u8349\u7a3f", en: "draft" },
  review_ready: { zh: "\u5f85\u590d\u67e5", en: "review ready" },
  audited: { zh: "\u5df2\u5ba1\u8ba1", en: "audited" },
  approved: { zh: "\u5df2\u6279\u51c6", en: "approved" },
  superseded: { zh: "\u5df2\u66ff\u4ee3", en: "superseded" },
  rejected: { zh: "\u5df2\u62d2\u7edd", en: "rejected" },
  unclassified: { zh: "\u672a\u5206\u7c7b", en: "unclassified" },
  active: { zh: "\u542f\u7528", en: "active" },
  reserved: { zh: "\u9884\u7559", en: "reserved" },
  disabled: { zh: "\u505c\u7528", en: "disabled" }
};

const typeLabels = {
  all: { zh: "\u5168\u90e8", en: "all" },
  raw: { zh: "\u539f\u59cb", en: "raw" },
  inbox_source: { zh: "\u6536\u4ef6\u8f93\u5165", en: "inbox source" },
  segmented: { zh: "\u5206\u6bb5", en: "segmented" },
  cleaned: { zh: "\u6e05\u6d17", en: "cleaned" },
  uncertain: { zh: "\u5f85\u786e\u8ba4", en: "uncertain" },
  memory_candidate: { zh: "\u8bb0\u5fc6\u5019\u9009", en: "memory candidate" },
  decision_log: { zh: "\u51b3\u7b56\u65e5\u5fd7", en: "decision log" },
  action_plan: { zh: "\u884c\u52a8\u8ba1\u5212", en: "action plan" },
  audit_report: { zh: "\u5ba1\u8ba1\u62a5\u544a", en: "audit report" },
  export: { zh: "\u5bfc\u51fa", en: "export" },
  unknown: { zh: "\u672a\u77e5", en: "unknown" }
};

const commandLabels = {
  doctor: "commandDoctor",
  index: "commandIndex",
  validate: "commandValidate",
  "sync:skills": "commandSyncSkills",
  "test:llm": "commandTestLlm"
};

init();

function init() {
  bindEvents();
  restoreCapabilitiesDisclosure();
  renderStaticText();
  renderLanguageMode();
  renderCommandLabels();
  renderOwnerOptions();
  renderEmptyState(t("loading"));
  renderExecutionMode();
  renderAnalysisPersona();
  renderDeploymentReadiness();
  bindIntakeFeedbackEvents();
  load();
}

function bindEvents() {
  $("#refreshButton").addEventListener("click", load);
  $("#intakeForm").addEventListener("submit", createIntake);
  $(".system-capabilities")?.addEventListener("toggle", (event) => {
    localStorage.setItem(capabilitiesOpenStorageKey, event.currentTarget.open ? "1" : "0");
  });
  $("#artifactSearch").addEventListener("input", (event) => {
    artifactSearch = event.target.value.trim().toLowerCase();
    if (data) {
      renderArtifacts();
    }
  });
  $("#createForm").addEventListener("submit", createArtifact);

  document.addEventListener("click", async (event) => {
    const localeButton = event.target.closest("[data-locale]");
    if (localeButton) {
      locale = normalizeLocale(localeButton.dataset.locale);
      localStorage.setItem(localeStorageKey, locale);
      render();
      return;
    }

    const row = event.target.closest("[data-artifact-path]");
    if (row) {
      await selectArtifact(row.dataset.artifactPath);
      return;
    }

    const filterButton = event.target.closest("[data-filter]");
    if (filterButton) {
      artifactFilter = filterButton.dataset.filter;
      renderFilters();
      renderArtifacts();
      return;
    }

    const modeButton = event.target.closest("[data-execution-mode]");
    if (modeButton) {
      await setExecutionMode(modeButton.dataset.executionMode);
      return;
    }

    const personaButton = event.target.closest("[data-analysis-persona]");
    if (personaButton) {
      await setAnalysisPersona(personaButton.dataset.analysisPersona);
      return;
    }

    const transitionButton = event.target.closest("[data-transition-status]");
    if (transitionButton) {
      await saveArtifact({ status: transitionButton.dataset.transitionStatus });
      return;
    }

    const promoteButton = event.target.closest("[data-promote-submission]");
    if (promoteButton) {
      await promoteSubmission(promoteButton.dataset.promoteSubmission);
      return;
    }

    const saveButton = event.target.closest("[data-save-artifact]");
    if (saveButton) {
      await saveArtifact(readDetailForm());
      return;
    }

    const runButton = event.target.closest("[data-run]");
    if (runButton) {
      await runCommand(runButton.dataset.run, runButton);
      return;
    }

    const intakeActionButton = event.target.closest("[data-intake-action]");
    if (intakeActionButton) {
      await handleIntakeAction(intakeActionButton.dataset.intakeAction);
      return;
    }

    const capabilityButton = event.target.closest("[data-capability]");
    if (capabilityButton) {
      await cycleCapability(capabilityButton.dataset.capability);
    }
  });

  $("#providerSelect").addEventListener("change", async (event) => {
    const provider = event.target.value;
    await fetch("/api/model-provider", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider })
    });
    await load();
  });
}

function restoreCapabilitiesDisclosure() {
  const disclosure = $(".system-capabilities");
  if (!disclosure) return;
  const stored = localStorage.getItem(capabilitiesOpenStorageKey);
  disclosure.open = stored === null ? true : stored === "1";
}

async function load() {
  setStatus(t("loading"), "info");
  try {
    const response = await fetch("/api/overview", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`GET /api/overview ${response.status}`);
    }
    data = await response.json();
    if (!data.ok) {
      throw new Error(data.error || "overview returned ok=false");
    }
    if (!selectedPath && data.artifacts.length) {
      selectedPath = data.artifacts[0].path;
    }
    await refreshSelectedDetail();
    render();
    setStatus(`${t("ready")} | ${data.artifacts.length} artifacts`, "ok");
  } catch (error) {
    data = null;
    selectedDetail = null;
    renderStaticText();
    renderLanguageMode();
    renderCommandLabels();
    renderOwnerOptions();
    renderEmptyState(`${t("loadFailed")}: ${error.message}`);
    setStatus(`${t("loadFailed")}: ${error.message}`, "error");
  }
}

async function refreshSelectedDetail() {
  if (!selectedPath) {
    selectedDetail = null;
    return;
  }
  const response = await fetch(`/api/artifact?path=${encodeURIComponent(selectedPath)}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`GET /api/artifact ${response.status}`);
  }
  selectedDetail = await response.json();
  if (!selectedDetail.ok) {
    throw new Error(selectedDetail.error || "artifact detail returned ok=false");
  }
}

async function selectArtifact(path) {
  selectedPath = path;
  await refreshSelectedDetail();
  render();
}

function render() {
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  renderStaticText();
  renderLanguageMode();
  renderCommandLabels();
  renderOwnerOptions();
  renderExecutionMode();
  renderAnalysisPersona();
  renderDeploymentReadiness();
  renderVersionHint();
  if (!data) {
    renderEmptyState(t("loading"));
    return;
  }
  renderCapabilities();
  renderProviderSelect();
  renderExecutionMode();
  renderAnalysisPersona();
  renderDeploymentReadiness();
  renderVersionHint();
  renderSubmissions();
  renderMetrics();
  renderFilters();
  renderArtifacts();
  renderDetail();
  renderLifecycleLog();
  if (lastIntakeResult) {
    renderIntakeResult(lastIntakeResult.intake, lastIntakeResult.queuePath);
  }
}

function renderStaticText() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    if (node.id === "commandOutput" && commandOutputTouched) return;
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  $("#artifactSearch").placeholder = t("artifactSearch");
  if (!lastIntakeResult) {
    $("#intakeResult").className = "intake-result empty";
    $("#intakeResult").textContent = t("intakeResultEmpty");
  }
}

function renderEmptyState(message) {
  $("#capabilities").innerHTML = "";
  $("#providerSelect").innerHTML = "";
  $(".metrics").innerHTML = [0, 1, 2, 3, 4].map(() => `
    <div class="metric"><span>-</span><strong>-</strong></div>
  `).join("");
  $("#artifactFilters").innerHTML = "";
  $("#artifactRows").innerHTML = `<tr><td colspan="5"><div class="empty">${escapeHtml(message)}</div></td></tr>`;
  $("#deploymentBadge").textContent = "-";
  $("#deploymentReadiness").innerHTML = `<div class="empty">${escapeHtml(message)}</div>`;
  $("#detailPath").textContent = "-";
  $("#artifactDetail").innerHTML = `<div class="empty">${escapeHtml(message)}</div>`;
  $("#lifecycleLog").innerHTML = `<div class="empty">${escapeHtml(message)}</div>`;
  $("#submissionRows").innerHTML = `<div class="empty">${escapeHtml(message)}</div>`;
  $("#queueCount").textContent = "0 agent tasks";
}

function setStatus(message, type = "info") {
  const node = $("#appStatus");
  if (!node) return;
  node.textContent = message || "";
  node.className = `app-status ${type}`;
}

function renderLanguageMode() {
  document.querySelectorAll("[data-locale]").forEach((button) => {
    const buttonLocale = normalizeLocale(button.dataset.locale);
    button.classList.toggle("active", buttonLocale === locale);
    button.setAttribute("aria-pressed", buttonLocale === locale ? "true" : "false");
  });
}

function renderCommandLabels() {
  document.querySelectorAll("[data-run]").forEach((button) => {
    if (button.classList.contains("is-running")) return;
    const key = commandLabels[button.dataset.run];
    if (key) {
      button.textContent = t(key);
    }
  });
}

function renderCapabilities() {
  $("#capabilities").innerHTML = Object.entries(data.capabilities.capabilities).map(([key, capability]) => `
    <button class="capability" data-capability="${key}" type="button">
      <strong>${translateField(capability.label, key)}<em class="status ${capability.status}">${labelStatus(capability.status)}</em></strong>
      <span><b>${t("capabilityCurrentUse")}:</b> ${translateField(capability.current_use, "-")}</span>
    </button>
  `).join("");
}

function renderProviderSelect() {
  $("#providerSelect").innerHTML = Object.keys(data.modelProviders.providers).map((key) => `
    <option value="${key}" ${key === data.modelProviders.active_provider ? "selected" : ""}>${key}</option>
  `).join("");
}

function renderExecutionMode() {
  const methods = data?.methods;
  const current = normalizeExecutionMode(methods?.execution_mode);
  const descriptions = methods?.execution_mode_description || {};
  const labels = {
    api: t("executionModeApi"),
    agent: t("executionModeAgent")
  };
  const desc = translateField(descriptions[current], "") || t("executionModeFallback").replace("{mode}", labels[current] || current);

  $("#executionModeDesc").textContent = desc;
  $("#executionModeButtons").innerHTML = ["api", "agent"].map((mode) => `
    <button class="${mode === current ? "active" : ""}" data-execution-mode="${mode}" type="button" aria-pressed="${mode === current ? "true" : "false"}">${labels[mode]}</button>
  `).join("");
}

function renderAnalysisPersona() {
  const methods = data?.methods;
  const current = normalizeAnalysisPersona(methods?.analysis_persona);
  const descriptions = methods?.analysis_persona_description || {};
  const labels = {
    "v8.0-breakthrough": t("analysisPersonaV80"),
    "v8.1-reality-sync": t("analysisPersonaV81"),
    "v8.5-correction": t("analysisPersonaV85")
  };
  const desc = translateField(descriptions[current], "") || t("analysisPersonaFallback").replace("{persona}", labels[current] || current);

  $("#analysisPersonaDesc").textContent = desc;
  $("#analysisPersonaButtons").innerHTML = Object.keys(labels).map((persona) => `
    <button class="${persona === current ? "active" : ""}" data-analysis-persona="${persona}" type="button" aria-pressed="${persona === current ? "true" : "false"}">${labels[persona]}</button>
  `).join("");
}

function renderDeploymentReadiness() {
  const deployment = data?.deployment;
  const badge = $("#deploymentBadge");
  const container = $("#deploymentReadiness");
  if (!badge || !container) return;

  if (!deployment) {
    badge.textContent = "-";
    container.innerHTML = `<div class="empty">${t("loading")}</div>`;
    return;
  }

  badge.className = deployment.ready ? "readiness-badge ok" : "readiness-badge required";
  badge.textContent = deployment.ready
    ? t("deploymentReady")
    : t("deploymentNeedsSetup").replace("{count}", deployment.requiredCount);

  container.innerHTML = deployment.items.map((item) => {
    const levelLabel = item.level === "required"
      ? t("deploymentRequired")
      : item.level === "optional"
      ? t("deploymentOptional")
      : t("deploymentOk");
    return `
      <article class="readiness-item ${item.level}">
        <strong>${escapeHtml(item.label)}<span>${levelLabel}</span></strong>
        <p>${escapeHtml(item.detail)}</p>
      </article>
    `;
  }).join("");
}

function renderVersionHint() {
  const node = $("#versionHint");
  const badge = $("#buildBadge");
  if (!node || !badge) return;

  const app = data?.appVersion || "unknown";
  const expected = normalizeVersionToken(data?.expectedClientAssetVersion || "");
  const asset = normalizeVersionToken(readLoadedAssetVersion());
  const pkg = data?.packageVersion || "unknown";
  const nodeVersion = data?.nodeVersion || "unknown";
  const mismatch = Boolean(expected && asset && expected !== asset);

  badge.textContent = `v${app}`;
  node.className = mismatch ? "version-hint warning" : "version-hint";
  node.textContent = (mismatch ? t("versionHintMismatch") : t("versionHintOk"))
    .replace("{app}", app)
    .replace("{expected}", expected || "unknown")
    .replace("{asset}", asset || "unknown")
    .replace("{pkg}", pkg)
    .replace("{node}", nodeVersion);
}

function renderOwnerOptions() {
  $("#createOwner").innerHTML = ownerRoles.map((role) => `<option value="${role}">${role}</option>`).join("");
}

function renderMetrics() {
  const summary = data.auditSummary;
  const metrics = [
    [t("metricArtifacts"), data.artifacts.length],
    [t("metricNeedsReview"), summary.needsReview],
    [t("metricMissingStatus"), summary.missingStatus],
    [t("metricAuditReports"), summary.auditReports],
    [t("metricReusable"), summary.reusable]
  ];
  $(".metrics").innerHTML = metrics.map(([label, value]) => `
    <div class="metric"><span>${label}</span><strong>${value}</strong></div>
  `).join("");
}

function renderSubmissions() {
  const intakeItems = data.submissions?.intake_items || [];
  const legacyViewpoints = data.submissions?.viewpoints || [];
  const submissions = [
    ...intakeItems.map((item) => ({
      path: item.raw_artifact || item.path,
      title: item.title,
      routing_hint: item.route,
      promoted: true,
      updated_at: item.updated_at,
      kind: "intake"
    })),
    ...legacyViewpoints.map((item) => ({ ...item, kind: "viewpoint" }))
  ].sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
  const queueCount = data.submissions?.queue_count || 0;
  $("#queueCount").textContent = `${queueCount} agent task${queueCount === 1 ? "" : "s"}`;
  if (!submissions.length) {
    $("#submissionRows").innerHTML = `<div class="empty">${t("noSubmissions")}</div>`;
    return;
  }

  $("#submissionRows").innerHTML = submissions.slice(0, 8).map((submission) => `
    <article class="submission-item">
      <div>
        <strong>${escapeHtml(submission.title)}</strong>
        <span>${escapeHtml(submission.path)} | ${escapeHtml(submission.routing_hint)}</span>
      </div>
      ${submission.kind === "intake"
        ? `<button type="button" data-artifact-path="${escapeAttr(submission.path)}">${t("storedAt")}</button>`
        : submission.promoted
        ? `<span class="status approved">${t("promotedLabel")}</span>`
        : `<button type="button" data-promote-submission="${escapeAttr(submission.path)}">${t("promoteButton")}</button>`}
    </article>
  `).join("");
}

function renderFilters() {
  const types = ["all", ...new Set(data.artifacts.map((artifact) => artifact.type))];
  $("#artifactFilters").innerHTML = types.map((type) => `
    <button class="${type === artifactFilter ? "active" : ""}" data-filter="${type}" type="button">${labelType(type)}</button>
  `).join("");
}

function renderArtifacts() {
  const rows = filteredArtifacts().slice(0, 160);
  if (!rows.length) {
    $("#artifactRows").innerHTML = `<tr><td colspan="5"><div class="empty">${t("emptyArtifacts")}</div></td></tr>`;
    return;
  }
  $("#artifactRows").innerHTML = rows.map((artifact) => `
    <tr class="${artifact.path === selectedPath ? "selected" : ""}" data-artifact-path="${escapeAttr(artifact.path)}">
      <td><button class="link-button" type="button">${artifact.path}</button></td>
      <td>${labelType(artifact.type)}</td>
      <td><span class="status ${artifact.status}">${labelStatus(artifact.status)}</span></td>
      <td>${artifact.owner_role || "-"}</td>
      <td>${artifact.review_at || "-"}</td>
    </tr>
  `).join("");
}

function renderDetail() {
  const detailPath = $("#detailPath");
  const container = $("#artifactDetail");

  if (!selectedDetail?.artifact) {
    detailPath.textContent = "-";
    container.innerHTML = `<div class="empty">${t("noSelection")}</div>`;
    return;
  }

  const artifact = selectedDetail.artifact;
  const events = selectedDetail.events || [];
  detailPath.textContent = artifact.path;
  container.innerHTML = `
    <div class="detail-summary">
      <span class="status ${artifact.status}">${labelStatus(artifact.status)}</span>
      <strong>${artifact.name}</strong>
      <span>${labelType(artifact.type)} | ${artifact.updated_at.slice(0, 10)}</span>
    </div>

    <section class="detail-section">
      <h3>${t("nextTransitions")}</h3>
      <div class="transition-row">
        ${(selectedDetail.allowed_next_statuses || []).length
          ? selectedDetail.allowed_next_statuses.map((status) => `<button type="button" data-transition-status="${status}">${labelStatus(status)}</button>`).join("")
          : `<span class="muted">${t("noTransition")}</span>`}
      </div>
    </section>

    <section class="detail-section">
      <h3>${t("metadataEditor")}</h3>
      <div class="form-grid compact">
        <label>
          <span>${t("fieldStatus")}</span>
          <select id="detailStatus">${statusOptions(artifact.status)}</select>
        </label>
        <label>
          <span>${t("fieldOwner")}</span>
          <select id="detailOwner">${ownerOptions(artifact.owner_role)}</select>
        </label>
        <label>
          <span>${t("fieldReviewAt")}</span>
          <input id="detailReviewAt" type="date" value="${escapeAttr(artifact.review_at || "")}">
        </label>
        <label class="span-2">
          <span>${t("fieldNote")}</span>
          <textarea id="detailNote" rows="2"></textarea>
        </label>
      </div>
      <button type="button" data-save-artifact>${t("saveMetadata")}</button>
    </section>

    <section class="detail-section">
      <h3>${t("history")}</h3>
      <div class="mini-timeline">${events.length ? events.slice(0, 5).map(renderEvent).join("") : `<span class="muted">${t("noLog")}</span>`}</div>
    </section>

    <section class="detail-section">
      <h3>${t("contentPreview")}</h3>
      <pre class="preview">${escapeHtml((selectedDetail.content || "").slice(0, 3500))}</pre>
    </section>
  `;
}

function renderLifecycleLog() {
  const events = data.lifecycleLog || [];
  $("#lifecycleLog").innerHTML = events.length ? events.slice(0, 24).map(renderEvent).join("") : `<div class="empty">${t("noLog")}</div>`;
}

function renderEvent(event) {
  const status = [event.before_status, event.after_status].filter(Boolean).join(" -> ");
  return `
    <div class="timeline-item">
      <strong>${event.action}${status ? ` | ${status}` : ""}</strong>
      <span>${event.at || ""}</span>
      <code>${event.path || ""}</code>
      ${event.note ? `<p>${escapeHtml(event.note)}</p>` : ""}
    </div>
  `;
}

async function saveArtifact(updates) {
  if (!selectedPath) return;
  const response = await fetch("/api/artifact", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: selectedPath, ...updates })
  });
  const result = await response.json();
  if (!result.ok) {
    showOutput(`${t("failed")}: ${result.error || "unknown error"}`);
    return;
  }
  selectedDetail = result;
  await load();
  showOutput(`${t("saved")}: ${selectedPath}`);
}

function readDetailForm() {
  return {
    status: $("#detailStatus")?.value || "",
    owner_role: $("#detailOwner")?.value || "",
    review_at: $("#detailReviewAt")?.value || "",
    note: $("#detailNote")?.value || ""
  };
}

async function createArtifact(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(formData.entries());
  const response = await fetch("/api/artifact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!result.ok) {
    showOutput(`${t("failed")}: ${result.error || "unknown error"}`);
    return;
  }
  event.currentTarget.reset();
  selectedPath = result.artifact.path;
  selectedDetail = result;
  await load();
  showOutput(`${t("created")}: ${selectedPath}`);
}

async function createViewpointSubmission(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const response = await fetch("/api/submission/viewpoint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!result.ok) {
    showOutput(`${t("failed")}: ${result.error || "unknown error"}`);
    return;
  }
  form.reset();
  form.elements.submitter.value = "local-gui";
  await load();
  showOutput(`${t("created")}: ${result.submission.path}\nagent queue: ${result.submission.queue_path}`);
}

async function createIntake(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const text = form.elements.text.value.trim();
  const files = await readFilesAsDataUrls([...$("#intakeFiles").files]);
  const submitButton = form.querySelector('[type="submit"]');

  if (!text && files.length === 0) {
    $("#intakeResult").className = "intake-result empty";
    $("#intakeResult").textContent = t("noSubmissions");
    return;
  }

  $("#intakeResult").className = "intake-result";
  $("#intakeResult").textContent = t("loading");
  setButtonBusy(submitButton, true);

  try {
    const response = await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, files })
    });
    if (!response.ok) {
      throw new Error(`POST /api/intake ${response.status}`);
    }
    const result = await response.json();
    if (!result.ok) {
      $("#intakeResult").className = "intake-result error";
      $("#intakeResult").textContent = `${t("failed")}: ${result.error || "unknown error"}`;
      return;
    }

    lastIntakeResult = {
      intake: result.intake,
      queuePath: result.queue_path
    };
    form.reset();
    selectedPath = result.intake.raw_artifact;
    selectedDetail = null;
    await load();
    renderIntakeResult(result.intake, result.queue_path);
    // v2.1.5: trigger intake-feedback automatically
    const materialText = $("#intakeMaterial")?.value || result.intake?.clean_statement || "";
    if (materialText.trim().length > 20) {
      fetchIntakeFeedback(materialText);
    }
    setStatus(t("intakeReady"), "ok");
    $("#intakeResult").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    $("#intakeResult").className = "intake-result error";
    $("#intakeResult").textContent = `${t("failed")}: ${error.message}`;
    setStatus(`${t("failed")}: ${error.message}`, "error");
  } finally {
    setButtonBusy(submitButton, false);
  }
}

function renderIntakeResult(intake, queuePath) {
  const result = intake.result || {};
  $("#intakeResult").className = "intake-result";
  $("#intakeResult").innerHTML = `
    <div class="result-grid">
      <div>
        <span>${t("cleanStatement")}</span>
        <strong>${escapeHtml(result.clean_statement || "")}</strong>
      </div>
      <div>
        <span>Route</span>
        <strong>${escapeHtml(result.route || intake.route || "")}</strong>
      </div>
      <div>
        <span>${t("nextStep")}</span>
        <strong>${escapeHtml(result.next_step || "")}</strong>
      </div>
      <div>
        <span>Raw artifact</span>
        <strong>${escapeHtml(intake.raw_artifact || "")}</strong>
      </div>
    </div>
    <div class="result-questions">
      <span>${t("systemQuestions")}</span>
      ${(result.questions || []).length
        ? `<ul>${result.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul>`
        : `<p>${t("noOpenQuestions")}</p>`}
      <code>${escapeHtml(queuePath || "")}</code>
    </div>
    <div class="result-actions">
      <button class="primary-action" type="button" data-intake-action="continue">${t("continueProcessing")}</button>
      <button class="secondary-action" type="button" data-intake-action="reset">${t("submitAnother")}</button>
    </div>
  `;
}

async function handleIntakeAction(action) {
  if (action === "continue") {
    const rawPath = lastIntakeResult?.intake?.raw_artifact;
    let detailError = "";
    if (rawPath && data?.artifacts?.some((artifact) => artifact.path === rawPath)) {
      selectedPath = rawPath;
      try {
        await refreshSelectedDetail();
        renderArtifacts();
        renderDetail();
      } catch (error) {
        detailError = error.message;
      }
    }
    $("#artifacts").scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus(detailError ? `${t("loadFailed")}: ${detailError}` : t("artifactsFocused"), detailError ? "error" : "ok");
    return;
  }

  if (action === "reset") {
    lastIntakeResult = null;
    $("#intakeForm").reset();
    renderStaticText();
    $("#intakeForm").elements.text.focus();
  }
}

async function readFilesAsDataUrls(files) {
  return Promise.all(files.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      dataUrl: reader.result
    });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  })));
}

async function promoteSubmission(path) {
  const response = await fetch("/api/submission/promote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path })
  });
  const result = await response.json();
  if (!result.ok) {
    showOutput(`${t("failed")}: ${result.error || "unknown error"}`);
    return;
  }
  selectedPath = result.artifact.artifact.path;
  selectedDetail = result.artifact;
  await load();
  showOutput(`${t("promotedLabel")}: ${selectedPath}`);
}

async function setExecutionMode(mode) {
  const response = await fetch("/api/execution-mode", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode })
  });
  const result = await response.json();
  if (!result.ok) {
    setStatus(`${t("failed")}: ${result.error || "unknown error"}`, "error");
    return;
  }
  if (data?.methods) {
    data.methods.execution_mode = result.execution_mode;
  }
  renderExecutionMode();
  setStatus(t("executionModeSaved").replace("{mode}", result.execution_mode), "ok");
  await load();
}

async function setAnalysisPersona(persona) {
  const response = await fetch("/api/analysis-persona", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona })
  });
  const result = await response.json();
  if (!result.ok) {
    setStatus(`${t("failed")}: ${result.error || "unknown error"}`, "error");
    return;
  }
  if (data?.methods) {
    data.methods.analysis_persona = result.analysis_persona;
  }
  renderAnalysisPersona();
  setStatus(t("analysisPersonaSaved").replace("{persona}", result.analysis_persona), "ok");
  await load();
}

async function runCommand(script, button) {
  setButtonBusy(button, true);
  showOutput(`${t("runningScript")} ${script}...`);
  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script })
    });
    if (!response.ok) {
      throw new Error(`POST /api/run ${response.status}`);
    }
    const result = await response.json();
    showOutput([
      `${t("outputScript")}: ${result.script}`,
      `${t("outputOk")}: ${result.ok}`,
      `${t("outputExitCode")}: ${result.exitCode}`,
      "",
      result.stdout || "",
      result.stderr || ""
    ].join("\n").trim());
    await load();
  } catch (error) {
    showOutput(`${t("commandFailed")}: ${error.message}`);
    setStatus(`${t("commandFailed")}: ${error.message}`, "error");
  } finally {
    setButtonBusy(button, false);
  }
}

async function cycleCapability(key) {
  const current = data.capabilities.capabilities[key].status;
  const next = current === "active" ? "reserved" : current === "reserved" ? "disabled" : "active";
  await fetch("/api/capability", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, status: next })
  });
  await load();
}

function filteredArtifacts() {
  return data.artifacts.filter((artifact) => {
    const matchesType = artifactFilter === "all" || artifact.type === artifactFilter;
    const haystack = `${artifact.path} ${artifact.type} ${artifact.status} ${artifact.owner_role}`.toLowerCase();
    const matchesSearch = !artifactSearch || haystack.includes(artifactSearch);
    return matchesType && matchesSearch;
  });
}

function statusOptions(current) {
  const states = [...(data.stateMachine.states || []), "unclassified"];
  return states.map((status) => `<option value="${status}" ${status === current ? "selected" : ""}>${labelStatus(status)}</option>`).join("");
}

function ownerOptions(current) {
  return ownerRoles.map((role) => `<option value="${role}" ${role === current ? "selected" : ""}>${role}</option>`).join("");
}

function setButtonBusy(button, isBusy) {
  if (!button) return;
  if (isBusy) {
    button.dataset.originalText = button.dataset.originalText || button.textContent;
    button.disabled = true;
    button.classList.add("is-running");
    button.setAttribute("aria-busy", "true");
    button.textContent = t("runningButton");
    return;
  }

  button.disabled = false;
  button.classList.remove("is-running");
  button.removeAttribute("aria-busy");
  if (button.dataset.i18n) {
    button.textContent = t(button.dataset.i18n);
  } else if (button.dataset.run && commandLabels[button.dataset.run]) {
    button.textContent = t(commandLabels[button.dataset.run]);
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
  }
  delete button.dataset.originalText;
}

function showOutput(text) {
  commandOutputTouched = Boolean(text);
  $("#commandOutput").textContent = text || t("waitingExecution");
}

function t(key) {
  return translations[locale]?.[key] || translations.en[key] || key;
}

function translateField(value, fallback) {
  if (value && typeof value === "object") {
    return value[locale] || value.en || value.zh || fallback;
  }
  return value || fallback;
}

function labelStatus(status) {
  return translateField(statusLabels[status], status);
}

function labelType(type) {
  return translateField(typeLabels[type], type);
}

function normalizeLocale(value) {
  return value === "en" ? "en" : "zh";
}

function normalizeExecutionMode(value) {
  return value === "agent" ? "agent" : "api";
}

function normalizeAnalysisPersona(value) {
  return ["v8.0-breakthrough", "v8.1-reality-sync", "v8.5-correction"].includes(value) ? value : "v8.1-reality-sync";
}

function readLoadedAssetVersion() {
  const script = [...document.scripts].find((node) => node.src.includes("/app.js"));
  if (!script) return "";
  return new URL(script.src, window.location.href).searchParams.get("v") || "";
}

function normalizeVersionToken(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

// ── v2.1.5: Intake Feedback ───────────────────────────────────────────────

let feedbackDebounceTimer = null;

function bindIntakeFeedbackEvents() {
  const material = $("#intakeMaterial");
  if (!material) return;
  material.addEventListener("input", () => {
    clearTimeout(feedbackDebounceTimer);
    feedbackDebounceTimer = setTimeout(() => {
      const text = material.value.trim();
      if (text.length > 50) {
        fetchIntakeFeedback(text);
      } else {
        $("#intakeFeedback").classList.remove("visible");
      }
    }, 800);
  });

  $("#feedbackRefreshBtn")?.addEventListener("click", () => {
    const text = material?.value?.trim() || "";
    if (text.length > 20) fetchIntakeFeedback(text);
  });
}

async function fetchIntakeFeedback(text) {
  const panel = $("#intakeFeedback");
  if (!panel) return;

  const loading = $("#feedbackLoading");
  const claims = $("#feedbackClaims");
  const flags = $("#feedbackFlags");
  if (loading) loading.style.display = "block";
  if (claims) claims.innerHTML = "";
  if (flags) flags.innerHTML = "";
  panel.classList.add("visible");

  try {
    const res = await fetch("/api/intake-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!data.ok) {
      panel.classList.remove("visible");
      return;
    }
    renderFeedbackResult(data);
  } catch {
    panel.classList.remove("visible");
  }
}

function renderFeedbackResult(data) {
  const loading = $("#feedbackLoading");
  if (loading) loading.style.display = "none";

  const { scores, qualityLevel, wordCount, claimCount, routingHint, flags, sampleClaims } = data;
  const overall = scores?.overall ?? 0;

  // Score ring
  const ring = $("#feedbackRingFg");
  if (ring) {
    const circumference = 2 * Math.PI * 27;
    const offset = circumference * (1 - overall / 10);
    ring.style.strokeDashoffset = offset;
    ring.className = "fg " + (qualityLevel || "medium");
  }

  const sv = $("#feedbackScoreValue");
  if (sv) sv.textContent = overall;
  const badge = $("#feedbackQualityBadge");
  if (badge) {
    badge.textContent = { high: "高质量", medium: "中等质量", low: "低质量" }[qualityLevel] || qualityLevel;
    badge.className = "quality-badge " + (qualityLevel || "medium");
  }
  const wc = $("#feedbackWordCount");
  if (wc) wc.textContent = wordCount + " 字 · " + claimCount + " 个主张";
  const rh = $("#feedbackRoutingHint");
  if (rh) {
    const hintLabels = { accept: "建议准入", revise: "建议修订", quarantine: "建议隔离" };
    rh.textContent = "路由建议：" + (hintLabels[routingHint] || routingHint);
  }

  // Dimensions
  const ds = $("#dimStructure");
  const de = $("#dimEvidence");
  const dc = $("#dimConclusion");
  const dsp = $("#dimSpecificity");
  if (ds) ds.textContent = scores?.structure ? "Yes" : "No";
  if (de) de.textContent = scores?.evidence ? "Yes" : "No";
  if (dc) dc.textContent = scores?.conclusion ? "Yes" : "No";
  if (dsp) dsp.textContent = scores?.specificity ? "Yes" : "No";

  // Flags
  const flagsEl = $("#feedbackFlags");
  if (flagsEl) {
    const flagList = [
      { key: "heavyHedging", label: "Warning: 过度修饰", type: "warn" },
      { key: "undefinedScope", label: "Warning: 范围未定义", type: "warn" },
      { key: "noEvidence", label: "Error: 无证据来源", type: "error" },
      { key: "noConclusion", label: "Warning: 无结论", type: "warn" },
    ];
    flagsEl.innerHTML = flagList
      .filter((f) => flags?.[f.key])
      .map((f) => '<span class="feedback-flag ' + f.type + '">' + f.label + "</span>")
      .join("");
  }

  // Sample claims
  const claimsEl = $("#feedbackClaims");
  if (claimsEl && sampleClaims?.length) {
    const typeLabel = { factual: "事实型", opinion: "观点型", speculative: "推测型", procedural: "程序型", unclear: "未分类" };
    const header = "<h4>主张样本（前 " + Math.min(3, sampleClaims.length) + " 条）</h4>";
    const items = sampleClaims.slice(0, 3).map((c) => {
      const t = typeLabel[c.indicator] || c.indicator || "unclear";
      const txt = escapeHtml((c.claim || "").slice(0, 200));
      return '<div class="feedback-claim ' + (c.indicator || "unclear") + '">' +
        '<div class="feedback-claim-header"><span class="feedback-claim-type">' + t + '</span></div>' +
        '<div class="feedback-claim-text">' + txt + '</div></div>';
    }).join("");
    claimsEl.innerHTML = header + items;
  }
}
