// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:14 task:14-1 module:storage
// Frontmatter utilities for the TypeScript frontend.
// YAML parsing authority resides in Rust (serde_yaml).
// These helpers handle template generation and text-level extraction only.

import { FRONTMATTER_DELIMITER } from './constants';

/**
 * Generates the default frontmatter template for a new note.
 * Used by module:editor when creating a new note via Cmd+N / Ctrl+N.
 *
 * Format:
 * ```
 * ---
 * tags: []
 * ---
 *
 * ```
 */
export function createFrontmatterTemplate(): string {
  return `${FRONTMATTER_DELIMITER}\ntags: []\n${FRONTMATTER_DELIMITER}\n\n`;
}

/**
 * Result of frontmatter detection in a document string.
 */
export interface FrontmatterRange {
  /** True if a complete frontmatter block was found. */
  readonly found: boolean;
  /** Start offset (inclusive) of the opening delimiter line. -1 if not found. */
  readonly start: number;
  /** End offset (exclusive) — position after the closing delimiter's newline. -1 if not found. */
  readonly end: number;
}

/**
 * Detects the frontmatter block in a document string.
 * Frontmatter must start at position 0 with '---' and be closed by a subsequent '---' line.
 *
 * Used by:
 * - module:editor CodeMirror decoration (background color for frontmatter region)
 * - extractBody() for clipboard copy
 *
 * @param content - Full document text.
 * @returns The range of the frontmatter block, or found:false if none.
 */
export function detectFrontmatter(content: string): FrontmatterRange {
  const NOT_FOUND: FrontmatterRange = { found: false, start: -1, end: -1 };

  if (!content.startsWith(FRONTMATTER_DELIMITER)) {
    return NOT_FOUND;
  }

  // Find the end of the opening delimiter line
  const firstNewline = content.indexOf('\n');
  if (firstNewline === -1) {
    return NOT_FOUND;
  }

  // Verify the opening line is exactly '---' (possibly with trailing whitespace)
  const openingLine = content.substring(0, firstNewline).trim();
  if (openingLine !== FRONTMATTER_DELIMITER) {
    return NOT_FOUND;
  }

  // Search for the closing delimiter starting after the opening line
  const searchStart = firstNewline + 1;
  const lines = content.substring(searchStart).split('\n');

  let offset = searchStart;
  for (const line of lines) {
    if (line.trim() === FRONTMATTER_DELIMITER) {
      // End is after the closing delimiter line + newline
      const end = offset + line.length + 1;
      return { found: true, start: 0, end: Math.min(end, content.length) };
    }
    offset += line.length + 1;
  }

  return NOT_FOUND;
}

/**
 * Extracts the body text from a note, excluding the frontmatter block.
 * Used by the 1-click copy button (AC-ED-05) to copy body only.
 *
 * If no frontmatter is detected, returns the full content.
 * Leading whitespace after frontmatter is preserved as-is.
 *
 * @param content - Full document text (frontmatter + body).
 * @returns Body text without frontmatter.
 */
export function extractBody(content: string): string {
  const range = detectFrontmatter(content);
  if (!range.found) {
    return content;
  }
  return content.substring(range.end);
}

/**
 * Computes the cursor position where the body begins (after frontmatter).
 * Used by module:editor to place the cursor in the body region after
 * creating a new note or loading an existing one.
 *
 * @param content - Full document text.
 * @returns Character offset where the body starts.
 */
export function getBodyStartOffset(content: string): number {
  const range = detectFrontmatter(content);
  if (!range.found) {
    return 0;
  }
  return range.end;
}
