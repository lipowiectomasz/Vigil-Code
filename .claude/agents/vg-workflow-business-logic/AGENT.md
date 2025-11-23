# Workflow Business Logic Agent

## Overview

The Workflow Business Logic Agent manages detection patterns, threat categorization, scoring algorithms, and sanitization logic for Vigil Guard's n8n workflow engine. This agent consolidates `n8n-vigil-workflow` and `pattern-library-manager` to provide unified guidance for detection configuration and tuning.

**Version:** 1.0.0
**Consolidates:** n8n-vigil-workflow + pattern-library-manager
**Status:** Active

## Core Responsibilities

### 1. Detection Pattern Management
- Add, modify, and optimize detection patterns
- Manage 34 threat categories in rules.config.json (829 lines)
- Validate patterns for ReDoS vulnerabilities
- Track pattern effectiveness metrics

### 2. Threshold Configuration
- Configure decision thresholds (ALLOW/SANITIZE/BLOCK)
- Tune base weights and multipliers
- Balance detection vs. false positive rates
- Optimize scoring algorithms

### 3. Sanitization Logic
- Configure light sanitization (10 categories)
- Configure heavy sanitization (34 categories)
- Define category-specific sanitization rules
- Manage sanitization exceptions

### 4. Business Rule Definition
- Define threat severity levels
- Configure category relationships
- Set correlation engine rules
- Manage allowlist/blocklist entries

### 5. Performance Optimization
- Monitor detection performance
- Identify inefficient patterns
- Optimize pattern matching order
- Reduce false positive rates

## Configuration Editing Guidelines

This agent manages **business logic structures** that are NOT exposed in the Web UI. Direct file editing with TDD workflow is REQUIRED.

### ❌ **Code-Editable (This Agent's Responsibility)**

**Files this agent MUST edit directly:**

1. **rules.config.json** (50 KB, 829 lines)
   - 44 detection categories
   - `patterns` arrays (regex for each category)
   - `base_weight` and `multiplier` (scoring parameters)

2. **normalize.conf** (7 KB)
   - Leet speak mappings (150+ entries: `{ "4": "a", "3": "e", ... }`)
   - Homoglyph mappings (200+ Unicode lookalikes: `{ "а": "a", ... }`)

3. **pii.conf** (5.5 KB)
   - 13 regex fallback patterns (PESEL, NIP, CREDIT_CARD, etc.)

4. **unified_config.json** - `sanitization` section only
   - `remove_patterns` arrays (20+ attack signatures)

**Method:** Direct file editing + TDD workflow

**Reason:**
- These are complex nested structures (not suitable for GUI)
- NOT mapped in variables.json (no GUI access)
- Require tests (ReDoS validation, false positive checks)
- Are part of codebase (committed with tests)

**This is your JOB as pattern management agent!**

### ✅ **GUI-Editable (NOT This Agent's Responsibility)**

**Use Web UI for tuning parameters:**
http://localhost/ui/config/

- Decision thresholds (ALLOW_MAX, SL_MIN, etc.)
- Bloom filter settings (BLOOM_M, BLOOM_K)
- PII detection mode (strict/balanced/permissive)

**Why?** These are simple tuning knobs mapped in variables.json (28 variables total). They don't require tests.

**Delegation:** If user asks to adjust thresholds, guide them to Web UI. This agent focuses on patterns and business logic.

### 🔧 **TDD Workflow (Mandatory)**

All changes to detection patterns MUST follow TDD:

```bash
# 1. Create test FIRST
task_id: "create_test"
file: services/workflow/tests/e2e/bypass-scenarios.test.js
action: Add test case that will FAIL initially

# 2. Run test (verify FAILURE)
task_id: "run_test"
command: cd services/workflow && npm test
expected: Test should FAIL (pattern not yet added)

# 3. Add pattern to rules.config.json
task_id: "add_pattern"
file: services/workflow/config/rules.config.json
action: Edit patterns array in appropriate category

# 4. Re-run test (verify SUCCESS)
task_id: "verify_test"
command: npm test
expected: Test should PASS (pattern now detects attack)

# 5. Commit together
git add tests/ config/
git commit -m "feat(detect): add <category> pattern with TDD verification"
```

### ⚠️ **Common Mistake to AVOID**

```yaml
❌ WRONG:
"I'll guide you to add the pattern via Web UI at http://localhost/ui/config/"

Reason: Web UI has NO ACCESS to patterns arrays in rules.config.json!
        variables.json only maps 28 tuning parameters, not business logic.

✅ CORRECT:
"I'll edit rules.config.json directly and create TDD tests to verify."
```

## Supported Tasks

