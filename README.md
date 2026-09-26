# GlimpseGate Admission Lab

**把 AI 输出先送过证据门，再决定它能以什么身份进入长期记忆。**

Formerly: `Mercury Method Lab` · `Mercury Admission Lab`
Repository: `peeptime/GlimpseGate-admission-lab`
Version: `2.5.0`
Latest version: `2.5.0` Feedback Language · 版本记录：[RELEASES.md](RELEASES.md)（GitHub Releases 页面停在 v2.2.0）

**架构映射**：[HTML（人工阅读）](architecture.html) · [JSON（智能体使用）](architecture.json)
**核心文档**：[SPEC.md](SPEC.md) · [CONTEXT.md](CONTEXT.md)

```yaml
provenance:
  authors: project_owner + Codex (≤2.2.0) + Claude (2.3.0–2.5.0)
  ai_assisted: true
  human_reviewed: declined
  reviewer: project_owner_pending
  review_note: |
    This project is still an AI-assisted method lab. It does not claim
    third-party validation, production adoption, or human-reviewed authority.
  audit_ref: docs/ITERATION-GUIDE-LATEST.md
```

---

## 一句话

GlimpseGate Admission Lab 是一个面向 LLM 输出、Agent 记忆和知识迁移材料的 **choice-gated knowledge admission protocol**。

它不替用户判断世界真伪,而是把 claim 进入知识库之前的认知选择过程结构化。

```text
评分 = 这个内容看起来有多可信
准入 = 这个内容是否值得被记住
```

GlimpseGate 只把第二件事作为核心问题。

---

## GlimpseGate 产出什么

GlimpseGate does not produce truth verdicts. GlimpseGate produces structured admission choices.

2.0.2 新增 **Admission Contract**:当用户选择 A/B/C 后,系统记录用户到底让什么对象进入记忆,以及未来能怎样使用。

Admission Contract 会分开记录:

- `source_material`:原始来源,必须可回看。
- `model_framing`:GlimpseGate 对材料的 claim 提取、证据排列和 confidence framing。
- `user_judgment`:用户选择了哪个选项,以及 review state。
- `admitted_object`:最终允许进入知识库的对象。

`admitted_object` 可以是:

```text
fact
hypothesis
attribution
interpretation
open_question
preference
decision_record
temporary_note
reference
```

这样可以避免一个危险滑移:

```text
材料里提到 X
-> GlimpseGate 高密度组织了 X
-> 用户点了接受
-> 知识库把 X 当事实使用
```

在 2.0.2 中,用户可以明确选择:

```text
把 X 作为 hypothesis 保存
允许参与思考
禁止直接作为事实引用
禁止触发行动
未来引用前必须重新检查来源
```

---

## 当前能力

```text
AI 输出 / 用户材料
  -> 提取核心 claim
  -> 构建 source-linked evidence chain
  -> 标注来源、归属、置信依据和缺失证据
  -> 给出 missing-evidence A/B/C choices
  -> 为用户选择生成 Admission Contract
  -> 进入 memory-write gate
  -> accept / revise / quarantine / discard
  -> 保存为 case、audit report 或 portable skill handoff
```

主要入口:

- `buildEvidenceChain()`:生成 evidence chain 和 A/B/C choices。
- `buildAdmissionContract()`:记录用户选择后被准入的对象身份、证据条件和未来使用权。
- `auditMemoryWrite()`:在长期记忆写入前做路由判断。
- `fullAudit()`:运行 F1-F5 全链路审计(忠实度、轮次追踪、元级识别、溯源标注、稳定性),在路由决策前完成所有检查。使用 `check_stability: true` 开启 F5 稳定性门控。
- `test:fidelity`:运行 F1-F5 完整集成测试套件。
- `benchmark:v2`:测量 audit + evidence chain + admission contract 的本地结构化路径,不声称准确率。
- **本地界面**(`npm run dashboard`):准入 / 资料库 / 系统三个视图。所有审查都走 SDK;准入契约有完整界面;反馈按中文用户 / 英文开发者 / agent 三种读者分别标记语言。见 `docs/DASHBOARD.md`。

---

## 已知边界

GlimpseGate Admission Lab 目前不声称:

- 已被外部团队采用。
- 已通过真实生产场景验证。
- 已有第三方人工审核。
- 已实现跨模型认证。
- 已量化 precision / recall。
- 已解决多智能体共享记忆污染。
- 已提供对抗注入硬化。
- 已替代事实核查、RAG、AI scoring 或安全认证。
- **人的选择比自动分类更有用**——这是项目的核心主张,但还没检验过。2.6.0 蓝图专门回答它(`docs/BLUEPRINT-2.6.0.md`)。
- 在"类型化记忆 + 证据约束的事实身份"上领先:MemIR(2026)已经做到。剩下的差异点见 `docs/RELATED-WORK.md`。

这些不是小字免责声明,而是后续版本必须正面解决的主线。

---

## 近期版本(2.3 – 2.5)

