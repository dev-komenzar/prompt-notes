// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 27 – module:editor – Frontmatter template for new notes
// tags is the only permitted frontmatter field (CONV-FRONTMATTER).
// Created date is derived from filename, not stored in frontmatter.

/**
 * Default empty frontmatter template used when creating a new note.
 * Includes a trailing blank line so the cursor lands on the body area.
 */
export const EMPTY_FRONTMATTER_TEMPLATE = '---\ntags: []\n---\n\n';

/**
 * Build a frontmatter template with pre-populated tags.
 */
export function createFrontmatterTemplate(tags: readonly string[] = []): string {
  if (tags.length === 0) {
    return EMPTY_FRONTMATTER_TEMPLATE;
  }
  const tagList = tags.join(', ');
  return `---\ntags: [${tagList}]\n---\n\n`;
}

/**
 * Return the character offset where the body starts in the given template.
 * Useful for placing the cursor after frontmatter on new note creation.
 */
export function bodyStartOffset(template: string): number {
  return template.length;
}
