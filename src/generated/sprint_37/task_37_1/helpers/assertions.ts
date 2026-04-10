// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/acceptance_criteria.md
// @generated-by: codd propagate
import { expect, type APIResponse } from '@playwright/test';
import { FILENAME_REGEX } from './test-data';

export function assertFilenameFormat(filename: string): void {
  expect(filename).toMatch(FILENAME_REGEX);
}

export async function assertNoServerError(response: APIResponse): Promise<void> {
  expect(response.status()).toBeLessThan(500);
}

export function parseFrontmatter(content: string): { tags: string[]; extra: Record<string, unknown> } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { tags: [], extra: {} };
  const yamlText = match[1];
  const tagsMatch = yamlText.match(/^tags:\s*\[([^\]]*)\]/m);
  const tagsArrayMatch = yamlText.match(/^tags:\n((?:\s+-\s+.+\n?)*)/m);
  let tags: string[] = [];
  if (tagsMatch) {
    tags = tagsMatch[1].split(',').map((t) => t.trim()).filter(Boolean);
  } else if (tagsArrayMatch) {
    tags = tagsArrayMatch[1]
      .split('\n')
      .map((l) => l.replace(/^\s+-\s+/, '').trim())
      .filter(Boolean);
  }
  return { tags, extra: {} };
}

export function assertOnlyTagsInFrontmatter(content: string): void {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  expect(match, 'frontmatter block must exist').toBeTruthy();
  const yamlLines = match![1].split('\n').filter((l) => l.trim() && !l.trim().startsWith('-'));
  const nonTagKeys = yamlLines
    .map((l) => l.split(':')[0].trim())
    .filter((k) => k && k !== 'tags');
  expect(nonTagKeys, `unexpected frontmatter keys: ${nonTagKeys}`).toHaveLength(0);
}

export function extractBody(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n/);
  return match ? content.slice(match[0].length).trimStart() : content;
}

export function assertValidNoteStructure(content: string): void {
  expect(content).toMatch(/^---\n/);
  expect(content).toMatch(/\n---\n/);
  assertOnlyTagsInFrontmatter(content);
}
