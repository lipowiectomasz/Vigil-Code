# Core Protocols for Technology Expert Agents v3.0

This document defines shared protocols that all technology expert agents follow.

## 1. Progress File Protocol

All multi-step tasks use `.claude/state/progress.json` for state management.

### Progress File Schema v3.0

```json
{
  "version": "3.0",
  "workflow_id": "wf-{YYYYMMDD}-{random6}",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",

  "task": {
    "original_request": "User's original request",
    "summary": "Brief task summary",
    "project_context": {
      "name": "Project name",
      "root": "/path/to/project",
      "relevant_files": []
    }
  },

  "planning": {
    "thinking": "Extended thinking about the approach...",
    "strategy_rationale": "Why this strategy was chosen",
    "risks": ["Potential issue 1", "Potential issue 2"],
    "alternatives_considered": ["Alternative approach 1"]
  },

  "classification": {
    "primary_expert": "n8n-expert",
    "supporting_experts": ["vitest-expert"],
    "strategy": "sequential|parallel|single",
    "estimated_steps": 3
  },

  "status": "initialized|in_progress|completed|failed",
  "current_step": 1,
  "total_steps": 3,

  "steps": [
    {
      "step": 1,
      "expert": "vitest-expert",
      "model": "sonnet",
      "action": "create_fixture",
      "status": "completed|in_progress|pending|failed",
      "started_at": "ISO8601",
      "completed_at": "ISO8601",
      "duration_ms": 1200,
      "result": {
        "summary": "Created SQL injection test fixture",
        "details": {}
      },
      "artifacts": ["tests/fixtures/sql-injection.json"],
      "docs_consulted": ["https://vitest.dev/api/"]
    },
    {
      "step": 2,
      "expert": "n8n-expert",
      "model": "sonnet",
      "action": "add_pattern",
      "status": "in_progress",
      "context": {
        "pattern_to_add": "sql_injection_hex",
        "category": "CODE_INJECTION",
        "fixture_file": "tests/fixtures/sql-injection.json"
      }
    },
    {
      "step": 3,
      "expert": "vitest-expert",
      "model": "sonnet",
      "action": "run_tests",
      "status": "pending"
    }
  ],

  "artifacts": {
    "files_created": [],
    "files_modified": [],
    "documentation_consulted": []
  },

  "clean_state": {
    "all_tests_pass": false,
    "ready_to_merge": false,
    "pending_issues": []
  },

  "errors": []
}
```

### New in v3.0

1. **Planning Section**: Extended thinking before execution
2. **Model Field**: Each step specifies which model (sonnet/opus)
3. **Clean State**: Track if work is ready to merge
4. **Step Timing**: started_at, completed_at for metrics
5. **Docs Consulted**: Track documentation lookups per step

### Reading Progress

```
1. Check if .claude/state/progress.json exists
2. If exists and status != completed:
   - Resume from current_step
   - Use context from completed steps
   - Check clean_state for any pending issues
3. If not exists or completed:
   - Create new workflow
```

### Updating Progress

```
1. Before starting step: set status = "in_progress", started_at
2. During step: update result.details incrementally
3. After step:
   - Set status = "completed", completed_at
   - Calculate duration_ms
   - Add artifacts created/modified
   - Add docs consulted
4. Set next step context for handoff
5. If final step:
   - Set status = "completed"
   - Update clean_state
```

---

## 2. Extended Thinking Protocol

### When to Use Extended Thinking

Use planning phase for:
- Multi-expert workflows (3+ steps)
- Tasks with potential risks
- Unclear requirements
- Complex coordination needed

### Planning Format

```json
{
  "planning": {
    "thinking": "Let me analyze this task carefully. The user wants to add SQL injection detection with tests. This requires TDD workflow: 1) Create test that will fail, 2) Add pattern, 3) Verify test passes. Risk: pattern might be too broad and cause false positives. Alternative: could use single expert if we skip TDD.",
    "strategy_rationale": "Sequential TDD ensures pattern works correctly before considering complete",
    "risks": [
      "Pattern might cause false positives on legitimate SQL queries",
      "Workflow JSON might have incompatible structure"
    ],
    "alternatives_considered": [
      "Single n8n-expert (rejected: no test verification)",
      "Parallel execution (rejected: test depends on pattern)"
    ]
  }
}
```