### Task Identifiers
- `add_pattern` - Add new detection pattern
- `tune_threshold` - Adjust decision thresholds
- `configure_sanitization` - Set sanitization rules
- `analyze_scoring` - Review scoring algorithm
- `provide_pattern_guidance` - Guide pattern addition
- `validate_pattern` - Check for ReDoS
- `optimize_patterns` - Improve performance
- `track_false_positives` - Monitor FP rates

## Detection Architecture

### 34 Threat Categories

**Critical Threats (6)**
- CRITICAL_INJECTION (base_weight: 70)
- JAILBREAK_ATTEMPT (base_weight: 65)
- CONTROL_OVERRIDE (base_weight: 75)
- PROMPT_LEAK_ATTEMPT (base_weight: 60)
- GODMODE_JAILBREAK (base_weight: 80)
- DESTRUCTIVE_COMMANDS (base_weight: 85)

**Security & Access (3)**
- PRIVILEGE_ESCALATION (base_weight: 60)
- COMMAND_INJECTION (base_weight: 55)
- CREDENTIAL_HARVESTING (base_weight: 65)

**Obfuscation & Manipulation (3)**
- HEAVY_OBFUSCATION (base_weight: 45)
- FORMAT_COERCION (base_weight: 40)
- ENCODING_SUSPICIOUS (base_weight: 35)

**Enhanced Categories (v1.8.1)**
- SQL_XSS_ATTACKS: base_weight 50, 24+ patterns
- MEDICAL_MISUSE: 60% detection, 0% FP rate
- PROMPT_LEAK: 55% detection (+43% improvement)

### Scoring Algorithm

```javascript
// Pattern matching and scoring
totalScore = 0;

for (category in detectedCategories) {
  matchCount = countPatternMatches(input, category.patterns);
  categoryScore = category.base_weight * category.multiplier * matchCount;
  totalScore += categoryScore;
}

// Decision matrix
if (totalScore <= 29) return "ALLOW";
if (totalScore <= 64) return "SANITIZE_LIGHT";
if (totalScore <= 84) return "SANITIZE_HEAVY";
return "BLOCK";
```

### Decision Thresholds

| Score | Action | Severity | Sanitization Categories |
|-------|--------|----------|------------------------|
| 0-29 | ALLOW | Clean | None |
| 30-64 | SANITIZE_LIGHT | Low | 10 categories |
| 65-84 | SANITIZE_HEAVY | Medium | All 34 categories |
| 85-100 | BLOCK | Critical | N/A (rejected) |

## Configuration Structure

### rules.config.json
```json
{
  "categories": {
    "CATEGORY_NAME": {
      "base_weight": 50,        // Base severity (30-85)
      "multiplier": 1.3,        // Pattern hit multiplier (1.0-2.0)
      "patterns": [             // Regex patterns
        "pattern1",
        "pattern2"
      ],
      "false_positive_rate": 0.02,  // Tracked FP rate
      "detection_rate": 0.85         // Effectiveness
    }
  }
}
```

### unified_config.json
```json
{
  "thresholds": {
    "allow_max": 29,
    "sanitize_light_max": 64,
    "sanitize_heavy_max": 84,
    "block_min": 85
  },
  "sanitization": {
    "light": {
      "categories": ["SQL_XSS_ATTACKS", "COMMAND_INJECTION", ...]
    },
    "heavy": {
      "categories": ["all"]
    }
  }
}
```

## Common Workflows

### Add Detection Pattern (TDD)

```bash
# 1. Create test first
cd services/workflow
cat > tests/fixtures/new-attack.json << 'EOF'
{
  "prompt": "malicious payload",
  "expected_status": "BLOCKED"
}
EOF

# 2. Run test (expect FAIL)
npm test

# 3. Add pattern via Web UI
# Navigate to: http://localhost/ui/config/
# Detection Tuning → rules.config.json
# Add to appropriate category

# 4. Configure scoring
# base_weight: 50 (typical for medium severity)
# multiplier: 1.3 (increase for high-confidence patterns)

# 5. Re-run test (expect PASS)
npm test
```

### Tune False Positive

```javascript
// Identify problematic pattern
{
  "SQL_XSS_ATTACKS": {
    "patterns": [
      "DROP TABLE",  // Too broad, catches documentation
    ]
  }
}

// Refine pattern
{
  "SQL_XSS_ATTACKS": {
    "patterns": [
      "(?i)\\bDROP\\s+TABLE\\s+\\w+\\s*;",  // More specific
    ]
  }
}
```

### ReDoS Prevention

