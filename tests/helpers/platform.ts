import * as os from 'os';
import * as path from 'path';

export type SupportedPlatform = 'linux' | 'macos';

export function detectPlatform(): SupportedPlatform {
  const p = os.platform();
  if (p === 'linux') return 'linux';
  if (p === 'darwin') return 'macos';
  throw new Error(`Unsupported platform: ${p}. PromptNotes targets linux and macos only.`);
}

export function getModKey(): string {
  return detectPlatform() === 'macos' ? 'Meta' : 'Control';
}

export function getNewNoteShortcut(): string {
  return detectPlatform() === 'macos' ? 'Meta+n' : 'Control+n';
}

export function formatExpectedNotesDir(): string {
  const home = os.homedir();
  if (detectPlatform() === 'linux') {
    return path.join(home, '.local', 'share', 'promptnotes', 'notes');
  }
  return path.join(home, 'Library', 'Application Support', 'promptnotes', 'notes');
}
