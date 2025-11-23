# Vigil Guard - System Zarządzania Agentami

**Wersja:** 2.0.0
**Data aktualizacji:** 2025-11-09
**Status:** Production Ready ✅

---

## 📊 Obecny Stan Systemu

### Liczba Agentów: **12 agentów** (11 worker + 1 meta-agent)

```
.claude/agents/
├── vg-test-automation/              # 1. Worker
├── vg-workflow-business-logic/      # 2. Worker
├── vg-pii-detection/                # 3. Worker
├── vg-backend-api/                  # 4. Worker
├── vg-frontend-ui/                  # 5. Worker
├── vg-data-analytics/               # 6. Worker
├── vg-workflow-infrastructure/      # 7. Worker
├── vg-infrastructure-deployment/    # 8. Worker
├── vg-security-compliance/          # 9. Worker
├── vg-documentation/                # 10. Worker
├── vg-tech-docs-navigator/          # 11. Worker (NEW: 2025-11-09)
└── vg-master-orchestrator/          # 12. Meta-agent (koordynator)
```

---

## 🎭 Role i Odpowiedzialności Agentów

### Worker Agents (11) - Wykonawcy Zadań

#### 1. vg-test-automation
**Cel:** Zarządzanie testami E2E dla Vigil Guard

**Capabilities:**
- `create_test` - Tworzenie nowych testów (TDD approach)
- `run_test` - Wykonywanie test suite
- `create_fixture` - Generowanie fixtures (malicious/benign)
- `analyze_results` - Analiza wyników testów
- `verify_pattern` - Weryfikacja detection patterns

**Technologie:**
- Vitest (^1.6.1)
- Webhook testing helpers
- 100+ test suite

**Używany w:**
- PATTERN_ADDITION workflow (TDD)
- TEST_EXECUTION workflow
- Continuous verification

**Lokalizacja:** `.claude/agents/vg-test-automation/`

---

#### 2. vg-workflow-business-logic
**Cel:** Zarządzanie regułami detekcji i pattern management

**Capabilities:**
- `add_pattern` - Dodawanie detection patterns
- `update_rules` - Modyfikacja rules.config.json
- `manage_categories` - Zarządzanie 34 kategoriami zagrożeń
- `tune_thresholds` - Dostosowywanie scoring thresholds
- `validate_config` - Walidacja konfiguracji

**Technologie:**
- rules.config.json (829 linii, 34 kategorie)
- unified_config.json (246 linii)
- JSON schema validation

**Używany w:**
- PATTERN_ADDITION workflow
- PII_ENTITY_ADDITION workflow
- Configuration management

**Lokalizacja:** `.claude/agents/vg-workflow-business-logic/`

---

#### 3. vg-pii-detection
**Cel:** Dual-language PII detection (Polski + Angielski)

**Capabilities:**
- `analyze_pii` - Analiza PII w tekście
- `add_entity` - Dodawanie nowych typów PII
- `configure_recognizers` - Konfiguracja custom recognizers
- `test_detection` - Testowanie detekcji PII
- `language_detection` - Hybrid language detection

**Technologie:**
- Microsoft Presidio (2.2.355)
- spaCy (pl_core_news_lg, en_core_web_lg)
- langdetect (Flask API)
- Custom recognizers (PESEL, NIP, REGON)

**Używany w:**
- PII_ENTITY_ADDITION workflow
- Dual-language detection pipeline
- Privacy compliance

**Lokalizacja:** `.claude/agents/vg-pii-detection/`

---

#### 4. vg-backend-api
**Cel:** Express.js backend development i API management

**Capabilities:**
- `add_endpoint` - Tworzenie nowych API endpoints
- `implement_auth` - JWT authentication implementation
- `query_clickhouse` - ClickHouse database queries
- `configure_rbac` - Role-based access control
- `setup_rate_limiting` - Rate limiting configuration

**Technologie:**
- Express.js (^4.19.2)
- JWT (jsonwebtoken ^9.0.2)
- bcryptjs (^2.4.3)
- SQLite (better-sqlite3)
- ClickHouse client

**Używany w:**
- Web UI Backend (services/web-ui/backend)
- API development
- Authentication & authorization

**Lokalizacja:** `.claude/agents/vg-backend-api/`

---

#### 5. vg-frontend-ui
**Cel:** React frontend development (Web UI)

**Capabilities:**
- `create_component` - Tworzenie React components
- `implement_routing` - React Router configuration
- `integrate_api` - API integration z backendem
- `style_component` - Tailwind CSS v4 styling
- `fix_controlled_components` - Critical: getCurrentValue() pattern

**Technologie:**
- React 18 (^18.3.1)
- Vite (^5.4.0)
- Tailwind CSS v4 (@theme directive)
- React Router (^6.26.2)
- TypeScript (^5.5.4)

**Używany w:**
- Web UI Frontend (services/web-ui/frontend)
- Configuration interface
- PII Detection GUI

**Lokalizacja:** `.claude/agents/vg-frontend-ui/`

---

#### 6. vg-data-analytics
**Cel:** ClickHouse analytics i Grafana dashboards

**Capabilities:**
- `create_query` - ClickHouse SQL queries
- `optimize_schema` - Schema optimization
- `configure_ttl` - Retention policy management
- `build_dashboard` - Grafana dashboard creation
- `analyze_logs` - Event log analysis

**Technologie:**
- ClickHouse (25.10.1)
- Grafana (12.2.1)
- SQL queries
- Map type handling

**Używany w:**
- Monitoring (services/monitoring/)
- Analytics & reporting
- Retention policy management

**Lokalizacja:** `.claude/agents/vg-data-analytics/`

---

