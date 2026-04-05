// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
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
// Client-side frontmatter detection for CodeMirror 6 decoration and copy-button body extraction.
// Authoritative YAML parsing (serde_yaml) is on the Rust side (module:storage).
// This module handles visual-only detection (line range) and text extraction.

import { FRONTMATTER_DELIMITER } from './constants';

/** Represents the line range of a frontmatter block within a document. */
export interface FrontmatterRange {
  /** 1-based start line number (the opening --- delimiter) */
  readonly startLine: number;
  /** 1-based end line number (the closing --- delimiter) */
  readonly endLine: number;
  /** Character offset of the start of the opening delimiter line */
  readonly from: number;
  /** Character offset of the end of the closing delimiter line (exclusive of trailing newline) */
  readonly to: number;
}

/**
 * Detect the frontmatter block in a document string.
 *
 * Frontmatter is recognized when:
 * 1. The very first line is exactly `---` (trimmed)
 * 2. A subsequent line is exactly `---` (trimmed), closing the block
 *
 * Returns null if no valid frontmatter block is found.
 * This mirrors the detection logic used by the CodeMirror 6 ViewPlugin
 * for background color decoration.
 */
export function detectFrontmatterRange(doc: string): FrontmatterRange | null {
  const lines = doc.split('\n');
  if (lines.length === 0) {
    return null;
  }

  if (lines[0].trim() !== FRONTMATTER_DELIMITER) {
    return null;
  }

  let offset = 0;
  const startFrom = 0;

  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      offset += lines[i].length;
      if (i < lines.length - 1) {
        offset += 1; // newline character
      }
      continue;
    }

    const lineStart = offset;
    const lineEnd = offset + lines[i].length;

    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      return {
        startLine: 1,
        endLine: i + 1,
        from: startFrom,
        to: lineEnd,
      };
    }

    offset = lineEnd;
    if (i < lines.length - 1) {
      offset += 1; // newline character
    }
  }

  return null;
}

/**
 * Extract the body text from a note, excluding the frontmatter block.
 * Used by the copy button to copy only body content to clipboard.
 *
 * If no frontmatter is detected, returns the entire content.
 * Leading blank lines after the frontmatter closing delimiter are preserved
 * except for the single newline immediately following the closing `---`.
 */
export function extractBody(content: string): string {
  const range = detectFrontmatterRange(content);
  if (range === null) {
    return content;
  }

  const afterFrontmatter = content.substring(range.to);
  // Skip the newline immediately after the closing delimiter
  if (afterFrontmatter.startsWith('\n')) {
    return afterFrontmatter.substring(1);
  }
  return afterFrontmatter;
}

/**
 * Generate the initial frontmatter template for a newly created note.
 * Produces a valid YAML block with empty tags array.
 *
 * Output:
 * ```
 * ---
 * tags: []
 * ---
 *
 * ```
 * (includes trailing newline for cursor placement after frontmatter)
 */
export function generateFrontmatterTemplate(tags: readonly string[] = []): string {
  const tagsValue = tags.length > 0
    ? `[${tags.join(', ')}]`
    : '[]';
  return `${FRONTMATTER_DELIMITER}\ntags: ${tagsValue}\n${FRONTMATTER_DELIMITER}\n\n`;
}

/**
 * Calculate the cursor position (character offset) for placing the caret
 * after the frontmatter template, ready for body text input.
 */
export function getBodyStartOffset(content: string): number {
  const range = detectFrontmatterRange(content);
  if (range === null) {
    return 0;
  }
  // Position after frontmatter closing delimiter + newline
  const afterDelimiter = range.to;
  if (content.length > afterDelimiter && content[afterDelimiter] === '\n') {
    return afterDelimiter + 1;
  }
  return afterDelimiter;
}
