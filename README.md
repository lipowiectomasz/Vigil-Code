# Vigil-Code

**Autonomous Multi-Agent System for Software Development**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Agents](https://img.shields.io/badge/agents-12-orange.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

---

## 🎯 Overview

Vigil-Code is a production-ready autonomous multi-agent orchestration system designed for complex software development workflows. Originally built for the [Vigil Guard](https://github.com/vigilguard/vigil-guard) security platform, this system provides intelligent task routing, parallel execution, and real-time progress tracking across specialized development agents.

### Key Features

✨ **12 Specialized Agents** - 11 worker agents + 1 meta-orchestrator
🧠 **Intelligent Task Classification** - 95%+ confidence routing with 12 patterns
🔄 **Flexible Execution Strategies** - Single, parallel, sequential, and workflow templates
📊 **Real-Time Progress Reporting** - Emoji-enhanced visibility with detailed logs
💾 **State Management** - Workflow persistence and recovery
🎯 **41+ Technologies Documented** - Built-in tech docs navigator
🚀 **5 Pre-configured Workflows** - TDD, security audit, PII detection, testing, deployment

---

## 📁 Repository Structure

```
Vigil-Code/
├── .claude/                          # Complete agent system
│   ├── agents/                       # 12 specialized agents
│   ├── core/                         # Infrastructure modules
│   ├── commands/                     # 22 slash commands
│   ├── skills/                       # 18 auto-activated skills
│   ├── Agents.md                     # Complete agent documentation
│   └── README.md                     # System overview
│
├── CLAUDE.md                         # Main usage documentation
├── README.md                         # This file
├── LICENSE                           # MIT License
├── package.json                      # Node.js project config
└── .gitignore                        # Git ignore rules
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥18.0.0
- **Claude Code** (for agent execution)
- Git (for version control)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/vigil-code.git
cd vigil-code

# Install dependencies (if any)
npm install

# Verify installation
node .claude/agents/vg-tech-docs-navigator/agent.js list_technologies
```

---

## 🎭 The 12 Agents

### Worker Agents (11)

1. **vg-test-automation** - Test creation, execution, fixture generation
2. **vg-workflow-business-logic** - Pattern management, rules.config.json
3. **vg-pii-detection** - Dual-language PII detection (Presidio + spaCy)
4. **vg-backend-api** - Express.js API development (JWT, ClickHouse)
5. **vg-frontend-ui** - React 18 + Vite + Tailwind CSS v4
6. **vg-data-analytics** - ClickHouse analytics + Grafana dashboards
7. **vg-workflow-infrastructure** - n8n workflow JSON management
8. **vg-infrastructure-deployment** - Docker orchestration
9. **vg-security-compliance** - OWASP Top 10, TruffleHog, ReDoS validation
10. **vg-documentation** - Documentation sync and generation
11. **vg-tech-docs-navigator** 🆕 - 41+ technologies documentation hub

### Meta-Agent (1)

12. **vg-master-orchestrator** - Coordinates all 11 worker agents

---

## 📚 Documentation

- **[Agents.md](.claude/Agents.md)** - Complete agent system documentation (41KB)
- **[CLAUDE.md](CLAUDE.md)** - Main usage guide
- **[.claude/README.md](.claude/README.md)** - System overview

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for autonomous software development**

**Status:** Production Ready ✅
**Version:** 2.0.0
**Last Updated:** 2025-11-09
