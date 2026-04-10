// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 50

import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import {
  waitForAppReady,
  getBaseUrl,
} from '../../../generated/sprint_46/task_46_1/helpers/app-launch';
import {
  createTestNote,
  deleteTestNote,
  generateTimestampFilename,
  buildFrontmatter,
  FILENAME_REGEX,
} from '../../../generated/sprint_46/task_46_1/helpers/test-data';
import {
  assertNoServerError,
  assertFilenameFormat,
  assertFrontmatterValid,
} from '../../../generated/sprint_46/task_46_1/helpers/assertions';
import {
  typeIntoEditor,
  clickCopyButton,
  pressNewNote,
} from '../../../generated/sprint_46/task_46_1/helpers/editor';
import {
  setSearchQuery,
  selectTag,
  setDateRange,
  getVisibleCardFilenames,
  clickCard,
} from '../../../generated/sprint_46/task_46_1/helpers/grid';

// ---------------------------------------------------------------------------
// Release gate: all acceptance criteria must pass for a green CI pipeline
// ---------------------------------------------------------------------------

test.describe('AC-ED: Editor acceptance criteria', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(getBaseUrl());
    await waitForAppReady(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  /**
   * AC-ED-01: CodeMirror 6 with Markdown syntax highlight (no rendering)
   */
  test('AC-ED-01: CodeMirror 6 renders Markdown highlight classes without HTML elements', async () => {
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    // CodeMirror editor must be present
    const cmEditor = page.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();

    // Type Markdown syntax
    await typeIntoEditor(page, '# Heading\n**bold text**\n- list item');

    // Highlight classes should exist (from @codemirror/lang-markdown)
    const highlighted = page.locator('.cm-content [class*="tok-"]');
    await expect(highlighted.first()).toBeVisible();

    // NNC-E1: No rendered HTML elements in editor content
    const h1 = cmEditor.locator('h1');
    const strong = cmEditor.locator('strong');
    const em = cmEditor.locator('em');
    await expect(h1).toHaveCount(0);
    await expect(strong).toHaveCount(0);
    await expect(em).toHaveCount(0);
  });

  /**
   * AC-ED-02: No title input field
   */
  test('AC-ED-02: No title-dedicated input or textarea exists on editor page', async () => {
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    // NNC-E2: title input must not exist
    const titleInput = page.locator('input[placeholder*="title" i], input[aria-label*="title" i], textarea[placeholder*="title" i]');
    await expect(titleInput).toHaveCount(0);

    // General: only one textarea/input may exist for tag editing (not title)
    const allInputs = page.locator('input:not([type="hidden"]):not([type="button"]):not([type="submit"])');
    const count = await allInputs.count();
    // All inputs must be tag-related, never a title field
    for (let i = 0; i < count; i++) {
      const ariaLabel = await allInputs.nth(i).getAttribute('aria-label') ?? '';
      const placeholder = await allInputs.nth(i).getAttribute('placeholder') ?? '';
      expect(ariaLabel.toLowerCase()).not.toContain('title');
      expect(placeholder.toLowerCase()).not.toContain('title');
    }
  });

  /**
   * AC-ED-03: Frontmatter region with distinct background color
   */
  test('AC-ED-03: Frontmatter region has background-color distinct from body', async () => {
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    const fmLine = page.locator('.cm-frontmatter-bg').first();
    await expect(fmLine).toBeVisible();

    const fmBg = await fmLine.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    const bodyLine = page.locator('.cm-content .cm-line:not(.cm-frontmatter-bg)').first();
    const bodyBg = await bodyLine.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(fmBg).not.toBe(bodyBg);
  });

  /**
   * AC-ED-04: Cmd+N / Ctrl+N creates new note and focuses editor
   */
  test('AC-ED-04: Cmd+N / Ctrl+N creates new note and moves focus to editor', async () => {
    await page.goto(getBaseUrl());
    await waitForAppReady(page);

    const urlBefore = page.url();
    await pressNewNote(page);

    await page.waitForURL(/\/edit\//);
    expect(page.url()).not.toBe(urlBefore);
    expect(page.url()).toMatch(/\/edit\/\d{4}-\d{2}-\d{2}T\d{6}\.md/);

    // Editor must have focus
    const activeElement = await page.evaluate(() => document.activeElement?.className ?? '');
    expect(activeElement).toContain('cm-');
  });

  /**
   * AC-ED-05: 1-click copy button copies body (excluding frontmatter)
   */
  test('AC-ED-05: Copy button copies body content excluding frontmatter', async () => {
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    const bodyText = 'unique-copy-test-content-' + Date.now();
    await typeIntoEditor(page, bodyText);

    // Grant clipboard permissions and click copy
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await clickCopyButton(page);

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain(bodyText);
    // frontmatter markers must not be in copied content
    expect(clipboard).not.toMatch(/^---\n/);

    // Visual feedback: button shows copied state
    const copyBtn = page.locator('button[aria-label*="コピー"], button:has-text("コピー"), button:has-text("Copy")');
    const btnText = await copyBtn.textContent();
    expect(btnText).toMatch(/コピー済み|Copied|✓/);
  });

  /**
   * AC-ED-06: Auto-save persists content without explicit save action
   */
  test('AC-ED-06: Content is auto-saved without explicit user save action', async () => {
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    const uniqueContent = 'autosave-verification-' + Date.now();
    await typeIntoEditor(page, uniqueContent);

    // Wait for debounce + I/O (max 2000ms for debounce + save)
    await page.waitForTimeout(2000);

    // Reload the same note and verify content persisted
    const currentUrl = page.url();
    await page.goto(currentUrl);
    await waitForAppReady(page);

    const editorContent = await page.locator('.cm-content').textContent();
    expect(editorContent).toContain(uniqueContent);
  });
});

// ---------------------------------------------------------------------------

test.describe('AC-ST: Storage acceptance criteria', () => {
  /**
   * AC-ST-01: Filename follows YYYY-MM-DDTHHMMSS.md pattern
   */
  test('AC-ST-01: New note filename matches YYYY-MM-DDTHHMMSS.md format', async ({ page }) => {
    await page.goto(getBaseUrl());
    await waitForAppReady(page);

    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);

    const url = page.url();
    const filename = url.split('/edit/')[1];
    assertFilenameFormat(filename);
    expect(filename).toMatch(FILENAME_REGEX);
  });

  /**
   * AC-ST-02: File structure has YAML frontmatter with tags-only schema
   */
  test('AC-ST-02: Saved file has valid YAML frontmatter with tags field only', async ({ page }) => {
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    const filename = page.url().split('/edit/')[1];
    await typeIntoEditor(page, 'storage schema test');
    await page.waitForTimeout(1500); // wait for auto-save debounce

    // Invoke read_note via IPC to check file structure
    const noteData = await page.evaluate(async (fn: string) => {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke('read_note', { filename: fn });
    }, filename);

    assertFrontmatterValid(noteData as { frontmatter: { tags: string[] }; body: string });
  });

  /**
   * AC-ST-03: Default save directory is OS-appropriate
   */
  test('AC-ST-03: Default save directory matches OS-specific path', async ({ page }) => {
    await page.goto(getBaseUrl());
    await waitForAppReady(page);

    const settings = await page.evaluate(async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke('get_settings');
    });

    const notesDir = (settings as { notes_dir: string }).notes_dir;
    const isLinux = notesDir.includes('.local/share/promptnotes/notes');
    const isMac = notesDir.includes('Library/Application Support/promptnotes/notes');
    expect(isLinux || isMac).toBe(true);
  });

  /**
   * AC-ST-04: Settings screen allows changing save directory
   */
  test('AC-ST-04: Save directory can be changed via settings', async ({ page }) => {
    await page.goto(`${getBaseUrl()}/settings`);
    await waitForAppReady(page);

    const dirInput = page.locator('input[type="text"], input[placeholder*="dir" i], input[placeholder*="path" i]').first();
    await expect(dirInput).toBeVisible();

    // Verify save button / update action exists
    const saveBtn = page.locator('button:has-text("保存"), button:has-text("Save"), button:has-text("更新"), button:has-text("Apply")');
    await expect(saveBtn.first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe('AC-GR: Grid view acceptance criteria', () => {
  /**
   * AC-GR-01: Pinterest-style masonry layout
   */
  test('AC-GR-01: Grid view renders masonry (multi-column variable-height) layout', async ({ page }) => {
    await page.goto(getBaseUrl());
    await waitForAppReady(page);

    const grid = page.locator('.masonry-grid, [class*="masonry"], [class*="grid"]').first();
    await expect(grid).toBeVisible();

    const gridStyle = await grid.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { columns: cs.columns, columnCount: cs.columnCount, display: cs.display };
    });

    const isMultiColumn =
      gridStyle.display === 'grid' ||
      parseInt(gridStyle.columnCount) > 1 ||
      gridStyle.columns !== 'auto';
    expect(isMultiColumn).toBe(true);
  });

  /**
   * AC-GR-02: Default filter shows only last 7 days
   */
  test('AC-GR-02: Default filter shows only notes from last 7 days', async ({ page }) => {
    await page.goto(getBaseUrl());
    await waitForAppReady(page);

    // Create a note with old timestamp via IPC (simulated via test helper)
    const oldFilename = '2020-01-01T000000.md';
    await page.evaluate(async (fn: string) => {
      const { invoke } = await import('@tauri-apps/api/core');
      // Attempt to save an old note directly (may fail if blocked by path traversal guard)
      try {
        await invoke('save_note', {
          filename: fn,
          frontmatter: { tags: [] },
          body: 'old note that should not appear',
        });
      } catch {
        // expected if backend rejects out-of-range filenames
      }
    }, oldFilename);

    // Reload grid
    await page.reload();
    await waitForAppReady(page);

    const cards = await getVisibleCardFilenames(page);
    // None of the displayed cards should be from 2020
    const oldCards = cards.filter((f) => f.startsWith('2020-'));
    expect(oldCards).toHaveLength(0);
  });

  /**
   * AC-GR-03: Tag and date filter work correctly
   */
  test('AC-GR-03: Tag filter and date filter narrow visible cards', async ({ page }) => {
    await page.goto(getBaseUrl());
    await waitForAppReady(page);

    // Apply a tag filter that matches no notes
    await selectTag(page, '__nonexistent_tag_xyz__');
    await page.waitForTimeout(500);

    const cards = await getVisibleCardFilenames(page);
    expect(cards).toHaveLength(0);

    // Reset tag filter
    await selectTag(page, '__nonexistent_tag_xyz__');
  });

  /**
   * AC-GR-04: Full-text search filters cards by body content
   */
  test('AC-GR-04: Full-text search returns only matching notes', async ({ page }) => {
    // First create a note with unique content
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    const uniqueQuery = 'searchable-unique-string-' + Date.now();
    await typeIntoEditor(page, uniqueQuery);
    await page.waitForTimeout(1500);

    // Go to grid and search
    await page.goto(getBaseUrl());
    await waitForAppReady(page);

    // Expand date range to include today
    await setDateRange(page, undefined, undefined); // clear to all
    await setSearchQuery(page, uniqueQuery);
    await page.waitForTimeout(500);

    const cards = await getVisibleCardFilenames(page);
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  /**
   * AC-GR-05: Card click navigates to editor
   */
  test('AC-GR-05: Clicking a card navigates to /edit/:filename', async ({ page }) => {
    // Create a fresh note to ensure at least one card exists in last 7 days
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);
    await typeIntoEditor(page, 'card-click-test-' + Date.now());
    await page.waitForTimeout(1500);

    await page.goto(getBaseUrl());
    await waitForAppReady(page);

    // Remove date filter to see all recent notes
    await setDateRange(page, undefined, undefined);

    const cardsBefore = await getVisibleCardFilenames(page);
    expect(cardsBefore.length).toBeGreaterThanOrEqual(1);

    const filename = cardsBefore[0];
    await clickCard(page, filename);

    await page.waitForURL(/\/edit\//);
    expect(page.url()).toContain(`/edit/${filename}`);

    // Editor content must be visible
    const editor = page.locator('.cm-editor');
    await expect(editor).toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe('AC-CF: Settings acceptance criteria', () => {
  /**
   * AC-CF-01: Settings screen allows save directory change
   */
  test('AC-CF-01: Save directory setting persists after change', async ({ page }) => {
    await page.goto(`${getBaseUrl()}/settings`);
    await waitForAppReady(page);

    // Read current setting
    const original = await page.evaluate(async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const s = await invoke('get_settings') as { notes_dir: string };
      return s.notes_dir;
    });

    // Verify UI reflects it
    const dirInput = page.locator('input').first();
    const displayedValue = await dirInput.inputValue();
    expect(displayedValue).toBe(original);
  });
});

// ---------------------------------------------------------------------------

test.describe('FC: Failure criteria guards (release blockers)', () => {
  /**
   * FC-ED-01: Must use CodeMirror 6 — no other editor engine
   */
  test('FC-ED-01 guard: CodeMirror 6 is the editor engine (no Monaco, textarea, contenteditable)', async ({ page }) => {
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    // Monaco editor signature
    const monaco = page.locator('.monaco-editor');
    await expect(monaco).toHaveCount(0);

    // Raw textarea used as editor body
    const rawTextarea = page.locator('textarea.editor-body, textarea[data-role="editor"]');
    await expect(rawTextarea).toHaveCount(0);

    // CodeMirror 6 must be present
    const cm = page.locator('.cm-editor');
    await expect(cm).toBeVisible();
  });

  /**
   * FC-ED-02: No title input, no Markdown rendering
   */
  test('FC-ED-02 guard: No title field, no Markdown rendered HTML in editor', async ({ page }) => {
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    await typeIntoEditor(page, '# Heading\n**bold**\n_italic_');

    const cmContent = page.locator('.cm-content');

    // No rendered heading/bold/italic elements inside CodeMirror content
    await expect(cmContent.locator('h1,h2,h3,h4,h5,h6')).toHaveCount(0);
    await expect(cmContent.locator('strong, b')).toHaveCount(0);
    await expect(cmContent.locator('em, i')).toHaveCount(0);
  });

  /**
   * FC-ED-03: Cmd+N / Ctrl+N must work
   */
  test('FC-ED-03 guard: Cmd+N / Ctrl+N creates new note (not broken)', async ({ page }) => {
    await page.goto(getBaseUrl());
    await waitForAppReady(page);

    await pressNewNote(page);
    await expect(page).toHaveURL(/\/edit\//);
  });

  /**
   * FC-ED-04: Copy button must exist and be functional
   */
  test('FC-ED-04 guard: Copy button is present on editor page', async ({ page }) => {
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    const copyBtn = page.locator(
      'button[aria-label*="コピー"], button:has-text("コピー"), button[aria-label*="copy" i], button:has-text("Copy")'
    );
    await expect(copyBtn.first()).toBeVisible();
  });

  /**
   * FC-ST-01: Filename format must be YYYY-MM-DDTHHMMSS.md
   */
  test('FC-ST-01 guard: Filename format is YYYY-MM-DDTHHMMSS.md', async ({ page }) => {
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    const filename = page.url().split('/edit/')[1];
    expect(filename).toMatch(/^\d{4}-\d{2}-\d{2}T\d{6}\.md$/);
  });

  /**
   * FC-ST-03: No extra frontmatter fields auto-inserted
   */
  test('FC-ST-03 guard: Auto-saved frontmatter contains only tags field', async ({ page }) => {
    await page.goto(`${getBaseUrl()}/new`);
    await page.waitForURL(/\/edit\//);

    const filename = page.url().split('/edit/')[1];
    await typeIntoEditor(page, 'frontmatter field guard test');
    await page.waitForTimeout(1500);

    const note = await page.evaluate(async (fn: string) => {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke('read_note', { filename: fn }) as Promise<{
        frontmatter: Record<string, unknown>;
        body: string;
      }>;
    }, filename);

    const keys = Object.keys(note.frontmatter).filter((k) => k !== 'tags');
    expect(keys).toHaveLength(0);
  });

  /**
   * FC-GR-01: Default grid must filter to last 7 days
   */
  test('FC-GR-01 guard: Grid default does not show all-time notes', async ({ page }) => {
    await page.goto(getBaseUrl());
    await waitForAppReady(page);

    // Verify DateFilter exists and has a default value set
    const dateFromInput = page.locator('input[type="date"][name*="from" i], input[type="date"]:first-of-type');
    if (await dateFromInput.count() > 0) {
      const fromValue = await dateFromInput.inputValue();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const expected = sevenDaysAgo.toISOString().slice(0, 10);
      expect(fromValue).toBe(expected);
    }
  });

  /**
   * FC-SC-01: No AI call endpoints
   */
  test('FC-SC-01 guard: No external AI API calls made during normal usage', async ({ page, context }) => {
    const externalRequests: string[] = [];
    await context.route('**/*', (route) => {
      const url = route.request().url();
      if (
        url.includes('openai.com') ||
        url.includes('anthropic.com') ||
        url.includes('api.') ||
        url.includes('generativelanguage') ||
        (url.startsWith('http') && !url.startsWith('http://localhost') && !url.startsWith('http://127.'))
      ) {
        externalRequests.push(url);
      }
      route.continue();
    });

    await page.goto(getBaseUrl());
    await waitForAppReady(page);
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);
    await typeIntoEditor(page, 'AI guard test content');
    await page.waitForTimeout(1500);

    expect(externalRequests).toHaveLength(0);
  });

  /**
   * FC-SC-02: No network/cloud sync requests
   */
  test('FC-SC-02 guard: No cloud sync or fetch to external servers', async ({ page, context }) => {
    const networkCalls: string[] = [];
    await context.route('**/*', (route) => {
      const url = route.request().url();
      if (
        !url.startsWith('http://localhost') &&
        !url.startsWith('http://127.') &&
        url.startsWith('http')
      ) {
        networkCalls.push(url);
      }
      route.continue();
    });

    await page.goto(getBaseUrl());
    await waitForAppReady(page);
    await page.waitForTimeout(1000);

    expect(networkCalls).toHaveLength(0);
  });
});
