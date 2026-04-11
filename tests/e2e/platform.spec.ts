import { waitForAppReady } from '../helpers/webview-client';
import { detectPlatform, formatExpectedNotesDir, getModKey } from '../helpers/platform';
import { createTempNotesDir, cleanupTempDir, writeTestConfig } from '../helpers/test-fixtures';

describe('Platform Requirements — E2E Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempNotesDir();
    writeTestConfig(tempDir, tempDir);
  });

  afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // App launches on current platform
  it('application launches successfully on current platform', async () => {
    const platform = detectPlatform();
    expect(['linux', 'macos']).toContain(platform);

    await waitForAppReady();
    const app = await browser.$('#app, [data-testid="app-root"]');
    expect(await app.isExisting()).toBe(true);
  });

  // Platform-specific default directory
  it('platform default directory follows OS convention', async () => {
    const expectedDir = formatExpectedNotesDir();
    const platform = detectPlatform();

    if (platform === 'linux') {
      expect(expectedDir).toContain('.local/share/promptnotes/notes');
    } else {
      expect(expectedDir).toContain('Library/Application Support/promptnotes/notes');
    }
  });

  // Platform-appropriate modifier key
  it('keyboard shortcut uses platform-appropriate modifier', async () => {
    const platform = detectPlatform();
    const modKey = getModKey();

    if (platform === 'linux') {
      expect(modKey).toBe('Control');
    } else {
      expect(modKey).toBe('Meta');
    }
  });
});
