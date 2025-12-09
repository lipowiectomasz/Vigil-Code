---
name: git-commit-helper
description: Automated git workflow management for Vigil Guard v2.0.0. Use for Conventional Commits formatting, CHANGELOG generation, commit validation, pre-commit hooks, release versioning, and semantic commits. CRITICAL - NO AI ATTRIBUTION IN COMMITS.
version: 2.0.0
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Git Commit Helper (v2.0.0)

## Overview

Automated git workflow management for Vigil Guard v2.0.0 including Conventional Commits format, CHANGELOG generation, commit validation, and pre-commit hooks.

## When to Use This Skill

- Creating properly formatted commit messages
- Generating CHANGELOG.md from commits
- Setting up pre-commit hooks
- Validating commit message format
- Managing release versioning
- Creating semantic commits

---

## CROWN RULE: NO AI ATTRIBUTION IN COMMITS

**ABSOLUTELY FORBIDDEN in git commits:**

```bash
# ❌ NEVER INCLUDE:
🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**This is NON-NEGOTIABLE:**
- NO AI attribution footers in commit messages
- NO "Generated with Claude" lines
- NO "Co-Authored-By: Claude" trailers
- Commits MUST appear as human-authored only

**Correct commit message format:**
```bash
# ✅ CORRECT:
fix(pii): improve entity deduplication

- Fixed sort to prefer longer overlaps
- Added error bubbling for Presidio failures

# ❌ WRONG - has AI attribution:
fix(pii): improve entity deduplication

- Fixed sort to prefer longer overlaps

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**If AI attribution accidentally added:**
1. STOP immediately
2. Use `git commit --amend` to rewrite message
3. Remove ALL AI attribution lines
4. Force push if already pushed (after user confirmation)

---

## Conventional Commits Format

### Structure
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
```yaml
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style (formatting, no logic change)
refactor: Code restructuring (no behavior change)
perf:     Performance improvement
test:     Adding/updating tests
build:    Build system changes
ci:       CI/CD configuration
chore:    Maintenance tasks
revert:   Revert previous commit
```

### Scopes (Vigil Guard v2.0.0)
```yaml
workflow:     n8n workflow changes (24 nodes)
detection:    Pattern/rules changes (unified_config.json)
pii:          PII detection
frontend:     React UI
backend:      Express API
docker:       Container/orchestration (11 services)
tests:        Test suite (8 E2E files)
docs:         Documentation
config:       Configuration files
heuristics:   Branch A service (v2.0.0)
semantic:     Branch B service (v2.0.0)
arbiter:      Arbiter v2 decision engine (v2.0.0)
```

### Examples (v2.0.0)

**Feature (3-branch detection):**
```bash
git commit -m "feat(arbiter): implement weighted fusion v2

- Add 3-branch parallel execution (A:30%, B:35%, C:35%)
- Implement Arbiter v2 decision engine
- Add branch degradation handling

BREAKING: Requires ClickHouse schema migration (branch columns)"
```

**Bug Fix:**
```bash
git commit -m "fix(heuristics): correct pattern timeout handling

- Fix 1000ms timeout not being enforced
- Add graceful degradation on timeout
- Fixes #123"
```

**Documentation:**
```bash
git commit -m "docs: update architecture for v2.0.0

- Replace 40-node with 24-node 3-branch architecture
- Add heuristics-service and semantic-service docs
- Update port reference table (5005, 5006)"
```

## Common Tasks

### Task 1: Automated Commit Message Generation

