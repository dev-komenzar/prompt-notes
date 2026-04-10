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

import { test, expect } from '@playwright/test';
import { launchApp, navigateTo } from './helpers/app-launch';
import {
  typeIntoEditor,
  clickCopyButton,
  triggerNewNote,
  waitForAutoSave,
  getCopyButtonText,
  waitForCopyFeedback,
} from './helpers/editor';
import {
  assertNoTitleInput,
  assertNoMarkdownRendering,
  assertFrontmatterBackground,
  assertEditorFocused,
} from './helpers/assertions';
import { createTestNote, deleteTestNote } from './helpers/test-data';

test.describe('Editor browser tests', () => {
  test.fixme('AC-ED-01 / FC-ED-01: CodeMirror 6 editor is present with Markdown highlight classes', async () => {
    const { browser, page } = await launchApp();
    try {
      const filename = await createTestNote([], '# Heading\n**bold**');
      await navigateTo(page, `/edit/${filename}`);
      await page.waitForSelector('.cm-editor');
      const highlightSpans = await page.locator('.cm-editor .cm-line span[class*="tok-"]').count();
      expect(highlightSpans).toBeGreaterThan(0);
      await assertNoMarkdownRendering(page);
      await deleteTestNote(filename);
    } finally {
      await browser.close();
    }
  });

  test.fixme('AC-ED-02 / FC-ED-02: No title input exists in editor screen', async () => {
    const { browser, page } = await launchApp();
    try {
      const filename = await createTestNote([], 'body');
      await navigateTo(page, `/edit/${filename}`);
      await page.waitForSelector('.cm-editor');
      await assertNoTitleInput(page);
      await deleteTestNote(filename);
    } finally {
      await browser.close();
    }
  });

  test.fixme('AC-ED-03 / FC-ED-05: frontmatter region has distinct background color', async () => {
    const { browser, page } = await launchApp();
    try {
      const filename = await createTestNote(['tag1'], 'body text');
      await navigateTo(page, `/edit/${filename}`);
      await page.waitForSelector('.cm-editor');
      await assertFrontmatterBackground(page);
      await deleteTestNote(filename);
    } finally {
      await browser.close();
    }
  });

  test.fixme('AC-ED-04 / FC-ED-03: Cmd+N / Ctrl+N creates new note and moves focus to editor', async () => {
    const { browser, page } = await launchApp();
    try {
      const isMac = process.platform === 'darwin';
      const initialUrl = page.url();
      await triggerNewNote(page, isMac);
      await page.waitForURL(/\/edit\//);
      expect(page.url()).not.toBe(initialUrl);
      await page.waitForSelector('.cm-editor');
      await assertEditorFocused(page);

      const newFilename = page.url().split('/edit/')[1];
      if (newFilename) await deleteTestNote(decodeURIComponent(newFilename));
    } finally {
      await browser.close();
    }
  });

  test.fixme('AC-ED-05 / FC-ED-04: copy button copies body without frontmatter to clipboard', async () => {
    const { browser, page } = await launchApp();
    try {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      const filename = await createTestNote(['tag1'], 'コピー対象の本文');
      await navigateTo(page, `/edit/${filename}`);
      await page.waitForSelector('.cm-editor');
      await clickCopyButton(page);
      await waitForCopyFeedback(page);

      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText.trim()).toBe('コピー対象の本文');
      expect(clipboardText).not.toContain('---');

      const btnText = await getCopyButtonText(page);
      expect(btnText).toMatch(/✓|コピー済み/);

      await deleteTestNote(filename);
    } finally {
      await browser.close();
    }
  });

  test.fixme('AC-ED-06 / FC-ST-02: text typed in editor is auto-saved without explicit save', async () => {
    const { browser, page } = await launchApp();
    try {
      const filename = await createTestNote([], '');
      await navigateTo(page, `/edit/${filename}`);
      await page.waitForSelector('.cm-editor');
      await typeIntoEditor(page, '自動保存テキスト');
      await waitForAutoSave(page);

      const { invoke } = await import('@tauri-apps/api/core');
      const data = await invoke<{ body: string }>('read_note', { filename });
      expect(data.body).toContain('自動保存テキスト');
      await deleteTestNote(filename);
    } finally {
      await browser.close();
    }
  });
});
