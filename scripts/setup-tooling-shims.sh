#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/setup-tooling-shims.sh [--tool TOOL]

Tools:
  opencode      Create minimal .opencode shim (repo-managed)
  antigravity   Create minimal .gemini shims for Antigravity/Gemini (local-only)
  codex         Create minimal .codex shims (local-only)
  vscode        No filesystem shims; print guidance only
  claude-code   No filesystem shims by default; print guidance only

Examples:
  ./scripts/setup-tooling-shims.sh
  ./scripts/setup-tooling-shims.sh --tool opencode
  ./scripts/setup-tooling-shims.sh --tool antigravity
EOF
}

tool=""
if [[ ${1:-} == "--help" || ${1:-} == "-h" ]]; then
  usage
  exit 0
fi
if [[ ${1:-} == "--tool" ]]; then
  tool="${2:-}"
  if [[ -z "$tool" ]]; then
    echo "Missing value for --tool" >&2
    usage
    exit 2
  fi
fi

write_opencode_files() {
  cat > ".opencode/.gitignore" <<'EOF'
node_modules/
dist/
.cache/
*.log
EOF

  cat > ".opencode/README.md" <<'EOF'
# OpenCode Shim

This directory is intentionally minimal.

It only provides symlinks to canonical project sources:

- `skills -> ../skills`
- `docs -> ../docs`
- `AGENTS.md -> ../AGENTS.md`

Recreate this layout anytime with:

```bash
./scripts/setup-tooling-shims.sh --tool opencode
```
EOF
}

setup_opencode() {
  rm -rf ".opencode"
  mkdir -p ".opencode"
  ln -s "../skills" ".opencode/skills"
  ln -s "../docs" ".opencode/docs"
  ln -s "../AGENTS.md" ".opencode/AGENTS.md"
  write_opencode_files
  echo "OK: .opencode shim ready"
}

setup_antigravity() {
  # Local-only directory (ignored by git).
  rm -rf ".gemini"
  mkdir -p ".gemini/antigravity"
  ln -s "../skills" ".gemini/skills"
  ln -s "../skills" ".gemini/antigravity/skills"
  ln -s "../AGENTS.md" ".gemini/AGENTS.md"
  echo "OK: .gemini shims ready (local-only)"
}

setup_codex() {
  # Local-only directory (ignored by git).
  rm -rf ".codex"
  mkdir -p ".codex"
  ln -s "../skills" ".codex/skills"
  ln -s "../docs" ".codex/docs"
  ln -s "../AGENTS.md" ".codex/AGENTS.md"
  cat > ".codex/README.md" <<'EOF'
# Codex Shim (Local)

This folder is optional and local-only.

- `skills -> ../skills`
- `docs -> ../docs`
- `AGENTS.md -> ../AGENTS.md`
EOF
  echo "OK: .codex shims ready (local-only)"
}

guidance_vscode() {
  cat <<'EOF'
VSCode guidance:

- No project shim is required by default.
- If you want shared editor settings, consider `.vscode/` (team decision).
- For AI tools, prefer pointing them at canonical docs: `AGENTS.md` and `docs/README.md`.
EOF
}

guidance_claude_code() {
  cat <<'EOF'
Claude Code guidance:

- Use `AGENTS.md` as the project entry guide.
- Optional: create a local symlink `CLAUDE.md -> AGENTS.md` if your setup expects it.
EOF
}

if [[ -z "$tool" ]]; then
  echo "Select the tool you are using for this repo:"
  select choice in opencode antigravity codex vscode claude-code quit; do
    tool="$choice"
    break
  done
fi

case "$tool" in
  opencode)
    setup_opencode
    ;;
  antigravity)
    setup_antigravity
    ;;
  codex)
    setup_codex
    ;;
  vscode)
    guidance_vscode
    ;;
  claude-code)
    guidance_claude_code
    ;;
  quit|""|*)
    echo "No changes made."
    usage
    exit 1
    ;;
esac
