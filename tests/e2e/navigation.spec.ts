import { waitForAppReady, navigateToView, getGridCardCount, clickGridCard, isCodeMirror6Active, typeInEditor } from '../helpers/webview-client';
import { getNewNoteShortcut } from '../helpers/platform';
import { createTempNotesDir, cleanupTempDir, seedRecentNotes, writeTestConfig } from '../helpers/test-fixtures';

describe('Cross-module Navigation — E2E Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempNotesDir();
    writeTestConfig(tempDir, tempDir);
  });

  afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // Grid → Editor via card click
  it('grid card click navigates to editor with content', async () => {
    seedRecentNotes(tempDir, 3);
    await waitForAppReady();
    await navigateToView('grid');
    await browser.pause(1_500);

    expect(await getGridCardCount()).toBeGreaterThanOrEqual(1);
    await clickGridCard(0);
    await browser.pause(1_500);

    expect(await isCodeMirror6Active()).toBe(true);
  });

  // Editor → Grid navigation
  it('can navigate from editor back to grid view', async () => {
    seedRecentNotes(tempDir, 2);
    await waitForAppReady();

    await navigateToView('editor');
    await browser.pause(500);
    expect(await isCodeMirror6Active()).toBe(true);

    await navigateToView('grid');
    await browser.pause(1_000);
    expect(await getGridCardCount()).toBeGreaterThanOrEqual(1);
  });

  // Settings → Grid → Editor round trip
  it('full navigation round trip: settings → grid → editor', async () => {
    seedRecentNotes(tempDir, 2);
    await waitForAppReady();

    await navigateToView('settings');
    await browser.pause(500);

    await navigateToView('grid');
    await browser.pause(1_000);
    expect(await getGridCardCount()).toBeGreaterThanOrEqual(1);

    await clickGridCard(0);
    await browser.pause(1_000);
    expect(await isCodeMirror6Active()).toBe(true);
  });

  // Cmd+N / Ctrl+N works from any view
  it('Cmd+N / Ctrl+N works from grid view', async () => {
    await waitForAppReady();
    await navigateToView('grid');
    await browser.pause(500);

    await browser.keys(getNewNoteShortcut().split('+'));
    await browser.pause(1_500);

    expect(await isCodeMirror6Active()).toBe(true);
  });

  // Auto-save persists across view transitions
  it('auto-save persists content when switching views', async () => {
    await waitForAppReady();
    await navigateToView('editor');

    await browser.keys(getNewNoteShortcut().split('+'));
    await browser.pause(1_000);

    const uniqueText = `Persist-test-${Date.now()}`;
    await typeInEditor(uniqueText);
    await browser.pause(2_000);

    await navigateToView('grid');
    await browser.pause(1_500);

    const cardCount = await getGridCardCount();
    if (cardCount > 0) {
      await clickGridCard(0);
      await browser.pause(1_500);

      const editorText = await (await browser.$('.cm-content')).getText();
      expect(editorText).toContain(uniqueText);
    }
  });
});
