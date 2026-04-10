// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 49-1
// @task-title: 下記テストケース一覧のすべてが Playwright で通過
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

import { expect, Page } from '@playwright/test';

/** Verify server health: response must be below 5xx. */
export async function assertServerHealthy(page: Page): Promise<void> {
  const res = await page.request.get('/');
  expect(res.status(), 'Server returned 5xx — check if app is running').toBeLessThan(500);
}

/** Assert filename matches YYYY-MM-DDTHHMMSS.md */
export function assertFilenameFormat(filename: string): void {
  expect(filename, `Filename "${filename}" must match YYYY-MM-DDTHHMMSS.md`).toMatch(
    /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/,
  );
}

/** Assert frontmatter only contains the `tags` key (no extra fields). */
export function assertFrontmatterTagsOnly(frontmatterYaml: string): void {
  const lines = frontmatterYaml
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const topLevelKeys = lines
    .filter((l) => /^[a-z_]+:/.test(l))
    .map((l) => l.split(':')[0]);
  const disallowed = topLevelKeys.filter((k) => k !== 'tags');
  expect(disallowed, `Frontmatter must only contain "tags". Found extra keys: ${disallowed}`).toHaveLength(0);
}

/** Assert no network requests (fetch / XHR) were made during test. */
export function assertNoNetworkRequests(requests: string[]): void {
  expect(requests, 'No external network requests are allowed').toHaveLength(0);
}

/** Assert no title input/textarea exists in the DOM. */
export async function assertNoTitleInput(page: Page): Promise<void> {
  // Title inputs are disallowed; check for inputs/textareas with title-related roles or labels
  const titleInputs = await page.locator('[data-testid="title-input"], [placeholder*="title" i], [aria-label*="title" i]').count();
  expect(titleInputs, 'Title input/textarea must not exist in the editor').toBe(0);
}

/** Assert no rendered Markdown HTML elements in editor body area. */
export async function assertNoMarkdownRendering(page: Page): Promise<void> {
  const editorContent = page.locator('.cm-content');
  const count = await editorContent.count();
  if (count === 0) return; // editor not on page — skip
  // These elements would indicate Markdown rendering, which is prohibited
  for (const tag of ['h1', 'h2', 'h3', 'strong', 'em', 'blockquote']) {
    const n = await editorContent.locator(tag).count();
    expect(n, `Rendered <${tag}> must not exist inside editor body area`).toBe(0);
  }
}

/** Assert CodeMirror 6 editor is present. */
export async function assertCodeMirrorPresent(page: Page): Promise<void> {
  await expect(page.locator('.cm-editor')).toBeVisible();
}
