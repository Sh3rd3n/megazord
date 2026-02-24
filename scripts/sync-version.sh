#!/usr/bin/env bash
# Sync version from package.json to .claude-plugin/plugin.json
# Called as prebuild step to keep a single source of truth

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PKG="$ROOT_DIR/package.json"
PLUGIN="$ROOT_DIR/.claude-plugin/plugin.json"

VERSION=$(grep '"version"' "$PKG" | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

if [ -z "$VERSION" ]; then
  echo "Error: could not read version from package.json" >&2
  exit 1
fi

if [ -f "$PLUGIN" ]; then
  sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$PLUGIN"
  echo "Synced version $VERSION to plugin.json"
fi
