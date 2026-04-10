// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: グリッドビュー → エディタ → 自動保存 → グリッドビューに戻り変更が反映されるエンドツーエンドのワークフロー確認
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { expect, type Page } from '@playwright/test';

const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}(\.md)?$/;

export function assertFilenameFormat(filename: string): void {
  if (!FILENAME_REGEX.test(filename)) {
    throw new Error(
      `ファイル名 "${filename}" が YYYY-MM-DDTHHMMSS.md 形式に準拠していません。`
    );
  }
}

export function assertFrontmatterValid(frontmatter: { tags: string[] }): void {
  expect(frontmatter).toBeDefined();
  expect(Array.isArray(frontmatter.tags)).toBe(true);
}

export async function assertNo5xx(page: Page): Promise<void> {
  const responses: number[] = [];
  page.on('response', (res) => {
    if (res.status() >= 500) {
      responses.push(res.status());
    }
  });
  // ページ操作後に5xxがなければ通過
  expect(responses, `5xxエラーが検出されました: ${responses.join(', ')}`).toHaveLength(0);
}

export async function assertEditorHasNoTitleInput(page: Page): Promise<void> {
  // タイトル専用のinput/textareaが存在しないこと (NNC-E2)
  const titleInputs = page.locator(
    'input[name="title"], textarea[name="title"], [data-testid="title-input"]'
  );
  await expect(titleInputs).toHaveCount(0);
}

export async function assertNoMarkdownRendering(page: Page): Promise<void> {
  // 本文領域にレンダリングされたHTML要素が存在しないこと (NNC-E1)
  const editorContent = page.locator('.cm-content');
  const renderedHeadings = editorContent.locator('h1, h2, h3, h4, h5, h6');
  const renderedBold = editorContent.locator('strong, b');
  await expect(renderedHeadings).toHaveCount(0);
  await expect(renderedBold).toHaveCount(0);
}

export async function assertNoNetworkRequests(page: Page): Promise<void> {
  // 外部APIへのfetch/XHRリクエストが発生しないこと
  const externalRequests: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith('http') && !url.startsWith('http://localhost')) {
      externalRequests.push(url);
    }
  });
  expect(externalRequests, `外部ネットワークリクエストが検出されました: ${externalRequests.join(', ')}`).toHaveLength(0);
}
