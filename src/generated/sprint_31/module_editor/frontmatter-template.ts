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

// @codd:generated sprint_31 task_31-1 module:editor
// Frontmatter is YAML format with tags field only.
// Created date is derived from filename; not stored in frontmatter.

export const FRONTMATTER_TEMPLATE = '---\ntags: []\n---\n\n';

/**
 * Computes the cursor position immediately after the frontmatter block
 * (past the closing `---` and one trailing blank line if present).
 */
export function getFrontmatterEndPosition(content: string): number {
  const lines = content.split('\n');
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return 0;
  }

  let charPos = 0;
  for (let i = 0; i < lines.length; i++) {
    charPos += lines[i].length + 1; // +1 for the \n separator
    if (i > 0 && lines[i].trim() === '---') {
      // Skip one blank line after closing --- if present
      if (i + 1 < lines.length && lines[i + 1].trim() === '') {
        charPos += lines[i + 1].length + 1;
      }
      return Math.min(charPos, content.length);
    }
  }

  return 0;
}

/**
 * Extracts body text excluding the frontmatter block.
 * Leading blank lines after frontmatter are stripped.
 * If no frontmatter is detected, the full content is returned.
 */
export function extractBodyText(content: string): string {
  const lines = content.split('\n');
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return content;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      const afterFrontmatter = lines.slice(i + 1);
      let start = 0;
      while (start < afterFrontmatter.length && afterFrontmatter[start].trim() === '') {
        start++;
      }
      return afterFrontmatter.slice(start).join('\n');
    }
  }

  // No closing --- found; treat entire content as body
  return content;
}
