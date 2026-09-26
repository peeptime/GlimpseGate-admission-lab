const PRODUCT_ASSET_VERSION = "20260513a";
const originalFetch = window.fetch.bind(window);
const toastSuppression = new Map();
const state = {
  preferences: null,
  overview: null,
  settingsTab: "general",
  commandQuery: "",
  commandOutput: "",
  onboardingStep: 0,
  notificationPermissionAsked: false
};

const icons = {
  "gauge-circle": ["circle cx=\"12\" cy=\"12\" r=\"9\"", "path d=\"M12 12l4-4\"", "path d=\"M8 16a6 6 0 0 1 8 0\""],
  inbox: ["path d=\"M22 12h-6l-2 3h-4l-2-3H2\"", "path d=\"M5 5h14l3 7v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5z\""],
  "file-text": ["path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"", "path d=\"M14 2v6h6\"", "path d=\"M8 13h8\"", "path d=\"M8 17h8\"", "path d=\"M8 9h2\""],
  sparkles: ["path d=\"M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z\"", "path d=\"M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z\""],
  "circle-help": ["circle cx=\"12\" cy=\"12\" r=\"10\"", "path d=\"M9.1 9a3 3 0 1 1 5.8 1c-.6 1-1.9 1.5-2.4 2.4\"", "path d=\"M12 17h.01\""],
  "brain-circuit": ["path d=\"M9 3a3 3 0 0 0-3 3v1a4 4 0 0 0-1 7.7V17a3 3 0 0 0 3 3\"", "path d=\"M15 3a3 3 0 0 1 3 3v1a4 4 0 0 1 1 7.7V17a3 3 0 0 1-3 3\"", "path d=\"M9 8h6\"", "path d=\"M9 12h3v4\"", "path d=\"M15 12h-1\""],
  gavel: ["path d=\"M14 13l-7 7\"", "path d=\"M8 8l8 8\"", "path d=\"M10 4l10 10\"", "path d=\"M4 10l6-6\""],
  "list-checks": ["path d=\"M10 6h10\"", "path d=\"M10 12h10\"", "path d=\"M10 18h10\"", "path d=\"M3 6l1.5 1.5L7 5\"", "path d=\"M3 12l1.5 1.5L7 11\"", "path d=\"M3 18l1.5 1.5L7 17\""],
  "clipboard-check": ["rect x=\"8\" y=\"2\" width=\"8\" height=\"4\" rx=\"1\"", "path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"", "path d=\"M9 14l2 2 4-4\""],
  "layout-template": ["rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"", "path d=\"M3 9h18\"", "path d=\"M9 21V9\""],
  package: ["path d=\"M21 8l-9-5-9 5 9 5z\"", "path d=\"M3 8v8l9 5 9-5V8\"", "path d=\"M12 13v8\""],
  database: ["ellipse cx=\"12\" cy=\"5\" rx=\"8\" ry=\"3\"", "path d=\"M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5\"", "path d=\"M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6\""],
  play: ["polygon points=\"8 5 19 12 8 19 8 5\""],
  "shield-check": ["path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"", "path d=\"M9 12l2 2 4-4\""],
  stethoscope: ["path d=\"M6 3v5a4 4 0 0 0 8 0V3\"", "path d=\"M10 16a4 4 0 0 0 8 0v-1\"", "circle cx=\"20\" cy=\"13\" r=\"2\""],
  "circle-dot": ["circle cx=\"12\" cy=\"12\" r=\"10\"", "circle cx=\"12\" cy=\"12\" r=\"3\""],
  settings: ["circle cx=\"12\" cy=\"12\" r=\"3\"", "path d=\"M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.2.1-2-3 .1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7l2-3 .2.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3h5v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.2-.1 2 3-.1.1A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1z\""],
  bell: ["path d=\"M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9\"", "path d=\"M10 21h4\""],
  "scroll-text": ["path d=\"M8 21h8a4 4 0 0 0 4-4V5a3 3 0 0 0-6 0v12a4 4 0 0 1-8 0V5a3 3 0 0 0-6 0v2h6\"", "path d=\"M9 7h5\"", "path d=\"M9 11h5\""],
  "alert-octagon": ["path d=\"M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9z\"", "path d=\"M12 8v5\"", "path d=\"M12 17h.01\""],
  "x-circle": ["circle cx=\"12\" cy=\"12\" r=\"10\"", "path d=\"M15 9l-6 6\"", "path d=\"M9 9l6 6\""],
  "check-circle": ["circle cx=\"12\" cy=\"12\" r=\"10\"", "path d=\"M8 12l3 3 5-6\""],
  pencil: ["path d=\"M17 3l4 4L8 20l-5 1 1-5z\""],
  search: ["circle cx=\"11\" cy=\"11\" r=\"8\"", "path d=\"M21 21l-4.3-4.3\""],
  keyboard: ["rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"", "path d=\"M7 9h.01M11 9h.01M15 9h.01M19 9h.01M8 13h8\""],
  download: ["path d=\"M12 3v12\"", "path d=\"M7 10l5 5 5-5\"", "path d=\"M5 21h14\""],
  copy: ["rect x=\"9\" y=\"9\" width=\"11\" height=\"11\" rx=\"2\"", "path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\""],
  "external-link": ["path d=\"M15 3h6v6\"", "path d=\"M10 14L21 3\"", "path d=\"M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5\""],
  "wifi-off": ["path d=\"M1 1l22 22\"", "path d=\"M16.7 16.7A6 6 0 0 0 7.3 16.7\"", "path d=\"M19.8 13.6a10 10 0 0 0-12.5-1.9\"", "path d=\"M22 9a16 16 0 0 0-16.7-3\""]
};

