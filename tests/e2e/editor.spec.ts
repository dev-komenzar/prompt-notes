import { waitForAppReady, navigateToView, isCodeMirror6Active, getEditorContent, typeInEditor, hasTitleInputField, hasMarkdownPreview, hasFrontmatterDecoration, getCopyButton } from '../helpers/webview-client';
import { getNewNoteShortcut } from '../helpers/platform';
import { createTempNotesDir, cleanupTempDir, listNotesOnDisk, readNoteFromDisk } from '../helpers/test-fixtures';

describe('module:editor — E2E Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempNotesDir();
  });

  afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // AC-ED-01: CodeMirror 6 エディタの採用
  it('AC-ED-01: editor engine is CodeMirror 6', async () => {
    await waitForAppReady();
    await navigateToView('editor');
    const isCM6 = await isCodeMirror6Active();
    expect(isCM6).toBe(true);
  });

  // AC-ED-01: Markdown syntax highlighting
  it('AC-ED-01: Markdown syntax highlighting is active', async () => {
    await waitForAppReady();
    await navigateToView('editor');
    await typeInEditor('# Heading\n\n**bold** and *italic*');
    await browser.pause(500);

    const highlights = await browser.$$('.cm-content .cm-header, .cm-content .tok-heading, .cm-content [class*="heading"], .cm-content .cm-strong, .cm-content .tok-strong');
    expect(highlights.length).toBeGreaterThan(0);
  });

  // AC-ED-01 / FAIL-05: No Markdown preview
  it('FAIL-05: no Markdown preview exists', async () => {
    await waitForAppReady();
    await navigateToView('editor');
    expect(await hasMarkdownPreview()).toBe(false);
  });

  // AC-ED-02 / FAIL-04: No title input field
  it('FAIL-04: no title input field exists', async () => {
    await waitForAppReady();
    await navigateToView('editor');
    expect(await hasTitleInputField()).toBe(false);
  });

  // AC-ED-03: frontmatter background decoration
  it('AC-ED-03: frontmatter region has background decoration', async () => {
    await waitForAppReady();
    await navigateToView('editor');
    await browser.pause(500);
    expect(await hasFrontmatterDecoration()).toBe(true);
  });

  // AC-ED-04: Cmd+N / Ctrl+N creates new note
  it('AC-ED-04: new note creation via keyboard shortcut', async () => {
    await waitForAppReady();
    await navigateToView('editor');

    const notesBefore = listNotesOnDisk(tempDir);
    const shortcut = getNewNoteShortcut();
    await browser.keys(shortcut.split('+'));
    await browser.pause(2_000);

    const notesAfter = listNotesOnDisk(tempDir);
    expect(notesAfter.length).toBeGreaterThan(notesBefore.length);
  });

  // AC-ED-05: Copy button exists
  it('AC-ED-05: copy button exists', async () => {
    await waitForAppReady();
    await navigateToView('editor');
    const btn = await getCopyButton();
    expect(await btn.isExisting()).toBe(true);
  });

  // AC-ED-06: Auto-save
  it('AC-ED-06: auto-save persists content without manual save', async () => {
    await waitForAppReady();
    await navigateToView('editor');

    const shortcut = getNewNoteShortcut();
    await browser.keys(shortcut.split('+'));
    await browser.pause(1_500);

    const bodyText = 'Auto-save E2E test content';
    await typeInEditor(bodyText);
    await browser.pause(2_000);

    const notes = listNotesOnDisk(tempDir);
    expect(notes.length).toBeGreaterThan(0);
    const savedContent = readNoteFromDisk(tempDir, notes[0]);
    expect(savedContent).not.toBeNull();
    expect(savedContent!).toContain(bodyText);
  });
});
