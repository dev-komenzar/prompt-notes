// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-1
// @task-title: ディレクトリ走査 → `.md` ファイルのみ対象（`.tmp` 除外
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import type { Frontmatter, ParsedNote } from './types';

const FRONTMATTER_DELIMITER = '---';

export function parseFrontmatterAndBody(content: string): ParsedNote {
  if (!content.startsWith(`${FRONTMATTER_DELIMITER}\n`)) {
    return { frontmatter: { tags: [] }, body: content };
  }

  const endIndex = content.indexOf(`\n${FRONTMATTER_DELIMITER}\n`, FRONTMATTER_DELIMITER.length + 1);
  if (endIndex === -1) {
    return { frontmatter: { tags: [] }, body: content };
  }

  const yamlSection = content.slice(FRONTMATTER_DELIMITER.length + 1, endIndex);
  const body = content.slice(endIndex + FRONTMATTER_DELIMITER.length + 2);

  const frontmatter = parseYamlFrontmatter(yamlSection);
  return { frontmatter, body };
}

function parseYamlFrontmatter(yaml: string): Frontmatter {
  const tags: string[] = [];

  const inlineMatch = yaml.match(/^tags:\s*\[([^\]]*)\]/m);
  if (inlineMatch) {
    const raw = inlineMatch[1];
    raw.split(',').forEach((t) => {
      const trimmed = t.trim().replace(/^['"]|['"]$/g, '');
      if (trimmed) tags.push(trimmed);
    });
    return { tags };
  }

  const blockMatch = yaml.match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m);
  if (blockMatch) {
    blockMatch[1].split('\n').forEach((line) => {
      const m = line.match(/^\s+-\s+(.+)/);
      if (m) tags.push(m[1].trim().replace(/^['"]|['"]$/g, ''));
    });
    return { tags };
  }

  return { tags };
}
