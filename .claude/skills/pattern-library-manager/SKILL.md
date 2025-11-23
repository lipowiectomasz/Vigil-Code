---
name: pattern-library-manager
description: Expert management of rules.config.json (829 lines, 34 categories). Use for pattern validation, ReDoS protection, scoring algorithms, false positive tracking, and pattern optimization via Web UI.
version: 1.6.11
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Pattern Library Manager

## Overview
Expert management of rules.config.json (829 lines, 34 threat categories) including pattern validation, ReDoS protection, scoring algorithms, and false positive tracking.

## When to Use This Skill
- Managing detection patterns in rules.config.json (direct editing with TDD workflow)
- Validating regex patterns for ReDoS vulnerabilities
- Calculating base_weight + multiplier for new patterns
- Tracking false positive rates per category
- Analyzing pattern effectiveness metrics
- Optimizing pattern performance

## Configuration Editing Guidelines

### ✅ **GUI-Editable (Tuning Parameters)**

**Use Web UI for these tuning knobs:**
http://localhost/ui/config/ → Detection Tuning

- Decision thresholds (ALLOW_MAX, SL_MIN, SL_MAX, SH_MIN, SH_MAX, BLOCK_MIN)
- Bloom filter settings (BLOOM_M, BLOOM_K, BLOOM_PHRASE_BONUS)
- Performance toggles (PII_ENABLED, CONTEXT_ENHANCEMENT)

**Reason:** These are safe tuning parameters that don't require tests.

**IMPORTANT:** The "Detection Tuning" section in Web UI only exposes 6 threshold variables. It does NOT provide access to the `patterns` arrays in rules.config.json!

### ❌ **Code-Editable (Detection Logic)**

**Edit directly for these business logic structures:**

**1. Detection patterns** in rules.config.json (829 lines, 44 categories)
```json
{
  "SQL_XSS_ATTACKS": {
    "base_weight": 50,
    "multiplier": 1.3,
    "patterns": [
      "\\b(SELECT|INSERT|UPDATE|DELETE)\\b.*\\b(FROM|INTO|SET)\\b",
      // ... add new patterns HERE
    ]
  }
}
```

**2. Leet speak mappings** in normalize.conf (150+ mappings)
- `{ "4": "a", "3": "e", "1": "i", "0": "o", ... }`

**3. Homoglyph mappings** in normalize.conf (200+ Unicode lookalikes)
- `{ "а": "a", "е": "e", "о": "o", ... }` (Cyrillic → Latin)

**4. PII regex fallbacks** in pii.conf (13 patterns)
- PESEL, NIP, CREDIT_CARD, etc.

**Reason:**
- Requires TDD workflow (test → pattern → verify)
- Complex structure (nested JSON, regex patterns)
- Security validation needed (ReDoS protection)
- Part of codebase (committed with tests)

**NOT in Web UI** - these structures are too complex for GUI forms and have no mapping in variables.json.

### 🔧 **Pattern Addition Workflow**

When this skill is invoked to add a detection pattern:

```bash
# 1. Guide user to create test FIRST
echo "Create test in services/workflow/tests/e2e/bypass-scenarios.test.js"

# 2. Run test (should FAIL)
cd services/workflow && npm test

# 3. Edit rules.config.json DIRECTLY (not via GUI!)
vim services/workflow/config/rules.config.json
# Add pattern to appropriate category's patterns array

# 4. Re-run test (should PASS)
npm test

# 5. Commit together
git add tests/ config/
git commit -m "feat(detect): add <category> pattern with TDD tests"
```

**CRITICAL:** Web UI cannot edit patterns arrays! Only thresholds are in GUI.

## Rules.config.json Structure

```json
{
  "categories": {
    "SQL_XSS_ATTACKS": {
      "base_weight": 50,
      "multiplier": 1.3,
      "patterns": [
        "\\b(SELECT|INSERT|UPDATE|DELETE)\\b.*\\b(FROM|INTO|SET)\\b",
        "\\bDROP\\s+(TABLE|DATABASE)",
        "0x[0-9a-fA-F]+.*SELECT"
      ]
    }
  }
}
```

### Scoring Algorithm

```javascript
totalScore = 0;
for (category in detectedCategories) {
  categoryScore = base_weight * multiplier * patternMatchCount;
  totalScore += categoryScore;
}

// Decision thresholds:
// 0-29: ALLOW
// 30-64: SANITIZE_LIGHT
// 65-84: SANITIZE_HEAVY
// 85+: BLOCK
```

