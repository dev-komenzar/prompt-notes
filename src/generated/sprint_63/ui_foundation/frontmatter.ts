// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan > detail:editor_clipboard > detail:storage_fileformat
//
// NOTE: Authoritative YAML frontmatter parsing is performed by module:storage (Rust, serde_yaml).
// This module provides lightweight frontend-only helpers for:
//   1. Generating the initial frontmatter template for new notes
//   2. Extracting body text (excluding frontmatter) for the copy button
//   3. Detecting frontmatter line ranges for CodeMirror background decoration

/** The initial frontmatter template inserted into newly created notes. */
export const FRONTMATTER_TEMPLATE = `---\ntags: []\n---\n\n`;

/** Delimiter string for YAML frontmatter blocks. */
const DELIMITER = '---';

/**
 * Finds the line range [startLine, endLine] (0-based, inclusive) of the YAML frontmatter block.
 * Returns null if no valid frontmatter is detected.
 *
 * Detection logic mirrors the Rust-side approach:
 *   1. First line must be exactly "---"
 *   2. Search subsequent lines for the closing "---"
 *   3. Return the inclusive line range
 */
export function detectFrontmatterRange(
  doc: string,
): { startLine: number; endLine: number } | null {
  const lines = doc.split('\n');
  if (lines.length === 0 || lines[0].trim() !== DELIMITER) {
    return null;
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === DELIMITER) {
      return { startLine: 0, endLine: i };
    }
  }
  return null;
}

/**
 * Extracts the body text, excluding frontmatter.
 * Used by CopyButton.svelte — the copy target is the full document text
 * as per CONV-3 (1-click copy copies frontmatter-included full content per
 * the editor_clipboard design: "frontmatter 含む .md ファイルの全コンテンツ").
 *
 * UPDATE: Per the detailed design (detail:editor_clipboard §3 CONV-3),
 * copy target is the FULL document including frontmatter.
 * This function returns the full text as-is.
 */
export function getCopyText(fullDocText: string): string {
  return fullDocText;
}

/**
 * Extracts only the body portion (after frontmatter) for display in grid card previews.
 * This is used for client-side preview rendering only — the authoritative body_preview
 * is computed by module:storage (Rust).
 */
export function extractBodyAfterFrontmatter(doc: string): string {
  const range = detectFrontmatterRange(doc);
  if (range === null) return doc;
  const lines = doc.split('\n');
  return lines.slice(range.endLine + 1).join('\n').trimStart();
}
