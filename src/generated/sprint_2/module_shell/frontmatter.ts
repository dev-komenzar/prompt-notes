// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:2 task:2-1 module:shell node:detail:storage_fileformat
// Frontmatter utilities for the Svelte frontend.
// NOTE: Authoritative YAML parsing is Rust-side (serde_yaml).
// These helpers handle UI-level concerns only: template generation, body
// extraction for clipboard copy, and decoration range detection for CodeMirror.

/** YAML frontmatter delimiter */
const FM_DELIMITER = '---';

/**
 * Generate an empty frontmatter template for new notes.
 * Used by module:editor when Cmd+N / Ctrl+N creates a note.
 */
export function createEmptyTemplate(): string {
  return `${FM_DELIMITER}\ntags: []\n${FM_DELIMITER}\n\n`;
}

/**
 * Detect the line range of a frontmatter block in the given text.
 *
 * @returns `{ start, end }` (0-based line indices, inclusive) if a valid
 *          frontmatter block is found, or `null` otherwise.
 *          `start` is the opening `---` line, `end` is the closing `---` line.
 */
export function detectFrontmatterRange(
  text: string,
): { start: number; end: number } | null {
  const lines = text.split('\n');
  if (lines.length === 0 || lines[0].trim() !== FM_DELIMITER) {
    return null;
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FM_DELIMITER) {
      return { start: 0, end: i };
    }
  }
  return null;
}

/**
 * Extract the body text (everything after frontmatter) for clipboard copy.
 * If no valid frontmatter block is found, the entire text is returned.
 *
 * Used by CopyButton.svelte to fulfill AC-ED-05:
 * "本文全体（frontmatter を除く本文テキスト）がクリップボードにコピーされること"
 */
export function extractBody(text: string): string {
  const lines = text.split('\n');
  if (lines.length === 0 || lines[0].trim() !== FM_DELIMITER) {
    return text;
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FM_DELIMITER) {
      // Skip the closing delimiter and any immediately following blank line
      const bodyStart = i + 1;
      const remaining = lines.slice(bodyStart).join('\n');
      // Trim leading newline that separates frontmatter from body
      return remaining.replace(/^\n/, '');
    }
  }
  // Unclosed frontmatter — treat entire text as body
  return text;
}
