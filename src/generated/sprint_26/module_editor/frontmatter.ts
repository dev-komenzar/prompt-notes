// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:26 | task:26-1 | module:editor
// Frontmatter template generation, body-text extraction, and cursor-position helpers.
// Frontmatter spec: YAML block delimited by --- on its own line.
// Only 'tags' field is supported; created_at is derived from filename.

const DELIMITER = '---';

/**
 * Generate the default frontmatter template for a brand-new note.
 * Format:
 *   ---
 *   tags: []
 *   ---
 *   <empty line>
 */
export function generateFrontmatterTemplate(): string {
  return `${DELIMITER}\ntags: []\n${DELIMITER}\n\n`;
}

/**
 * Extract body text (everything after frontmatter) from a full .md document.
 * Leading blank lines immediately after the frontmatter block are stripped
 * so the copied text starts with actual content.
 *
 * If no valid frontmatter is present, the full text is returned unchanged.
 */
export function extractBodyText(fullText: string): string {
  const match = fullText.match(/^---\n([^\n]*\n)*?---\n/);
  if (!match) return fullText;
  return fullText.slice(match[0].length).replace(/^\n+/, '');
}

/**
 * Compute the character offset where the body begins (after frontmatter
 * and one optional trailing blank line). This is the position where the
 * cursor should be placed after creating or loading a note.
 *
 * Returns 0 when no frontmatter is detected.
 */
export function getBodyStartPosition(docText: string): number {
  const match = docText.match(/^---\n([^\n]*\n)*?---\n(\n)?/);
  if (!match) return 0;
  return match[0].length;
}
