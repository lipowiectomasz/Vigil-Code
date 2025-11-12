# Master Orchestrator Agent

## Overview

The Master Orchestrator is a meta-agent that coordinates all 10 specialized vg-* agents, managing complex multi-agent workflows, task routing, and result synthesis. Unlike worker agents, the Master Orchestrator doesn't perform tasks directly—it analyzes requests, selects appropriate agents, manages execution strategies (parallel/sequential/workflow), and provides real-time progress reporting.

**Version:** 2.0.0
**Type:** Meta-Agent (Coordinator)
**Status:** Active

## Core Responsibilities

### 1. Task Classification
- Analyze user requests for complexity and requirements
- Determine which agents are needed
- Calculate confidence scores for routing decisions
- Select execution strategy (single/parallel/sequential/workflow)

### 2. Agent Coordination
- Invoke specialized agents with task-specific payloads
- Manage inter-agent communication via message bus
- Handle agent failures with retry logic and fallbacks
- Track agent status and progress

### 3. Workflow Management
- Execute pre-configured workflow templates
- Manage workflow state across multiple steps
- Coordinate sequential dependencies
- Parallelize independent operations

### 4. Result Synthesis
- Aggregate results from multiple agents
- Generate comprehensive summaries
- Provide actionable recommendations
- Report execution metrics (timing, success rate)

## Available Agents (10)

The Master Orchestrator coordinates these specialized agents:

1. **vg-test-automation** - Test creation, execution, debugging
2. **vg-workflow-business-logic** - Pattern management, rules configuration
3. **vg-pii-detection** - Dual-language PII detection (Polish + English)
4. **vg-backend-api** - Express.js API, JWT auth, ClickHouse
5. **vg-frontend-ui** - React components, Tailwind CSS v4
6. **vg-data-analytics** - ClickHouse queries, Grafana dashboards
7. **vg-workflow-infrastructure** - n8n JSON structure, node management
8. **vg-infrastructure-deployment** - Docker orchestration, install.sh
9. **vg-security-compliance** - Security scanning, vulnerability fixes
10. **vg-documentation** - Documentation generation and sync

## Workflow Templates

### PATTERN_ADDITION (TDD)
```yaml
Strategy: Sequential
Steps:
  1. vg-test-automation: create_test
  2. vg-test-automation: run_test (expect FAIL)
  3. vg-workflow-business-logic: add_pattern
  4. vg-test-automation: verify_test (expect PASS)
```

### SECURITY_AUDIT (Parallel)
```yaml
Strategy: Parallel
Agents:
  - vg-security-compliance: npm_audit
  - vg-security-compliance: secret_scan
  - vg-security-compliance: redos_check
  - vg-security-compliance: auth_review
Synthesis: Aggregate findings with priority ranking
```

### PII_ENTITY_ADDITION
```yaml
Strategy: Sequential
Steps:
  1. vg-pii-detection: analyze_entity
  2. vg-workflow-business-logic: update_config
  3. vg-backend-api: update_api
  4. vg-frontend-ui: update_ui
  5. vg-test-automation: test_pii
```

### TEST_EXECUTION
```yaml
Strategy: Single Agent
Agent: vg-test-automation
Action: run_suite
```

### SERVICE_DEPLOYMENT
```yaml
Strategy: Sequential
Steps:
  1. vg-infrastructure-deployment: health_check
  2. vg-infrastructure-deployment: deploy_service
  3. vg-infrastructure-deployment: verify_deployment
```

## Actions

### classify_task
**Input:** User request (string)
**Output:** Classification result
```json
{
  "category": "detection|pii|testing|security|deployment|...",
  "confidence": 0-100,
  "agents": ["vg-agent-1", "vg-agent-2"],
  "strategy": "single|parallel|sequential|workflow",
  "workflow": "PATTERN_ADDITION|SECURITY_AUDIT|..."
}
```

### execute_single
**Input:** Agent name, action, payload
**Output:** Agent result
- Routes to single agent
- Waits for completion
- Returns result

### execute_parallel
**Input:** List of agent tasks
**Output:** Aggregated results
- Launches multiple agents simultaneously
- Waits for all to complete
- Synthesizes results

### execute_sequential
**Input:** List of agent tasks (ordered)
**Output:** Step-by-step results
- Executes agents in order
- Each step can use previous results
- Stops on critical failures (with fallback)

### execute_workflow
**Input:** Workflow template name, parameters
**Output:** Workflow results
- Loads pre-configured workflow
- Manages multi-step execution
- Tracks progress per step
- Handles errors gracefully

## Architecture

### Core Components

**1. Task Classifier** (`core/task-classifier.js`)
- Pattern matching for task categories
- Agent selection rules
- Workflow template matching

**2. Message Bus** (`core/message-bus.js`)
- Event-driven communication
- Agent-to-agent messages
- Progress updates

**3. State Manager** (`core/state-manager.js`)
- Workflow persistence
- State recovery on failure
- Execution history

