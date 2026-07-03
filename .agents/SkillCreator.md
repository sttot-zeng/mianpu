---
name: SkillCreator
description: 技能生成 - 按需创建新的 .agents/ Skill 文件，扩展框架能力
---

<SUBAGENT-STOP>
如果你被作为子 Agent 派遣来执行特定任务，请跳过本 Skill。本 Skill 由主 Agent 在需要扩展框架时使用。
</SUBAGENT-STOP>

# SkillCreator —— 技能生成

## 适用场景

- 用户需要框架目前没有覆盖的新能力
- 现有 Skill 无法满足特定场景需求
- 需要为特定项目创建定制 Skill

## 宏观骨架

**先打地基**：理解 Skill 的定位、适用场景、与现有 Skill 的关系
**再抠细节**：按照框架规范编写 Skill 内容

## 验收标准

1. **交付物**：新的 `.agents/<SkillName>.md` 文件
2. **覆盖要求**：
   - 适用场景（什么时候调用）
   - 验收标准（做到什么程度算合格）
   - 红线禁令（绝对不能做的事）
   - 好/坏标准（什么合格、什么必须打回）

3. **验证方式**：
   - 新 Skill 与其他 Skill 无冲突、无重叠
   - 新 Skill 符合"轻流程重目标"的框架原则
   - 可被 hooks 正确触发和门禁

## 红线禁令

- **禁止重复已有 Skill**：创建前检查 `.agents/` 目录，避免功能重叠
- **禁止包含详细执行步骤**：遵循 5.0 原则，只写目标、验收标准、红线
- **禁止与 hooks 职责混淆**：门禁规则应写入 hooks 而非 Skill 文本
- **禁止破坏框架一致性**：新 Skill 的风格和结构必须与现有 Skill 一致

## Skill 文件模板

```markdown
---
name: <SkillName>
description: <一句话描述 Skill 的用途>
---

<SUBAGENT-STOP>
如果你被作为子 Agent 派遣来执行特定任务，请跳过本 Skill。
</SUBAGENT-STOP>

# <SkillName> —— <中文名>

## 适用场景

[什么情况下调用这个 Skill]

## 宏观骨架

**先打地基**：[入门阶段的要点]
**再抠细节**：[深入阶段的要点]

## 验收标准

1. [第一条验收标准]
2. [第二条验收标准]
...

## 红线禁令

- [第一条禁令]
- [第二条禁令]
...
```

## 框架一致性检查清单
- [ ] YAML 元数据（name/description）格式正确
- [ ] 包含 SUBAGENT-STOP 段落
- [ ] 包含适用场景章节
- [ ] 包含验收标准章节（可量化）
- [ ] 包含红线禁令章节
- [ ] 不包含详细执行步骤
- [ ] 不包含应在 hooks 中的门禁逻辑
- [ ] 语言风格与现有 Skill 一致