#### 7. vg-workflow-infrastructure
**Cel:** n8n workflow JSON structure management

**Capabilities:**
- `modify_workflow` - Edycja workflow JSON
- `add_node` - Dodawanie węzłów do workflow
- `update_connections` - Zarządzanie connections
- `migrate_workflow` - Migracja między wersjami
- `preserve_flags` - CRITICAL: Flag preservation pattern

**Technologie:**
- n8n (1.118.2)
- JavaScript (Code nodes)
- 40-node detection pipeline
- Workflow JSON (1166+ linii)

**Używany w:**
- Detection engine (services/workflow/)
- Workflow v1.8.1 → v1.8.1 migration
- CRITICAL BUG FIXES (PII flag preservation)

**Lokalizacja:** `.claude/agents/vg-workflow-infrastructure/`

---

#### 8. vg-infrastructure-deployment
**Cel:** Docker orchestration i deployment management

**Capabilities:**
- `deploy_service` - Wdrożenie serwisu
- `manage_containers` - Zarządzanie kontenerami
- `configure_volumes` - Volume management
- `setup_network` - Sieć vigil-net
- `run_install_script` - install.sh execution

**Technologie:**
- Docker Compose
- 9 serwisów (n8n, ClickHouse, Grafana, etc.)
- install.sh (2000+ linii)
- Volume migration

**Używany w:**
- SERVICE_DEPLOYMENT workflow
- Initial setup (./install.sh)
- Container orchestration

**Lokalizacja:** `.claude/agents/vg-infrastructure-deployment/`

---

#### 9. vg-security-compliance
**Cel:** Security scanning i vulnerability management

**Capabilities:**
- `npm_audit` - npm vulnerability scanning
- `secret_scan` - TruffleHog secret detection
- `redos_check` - ReDoS pattern validation
- `auth_review` - Authentication security review
- `owasp_check` - OWASP Top 10 compliance

**Technologie:**
- TruffleHog
- npm audit
- OWASP AITG payloads
- ReDoS validators
- Security best practices

**Używany w:**
- SECURITY_AUDIT workflow (parallel)
- Phase 3-4 security fixes
- CI/CD pipeline

**Lokalizacja:** `.claude/agents/vg-security-compliance/`

---

#### 10. vg-documentation
**Cel:** Synchronizacja i generacja dokumentacji

**Capabilities:**
- `sync_docs` - Synchronizacja z kodem
- `generate_api_docs` - API documentation generation
- `update_changelog` - CHANGELOG.md updates
- `validate_cross_refs` - Cross-reference validation
- `check_outdated` - Wykrywanie outdated docs

**Technologie:**
- Markdown (59 plików .md)
- API documentation generators
- Version tracking

**Używany w:**
- Documentation maintenance (docs/)
- API reference generation
- Version updates

**Lokalizacja:** `.claude/agents/vg-documentation/`

---

#### 11. vg-tech-docs-navigator 🆕
**Cel:** Centralny hub dokumentacji technicznej (41+ technologii)

**Capabilities:**
- `query_docs` - Zapytania o dokumentację technologii
- `get_best_practices` - Best practices i Vigil Guard patterns
- `check_pitfalls` - Wykrywanie znanych problemów
- `find_examples` - Wyszukiwanie przykładów z projektu
- `search_api` - Wyszukiwanie API w całej bazie
- `get_tech_overview` - Przegląd technologii
- `suggest_fix` - Sugerowanie rozwiązań dla błędów
- `list_technologies` - Lista wszystkich technologii

**Technologie:** (15 core, 26 planned)
- Backend: Express, TypeScript, bcryptjs, JWT
- Frontend: React, Vite, Tailwind CSS v4
- Testing: Vitest
- Database: ClickHouse, Grafana
- AI: Presidio, spaCy
- Infrastructure: Docker, n8n, Caddy

**Baza wiedzy:**
- 41+ technologii dokumentowanych
- 95+ best practices
- 17+ known pitfalls z rozwiązaniami
- 20+ Vigil Guard patterns z lokalizacjami

**Używany w:**
- Inter-agent help (message bus)
- User queries (/vg-docs slash command)
- Automatic suggestions przy błędach

**Lokalizacja:** `.claude/agents/vg-tech-docs-navigator/`

**Dodany:** 2025-11-09 (v2.0.0)

---

### Meta-Agent (1) - Koordynator Systemu

#### 12. vg-master-orchestrator
**Cel:** Autonomiczna koordynacja wszystkich 11 worker agentów

**Capabilities:**
- `classify_task` - Inteligentne routing zadań
- `coordinate_agents` - Koordynacja agentów (parallel/sequential)
- `execute_workflow` - Wykonywanie workflow templates
- `synthesize_results` - Agregacja wyników
- `report_progress` - Real-time progress reporting

**Komponenty:**
- Task Classifier (confidence scoring 95%+)
- Workflow Executor (5 templates)
- Message Bus (EventEmitter)
- State Manager (persistence)
- Progress Reporter (emoji indicators)

**Workflow Templates:**
1. PATTERN_ADDITION (TDD - sequential)
2. SECURITY_AUDIT (parallel)
3. PII_ENTITY_ADDITION (sequential)
4. TEST_EXECUTION (single agent)
5. SERVICE_DEPLOYMENT (sequential)

**Lokalizacja:** `.claude/agents/vg-master-orchestrator/`

---

## 🏗️ Architektura Zarządzania

### 1. Task Classifier - Inteligentny Routing

```
User Request
     ↓
Task Classifier (keyword analysis)
     ↓
Pattern Matching (12 patterns)
     ↓
Confidence Scoring (0.0 - 1.0)
     ↓
Agent Selection (1-11 agents)
     ↓
Strategy Selection:
  - Single Agent
  - Parallel Execution
  - Sequential Execution
  - Workflow Template
```