## Common Tasks

### Task 1: Add New Pattern

**Via Web UI:**
1. Navigate to http://localhost/ui/config/
2. Detection Tuning → rules.config.json
3. Find category or create new
4. Add pattern to `patterns` array
5. Set `base_weight` (30-60 typical)
6. Set `multiplier` (1.0-2.0)
7. Preview changes → Save

**Testing:**
```bash
# Run test suite
cd services/workflow && npm test

# Check ClickHouse for detection rate
docker exec vigil-clickhouse clickhouse-client -q "
  SELECT
    arrayJoin(mapKeys(score_breakdown)) as category,
    count() as detections
  FROM n8n_logs.events_processed
  WHERE timestamp > now() - INTERVAL 7 DAY
  GROUP BY category
  ORDER BY detections DESC
"
```

### Task 2: ReDoS Validation

**Dangerous Patterns (AVOID):**
```regex
❌ ^(a+)+$              # Catastrophic backtracking
❌ (x+x+)+y            # Nested quantifiers
❌ (a|a)*b             # Overlapping alternation
❌ (.*){10,}           # Excessive repetition
```

**Safe Alternatives:**
```regex
✅ ^a+$                # Simple quantifier
✅ ^[a-z]{1,100}$      # Bounded repetition
✅ ^(?:ab)+$           # Non-capturing group
✅ ^a*b                # Greedy but safe
```

**Validation Script:**
```bash
#!/bin/bash
# scripts/validate-regex-redos.sh

PATTERN="$1"

# Test with exponentially growing input
for size in 10 100 1000 10000; do
  INPUT=$(printf 'a%.0s' $(seq 1 $size))

  START=$(date +%s%N)
  echo "$INPUT" | timeout 1s grep -P "$PATTERN" > /dev/null
  EXIT_CODE=$?
  END=$(date +%s%N)

  DURATION=$(((END - START) / 1000000))  # ms

  if [ $EXIT_CODE -eq 124 ]; then
    echo "❌ REDOS DETECTED: Timeout at size $size"
    exit 1
  fi

  echo "✅ Size $size: ${DURATION}ms"
done

echo "✅ Pattern is safe"
```

### Task 3: Pattern Effectiveness Analysis

**Query ClickHouse:**
```sql
-- Detection rate per category (last 30 days)
SELECT
  category,
  count() as total_detections,
  countIf(final_status = 'BLOCKED') as blocked,
  countIf(final_status LIKE 'SANITIZE%') as sanitized,
  round(blocked * 100.0 / total_detections, 2) as block_rate
FROM (
  SELECT
    arrayJoin(mapKeys(score_breakdown)) as category,
    final_status
  FROM n8n_logs.events_processed
  WHERE timestamp > now() - INTERVAL 30 DAY
)
GROUP BY category
ORDER BY total_detections DESC
LIMIT 20;
```

**False Positive Rate:**
```sql
-- Reported false positives per category
SELECT
  category,
  count() as reports,
  round(count() * 100.0 / (SELECT count() FROM events_processed), 2) as fp_rate
FROM false_positive_reports
WHERE timestamp > now() - INTERVAL 30 DAY
GROUP BY category
ORDER BY reports DESC;
```

### Task 4: Base Weight Calibration

**Guidelines:**
```yaml
base_weight_ranges:
  30-40: Low severity (URL encoding, common keywords)
  41-60: Medium severity (SQL patterns, obfuscation)
  61-80: High severity (jailbreaks, privilege escalation)
  81-100: Critical (GODMODE, destructive commands)

multiplier_ranges:
  1.0-1.2: Common variations
  1.3-1.5: Moderate concern
  1.6-2.0: High concern
  2.0+: Critical (rare, requires approval)
```

**Example Calculation:**
```javascript
// Pattern: "DROP TABLE users"
base_weight: 70        // High severity SQL
multiplier: 1.5        // Database destruction
total: 70 * 1.5 = 105  // BLOCKED (>85)

// Pattern: "SELECT * FROM users"
base_weight: 40        // Medium SQL read
multiplier: 1.0        // No destruction
total: 40 * 1.0 = 40   // SANITIZE_LIGHT (30-64)
```

### Task 5: Pattern Optimization

