// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
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
import { expect, type Page, type Response } from '@playwright/test';
import { FILENAME_REGEX, parseNoteContent } from './test-data';
import * as fs from 'fs';

export function assertFilenameFormat(filename: string): void {
  expect(filename).toMatch(FILENAME_REGEX);
}

export function assertFrontmatterTagsOnly(content: string): void {
  const { frontmatter } = parseNoteContent(content);
  const keys = Object.keys(frontmatter);
  expect(keys).toContain('tags');
  const forbidden = keys.filter((k) => !['tags'].includes(k));
  expect(forbidden).toHaveLength(0);
}

export async function assertNoServerError(response: Response): Promise<void> {
  expect(response.status()).toBeLessThan(500);
}

export async function assertNoNetworkCalls(page: Page): Promise<void> {
  const externalRequests: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('http://localhost') && !url.startsWith('asset://') && !url.startsWith('tauri://')) {
      externalRequests.push(url);
    }
  });
  await page.waitForTimeout(500);
  expect(externalRequests).toHaveLength(0);
}

export async function assertNoTitleInput(page: Page): Promise<void> {
  // title inputs would have id/name/placeholder indicating "title"
  const titleInputs = await page.locator('input[placeholder*="title" i], input[name*="title" i], textarea[placeholder*="title" i]').count();
  expect(titleInputs).toBe(0);
}

export async function assertNoMarkdownRendering(page: Page): Promise<void> {
  // Check that rendered Markdown HTML elements do not exist in the editor body area
  const rendered = await page.locator('.cm-content h1, .cm-content h2, .cm-content strong, .cm-content em, .cm-content p').count();
  expect(rendered).toBe(0);
}

export function assertFileExists(filepath: string): void {
  expect(fs.existsSync(filepath)).toBe(true);
}

export function assertFileContent(filepath: string, expectedBody: string): void {
  const content = fs.readFileSync(filepath, 'utf-8');
  const { body } = parseNoteContent(content);
  expect(body.trim()).toContain(expectedBody.trim());
}