window.fetch = async function productFetch(input, init = {}) {
  try {
    const response = await originalFetch(input, init);
    handleFetchResponse(input, response.clone());
    if (!response.ok) {
      productError(`HTTP ${response.status}`, requestUrl(input));
    } else if (requestUrl(input).includes("/api/")) {
      showConnectionBanner(false);
    }
    return response;
  } catch (error) {
    productError(error.message, requestUrl(input));
    throw error;
  }
};

document.addEventListener("DOMContentLoaded", initProductLayer);

async function initProductLayer() {
  injectChrome();
  bindProductEvents();
  await loadPreferences();
  applyPreferences();
  decorateEverywhere();
  observeMutations();
  const requestedState = openRequestedProductState();
  if (!requestedState && !state.preferences?.onboarding?.completed) {
    openOnboarding();
  }
}

async function loadPreferences() {
  const preferences = await fetchJson("/api/preferences").catch(() => null);
  state.preferences = preferences?.preferences || defaultPreferences();
}

async function reloadProductContext() {
  const context = await fetchJson("/api/product-context").catch(() => null);
  if (context) {
    state.overview = context;
    state.preferences = context.preferences || state.preferences || defaultPreferences();
  }
}

async function ensureProductContext() {
  if (state.overview?.ok) return state.overview;
  await reloadProductContext();
  return state.overview;
}

function injectChrome() {
  document.body.insertAdjacentHTML("beforeend", `
    <div id="connectionBanner" class="connection-banner" hidden>
      ${icon("wifi-off")}<strong>Dashboard server connection failed.</strong>
      <button type="button" data-product-action="retry-load">重试</button>
      <button type="button" data-product-action="view-logs">查看日志</button>
    </div>
    <div id="toastRegion" class="toast-region" aria-live="polite" aria-atomic="false"></div>
    <div id="settingsPanel" class="product-modal" role="dialog" aria-modal="true" aria-labelledby="settingsTitle" hidden></div>
    <div id="commandPalette" class="product-modal command-modal" role="dialog" aria-modal="true" aria-labelledby="commandTitle" hidden></div>
    <div id="onboardingPanel" class="product-modal onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboardingTitle" hidden></div>
  `);

  const toolbar = document.querySelector(".toolbar");
  if (toolbar) {
    toolbar.insertAdjacentHTML("beforeend", `
      <button class="icon-action" type="button" data-product-action="open-command" data-tip="搜索 artifact、命令、设置" aria-label="Open command palette">${icon("search")}<span>搜索</span></button>
      <button class="icon-action" type="button" data-product-action="open-settings" data-tip="打开 7 类设置" aria-label="Open settings">${icon("settings")}<span>设置</span></button>
      <button class="icon-action" type="button" data-product-action="request-notifications" data-tip="启用系统通知" aria-label="Enable notifications">${icon("bell")}<span>通知</span></button>
      <a class="icon-action lite-link" href="/lite.html" target="_blank" rel="noreferrer" data-tip="打开单文件 Lite Mode">${icon("gauge-circle")}<span>Lite</span></a>
    `);
  }

  const commands = document.querySelector(".commands");
  if (commands) {
    for (const command of commandButtons()) {
      if (commands.querySelector(`[data-run="${command.script}"]`)) continue;
      commands.insertAdjacentHTML("afterbegin", `
        <button data-run="${command.script}" type="button" data-tip="${escapeAttr(command.tip)}">${icon(command.icon)}<span>${command.label}</span></button>
      `);
    }
  }
}

