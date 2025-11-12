#!/bin/bash

################################################################################
# Vigil Guard - tmux Status Bar Update Script
#
# Purpose: Read .claude-code/ui-state.json and format for tmux status bar
# Called by: tmux (every 1 second via status-right configuration)
# Output format: "🎯 [workflow] │ [N] active" or "🤖 12 agents │ idle"
################################################################################

# Project root (assuming script is in scripts/)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_STATE_FILE="$PROJECT_ROOT/.claude-code/ui-state.json"

# Check if UI state file exists
if [ ! -f "$UI_STATE_FILE" ]; then
    echo "🤖 12 agents │ not initialized"
    exit 0
fi

# Parse JSON using Python (more reliable than jq for complex parsing)
# Fallback to jq if Python not available
if command -v python3 &> /dev/null; then
    # Python parser
    STATUS=$(python3 - "$UI_STATE_FILE" << 'PYTHON'
import json
import sys
from datetime import datetime

try:
    with open(sys.argv[1], 'r') as f:
        state = json.load(f)
    
    agents = state.get('agents', {})
    active_workflow = state.get('active_workflow')
    workflow_details = state.get('workflow_details', {})
    
    # Count active agents
    active_count = sum(1 for agent in agents.values() if agent.get('status') == 'active')
    
    # Format output based on state
    if active_workflow and active_workflow != 'null':
        # Show workflow name and progress
        workflow_name = active_workflow
        step = workflow_details.get('step', 0)
        total_steps = workflow_details.get('total_steps', 0)
        
        if total_steps > 0:
            print(f"🎯 {workflow_name} ({step}/{total_steps}) │ {active_count} active")
        else:
            print(f"🎯 {workflow_name} │ {active_count} active")
    
    elif active_count > 0:
        # Show which agent is active (first one if multiple)
        active_agents = [name.replace('vg-', '') for name, agent in agents.items() if agent.get('status') == 'active']
        if active_agents:
            first_agent = active_agents[0]
            if active_count == 1:
                print(f"🔄 {first_agent} │ running")
            else:
                print(f"🔄 {first_agent} (+{active_count-1}) │ active")
        else:
            print(f"🤖 12 agents │ {active_count} active")
    
    else:
        # All idle
        print("🤖 12 agents │ idle")

except Exception as e:
    print(f"🤖 12 agents │ error: {str(e)[:20]}")
    sys.exit(1)
PYTHON
)
    echo "$STATUS"

elif command -v jq &> /dev/null; then
    # jq parser (fallback)
    ACTIVE_COUNT=$(jq '[.agents[] | select(.status == "active")] | length' "$UI_STATE_FILE" 2>/dev/null || echo "0")
    ACTIVE_WORKFLOW=$(jq -r '.active_workflow // "null"' "$UI_STATE_FILE" 2>/dev/null || echo "null")

    if [ "$ACTIVE_WORKFLOW" != "null" ] && [ "$ACTIVE_WORKFLOW" != "none" ]; then
        STEP=$(jq -r '.workflow_details.step // 0' "$UI_STATE_FILE" 2>/dev/null || echo "0")
        TOTAL=$(jq -r '.workflow_details.total_steps // 0' "$UI_STATE_FILE" 2>/dev/null || echo "0")
        
        if [ "$TOTAL" -gt 0 ]; then
            echo "🎯 $ACTIVE_WORKFLOW ($STEP/$TOTAL) │ $ACTIVE_COUNT active"
        else
            echo "🎯 $ACTIVE_WORKFLOW │ $ACTIVE_COUNT active"
        fi
    elif [ "$ACTIVE_COUNT" -gt 0 ]; then
        ACTIVE_AGENT=$(jq -r '[.agents | to_entries[] | select(.value.status == "active")] | .[0].key' "$UI_STATE_FILE" 2>/dev/null | sed 's/vg-//' || echo "unknown")
        if [ "$ACTIVE_COUNT" -eq 1 ]; then
            echo "🔄 $ACTIVE_AGENT │ running"
        else:
            echo "🔄 $ACTIVE_AGENT (+$((ACTIVE_COUNT-1))) │ active"
        fi
    else
        echo "🤖 12 agents │ idle"
    fi

else
    # No parser available - basic parsing
    if grep -q '"status": "active"' "$UI_STATE_FILE" 2>/dev/null; then
        echo "🤖 12 agents │ 1+ active"
    else
        echo "🤖 12 agents │ idle"
    fi
fi
