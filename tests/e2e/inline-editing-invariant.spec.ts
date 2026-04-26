import { waitForAppReady, setNotesDirectoryAndReload } from '../helpers/webview-client';
import {
  createTempNotesDir,
  cleanupTempDir,
  seedRecentNotes,
  writeTestConfig,
} from '../helpers/test-fixtures';

/**
 * INV-CONTAIN (component_architecture.md §2.1b / §4.3b) — Inline editing containment invariants.
 *
 * These assertions encode the structural guarantees that any implementation of the feed + note-card
 * + editor must preserve. They are designed to fail on the FBD-01/FBD-02 anti-patterns (App-level
 * `currentView` view-switching or URL-routed editor pages) which replace the entire feed with a
 * full-screen editor on click.
 */
describe('INV-CONTAIN — Inline editing containment invariants', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempNotesDir();
    writeTestConfig(tempDir, tempDir);
  });

  afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // INV-CONTAIN-03: Feed and its sibling note-cards remain in the DOM while any single card is in edit mode.
  it('INV-CONTAIN-03: feed stays mounted during edit mode (sibling note-cards remain in DOM)', async () => {
    seedRecentNotes(tempDir, 2);
    await setNotesDirectoryAndReload(tempDir);
    await browser.pause(500);

    const cardsBefore = await browser.$$('[data-testid="note-card"]');
    expect(cardsBefore.length).toBeGreaterThanOrEqual(2);

    await cardsBefore[0].click();
    await browser.pause(500);

    const cardsAfter = await browser.$$('[data-testid="note-card"]');
    expect(cardsAfter.length).toBeGreaterThanOrEqual(2);
  });

  // INV-CONTAIN-02: The CodeMirror EditorView (`.cm-editor`) lives as a DOM descendant of the editing note-card,
  // not as a sibling of the feed at the App level.
  it('INV-CONTAIN-02: .cm-editor is a descendant of the active note-card', async () => {
    seedRecentNotes(tempDir, 2);
    await setNotesDirectoryAndReload(tempDir);
    await browser.pause(500);

    const cardsBefore = await browser.$$('[data-testid="note-card"]');
    await cardsBefore[0].click();

    await browser.waitUntil(
      async () => (await browser.$('.cm-editor')).isExisting(),
      { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s after card click' },
    );

    // Re-query the first card after edit-mode rendering has settled.
    const cardsAfter = await browser.$$('[data-testid="note-card"]');
    expect(cardsAfter.length).toBeGreaterThanOrEqual(2);

    const editorWithinFirstCard = await cardsAfter[0].$('.cm-editor');
    expect(await editorWithinFirstCard.isExisting()).toBe(true);
  });

  // INV-CONTAIN-04: Across the entire feed there is at most one `EditorView` (i.e. one `.cm-editor`).
  // Switching cards must destroy the old editor and re-create it in the new card — never stack instances.
  it('INV-CONTAIN-04: at most one .cm-editor instance exists feed-wide, even across card switches', async () => {
    seedRecentNotes(tempDir, 3);
    await setNotesDirectoryAndReload(tempDir);
    await browser.pause(500);

    const cardsBefore = await browser.$$('[data-testid="note-card"]');
    await cardsBefore[0].click();

    await browser.waitUntil(
      async () => (await browser.$('.cm-editor')).isExisting(),
      { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount after first card click' },
    );

    const editorsAfterFirstClick = await browser.$$('.cm-editor');
    expect(editorsAfterFirstClick.length).toBe(1);

    // Click the second card while the first is still editing; the old EditorView must be destroyed
    // and the new one created — not stacked.
    const cardsMid = await browser.$$('[data-testid="note-card"]');
    await cardsMid[1].click();
    await browser.pause(800);

    const editorsAfterSecondClick = await browser.$$('.cm-editor');
    expect(editorsAfterSecondClick.length).toBe(1);

    // Verify the editor is now inside the second card, not the first.
    const cardsEnd = await browser.$$('[data-testid="note-card"]');
    const editorInSecond = await cardsEnd[1].$('.cm-editor');
    expect(await editorInSecond.isExisting()).toBe(true);
  });

  // INV-CONTAIN-05: CopyButton and DeleteButton are children of every note-card and remain mounted
  // across mode transitions — including on the non-editing sibling cards while one card is in edit mode.
  it('INV-CONTAIN-05: CopyButton/DeleteButton remain mounted on non-editing cards during edit mode', async () => {
    seedRecentNotes(tempDir, 2);
    await setNotesDirectoryAndReload(tempDir);
    await browser.pause(500);

    const cardsBefore = await browser.$$('[data-testid="note-card"]');
    await cardsBefore[0].click();
    await browser.pause(500);

    const cardsAfter = await browser.$$('[data-testid="note-card"]');
    expect(cardsAfter.length).toBeGreaterThanOrEqual(2);

    const nonEditingCard = cardsAfter[1];

    const copyBtn = await nonEditingCard.$(
      '[data-testid="copy-button"], .copy-button, button[aria-label*="Copy" i], button[aria-label*="コピー"]',
    );
    const deleteBtn = await nonEditingCard.$(
      '[data-testid="delete-button"], .delete-button, button[aria-label*="Delete" i], button[aria-label*="削除"]',
    );

    expect(await copyBtn.isExisting()).toBe(true);
    expect(await deleteBtn.isExisting()).toBe(true);
  });
});
