#!/usr/bin/env bash
set -euo pipefail

# codd-assemble-wrapper.sh
#
# Wrapper around the AI command for `codd assemble`.
# Enforces strict output discipline via --system-prompt so the model
# produces exclusively === FILE: path === blocks rather than prose,
# Markdown fences, or hallucinated <tool_call> XML.

PROMPT="$(cat)"

claude --print --model claude-opus-4-6 --tools "" \
  --system-prompt 'You are a non-interactive code assembler. You have NO tools — never emit <tool_call>, <tool_use>, <function_calls>, <invoke>, or any XML/JSON tool-use blocks. Do not describe what you plan to do. Do not ask questions. Do not write prose before, between, or after file blocks. Do not wrap content in Markdown fences (```). Output ONLY `=== FILE: <relative/path> ===` headers followed by raw file contents. The first characters of your response MUST be `=== FILE:`.' \
  <<< "$PROMPT"