function bindProductEvents() {
  document.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-product-action]")?.dataset.productAction;
    if (!action) return;
    if (action === "open-settings") openSettings();
    if (action === "close-modal") closeModals();
    if (action === "open-command") openCommandPalette();
    if (action === "request-notifications") await requestNotificationPermission();
    if (action === "save-settings") await saveSettings();
    if (action === "run-onboarding-doctor") await runOnboardingDoctor();
    if (action === "next-onboarding") nextOnboarding();
    if (action === "skip-onboarding") await completeOnboarding(true);
    if (action === "finish-onboarding") await completeOnboarding(false);
    if (action === "retry-load") window.location.reload();
    if (action === "view-logs") document.querySelector("#commandOutput")?.scrollIntoView({ behavior: "smooth" });
    if (action === "check-updates") await checkUpdates();
    if (action === "download-diagnostics") await downloadDiagnostics();
    if (action === "clean-dist") await cleanDist();
    if (action === "rerun-onboarding") openOnboarding();
  });

  document.addEventListener("input", (event) => {
    const pref = event.target.dataset.pref;
    if (pref) {
      setNested(state.preferences, pref, readControlValue(event.target));
      applyPreferences();
    }
    if (event.target.id === "commandSearch") {
      state.commandQuery = event.target.value.trim().toLowerCase();
      renderCommandPalette();
    }
  });

  document.addEventListener("keydown", async (event) => {
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommandPalette();
    } else if (mod && event.key === ",") {
      event.preventDefault();
      openSettings();
    } else if (mod && event.key.toLowerCase() === "n") {
      event.preventDefault();
      document.querySelector("#intakeForm textarea")?.focus();
    } else if (mod && event.key === "/") {
      event.preventDefault();
      openCommandPalette("shortcuts");
    } else if (mod && event.key.toLowerCase() === "e") {
      event.preventDefault();
      await runScript("report");
    } else if (mod && event.key.toLowerCase() === "r") {
      event.preventDefault();
      await runScript("cycle:status");
    } else if (mod && /^[1-7]$/.test(event.key)) {
      event.preventDefault();
      state.settingsTab = settingsTabs()[Number(event.key) - 1]?.id || state.settingsTab;
      openSettings();
    } else if (event.key === "Escape") {
      closeModals();
    }
  });
}

