// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
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

import { expect } from '@playwright/test';
import type { APIResponse } from '@playwright/test';

const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

export function assertFilenameFormat(filename: string): void {
  expect(filename).toMatch(FILENAME_REGEX);
}

export function assertNoServerError(response: APIResponse): void {
  expect(response.status()).toBeLessThan(500);
}

export function parseFrontmatter(content: string): { tags: string[]; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { tags: [], body: content };
  const yamlBlock = match[1];
  const body = match[2];
  const tagsMatch = yamlBlock.match(/^tags:\s*\[(.*?)\]$/m);
  let tags: string[] = [];
  if (tagsMatch) {
    tags = tagsMatch[1]
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  } else {
    const listMatch = yamlBlock.match(/^tags:\n((?:\s+-\s+\S+\n?)*)/m);
    if (listMatch) {
      tags = listMatch[1]
        .split('\n')
        .map((l) => l.replace(/^\s+-\s+/, '').trim())
        .filter(Boolean);
    }
  }
  return { tags, body };
}

export function assertFrontmatterOnlyTags(content: string): void {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return;
  const yaml = fmMatch[1];
  const keys = yaml
    .split('\n')
    .filter((l) => /^\w/.test(l))
    .map((l) => l.split(':')[0].trim());
  const forbidden = keys.filter((k) => k !== 'tags');
  expect(forbidden).toHaveLength(0);
}
