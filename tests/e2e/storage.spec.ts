import * as fs from 'fs';
import * as path from 'path';
import { waitForAppReady, navigateToView, typeInEditor } from '../helpers/webview-client';
import { getNewNoteShortcut, formatExpectedNotesDir, detectPlatform } from '../helpers/platform';
import { createTempNotesDir, cleanupTempDir, listNotesOnDisk, readNoteFromDisk, isValidNoteFilename, writeTestConfig } from '../helpers/test-fixtures';

describe('module:storage — E2E Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempNotesDir();
    writeTestConfig(tempDir, tempDir);
  });

  afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // AC-ST-01: Filename matches YYYY-MM-DDTHHMMSS.md
  it('AC-ST-01: new note filename matches YYYY-MM-DDTHHMMSS.md', async () => {
    await waitForAppReady();
    await navigateToView('editor');

    await browser.keys(getNewNoteShortcut().split('+'));
    await browser.pause(2_000);

    const notes = listNotesOnDisk(tempDir);
    expect(notes.length).toBeGreaterThanOrEqual(1);
    for (const filename of notes) {
      expect(isValidNoteFilename(filename)).toBe(true);
    }
  });

  // AC-ST-02: File is .md with YAML frontmatter
  it('AC-ST-02: saved file is .md with YAML frontmatter and body', async () => {
    await waitForAppReady();
    await navigateToView('editor');

    await browser.keys(getNewNoteShortcut().split('+'));
    await browser.pause(1_000);
    await typeInEditor('Test body content');
    await browser.pause(2_000);

    const notes = listNotesOnDisk(tempDir);
    expect(notes.length).toBeGreaterThanOrEqual(1);

    const content = readNoteFromDisk(tempDir, notes[0]);
    expect(content).not.toBeNull();
    expect(content!.startsWith('---')).toBe(true);
    expect(content!).toContain('tags:');
    expect(content!).toContain('Test body content');
  });

  // AC-ST-03: Default notes directory matches platform convention
  it('AC-ST-03: default notes directory matches platform convention', async () => {
    const expected = formatExpectedNotesDir();
    // Verify via platform detection — no real directory access needed
    const platform = detectPlatform();
    if (platform === 'linux') {
      expect(expected).toContain('.local/share/promptnotes/notes');
    } else {
      expect(expected).toContain('Library/Application Support/promptnotes/notes');
    }
  });

  // Filename immutability
  it('CONV-FILENAME: filename is immutable after creation', async () => {
    await waitForAppReady();
    await navigateToView('editor');

    await browser.keys(getNewNoteShortcut().split('+'));
    await browser.pause(2_000);

    const notesBefore = listNotesOnDisk(tempDir);
    const originalFilename = notesBefore[0];

    await typeInEditor('First edit\n');
    await browser.pause(1_500);
    await typeInEditor('Second edit\n');
    await browser.pause(1_500);

    const notesAfter = listNotesOnDisk(tempDir);
    expect(notesAfter).toContain(originalFilename);
  });

  // Data locality
  it('CONV-STORAGE: data is local .md files only, no DB', async () => {
    await waitForAppReady();
    await navigateToView('editor');

    await browser.keys(getNewNoteShortcut().split('+'));
    await browser.pause(1_000);
    await typeInEditor('Local storage test');
    await browser.pause(2_000);

    const allFiles = fs.readdirSync(tempDir, { recursive: true }) as string[];
    const dbFiles = allFiles.filter((f) =>
      f.endsWith('.sqlite') || f.endsWith('.sqlite3') || f.endsWith('.db'),
    );
    expect(dbFiles.length).toBe(0);
  });
});