function observeMutations() {
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      decorateEverywhere();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function openRequestedProductState() {
  const params = new URLSearchParams(window.location.search);
  const product = params.get("product");
  if (product === "settings") openSettings();
  if (product === "command") openCommandPalette(params.get("q") || "");
  if (product === "onboarding") openOnboarding();
  return Boolean(product);
}

function decorateEverywhere() {
  const brandMark = document.querySelector(".brand-mark");
  if (brandMark && brandMark.dataset.productIcon !== "true") {
    brandMark.replaceChildren(svgNode("gauge-circle", 20));
    brandMark.dataset.productIcon = "true";
  }
  const navIcons = [
    [".rail-section a[href='#submit']", "pencil"],
    [".rail-section a[href='#intake']", "inbox"],
    [".rail-section a[href='#artifacts']", "database"]
  ];
  for (const [selector, iconName] of navIcons) decorateIcon(selector, iconName);

  for (const command of allCommandButtons()) {
    document.querySelectorAll(`[data-run="${command.script}"]`).forEach((button) => {
      if (!button.dataset.tip) button.dataset.tip = command.tip;
      if (!button.querySelector(".icon")) {
        button.insertAdjacentHTML("afterbegin", icon(command.icon));
      }
      if (!button.querySelector("span")) {
        const label = button.textContent.trim() || command.label;
        button.append(document.createElement("span"));
        button.querySelector("span").textContent = label;
      }
    });
  }

  const routeIcons = {
    accept: "check-circle",
    revise: "pencil",
    quarantine: "shield-check",
    discard: "x-circle"
  };
  document.querySelectorAll(".status, .readiness-badge, .queue-count").forEach((node) => {
    const key = Object.keys(routeIcons).find((name) => node.textContent.toLowerCase().includes(name));
    if (key && !node.querySelector(".icon")) node.insertAdjacentHTML("afterbegin", icon(routeIcons[key], 14));
  });
}

function decorateIcon(selector, iconName) {
  const node = document.querySelector(selector);
  if (node && !node.querySelector(".icon")) node.insertAdjacentHTML("afterbegin", icon(iconName));
}

function openSettings() {
  state.settingsTab ||= "general";
  renderSettings();
  document.querySelector("#settingsPanel").hidden = false;
  ensureProductContext().then(() => {
    if (!document.querySelector("#settingsPanel")?.hidden) renderSettings();
  }).catch(() => {});
}

function renderSettings() {
  const modal = document.querySelector("#settingsPanel");
  if (!modal) return;
  const tabs = settingsTabs();
  modal.innerHTML = `
    <div class="modal-backdrop" data-product-action="close-modal"></div>
    <section class="modal-card settings-card">
      <header class="modal-head">
        <div>
          <h2 id="settingsTitle">${icon("settings")}Settings</h2>
          <p>7 个分类把现有后端能力包装成可读、可改、可恢复的产品入口。</p>
        </div>
        <button class="icon-only" type="button" data-product-action="close-modal" aria-label="Close settings">${icon("x-circle")}</button>
      </header>
      <div class="settings-layout">
        <nav class="settings-tabs" aria-label="Settings categories">
          ${tabs.map((tab) => `<button type="button" class="${state.settingsTab === tab.id ? "active" : ""}" data-product-action="settings-tab" data-tab="${tab.id}">${icon(tab.icon)}<span>${tab.label}</span></button>`).join("")}
        </nav>
        <form id="settingsForm" class="settings-content">
          ${renderSettingsTab(state.settingsTab)}
        </form>
      </div>
      <footer class="modal-actions">
        <button type="button" data-product-action="rerun-onboarding">${icon("gauge-circle")}重看引导</button>
        <button type="button" data-product-action="save-settings" class="primary-action">${icon("check-circle")}保存设置</button>
      </footer>
    </section>
  `;
  modal.querySelectorAll("[data-product-action='settings-tab']").forEach((button) => {
    button.addEventListener("click", () => {
      state.settingsTab = button.dataset.tab;
      renderSettings();
    });
  });
}

function renderSettingsTab(tab) {
  const prefs = state.preferences || defaultPreferences();
  const overview = state.overview || {};
  if (tab === "general") {
    return panel("常规 General", [
      selectField("启动行为", "general.startup_behavior", prefs.general.startup_behavior, [["last_page", "启动到上次工作页"], ["dashboard", "启动到 Dashboard"], ["lite", "启动到 Lite Mode"]]),
      toggleField("自动重连后端", "general.auto_reconnect", prefs.general.auto_reconnect),
      numberField("最近文件数量", "general.recent_files_count", prefs.general.recent_files_count, 1, 50),
      selectField("语言 / Language", "general.language", prefs.general.language, [["system", "System"], ["zh-CN", "zh-CN"], ["en", "English"]]),
      selectField("时区显示", "general.timezone", prefs.general.timezone, [["local", "Local"], ["utc", "UTC"]])
    ]);
  }
  if (tab === "interface") {
    return panel("界面 Interface", [
      radioField("主题", "interface.theme", prefs.interface.theme, [["light", "Light"], ["dark", "Dark"], ["system", "System"]]),
      swatchField("强调色", "interface.accent", prefs.interface.accent),
      radioField("字号", "interface.font_scale", prefs.interface.font_scale, [["small", "Small"], ["medium", "Medium"], ["large", "Large"]]),
      selectField("字体族", "interface.font_family", prefs.interface.font_family, [["system", "System"], ["serif", "Serif"], ["mono", "Mono"]]),
      toggleField("紧凑模式", "interface.compact", prefs.interface.compact),
      toggleField("显示行号", "interface.show_line_numbers", prefs.interface.show_line_numbers),
      rangeField("Sidebar 宽度", "interface.sidebar_width", prefs.interface.sidebar_width, 180, 360)
    ]);
  }
  if (tab === "storage") {
    const dirs = overview.storageSummary?.directories || [];
    return panel("存储 Storage", [
      readonlyField("Workspace 路径", overview.root || "-"),
      readonlyField("Artifacts 总览", dirs.map((dir) => `${dir.path}: ${dir.files} files / ${formatBytes(dir.bytes)}`).join("\n") || "-"),
      readonlyField("Lifecycle log 大小", formatBytes(overview.storageSummary?.lifecycle_log?.bytes || 0)),
      textField("Index 路径", "storage.index_path", prefs.storage.index_path),
      toggleField("自动归档", "storage.auto_archive_enabled", prefs.storage.auto_archive_enabled),
      numberField("自动归档天数", "storage.auto_archive_days", prefs.storage.auto_archive_days, 1, 365),
      `<button type="button" data-product-action="clean-dist">${icon("x-circle")}清理 dist</button>`
    ]);
  }
  if (tab === "output") {
    return panel("输出 Output", [
      radioField("默认导出格式", "output.default_export_format", prefs.output.default_export_format, [["md", ".md"], ["json", ".json"], ["pdf", ".pdf"]]),
      textField("默认导出目录", "output.export_dir", prefs.output.export_dir),
      toggleField("包含 provenance block", "output.include_provenance", prefs.output.include_provenance),
      radioField("HTML 报告主题", "output.html_report_theme", prefs.output.html_report_theme, [["editorial", "Editorial"], ["terminal", "Terminal"], ["minimal", "Minimal"]]),
      toggleField("导出附加 audit_ref", "output.append_audit_ref", prefs.output.append_audit_ref),
      radioField("Markdown 表格风格", "output.markdown_table_style", prefs.output.markdown_table_style, [["gfm", "GFM"], ["strict", "Strict"]])
    ]);
  }
  if (tab === "control") {
    const providers = Object.keys(overview.modelProviders?.providers || {});
    const personas = Object.keys(overview.methods?.personas || {});
    return panel("控制 Control", [
      selectField("Active LLM Provider", "control.provider", prefs.control.provider || overview.modelProviders?.active_provider || "", providers.map((key) => [key, key])),
      radioField("Execution Mode", "control.execution_mode", prefs.control.execution_mode || overview.methods?.execution_mode || "api", [["api", "api"], ["agent", "agent"]]),
      selectField("Analysis Persona", "control.analysis_persona", prefs.control.analysis_persona || overview.methods?.analysis_persona || "", personas.map((key) => [key, key])),
      toggleField("危险命令二次确认", "control.danger_confirm", prefs.control.danger_confirm),
      readonlyField("命令白名单", (overview.commandAllowlist || []).join("\n")),
      radioField("默认 review state", "control.default_review_state", prefs.control.default_review_state, [["declined", "declined"], ["pending", "pending"], ["true", "true"]])
    ]);
  }
  if (tab === "update") {
    return panel("更新 Update", [
      `<button type="button" data-product-action="check-updates">${icon("download")}检查更新</button><p id="updateCheckResult" class="settings-note">Up to date 状态会显示在这里。</p>`,
      radioField("自动检查频率", "update.auto_check_frequency", prefs.update.auto_check_frequency, [["startup", "每次启动"], ["daily", "每天"], ["off", "关闭"]]),
      toggleField("包含 prerelease", "update.include_prerelease", prefs.update.include_prerelease),
      toggleField("升级后显示 changelog", "update.show_changelog_after_update", prefs.update.show_changelog_after_update)
    ]);
  }
  return panel("关于 About", [
    readonlyField("应用", `Mercury Method Lab v${overview.packageVersion || ""} ${overview.releaseNotes?.title || ""}`),
    readonlyField("Build / Commit", `${overview.git?.branch || "-"} @ ${overview.git?.commit || "-"}`),
    readonlyField("Node version", overview.nodeVersion || "-"),
    readonlyField("License", "MIT"),
    readonlyField("项目链接", "GitHub / Releases / CHANGELOG / AUDIT-CONTRACT"),
    readonlyField("Provenance", "ai_assisted: true\nhuman_reviewed: declined\nreviewer: project_owner_pending"),
    `<button type="button" data-product-action="download-diagnostics">${icon("download")}下载诊断 JSON</button>`
  ]);
}

function panel(title, fields) {
  return `<section class="settings-panel"><h3>${title}</h3><div class="settings-grid">${fields.join("")}</div></section>`;
}

function field(label, control) {
  return `<label class="settings-field"><span>${label}</span>${control}</label>`;
}

function textField(label, path, value) {
  return field(label, `<input data-pref="${path}" value="${escapeAttr(value)}">`);
}

function numberField(label, path, value, min, max) {
  return field(label, `<input type="number" data-pref="${path}" min="${min}" max="${max}" value="${escapeAttr(value)}">`);
}

function rangeField(label, path, value, min, max) {
  return field(label, `<input type="range" data-pref="${path}" min="${min}" max="${max}" value="${escapeAttr(value)}"><small>${value}px</small>`);
}

function selectField(label, path, value, options) {
  return field(label, `<select data-pref="${path}">${options.map(([key, text]) => `<option value="${escapeAttr(key)}" ${String(value) === String(key) ? "selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select>`);
}

function toggleField(label, path, value) {
  return field(label, `<input type="checkbox" data-pref="${path}" ${value ? "checked" : ""}>`);
}

function radioField(label, path, value, options) {
  return field(label, `<div class="settings-radio">${options.map(([key, text]) => `<label><input type="radio" data-pref="${path}" name="${path}" value="${escapeAttr(key)}" ${String(value) === String(key) ? "checked" : ""}>${escapeHtml(text)}</label>`).join("")}</div>`);
}

function swatchField(label, path, value) {
  const swatches = ["#7a1d1d", "#245b45", "#325c7a", "#7a4f1d", "#4c3f84", "#1f6b3a"];
  return field(label, `<div class="swatches">${swatches.map((color) => `<button type="button" class="${color === value ? "active" : ""}" style="--swatch:${color}" aria-label="${color}" onclick="this.closest('.settings-field').querySelector('input').value='${color}'; this.closest('.settings-field').querySelector('input').dispatchEvent(new Event('input',{bubbles:true}))"></button>`).join("")}<input data-pref="${path}" value="${escapeAttr(value)}"></div>`);
}

function readonlyField(label, value) {
  return `<div class="settings-field readonly"><span>${label}</span><pre>${escapeHtml(value)}</pre></div>`;
}

async function saveSettings() {
  const prefs = structuredClone(state.preferences || defaultPreferences());
  const control = prefs.control || {};
  delete control.provider;
  delete control.execution_mode;
  delete control.analysis_persona;
  prefs.control = control;
  await fetchJson("/api/preferences", { method: "PATCH", body: JSON.stringify(prefs) });
  const provider = getNested(state.preferences, "control.provider");
  const mode = getNested(state.preferences, "control.execution_mode");
  const persona = getNested(state.preferences, "control.analysis_persona");
  if (provider) await fetchJson("/api/model-provider", { method: "PATCH", body: JSON.stringify({ provider }) });
  if (mode) await fetchJson("/api/execution-mode", { method: "PATCH", body: JSON.stringify({ mode }) });
  if (persona) await fetchJson("/api/analysis-persona", { method: "PATCH", body: JSON.stringify({ persona }) });
  await reloadProductContext();
  applyPreferences();
  showToast("success", "设置已保存", "刷新后仍会保持。");
}

function openCommandPalette(seed = "") {
  state.commandQuery = seed;
  renderCommandPalette();
  const modal = document.querySelector("#commandPalette");
  modal.hidden = false;
  modal.querySelector("#commandSearch")?.focus();
}

function renderCommandPalette() {
  const commands = paletteCommands().filter((command) => {
    const haystack = `${command.label} ${command.keywords}`.toLowerCase();
    return !state.commandQuery || haystack.includes(state.commandQuery);
  });
  document.querySelector("#commandPalette").innerHTML = `
    <div class="modal-backdrop" data-product-action="close-modal"></div>
    <section class="modal-card palette-card">
      <header class="modal-head">
        <div><h2 id="commandTitle">${icon("search")}Command Palette</h2><p>⌘K 搜索，⌘1-7 切设置分类，Esc 关闭。</p></div>
        <button class="icon-only" type="button" data-product-action="close-modal" aria-label="Close command palette">${icon("x-circle")}</button>
      </header>
      <input id="commandSearch" value="${escapeAttr(state.commandQuery)}" placeholder="Search commands, settings, failure modes...">
      <div class="palette-results">
        ${commands.map((command) => `<button type="button" data-command-id="${command.id}">${icon(command.icon)}<span><strong>${command.label}</strong><small>${command.help}</small></span></button>`).join("")}
      </div>
    </section>
  `;
  document.querySelectorAll("[data-command-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const command = paletteCommands().find((item) => item.id === button.dataset.commandId);
      if (command) await command.run();
    });
  });
}

