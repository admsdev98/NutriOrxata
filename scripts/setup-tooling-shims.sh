#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

rm -rf ".gemini"
rm -rf ".opencode"

mkdir -p ".opencode"

ln -s "../skills" ".opencode/skills"
ln -s "../docs" ".opencode/docs"
ln -s "../AGENTS.md" ".opencode/AGENTS.md"

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
./scripts/setup-tooling-shims.sh
```
EOF

echo "Tooling shims ready in .opencode/"