#### Classification Patterns (12)

```javascript
// .claude/core/task-classifier.js

{
  detection: {
    keywords: ['add detection', 'detect', 'pattern', 'rule', 'threat', 'injection', 'attack'],
    agents: ['vg-workflow-business-logic', 'vg-test-automation'],
    workflow: 'PATTERN_ADDITION',
    confidence_threshold: 0.5
  },

  pii: {
    keywords: ['pii', 'personal', 'data', 'privacy', 'redact', 'mask', 'pesel', 'credit card'],
    agents: ['vg-pii-detection', 'vg-workflow-business-logic'],
    workflow: 'PII_ENTITY_ADDITION',
    confidence_threshold: 0.5
  },

  testing: {
    keywords: ['test', 'verify', 'validate', 'check', 'run tests', 'coverage'],
    agents: ['vg-test-automation'],
    workflow: 'TEST_EXECUTION',
    confidence_threshold: 0.5
  },

  security: {
    keywords: ['security', 'audit', 'vulnerability', 'scan', 'owasp', 'cve'],
    agents: ['vg-security-compliance'],
    workflow: 'SECURITY_AUDIT',
    confidence_threshold: 0.5
  },

  frontend: {
    keywords: ['ui', 'frontend', 'react', 'component', 'interface', 'display', 'button', 'form'],
    agents: ['vg-frontend-ui'],
    workflow: null,
    confidence_threshold: 0.5
  },

  backend: {
    keywords: ['api', 'backend', 'endpoint', 'auth', 'jwt', 'database', 'server'],
    agents: ['vg-backend-api'],
    workflow: null,
    confidence_threshold: 0.5
  },

  analytics: {
    keywords: ['clickhouse', 'grafana', 'dashboard', 'metrics', 'logs', 'query', 'analytics'],
    agents: ['vg-data-analytics'],
    workflow: null,
    confidence_threshold: 0.5
  },

  deployment: {
    keywords: ['deploy', 'docker', 'container', 'build', 'restart', 'service'],
    agents: ['vg-infrastructure-deployment'],
    workflow: 'SERVICE_DEPLOYMENT',
    confidence_threshold: 0.5
  },

  documentation: {
    keywords: ['document', 'docs', 'readme', 'guide', 'explain', 'description'],
    agents: ['vg-documentation'],
    workflow: null,
    confidence_threshold: 0.5
  },

  workflow: {
    keywords: ['n8n', 'workflow', 'node', 'webhook', 'pipeline'],
    agents: ['vg-workflow-infrastructure'],
    workflow: null,
    confidence_threshold: 0.5
  },

  tech_docs: {
    keywords: [
      'documentation', 'docs', 'how to', 'api reference', 'best practice',
      'pitfall', 'example', 'tutorial', 'guide for',
      // Technology names
      'express', 'react', 'vitest', 'docker', 'clickhouse', 'typescript',
      'vite', 'tailwind', 'n8n', 'presidio', 'spacy', 'bcrypt', 'jwt',
      'grafana', 'caddy', 'nginx', 'flask', 'fastapi'
    ],
    agents: ['vg-tech-docs-navigator'],
    workflow: null,
    confidence_threshold: 0.4
  }
}
```

#### Confidence Scoring Algorithm

```javascript
function classify(userInput) {
  const inputLower = userInput.toLowerCase();
  const scores = {};

  // Dla każdego pattern
  for (const [patternName, pattern] of Object.entries(patterns)) {
    let matchCount = 0;

    // Zlicz matching keywords
    for (const keyword of pattern.keywords) {
      if (inputLower.includes(keyword)) {
        matchCount++;
      }
    }

    // Calculate confidence score
    const confidence = matchCount / pattern.keywords.length;

    // Zapisz jeśli przekracza threshold
    if (confidence >= pattern.confidence_threshold) {
      scores[patternName] = {
        confidence,
        agents: pattern.agents,
        workflow: pattern.workflow
      };
    }
  }

  // Wybierz pattern z najwyższym score
  const bestMatch = Object.entries(scores)
    .sort((a, b) => b[1].confidence - a[1].confidence)[0];

  if (!bestMatch) {
    return { pattern: null, confidence: 0, strategy: 'SINGLE' };
  }

  return {
    pattern: bestMatch[0],
    confidence: bestMatch[1].confidence,
    agents: bestMatch[1].agents,
    workflow: bestMatch[1].workflow,
    strategy: determineStrategy(bestMatch[1])
  };
}
```

---

### 2. Message Bus - Komunikacja Inter-Agent

```
┌─────────────────────────────────────────────────────────┐
│                     Message Bus                         │
│                   (EventEmitter)                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ register(agentName, handler)                    │   │
│  │ send(message)                                   │   │
│  │ sendAndWait(message)  ← Returns Promise        │   │
│  │ broadcast(message)                              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         │                    │                    │
    vg-frontend-ui    vg-tech-docs-nav    vg-backend-api
```

#### Message Format

```javascript
{
  from: 'vg-frontend-ui',
  to: 'vg-tech-docs-navigator',
  type: 'query' | 'invoke' | 'notify',
  payload: {
    action: 'check_pitfalls',
    technology: 'react',
    symptom: 'controlled component not updating'
  },
  timestamp: 1699545678123,
  messageId: 'vg-frontend-ui-1699545678123-abc123'
}
```

#### Response Format