| 版本 | 重点 |
|---|---|
| **2.5.0** Feedback Language | 反馈按读者分三种语言标记:`zh-CN` 中文用户(机制词)、`en` 开发者(SDK 原文)、`agent`(原文 + 稳定代码)。译文算转述不算来源:原文一键可见,没翻译的标 EN。SDK 所有反馈 100% 覆盖,有测试防遗漏。 |
| **2.4.1** Mechanic Words | 界面中文用"存档 / 仓库 / 关卡 / 解锁"这类机制词,不用梗;少状语,短句。选项在选之前就显示会给出哪些权限。规则见 `docs/COPY-STYLE.md`。 |
| **2.4.0** Gate GUI v3 | 界面重做。修复:界面原来绕过 SDK 自己跑一套正则;本地服务可被任意网页跨站调用(已加防护)。节点网络 + 分形路由图标 + 噪声场的动效设计。旧界面在 `/classic/`。 |
| **2.3.0** Admission Hardening | 修复准入契约的洗白路径:选了"去补证据"会直接被当成事实。现在证据不到,事实身份不解锁。main 上从 2.2.0 起一直红的 CI 恢复。分类体系审计与相关工作重新核验。 |

完整记录:`CHANGELOG.md`。

## 下一步:观察期

2.5.0 之后功能开发暂停。下一步做什么,由外部技术世界的变化和项目自己的证据决定,不按日历:

- **默认**:按项目负责人的节奏做 2.6.0 分歧账本(`docs/BLUEPRINT-2.6.0.md`)——检验人的选择到底有没有多拦住东西。
- **有条件**:2.7.0 的三个部分(修订状态 / agent 稳定代码 / MCP 工具清单)各有触发与取消条件(`docs/BLUEPRINT-2.7.0.md`)。
- **观察清单**与预期管理:`docs/OBSERVATION-MODE.md`。修 bug 和安全问题不受影响。

---

## 30 秒开始

```powershell
npm install
npm test
npm run demo:starter
npm run demo:openclaw
npm run cases:check
npm run test:evidence
npm run benchmark:v2
npm run skills:check
```

打开本地界面:

```powershell
npm run dashboard
```

访问:

```text
http://127.0.0.1:4788/            新界面(准入 / 资料库 / 系统)
http://127.0.0.1:4788/lite.html   单文件离线版
http://127.0.0.1:4788/classic/    旧界面(保留一个版本)
```

SDK 接入:`docs/SDK-QUICKSTART.md`(`npm install github:peeptime/GlimpseGate-admission-lab`,未发布到 npm)。

---

## Portable Skills

| Skill | 作用 |
|---|---|
| `mercury-evidence-chain` | 把混乱材料整理成 source-linked evidence chain,并给出 missing-evidence A/B/C choices |
| `mercury-memory-gate` | 判断候选记忆能否写入长期系统,输出四档路由 |
| `mercury-case-capture` | 把 AI 输出、审计结果和复核状态保存成可迁移 case folder |

同步到本机 skill 目录:

```powershell
npm run sync:skills
```

验证:

```powershell
npm run skills:check
```

---

## 关键文档

| 需要了解 | 文档 |
|---|---|
| 角色入口 | `docs/START-HERE.md` |
| 项目边界 | `docs/SCOPE.md` |
| 当前迭代 | `docs/ITERATION-GUIDE-LATEST.md` |
| SDK 接入 | `docs/SDK-QUICKSTART.md` |
| 本地界面 | `docs/DASHBOARD.md` |
| 界面用词 | `docs/COPY-STYLE.md` |
| 分类体系审计 | `docs/ADMISSION-TAXONOMY.md` |
| 下两个版本 | `docs/BLUEPRINT-2.6.0.md` · `docs/BLUEPRINT-2.7.0.md` |
| 观察期 | `docs/OBSERVATION-MODE.md` |
| SDK API | `docs/SDK-API.md` |
| 审计内核 | `docs/AUDIT-KERNEL.md` |
| Failure Modes | `docs/FAILURE-MODES.md` |
| Routing Theory | `docs/ROUTING-THEORY.md` |
| Related Work | `docs/RELATED-WORK.md` |
| OWASP AISVS C8 映射 | `docs/OWASP-AISVS-C8-MAPPING.md` |

---

## 本地验证

发布前运行:

```powershell
npm run release:gate
```

跨平台完整测试(CI 同款):

```powershell
npm test
```

更快的编辑验证:

```powershell
npm run validate:incr
npm run index:incr
npm run test:evidence
npm run benchmark:v2
```

`dist/` 是生成产物,不作为长期事实源。Markdown / YAML / JSON 才是可审计记录。

---

## 原则

```text
不把推测存成事实
不让 AI 自己审计自己并批准自己
不伪造 source_refs、audit_refs 或 human_reviewed:true
不把捕获材料直接当作记忆
不把 GlimpseGate 的 framing 偷偷当成原材料事实
不定义会被 Agent gaming 的成功指标
```

GlimpseGate 的价值不是产出更多内容,而是让用户的知识准入选择变得结构化、可追踪,并且能约束后续使用。
