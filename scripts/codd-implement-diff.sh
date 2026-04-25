#!/usr/bin/env bash
# codd-implement-diff.sh
#
# Wrapper for `codd implement` (v1.8+, task-based) that turns full-task
# regeneration into file-level differential implementation.
#
# Strategy:
#   1. Detect codd version; refuse to run on < 1.8 (sprint layout, unsupported).
#   2. Receive the standard CoDD prompt via stdin.
#   3. Extract the target output directory (src/generated/<slug>/)
#      from the prompt.
#   4. Append: existing file listing + recent docs/ git diff +
#      diff-mode directive that tells Claude to omit unchanged files.
#   5. Call `claude --print` with Read/Grep/Glob enabled so Claude can
#      inspect existing implementation autonomously.
#   6. Write/Edit are NOT enabled — CoDD itself performs file writes
#      via the === FILE: === protocol.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# --- 1. Version guard --------------------------------------------------------
CODD_VERSION="$(codd --version 2>/dev/null | awk '{print $NF}')"
if [[ -z "$CODD_VERSION" ]]; then
  echo "Error: 'codd --version' を実行できませんでした。" >&2
  exit 1
fi

# CODD_VERSION < 1.8.0 (= <= 1.7.99) なら停止
if [[ "$(printf '%s\n%s\n' "$CODD_VERSION" "1.7.99" | sort -V | tail -1)" == "1.7.99" ]]; then
  cat >&2 <<EOF
Error: codd ${CODD_VERSION} は本 wrapper (v1.8+ 専用) では非対応です。

理由: v1.8 未満は src/generated/sprint_N/<slug>/ レイアウトを使用しており、
本スクリプトが前提とするタスクベースのフラット展開
(src/generated/<slug>/) とは異なります。

対応:
  1. codd を 1.8 以上にアップグレードする: uv tool upgrade codd-dev
  2. もしくは v1.7 対応版 (scripts/codd-implement-diff-v17.sh) を使用する。
EOF
  exit 1
fi

# --- 2. Read prompt from stdin ----------------------------------------------
PROMPT="$(cat)"

# --- 3. Extract Output directory / Task ID from prompt ----------------------
OUTPUT_DIR=""
TASK_ID=""
while IFS= read -r line; do
  case "$line" in
    "Output directory: "*) OUTPUT_DIR="${line#Output directory: }" ;;
    "Task ID: "*)          TASK_ID="${line#Task ID: }" ;;
  esac
done <<< "$PROMPT"

# --- 4. Pass-through fallback if extraction failed --------------------------
if [[ -z "$OUTPUT_DIR" ]]; then
  echo "Warning: 'Output directory:' をプロンプトから抽出できませんでした。素通しで実行します。" >&2
  exec claude --print --model claude-sonnet-4-6 --tools "" <<< "$PROMPT"
fi

ABS_OUTPUT_DIR="${PROJECT_ROOT}/${OUTPUT_DIR}"

# --- 5. List existing files in target output directory ---------------------
EXISTING_FILES=""
if [[ -d "$ABS_OUTPUT_DIR" ]]; then
  EXISTING_FILES="$(cd "$PROJECT_ROOT" && find "$OUTPUT_DIR" -type f \
    \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \
       -o -name '*.rs' -o -name '*.svelte' \) \
    | sort)"
fi

# --- 6. Capture recent docs diff (best-effort, never fatal) ----------------
# CODD_DIFF_REF で diff の基準を変更可能 (default: HEAD~1)
#   例: CODD_DIFF_REF=HEAD~3 codd implement --task 2-1
#        CODD_DIFF_REF=main  codd implement --task 2-1
CODD_DIFF_REF="${CODD_DIFF_REF:-HEAD~1}"
DOC_DIFF=""
if git -C "$PROJECT_ROOT" rev-parse --verify "$CODD_DIFF_REF" >/dev/null 2>&1; then
  DOC_DIFF="$(git -C "$PROJECT_ROOT" --no-pager diff --unified=3 "$CODD_DIFF_REF" -- docs/ 2>/dev/null || true)"
else
  DOC_DIFF="$(git -C "$PROJECT_ROOT" --no-pager diff --unified=3 HEAD -- docs/ 2>/dev/null || true)"
fi

# --- 7. Build augmented prompt ---------------------------------------------
if [[ -z "$EXISTING_FILES" ]]; then
  # Greenfield: no existing files. Skip diff mode and let Claude generate from scratch.
  AUGMENTED="$PROMPT"
else
  AUGMENTED="${PROMPT}

---
DIFF-MODE DIRECTIVE (overrides the default \"full task regeneration\"):

You have Read/Grep/Glob tools available. Use them to inspect the CURRENT
state of the following existing files in the target output directory
(paths are relative to project root: ${PROJECT_ROOT}):

${EXISTING_FILES}

Procedure:
1. Read the existing files to understand their current behavior.
2. Compare against the spec sections in the prompt above and the recent
   document diff below.
3. Determine the MINIMAL set of files that must change to satisfy the
   updated spec.
4. Emit \"=== FILE: <path> ===\" blocks ONLY for files that require change:
   - Unchanged files: OMIT entirely (CoDD will preserve them as-is).
   - Changed files: re-emit FULL content (no partial patches; CoDD has
     no patch applicator and will overwrite the file with what you emit).
   - New files required by the new spec: emit normally under ${OUTPUT_DIR}/.
   - Obsolete files: cannot be removed via this interface; list them in a
     trailing \"=== OBSOLETE ===\" block (one path per line) for human review.
5. If NOTHING needs to change, re-emit ONE existing file verbatim
   (CoDD treats empty output as a fatal error).
6. Do NOT modify the leading \"// @generated-by: codd implement\" comment
   block of existing files; CoDD re-prepends it idempotently.

Recent document diff (focus your changes on areas affected by these edits):
<<<DOC_DIFF
${DOC_DIFF:-(no diff available)}
DOC_DIFF
"
fi

# --- 8. Invoke Claude Code with read-only tools ----------------------------
# cd into project root so Read/Grep/Glob can resolve relative paths cleanly.
cd "$PROJECT_ROOT"
exec claude --print \
  --model claude-sonnet-4-6 \
  --tools "Read,Grep,Glob" \
  --system-prompt "Output ONLY === FILE: === blocks (and optionally one trailing === OBSOLETE === block). Never wrap output in Markdown fences for the overall response. Never add prose, summaries, headings, or explanatory text outside the required blocks. Code inside FILE blocks should still use \`\`\`ts / \`\`\`tsx fences as required by the CoDD output format." \
  <<< "$AUGMENTED"
