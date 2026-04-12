// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 5 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 65 | task: 65-1 | module: editor,storage
// Frontmatter schema is fixed: tags only. No additional fields (CONV-2).

/**
 * Extracts frontmatter YAML block and body from raw .md file content.
 * Files without frontmatter are treated as having tags: [].
 */
export function parseFrontmatterAndBody(content: string): { tags: string[]; body: string } {
  if (!content.startsWith('---\n')) {
    return { tags: [], body: content };
  }
  const rest = content.slice(4);
  const endIdx = rest.indexOf('\n---\n');
  if (endIdx === -1) {
    return { tags: [], body: content };
  }
  const yaml = rest.slice(0, endIdx);
  const body = rest.slice(endIdx + 5);

  const match = yaml.match(/^tags:\s*\[([^\]]*)\]/m);
  let tags: string[] = [];
  if (match) {
    tags = match[1]
      .split(',')
      .map((t) => t.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  } else {
    const listMatch = yaml.match(/^tags:\s*\n((?:\s*-\s*.+\n?)*)/m);
    if (listMatch) {
      tags = listMatch[1]
        .split('\n')
        .map((l) => l.replace(/^\s*-\s*/, '').trim())
        .filter(Boolean);
    }
  }
  return { tags, body };
}

/**
 * Extracts body only (without frontmatter) for clipboard copy.
 */
export function extractBodyForCopy(content: string): string {
  return parseFrontmatterAndBody(content).body;
}
