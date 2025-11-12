#!/bin/bash

################################################################################
# Vigil Guard - Claude Code Wrapper with tmux Status Bar
# 
# Purpose: Runs Claude Code in a tmux session with real-time agent status bar
# Usage: ./scripts/claude-code-wrapper.sh
# Alias: Add to ~/.zshrc: alias vg-claude="$(pwd)/scripts/claude-code-wrapper.sh"
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root (assuming script is in scripts/)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check if tmux is available
if ! command -v tmux &> /dev/null; then
    echo -e "${YELLOW}⚠️  tmux not found. Running Claude Code without status bar.${NC}"
    echo ""
    echo "To install tmux:"
    echo "  • macOS: brew install tmux"
    echo "  • Ubuntu: sudo apt-get install tmux"
    echo ""
    exec claude-code "$@"
    exit 0
fi

# Check if already in tmux session
if [ -n "$TMUX" ]; then
    # Already in tmux, just run Claude Code
    exec claude-code "$@"
    exit 0
fi

# Check if .claude-code/ directory exists
if [ ! -d "$PROJECT_ROOT/.claude-code" ]; then
    echo -e "${YELLOW}⚠️  .claude-code/ directory not found${NC}"
    echo ""
    echo "Creating .claude-code/ directory..."
    mkdir -p "$PROJECT_ROOT/.claude-code/state"
    echo -e "${GREEN}✅ Created .claude-code/ directory${NC}"
    echo ""
fi

# Create named tmux session with timestamp
SESSION_NAME="vigil-claude-$$"

echo -e "${BLUE}🚀 Starting Claude Code with tmux status bar...${NC}"
echo -e "${BLUE}   Session: ${SESSION_NAME}${NC}"
echo ""

# Create new detached tmux session
tmux new-session -d -s "$SESSION_NAME" -n "Claude Code" -c "$PROJECT_ROOT"

# Configure tmux status bar
tmux set-option -t "$SESSION_NAME" status on
tmux set-option -t "$SESSION_NAME" status-interval 1  # Update every 1 second
tmux set-option -t "$SESSION_NAME" status-position top
tmux set-option -t "$SESSION_NAME" status-style "bg=colour235,fg=colour136"
tmux set-option -t "$SESSION_NAME" status-left-length 50
tmux set-option -t "$SESSION_NAME" status-right-length 100

# Status bar format
# Left: 🤖 Vigil Guard Agents │
tmux set-option -t "$SESSION_NAME" status-left "#[fg=colour166,bold]🤖 Vigil Guard Agents #[fg=colour244]│ "

# Right: Agent activity (updated from .claude-code/ui-state.json)
# Use absolute path to status script
STATUS_SCRIPT="$PROJECT_ROOT/scripts/tmux-agent-status.sh"
tmux set-option -t "$SESSION_NAME" status-right "#(bash $STATUS_SCRIPT)"

# Window status format (center)
tmux set-option -t "$SESSION_NAME" window-status-format "#[fg=colour244] #W "
tmux set-option -t "$SESSION_NAME" window-status-current-format "#[fg=colour166,bold] #W "

# Send command to run Claude Code
tmux send-keys -t "$SESSION_NAME" "cd '$PROJECT_ROOT' && claude-code $*" C-m

# Attach to session
echo -e "${GREEN}✅ tmux session created${NC}"
echo -e "${BLUE}   Status bar will show agent activity in real-time${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: Use Ctrl+B then D to detach from session${NC}"
echo -e "${YELLOW}   To reattach: tmux attach -t ${SESSION_NAME}${NC}"
echo ""
sleep 1

tmux attach-session -t "$SESSION_NAME"

# Cleanup on exit
echo ""
echo -e "${BLUE}🧹 Cleaning up tmux session...${NC}"
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
echo -e "${GREEN}✅ Session cleaned up${NC}"
