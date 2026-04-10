// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 34-2
// @task-title: Editing
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace sprint:34 task:34-2 module:editor

/**
 * Serialises frontmatter tags + body into a single .md document string
 * suitable for loading into CodeMirror.
 *
 * Format:
 *   ---
 *   tags:
 *     - tag1
 *     - tag2
 *   ---
 *   <body>
 */
export function buildFullContent(tags: string[], body: string): string {
  const tagsYaml =
    tags.length > 0
      ? `tags:\n${tags.map((t) => `  - ${t}`).join('\n')}`
      : 'tags: []';
  return `---\n${tagsYaml}\n---\n${body}`;
}

/**
 * Extracts the body text from a full .md document string by stripping
 * the leading YAML frontmatter block.
 *
 * If no frontmatter is present, returns the full document.
 */
export function extractBody(doc: string): string {
  const match = doc.match(/^---\n[\s\S]*?\n---\n/);
  return match ? doc.slice(match[0].length) : doc;
}

/**
 * Parses tags from the frontmatter of a full .md document string.
 * Returns an empty array when no `tags` field is present.
 */
export function extractTags(doc: string): string[] {
  const fmMatch = doc.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return [];

  const yaml = fmMatch[1];
  const inlineMatch = yaml.match(/^tags:\s*\[([^\]]*)\]/m);
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const blockMatch = yaml.match(/^tags:\s*\n((?:\s+- .+\n?)*)/m);
  if (blockMatch) {
    return blockMatch[1]
      .split('\n')
      .map((line) => line.replace(/^\s+-\s+/, '').trim())
      .filter(Boolean);
  }

  return [];
}
