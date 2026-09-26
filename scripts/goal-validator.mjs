/**
 * goal-validator.mjs
 * ──────────────────
 * `/goal` 照妖镜 — Agent 内嵌版
 *
 * 定位：可内嵌的纯函数，不新建进程
 *
 * Agent 模式下的正确用法：
 *   在 Agent 上下文中直接调用 validate(text) 函数，
 *   不触发额外的进程启动或文件系统扫描。
 *
 * CLI 模式（仅人工调试用）：
 *   node scripts/goal-validator.mjs "<目标文本>"
 *   node scripts/goal-validator.mjs --interactive
 *
 * 设计原则（与 v0.6.0 agent_context_policy 一致）：
 *   - 验证逻辑零文件依赖
 *   - 不扫描项目目录
 *   - 验证结果内嵌返回，不写盘
 *   - 写盘操作（action_plan 创建）只在验证通过后由调用方决定
 *
 * 用法示例（Agent prompt 内嵌）：
 *   const result = validate("用户的目标描述");
 *   if (!result.ok) { return formatFixQuestions(result); }
 *   // 继续分析，不额外读文件
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ACTION_PLANS_DIR = join(root, "06_action_plans");
const TEMPLATE_PATH = join(root, "09_templates/action_plan_template.md");

// ─────────────────────────────────────────────────────────
// 核心验证函数（纯函数，可直接内嵌到 Agent prompt）
// ─────────────────────────────────────────────────────────

/**
 * 5 维度目标验证（零文件依赖）
 *
 * @param {string} text - 用户的目标描述
 * @returns {ValidationResult}
 */
export function validate(text) {
  if (!text || typeof text !== "string") {
    return {
      ok: false,
      goal: text || "",
      dimensions: [],
      fix_questions: ["目标不能为空。请描述你想要交付的具体结果。"],
      reformulated_goal: "",
      four_gates: [],
      created_path: ""
    };
  }

  const goal = text.trim();
  const intent = inferIntent(goal);
  const dimensions = runDimensions(goal, { intent });
  const failed = dimensions.filter((d) => !d.passed);

  // 四关检验（只在全部5维度通过后运行）
  const fourGates = failed.length === 0 ? runFourGates(goal) : [];

  return {
    ok: failed.length === 0,
    goal,
    intent,
    dimensions,
    fix_questions: failed.length > 0 ? buildFixQuestions(failed, goal) : [],
    reformulated_goal: failed.length === 0
      ? "已验证目标：" + trunc(goal.split("\n")[0], 60)
      : "",
    four_gates: fourGates,
    created_path: ""
  };
}

// ─────────────────────────────────────────────────────────
// 维度一：可交付物
// ─────────────────────────────────────────────────────────

function checkDeliverable(text) {
  const wishWords = [
    "更智能", "更好", "优化一下", "改进一下", "完善一下",
    "做好", "搞一搞", "弄一弄", "看看", "了解一下",
    "感觉", "觉得", "好像", "大概", "差不多",
    "做个", "搞个", "智能化", "自动化"
  ];

  const concreteSignals = [
    "新增", "创建", "编写", "实现", "生成", "输出",
    "替换", "删除", "修改", "重写", "导出",
    "集成", "接入", "调用", "返回", "显示",
    "API", "CLI", "命令", "按钮", "页面", "字段",
    "目录", "文件", "报告", "摘要", "列表",
    "artifact", "schema", "验证", "测试"
  ];

  const hasWish = wishWords.some((w) => text.includes(w));
  const hasConcrete = concreteSignals.some((s) => text.toLowerCase().includes(s.toLowerCase()));
  const passed = !(hasWish && !hasConcrete);

  return {
    dimension: "deliverable",
    label: "可交付物",
    passed,
    failures: passed ? [] : [
      "描述更像是愿望而非可交付物。" + NL +
      "请把\"想变好\"翻译成\"做出什么\"——具体文件、功能或结果。"
    ],
    hint: "包含具体可交付对象（文件/功能/报告/API/命令等）"
  };
}