function paletteCommands() {
  return [
    ...allCommandButtons().map((command) => ({
      id: `run-${command.script}`,
      label: command.label,
      help: command.tip,
      icon: command.icon,
      keywords: `${command.script} npm run`,
      run: () => runScript(command.script)
    })),
    { id: "settings", label: "打开设置", help: "7 个设置分类", icon: "settings", keywords: "settings preferences", run: () => openSettings() },
    { id: "lite", label: "打开 Lite Mode", help: "单文件审计入口", icon: "gauge-circle", keywords: "lite audit", run: () => window.open("/lite.html", "_blank", "noreferrer") },
    { id: "onboarding", label: "重看引导", help: "Provider -> Doctor -> Case 001", icon: "gauge-circle", keywords: "first run onboarding", run: () => openOnboarding() },
    { id: "shortcuts", label: "快捷键", help: "⌘K ⌘, ⌘N ⌘/ ⌘E ⌘R ⌘1-7 Esc", icon: "keyboard", keywords: "shortcuts keyboard", run: () => showToast("info", "快捷键", "⌘K 搜索, ⌘, 设置, ⌘N 新 intake, ⌘E report, ⌘R cycle status, Esc 关闭。") }
  ];
}

async function runScript(script) {
  closeModals();
  showToast("info", `运行 ${script}`, "命令已提交到 dashboard 后端。");
  const result = await fetchJson("/api/run", { method: "POST", body: JSON.stringify({ script }) });
  const output = [result.stdout || "", result.stderr || ""].join("\n").trim();
  document.querySelector("#commandOutput").textContent = output || JSON.stringify(result, null, 2);
  if (result.ok) showToast("success", `${script} 完成`, summarizeRun(result));
  else showToast("error", `${script} 失败`, result.stderr || "查看日志。", { sticky: true });
}

