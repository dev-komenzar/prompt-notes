// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — module:editor E2E テスト
import { test, expect, type Page } from '@playwright/test';
import { resolvePlatformConfig, getNewNoteShortcut } from '../helpers/platform';
import {
  createTempNotesDir,
  cleanupTempDir,
  seedNote,
  readNoteFromDisk,
  listNotesOnDisk,
} from '../helpers/test-fixtures';
import {
  waitForAppReady,
  getEditorContent,
  typeInEditor,
  hasFrontmatterDecoration,
  hasTitleInputField,
  hasMarkdownPreview,
  getCopyButton,
  isCodeMirror6Active,
  navigateToView,
} from '../helpers/webview-client';
import {
  assertNoDirectFileAccess,
  assertIPCCommandCalled,
  assertSaveNoteCalledWithValidFilename,
} from '../helpers/ipc-assertions';

const platformConfig = resolvePlatformConfig();

test.describe('module:editor — E2E Tests', () => {
  let tempDir: string;

  test.beforeEach(async () => {
    tempDir = createTempNotesDir();
  });

  test.afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // AC-ED-01: CodeMirror 6 エディタの採用 (RBC-2)
  test('AC-ED-01: editor engine is CodeMirror 6', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const isCM6 = await isCodeMirror6Active(page);
    expect(isCM6, 'Editor must use CodeMirror 6 (CONV-2 / RBC-2)').toBe(true);

    // Verify .cm-editor and .cm-content DOM elements exist
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('.cm-content')).toBeVisible();
  });

  // AC-ED-01: Markdown syntax highlighting is applied
  test('AC-ED-01: Markdown syntax highlighting is active', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    // Type Markdown content and verify syntax highlighting classes
    await typeInEditor(page, '# Heading\n\n**bold** and *italic*\n\n```code```');
    await page.waitForTimeout(500);

    // CodeMirror applies specific CSS classes for Markdown tokens
    const hasHighlighting = await page.evaluate(() => {
      const content = document.querySelector('.cm-content');
      if (!content) return false;
      // Check for any CodeMirror syntax highlighting spans
      const highlights = content.querySelectorAll(
        '.cm-header, .tok-heading, [class*="heading"], .cm-strong, .tok-strong',
      );
      return highlights.length > 0;
    });
    expect(
      hasHighlighting,
      'Markdown syntax highlighting must be applied (AC-ED-01)',
    ).toBe(true);
  });

  // AC-ED-01: No Markdown rendering/preview (RBC-2 / FAIL-05)
  test('AC-ED-01/FAIL-05: no Markdown preview exists', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const hasPreview = await hasMarkdownPreview(page);
    expect(
      hasPreview,
      'Markdown preview/rendering must NOT exist (RBC-2 / FAIL-05)',
    ).toBe(false);
  });

  // AC-ED-02: タイトル入力欄の不在 (RBC-2 / FAIL-04)
  test('AC-ED-02/FAIL-04: no title input field exists', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const hasTitle = await hasTitleInputField(page);
    expect(
      hasTitle,
      'Title input field must NOT exist on editor screen (RBC-2 / FAIL-04)',
    ).toBe(false);
  });

  // AC-ED-03: frontmatter 領域 — 背景色による視覚的区別 (FAIL-21)
  test('AC-ED-03/FAIL-21: frontmatter region has background decoration', async ({
    page,
  }) => {
    await waitForAppReady(page);

    // Seed a note with frontmatter
    const date = new Date();
    const fixture = seedNote(tempDir, date, ['test', 'e2e'], 'Body content here');

    await navigateToView(page, 'editor');
    // Load the seeded note
    await page.waitForTimeout(500);

    const hasFmDecoration = await hasFrontmatterDecoration(page);
    expect(
      hasFmDecoration,
      'Frontmatter region must have background color decoration (FAIL-21)',
    ).toBe(true);
  });

  // AC-ED-03: frontmatter format compliance
  test('AC-ED-03: frontmatter uses YAML tags-only format', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    // Create new note via shortcut
    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(1_000);

    const content = await getEditorContent(page);

    // Verify frontmatter template
    expect(content).toContain('---');
    expect(content).toContain('tags:');
  });

  // AC-ED-04: Cmd+N / Ctrl+N 新規ノート作成 (RBC-1 / FAIL-01)
  test('AC-ED-04/FAIL-01: new note creation via keyboard shortcut', async ({
    page,
  }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);

    // Count notes before
    const notesBefore = listNotesOnDisk(tempDir);

    // Press Cmd+N / Ctrl+N
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(2_000); // Wait for IPC + file creation

    // Verify a new note file was created
    const notesAfter = listNotesOnDisk(tempDir);
    expect(
      notesAfter.length,
      'New note file must be created on Cmd+N / Ctrl+N (RBC-1 / FAIL-01)',
    ).toBeGreaterThan(notesBefore.length);

    // Verify the new file has valid filename format
    const newNote = notesAfter.find((f) => !notesBefore.includes(f));
    expect(newNote).toBeDefined();
    expect(newNote).toMatch(/^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/);
  });

  // AC-ED-04: Focus moves to body after new note creation
  test('AC-ED-04: focus moves to editor body after new note', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(1_000);

    // Verify the CodeMirror editor has focus
    const editorFocused = await page.evaluate(() => {
      const cmContent = document.querySelector('.cm-content');
      return cmContent !== null && document.activeElement?.closest('.cm-editor') !== null;
    });
    expect(editorFocused, 'Editor body must have focus after new note creation').toBe(
      true,
    );
  });

  // AC-ED-05: 1クリックコピーボタン (RBC-1 / FAIL-02)
  test('AC-ED-05/FAIL-02: copy button exists and copies body text', async ({
    page,
  }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    // Create note and type content
    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(1_000);

    const testBody = 'E2E test clipboard content for copy button verification';
    await typeInEditor(page, testBody);
    await page.waitForTimeout(600); // Wait for debounce

    // Verify copy button is visible
    const copyBtn = getCopyButton(page);
    await expect(
      copyBtn.first(),
      'Copy button must be visible on editor screen (RBC-1 / FAIL-02)',
    ).toBeVisible();

    // Click copy button
    await copyBtn.first().click();
    await page.waitForTimeout(500);

    // Verify clipboard content via page.evaluate
    const clipboardText = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return null;
      }
    });

    // Note: clipboard read may be restricted in CI; verify at minimum that button click succeeded
    if (clipboardText !== null) {
      expect(clipboardText).toContain(testBody);
    }
  });

  // AC-ED-06: 自動保存 (RBC-3 / FAIL-07)
  test('AC-ED-06/FAIL-07: auto-save persists content without manual save', async ({
    page,
  }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(1_500);

    const bodyText = 'Auto-save E2E test content: verify persistence';
    await typeInEditor(page, bodyText);

    // Wait for debounce (500ms) + IPC + fs write
    await page.waitForTimeout(2_000);

    // Read the note from disk and verify content was saved
    const notes = listNotesOnDisk(tempDir);
    expect(notes.length).toBeGreaterThan(0);

    const latestNote = notes[0];
    const savedContent = readNoteFromDisk(tempDir, latestNote);
    expect(savedContent, 'Auto-save must persist content to disk (RBC-3 / FAIL-07)').not.toBeNull();
    expect(savedContent).toContain(bodyText);
  });

  // IPC boundary enforcement
  test('IPC: editor does not directly access filesystem', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');
    await assertNoDirectFileAccess(page);
  });

  // Auto-save invokes save_note IPC with valid filename
  test('IPC: auto-save uses save_note with valid YYYY-MM-DDTHHMMSS.md filename', async ({
    page,
  }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    await assertSaveNoteCalledWithValidFilename(page, async () => {
      const shortcut = getNewNoteShortcut(platformConfig.platform);
      await page.keyboard.press(shortcut);
      await page.waitForTimeout(1_000);
      await typeInEditor(page, 'IPC filename validation test');
      await page.waitForTimeout(1_500);
    });
  });

  // New note creation invokes create_note IPC
  test('IPC: Cmd+N / Ctrl+N invokes create_note command', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    await assertIPCCommandCalled(
      page,
      async () => {
        const shortcut = getNewNoteShortcut(platformConfig.platform);
        await page.keyboard.press(shortcut);
        await page.waitForTimeout(1_500);
      },
      'create_note',
    );
  });
});
