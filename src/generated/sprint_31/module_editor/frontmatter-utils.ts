// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 31-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:traceability sprint=31 task=31-1 module=editor
// Frontmatter template generation and body text extraction.
// frontmatter format: YAML with tags field only (CONV-FRONTMATTER).
// Body extraction used by copy button (AC-ED-05: copy body excluding frontmatter).

export const FRONTMATTER_TEMPLATE = '---\ntags: []\n---\n\n';

/**
 * Extracts the body text from a note, stripping the YAML frontmatter block.
 * If no valid frontmatter is detected, the full content is returned.
 */
export function extractBodyText(content: string): string {
  if (!content) return '';

  const lines = content.split('\n');
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return content;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      const body = lines.slice(i + 1).join('\n');
      return body.replace(/^\n+/, '');
    }
  }

  return content;
}

/**
 * Returns the character offset where the frontmatter block ends (after closing ---\n).
 * Returns 0 if no valid frontmatter is found.
 */
export function getFrontmatterEndOffset(content: string): number {
  if (!content) return 0;

  const lines = content.split('\n');
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return 0;
  }

  let offset = lines[0].length + 1;
  for (let i = 1; i < lines.length; i++) {
    offset += lines[i].length + 1;
    if (lines[i].trim() === '---') {
      return offset;
    }
  }

  return 0;
}

/**
 * Computes the cursor position for the first line of body text,
 * immediately after frontmatter and any trailing blank line.
 */
export function getBodyStartOffset(content: string): number {
  const fmEnd = getFrontmatterEndOffset(content);
  if (fmEnd === 0) return 0;

  if (fmEnd < content.length && content[fmEnd] === '\n') {
    return fmEnd + 1;
  }
  return fmEnd;
}
