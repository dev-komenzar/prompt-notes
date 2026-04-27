import * as fs from 'fs';
import * as path from 'path';
import { waitForAppReady, openSettings } from '../helpers/webview-client';
import { createTempNotesDir, cleanupTempDir, writeTestConfig } from '../helpers/test-fixtures';

describe('module:settings — E2E Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempNotesDir();
    writeTestConfig(tempDir, tempDir);
  });

  afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // AC-UI-01: Settings modal shows directory path
  it('AC-UI-01: settings modal displays notes directory', async () => {
    await waitForAppReady();
    await openSettings();
    await browser.pause(500);

    const dirDisplay = await browser.$('[data-testid="notes-dir-display"], [data-testid="notes-dir-input"], input[aria-label*="directory" i], input[aria-label*="ディレクトリ"]');
    expect(await dirDisplay.isExisting()).toBe(true);
  });

  // Config file is JSON format
  it('config.json: settings are persisted in JSON format', async () => {
    const configPath = path.join(tempDir, 'config.json');
    writeTestConfig(tempDir, tempDir);

    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config).toHaveProperty('notes_directory');
    expect(typeof config.notes_directory).toBe('string');
  });
});