```javascript
{
  success: true,
  result: {
    found: true,
    pitfalls: [{
      issue: 'Controlled components not updating visually',
      solution: 'Use getCurrentValue() helper',
      vigil_guard_fix: 'services/web-ui/frontend/src/components/ConfigSection.tsx:59-72'
    }]
  },
  timestamp: 1699545678456
}
```

#### Przykład Komunikacji

```javascript
// Frontend UI Agent potrzebuje pomocy z React
const response = await messageBus.sendAndWait({
  from: 'vg-frontend-ui',
  to: 'vg-tech-docs-navigator',
  type: 'query',
  payload: {
    action: 'check_pitfalls',
    technology: 'react',
    symptom: 'controlled'
  }
});

// Tech Docs Navigator odpowiada
if (response.success) {
  console.log('Solution:', response.result.pitfalls[0].solution);
  console.log('File:', response.result.pitfalls[0].vigil_guard_fix);
}
```

---

### 3. Workflow Executor - Pre-configured Templates

#### 1. PATTERN_ADDITION (TDD)

**Strategy:** Sequential (4 steps)

```yaml
name: PATTERN_ADDITION
description: Test-Driven Development workflow for adding detection patterns
strategy: sequential

steps:
  - agent: vg-test-automation
    action: create_test
    input:
      pattern_name: ${pattern_name}
      attack_type: ${attack_type}
    expected_result: Test created (should FAIL initially)

  - agent: vg-test-automation
    action: run_test
    input:
      test_file: ${test_file}
    expected_result: Test FAILED (as expected)
    validation: status === 'FAILED'

  - agent: vg-workflow-business-logic
    action: add_pattern
    input:
      pattern_name: ${pattern_name}
      category: ${category}
      regex: ${regex}
      score: ${score}
    expected_result: Pattern added to rules.config.json

  - agent: vg-test-automation
    action: verify_test
    input:
      test_file: ${test_file}
    expected_result: Test PASSED
    validation: status === 'PASSED'

success_criteria:
  - All tests passing
  - Pattern in rules.config.json
  - No false positives
```

**Przykład użycia:**
```javascript
await orchestrator.executeWorkflow('PATTERN_ADDITION', {
  pattern_name: 'SQL_INJECTION_UNION_BASED',
  attack_type: 'sql_injection',
  category: 'SQL_XSS_ATTACKS',
  regex: '\\bUNION\\s+SELECT\\b',
  score: 85
});
```

---

#### 2. SECURITY_AUDIT

**Strategy:** Parallel (4 concurrent scans)

```yaml
name: SECURITY_AUDIT
description: Comprehensive security scanning across multiple dimensions
strategy: parallel

steps:
  - agent: vg-security-compliance
    action: npm_audit
    input:
      fix: false
      production_only: true
    timeout: 60000

  - agent: vg-security-compliance
    action: secret_scan
    input:
      tool: trufflehog
      paths: ['.', '!node_modules']
    timeout: 120000

  - agent: vg-security-compliance
    action: redos_check
    input:
      config_file: services/workflow/config/rules.config.json
      timeout_ms: 1000
    timeout: 30000

  - agent: vg-security-compliance
    action: auth_review
    input:
      jwt_secret_min_length: 32
      bcrypt_rounds_min: 12
      session_expiry_max: 86400
    timeout: 15000

aggregation:
  strategy: synthesis
  agent: vg-security-compliance
  action: synthesize_audit_results

success_criteria:
  - No critical vulnerabilities
  - No secrets exposed
  - No ReDoS patterns
  - Auth meets requirements
```

**Przykład wyniku:**
```javascript
{
  npm_audit: { vulnerabilities: 0, status: 'PASS' },
  secret_scan: { secrets_found: 0, status: 'PASS' },
  redos_check: { vulnerable_patterns: 0, status: 'PASS' },
  auth_review: { issues: 0, status: 'PASS' },
  overall_status: 'PASS',
  execution_time: 47.3s
}
```

---

#### 3. PII_ENTITY_ADDITION

**Strategy:** Sequential (5 steps)

```yaml
name: PII_ENTITY_ADDITION
description: Add new PII entity type with full stack updates
strategy: sequential

steps:
  - agent: vg-pii-detection
    action: analyze_entity
    input:
      entity_name: ${entity_name}
      language: ${language}
      sample_texts: ${samples}
    expected_result: Entity analysis with regex patterns

  - agent: vg-workflow-business-logic
    action: update_pii_config
    input:
      entity_type: ${entity_name}
      regex_patterns: ${patterns}
      confidence_threshold: ${threshold}
    expected_result: pii.conf updated

  - agent: vg-backend-api
    action: update_pii_api
    input:
      entity_type: ${entity_name}
      endpoint: /api/pii-detection/analyze
    expected_result: API supports new entity

  - agent: vg-frontend-ui
    action: update_pii_ui
    input:
      entity_type: ${entity_name}
      component: PIISettings.tsx
    expected_result: UI displays new entity

  - agent: vg-test-automation
    action: test_pii_entity
    input:
      entity_type: ${entity_name}
      test_samples: ${test_samples}
    expected_result: All tests passing

success_criteria:
  - Entity in pii.conf
  - API detects entity
  - UI shows entity toggle
  - Tests pass (>85% accuracy)
```

---

#### 4. TEST_EXECUTION

**Strategy:** Single Agent

```yaml
name: TEST_EXECUTION
description: Execute full test suite with reporting
strategy: single

steps:
  - agent: vg-test-automation
    action: run_suite
    input:
      path: services/workflow/tests
      coverage: true
      timeout: 30000
    expected_result: Test results with coverage report

success_criteria:
  - Pass rate >85%
  - No critical failures
  - Coverage report generated
```

---

#### 5. SERVICE_DEPLOYMENT

