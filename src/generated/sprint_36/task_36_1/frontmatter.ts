// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Frontmatter Utilities
// Frontend-side frontmatter operations for CodeMirror decoration and copy.
// YAML parsing/deserialization is exclusively owned by module:storage (Rust side).
// These utilities only handle structural detection (delimiter-based) for UI purposes.
// CoDD trace: detail:editor_clipboard, detail:storage_fileformat

import { FRONTMATTER_DELIMITER } from "./constants";

/**
 * Represents the detected frontmatter region in a document.
 * Line numbers are 1-based to match CodeMirror line numbering.
 */
export interface FrontmatterRange {
  /** 1-based line number of the opening delimiter (---) */
  readonly startLine: number;
  /** 1-based line number of the closing delimiter (---) */
  readonly endLine: number;
  /** 0-based character offset of the start of the frontmatter block */
  readonly from: number;
  /** 0-based character offset of the end of the frontmatter block (after closing ---) */
  readonly to: number;
}

/**
 * Detect the frontmatter region in a document string.
 * Frontmatter must start at the very beginning of the document with "---"
 * and be closed by another "---" on its own line.
 *
 * @param doc - The full document text.
 * @returns The frontmatter range, or null if no valid frontmatter is detected.
 */
export function detectFrontmatter(doc: string): FrontmatterRange | null {
  if (!doc.startsWith(FRONTMATTER_DELIMITER)) {
    return null;
  }

  const lines = doc.split("\n");
  if (lines.length < 2) {
    return null;
  }

  // First line must be exactly "---" (possibly with trailing whitespace)
  if (lines[0].trim() !== FRONTMATTER_DELIMITER) {
    return null;
  }

  // Search for the closing delimiter starting from line 2
  let charOffset = lines[0].length + 1; // +1 for the newline
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      return {
        startLine: 1,
        endLine: i + 1,
        from: 0,
        to: charOffset + lines[i].length,
      };
    }
    charOffset += lines[i].length + 1; // +1 for the newline
  }

  // No closing delimiter found
  return null;
}

/**
 * Extract the body text from a document, excluding the frontmatter block.
 * Used by the copy button to copy only the note body.
 *
 * Acceptance criteria AC-ED-05: copy body text excluding frontmatter.
 *
 * @param doc - The full document text.
 * @returns The body text after the frontmatter, or the full text if no frontmatter.
 */
export function extractBody(doc: string): string {
  const range = detectFrontmatter(doc);
  if (!range) {
    return doc;
  }

  // Body starts after the closing delimiter line
  const afterFrontmatter = doc.substring(range.to);

  // Strip leading newlines between frontmatter and body
  return afterFrontmatter.replace(/^\n+/, "");
}

/**
 * Extract the full frontmatter YAML content (without delimiters).
 * Used for display purposes only; YAML parsing is done Rust-side.
 *
 * @param doc - The full document text.
 * @returns The raw YAML string between delimiters, or null.
 */
export function extractFrontmatterYaml(doc: string): string | null {
  const range = detectFrontmatter(doc);
  if (!range) {
    return null;
  }

  const lines = doc.split("\n");
  // Lines between opening and closing delimiters
  const yamlLines = lines.slice(1, range.endLine - 1);
  return yamlLines.join("\n");
}

/**
 * Detect frontmatter range using character positions from a line-based iteration.
 * Optimized for use with CodeMirror's document model where you iterate by line.
 *
 * @param lineCount - Total number of lines in the document.
 * @param getLine - Function that returns the text of a given 1-based line number.
 * @param lineStartOffset - Function that returns the start character offset of a 1-based line.
 * @param lineEndOffset - Function that returns the end character offset (exclusive) of a 1-based line.
 * @returns The frontmatter range, or null.
 */
export function detectFrontmatterByLine(
  lineCount: number,
  getLine: (lineNumber: number) => string,
  lineStartOffset: (lineNumber: number) => number,
  lineEndOffset: (lineNumber: number) => number,
): FrontmatterRange | null {
  if (lineCount < 2) {
    return null;
  }

  const firstLine = getLine(1);
  if (firstLine.trim() !== FRONTMATTER_DELIMITER) {
    return null;
  }

  for (let i = 2; i <= lineCount; i++) {
    if (getLine(i).trim() === FRONTMATTER_DELIMITER) {
      return {
        startLine: 1,
        endLine: i,
        from: lineStartOffset(1),
        to: lineEndOffset(i),
      };
    }
  }

  return null;
}
