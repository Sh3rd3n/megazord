#!/bin/bash
# File ownership enforcement for Megazord Agent Teams
# PreToolUse hook: blocks or warns when agents modify files outside their declared scope
# Reads agent context from .mz-agent-context.json in the project directory

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.file // empty')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only enforce for Edit and Write tools
if [ "$TOOL_NAME" != "Edit" ] && [ "$TOOL_NAME" != "Write" ]; then
  exit 0
fi

# Skip if no file path (shouldn't happen for Edit/Write)
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Look for agent context file in the current project directory
CONTEXT_FILE="${CLAUDE_PROJECT_DIR:-.}/.mz-agent-context.json"
if [ ! -f "$CONTEXT_FILE" ]; then
  exit 0  # Not in Agent Teams mode, allow everything
fi

AGENT_NAME=$(jq -r '.agent_name // empty' "$CONTEXT_FILE")
if [ -z "$AGENT_NAME" ]; then
  exit 0  # No agent name, allow
fi

# Read owned files from context
OWNED_FILES=$(jq -r '.owned_files // [] | .[]' "$CONTEXT_FILE")
if [ -z "$OWNED_FILES" ]; then
  exit 0  # No file restrictions, allow
fi

# Normalize file path: strip absolute prefix to get relative path
# Handle both absolute paths and relative paths
NORM_PATH="$FILE_PATH"
if [[ "$NORM_PATH" == /* ]]; then
  # Try to make relative to project dir
  PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
  NORM_PATH="${NORM_PATH#$PROJECT_DIR/}"
fi
# Also strip leading ./
NORM_PATH="${NORM_PATH#./}"

# Check if the file is in the agent's declared scope (prefix match)
ALLOWED=false
while IFS= read -r owned; do
  if [ -z "$owned" ]; then continue; fi
  if [[ "$NORM_PATH" == "$owned" ]] || [[ "$NORM_PATH" == "$owned"/* ]]; then
    ALLOWED=true
    break
  fi
done <<< "$OWNED_FILES"

if [ "$ALLOWED" = false ]; then
  # Check strict mode from context file
  STRICT=$(jq -r '.strict_ownership // false' "$CONTEXT_FILE")

  SCOPE_LIST=$(jq -r '.owned_files // [] | join(", ")' "$CONTEXT_FILE")

  if [ "$STRICT" = "true" ]; then
    echo "OWNERSHIP VIOLATION: Agent '$AGENT_NAME' attempted to modify '$NORM_PATH' which is outside its declared scope." >&2
    echo "Declared files: $SCOPE_LIST" >&2
    exit 2  # Hard block
  else
    # Advisory mode: warn but allow
    echo "OWNERSHIP WARNING: Agent '$AGENT_NAME' is modifying '$NORM_PATH' outside its declared scope ($SCOPE_LIST). Proceeding (advisory mode)." >&2
    exit 0
  fi
fi

exit 0
