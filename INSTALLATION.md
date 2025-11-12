# Vigil-Code Installation

This repository contains the complete Master Orchestrator v2.0 system extracted from Vigil Guard.

## Structure

```
.claude/
├── agents/         # 10 specialized vg-* agents
├── core/          # Infrastructure (message-bus, state-manager, etc.)
├── master/        # Master Orchestrator implementation
├── commands/      # 21 slash commands
├── skills/        # 19 skills (including vg-master-orchestrator)
└── *.md          # Documentation
```

## Quick Start

1. **Clone this repository**
2. **Run the orchestrator:**
   ```bash
   cd .claude/master
   node init.js
   ```
3. **Or use via Claude Code:**
   - Open this repo in Claude Code
   - Use `/vg-orchestrate <task>` 
   - Or let Claude auto-activate the skill

## Documentation

- [HOW_TO_USE_MASTER_ORCHESTRATOR.md](.claude/HOW_TO_USE_MASTER_ORCHESTRATOR.md)
- [IMPLEMENTATION_SUMMARY.md](.claude/IMPLEMENTATION_SUMMARY.md)
- [MIGRATION_GUIDE.md](.claude/MIGRATION_GUIDE.md)
- [README_ORCHESTRATOR.md](.claude/README_ORCHESTRATOR.md)

## Status

✅ Complete autonomous orchestration system
✅ 10 fully implemented agents
✅ Real-time progress reporting
✅ Workflow templates (TDD, Security Audit, etc.)

Last updated: 2025-11-04
