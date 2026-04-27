import * as path from 'path';
import {
  waitForAppReady,
  setNotesDirectoryAndReload,
} from '../helpers/webview-client';
import { getNewNoteShortcut } from '../helpers/platform';
import {
  createTempNotesDir,
  cleanupTempDir,
  listNotesOnDisk,
} from '../helpers/test-fixtures';

/**
 * Keyboard-shortcut acceptance for AC-EDIT-01 / FC-EDIT-01
 * (docs/test/acceptance_criteria.md): Cmd+N / Ctrl+N must create a new note
 * independently of the "+ New Note" button.
 *
 * This is the test-side counterpart to the FC-EDIT-01 isolation clause —
 * storage.spec.ts also fires the chord but only after clicking the button,
 * which masks any regression in the shortcut handler itself.
 */
describe('AC-EDIT-01 — Ctrl/Cmd+N creates a new note (button-isolated)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempNotesDir();
    await setNotesDirectoryAndReload(path.join(tempDir, 'notes'));
  });

  afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  it('AC-EDIT-01: Ctrl/Cmd+N (without clicking the New button) creates exactly one note', async () => {
    await waitForAppReady();
    await browser.pause(500);

    const notesDir = path.join(tempDir, 'notes');

    // Precondition: directory is empty after the per-test redirect.
    expect(listNotesOnDisk(notesDir)).toHaveLength(0);

    // Send the chord without first clicking the "+ New Note" button so that
    // the only possible note source is the keyboard shortcut handler.
    await browser.keys(getNewNoteShortcut().split('+'));
    await browser.pause(2_000);

    const notes = listNotesOnDisk(notesDir);
    expect(notes.length).toBe(1);
  });
});
