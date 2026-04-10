// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @generated-by: codd generate --wave 10

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n/;
const TAGS_LINE_REGEX = /^tags:\s*\[.*\]$|^tags:\s*$/m;
const FORBIDDEN_AUTO_FIELDS = ['title', 'created_at', 'updated_at', 'id', 'date'];

export interface FrontmatterValidationResult {
  readonly valid: boolean;
  readonly hasFrontmatter: boolean;
  readonly tags: readonly string[];
  readonly forbiddenFields: readonly string[];
  readonly reason: string;
}

export function extractFrontmatterBlock(
  content: string,
): string | null {
  const match = content.match(FRONTMATTER_REGEX);
  return match ? match[1] : null;
}

export function parseFrontmatterTags(yamlBlock: string): string[] {
  const tagsMatch = yamlBlock.match(
    /^tags:\s*\[(.*)\]\s*$/m,
  );
  if (tagsMatch) {
    return tagsMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
      .filter((t) => t.length > 0);
  }

  const lines = yamlBlock.split('\n');
  const tagsIndex = lines.findIndex((l) => /^tags:\s*$/.test(l));
  if (tagsIndex === -1) {
    return [];
  }

  const tags: string[] = [];
  for (let i = tagsIndex + 1; i < lines.length; i++) {
    const itemMatch = lines[i].match(/^\s*-\s+(.+)$/);
    if (itemMatch) {
      tags.push(itemMatch[1].trim().replace(/^['"]|['"]$/g, ''));
    } else {
      break;
    }
  }
  return tags;
}

export function detectForbiddenAutoFields(
  yamlBlock: string,
): string[] {
  const found: string[] = [];
  for (const field of FORBIDDEN_AUTO_FIELDS) {
    const regex = new RegExp(`^${field}\\s*:`, 'm');
    if (regex.test(yamlBlock)) {
      found.push(field);
    }
  }
  return found;
}

export function validateFrontmatter(
  content: string,
): FrontmatterValidationResult {
  const block = extractFrontmatterBlock(content);

  if (block === null) {
    return {
      valid: true,
      hasFrontmatter: false,
      tags: [],
      forbiddenFields: [],
      reason: 'No frontmatter found; treated as tags=[]',
    };
  }

  const tags = parseFrontmatterTags(block);
  const forbidden = detectForbiddenAutoFields(block);

  if (forbidden.length > 0) {
    return {
      valid: false,
      hasFrontmatter: true,
      tags,
      forbiddenFields: forbidden,
      reason: `Forbidden auto-inserted fields detected: ${forbidden.join(', ')}`,
    };
  }

  return {
    valid: true,
    hasFrontmatter: true,
    tags,
    forbiddenFields: [],
    reason: 'OK',
  };
}