**Strategy:** Sequential (3 steps)

```yaml
name: SERVICE_DEPLOYMENT
description: Deploy service with health checks
strategy: sequential

steps:
  - agent: vg-infrastructure-deployment
    action: health_check
    input:
      service_name: ${service_name}
    expected_result: Current service status

  - agent: vg-infrastructure-deployment
    action: deploy_service
    input:
      service_name: ${service_name}
      build_args: ${build_args}
      recreate: true
    expected_result: Service deployed

  - agent: vg-infrastructure-deployment
    action: verify_deployment
    input:
      service_name: ${service_name}
      health_endpoint: ${health_endpoint}
      max_retries: 10
    expected_result: Service healthy

success_criteria:
  - Service running
  - Health check passing
  - No errors in logs
```

---

### 4. Progress Reporter - Real-Time Visibility

```
🎯 Task: Add SQL injection detection
════════════════════════════════════════════════════════
📊 Classification:
   • Category: detection
   • Confidence: 95%
   • Agents: vg-workflow-business-logic, vg-test-automation
   • Workflow: PATTERN_ADDITION

🎭 Strategy: WORKFLOW (Sequential)

🧪 Step 1/4: vg-test-automation
   ├─ ▶️  Action: create_test
   ├─ 📝 Creating fixture for SQL injection...
   ├─ 📝 Writing test case to bypass-scenarios.test.js...
   └─ ✅ Completed (1.2s)

🧪 Step 2/4: vg-test-automation
   ├─ ▶️  Action: run_test
   ├─ [████████░░░░] 60% - Running test suite...
   ├─ ⚠️  Test FAILED (expected behavior for TDD)
   └─ ✅ Step completed (2.1s)

⚙️ Step 3/4: vg-workflow-business-logic
   ├─ ▶️  Action: add_pattern
   ├─ 📝 Reading rules.config.json...
   ├─ 📝 Adding pattern to SQL_XSS_ATTACKS category...
   ├─ 📝 Writing updated configuration...
   └─ ✅ Completed (0.8s)

🧪 Step 4/4: vg-test-automation
   ├─ ▶️  Action: verify_test
   ├─ [████████████] 100% - Test suite completed
   ├─ ✅ Test PASSED - Detection working correctly
   └─ ✅ Completed (1.5s)

════════════════════════════════════════════════════════
✨ Workflow Completed in 5.6s

📋 Summary:
   SQL injection pattern added successfully
   - Test created: tests/e2e/bypass-scenarios.test.js
   - Pattern added: rules.config.json (SQL_XSS_ATTACKS)
   - Verification: Test suite passing (100%)

🤝 Coordinated 2 agents:
   • vg-test-automation (3 actions: create, run, verify)
   • vg-workflow-business-logic (1 action: add_pattern)

💡 Next Steps:
   - Review pattern in Web UI: http://localhost/ui/config/
   - Run full test suite: npm test
   - Monitor detection: Grafana dashboard
```

**Emoji Icons:**
- 🎯 Task identification
- 📊 Classification results
- 🎭 Strategy selected
- ▶️  Action in progress
- 📝 Detailed operation
- ⚠️  Warning/expected failure
- ✅ Success
- ❌ Error
- 🔄 Retry
- 📊 Progress bar
- ✨ Completion
- 🤝 Collaboration summary
- 💡 Recommendations

---

### 5. State Manager - Workflow Persistence

```javascript
// .claude/core/state-manager.js

class StateManager {
  constructor() {
    this.workflowStates = new Map();
    this.agentStates = new Map();
  }

  // Workflow state persistence
  async saveWorkflowState(workflowId, state) {
    this.workflowStates.set(workflowId, {
      ...state,
      lastUpdated: Date.now()
    });
  }

  async loadWorkflowState(workflowId) {
    return this.workflowStates.get(workflowId);
  }

  // Agent state persistence
  async saveAgentState(agentName, state) {
    this.agentStates.set(agentName, {
      ...state,
      lastUpdated: Date.now()
    });
  }

  async loadAgentState(agentName) {
    return this.agentStates.get(agentName);
  }

  // Recovery after failure
  async recoverWorkflow(workflowId) {
    const state = await this.loadWorkflowState(workflowId);
    if (!state) return null;

    // Find last completed step
    const lastCompletedIndex = state.steps.findLastIndex(
      step => step.status === 'completed'
    );

    // Resume from next step
    return {
      resumeFrom: lastCompletedIndex + 1,
      context: state.context,
      previousResults: state.results
    };
  }
}
```

**Workflow State Format:**
```javascript
{
  workflowId: 'PATTERN_ADDITION_20251109_154512',
  name: 'PATTERN_ADDITION',
  status: 'in_progress',
  currentStep: 2,
  steps: [
    { agent: 'vg-test-automation', action: 'create_test', status: 'completed', result: {...} },
    { agent: 'vg-test-automation', action: 'run_test', status: 'completed', result: {...} },
    { agent: 'vg-workflow-business-logic', action: 'add_pattern', status: 'in_progress', result: null },
    { agent: 'vg-test-automation', action: 'verify_test', status: 'pending', result: null }
  ],
  context: { pattern_name: 'SQL_INJECTION', attack_type: 'sql' },
  results: [ {...}, {...} ],
  startedAt: 1699545678123,
  lastUpdated: 1699545682456
}
```

---

## 🎯 Sposoby Wywoływania Agentów

### 1. Auto-Activation (Najczęstszy)

