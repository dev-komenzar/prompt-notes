// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=5, task=5-1, modules=[storage]
// Frontmatter utilities for module:editor integration.
// YAML parsing authority belongs to Rust backend (serde_yaml).
// These utilities handle UI-layer operations only: template generation,
// body extraction for clipboard, and range detection for CodeMirror decoration.

import { FRONTMATTER_DELIMITER } from './constants';

/**
 * Generates the initial frontmatter template for a newly created note.
 * Used by module:editor when creating a new note (Cmd+N / Ctrl+N).
 * The template is set as the initial CodeMirror document content.
 * Persistence happens via auto-save (debounce → save_note IPC).
 */
export function generateFrontmatterTemplate(tags: readonly string[] = []): string {
  const tagsValue = tags.length > 0 ? `[${tags.join(', ')}]` : '[]';
  return `${FRONTMATTER_DELIMITER}\ntags: ${tagsValue}\n${FRONTMATTER_DELIMITER}\n\n`;
}

/**
 * Extracts the body text from a note document string, excluding the frontmatter block.
 * Used by CopyButton for clipboard copy (acceptance criteria AC-ED-05).
 *
 * If no frontmatter is detected (no opening ---), returns the entire text.
 * If opening --- exists but no closing ---, returns the entire text.
 */
export function extractBodyWithoutFrontmatter(doc: string): string {
  const lines = doc.split('\n');

  if (lines.length === 0 || lines[0].trim() !== FRONTMATTER_DELIMITER) {
    return doc;
  }

  // Search for closing delimiter starting from line 1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      // Body starts after the closing delimiter
      const bodyLines = lines.slice(i + 1);
      // Trim leading empty line that typically follows frontmatter
      const bodyText = bodyLines.join('\n');
      return bodyText.startsWith('\n') ? bodyText.slice(1) : bodyText;
    }
  }

  // No closing delimiter found — return full text
  return doc;
}

/**
 * Detects the line range (0-indexed) of the frontmatter block in a document.
 * Returns null if no valid frontmatter block is found.
 *
 * Used by module:editor for CodeMirror 6 Decoration (background color on frontmatter lines).
 * This is a UI-only operation; structural YAML parsing is done by Rust backend.
 *
 * @returns Object with startLine and endLine (inclusive), or null.
 */
export function findFrontmatterRange(doc: string): FrontmatterRange | null {
  const lines = doc.split('\n');

  if (lines.length === 0 || lines[0].trim() !== FRONTMATTER_DELIMITER) {
    return null;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      return {
        startLine: 0,
        endLine: i,
      };
    }
  }

  // Opening delimiter found but no closing delimiter — partial frontmatter (editing in progress)
  return null;
}

/**
 * Converts a character offset in the document to a line/column position.
 * Used alongside findFrontmatterRange for CodeMirror position mapping.
 */
export function getCharOffsetForLine(doc: string, targetLine: number): number {
  let offset = 0;
  const lines = doc.split('\n');
  for (let i = 0; i < targetLine && i < lines.length; i++) {
    offset += lines[i].length + 1; // +1 for the newline character
  }
  return offset;
}

/**
 * Returns the character offset for the end of a given line (inclusive of the line content).
 */
export function getEndCharOffsetForLine(doc: string, targetLine: number): number {
  const lines = doc.split('\n');
  if (targetLine >= lines.length) {
    return doc.length;
  }
  let offset = 0;
  for (let i = 0; i <= targetLine; i++) {
    offset += lines[i].length + (i < lines.length - 1 ? 1 : 0);
  }
  return offset;
}

export interface FrontmatterRange {
  /** 0-indexed line number of the opening --- delimiter. */
  readonly startLine: number;
  /** 0-indexed line number of the closing --- delimiter (inclusive). */
  readonly endLine: number;
}
