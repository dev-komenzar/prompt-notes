// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 31-2
// @task-title: 500ms〜1000ms 範囲で最終調整）。`docChanged` 時のみ発火。frontmatter
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// traceability: sprint_31/task_31-2 — frontmatter/body 分離ユーティリティ

export interface Frontmatter {
  tags: string[];
}

export interface ParsedNote {
  frontmatter: Frontmatter;
  body: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatterAndBody(doc: string): ParsedNote {
  const match = doc.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: { tags: [] }, body: doc };
  }

  const yamlBlock = match[1];
  const body = doc.slice(match[0].length);

  const tags = parseTagsFromYaml(yamlBlock);
  return { frontmatter: { tags }, body };
}

function parseTagsFromYaml(yaml: string): string[] {
  // tags: [a, b, c]  形式
  const inlineMatch = yaml.match(/^tags:\s*\[([^\]]*)\]/m);
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  // tags:\n  - a\n  - b  形式
  const blockMatch = yaml.match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m);
  if (blockMatch) {
    return blockMatch[1]
      .split('\n')
      .map((line) => line.replace(/^\s+-\s+/, '').trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  return [];
}

export function serializeFrontmatter(fm: Frontmatter): string {
  if (fm.tags.length === 0) {
    return '---\ntags: []\n---\n';
  }
  const tagList = fm.tags.map((t) => `  - ${t}`).join('\n');
  return `---\ntags:\n${tagList}\n---\n`;
}
