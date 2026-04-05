// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:4 task:4-1 module:shell file:frontmatter.ts
// Lightweight frontmatter utilities for the frontend.
// Full YAML parsing (serde_yaml) is the Rust backend's responsibility.
// This module handles:
//   - Extracting body text (for clipboard copy, excluding frontmatter)
//   - Generating the empty template for new notes
//   - Detecting frontmatter boundaries (for CodeMirror decoration)

/**
 * The frontmatter template inserted into newly created notes.
 * Matches the format expected by module:storage's serde_yaml parser.
 */
export const FRONTMATTER_TEMPLATE = '---\ntags: []\n---\n\n';

/**
 * Frontmatter boundary detection result.
 * Used by CodeMirror decoration to apply background color.
 */
export interface FrontmatterRange {
  /** 0-based line index of the opening '---' */
  readonly startLine: number;
  /** 0-based line index of the closing '---' (inclusive) */
  readonly endLine: number;
}

/**
 * Detect the frontmatter block boundaries in a document string.
 * Returns null if no valid frontmatter block is found.
 *
 * Detection rules (matching module:storage Rust-side logic):
 * 1. First line must be exactly '---'
 * 2. Scan subsequent lines for the next '---'-only line
 * 3. If found, the range [0, closingLineIndex] is the frontmatter block
 */
export function detectFrontmatter(doc: string): FrontmatterRange | null {
  const lines = doc.split('\n');
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return null;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return { startLine: 0, endLine: i };
    }
  }

  return null;
}

/**
 * Extract the body text from a note document, excluding the frontmatter block.
 * Used by the copy button to copy body-only content to clipboard.
 *
 * Per CONV-3 (editor_clipboard_design): copy target is the full document
 * including frontmatter. This function is provided for cases where
 * body-only extraction is needed (e.g., preview generation).
 *
 * NOTE: The CopyButton copies EditorView.state.doc.toString() (full content).
 * This function is a utility, not the copy button's data source.
 */
export function extractBody(doc: string): string {
  const range = detectFrontmatter(doc);
  if (range === null) {
    return doc;
  }

  const lines = doc.split('\n');
  // Skip frontmatter lines and the first blank line after closing ---
  let bodyStart = range.endLine + 1;
  if (bodyStart < lines.length && lines[bodyStart].trim() === '') {
    bodyStart++;
  }

  return lines.slice(bodyStart).join('\n');
}
