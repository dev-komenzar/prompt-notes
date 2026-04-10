// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-2
// @task-title: 全 E2E テスト通過
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd propagate
import { expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

export function assertValidFilename(filename: string): void {
  expect(
    FILENAME_REGEX.test(filename),
    `Filename "${filename}" must match YYYY-MM-DDTHHMMSS.md`
  ).toBe(true);
}

export function assertFrontmatterTagsOnly(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  expect(fmMatch, 'File must contain YAML frontmatter block').toBeTruthy();
  const parsed = yaml.load(fmMatch![1]) as Record<string, unknown>;
  const keys = Object.keys(parsed ?? {});
  for (const key of keys) {
    expect(['tags'], `Frontmatter must only contain "tags", found "${key}"`).toContain(key);
  }
  expect(Array.isArray(parsed?.tags ?? [])).toBe(true);
}

export async function assertNoServerError(page: Page, url: string): Promise<void> {
  const response = await page.goto(url);
  expect(response?.status() ?? 200, `${url} must not return 5xx`).toBeLessThan(500);
}

export async function assertNoBannedNetworkCalls(page: Page): Promise<void> {
  const banned: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('http://localhost') && !url.startsWith('tauri://') && !url.startsWith('https://localhost')) {
      banned.push(url);
    }
  });
  await page.waitForTimeout(1000);
  expect(banned, `No external network calls allowed, found: ${banned.join(', ')}`).toHaveLength(0);
}

export async function assertNoTitleInput(page: Page): Promise<void> {
  const titleInputs = await page.locator('input[placeholder*="title" i], input[name*="title" i], textarea[placeholder*="title" i]').count();
  expect(titleInputs, 'No title-specific input/textarea should exist').toBe(0);
}

export async function assertNoMarkdownRendering(page: Page): Promise<void> {
  const editorBody = page.locator('.cm-content, .cm-editor .cm-scroller');
  await expect(editorBody).toBeVisible();
  const h1Count = await editorBody.locator('h1').count();
  const strongCount = await editorBody.locator('strong').count();
  const emCount = await editorBody.locator('em').count();
  expect(h1Count, 'No rendered <h1> in editor body').toBe(0);
  expect(strongCount, 'No rendered <strong> in editor body').toBe(0);
  expect(emCount, 'No rendered <em> in editor body').toBe(0);
}

export async function assertCodeMirror6Present(page: Page): Promise<void> {
  await expect(page.locator('.cm-editor'), 'CodeMirror 6 .cm-editor must be present').toBeVisible();
}

export async function assertFrontmatterBackground(page: Page): Promise<void> {
  const fmLine = page.locator('.cm-frontmatter-bg').first();
  await expect(fmLine, 'frontmatter background class .cm-frontmatter-bg must be applied').toBeVisible();
}