```bash
#!/bin/bash
# scripts/smart-commit.sh

# Analyze changed files
CHANGED_FILES=$(git diff --cached --name-only)

# Infer scope (v2.0.0 updated)
SCOPE=""
if echo "$CHANGED_FILES" | grep -q "services/workflow/"; then
  SCOPE="workflow"
elif echo "$CHANGED_FILES" | grep -q "services/heuristics-service/"; then
  SCOPE="heuristics"
elif echo "$CHANGED_FILES" | grep -q "services/semantic-service/"; then
  SCOPE="semantic"
elif echo "$CHANGED_FILES" | grep -q "services/web-ui/frontend/"; then
  SCOPE="frontend"
elif echo "$CHANGED_FILES" | grep -q "services/web-ui/backend/"; then
  SCOPE="backend"
elif echo "$CHANGED_FILES" | grep -q "docs/"; then
  SCOPE="docs"
elif echo "$CHANGED_FILES" | grep -q "docker-compose.yml"; then
  SCOPE="docker"
elif echo "$CHANGED_FILES" | grep -q "tests/"; then
  SCOPE="tests"
fi

# Prompt for type and subject
echo "Changed files:"
echo "$CHANGED_FILES"
echo ""
echo "Inferred scope: $SCOPE"
echo ""
echo "Select commit type:"
echo "1) feat"
echo "2) fix"
echo "3) docs"
echo "4) refactor"
echo "5) test"
read -p "Choice: " TYPE_CHOICE

case $TYPE_CHOICE in
  1) TYPE="feat" ;;
  2) TYPE="fix" ;;
  3) TYPE="docs" ;;
  4) TYPE="refactor" ;;
  5) TYPE="test" ;;
  *) TYPE="chore" ;;
esac

read -p "Commit subject: " SUBJECT

# Build commit message (NO AI ATTRIBUTION!)
COMMIT_MSG="$TYPE($SCOPE): $SUBJECT"

# Show preview
echo ""
echo "Commit message:"
echo "$COMMIT_MSG"
echo ""
echo "⚠️  Reminder: NO AI attribution will be added"
read -p "Proceed? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ]; then
  git commit -m "$COMMIT_MSG"
  echo "✅ Committed successfully (no AI attribution)"
else
  echo "❌ Aborted"
fi
```

### Task 2: Pre-commit Hook (Validation)

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# 1. Check for AI attribution (FORBIDDEN!)
if git diff --cached | grep -iE "(Generated with.*Claude|Co-Authored-By:.*Claude)"; then
  echo ""
  echo "❌ ERROR: AI attribution detected in staged changes!"
  echo "   Remove any 'Generated with Claude' or 'Co-Authored-By: Claude' lines"
  echo ""
  exit 1
fi

# 2. Run linter on staged files
if git diff --cached --name-only | grep -q ".ts$"; then
  echo "Running TypeScript type check..."
  npx tsc --noEmit || exit 1
fi

# 3. Run tests (v2.0.0: 8 E2E files)
if git diff --cached --name-only | grep -qE "(test|spec)"; then
  echo "Running test suite..."
  cd services/workflow && npm test || exit 1
fi

# 4. Check for secrets
echo "Checking for secrets..."
if git diff --cached | grep -iE "(password|secret|api_key|token).*(=|:)"; then
  echo "⚠️  WARNING: Potential secret detected in staged changes"
  read -p "Continue anyway? (y/n): " CONFIRM
  [ "$CONFIRM" != "y" ] && exit 1
fi

echo "✅ Pre-commit checks passed"
```

### Task 3: Commit Message Validation (Git Hook)

```bash
#!/bin/bash
# .git/hooks/commit-msg

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# CRITICAL: Check for AI attribution
if echo "$COMMIT_MSG" | grep -iE "(Generated with.*Claude|Co-Authored-By:.*Claude|🤖)"; then
  echo ""
  echo "❌ FORBIDDEN: AI attribution detected in commit message!"
  echo ""
  echo "Remove these lines:"
  echo "  - '🤖 Generated with Claude Code'"
  echo "  - 'Co-Authored-By: Claude'"
  echo ""
  exit 1
fi

# Conventional Commits regex (v2.0.0 scopes)
REGEX="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,50}"

if ! echo "$COMMIT_MSG" | grep -qE "$REGEX"; then
  echo ""
  echo "❌ Invalid commit message format"
  echo ""
  echo "Format: <type>(<scope>): <subject>"
  echo ""
  echo "Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
  echo "Scopes (v2.0.0): workflow, detection, pii, frontend, backend, docker, tests,"
  echo "                 docs, config, heuristics, semantic, arbiter"
  echo ""
  echo "Examples:"
  echo "  feat(arbiter): add weighted fusion v2"
  echo "  fix(heuristics): correct pattern timeout"
  echo "  docs: update architecture for 3-branch"
  echo ""
  exit 1
fi

# Check subject length
SUBJECT=$(echo "$COMMIT_MSG" | head -1 | sed 's/^[^:]*: //')
if [ ${#SUBJECT} -gt 50 ]; then
  echo "⚠️  Warning: Subject line should be ≤50 characters (current: ${#SUBJECT})"
fi

echo "✅ Commit message format valid (no AI attribution)"
```

### Task 4: CHANGELOG Generation (v2.0.0)

```bash
#!/bin/bash
# scripts/generate-changelog.sh

VERSION="$1"
PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

echo "# Changelog"
echo ""
echo "## [$VERSION] - $(date +%Y-%m-%d)"
echo ""

# Group commits by type
for TYPE in feat fix docs refactor perf test build ci chore; do
  COMMITS=$(git log --pretty=format:"%s" ${PREV_TAG}..HEAD | grep "^$TYPE")

  if [ -n "$COMMITS" ]; then
    case $TYPE in
      feat) SECTION="### Features" ;;
      fix) SECTION="### Bug Fixes" ;;
      docs) SECTION="### Documentation" ;;
      refactor) SECTION="### Refactoring" ;;
      perf) SECTION="### Performance" ;;
      test) SECTION="### Tests" ;;
      build) SECTION="### Build" ;;
      ci) SECTION="### CI/CD" ;;
      chore) SECTION="### Chore" ;;
    esac

    echo "$SECTION"
    echo ""
    echo "$COMMITS" | while read line; do
      MSG=$(echo "$line" | sed "s/^$TYPE[^:]*: //")
      echo "- $MSG"
    done
    echo ""
  fi