// ─────────────────────────────────────────────────────────
// 维度二：可验证性
// ─────────────────────────────────────────────────────────

function checkVerifiable(text) {
  const signals = [
    "验收", "检查", "验证", "通过", "能运行", "能执行",
    "输出", "返回", "显示", "写入", "生成",
    "标准", "条件", "无报错", "通过 schema",
    "能查到", "能调用", "能查询",
    "npm run", "node ", "curl ", "http://"
  ];

  const passed = signals.some((s) => text.toLowerCase().includes(s.toLowerCase()));

  return {
    dimension: "verifiable",
    label: "可验证性",
    passed,
    failures: passed ? [] : [
      "缺少成功标准或验收条件。" + NL +
      "请添加：能运行什么命令、输出什么结果、通过什么检查。"
    ],
    hint: "包含验收标准或成功检查方式"
  };
}

// ─────────────────────────────────────────────────────────
// 维度三：时间边界
// ─────────────────────────────────────────────────────────

function checkTimebound(text, options = {}) {
  const timeSignals = [
    "截止", "deadline", "前",
    "本周", "今天", "明天", "下周一", "月底",
    "天内", "周内", "日内",
    "2026", "2025",
    "1天", "2天", "3天", "一周", "两周"
  ];

  const vagueTime = ["尽快", "有空", "之后再说", "看情况", "差不多", "先这样"];

  const hasTime = hasExplicitTimeExpression(text);
  const hasVague = vagueTime.some((v) => text.includes(v));
  const passed = options.intent === "archived" ? true : hasTime && !hasVague;

  return {
    dimension: "timebound",
    label: "时间边界",
    passed,
    failures: passed ? [] : [
      "没有明确截止时间。" + NL +
      "请给出具体日期或时间范围（如：本周五、下周一、3天内）。"
    ],
    hint: options.intent === "archived"
      ? "无明确时间表达，按 archived 冷存储处理，不触发提醒"
      : "包含明确截止日期或时间范围"
  };
}

// ─────────────────────────────────────────────────────────
// 维度四：范围边界
// ─────────────────────────────────────────────────────────

function checkScopebound(text) {
  const scopeSignals = [
    "包括", "包含", "限于", "只做", "不涉及",
    "只", "仅", "范围", "边界",
    "以下", "这部分", "这块",
    "而", "而非", "不是"
  ];

  const unboundedSignals = [
    "整个系统", "所有流程", "全部", "全面",
    "一整套", "重构"  // 没有具体范围的
  ];

  const hasScope = scopeSignals.some((s) => text.toLowerCase().includes(s.toLowerCase()));
  const hasUnbounded = unboundedSignals.some((s) => text.toLowerCase().includes(s.toLowerCase()));
  const hasFileName = /[A-Z][a-z]+\.(md|json|yaml|js|mjs|ts|py|sh|ps1|html|css)/.test(text);
  const passed = hasScope || hasFileName || !hasUnbounded;

  return {
    dimension: "scopebound",
    label: "范围边界",
    passed,
    failures: passed ? [] : [
      "没有明确范围边界。" + NL +
      "请说明（1）做哪部分？（2）不包括哪些？" + NL +
      "避免\"整个系统\"、\"所有流程\"这类无边界描述。"
    ],
    hint: "明确做了什么、不做什么"
  };
}

// ─────────────────────────────────────────────────────────
// 维度五：责任归属
// ─────────────────────────────────────────────────────────

function checkOwnable(text) {
  const signals = [
    "负责", "Owner", "owner",
    "我来", "你来", "他做", "交给",
    "开发者", "工程师", "我", "我们",
    "张三", "李四",
    "前端", "后端", "运维", "产品", "设计",
    "AI", "Agent", "Mercury", "OpenClaw"
  ];

  const passed = signals.some((s) => text.toLowerCase().includes(s.toLowerCase()));

  return {
    dimension: "ownable",
    label: "责任归属",
    passed,
    failures: passed ? [] : [
      "没有说明谁来判断目标是否达成。" + NL +
      "请添加责任人或负责角色（如：负责人是开发者）。"
    ],
    hint: "包含责任人或验收方"
  };
}