**Combine Similar Patterns:**
```regex
❌ INEFFICIENT (3 patterns):
  "\\bSELECT\\b.*\\bFROM\\b"
  "\\bINSERT\\b.*\\bINTO\\b"
  "\\bUPDATE\\b.*\\bSET\\b"

✅ EFFICIENT (1 pattern):
  "\\b(SELECT|INSERT|UPDATE)\\b.*(FROM|INTO|SET)\\b"
```

**Anchor Patterns:**
```regex
❌ SLOW: "password"              # Scans entire string
✅ FAST: "\\bpassword\\b"        # Word boundary optimization
```

**Case Insensitivity:**
```regex
❌ VERBOSE: "(DROP|drop|Drop|dRoP)"
✅ CLEAN: "DROP"  # Use case-insensitive flag in n8n
```

## 34 Detection Categories

### Critical (6)
- CRITICAL_INJECTION
- JAILBREAK_ATTEMPT
- CONTROL_OVERRIDE
- PROMPT_LEAK_ATTEMPT
- GODMODE_JAILBREAK
- DESTRUCTIVE_COMMANDS

### Security & Access (3)
- PRIVILEGE_ESCALATION
- COMMAND_INJECTION
- CREDENTIAL_HARVESTING

### Data Exfiltration (2)
- DATA_EXTRACTION
- FILE_ACCESS_ATTEMPTS

### Obfuscation & Manipulation (3)
- HEAVY_OBFUSCATION
- FORMAT_COERCION
- ENCODING_SUSPICIOUS

### Enhanced Categories (v1.4+)
- **SQL_XSS_ATTACKS** (base_weight: 30→50, +24 patterns)
- **MEDICAL_MISUSE** (v1.5, 60% detection, 0% FP)
- **PROMPT_LEAK** (v1.5, 38.3%→55.0%, +43% improvement)

## Integration with Other Skills

### With `test-fixture-generator`:
```yaml
when: New pattern added
action:
  1. Generate test fixture (malicious + benign)
  2. Run test (should FAIL initially)
  3. Add pattern via Web UI
  4. Re-run test (should PASS)
  5. Commit test + config backup
```

### With `workflow-json-architect`:
```yaml
when: Pattern timeout issues
action:
  1. Check Pattern_Matching_Engine node timeout (1000ms)
  2. Optimize regex (remove nested quantifiers)
  3. Test with large inputs
```

## Metrics & KPIs

```yaml
quality_metrics:
  redos_vulnerabilities: 0 (zero tolerance)
  false_positive_rate: <5% per category
  detection_effectiveness: >80%
  pattern_performance: <100ms per match

coverage_metrics:
  categories_tested: 100% (34/34)
  patterns_per_category: avg 15-25
  benign_test_coverage: 3-5 per malicious pattern
```

## Troubleshooting

### Issue: Pattern not triggering

**Diagnosis:**
```bash
# Test regex directly
echo "test payload" | grep -P "your_pattern"

# Check in ClickHouse
docker exec vigil-clickhouse clickhouse-client -q "
  SELECT score_breakdown
  FROM n8n_logs.events_processed
  WHERE original_input LIKE '%test payload%'
  FORMAT Pretty
"
```

**Solution:**
- Verify pattern syntax (test with grep -P)
- Check base_weight > 0
- Ensure category is enabled
- Check pattern isn't overridden by allowlist

### Issue: False positives

**Solution:**
```yaml
options:
  1. Reduce base_weight (e.g., 50 → 35)
  2. Add context requirements (e.g., require multiple keywords)
  3. Add to allowlist (benign patterns)
  4. Increase multiplier instead of base_weight
```

## Quick Reference

```bash
# Access Web UI for editing
open http://localhost/ui/config/

# Test pattern performance
time echo "payload" | grep -P "pattern"

# Check ReDoS
./scripts/validate-regex-redos.sh "pattern"

# View recent detections
docker exec vigil-clickhouse clickhouse-client -q "
  SELECT arrayJoin(mapKeys(score_breakdown)) as category, count()
  FROM n8n_logs.events_processed
  WHERE timestamp > now() - INTERVAL 1 DAY
  GROUP BY category
"
```

---

**Last Updated:** 2025-11-02
**Pattern Count:** 829 lines, 500+ patterns
**Categories:** 34 threat types
**Performance:** <100ms per pattern match