done

# Breaking changes
BREAKING=$(git log --pretty=format:"%b" ${PREV_TAG}..HEAD | grep "BREAKING")
if [ -n "$BREAKING" ]; then
  echo "### BREAKING CHANGES"
  echo ""
  echo "$BREAKING"
  echo ""
fi

# v2.0.0 specific section
echo "### Architecture Changes (v2.0.0)"
echo ""
echo "- 40-node sequential → 24-node 3-branch parallel detection"
echo "- New services: heuristics-service (5005), semantic-service (5006)"
echo "- Arbiter v2 weighted fusion (A:30%, B:35%, C:35%)"
echo ""
```

### Task 5: Semantic Versioning Helper

```bash
#!/bin/bash
# scripts/bump-version.sh

CURRENT_VERSION=$(git describe --tags --abbrev=0 | sed 's/v//')
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

echo "Current version: $CURRENT_VERSION"
echo ""
echo "Select version bump:"
echo "1) Major (breaking changes): $((MAJOR+1)).0.0"
echo "2) Minor (new features): $MAJOR.$((MINOR+1)).0"
echo "3) Patch (bug fixes): $MAJOR.$MINOR.$((PATCH+1))"
read -p "Choice: " BUMP

case $BUMP in
  1) NEW_VERSION="$((MAJOR+1)).0.0" ;;
  2) NEW_VERSION="$MAJOR.$((MINOR+1)).0" ;;
  3) NEW_VERSION="$MAJOR.$MINOR.$((PATCH+1))" ;;
  *) echo "Invalid choice"; exit 1 ;;
esac

echo ""
echo "New version: v$NEW_VERSION"
read -p "Create tag? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ]; then
  # NO AI attribution in tag message!
  git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
  echo "✅ Tag created: v$NEW_VERSION"
  echo ""
  echo "Push with: git push origin v$NEW_VERSION"
fi
```

## Integration Points

### With documentation-sync-specialist:
```yaml
when: Version tag created
action:
  1. Generate CHANGELOG.md
  2. Update version in docs/ (v2.0.0)
  3. Commit docs changes (NO AI attribution!)
```

### With workflow-json-architect:
```yaml
when: Workflow modified (24 nodes)
action:
  1. Commit with scope "workflow"
  2. Include "Import to n8n NOW!" in body
  3. Reference workflow version (v2.0.0) in footer
```

## Quick Reference

```bash
# Install hooks (validates no AI attribution)
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

cp scripts/commit-msg.sh .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg

# Generate CHANGELOG
./scripts/generate-changelog.sh v2.0.0 > CHANGELOG.md

# Smart commit (no AI attribution)
./scripts/smart-commit.sh

# Bump version
./scripts/bump-version.sh

# Fix accidental AI attribution
git commit --amend  # Remove AI lines from message
```

## v2.0.0 Specific Commits

```bash
# 3-branch feature
git commit -m "feat(workflow): implement 3-branch parallel detection

- Add heuristics-service (Branch A, port 5005)
- Add semantic-service (Branch B, port 5006)
- Update prompt-guard-api (Branch C, port 8000)
- Implement Arbiter v2 weighted fusion

BREAKING: 24-node workflow replaces 40-node sequential"

# Arbiter fix
git commit -m "fix(arbiter): handle branch degradation correctly

- Recalculate weights when branch unavailable
- Default to BLOCK on all branches failed
- Add timeout handling for Branch C"

# Test update
git commit -m "test(arbiter): add decision engine tests

- Add arbiter-decision.test.js
- Test weighted fusion calculation
- Test branch degradation scenarios"
```

---

**Format:** Conventional Commits 1.0.0
**Validation:** Pre-commit hooks (AI attribution check)
**Scopes:** Updated for v2.0.0 (heuristics, semantic, arbiter)
**CRITICAL:** NO AI ATTRIBUTION IN COMMITS