// ─────────────────────────────────────────────────────────
// 四关检验（5维度全部通过后运行）
// ─────────────────────────────────────────────────────────

function runFourGates(text) {
  return [
    {
      gate: "case",
      label: "案例关",
      question: "它能解释哪个真实案例？",
      passed: /\b案例|例子|场景|实际|用户|客户|项目|产品\b/.test(text),
      hint: "在目标描述中提及一个具体的使用场景或真实对象"
    },
    {
      gate: "template",
      label: "模板关",
      question: "它能变成什么表格或流程？",
      passed: /\b模板|表格|流程|表单|检查清单|checklist|步骤|清单\b/.test(text),
      hint: "说明它最终会形成什么可填写的结构化文档"
    },
    {
      gate: "decision",
      label: "决策关",
      question: "它能帮助谁做什么选择？",
      passed: /\b决策|选择|判断|判断标准|决定|采纳|拒绝|优先级\b/.test(text),
      hint: "说明执行后谁会因此做出什么具体决策"
    },
    {
      gate: "feedback",
      label: "反馈关",
      question: "谁用了以后有结果？",
      passed: /\b反馈|结果|验收|确认|报告|上线|发布|使用\b/.test(text),
      hint: "说明完成后谁会验证结果并给出反馈"
    }
  ];
}

// ─────────────────────────────────────────────────────────
// 结果构建
// ─────────────────────────────────────────────────────────

const NL = "\n       ";

function runDimensions(text, options = {}) {
  return [
    checkDeliverable(text),
    checkVerifiable(text),
    checkTimebound(text, options),
    checkScopebound(text),
    checkOwnable(text)
  ];
}

function buildFixQuestions(failedDimensions, goal) {
  return failedDimensions.map((dim) => {
    switch (dim.dimension) {
      case "deliverable":
        return (
          "① 可交付物：\"" + trunc(goal, 40) + "\" 更像一个愿望。" + NL +
          "请翻译成具体的交付物。例如：" + NL +
          "  ✓ \"新增一个 CLI 命令 mercury-cli analyze\"" + NL +
          "  ✓ \"在 06_action_plans/ 目录生成一个 action_plan artifact\"" + NL +
          "  ✓ \"导出符合 schema 的 JSON 格式报告\"" + NL +
          "  而不是：\"让它更智能\""
        );
      case "verifiable":
        return (
          "② 可验证性：没有说清楚怎样才算成功了。" + NL +
          "请添加验收标准，例如：" + NL +
          "  ✓ 能运行 \"node scripts/xxx.mjs\" 并输出结构化结果" + NL +
          "  ✓ 生成的 artifact 通过 schema 验证（npm run validate）" + NL +
          "  ✓ dashboard 界面能看到新的状态变化"
        );
      case "timebound":
        return (
          "③ 时间边界：没有截止日期。" + NL +
          "请给出具体时间（如：本周五、下周一、3天内）。" + NL +
          "避免：\"尽快\"、\"有空的话\"、\"看情况\""
        );
      case "scopebound":
        return (
          "④ 范围边界：没有说清楚做到哪里算完。" + NL +
          "请明确：（1）做的是哪部分？（2）不包括哪些？" + NL +
          "例如：\"只做 CLI 部分，不涉及 dashboard UI\""
        );
      case "ownable":
        return (
          "⑤ 责任归属：没有说明谁来判断成功。" + NL +
          "请添加类似：" + NL +
          "  ✓ \"由开发者验收\"" + NL +
          "  ✓ \"写入 07_audit_reports 后由审计员确认\""
        );
      default:
        return dim.failures[0] || "";
    }
  });
}

// ─────────────────────────────────────────────────────────
// 验收条件提取（纯函数）
// ─────────────────────────────────────────────────────────

