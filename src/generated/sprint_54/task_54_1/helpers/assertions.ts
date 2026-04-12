// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/test/acceptance_criteria.md
// @generated-by: codd propagate

import * as fs from 'fs';
import * as path from 'path';
import { expect, type Page } from '@playwright/test';

const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;
const NOTE_ID_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}$/;

export function assertFilenameFormat(filename: string): void {
  if (!FILENAME_REGEX.test(filename)) {
    throw new Error(
      `FC-STOR-01: ファイル名が YYYY-MM-DDTHHMMSS.md 形式に合致しません: "${filename}"`
    );
  }
}

export function assertNoteIdFormat(id: string): void {
  if (!NOTE_ID_REGEX.test(id)) {
    throw new Error(
      `ノート ID が YYYY-MM-DDTHHMMSS 形式に合致しません: "${id}"`
    );
  }
}

export function assertFrontmatterStructure(content: string): { tags: string[]; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('FC-STOR-03: frontmatter が YAML 形式 (--- 区切り) ではありません');
  }
  const yamlPart = match[1];
  const body = match[2];

  // tags フィールドの存在確認
  if (!yamlPart.includes('tags:')) {
    throw new Error('FC-STOR-03: frontmatter に tags フィールドがありません');
  }

  // tags 以外の自動挿入フィールドがないことを確認 (title, created_at 等)
  const lines = yamlPart.split('\n').filter(l => l.trim().length > 0);
  for (const line of lines) {
    const key = line.split(':')[0].trim();
    if (key !== 'tags') {
      throw new Error(
        `FC-STOR-03: frontmatter に不正なフィールド "${key}" が自動挿入されています`
      );
    }
  }

  const tagsMatch = yamlPart.match(/tags:\s*\[(.*?)\]/s);
  const tags = tagsMatch
    ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return { tags, body: body.trimStart() };
}

export async function assertNoTitleInput(page: Page): Promise<void> {
  const titleInputs = await page.locator('input[placeholder*="タイトル"], input[name="title"], #title').count();
  expect(titleInputs, 'FC-EDIT-05: タイトル入力欄が存在します').toBe(0);
}

export async function assertNoMarkdownPreview(page: Page): Promise<void> {
  // rendered HTML elements inside a preview container
  const previews = await page.locator('.markdown-preview, .md-preview, [data-preview]').count();
  expect(previews, 'FC-EDIT-06: Markdown レンダリングプレビューが存在します').toBe(0);
}

export async function assertCodeMirrorPresent(page: Page): Promise<void> {
  await expect(
    page.locator('.cm-editor'),
    'FC-EDIT-04: CodeMirror 6 エディタが見つかりません'
  ).toBeVisible();
}

export async function assertCopyButtonPresent(page: Page): Promise<void> {
  const btn = page.locator('[data-testid="copy-button"], button:has-text("コピー"), button:has-text("Copy")');
  await expect(btn.first(), 'FC-EDIT-03: コピーボタンが存在しません').toBeVisible();
}

export async function assertFrontmatterBackground(page: Page): Promise<void> {
  const fmBar = page.locator('[data-testid="frontmatter-bar"], .frontmatter-bar');
  await expect(fmBar.first(), 'FC-EDIT-07: frontmatter 領域が存在しません').toBeVisible();
}

export async function assertGridCardsVisible(page: Page): Promise<void> {
  const cards = page.locator('[data-testid="note-card"], .note-card');
  const count = await cards.count();
  expect(count, 'FC-GRID-01: グリッドカードが表示されていません').toBeGreaterThan(0);
}

export async function assertMasonryLayout(page: Page): Promise<void> {
  const container = page.locator('[data-testid="grid-container"], .grid-container');
  await expect(container, 'FC-GRID-01: グリッドコンテナが見つかりません').toBeVisible();
}

export function assertNoteWithinDays(createdAt: string, maxDays: number): void {
  const noteDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - noteDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays > maxDays) {
    throw new Error(
      `AC-GRID-02: created_at "${createdAt}" は直近 ${maxDays} 日間の範囲外です (${diffDays.toFixed(1)} 日前)`
    );
  }
}

export function assertAllNotesHaveTag(notes: Array<{ tags: string[] }>, tag: string): void {
  for (const note of notes) {
    if (!note.tags.includes(tag)) {
      throw new Error(
        `AC-GRID-03: タグフィルタ "${tag}" の結果にタグを持たないノートが含まれています`
      );
    }
  }
}
