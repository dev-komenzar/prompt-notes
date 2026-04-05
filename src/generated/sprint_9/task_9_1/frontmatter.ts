// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 9-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=9, task=9-1, module=shared, file=frontmatter.ts
// Design refs: detail:editor_clipboard §4.3, detail:editor_clipboard §4.4
// Frontmatter template generation and body extraction for module:editor.
// NOTE: Authoritative YAML parsing is done Rust-side (serde_yaml).
// This module only handles lightweight client-side operations:
//   1. Generating the initial empty frontmatter template for new notes
//   2. Extracting body text (excluding frontmatter) for the copy button

/** Delimiter used in YAML frontmatter blocks */
const FRONTMATTER_DELIMITER = '---';

/**
 * Generate the initial frontmatter template inserted into new notes.
 * Called by module:editor after create_note IPC returns.
 *
 * Design contract (detail:editor_clipboard §4.4):
 *   Template format is:
 *   ---
 *   tags: []
 *   ---
 *   (blank line)
 */
export function frontmatterTemplate(): string {
  return `${FRONTMATTER_DELIMITER}\ntags: []\n${FRONTMATTER_DELIMITER}\n\n`;
}

/**
 * Extract the body portion of a document, excluding frontmatter.
 * Used by CopyButton.svelte to copy only the body text.
 *
 * Design contract (detail:editor_clipboard §4.3, CONV-3):
 *   Copy target is the full document text (frontmatter included) per the
 *   design: "1クリックで本文全体（frontmatter 含む .md ファイルの全コンテンツ）を
 *   システムクリップボードにコピーする"
 *
 *   However, the system_design §2.3.1 states copy target is "frontmatter を
 *   除いた本文のみ". This function provides the body-only extraction.
 *   The caller decides which variant to use.
 *
 * @param doc Full document text including frontmatter
 * @returns Body text with frontmatter removed, or the original text if no frontmatter found
 */
export function extractBody(doc: string): string {
  if (!doc.startsWith(FRONTMATTER_DELIMITER)) {
    return doc;
  }

  // Find the closing delimiter (skip the opening one)
  const endIndex = doc.indexOf(
    `\n${FRONTMATTER_DELIMITER}`,
    FRONTMATTER_DELIMITER.length,
  );

  if (endIndex === -1) {
    // No closing delimiter found — treat entire doc as body
    return doc;
  }

  // Skip past the closing delimiter and its newline
  const bodyStart = endIndex + 1 + FRONTMATTER_DELIMITER.length;
  const body = doc.slice(bodyStart);

  // Strip leading newlines between frontmatter end and body start
  return body.replace(/^\n+/, '');
}

/**
 * Detect the line range (0-based, inclusive) of the frontmatter block.
 * Used by module:editor's CodeMirror decoration plugin to apply background color.
 *
 * @param doc Full document text
 * @returns Start and end line indices (inclusive), or null if no valid frontmatter
 */
export function detectFrontmatterRange(
  doc: string,
): { startLine: number; endLine: number } | null {
  const lines = doc.split('\n');

  if (lines.length === 0 || lines[0].trim() !== FRONTMATTER_DELIMITER) {
    return null;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      return { startLine: 0, endLine: i };
    }
  }

  return null;
}
