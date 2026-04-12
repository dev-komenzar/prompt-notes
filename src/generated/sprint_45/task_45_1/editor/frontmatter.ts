// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 45-1
// @task-title: 担当モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-traceability: detail:editor_clipboard § 4.5, detail:storage_fileformat § 4.2

export function extractBody(doc: string): string {
  const match = doc.match(/^---\n[\s\S]*?\n---\n?/);
  if (match) {
    return doc.slice(match[0].length);
  }
  return doc;
}

export function parseFrontmatter(doc: string): { tags: string[]; body: string } {
  if (!doc.startsWith('---\n')) {
    return { tags: [], body: doc };
  }
  const rest = doc.slice(4);
  const endIndex = rest.indexOf('\n---\n');
  if (endIndex === -1) {
    return { tags: [], body: doc };
  }
  const yaml = rest.slice(0, endIndex);
  const body = rest.slice(endIndex + 5);
  const tagsMatch = yaml.match(/^tags:\s*\[([^\]]*)\]/m);
  let tags: string[] = [];
  if (tagsMatch) {
    tags = tagsMatch[1]
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  } else {
    const blockMatch = yaml.match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m);
    if (blockMatch) {
      tags = blockMatch[1]
        .split('\n')
        .map((line) => line.replace(/^\s+-\s+/, '').trim())
        .filter(Boolean);
    }
  }
  return { tags, body };
}

export function serializeFrontmatter(tags: string[], body: string): string {
  const tagsYaml =
    tags.length > 0
      ? `tags: [${tags.join(', ')}]`
      : 'tags: []';
  return `---\n${tagsYaml}\n---\n${body}`;
}
