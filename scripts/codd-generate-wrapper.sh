#!/usr/bin/env bash
set -euo pipefail

# codd-generate-wrapper.sh
#
# Wrapper around the AI command for `codd generate`.
# Injects the existing document body into the prompt so the AI
# can produce minimal diffs instead of rewriting from scratch.

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODD_YAML="${PROJECT_ROOT}/codd/codd.yaml"

# 1. Read the full prompt from stdin
PROMPT="$(cat)"

# 2. Extract the Node ID from the prompt (pure bash — avoids SIGPIPE from
#    `grep -m1` closing its stdin while a large prompt is still being piped in)
NODE_ID=""
while IFS= read -r line; do
  if [[ "$line" == "Node ID: "* ]]; then
    NODE_ID="${line#Node ID: }"
    break
  fi
done <<< "$PROMPT"

if [[ -z "$NODE_ID" ]]; then
  # No Node ID found — pass the prompt through unchanged
  claude --print --model claude-opus-4-6 --tools "" \
    --system-prompt "Output ONLY the requested content. Never wrap output in Markdown fences. Never add summaries, headings, or explanatory prose before or after the output." \
    <<< "$PROMPT"
  exit 0
fi

# 3. Look up the output file path from codd.yaml
#    The YAML structure has lines like:
#      - node_id: detail:component_architecture
#        output: docs/detailed_design/component_architecture.md
#    We find the node_id line and grab the next "output:" line.
OUTPUT_REL="$(awk -v nid="$NODE_ID" '
  $0 ~ "node_id: " nid "$" { found=1; next }
  found && /output:/ { sub(/.*output: */, ""); print; exit }
  found && /node_id:/ { found=0 }
' "$CODD_YAML")"

OUTPUT_FILE="${PROJECT_ROOT}/${OUTPUT_REL}"

# 4. If the output file exists, inject it into the prompt
if [[ -n "$OUTPUT_REL" && -f "$OUTPUT_FILE" ]]; then
  # Strip YAML frontmatter (lines between opening and closing --- at the start)
  BODY="$(awk '
    BEGIN { in_fm=0; past_fm=0 }
    NR==1 && /^---[[:space:]]*$/ { in_fm=1; next }
    in_fm && /^---[[:space:]]*$/ { in_fm=0; past_fm=1; next }
    in_fm { next }
    { print }
  ' "$OUTPUT_FILE")"

  # Only inject if there is non-empty body content
  if [[ -n "${BODY// /}" ]]; then
    PROMPT="${PROMPT}

--- PREVIOUS DOCUMENT BODY (minimize changes) ---
The following is the current version of this document.
You MUST preserve the existing structure and wording as much as possible.
Only modify sections where upstream dependency documents have changed.
Do not reorganize, rephrase, or rewrite sections that are already correct.
If a section needs no changes, reproduce it verbatim.
${BODY}
--- END PREVIOUS DOCUMENT BODY ---"
  fi
fi

# 5. Feed the (possibly augmented) prompt to the AI via here-string
#    (avoids SIGPIPE=141 if claude closes stdin before echo finishes writing)
claude --print --model claude-opus-4-6 --tools "" \
  --system-prompt "Output ONLY the requested content. Never wrap output in Markdown fences. Never add summaries, headings, or explanatory prose before or after the output." \
  <<< "$PROMPT"
