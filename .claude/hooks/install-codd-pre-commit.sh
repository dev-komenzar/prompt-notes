#!/usr/bin/env bash
set -euo pipefail

HOOK_PATH="${CLAUDE_PROJECT_DIR}/.git/hooks/pre-commit"

cat > "$HOOK_PATH" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "[CoDD] validating dependency graph before commit..."
codd validate --path .
EOF

chmod +x "$HOOK_PATH"
