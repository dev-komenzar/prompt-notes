// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD trace: plan:implementation_plan > sprint:1 > task:1-1
// Frontmatter utilities for frontend-only operations:
//   - Initial template generation (module:editor, new note creation)
//   - Boundary detection (module:editor, CodeMirror background decoration)
//   - Body extraction (module:editor, copy button)
//
// IMPORTANT: YAML parsing/deserialization of frontmatter is exclusively
// owned by module:storage (Rust serde_yaml). These utilities perform only
// string-level delimiter detection, NOT YAML interpretation.

/**
 * Character-range result for frontmatter boundary detection.
 * `from` is always 0 (frontmatter must start at document beginning).
 * `to` is the character position immediately after the closing delimiter line.
 */
export interface FrontmatterRange {
  readonly from: number;
  readonly to: number;
}

/** Default frontmatter for new notes (tags only, no date field per CONV-FRONTMATTER). */
const EMPTY_FRONTMATTER = '---\ntags: []\n---';

/**
 * Generates the initial file content for a newly created note.
 *
 * Template shape:
 * ```
 * ---
 * tags: []
 * ---
 *
 * ```
 *
 * Template generation is owned by module:editor (Svelte side).
 * Persistence happens via the auto-save debounce → save_note IPC flow.
 */
export function createNoteTemplate(): string {
  return EMPTY_FRONTMATTER + '\n\n';
}

/**
 * Detects the character range of a YAML frontmatter block at the start of a document.
 *
 * Detection rules:
 * 1. The document must begin with a line that is exactly "---" (trimmed).
 * 2. A subsequent line that is exactly "---" (trimmed) closes the block.
 * 3. The returned range spans from position 0 to the character after the
 *    closing delimiter's newline (or end of document if no trailing newline).
 *
 * Returns null if no valid frontmatter delimiters are found.
 *
 * Performance: O(n) where n = number of frontmatter lines (typically ≤ 10).
 * The scan terminates at the closing delimiter; it never reads the full document.
 *
 * @param doc - Full document text
 */
export function detectFrontmatterRange(doc: string): FrontmatterRange | null {
  if (!doc.startsWith('---')) {
    return null;
  }

  const firstNewline = doc.indexOf('\n');
  if (firstNewline === -1) {
    // Document is only "---" with no newline — not a complete frontmatter
    return null;
  }

  // Verify first line is exactly "---" (allow trailing whitespace/CR)
  const firstLine = doc.slice(0, firstNewline).trim();
  if (firstLine !== '---') {
    return null;
  }

  // Scan for closing "---" delimiter
  let pos = firstNewline + 1;
  while (pos < doc.length) {
    const lineEnd = doc.indexOf('\n', pos);
    const end = lineEnd === -1 ? doc.length : lineEnd;
    const line = doc.slice(pos, end).trim();

    if (line === '---') {
      // `to` points past the closing delimiter line (including its newline if present)
      const closingEnd = lineEnd === -1 ? doc.length : lineEnd + 1;
      return { from: 0, to: closingEnd };
    }

    if (lineEnd === -1) {
      // Reached end of document without finding closing delimiter
      break;
    }
    pos = lineEnd + 1;
  }

  return null;
}

/**
 * Returns 1-based line numbers for frontmatter start and end lines.
 * Useful for CodeMirror line-based decoration (Decoration.line).
 *
 * @param doc - Full document text
 * @returns Object with firstLine (always 1) and lastLine, or null
 */
export function detectFrontmatterLineRange(
  doc: string,
): { firstLine: number; lastLine: number } | null {
  const range = detectFrontmatterRange(doc);
  if (range === null) {
    return null;
  }

  // Count newlines within the frontmatter range to determine line count
  const segment = doc.slice(0, range.to);
  let lineCount = 1;
  for (let i = 0; i < segment.length; i++) {
    if (segment[i] === '\n') {
      lineCount++;
    }
  }
  // If segment ends with '\n', the counted lineCount includes an empty next line
  if (segment.endsWith('\n')) {
    lineCount--;
  }

  return { firstLine: 1, lastLine: lineCount };
}

/**
 * Extracts body text from note content, stripping the frontmatter block.
 *
 * If no frontmatter is found, returns the entire content unchanged.
 * Leading whitespace after the frontmatter closing delimiter is preserved.
 *
 * Used by module:editor CopyButton (AC-ED-05: copy body excluding frontmatter).
 *
 * @param content - Full file content (frontmatter + body)
 * @returns Body text without frontmatter
 */
export function extractBody(content: string): string {
  const range = detectFrontmatterRange(content);
  if (range === null) {
    return content;
  }
  return content.slice(range.to);
}

/**
 * Extracts the full document text including frontmatter.
 * This is a trivial identity function provided for semantic clarity
 * when the copy target is the entire file content.
 *
 * @param content - Full file content
 * @returns Same content unchanged
 */
export function extractFullContent(content: string): string {
  return content;
}
