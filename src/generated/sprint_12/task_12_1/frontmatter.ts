// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=12 task=12-1 module=frontmatter
// Frontend-side frontmatter utilities for CodeMirror 6 integration.
// NOTE: Authoritative YAML parsing is done by Rust (serde_yaml).
// These utilities handle presentation concerns only:
//   - Detecting frontmatter line ranges for background color decoration
//   - Extracting body text for clipboard copy (AC-ED-05: exclude frontmatter)
//   - Generating empty frontmatter template for new notes

import { FRONTMATTER_DELIMITER, FRONTMATTER_TEMPLATE } from './constants';

/**
 * Represents the line range of a detected frontmatter block.
 * Line numbers are 1-based to match CodeMirror conventions.
 */
export interface FrontmatterRange {
  /** Line number of the opening "---" (1-based) */
  readonly startLine: number;
  /** Line number of the closing "---" (1-based) */
  readonly endLine: number;
}

/**
 * Detect the frontmatter block range in a document string.
 * Returns null if no valid frontmatter (opening + closing ---) is found.
 *
 * Detection logic (matches Rust-side behavior):
 *   1. First line must be exactly "---"
 *   2. Search subsequent lines for the next "---" only line
 *   3. Return the range [startLine, endLine] inclusive
 */
export function detectFrontmatterRange(doc: string): FrontmatterRange | null {
  const lines = doc.split('\n');
  if (lines.length === 0) return null;

  // First line must be the opening delimiter
  if (lines[0].trim() !== FRONTMATTER_DELIMITER) return null;

  // Search for closing delimiter starting from line 2 (index 1)
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      return {
        startLine: 1,
        endLine: i + 1, // Convert 0-based index to 1-based line number
      };
    }
  }

  // No closing delimiter found — incomplete frontmatter
  return null;
}

/**
 * Extract the body text from a document, excluding the frontmatter block.
 * Used by CopyButton for clipboard copy (AC-ED-05).
 *
 * If no valid frontmatter is detected, returns the entire document.
 */
export function extractBody(doc: string): string {
  const lines = doc.split('\n');
  if (lines.length === 0) return doc;

  if (lines[0].trim() !== FRONTMATTER_DELIMITER) return doc;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      // Return everything after the closing delimiter.
      // Skip the first blank line after frontmatter if present.
      const afterFm = lines.slice(i + 1);
      const body = afterFm.join('\n');
      // Trim leading single newline (the conventional blank line after ---)
      return body.startsWith('\n') ? body.slice(1) : body;
    }
  }

  // No closing delimiter — return entire document
  return doc;
}

/**
 * Returns the empty frontmatter template for new notes.
 * Template:
 *   ---
 *   tags: []
 *   ---
 *   (blank line)
 */
export function getFrontmatterTemplate(): string {
  return FRONTMATTER_TEMPLATE;
}

/**
 * Compute the character offset range of the frontmatter block in a document string.
 * Returns { from, to } as character offsets suitable for CodeMirror Decoration.
 * Returns null if no valid frontmatter is found.
 */
export function getFrontmatterCharRange(doc: string): { from: number; to: number } | null {
  const lines = doc.split('\n');
  if (lines.length === 0 || lines[0].trim() !== FRONTMATTER_DELIMITER) return null;

  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineEnd = offset + lines[i].length;
    if (i > 0 && lines[i].trim() === FRONTMATTER_DELIMITER) {
      // Include the closing delimiter line and its newline
      return { from: 0, to: Math.min(lineEnd + 1, doc.length) };
    }
    offset = lineEnd + 1; // +1 for the \n character
  }

  return null;
}