function openOnboarding() {
  state.onboardingStep = 0;
  renderOnboarding();
  document.querySelector("#onboardingPanel").hidden = false;
  ensureProductContext().then(() => {
    if (!document.querySelector("#onboardingPanel")?.hidden) renderOnboarding();
  }).catch(() => {});
}

function renderOnboarding() {
  const steps = [
    {
      title: "1. 选择 Provider",
      body: renderProviderStep(),
      action: `<button type="button" class="primary-action" data-product-action="next-onboarding">${icon("check-circle")}下一步</button>`
    },
    {
      title: "2. 健康检查",
      body: `<p>运行 doctor，确认目录、脚本、Node 和基础配置可用。</p><button type="button" data-product-action="run-onboarding-doctor">${icon("stethoscope")}运行 Doctor</button><pre class="onboarding-output">${escapeHtml(state.commandOutput || "等待运行...")}</pre>`,
      action: `<button type="button" class="primary-action" data-product-action="next-onboarding">${icon("check-circle")}继续</button>`
    },
    {
      title: "3. 看一个判例",
      body: `<p>Case 001 展示 6 字段结构：Raw Output、Plausible、Evidence Gap、Memory Pollution Risk、Decision、Rule Learned。</p><div class="case-map">${["Raw Output", "Why plausible", "Evidence gap", "Pollution risk", "Decision", "Rule learned"].map((item) => `<span>${icon("clipboard-check")}${item}</span>`).join("")}</div>`,
      action: `<button type="button" class="primary-action" data-product-action="finish-onboarding">${icon("check-circle")}我懂了</button>`
    }
  ];
  const step = steps[state.onboardingStep] || steps[0];
  document.querySelector("#onboardingPanel").innerHTML = `
    <div class="modal-backdrop"></div>
    <section class="modal-card onboarding-card">
      <header class="modal-head">
        <div><h2 id="onboardingTitle">${icon("gauge-circle")}Mercury Lab First Run</h2><p>60 秒内完成：Provider -> Doctor -> Case 001。</p></div>
        <button type="button" data-product-action="skip-onboarding">Skip onboarding</button>
      </header>
      <div class="onboarding-progress"><span style="width:${((state.onboardingStep + 1) / 3) * 100}%"></span></div>
      <h3>${step.title}</h3>
      <div class="onboarding-body">${step.body}</div>
      <footer class="modal-actions">${step.action}</footer>
    </section>
  `;
}

