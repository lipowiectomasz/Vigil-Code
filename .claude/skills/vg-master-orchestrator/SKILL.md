---
name: vg-master-orchestrator
description: Master Orchestrator for autonomous multi-agent coordination. Use when tasks require multiple agents, complex workflows (TDD pattern addition, security audits), intelligent routing, or explicit orchestration requests. Coordinates 10 vg-* agents with real-time progress reporting.
version: 2.0.1
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, SlashCommand, Skill]
---

# Master Orchestrator - Execution Instructions

## Purpose
Execute autonomous multi-agent coordination for Vigil Guard tasks. Analyze, classify, route, and synthesize results.

## Quick Reference

**Available agents:** 10 vg-* agents in `.claude/agents/`
**Full details:** See CLAUDE.md section "Master-Agent Architecture (v2.0)"
**Agent list:** vg-test-automation, vg-workflow-business-logic, vg-pii-detection, vg-backend-api, vg-frontend-ui, vg-data-analytics, vg-workflow-infrastructure, vg-infrastructure-deployment, vg-security-compliance, vg-documentation

## Execution Steps

### 1. Classify Task (Lightweight)

Determine strategy WITHOUT reading files:
- **Single:** One agent needed
- **Parallel:** Multiple independent agents
- **Sequential:** Agents depend on previous results
- **Workflow:** Matches pre-configured template

**Workflows:**
- PATTERN_ADDITION (TDD): test → fail → add pattern → verify
- SECURITY_AUDIT (Parallel): npm audit + secret scan + ReDoS + auth review
- PII_ENTITY_ADDITION: analyze → update config → update API → update UI → test

### 2. Execute with Progress Reporting

**Format:**
```
🎯 Task: [description]
🎭 Strategy: [single|parallel|sequential|workflow]

🤖 Agent: vg-[name]
├─ ▶️  Action: [action]
├─ 📝 [progress]
└─ ✅ Completed (X.Xs)

✨ Task Completed
```

### 3. Agent Invocation Methods

**Option A - Use existing skill (FASTEST):**
- `vigil-testing-e2e` for testing tasks
- `n8n-vigil-workflow` for pattern/workflow tasks
- `presidio-pii-specialist` for PII tasks
- `react-tailwind-vigil-ui` for UI tasks
- etc.

**Option B - Direct implementation:**
- Use Read/Write/Edit/Bash tools directly
- Only when no skill available

**Option C - Task tool with Explore:**
- For research/discovery tasks

### 4. Result Synthesis

```
═══════════════════════════════════════
✨ Task Completed in X.Xs

📋 Summary: [what was done]

🤝 Coordinated N agents:
   • vg-agent-1
   • vg-agent-2

💡 Next Steps:
   1. [action 1]
   2. [action 2]
```

## Critical Rules

### DO:
- ✅ Use existing skills when available (performance)
- ✅ Show real-time progress
- ✅ Keep skill operations lightweight (avoid reading large files unless necessary)
- ✅ Synthesize results concisely

### DON'T:
- ❌ Read `.claude/agents/*/AGENT.md` unless truly needed (token waste)
- ❌ Read `.claude/core/task-classifier.js` (classify in skill directly)
- ❌ Just show documentation (EXECUTE the work)
- ❌ Load unnecessary context

## Token Optimization

**Problem:** This skill + CLAUDE.md can cause session hangs due to token overload.

**Solution:**
1. Classify tasks WITHOUT reading files
2. Use existing skills (they're already loaded)
3. Only read AGENT.md if truly needed
4. Keep progress reporting concise

## Error Handling

If agent fails:
1. Report error
2. Retry once
3. Suggest fallback
4. Continue with remaining work if possible

## Integration

**Slash command:** `/vg-orchestrate [task]` → invokes this skill
**Direct:** User can also invoke via `@vg-master-orchestrator` or Skill tool

Ready to orchestrate!
