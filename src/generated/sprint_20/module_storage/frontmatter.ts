// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 20-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=20 task=20-1 module=storage
// Frontmatter utilities for the frontend layer.
// YAML parsing/deserialization of frontmatter is owned by Rust (serde_yaml).
// These utilities handle template generation and text extraction for UI purposes.

import { FRONTMATTER_DELIMITER } from './constants';

/**
 * Generates the initial frontmatter template for a newly created note.
 * Used by module:editor when populating a new note in CodeMirror 6.
 */
export function createFrontmatterTemplate(tags: readonly string[] = []): string {
  const tagsValue = tags.length > 0 ? `[${tags.join(', ')}]` : '[]';
  return `${FRONTMATTER_DELIMITER}\ntags: ${tagsValue}\n${FRONTMATTER_DELIMITER}\n\n`;
}

/**
 * Extracts the body text from a full note content string, excluding frontmatter.
 * Used by module:editor CopyButton to copy body-only text to clipboard.
 *
 * If no valid frontmatter block is found, returns the entire content.
 */
export function extractBody(content: string): string {
  const lines = content.split('\n');

  if (lines.length === 0 || lines[0].trim() !== FRONTMATTER_DELIMITER) {
    return content;
  }

  // Find the closing delimiter (start search from line index 1)
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      // Body starts after the closing delimiter
      const bodyLines = lines.slice(i + 1);
      // Strip leading empty line if present (standard template has one)
      const body = bodyLines.join('\n');
      return body.startsWith('\n') ? body.substring(1) : body;
    }
  }

  // No closing delimiter found; treat entire content as body
  return content;
}

/**
 * Detects the line range (0-based, inclusive) of the frontmatter block.
 * Returns null if no valid frontmatter block is found.
 *
 * Used by module:editor for CodeMirror 6 frontmatter background decoration.
 */
export function detectFrontmatterRange(
  content: string,
): { startLine: number; endLine: number } | null {
  const lines = content.split('\n');

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