function renderProviderStep() {
  const providers = Object.keys(state.overview?.modelProviders?.providers || {});
  const active = state.overview?.modelProviders?.active_provider || providers[0] || "";
  return `<label class="settings-field"><span>LLM Provider</span><select data-pref="control.provider">${providers.map((provider) => `<option value="${provider}" ${provider === active ? "selected" : ""}>${provider}</option>`).join("")}</select></label><p>也可以稍后在 Settings -> Control 中修改。</p>`;
}

async function runOnboardingDoctor() {
  const result = await fetchJson("/api/run", { method: "POST", body: JSON.stringify({ script: "doctor" }) });
  state.commandOutput = [result.stdout || "", result.stderr || ""].join("\n").trim();
  renderOnboarding();
  showToast(result.ok ? "success" : "error", result.ok ? "Doctor 通过" : "Doctor 失败", result.ok ? "基础环境已就绪。" : "查看输出并修复。");
}

function nextOnboarding() {
  state.onboardingStep = Math.min(2, state.onboardingStep + 1);
  renderOnboarding();
}

async function completeOnboarding(skipped) {
  setNested(state.preferences, "onboarding.completed", true);
  setNested(state.preferences, "onboarding.skipped", Boolean(skipped));
  await fetchJson("/api/preferences", { method: "PATCH", body: JSON.stringify(state.preferences) });
  closeModals();
  showToast("success", skipped ? "已跳过引导" : "引导完成", "可在 Settings -> About 中重看。");
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast("warn", "系统通知不可用", "当前浏览器不支持 Web Notification API。");
    return;
  }
  const permission = await Notification.requestPermission();
  setNested(state.preferences, "notifications.system_enabled", permission === "granted");
  await fetchJson("/api/preferences", { method: "PATCH", body: JSON.stringify(state.preferences) });
  showToast(permission === "granted" ? "success" : "warn", "通知权限", permission);
}

function handleFetchResponse(input, response) {
  const url = requestUrl(input);
  if (!url.includes("/api/run")) return;
  response.json().then((payload) => {
    if (!payload || !payload.script) return;
    if (!payload.ok) {
      showToast("error", `${payload.script} 失败`, payload.stderr || "查看日志。", { sticky: true });
      systemNotify("Mercury command failed", `${payload.script} failed`);
      return;
    }
    if (payload.script === "audit") {
      showToast("success", "审计完成", summarizeRun(payload));
      systemNotify("Mercury audit complete", summarizeRun(payload));
    } else if (payload.script === "report") {
      showToast("success", "HTML 报告已生成", "dist/reports/index.html", { actionLabel: "打开", onAction: () => window.open("/reports/index.html", "_blank") });
    } else if (payload.script === "cycle:check") {
      showToast("success", "Cycle 02 检查通过", "Proof/failure/review 结构完整。");
    }
  }).catch(() => {});
}

function productError(message, url) {
  showConnectionBanner(true);
  showToast("error", "请求失败", `${message} ${url || ""}`, { sticky: true, actionLabel: "查看日志", onAction: () => document.querySelector("#commandOutput")?.scrollIntoView({ behavior: "smooth" }) });
}

function showConnectionBanner(show) {
  const banner = document.querySelector("#connectionBanner");
  if (banner) banner.hidden = !show;
}

function showToast(type, title, body = "", options = {}) {
  if (state.preferences?.notifications?.toast_enabled === false) return;
  const key = `${type}:${title}:${body}`;
  const now = Date.now();
  if ((toastSuppression.get(key) || 0) > now - 60000) return;
  toastSuppression.set(key, now);
  const region = document.querySelector("#toastRegion");
  if (!region) return;
  const node = document.createElement("article");
  node.className = `toast ${type}`;
  node.innerHTML = `
    <button type="button" class="icon-only toast-close" aria-label="Dismiss">${icon("x-circle", 14)}</button>
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(body)}</p>
    ${options.actionLabel ? `<button type="button" class="toast-action">${escapeHtml(options.actionLabel)}</button>` : ""}
  `;
  node.querySelector(".toast-close").addEventListener("click", () => node.remove());
  node.querySelector(".toast-action")?.addEventListener("click", () => options.onAction?.());
  region.append(node);
  if (!options.sticky) {
    setTimeout(() => node.remove(), type === "error" ? 8000 : 4000);
  }
}

function systemNotify(title, body) {
  if (state.preferences?.notifications?.system_enabled !== true) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;
  new Notification(title, { body });
}

