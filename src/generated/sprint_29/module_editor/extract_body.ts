// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=29 task=29-1 module=editor artifact=extractBody

/**
 * Strips the YAML frontmatter block from a Markdown document and returns the body.
 * Frontmatter is defined as a `---\n...\n---\n` block at the very start of the string.
 * Documents without a frontmatter block are returned unchanged.
 */
export function extractBody(doc: string): string {
  const match = doc.match(/^---\n[\s\S]*?\n---\n?/);
  if (match) {
    return doc.slice(match[0].length);
  }
  return doc;
}