```
User: "Add SQL injection detection"
  ↓
Claude analyzes request
  ↓
Task Classifier (confidence: 95%)
  ↓
Pattern: 'detection'
Agents: ['vg-workflow-business-logic', 'vg-test-automation']
Workflow: PATTERN_ADDITION
  ↓
Master Orchestrator coordinates
  ↓
Sequential execution (4 steps)
  ↓
Result synthesized and returned
```

**Kiedy używać:** Standardowe zadania, naturalne językowo sformułowane prośby

---

### 2. Slash Commands (22 komendy)

#### Orchestration Commands
```bash
/vg-orchestrate <task>           # Master Orchestrator z pełnym kontekstem
/orchestrate <task>              # Alternatywne wywołanie
/agent-help                      # Pomoc w użyciu orchestratora
/status-agents                   # Status wszystkich agentów
/test-agents                     # Test invocations
/quick-agent                     # Szybki dostęp do agentów
```

#### Agent-Specific Commands
```bash
/vg-test-automation <task>       # Operacje testowe
/vg-workflow-business-logic <task> # Pattern management
/vg-pii-detection <task>         # PII detection
/vg-backend-api <task>           # Backend development
/vg-frontend-ui <task>           # Frontend development
/vg-data-analytics <task>        # Analytics i queries
/vg-workflow-infrastructure <task> # n8n workflow ops
/vg-infrastructure-deployment <task> # Deployment
/vg-security-compliance <task>   # Security operations
/vg-documentation <task>         # Documentation tasks
/vg-docs <technology>            # Tech documentation (NEW!)
```

#### Workflow Commands
```bash
/add-detection-pattern           # TDD workflow
/run-full-test-suite            # Execute all tests
/deploy-service <name>          # Deploy specific service
/commit-with-validation         # Pre-commit + git commit
/vg <task>                      # Universal dispatcher
```

**Kiedy używać:** Szybki dostęp, specyficzne operacje, testowanie

**Przykład:**
```bash
/vg-docs react
# → vg-tech-docs-navigator
# → Returns React documentation, pitfalls, examples

/add-detection-pattern
# → Master Orchestrator
# → Executes PATTERN_ADDITION workflow
```

---

### 3. Skills (18 skills - Auto-Activated)

Skills są automatycznie aktywowane przez Claude na podstawie kontekstu zadania.

**Vigil Guard Specific (6):**
- `n8n-vigil-workflow` - Detection patterns, workflow logic
- `vigil-testing-e2e` - E2E testing (100+ tests)
- `react-tailwind-vigil-ui` - Frontend components
- `clickhouse-grafana-monitoring` - Analytics
- `docker-vigil-orchestration` - Container management
- `vigil-security-patterns` - Security best practices

**General Purpose (11):**
- `workflow-json-architect` - n8n JSON structure
- `pattern-library-manager` - rules.config.json
- `presidio-pii-specialist` - PII detection API
- `language-detection-expert` - Hybrid language detection
- `express-api-developer` - Backend API
- `browser-extension-developer` - Chrome extension
- `documentation-sync-specialist` - Doc automation
- `git-commit-helper` - Conventional commits
- `installation-orchestrator` - install.sh
- `security-audit-scanner` - OWASP Top 10
- `test-fixture-generator` - Test fixtures

**Master Orchestrator (1):**
- `vg-master-orchestrator` - Auto-activates for multi-agent tasks

**Kiedy używać:** Automatyczne (Claude decyduje), zadania wymagające specjalistycznej wiedzy

**Przykład:**
```
User: "Run security audit"
  ↓
Claude activates skill: vg-master-orchestrator
  ↓
Skill invokes: SECURITY_AUDIT workflow
  ↓
Parallel execution: 4 security checks
```

---

### 4. Direct Invocation (CLI - Testing)

```bash
# Test agenta standalone
cd .claude/agents/vg-tech-docs-navigator
node agent.js query_docs react

# Test z parametrami
node agent.js list_technologies frontend

# Test check_pitfalls
node agent.js check_pitfalls react "controlled"
```

**Kiedy używać:** Development, testing, debugging agentów

---

## 📊 Execution Strategies

### 1. Single Agent

**Gdy używać:** Proste zadania, zapytania o informacje

```
User Request
     ↓
Task Classifier
     ↓
Select 1 Agent
     ↓
Execute Action
     ↓
Return Result
```

**Przykłady:**
- Query tech docs: vg-tech-docs-navigator
- List technologies: vg-tech-docs-navigator
- Run tests: vg-test-automation

---

### 2. Parallel Execution

**Gdy używać:** Niezależne operacje, scanning, validation

```
User Request
     ↓
Task Classifier
     ↓
Select Multiple Agents
     ↓
    ┌───────┬───────┬───────┐
    ↓       ↓       ↓       ↓
 Agent 1 Agent 2 Agent 3 Agent 4
    └───────┴───────┴───────┘
              ↓
    Synthesize Results
              ↓
       Return Result
```

**Przykłady:**
- Security Audit: 4 agenty równocześnie (npm, secrets, ReDoS, auth)
- Multi-service deployment: deploy każdego serwisu parallel
- Cross-stack validation: frontend + backend + workflow validation

**Korzyści:**
- 4x szybsze wykonanie (4 agenty vs sequential)
- Wykorzystanie zasobów
- Niezależne failures (1 agent może failować, reszta działa)

---

### 3. Sequential Execution

**Gdy używać:** Zależności między krokami, TDD workflow

```
User Request
     ↓
Task Classifier
     ↓
Select Agents
     ↓
  Agent 1
     ↓
  Agent 2 (uses result from Agent 1)
     ↓
  Agent 3 (uses results from Agent 1 & 2)
     ↓
  Return Result
```

**Przykłady:**
- PATTERN_ADDITION (TDD): test → run → add → verify
- PII_ENTITY_ADDITION: analyze → config → api → ui → test
- SERVICE_DEPLOYMENT: health check → deploy → verify