function applyPreferences() {
  const prefs = state.preferences || defaultPreferences();
  const root = document.documentElement;
  root.classList.toggle("theme-dark", prefs.interface.theme === "dark" || (prefs.interface.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
  root.classList.toggle("font-small", prefs.interface.font_scale === "small");
  root.classList.toggle("font-large", prefs.interface.font_scale === "large");
  root.classList.toggle("font-mono", prefs.interface.font_family === "mono");
  root.classList.toggle("font-serif", prefs.interface.font_family === "serif");
  root.classList.toggle("compact", Boolean(prefs.interface.compact));
  root.style.setProperty("--accent", prefs.interface.accent || "#7a1d1d");
  root.style.setProperty("--rail-width", `${Number(prefs.interface.sidebar_width || 240)}px`);
}

async function checkUpdates() {
  const includePrerelease = Boolean(state.preferences?.update?.include_prerelease);
  const result = await fetchJson(`/api/update-check?include_prerelease=${includePrerelease ? "true" : "false"}`);
  const target = document.querySelector("#updateCheckResult");
  const text = result.ok
    ? (result.update_available ? `${result.tag} available: ${result.url}` : `Up to date (${result.current_version})`)
    : `Update check failed: ${result.error}`;
  if (target) target.textContent = text;
  showToast(result.update_available ? "info" : "success", "更新检查", text);
}

async function downloadDiagnostics() {
  const diagnostics = await fetchJson("/api/diagnostics");
  const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `mercury-diagnostics-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function cleanDist() {
  await fetchJson("/api/maintenance/clean-dist", { method: "POST" });
  showToast("success", "dist 已清理", "临时 HTML/report 输出已删除。");
}

function closeModals() {
  document.querySelectorAll(".product-modal").forEach((modal) => { modal.hidden = true; });
}

function commandButtons() {
  return [
    { script: "cycle:status", label: "看进度", icon: "circle-dot", tip: "查看 Cycle 02 进度" },
    { script: "cycle:check", label: "查结构", icon: "shield-check", tip: "检查 proof/failure/review 结构" },
    { script: "audit", label: "跑审计", icon: "play", tip: "审计 examples/audit-packets" },
    { script: "report", label: "出报告", icon: "clipboard-check", tip: "生成 HTML 审计报告" },
    { script: "audit:flow", label: "看流向", icon: "package", tip: "模拟 accept/revise/quarantine/discard 流向" }
  ];
}

function allCommandButtons() {
  return [
    ...commandButtons(),
    { script: "doctor", label: "诊断", icon: "stethoscope", tip: "诊断系统环境" },
    { script: "index", label: "建索引", icon: "database", tip: "重建 sample/source 索引" },
    { script: "validate", label: "校验", icon: "shield-check", tip: "校验 artifact provenance" },
    { script: "sync:skills", label: "同步", icon: "sparkles", tip: "同步项目技能" },
    { script: "test:llm", label: "测 LLM", icon: "play", tip: "运行 LLM smoke test" }
  ];
}

function settingsTabs() {
  return [
    { id: "general", label: "常规", icon: "settings" },
    { id: "interface", label: "界面", icon: "layout-template" },
    { id: "storage", label: "存储", icon: "database" },
    { id: "output", label: "输出", icon: "download" },
    { id: "control", label: "控制", icon: "gavel" },
    { id: "update", label: "更新", icon: "bell" },
    { id: "about", label: "关于", icon: "scroll-text" }
  ];
}

async function fetchJson(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const response = await fetch(url, { cache: "no-store", ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(payload.error || `${url} failed`);
  return payload;
}

function requestUrl(input) {
  if (typeof input === "string") return input;
  return input?.url || "";
}

function readControlValue(control) {
  if (control.type === "checkbox") return control.checked;
  if (control.type === "number" || control.type === "range") return Number(control.value);
  return control.value;
}

function setNested(object, path, value) {
  const parts = path.split(".");
  let current = object;
  while (parts.length > 1) {
    const part = parts.shift();
    current[part] ??= {};
    current = current[part];
  }
  current[parts[0]] = value;
}

function getNested(object, path) {
  return path.split(".").reduce((current, part) => current?.[part], object);
}

function defaultPreferences() {
  return {
    onboarding: { completed: false },
    interface: { theme: "system", accent: "#7a1d1d", font_scale: "medium", font_family: "system", compact: false, sidebar_width: 240 },
    general: { startup_behavior: "last_page", auto_reconnect: true, recent_files_count: 10, language: "system", timezone: "local" },
    storage: { index_path: "11_indexes", auto_archive_enabled: false, auto_archive_days: 90 },
    output: { default_export_format: "md", export_dir: "10_exports", include_provenance: true, html_report_theme: "editorial", append_audit_ref: true, markdown_table_style: "gfm" },
    control: { danger_confirm: true, default_review_state: "declined" },
    update: { auto_check_frequency: "daily", include_prerelease: false, show_changelog_after_update: true },
    notifications: { system_enabled: false, toast_enabled: true }
  };
}

function summarizeRun(result) {
  const text = `${result.stdout || ""}\n${result.stderr || ""}`;
  const audit = text.match(/accept=(\d+)\s+revise=(\d+)\s+quarantine=(\d+)\s+discard=(\d+)/);
  if (audit) return `accept ${audit[1]} · revise ${audit[2]} · quarantine ${audit[3]} · discard ${audit[4]}`;
  return result.ok ? "命令完成。" : "命令失败。";
}

function icon(name, size = 16) {
  return `<svg class="icon icon-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(icons[name] || icons["circle-help"]).map((path) => `<${path}/>`).join("")}</svg>`;
}

function svgNode(name, size = 16) {
  const template = document.createElement("template");
  template.innerHTML = icon(name, size);
  return template.content.firstElementChild;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