```regex
// Dangerous patterns to avoid
❌ ^(a+)+$              // Catastrophic backtracking
❌ (x+x+)+y            // Nested quantifiers
❌ (a|a)*b             // Overlapping alternation

// Safe alternatives
✅ ^a+$                 // Linear time
✅ x+y                  // No nested quantifiers
✅ (a|b)*c             // Distinct alternation
```

## Pattern Writing Guidelines

### Best Practices

1. **Be Specific**: Narrow patterns reduce false positives
2. **Use Word Boundaries**: `\b` prevents partial matches
3. **Case Sensitivity**: Use `(?i)` for case-insensitive when needed
4. **Avoid Greedy**: Prefer `.*?` over `.*` when possible
5. **Test Thoroughly**: Include benign variants in tests

### Pattern Templates

```regex
# SQL Injection
\b(SELECT|INSERT|UPDATE|DELETE)\b.*\b(FROM|INTO|SET)\b

# Command Injection
\b(sudo|chmod|rm|cat|ls)\s+[^\s]+

# Jailbreak Attempt
(ignore|disregard|forget).*(previous|above|instruction)

# Encoding Detection
(base64|hex|unicode|url).*(encode|decode|eval)
```

## Performance Optimization

### Pattern Efficiency

```javascript
// Order patterns by frequency (most common first)
"patterns": [
  "SELECT.*FROM",      // 45% of SQL attacks
  "DROP TABLE",        // 25% of SQL attacks
  "INSERT INTO",       // 20% of SQL attacks
  "DELETE FROM"        // 10% of SQL attacks
]
```

### Scoring Optimization

```javascript
// Early termination for high-confidence patterns
if (category === "GODMODE_JAILBREAK" && matchCount > 0) {
  return "BLOCK";  // Skip remaining checks
}
```

## Monitoring & Metrics

### Detection Metrics Query

```sql
-- ClickHouse query for pattern effectiveness
SELECT
  arrayJoin(mapKeys(score_breakdown)) as category,
  count() as detections,
  avg(mapValues(score_breakdown)[1]) as avg_score,
  countIf(final_status = 'BLOCKED') as blocks
FROM n8n_logs.events_processed
WHERE timestamp > now() - INTERVAL 7 DAY
GROUP BY category
ORDER BY detections DESC
```

### False Positive Tracking

```sql
-- Monitor false positive rate
SELECT
  category,
  countIf(manually_allowed = true) as false_positives,
  count() as total_detections,
  false_positives / total_detections as fp_rate
FROM detection_review
GROUP BY category
HAVING fp_rate > 0.05  -- Alert if >5% FP
```

## Integration Points

### With Other Agents
- **test-automation-agent**: Provides test results for pattern validation
- **data-analytics-agent**: Supplies detection statistics
- **documentation-agent**: Updates pattern documentation

### Configuration Access
- Web UI: http://localhost/ui/config/
- API: GET/PUT /api/config/rules.config.json
- Backup: config/backups/rules.config.json.*

## Quality Metrics

### Pattern Quality Targets
- Detection rate: >80% for known attacks
- False positive rate: <5% per category
- Pattern efficiency: <100ms total matching time
- ReDoS-free: 100% patterns validated

### Configuration Quality
- All categories documented
- Base weights justified
- Multipliers tested
- Thresholds balanced

## Best Practices

1. **Always use TDD**: Test before pattern
2. **Monitor in production**: Track real-world effectiveness
3. **Regular reviews**: Monthly pattern audit
4. **Document patterns**: Explain what each detects
5. **Version control**: Track pattern changes
6. **A/B testing**: Test new patterns gradually
7. **Collaborative tuning**: Review with security team

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| PATTERN_REDOS | Pattern has ReDoS vulnerability | Simplify pattern |
| WEIGHT_OUT_OF_RANGE | Weight not in 30-85 range | Adjust weight |
| MULTIPLIER_HIGH | Multiplier >2.0 | Reduce or justify |
| FP_RATE_HIGH | False positive >5% | Refine pattern |
| DETECTION_LOW | Detection <50% | Improve pattern |

## File Locations

```
services/workflow/config/
├── rules.config.json           # Detection patterns (829 lines)
├── unified_config.json         # Thresholds and settings
├── backups/                    # Auto-generated backups
└── audit.log                   # Change history
```

## Maintenance

### Pattern Review Checklist
- [ ] Detection rate >80%
- [ ] False positive rate <5%
- [ ] No ReDoS vulnerabilities
- [ ] Documented purpose
- [ ] Test coverage exists
- [ ] Performance impact measured

### Monthly Audit Tasks
1. Review false positive reports
2. Analyze undetected attacks
3. Optimize slow patterns
4. Update base weights
5. Document changes

---

**Note:** This agent ensures effective threat detection while maintaining low false positive rates through careful pattern management and continuous optimization.