function extractAcceptanceCriteria(goal) {
  const lines = goal.split("\n");
  const multiLine = lines.length > 1;

  if (multiLine) {
    const signals = [
      "✓", "✅", "·", "- [ ]", "1.", "2.", "3.", "4.", "5.",
      "能运行", "能执行", "能调用", "能查询",
      "输出", "生成", "返回", "写入",
      "通过", "无报错", "已集成", "已实现", "可运行",
      "npm run", "node ", "http://", "curl ",
      "schema", "验证", "可见", "显示"
    ];

    const criteriaLines = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (signals.some((s) => trimmed.includes(s)) && trimmed.length > 4) {
        const cleaned = trimmed
          .replace(/^[·\-✓✅123456. ]+/, "")
          .replace(/^\[[ xX]\]\s*/, "");
        if (cleaned.length > 3) {
          criteriaLines.push("- [ ] " + cleaned);
        }
      }
    }

    if (criteriaLines.length > 0) return criteriaLines.join("\n");
  }

  // 单行：提取"验收："后的内容
  const patterns = [
    /验收[：:]\s*([^\n]+)/,
    /验收标准[：:]\s*([^\n]+)/,
    /标准[：:]\s*([^\n]+)/
  ];

  for (const pattern of patterns) {
    const match = goal.match(pattern);
    if (match) {
      const parts = match[1]
        .split(/[、，；;]/)
        .map((p) => p.trim())
        .filter((p) => p.length > 2 && p.length < 100);
      if (parts.length > 0) return parts.map((p) => "- [ ] " + p).join("\n");
    }
  }

  // 单行无"验收："：拆分顿号/逗号子句
  if (/[、，]/.test(goal)) {
    const parts = goal
      .replace(/[,，、；;]/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 3 && l.length < 100 && !/^[0-9]+[.．]/.test(l));
    if (parts.length > 0) return parts.map((p) => "- [ ] " + p).join("\n");
  }

  return [
    "- [ ] 交付物已完成并可运行",
    "- [ ] 通过 schema 验证（npm run validate）",
    "- [ ] 在 dashboard 中可见"
  ].join("\n");
}

// ─────────────────────────────────────────────────────────
// Action Plan 生成（仅在验证通过后由调用方触发）
// ─────────────────────────────────────────────────────────

/**
 * 创建 action_plan artifact（需要文件写权限）
 * 在 Agent 模式下：Agent 确认验证通过后自行写盘
 */
export async function createActionPlan(result) {
  if (!result.ok) {
    throw new Error("验证未通过，无法创建 action_plan。");
  }

  const now = new Date();
  const slug = makeSlug(result.goal);
  const fileName = now.toISOString().slice(0, 10) + "-goal-" + slug + ".md";
  const filePath = join(ACTION_PLANS_DIR, fileName);

  let template;
  try {
    template = await readFile(TEMPLATE_PATH, "utf8");
  } catch {
    template = getDefaultTemplate(now);
  }

  const content = fillTemplate(template, result, now);
  await mkdir(ACTION_PLANS_DIR, { recursive: true });
  await writeFile(filePath, content, "utf8");

  return filePath;
}

