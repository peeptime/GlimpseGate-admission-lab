// UI strings. Data coming from the server (failure-mode ids, paths, SDK
// labels) is shown as-is: it is vocabulary, and translating it would hide it.
const KEY = "glimpsegate.lang";

const dict = {
  zh: {
    "nav.gate": "准入", "nav.library": "资料", "nav.system": "系统",
    "gate.title": "这段内容能以什么身份被记住？",
    "gate.intro": "粘贴 AI 输出、笔记或候选记忆。准入门判断它能否进入长期记忆，以及能被怎样使用。",
    "gate.placeholder": "粘贴一段内容……\n\n可以在单独一行写出引用：\nsource: conversation:2026-09-20\n复核: review-ledger:2026-09-21",
    "gate.examples": "试一试",
    "ex.overgen": "绝对化偏好", "ex.circular": "自证结论", "ex.bounded": "有来源的决定",
    "gate.evidence": "证据与范围", "gate.evidenceHint": "可选。也可以直接在正文里写 source: / 复核: 行。",
    "gate.sourceRefs": "来源引用", "gate.auditRefs": "复核引用", "gate.risk": "风险", "gate.boundary": "适用边界",
    "gate.boundaryPh": "例如：仅限本仓库，直到下次架构评审",
    "gate.refsHint": "每行一条。来源级别按词判断（conversation、commit、docs/…），也可以用 primary:: / traceable:: 前缀声明。",
    "gate.run": "送入准入门", "gate.capture": "存为采集记录",
    "gate.idle": "等待输入", "gate.idleMeaning": "准入门不判断真假，只判断这段内容能以什么身份进入记忆。",
    "gate.running": "审查中",
    "route.accept": "可在声明范围内进入长期记忆。",
    "route.revise": "有价值，但措辞、边界或证据需要先修复。",
    "route.quarantine": "可以作为来源证据保留，但不能写入长期记忆。",
    "route.discard": "结构无效或自我证明；保留它会把置信度洗成证据。",
    "gate.checks": "四道检查", "gate.fixes": "什么能改变这个结果", "gate.admit": "以什么身份准入",
    "gate.admitHint": "每个缺口选一个处理方式。选择“去补证据”只是记录意图——证据没到之前，它不会被当作事实。",
    "gate.evidenceRefs": "新证据引用", "gate.reviewer": "复核人", "gate.reviewed": "已具名复核",
    "gate.build": "生成准入契约", "gate.moreGaps": "派生缺口（与上面重复表述）", "gate.contract": "准入契约",
    "gate.objectType": "准入身份", "gate.rights": "未来使用权",
    "right.fact": "可作为事实引用", "right.reason": "可参与推理", "right.action": "可触发行动",
    "gate.pending": "已降级准入 · 待升级", "gate.pendingWhy": "请求的身份是 {req}，缺少：",
    "gate.copyJson": "复制 JSON", "gate.copyMd": "复制 Markdown", "copied": "已复制",
    "check.source": "来源", "check.audit": "复核", "check.loop": "独立性", "check.scope": "范围",
    "captured": "已存为采集记录",
    "lib.title": "资料", "lib.search": "搜索文件、类型、负责人", "lib.material": "投入材料", "lib.new": "新建记录",
    "lib.queue": "待处理队列", "lib.promote": "提升为原始证据", "lib.all": "全部",
    "lib.file": "文件", "lib.type": "类型", "lib.owner": "负责人", "lib.updated": "更新",
    "lib.noMatch": "没有匹配的资料。",
    "lib.status": "状态", "lib.review": "复核日期", "lib.note": "备注", "lib.save": "保存", "lib.saved": "已保存",
    "lib.content": "内容", "lib.events": "流转记录", "lib.close": "关闭",
    "lib.materialText": "材料正文", "lib.files": "附件", "lib.store": "存储并进入队列",
    "lib.title2": "标题", "lib.sourceRef": "来源引用", "lib.create": "创建", "cancel": "取消",
    "sys.title": "系统", "sys.ready": "部署就绪", "sys.modes": "运行方式", "sys.execMode": "执行方式",
    "sys.persona": "分析人格", "sys.provider": "模型服务", "sys.commands": "维护命令", "sys.caps": "能力开关",
    "sys.log": "流转日志", "sys.noEvents": "还没有记录。", "sys.maint": "维护", "sys.diag": "下载诊断包",
    "sys.update": "检查更新", "sys.clean": "清理 dist", "sys.cleanConfirm": "删除 dist/ 下所有生成文件？",
    "sys.interface": "界面", "sys.motion": "动效", "motion.full": "完整", "motion.calm": "平静", "motion.off": "关闭",
    "sys.classic": "旧版界面（完整设置）", "sys.upToDate": "已是最新", "sys.newer": "有新版本",
    "palette.ph": "跳转或执行命令…", "cmd.run": "运行"
  },
  en: {
    "nav.gate": "Gate", "nav.library": "Library", "nav.system": "System",
    "gate.title": "How may this be remembered?",
    "gate.intro": "Paste an AI output, a note, or a memory candidate. The gate decides whether it may enter durable memory — and how it may be used afterwards.",
    "gate.placeholder": "Paste something…\n\nReferences can go on their own lines:\nsource: conversation:2026-09-20\nreview: review-ledger:2026-09-21",
    "gate.examples": "Try",
    "ex.overgen": "absolute preference", "ex.circular": "self-proving claim", "ex.bounded": "sourced decision",
    "gate.evidence": "Evidence & scope", "gate.evidenceHint": "Optional. You can also write source: / review: lines in the text.",
    "gate.sourceRefs": "Source refs", "gate.auditRefs": "Review refs", "gate.risk": "Risk", "gate.boundary": "Boundary",
    "gate.boundaryPh": "e.g. this repo only, until the next architecture review",
    "gate.refsHint": "One per line. Level is inferred from tokens (conversation, commit, docs/…) or declared with primary:: / traceable::.",
    "gate.run": "Run the gate", "gate.capture": "Store as capture",
    "gate.idle": "waiting", "gate.idleMeaning": "The gate does not judge truth. It decides what a piece of content may become in memory.",
    "gate.running": "auditing",
    "route.accept": "May enter durable memory within its stated scope.",
    "route.revise": "Useful, but wording, boundary, or evidence needs repair first.",
    "route.quarantine": "Keep as source evidence; not safe for durable memory.",
    "route.discard": "Structurally invalid or self-proving; keeping it launders confidence into evidence.",
    "gate.checks": "Four checks", "gate.fixes": "What would change this", "gate.admit": "Admit as",
    "gate.admitHint": "Pick one handling per gap. Choosing to find evidence records intent — it will not be treated as fact until the evidence arrives.",
    "gate.evidenceRefs": "New evidence refs", "gate.reviewer": "Reviewer", "gate.reviewed": "Named review done",
    "gate.build": "Build admission contract", "gate.moreGaps": "Derived gaps (restate the ones above)", "gate.contract": "Admission contract",
    "gate.objectType": "Admitted as", "gate.rights": "Future usage",
    "right.fact": "Cite as fact", "right.reason": "Feed reasoning", "right.action": "Trigger action",
    "gate.pending": "Admitted lower · pending upgrade", "gate.pendingWhy": "Requested {req}; missing:",
    "gate.copyJson": "Copy JSON", "gate.copyMd": "Copy Markdown", "copied": "Copied",
    "check.source": "Source", "check.audit": "Review", "check.loop": "Independence", "check.scope": "Scope",
    "captured": "Stored as capture",
    "lib.title": "Library", "lib.search": "Search files, types, owners", "lib.material": "Drop material", "lib.new": "New record",
    "lib.queue": "Intake queue", "lib.promote": "Promote to raw", "lib.all": "all",
    "lib.file": "File", "lib.type": "Type", "lib.owner": "Owner", "lib.updated": "Updated",
    "lib.noMatch": "Nothing matches.",
    "lib.status": "Status", "lib.review": "Review date", "lib.note": "Note", "lib.save": "Save", "lib.saved": "Saved",
    "lib.content": "Content", "lib.events": "History", "lib.close": "Close",
    "lib.materialText": "Material", "lib.files": "Files", "lib.store": "Store and queue",
    "lib.title2": "Title", "lib.sourceRef": "Source ref", "lib.create": "Create", "cancel": "Cancel",
    "sys.title": "System", "sys.ready": "Readiness", "sys.modes": "Operation", "sys.execMode": "Execution",
    "sys.persona": "Analysis persona", "sys.provider": "Model provider", "sys.commands": "Maintenance", "sys.caps": "Capabilities",
    "sys.log": "Lifecycle log", "sys.noEvents": "No events yet.", "sys.maint": "Upkeep", "sys.diag": "Download diagnostics",
    "sys.update": "Check for updates", "sys.clean": "Clean dist", "sys.cleanConfirm": "Delete all generated files under dist/?",
    "sys.interface": "Interface", "sys.motion": "Motion", "motion.full": "full", "motion.calm": "calm", "motion.off": "off",
    "sys.classic": "Classic GUI (all settings)", "sys.upToDate": "Up to date", "sys.newer": "Newer version",
    "palette.ph": "Jump or run a command…", "cmd.run": "run"
  }
};

let lang = localStorage.getItem(KEY) || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en");

/** True when the user has never picked a language (server preference may apply). */
export function langIsDefault() { return !localStorage.getItem(KEY); }

export function getLang() { return lang; }
export function setLang(next) {
  lang = next === "en" ? "en" : "zh";
  localStorage.setItem(KEY, lang);
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
}
export function t(key, vars = {}) {
  const s = dict[lang][key] ?? dict.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}
export function applyStatic(root = document) {
  for (const el of root.querySelectorAll("[data-t]")) el.textContent = t(el.dataset.t);
}