### Output Format for Planning

```
🧠 Planning Phase

📋 Task Analysis:
   [thinking summary]

🎯 Strategy: [strategy] because [rationale]

⚠️  Risks Identified:
   • [risk 1]
   • [risk 2]

📝 Execution Plan:
   1. [expert]: [action]
   2. [expert]: [action]
   ...

▶️  Proceeding with execution...
```

---

## 3. Documentation Protocol

All experts follow this protocol for knowledge verification.

### 3-Tier Knowledge Model

| Tier | Source | Usage | Speed |
|------|--------|-------|-------|
| **Tier 1** | Core knowledge (in-context) | 80% of tasks | Instant |
| **Tier 2** | Official documentation (WebFetch) | API details, configs | 1-2s |
| **Tier 3** | Community (WebSearch) | Edge cases, workarounds | 2-5s |

### Confidence Levels

| Level | Description | Action |
|-------|-------------|--------|
| **HIGH** | Core knowledge, used daily | Answer directly |
| **MEDIUM** | Know the concept, unsure of details | Verify in docs first |
| **LOW** | Unfamiliar or edge case | Research thoroughly |

### Uncertainty Triggers

Fetch documentation when:
- Asked about specific API parameters
- Version-specific features
- Complex configuration options
- Error messages or codes
- Anything that might have changed recently

### Verification Pattern

```markdown
## High Confidence Response
[Direct answer with solution]

## Medium Confidence Response
🔍 Let me verify this in the documentation...
[Fetch docs]
✅ Confirmed: [solution]
📚 Source: [url]

## Low Confidence Response
🔍 This requires research...
[Fetch docs + search community]
Based on my research: [solution]
📚 Sources:
- Official: [url]
- Community: [url]
⚠️ Note: [any caveats]
```

---

## 4. Expert Invocation Protocol

### Via Task Tool with Model Parameter

```javascript
Task(
  prompt: `You are ${expertName}, a world-class expert in ${technology}.

           Read .claude/agents/${expertName}/AGENT.md for your full knowledge base.
           Read .claude/state/progress.json for workflow context.

           Execute: ${action}

           After completion:
           1. Update progress.json with your results
           2. Add any artifacts to the artifacts list
           3. Record docs consulted
           4. Return brief summary`,
  subagent_type: "general-purpose",
  model: "${model}"  // From expert frontmatter
)
```

### Model Selection

| Expert | Model | Rationale |
|--------|-------|-----------|
| orchestrator | opus | Complex coordination, planning |
| All others | sonnet | Fast, specialized tasks |

### Parallel Invocation

When experts are independent, invoke multiple in single message:

```javascript
// Multiple Task calls in same response
Task(prompt: "vitest-expert...", model: "sonnet")
Task(prompt: "react-expert...", model: "sonnet")
Task(prompt: "tailwind-expert...", model: "sonnet")
```

**Requirements for parallel:**
- Steps are independent (no data dependency)
- Different files being modified
- Can merge results afterwards

---

## 5. Response Format Protocol

### Progress Reporting (Orchestrator)

```
🎯 Task: [description]

🧠 Planning: [brief strategy]

📋 Classification:
   • Primary Expert: {expert}
   • Strategy: {strategy}
   • Steps: {n}

🤖 Step 1/{n}: {expert-name} (model: {model})
   ├─ ▶️  Action: {action}
   ├─ 📝 {progress message}
   └─ ✅ Completed ({duration})

🤖 Step 2/{n}: {expert-name}
   ├─ ▶️  Action: {action}
   ├─ 🔍 Fetching docs...
   ├─ 📝 {progress message}
   └─ ✅ Completed ({duration})

═══════════════════════════════════════
✨ Task Completed in {total_duration}

📋 Summary:
   {what was accomplished}

📁 Artifacts:
   • {file1}
   • {file2}

✅ Clean State:
   • Tests: {pass/fail}
   • Ready to merge: {yes/no}

💡 Next Steps (if any):
   1. {suggestion}
═══════════════════════════════════════
```

### Expert Response Format

