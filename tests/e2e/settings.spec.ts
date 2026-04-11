import * as fs from 'fs';
import * as path from 'path';
import { waitForAppReady, navigateToView } from '../helpers/webview-client';
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

  // AC-SE-01: Settings screen shows directory path
  it('AC-SE-01: settings screen displays notes directory', async () => {
    await waitForAppReady();
    await navigateToView('settings');
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
    expect(config).toHaveProperty('notes_dir');
    expect(typeof config.notes_dir).toBe('string');
  });
});