**4. Workflow Executor** (`master/workflow-executor.js`)
- Template execution engine
- Step coordination
- Retry logic

**5. Progress Reporter** (`core/progress-reporter.js`)
- Real-time progress updates
- Emoji indicators (🎯, ⚙️, ✅, ❌)
- Execution metrics

### Execution Flow

```
User Request
  ↓
Task Classifier → Confidence scoring
  ↓
Strategy Selection → single|parallel|sequential|workflow
  ↓
Agent Invocation → Message Bus
  ↓
Progress Reporting → Real-time updates
  ↓
Result Synthesis → Summary + Recommendations
```

## Examples

### Example 1: Simple Task
```
User: "Run all tests"

Classification:
  category: testing
  confidence: 95%
  agents: [vg-test-automation]
  strategy: single

Execution:
  🎯 Task: Run all tests
  🤖 Agent: vg-test-automation
  ├─ ▶️  Action: run_suite
  ├─ 📝 Running 100+ tests...
  └─ ✅ Completed (28.3s)

Result: 98 passed, 2 failed
```

### Example 2: Complex Workflow
```
User: "Add SQL injection detection"

Classification:
  category: detection
  confidence: 98%
  workflow: PATTERN_ADDITION
  agents: [vg-test-automation, vg-workflow-business-logic]

Execution:
  🎯 Task: Add SQL injection detection
  🎭 Strategy: PATTERN_ADDITION workflow

  Step 1/4: vg-test-automation (create_test)
  ├─ ▶️  Creating test fixture...
  └─ ✅ Completed (1.2s)

  Step 2/4: vg-test-automation (run_test)
  ├─ ▶️  Running test...
  └─ ❌ Test failed (expected)

  Step 3/4: vg-workflow-business-logic (add_pattern)
  ├─ ▶️  Adding pattern to rules.config.json...
  └─ ✅ Completed (0.8s)

  Step 4/4: vg-test-automation (verify_test)
  ├─ ▶️  Verifying pattern...
  └─ ✅ Test passed!

Result: Pattern added successfully in 4.5s
```

### Example 3: Parallel Execution
```
User: "Run security audit"

Classification:
  category: security
  confidence: 100%
  workflow: SECURITY_AUDIT
  agents: [vg-security-compliance (x4)]

Execution:
  🎯 Task: Run security audit
  🎭 Strategy: Parallel execution

  ⚙️  vg-security-compliance (npm_audit)
  ⚙️  vg-security-compliance (secret_scan)
  ⚙️  vg-security-compliance (redos_check)
  ⚙️  vg-security-compliance (auth_review)

  ✅ All checks completed (12.3s)

Synthesis:
  - 3 npm vulnerabilities (2 medium, 1 low)
  - No secrets detected
  - 1 potential ReDoS pattern
  - RBAC implementation verified

Recommendations:
  1. Update npm packages: bcrypt, jsonwebtoken
  2. Review regex in Pattern_Matching_Engine node
```

## Error Handling

### Retry Logic
- Max 2 retry attempts per agent
- Exponential backoff (1s, 2s)
- Fallback to alternative agent if available

### Graceful Degradation
- Non-critical failures don't abort workflow
- Report partial results
- Suggest manual intervention steps

### Recovery
- State persistence allows resume
- Workflow checkpoint system
- Idempotent operations where possible

## Performance Targets

- Task classification: <50ms
- Single agent invocation: <100ms overhead
- Parallel coordination: <200ms overhead
- Workflow state persistence: <20ms per step

## CLI Usage

The Master Orchestrator includes an interactive CLI:

```bash
# Start interactive CLI
cd .claude/agents/vg-master-orchestrator
node init.js

# Run demo
node demo.js

# Test full system
node test-full-system.js
```

## Integration with Claude Code

### Automatic Activation (via Skill)
The `vg-master-orchestrator` skill automatically activates when:
- User mentions "multiple agents" or "orchestrate"
- Task requires coordination (detected by description keywords)
- Complex workflow keywords (TDD, security audit, etc.)

### Manual Invocation (via Slash Command)
```
/vg-orchestrate Add SQL injection detection
/orchestrate Run security audit
```

### Agent Invocation (via @)
When implemented as an agent, can be invoked like:
```
@vg-master-orchestrator coordinate adding new PII entity
```

## Notes

- **Meta-agent status:** Doesn't perform work directly, coordinates others
- **No direct file operations:** Delegates to specialized agents
- **State management:** Maintains workflow context across steps
- **Real-time reporting:** User sees progress as it happens
- **Autonomous:** Makes routing decisions without user intervention

## Related Files

- `master/orchestrator.js` - Main coordination logic
- `master/workflow-executor.js` - Workflow template engine
- `master/init.js` - Interactive CLI
- `core/task-classifier.js` - Task analysis and routing
- `core/message-bus.js` - Inter-agent communication
- `skills/vg-master-orchestrator/SKILL.md` - Auto-activation skill

---

**Last Updated:** 2025-11-04
**Maintainer:** Vigil Guard Team