function fillTemplate(template, result, date) {
  const goal = result.goal;
  const title = goal.split("\n")[0].slice(0, 80);
  const criteria = extractAcceptanceCriteria(goal);
  const deadline = extractDeadline(goal, date);
  const intent = result.intent || inferIntent(goal);
  const reminder = getReminderIntensity(intent);
  const feedbackExpectedFrom = getFeedbackExpectedFrom(intent);

  const meta = [
    "- schema_version: \"0.2\"",
    "- type: action_plan",
    "- status: draft",
    "- owner_role: operator",
    "- created_at: " + formatDate(date),
    "- review_at: " + (deadline || ""),
    "- verified_at: " + formatDateTime(date),
    "- intent: " + intent + "           # archived | immediate | watchful",
    "- reminder_intensity: " + reminder + "  # none | light | strict（仅 intent=immediate 时有效）",
    "- feedback_expected_from: " + feedbackExpectedFrom,
    ""
  ].join("\n");

  const verificationBlock = [
    "",
    "---",
    "**验证状态：通过** | 验证时间：" + formatDateTime(date),
    ""
  ].join("\n");

  const goalBody = goal + verificationBlock;
  const acceptanceBody = criteria + "\n";

  // 四关检验结果
  const fourGatesSection = result.four_gates && result.four_gates.length > 0
    ? [
        "## 四关检验",
        "",
        ...result.four_gates.map((g) => {
          const icon = g.passed ? "✅" : "❌";
          return icon + " **" + g.label + "（" + g.question + "）**" +
            (g.passed ? "" : " → " + g.hint);
        }),
        ""
      ].join("\n")
    : "";

  // Judgment Closure（结论优先，开口存在但不主动推）
  const closureSection = [
    "## Judgment Closure",
    "",
    "- **结论摘要**：" + trunc(goal.split("\n")[0], 60) + "（直接给出，不做延伸推荐）",
    "- **弱推荐**：（如有）很弱的建议，不转移焦点",
    "- **继续入口**：如果想继续讨论，这里是方向（存在，不主动推）",
    ""
  ].join("\n");

  let out = "# Goal Action Plan: " + title + "\n\n" +
    template
      .replace("# Action Plan Template", "")
      .replace(
        /## Artifact Metadata\n\n[\s\S]*?(?=\n## Goal)/,
        "## Artifact Metadata\n\n" + meta + "\n"
      )
      .replace("## Goal\n\n", "## Goal\n\n" + goalBody + "\n")
      .replace(
        "## Acceptance Criteria\n\n",
        "## Acceptance Criteria\n\n" + acceptanceBody + "\n"
      );

  out = stripSection(out, "四关检验");
  out = stripSection(out, "Judgment Closure");
  out = stripSection(out, "Next Review");

  const tailSections = [
    fourGatesSection,
    closureSection,
    buildNextReviewSection({
      deadline,
      feedbackExpectedFrom,
      intent,
      reminder
    })
  ].filter(Boolean);

  return out.trimEnd() + "\n\n" + tailSections.join("\n").trimEnd() + "\n";
}

function inferIntent(goal) {
  return hasExplicitTimeExpression(goal) ? "immediate" : "archived";
}

function getReminderIntensity(intent) {
  if (intent === "immediate") return "strict";
  if (intent === "watchful") return "light";
  return "none";
}

function getFeedbackExpectedFrom(intent) {
  if (intent === "immediate") return "operator";
  if (intent === "watchful") return "observer";
  return "none";
}

function buildNextReviewSection({ deadline, feedbackExpectedFrom, intent, reminder }) {
  const notes = {
    archived: "intent=archived：本 artifact 为洞察存档，无需执行跟进。",
    immediate: "intent=immediate：本 artifact 需要执行闭环，按 review_at 严格跟进。",
    watchful: "intent=watchful：本 artifact 先存档观望，仅保留轻提醒。"
  };

  return [
    "## Next Review",
    "",
    "- review_at: " + (deadline || ""),
    "- intent: " + intent,
    "- reminder_intensity: " + reminder,
    "- feedback_expected_from: " + feedbackExpectedFrom,
    "",
    "> " + notes[intent],
    ""
  ].join("\n");
}

