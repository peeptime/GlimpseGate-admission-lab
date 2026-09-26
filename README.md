# GlimpseGate Admission Lab

**把 AI 输出先送过证据门，再决定它能以什么身份进入长期记忆。**

Formerly: `Mercury Method Lab` · `Mercury Admission Lab`
Repository: `peeptime/GlimpseGate-admission-lab`
Version: `2.5.0`
Latest release: [v2.2.0 SPEC-First + Shared Language](https://github.com/peeptime/GlimpseGate-admission-lab/releases/tag/v2.2.0)

**架构映射**：[HTML（人工阅读）](architecture.html) · [JSON（智能体使用）](architecture.json)
**核心文档**：[SPEC.md](SPEC.md) · [CONTEXT.md](CONTEXT.md)

```yaml
provenance:
  authors: project_owner + Codex
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

这些不是小字免责声明,而是后续版本必须正面解决的主线。

---

## 2.1.0 变更

本次更新新增 **F5 稳定性引擎** 并正式确立类型感知路由约束:

- **F5 稳定性引擎**(`verifyAuditStability` + `applyStabilityGate`):检测 routing 决策不一致、低忠实度+accept 组合、confidence 与 routing 结果矛盾。不稳定时自动降级:`accept → revise → quarantine`。`discard` 是终端状态,不降级。
- **类型感知路由**:9 种准入对象类型各有不同的证据要求和使用约束,记录于 `docs/TYPE-MECE-ANALYSIS.md`。
- **程序性知识处理**:`reference` 类型对象可携带 `provenance_type: procedural_knowledge` 并附带明确的使用范围约束。
- **SDK API**:`verifyAuditStability` 和 `applyStabilityGate` 已从主入口导出。
- **测试**:21 个 F1-F5 × routing 集成测试,全部通过。

## 2.0.2 路线图(已过期)

下一步优先级不是扩大审计范围,而是验证 choice-gated admission 是否真的让用户更清楚地管理知识状态:

1. **Admission Contract Review**:测试用户是否看得懂自己准入了什么对象,以及它能怎样被未来系统使用。
2. **Ground-Truth Track**:构建 30-100 条标注样本,开始统计 precision / recall。
3. **Cross-Model Audit**:分离生成模型和审计模型,记录分歧。
4. **Programmable Checks**:URL、数字、代码、格式或可执行事实优先用程序验证。
5. **Adversarial Injection Tests**:测试 route-forcing、对立证据和审计提示操纵。
6. **Multi-Agent Contamination Track**:把共享记忆污染作为主线风险,而不是脚注。
7. **Human Trust Anchor**:至少让一个关键文档或核心审计路径获得真人审核记录。

---

## 30 秒开始

```powershell
npm install
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
http://127.0.0.1:4788/lite.html
```

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
| 2.0.2 handoff | `docs/ITERATION-GUIDE-2.0.2.md` |
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
