#!/usr/bin/env bash
# Sync version from package.json to all version references
# Called as prebuild step to keep a single source of truth

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PKG="$ROOT_DIR/package.json"
PLUGIN="$ROOT_DIR/.claude-plugin/plugin.json"
HERO_SVG="$ROOT_DIR/assets/megazord-hero.svg"

VERSION=$(grep '"version"' "$PKG" | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

if [ -z "$VERSION" ]; then
  echo "Error: could not read version from package.json" >&2
  exit 1
fi

if [ -f "$PLUGIN" ]; then
  sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$PLUGIN"
  echo "Synced version $VERSION to plugin.json"
fi

if [ -f "$HERO_SVG" ]; then
  sed -i '' "s/>v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*</>v$VERSION</" "$HERO_SVG"
  echo "Synced version $VERSION to megazord-hero.svg"
fi
