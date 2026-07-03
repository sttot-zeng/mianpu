---
name: AutomationManager
description: 自动化管理 - 管理自动化规则、定时任务、监控
---

<SUBAGENT-STOP>
如果你被作为子 Agent 派遣来执行特定任务，请跳过本 Skill。本 Skill 由主 Agent 在管理自动化规则时使用。
</SUBAGENT-STOP>

# AutomationManager —— 自动化管理

## 适用场景

- 用户需要查看、启用、禁用或修改自动化规则
- 需要管理定时任务或监控
- 需要查看自动化执行日志

## 宏观骨架

**先打地基**：列出当前所有自动化规则及其状态
**再抠细节**：按用户需求调整具体规则

## 验收标准

1. **交付物**：根据用户需求的自动化规则变更
2. **覆盖操作**：
   - 查看自动化规则列表
   - 启用/禁用规则
   - 新增规则
   - 修改规则配置
   - 查看规则执行状态

3. **验证方式**：
   - 用户确认规则变更符合预期
   - 变更前后规则文件语法正确

## 红线禁令

- **禁止在未确认时修改规则**：所有变更必须用户确认
- **禁止禁用核心规则**：不要禁用 hooks 的关键门禁规则
- **禁止不记录变更**：规则变更必须记录到 CHANGELOG
- **禁止过度自动化**：不要为一次性的需求创建自动化规则

## 当前自动化规则概览

| 文件 | 说明 | 类型 |
|------|------|------|
| `.codex/hooks/stage-gate.hook.md` | 阶段门禁规则 | 门禁拦截 |
| `.codex/hooks/signal-capture.hook.md` | 信号捕获规则 | 信号捕获 |
| `.codex/hooks/state-sync.hook.md` | 状态同步规则 | 状态同步 |
| `.codex/auto-rules.md` | 自动化行为规则 | 流程自动化 |
| `.codex/subagents/evolution-runner.yaml` | Evolution Runner 配置 | 子 Agent |
| `.codex/subagents/code-reviewer.yaml` | 代码审查配置 | 子 Agent |
| `.codex/subagents/parallel-executor.yaml` | 并行执行配置 | 子 Agent |
| `.codex/subagents/spec-reviewer.yaml` | 规格审查配置 | 子 Agent |