function hasExplicitTimeExpression(goal) {
  const normalized = goal.replace(/\s+/g, "");
  const patterns = [
    /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?/,
    /\d{1,2}月\d{1,2}日/,
    /\d{1,2}:\d{2}/,
    /(今天|今日|今晚|明天|明日|明晚|后天|本周|下周|周内|本月|月底|本月底)/,
    /(本|下)?周[一二三四五六日天]/,
    /\d+\s*(分钟|小时|天|日|周)内/,
    /(截止|最晚|不晚于|到).{0,12}(今天|今日|明天|明日|后天|本周|下周|月底|\d{1,2}月\d{1,2}日|\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/
  ];
  return patterns.some((pattern) => pattern.test(normalized));
}

function extractDeadline(goal, baseDate = new Date()) {
  const normalized = goal.replace(/\s+/g, "");
  const absoluteDate = normalized.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?/);
  if (absoluteDate) {
    return formatDateParts(absoluteDate[1], absoluteDate[2], absoluteDate[3]);
  }

  const monthDay = normalized.match(/(\d{1,2})月(\d{1,2})日/);
  if (monthDay) {
    return formatDateParts(baseDate.getFullYear(), monthDay[1], monthDay[2]);
  }

  const relativeDays = [
    ["今天", 0], ["今日", 0], ["今晚", 0],
    ["明天", 1], ["明日", 1], ["明晚", 1],
    ["后天", 2],
    ["本周", daysUntilWeekday(baseDate, 5)],
    ["周内", daysUntilWeekday(baseDate, 5)],
    ["下周", daysUntilWeekday(baseDate, 8)],
    ["月底", daysUntilMonthEnd(baseDate)],
    ["本月底", daysUntilMonthEnd(baseDate)]
  ];
  for (const [label, days] of relativeDays) {
    if (normalized.includes(label)) return addDays(baseDate, days);
  }

  const weekdayMatch = normalized.match(/(本|下)?周([一二三四五六日天])/);
  if (weekdayMatch) {
    const target = "一二三四五六日天".indexOf(weekdayMatch[2]) + 1;
    const offset = daysUntilWeekday(baseDate, target + (weekdayMatch[1] === "下" ? 7 : 0));
    return addDays(baseDate, offset);
  }

  const dayWindow = normalized.match(/(\d+)(天|日)内/);
  if (dayWindow) return addDays(baseDate, Number(dayWindow[1]));

  const weekWindow = normalized.match(/(\d+)周内/);
  if (weekWindow) return addDays(baseDate, Number(weekWindow[1]) * 7);

  return "";
}

