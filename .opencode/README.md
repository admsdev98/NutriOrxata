# OpenCode Shim

This directory is intentionally minimal.

It only provides symlinks to canonical project sources:

- `skills -> ../skills`
- `docs -> ../docs`
- `AGENTS.md -> ../AGENTS.md`

Recreate this layout anytime with:

```bash
mkdir -p .opencode

rm -f .opencode/skills .opencode/docs .opencode/AGENTS.md
ln -s ../skills .opencode/skills
ln -s ../docs .opencode/docs
ln -s ../AGENTS.md .opencode/AGENTS.md
```
