#!/bin/bash
# install.sh — symlink Perfect Goal skill + slash commands into Claude Code and Codex CLI homes.
# Idempotent. Re-running updates the symlinks to point at this repo's current path.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[perfect-goal] repo: $REPO_DIR"

# --- Claude Code ---
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"
mkdir -p "$CLAUDE_HOME/skills" "$CLAUDE_HOME/commands"

# Skill
ln -sfn "$REPO_DIR/skills/perfect-goal" "$CLAUDE_HOME/skills/perfect-goal"
echo "[perfect-goal] claude skill: $CLAUDE_HOME/skills/perfect-goal -> $REPO_DIR/skills/perfect-goal"

# Slash command
ln -sfn "$REPO_DIR/commands/claude/perfect-goal.md" "$CLAUDE_HOME/commands/perfect-goal.md"
echo "[perfect-goal] claude command: $CLAUDE_HOME/commands/perfect-goal.md -> $REPO_DIR/commands/claude/perfect-goal.md"

# --- Codex CLI ---
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
mkdir -p "$CODEX_HOME/prompts"

ln -sfn "$REPO_DIR/commands/codex/perfect-goal.md" "$CODEX_HOME/prompts/perfect-goal.md"
echo "[perfect-goal] codex command: $CODEX_HOME/prompts/perfect-goal.md -> $REPO_DIR/commands/codex/perfect-goal.md"

# --- Reference files (framework docs accessible from inside the skill dir) ---
# Symlink the top-level framework docs into the skill dir so the skill's
# instructions can reference them as siblings of SKILL.md. Use RELATIVE paths
# so the links survive repo relocations and fresh clones.
for f in TEMPLATE.md METHODOLOGY.md RUBRIC.md GOAL-TYPES.md README.md; do
    ln -sfn "../../$f" "$REPO_DIR/skills/perfect-goal/$f"
done
echo "[perfect-goal] framework docs symlinked into skill dir (relative)"

# --- Verify ---
echo
echo "[perfect-goal] verifying installation..."

verify() {
    local path="$1"
    local label="$2"
    if [ -L "$path" ] && [ -e "$path" ]; then
        echo "  OK   $label"
    else
        echo "  FAIL $label ($path missing or broken)"
        return 1
    fi
}

verify "$CLAUDE_HOME/skills/perfect-goal" "Claude Code skill"
verify "$CLAUDE_HOME/commands/perfect-goal.md" "Claude Code slash command"
verify "$CODEX_HOME/prompts/perfect-goal.md" "Codex CLI slash command"

echo
echo "[perfect-goal] DONE."
echo
echo "Usage:"
echo "  Claude Code:  /perfect-goal <topic or 'from recent history'>"
echo "  Codex CLI:    /perfect-goal <topic or 'from recent history'>"
echo
echo "Flags (both):  --window=N --scope=wide|tight --tier=A|AB|ABC --type=<type> --save[=path]"
echo
echo "Uninstall:"
echo "  rm $CLAUDE_HOME/skills/perfect-goal"
echo "  rm $CLAUDE_HOME/commands/perfect-goal.md"
echo "  rm $CODEX_HOME/prompts/perfect-goal.md"
