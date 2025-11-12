# Contributing to Vigil-Code

Thank you for your interest in contributing to Vigil-Code! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Adding a New Agent](#adding-a-new-agent)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on collaboration
- Follow project standards

---

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/vigil-code.git
   cd vigil-code
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**

4. **Test thoroughly**
   ```bash
   node .claude/agents/vg-your-agent/agent.js
   ```

5. **Submit a pull request**

---

## How to Contribute

### Areas for Contribution

✅ **New Agents** - Add specialized agents for new domains
✅ **Workflow Templates** - Create pre-configured workflows
✅ **Tech Docs** - Add more technologies to vg-tech-docs-navigator
✅ **Bug Fixes** - Fix issues and improve stability
✅ **Documentation** - Improve or expand documentation
✅ **Performance** - Optimize agent execution
✅ **Testing** - Add tests for agents and workflows

---

## Development Workflow

### Project Structure

```
.claude/
├── agents/          # Specialized agents
├── core/            # Infrastructure modules
├── commands/        # Slash commands
├── skills/          # Auto-activated skills
└── Agents.md        # Complete documentation
```

### Coding Standards

- **Use CommonJS** (`require`, `module.exports`)
- **Follow BaseAgent pattern** (see `.claude/core/base-agent.js`)
- **Write clear comments** for complex logic
- **Use descriptive names** for functions and variables
- **Handle errors gracefully** (no silent failures)

---

## Adding a New Agent

### 1. Create Agent Structure

```bash
mkdir -p .claude/agents/vg-your-agent
touch .claude/agents/vg-your-agent/agent.js
touch .claude/agents/vg-your-agent/AGENT.md
```

### 2. Implement BaseAgent

```javascript
const BaseAgent = require('../../core/base-agent');

class YourAgent extends BaseAgent {
  constructor() {
    super({
      name: 'vg-your-agent',
      version: '1.0.0',
      description: 'What your agent does',
      capabilities: ['capability_1', 'capability_2'],
      dependencies: []
    });
  }

  async onInitialize() {
    this.log('Initializing...');
    // Load resources
  }

  async execute(task) {
    const { action, payload } = task;

    switch (action) {
      case 'capability_1':
        return await this.doCapability1(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async doCapability1(payload) {
    // Implementation
    return { success: true, result: {...} };
  }
}

module.exports = YourAgent;
```

### 3. Add to Task Classifier

Edit `.claude/core/task-classifier.js`:

```javascript
your_pattern: {
  keywords: ['keyword1', 'keyword2'],
  agents: ['vg-your-agent'],
  workflow: null
}
```

### 4. Create Slash Command

Create `.claude/commands/vg-your-agent.md`:

```markdown
---
name: vg-your-agent
description: "Short description"
---

# Your Agent

Usage documentation...
```

### 5. Document in Agents.md

Add comprehensive documentation to `.claude/Agents.md` in the "Role i Odpowiedzialności" section.

---

## Testing

### Test Standalone

```bash
node .claude/agents/vg-your-agent/agent.js capability_1
```

### Test via Orchestrator

```
/vg-your-agent test task
```

### Test Inter-Agent Communication

```javascript
const result = await this.invokeAgent('vg-your-agent', {
  action: 'capability_1',
  param: 'value'
});
```

---

## Documentation

### Agent Documentation (AGENT.md)

Each agent must have:
- Overview
- Capabilities list
- Usage examples
- Integration notes
- Dependencies

### Code Comments

```javascript
/**
 * Brief description of what this function does
 * 
 * @param {Object} payload - Description
 * @param {string} payload.param1 - Description
 * @returns {Promise<Object>} Description of return value
 */
async doSomething(payload) {
  // Implementation
}
```

---

## Pull Request Process

### Before Submitting

1. ✅ Test your changes thoroughly
2. ✅ Update documentation
3. ✅ Follow coding standards
4. ✅ No console.errors (use this.log())
5. ✅ Add yourself to contributors (if applicable)

### PR Title Format

```
feat(agent): Add vg-your-agent for X functionality
fix(orchestrator): Fix Y issue in task classification
docs(readme): Update installation instructions
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New agent
- [ ] Bug fix
- [ ] Documentation
- [ ] Performance improvement

## Testing
How you tested the changes

## Checklist
- [ ] Code follows project standards
- [ ] Documentation updated
- [ ] Tests passing
- [ ] No breaking changes (or documented)
```

---

## Review Process

1. **Automated Checks** - CI/CD runs tests
2. **Code Review** - Maintainer reviews code
3. **Feedback** - Address review comments
4. **Approval** - Maintainer approves PR
5. **Merge** - PR merged to main

---

## Questions?

- **Issues:** [GitHub Issues](https://github.com/your-username/vigil-code/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/vigil-code/discussions)
- **Documentation:** [.claude/README.md](.claude/README.md)

---

Thank you for contributing to Vigil-Code! 🚀