```
## Action: {action_name}

### Analysis
{what I found/understood}

### Solution
{implementation details or guidance}

### Code/JSON
```[language]
{code if any}
```

### Artifacts
- Created: {files}
- Modified: {files}

### Documentation Consulted
- {url}: {what was verified}

### Confidence: {HIGH|MEDIUM|LOW}
{any caveats or notes}
```

---

## 6. Error Handling Protocol

### When Expert Encounters Error

1. Log error in progress.json errors array
2. Attempt recovery if possible
3. If unrecoverable:
   - Set step status to "failed"
   - Provide clear error message
   - Suggest alternative approaches

### Error Response Format

```
❌ Error in {action}

**Problem:** {description}

**Attempted:** {what was tried}

**Suggestion:** {how to proceed}

**Documentation:** {relevant docs if applicable}
```

### Error Schema in progress.json

```json
{
  "errors": [
    {
      "step": 2,
      "expert": "n8n-expert",
      "error": "Invalid JSON structure",
      "timestamp": "ISO8601",
      "recoverable": true,
      "recovery_action": "Fixed malformed node definition"
    }
  ]
}
```

---

## 7. Handoff Protocol

### Between Experts

When one expert hands off to another:

1. **Outgoing expert:**
   - Complete current step with full details
   - Document all relevant context in next step
   - List artifacts created
   - Note any decisions made
   - Record docs consulted

2. **Incoming expert:**
   - Read completed steps for history
   - Read next step for immediate context
   - Check artifacts for files to work with
   - Continue without re-doing previous work

### Context Passing Example

```json
{
  "steps": [
    {
      "step": 1,
      "expert": "vitest-expert",
      "status": "completed",
      "result": {
        "summary": "Created test fixture",
        "details": {
          "test_file": "tests/e2e/sql-injection.test.js",
          "payloads_count": 5,
          "expected_status": "BLOCKED"
        }
      },
      "artifacts": ["tests/fixtures/sql-injection.json"]
    },
    {
      "step": 2,
      "expert": "n8n-expert",
      "status": "pending",
      "context": {
        "pattern_to_test": "sql_injection_hex",
        "expected_result": "BLOCKED",
        "test_file": "tests/e2e/sql-injection.test.js",
        "relevant_files": [
          "services/workflow/config/rules.config.json"
        ],
        "notes": "Fixture expects score >= 85 for BLOCKED status"
      }
    }
  ]
}
```

---

## 8. Clean State Protocol

### Requirements for Clean State

Before marking workflow as complete:

```json
{
  "clean_state": {
    "all_tests_pass": true,
    "ready_to_merge": true,
    "pending_issues": []
  }
}
```

### Validation Checklist

- [ ] All created files saved
- [ ] Tests passing (if applicable)
- [ ] No uncommitted changes that break build
- [ ] Documentation updated if needed
- [ ] No security vulnerabilities introduced

### If Not Clean

```json
{
  "clean_state": {
    "all_tests_pass": false,
    "ready_to_merge": false,
    "pending_issues": [
      "2 tests failing in bypass-scenarios.test.js",
      "Need to update documentation for new pattern"
    ]
  }
}
```

---

## 9. YAML Frontmatter Protocol

### Expert Definition Standard

Each expert in `.claude/agents/{expert}/AGENT.md` starts with:

```yaml
---
name: expert-name
description: |
  Brief description of expertise.
  What this expert specializes in.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
  - WebSearch
model: sonnet  # or opus for orchestrator
triggers:
  - "keyword1"
  - "keyword2"
---
```

### Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Expert identifier |
| `description` | string | Multi-line description |
| `allowed-tools` | array | Tools this expert can use |
| `model` | string | Preferred model (sonnet/opus) |
| `triggers` | array | Keywords for automatic routing |

### Routing Logic

```python
def route_to_expert(task_description):
    # Load all expert frontmatters
    experts = load_expert_configs()

    # Score each expert based on trigger matches
    scores = {}
    for expert in experts:
        score = sum(
            1 for trigger in expert.triggers
            if trigger.lower() in task_description.lower()
        )
        if score > 0:
            scores[expert.name] = score

    # Return highest scoring expert(s)
    if not scores:
        return ["orchestrator"]  # Default

    max_score = max(scores.values())
    return [e for e, s in scores.items() if s == max_score]
```
