---
name: mercury-v8-iter
description: |
  Mercury V8 方法论迭代专用 Skill。
  触发词：跑v8、做审计、帮我看看这个项目、迭代建议、下一步、版本规划、
         评审一下、补充报告、生成指导文档、我要迭代、继续v8的迭代
  不触发：纯闲聊、写代码、让它帮我聊天、邮件
  本 Skill 负责：理解项目当前状态、生成迭代指导、处理审计报告、
                 维护MEMORY.md、评审文档一致性、生成commit信息。
---

# Mercury V8 迭代 Skill

## 工作目录

```
Z:\AI 202604\trae01\v8-mercury-backend
```

## 核心能力

### 1. 迭代指导生成

当用户说"帮我看看这个项目"或"下一步是什么"时：
1. 先读取 `MEMORY.md` 和 `docs/ITERATION-GUIDE-LATEST.md`。
2. 只读取用户请求直接涉及的文件。
3. 需要详细历史时，优先读取 `.skills/mercury-v8-iter/references/audit-reports-index.md`。
4. 只有当验收标准或历史依据存在争议时，才按章节读取 `docs/ARCHIVED/ITERATION-GUIDE-0.9.md`、`CHANGELOG.md` 或 `docs/METHODOLOGY-INTEGRITY.md`。

### 2. 审计报告处理

当用户提供新的审计报告或外部评估时：
1. 与已有审计报告对比（新发现 vs 重复）
2. 先更新 `.skills/mercury-v8-iter/references/audit-reports-index.md` 摘要
3. 必要时更新 `docs/ITERATION-GUIDE-LATEST.md`
4. 在 `MEMORY.md` 中记录关键发现
5. 生成 changelog 条目草稿

### 3. 文档一致性检查

按 AUDIT-CONTRACT 标准检查：
- 所有文档是否有 provenance 段
- CHANGELOG 条目是否带 `[AI_GENERATED]` / `[HUMAN_ONLY]` 声明
- 新增文档是否经过审计流程

### 4. Git 操作辅助

生成 commit 信息时遵循格式：
```
[类型]: 简短描述

[详细变更]

[参考]
docs/ITERATION-GUIDE-LATEST.md（若有）
```

类型：`feat` / `fix` / `docs` / `chore` / `refactor`

## 关键文件索引

| 文件 | 用途 |
|------|------|
| `MEMORY.md` | 低成本跨会话交接，先读 |
| `docs/ITERATION-GUIDE-LATEST.md` | 当前迭代方向，先读 |
| `CHANGELOG.md` | 版本历史 + provenance 声明 |
| `docs/METHODOLOGY-INTEGRITY.md` | AI协作悖论处理规范 |
| `docs/AUDIT-CONTRACT.md` | 审计契约（5条不可妥协规则） |
| `docs/MINIMAL-WORKFLOW.md` | 4层最小工作流 |
| `docs/AGENT-CONTEXT-BUDGET.md` | agent token/context 降耗规则 |

## 禁止行为

- 不自动 commit 所有文件（必须先列出变更让用户确认）
- 不删除任何 artifact 文件
- 不修改 `config/` 目录下的权限相关文件
- 不在未读 `MEMORY.md` 和 `docs/ITERATION-GUIDE-LATEST.md` 的情况下生成新的迭代建议
- 不把长文档全文读取作为默认第一步

## 工具权限

```
allowed_tools: [Read, Grep, Write, Edit, Bash]
```

## 触发评估测试集

```
should_trigger:
  - "帮我看看这个项目现在什么状态"
  - "跑v8，帮我分析一下这个仓库"
  - "下一步迭代做什么"
  - "帮我评审一下这份报告"
  - "我要开始v0.10的迭代了"
  - "补充一个审计报告到项目里"
  - "生成一份迭代指导文档"
  - "这个IC Memo怎么说"
  - "更新一下MEMORY"

should_not_trigger:
  - "帮我写一段Python代码"
  - "查一下今天的天气"
  - "给我发封邮件"
  - "分析一下比特币走势"
```

## 与其他 Skill 的关系

- `mercury-lab`：通用V8分析入口，本 Skill 是其迭代专用版本
- `redteam-auditor`：审计执行，本 Skill 负责迭代规划和进度追踪
- `fact-cleaner`：文档清洗，本 Skill 在必要时调用