**Korzyści:**
- Kontrola przepływu
- Error propagation (fail fast)
- Context preservation między krokami

---

### 4. Workflow Template

**Gdy używać:** Złożone, powtarzalne operacje

```
User Request
     ↓
Task Classifier
     ↓
Identify Workflow
     ↓
Load Template
     ↓
Execute Steps (Sequential/Parallel mix)
     ↓
State Management (checkpoint after each step)
     ↓
Return Result
```

**Korzyści:**
- Pre-configured best practices
- Consistent execution
- Recovery from failures
- Audit trail

---

## 🔧 Jak Dodać Nowego Agenta

### Krok 1: Utwórz Strukturę

```bash
mkdir -p .claude/agents/vg-new-agent/{docs,examples}
touch .claude/agents/vg-new-agent/agent.js
touch .claude/agents/vg-new-agent/AGENT.md
```

### Krok 2: Implementuj BaseAgent

```javascript
// .claude/agents/vg-new-agent/agent.js

const BaseAgent = require('../../core/base-agent');

class NewAgent extends BaseAgent {
  constructor() {
    super({
      name: 'vg-new-agent',
      version: '1.0.0',
      description: 'Description of what this agent does',
      capabilities: [
        'capability_1',
        'capability_2',
        'capability_3'
      ],
      dependencies: []
    });
  }

  /**
   * Initialization - load resources
   */
  async onInitialize() {
    this.log('Initializing New Agent...');
    // Load any required resources
  }

  /**
   * Main execution method
   */
  async execute(task) {
    const { action, payload } = task;

    this.log(`Executing action: ${action}`);

    switch (action) {
      case 'capability_1':
        return await this.doCapability1(payload);

      case 'capability_2':
        return await this.doCapability2(payload);

      case 'capability_3':
        return await this.doCapability3(payload);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Handle queries from other agents
   */
  async onQuery(query) {
    const { action, ...payload } = query;
    return await this.execute({ action, payload });
  }

  /**
   * Implement capabilities
   */
  async doCapability1(payload) {
    // Implementation
    return { success: true, result: {...} };
  }

  async doCapability2(payload) {
    // Implementation
    return { success: true, result: {...} };
  }

  async doCapability3(payload) {
    // Implementation
    return { success: true, result: {...} };
  }
}

module.exports = NewAgent;

// Standalone execution support
if (require.main === module) {
  const agent = new NewAgent();

  const mockRuntime = {
    messageBus: {
      register: () => {},
      send: () => Promise.resolve({ success: true }),
      sendAndWait: () => Promise.resolve({ success: true, result: {} })
    },
    stateManager: {
      loadAgentState: () => Promise.resolve(null),
      saveAgentState: () => Promise.resolve()
    },
    orchestrator: null
  };

  (async () => {
    await agent.initialize(mockRuntime);

    const args = process.argv.slice(2);
    const action = args[0] || 'default_action';
    const payload = { /* parse args */ };

    const result = await agent.execute({ action, payload });
    console.log(JSON.stringify(result, null, 2));
  })();
}
```

### Krok 3: Dokumentuj AGENT.md

```markdown
# vg-new-agent

**Version:** 1.0.0
**Type:** Worker Agent
**Status:** Production Ready

## Overview

[Description of agent's purpose]

## Capabilities

1. **capability_1** - Description
2. **capability_2** - Description
3. **capability_3** - Description

## Supported Technologies

- Technology 1 (version)
- Technology 2 (version)

## Usage Examples

### For Other Agents (via Message Bus)

\`\`\`javascript
const result = await messageBus.send({
  to: 'vg-new-agent',
  type: 'query',
  payload: {
    action: 'capability_1',
    param1: 'value1'
  }
});
\`\`\`

### For Users (via Slash Commands)

\`\`\`bash
/vg-new-agent <task>
\`\`\`

### Standalone CLI

\`\`\`bash
node agent.js capability_1
\`\`\`

## Integration with Master Orchestrator

[How this agent fits into workflows]

## Dependencies

- Dependency 1
- Dependency 2

## Contributing

[Guidelines for extending this agent]
```

### Krok 4: Dodaj do Task Classifier

```javascript
// .claude/core/task-classifier.js

initializePatterns() {
  return {
    // ... existing patterns ...

    new_pattern: {
      keywords: ['keyword1', 'keyword2', 'keyword3'],
      agents: ['vg-new-agent'],
      workflow: null, // or 'NEW_WORKFLOW' if applicable
      confidence_threshold: 0.5
    }
  };
}
```

### Krok 5: Utwórz Slash Command

```markdown
---
name: vg-new-agent
description: "Short description of agent's purpose"
---

# New Agent

[User-facing documentation]

## Usage

\`\`\`bash
/vg-new-agent <task>
\`\`\`

## Examples

...
```

### Krok 6: Update Dokumentacji

```markdown
// .claude/README.md

### Worker Agents (12)  // Increment count

...
12. **vg-new-agent** - Short description
```

```markdown
// .claude/Agents.md (this file)

Add full documentation in "Role i Odpowiedzialności" section
```

### Krok 7: Testuj

```bash
# Test standalone
node .claude/agents/vg-new-agent/agent.js capability_1

# Test via orchestrator
/vg-new-agent test task

# Test inter-agent communication
# (w innym agencie)
const result = await this.invokeAgent('vg-new-agent', { action: 'capability_1' });
```

---

## 📈 Statystyki Systemu

### Agent Count (12)
```
Worker Agents:      11
Meta-Agents:         1
Total:              12
```

