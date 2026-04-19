import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

export function createTempNotesDir(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptnotes-e2e-'));
  const notesDir = path.join(tmpDir, 'notes');
  fs.mkdirSync(notesDir, { recursive: true });
  return tmpDir;
}

export function cleanupTempDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

export function generateNoteFilename(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d}T${h}${mi}${s}.md`;
}

export function buildNoteContent(tags: string[], body: string): string {
  const tagList = tags.length > 0 ? `[${tags.join(', ')}]` : '[]';
  return `---\ntags: ${tagList}\n---\n\n${body}`;
}

export function seedNote(notesDir: string, date: Date, tags: string[], body: string): string {
  const filename = generateNoteFilename(date);
  const content = buildNoteContent(tags, body);
  fs.writeFileSync(path.join(notesDir, 'notes', filename), content, 'utf-8');
  return filename;
}

export function seedRecentNotes(notesDir: string, count: number): string[] {
  const filenames: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setSeconds(date.getSeconds() - i);
    filenames.push(seedNote(notesDir, date, [`tag${i}`], `Test note #${i}`));
  }
  return filenames;
}

export function listNotesOnDisk(notesDir: string): string[] {
  const dir = path.join(notesDir, 'notes');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => FILENAME_REGEX.test(f)).sort().reverse();
}

export function readNoteFromDisk(notesDir: string, filename: string): string | null {
  const filePath = path.join(notesDir, 'notes', filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename);
}

export function writeTestConfig(baseDir: string, notesDir: string): void {
  const configPath = path.join(baseDir, 'config.json');
  const config = { notes_directory: path.join(notesDir, 'notes') + '/' };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
