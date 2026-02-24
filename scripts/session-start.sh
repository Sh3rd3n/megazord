#!/usr/bin/env bash
# Megazord session start — banner + lifecycle messages
# Called by Claude Code SessionStart hook

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"

# ── 1. Banner ──────────────────────────────────────────────────────────────────
VERSION_FILE="$PLUGIN_DIR/.version"
VERSION="unknown"
[ -f "$VERSION_FILE" ] && VERSION=$(cat "$VERSION_FILE")
bash "$SCRIPT_DIR/banner.sh" "$VERSION"

# ── 2. Lifecycle messages ──────────────────────────────────────────────────────
LAST_SEEN_FILE="$PLUGIN_DIR/.last-seen-version"
CHANGELOG_FILE="$PLUGIN_DIR/CHANGELOG.md"
UPDATE_CHECK_FILE="$PLUGIN_DIR/.update-check"

# No .version file means not installed — banner only, exit silently
[ -f "$VERSION_FILE" ] || exit 0
CURRENT=$(cat "$VERSION_FILE")

# First-install edge case: .last-seen-version missing — create it and exit silently
# (no changelog on first session, prevents spurious changelog display)
if [ ! -f "$LAST_SEEN_FILE" ]; then
  printf '%s' "$CURRENT" > "$LAST_SEEN_FILE"
  exit 0
fi

LAST_SEEN=$(cat "$LAST_SEEN_FILE")

# ── 2a. Changelog mode: .version != .last-seen-version ────────────────────────
if [ "$CURRENT" != "$LAST_SEEN" ] && [ -f "$CHANGELOG_FILE" ]; then
  # Extract latest version section from CHANGELOG.md (Keep a Changelog format)
  # Skip ## [Unreleased], find first ## [x.y.z], extract until next ## [ or EOF
  # Skip link reference lines like [x.y.z]: https://...
  CHANGELOG=$(awk '
    /^## \[[0-9]/ { if (found) exit; found=1; next }
    /^## \[/ && found { exit }
    /^\[.*\]:/ { next }
    found { print }
  ' "$CHANGELOG_FILE")

  # Trim leading/trailing blank lines
  CHANGELOG=$(printf '%s' "$CHANGELOG" | sed '/^[[:space:]]*$/d' | \
    awk 'BEGIN{found=0} /[^[:space:]]/{found=1} found{print}')

  if [ -n "$CHANGELOG" ]; then
    DIM='\033[2m'
    BOLD='\033[1m'
    RESET='\033[0m'
    SEP='───────────────────────────────────────────────'

    printf "\n"
    printf "${DIM}%s${RESET}\n" "$SEP"
    printf "${BOLD}What's New in v${CURRENT}${RESET}\n"
    printf "${DIM}%s${RESET}\n" "$SEP"
    printf "%s\n" "$CHANGELOG"
    printf "${DIM}%s${RESET}\n" "$SEP"
    printf "\n"
  fi

  # Mark as seen — changelog shows only once per update
  printf '%s' "$CURRENT" > "$LAST_SEEN_FILE"
  exit 0
fi

# ── 2b. Update notification mode: .version == .last-seen-version ──────────────
if [ -f "$UPDATE_CHECK_FILE" ]; then
  # Parse .update-check JSON for latest and current versions
  LATEST=$(grep -o '"latest"[[:space:]]*:[[:space:]]*"[^"]*"' "$UPDATE_CHECK_FILE" | \
    head -1 | grep -o '"[^"]*"$' | tr -d '"')
  CHECK_CURRENT=$(grep -o '"current"[[:space:]]*:[[:space:]]*"[^"]*"' "$UPDATE_CHECK_FILE" | \
    head -1 | grep -o '"[^"]*"$' | tr -d '"')

  if [ -n "$LATEST" ] && [ -n "$CHECK_CURRENT" ] && [ "$LATEST" != "$CHECK_CURRENT" ]; then
    YELLOW='\033[33m'
    BOLD='\033[1m'
    RESET='\033[0m'
    printf "${YELLOW}${BOLD}\u2b06 Megazord v${LATEST} available${RESET}${YELLOW} \u2014 run: ${BOLD}bunx megazord-cli@latest update${RESET}\n"
    printf "\n"
  fi
fi

# Fire background update check for next session (non-blocking)
if command -v megazord &>/dev/null; then
  megazord tools check-update &>/dev/null &
elif command -v megazord-cli &>/dev/null; then
  megazord-cli tools check-update &>/dev/null &
fi
