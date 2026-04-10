// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
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
// @generated-by: codd implement --sprint 27

import { expect, type Page, type Response } from '@playwright/test';
import { FILENAME_REGEX } from './test-data';

export function assertValidFilename(filename: string): void {
  expect(
    FILENAME_REGEX.test(filename),
    `Filename "${filename}" must match YYYY-MM-DDTHHMMSS.md`
  ).toBe(true);
}

export async function assertNoServerError(response: Response): Promise<void> {
  expect(
    response.status(),
    `Expected status < 500, got ${response.status()}`
  ).toBeLessThan(500);
}

export function parseFrontmatter(content: string): { tags: string[]; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { tags: [], body: content };
  }
  const yamlBlock = match[1];
  const body = match[2];
  const tagsMatch = yamlBlock.match(/tags:\s*\n((?:\s+-\s+.+\n?)*)/);
  if (!tagsMatch) {
    const inlineMatch = yamlBlock.match(/tags:\s*\[([^\]]*)\]/);
    if (inlineMatch) {
      const tags = inlineMatch[1]
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      return { tags, body };
    }
    return { tags: [], body };
  }
  const tags = tagsMatch[1]
    .split('\n')
    .map((line) => line.replace(/^\s+-\s+/, '').trim())
    .filter(Boolean);
  return { tags, body };
}

export async function assertNoTitleInput(page: Page): Promise<void> {
  const titleInputs = await page.locator(
    'input[placeholder*="タイトル"], input[name="title"], textarea[name="title"]'
  ).count();
  expect(titleInputs, 'Title input must not exist in editor').toBe(0);
}

export async function assertNoMarkdownRendering(page: Page): Promise<void> {
  const editorArea = page.locator('.cm-editor, .cm-content');
  const renderedElements = editorArea.locator('h1, h2, h3, h4, h5, h6, strong, em, blockquote');
  expect(
    await renderedElements.count(),
    'Rendered Markdown HTML elements must not exist in editor body'
  ).toBe(0);
}

export async function assertFrontmatterBackground(page: Page): Promise<void> {
  const fmLine = page.locator('.cm-frontmatter-bg').first();
  await expect(fmLine).toBeVisible();
}

export async function assertEditorFocused(page: Page): Promise<void> {
  const isFocused = await page.evaluate(() => {
    const el = document.activeElement;
    return el !== null && el !== document.body;
  });
  expect(isFocused, 'Editor must have focus').toBe(true);
}
