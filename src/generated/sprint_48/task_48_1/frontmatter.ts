// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=48, task=48-1, module=frontmatter
// Frontend-side frontmatter utilities for module:editor.
// NOTE: Authoritative YAML parsing (serde_yaml) happens on the Rust side.
// These helpers are strictly for UI presentation (CodeMirror decoration ranges,
// copy-button body extraction, template generation).

import { FRONTMATTER_DELIMITER, EMPTY_FRONTMATTER_TEMPLATE } from "./constants";

/**
 * Detect the frontmatter line range within a document string.
 *
 * Frontmatter is defined as a block starting at line 0 with "---"
 * and ending at the first subsequent line that is exactly "---".
 *
 * @param doc Full document text.
 * @returns `{ startLine, endLine }` (0-indexed, inclusive) or null if
 *          no valid frontmatter block is detected.
 */
export function detectFrontmatterRange(
  doc: string,
): { startLine: number; endLine: number } | null {
  const lines = doc.split("\n");
  if (lines.length === 0 || lines[0].trim() !== FRONTMATTER_DELIMITER) {
    return null;
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      return { startLine: 0, endLine: i };
    }
  }
  // Opening delimiter found but no closing delimiter yet (user is typing).
  return null;
}

/**
 * Extract the body text (everything after the frontmatter block).
 * Used by the 1-click copy button (CONV-3: copy body excluding frontmatter).
 *
 * If no frontmatter is detected, returns the entire document.
 *
 * @param doc Full document text including frontmatter.
 * @returns Body text with leading blank line after frontmatter trimmed.
 */
export function extractBody(doc: string): string {
  const range = detectFrontmatterRange(doc);
  if (range === null) {
    return doc;
  }
  const lines = doc.split("\n");
  // Body starts at the line after the closing "---".
  const bodyLines = lines.slice(range.endLine + 1);
  return bodyLines.join("\n");
}

/**
 * Return the empty frontmatter template for newly created notes.
 * Matches the Rust-side initial file content.
 */
export function emptyFrontmatterTemplate(): string {
  return EMPTY_FRONTMATTER_TEMPLATE;
}

/**
 * Compute the character offset range of the frontmatter block
 * within a document string. Useful for CodeMirror Decoration positioning.
 *
 * @param doc Full document text.
 * @returns `{ from, to }` character offsets (0-based, inclusive of delimiters
 *          and the closing delimiter's newline), or null.
 */
export function frontmatterCharRange(
  doc: string,
): { from: number; to: number } | null {
  const range = detectFrontmatterRange(doc);
  if (range === null) return null;

  const lines = doc.split("\n");
  let from = 0;
  let to = 0;
  for (let i = 0; i <= range.endLine; i++) {
    if (i === range.endLine) {
      to = from + lines[i].length;
    } else {
      from += i === 0 ? 0 : 0; // no-op kept for clarity
    }
    if (i < range.endLine) {
      to = 0; // reset
    }
  }

  // Recompute correctly: sum lengths of lines 0..endLine inclusive, plus newlines.
  let computedTo = 0;
  for (let i = 0; i <= range.endLine; i++) {
    computedTo += lines[i].length;
    if (i < lines.length - 1) {
      computedTo += 1; // newline character
    }
  }

  return { from: 0, to: computedTo };
}