function getDefaultTemplate(date) {
  const lines = [
    "# Goal Action Plan",
    "",
    "## Artifact Metadata",
    "",
    "- schema_version: \"0.2\"",
    "- type: action_plan",
    "- status: draft",
    "- owner_role: operator",
    "- created_at: " + formatDate(date),
    "- review_at: ",
    "- verified_at: ",
    "- intent: archived           # archived | immediate | watchful",
    "- reminder_intensity: none   # none | light | strict",
    "- feedback_expected_from: none",
    "",
    "## Goal",
    "",
    "## Acceptance Criteria",
    "",
    "- [ ] 交付物已完成并可运行",
    "- [ ] 通过 schema 验证",
    "- [ ] 在 dashboard 中可见",
    "",
    "## Judgment Closure",
    "",
    "- **停止条件**：",
    "- **推翻条件**：",
    "- **复盘时间**：",
    "- **记忆等级**：M0-M4",
    "",
    "## Next Review",
    ""
  ];
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────

function stripSection(markdown, heading) {
  const pattern = new RegExp("\\n?## " + escapeRegExp(heading) + "\\n[\\s\\S]*?(?=\\n## |$)", "g");
  return markdown.replace(pattern, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDateParts(year, month, day) {
  const yyyy = String(year).padStart(4, "0");
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function daysUntilWeekday(date, targetDay) {
  const current = date.getDay() || 7;
  const normalizedTarget = ((targetDay - 1) % 7) + 1;
  const weekOffset = targetDay > 7 ? 7 : 0;
  const diff = normalizedTarget - current;
  return diff >= 0 ? diff + weekOffset : diff + 7 + weekOffset;
}

function daysUntilMonthEnd(date) {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return Math.max(0, Math.ceil((end - date) / 86400000));
}

function trunc(str, len) {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

function makeSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

// ─────────────────────────────────────────────────────────
// CLI 入口（仅人工调试用，不建议在 Agent 循环中调用）
// ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--interactive") || args.includes("-i")) {
    await interactiveMode();
    return;
  }

  if (args.length === 0) {
    printHelp();
    return;
  }

  await runAndReport(args.join(" "));
}

async function runAndReport(text) {
  console.log("\n─── `/goal` 照妖镜验证 ────────────────────────────\n");
  console.log("目标输入：" + text.slice(0, 80) + (text.length > 80 ? "..." : "") + "\n");

  const result = validate(text);

  console.log("【5 维度检查】\n");
  for (const dim of result.dimensions) {
    const icon = dim.passed ? "✅" : "❌";
    console.log("  " + icon + " " + dim.label + "（" + dim.dimension + "）");
    if (dim.failures.length > 0) {
      for (const f of dim.failures) {
        console.log("     " + f.replace(/\n/g, "\n     "));
      }
    } else {
      console.log("     → " + dim.hint);
    }
  }

  if (result.four_gates.length > 0) {
    console.log("\n【四关检验】\n");
    for (const gate of result.four_gates) {
      const icon = gate.passed ? "✅" : "❌";
      console.log("  " + icon + " " + gate.label + "：" + gate.question);
      if (!gate.passed) console.log("     → " + gate.hint);
    }
  }

  console.log("");

  if (result.ok) {
    console.log("🎯 验证通过！正在生成 action_plan artifact...\n");
    try {
      const filePath = await createActionPlan(result);
      console.log("✅ 已创建：" + filePath + "\n");
      console.log("📌 建议下一步：");
      console.log("   npm run dashboard   → 在 UI 中推进状态机");
      console.log("   npm run validate   → 验证新 artifact 的 schema 合规性");
    } catch (err) {
      console.error("⚠️ 创建 action_plan 失败：" + err.message);
    }
  } else {
    console.log("❗ 验证未通过。请根据以下问题重新描述目标：\n");
    for (const q of result.fix_questions) {
      console.log(q + "\n");
    }
    console.log("提示：修正后再次运行即可。");
    process.exitCode = 1;
  }
}

async function interactiveMode() {
  const readline = await import("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n🎯 `/goal` 交互式目标验证器（照妖镜）\n");
  console.log("请描述你的目标（输入空行结束）：\n");

  const lines = [];
  for await (const line of rl) {
    if (line.trim() === "") break;
    lines.push(line);
  }
  rl.close();

  const text = lines.join("\n");
  if (!text.trim()) {
    console.log("未输入目标，退出。");
    return;
  }

  await runAndReport(text);
}

function printHelp() {
  const lines = [
    "",
    "goal-validator.mjs — `/goal` 照妖镜（Agent 内嵌版）",
    "",
    "用法（CLI，仅人工调试）：",
    "  node scripts/goal-validator.mjs \"<目标文本>\"",
    "  node scripts/goal-validator.mjs --interactive",
    "",
    "Agent 模式（直接内嵌 validate 函数）：",
    "  import { validate } from \"./scripts/goal-validator.mjs\";",
    "  const result = validate(userGoalText);",
    "  if (!result.ok) { return result.fix_questions; }",
    "",
    "5 维度 + 四关检验：",
    "  ① 可交付物  — 有没有具体交付对象（文件/功能/报告）",
    "  ② 可验证性  — 有没有成功标准/验收条件",
    "  ③ 时间边界  — 有没有明确截止日期",
    "  ④ 范围边界  — 有没有说明做到哪里算完",
    "  ⑤ 责任归属  — 有没有说明谁来判断成功",
    "  ⑥ 案例关    — 能解释哪个真实案例？",
    "  ⑦ 模板关    — 能变成什么表格或流程？",
    "  ⑧ 决策关    — 能帮助谁做什么选择？",
    "  ⑨ 反馈关    — 谁用了以后有结果？",
    ""
  ];
  console.log(lines.join("\n"));
}

// Run the CLI only when executed directly. Before 2.4.0 main() ran on import,
// so importing validate() from the dashboard printed help text and any CLI
// error would call process.exit(1) inside the dashboard server process.
const invokedDirectly = process.argv[1]
  && (await import("node:url")).fileURLToPath(import.meta.url) === (await import("node:path")).resolve(process.argv[1]);
if (invokedDirectly) {
  main().catch((err) => {
    console.error("Fatal:", err.message);
    process.exit(1);
  });
}
