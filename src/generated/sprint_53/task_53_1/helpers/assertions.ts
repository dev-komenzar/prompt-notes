// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 53
import * as fs from 'fs';
import * as path from 'path';
import { expect, Page } from '@playwright/test';
import { FILENAME_REGEX, NOTE_ID_REGEX, FRONTMATTER_ONLY_BODY_RE, NoteMetadata } from './test-data';

/** ファイル名が YYYY-MM-DDTHHMMSS.md 形式に準拠していることを検証する (RB-3) */
export function assertFilenameFormat(filename: string): void {
  expect(FILENAME_REGEX.test(filename), `filename "${filename}" must match YYYY-MM-DDTHHMMSS.md`).toBe(true);
}

/** ノート ID が YYYY-MM-DDTHHMMSS 形式に準拠していることを検証する */
export function assertNoteIdFormat(id: string): void {
  expect(NOTE_ID_REGEX.test(id), `id "${id}" must match YYYY-MM-DDTHHMMSS`).toBe(true);
}

/** ファイルが存在し、frontmatter が tags のみを含む YAML であることを検証する (RB-3) */
export function assertNoteFileStructure(filePath: string): { tags: string[]; body: string } {
  expect(fs.existsSync(filePath), `note file "${filePath}" must exist`).toBe(true);
  const content = fs.readFileSync(filePath, 'utf-8');
  expect(content.startsWith('---\n'), 'file must start with frontmatter delimiter').toBe(true);
  const fmEnd = content.indexOf('\n---\n', 4);
  expect(fmEnd, 'frontmatter closing --- must exist').toBeGreaterThan(0);
  const yamlSection = content.slice(4, fmEnd);
  // frontmatter は tags のみ許可 (CONV-2)
  const lines = yamlSection.split('\n').filter(l => l.trim() !== '');
  for (const line of lines) {
    expect(
      line.startsWith('tags') || line.startsWith('  -') || line.startsWith('- '),
      `frontmatter must only contain tags, found: "${line}"`
    ).toBe(true);
  }
  const tags: string[] = [];
  const inlineTags = yamlSection.match(/tags:\s*\[([^\]]*)\]/);
  const listTags = yamlSection.matchAll(/^\s+-\s+(.+)$/gm);
  if (inlineTags) {
    tags.push(...inlineTags[1].split(',').map(t => t.trim()).filter(Boolean));
  } else {
    for (const m of listTags) {
      tags.push(m[1].trim());
    }
  }
  const body = content.slice(fmEnd + 5); // skip \n---\n
  return { tags, body };
}

/** NoteMetadata の型契約を検証する */
export function assertNoteMetadataShape(meta: unknown): asserts meta is NoteMetadata {
  expect(meta).toBeDefined();
  const m = meta as Record<string, unknown>;
  expect(typeof m['id']).toBe('string');
  expect(Array.isArray(m['tags'])).toBe(true);
  expect(typeof m['created_at']).toBe('string');
  expect(typeof m['preview']).toBe('string');
  assertNoteIdFormat(m['id'] as string);
}

/** クリップボードの内容が frontmatter を含まないことを検証する (AC-EDIT-04) */
export async function assertClipboardBodyOnly(page: Page, expectedBody: string): Promise<void> {
  const clipText = await page.evaluate(() => navigator.clipboard.readText());
  expect(FRONTMATTER_ONLY_BODY_RE.test(clipText), 'clipboard must not contain frontmatter').toBe(false);
  expect(clipText.trim()).toBe(expectedBody.trim());
}

/** エディタ画面にタイトル入力欄が存在しないことを検証する (RB-2) */
export async function assertNoTitleInput(page: Page): Promise<void> {
  const titleInputCount = await page.locator('input[placeholder*="タイトル"], input[name*="title"], input[placeholder*="title"]').count();
  expect(titleInputCount, 'title input must not exist (RB-2)').toBe(0);
}

/** Markdown プレビュー/レンダリング要素が存在しないことを検証する (RB-2) */
export async function assertNoMarkdownPreview(page: Page): Promise<void> {
  const previewCount = await page.locator('.markdown-preview, .md-preview, [data-testid="preview"]').count();
  expect(previewCount, 'markdown preview must not exist (RB-2)').toBe(0);
}