### Capabilities Total (60+)
```
vg-test-automation:              5 capabilities
vg-workflow-business-logic:      5 capabilities
vg-pii-detection:                5 capabilities
vg-backend-api:                  5 capabilities
vg-frontend-ui:                  5 capabilities
vg-data-analytics:               5 capabilities
vg-workflow-infrastructure:      5 capabilities
vg-infrastructure-deployment:    5 capabilities
vg-security-compliance:          5 capabilities
vg-documentation:                5 capabilities
vg-tech-docs-navigator:          8 capabilities (NEW!)
vg-master-orchestrator:          5 capabilities
```

### Workflow Templates (5)
```
PATTERN_ADDITION:        4 steps, sequential
SECURITY_AUDIT:          4 steps, parallel
PII_ENTITY_ADDITION:     5 steps, sequential
TEST_EXECUTION:          1 step, single
SERVICE_DEPLOYMENT:      3 steps, sequential
```

### Classification Patterns (12)
```
detection, pii, testing, security, frontend, backend,
analytics, deployment, documentation, workflow, tech_docs
```

### Slash Commands (22)
```
Orchestration:   6 commands
Agent-Specific: 11 commands
Workflows:       5 commands
```

### Skills (18)
```
Vigil Guard Specific: 6 skills
General Purpose:     11 skills
Master Orchestrator:  1 skill
```

### Code Statistics
```
Total Agents Code:       ~15,000 lines (agent.js files)
Total Documentation:     ~25,000 lines (.md files)
Core Infrastructure:      ~3,000 lines (5 modules)
Tech Docs Knowledge Base:  1,180 lines (tech-stack.json)
```

### Technologies Documented (Tech Docs Navigator)
```
Implemented:  15 technologies (Etap 1)
Planned:      26 technologies (Etap 3)
Total:        41+ technologies
```

---

## 🔮 Roadmap

### Completed ✅
- [x] 12 agents fully implemented
- [x] Task classifier with 12 patterns
- [x] Message bus communication
- [x] 5 workflow templates
- [x] Real-time progress reporting
- [x] State manager for recovery
- [x] 22 slash commands
- [x] 18 skills
- [x] Tech Docs Navigator (v1.0.0)

### In Progress 🚧
- [ ] Tech Docs Navigator Etap 2 (integration testing)
- [ ] Master Orchestrator workflow optimization
- [ ] Performance metrics collection

### Planned 📋
- [ ] Tech Docs Navigator Etap 3 (26 additional technologies)
- [ ] Advanced workflow templates (error recovery, rollback)
- [ ] Agent performance monitoring
- [ ] Workflow visualization
- [ ] Agent health checks
- [ ] Load balancing for parallel execution
- [ ] Workflow scheduling
- [ ] Agent versioning system

---

## 💡 Best Practices

### Dla Developerów

1. **Zawsze używaj Message Bus** do komunikacji inter-agent
2. **Implementuj error handling** w każdym capability
3. **Używaj progress reporter** dla długich operacji
4. **Zapisuj state** dla workflow recovery
5. **Testuj standalone** przed integracją
6. **Dokumentuj w AGENT.md** wszystkie capabilities
7. **Używaj BaseAgent** jako foundation
8. **Implementuj onQuery()** dla inter-agent communication

### Dla Użytkowników

1. **Pozwól na auto-activation** - Claude wybierze najlepszych agentów
2. **Używaj slash commands** dla szybkich operacji
3. **Sprawdzaj /status-agents** aby zobaczyć dostępne capabilities
4. **Używaj /vg-docs** do dokumentacji technologii
5. **Monitoruj progress** podczas długich workflow
6. **Zgłaszaj failures** z pełnym kontekstem

### Dla Master Orchestrator

1. **Używaj workflow templates** dla powtarzalnych zadań
2. **Parallel execution** gdy możliwe
3. **Checkpoint state** po każdym kroku
4. **Synthesize results** z wielu agentów
5. **Report progress** w czasie rzeczywistym
6. **Handle failures gracefully** (retry, fallback)

---

## 🆘 Troubleshooting

### Agent nie odpowiada

```bash
# 1. Sprawdź czy agent jest zarejestrowany
/status-agents

# 2. Test standalone
node .claude/agents/vg-<agent-name>/agent.js

# 3. Sprawdź logi
# (agent.log() output w konsoli)
```

### Workflow failuje

```bash
# 1. Sprawdź state
# State Manager zapisuje stan po każdym kroku

# 2. Recover workflow
await stateManager.recoverWorkflow(workflowId);

# 3. Re-run od failed step
```

### Inter-agent communication timeout

```bash
# 1. Zwiększ timeout w message bus
messageBus.sendAndWait(message, { timeout: 60000 });

# 2. Sprawdź czy target agent działa
/status-agents

# 3. Test direct invocation
```

### Task classifier źle routuje

```bash
# 1. Sprawdź keywords w request
# 2. Dodaj więcej keywords do pattern
# 3. Obniż confidence threshold
# 4. Użyj explicit slash command
```

---

## 📚 Dodatkowa Dokumentacja

- **Master Orchestrator:** [HOW_TO_USE_MASTER_ORCHESTRATOR.md](HOW_TO_USE_MASTER_ORCHESTRATOR.md)
- **Implementation:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Migration Guide:** [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- **Main README:** [README.md](README.md)
- **Individual Agents:** `.claude/agents/vg-*/AGENT.md`
- **Tech Docs Navigator:** `.claude/agents/vg-tech-docs-navigator/AGENT.md`

---

**Ostatnia aktualizacja:** 2025-11-09
**Maintainer:** Vigil Guard Team
**Status:** Production Ready ✅
