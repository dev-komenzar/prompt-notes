import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename);
}

export function generateNoteFilename(date?: Date): string {
  const d = date ?? new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.md`;
}

export function buildNoteContent(
  tags: string[] = [],
  body: string = ""
): string {
  const tagLines =
    tags.length > 0
      ? tags.map((t) => `  - ${t}`).join("\n")
      : "";
  const yamlContent = tagLines ? `tags:\n${tagLines}` : "tags: []";
  return `---\n${yamlContent}\n---\n\n${body}`;
}

export function createTempNotesDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "promptnotes-test-"));
}

export function cleanupTempDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

export function seedNote(
  dir: string,
  tags: string[] = [],
  body: string = "",
  date?: Date
): string {
  const filename = generateNoteFilename(date);
  const content = buildNoteContent(tags, body);
  fs.writeFileSync(path.join(dir, filename), content, "utf-8");
  return filename;
}

export function seedOldNote(
  dir: string,
  daysAgo: number,
  tags: string[] = [],
  body: string = ""
): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return seedNote(dir, tags, body, d);
}

export function seedRecentNotes(
  dir: string,
  count: number,
  tags: string[] = []
): string[] {
  const filenames: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setSeconds(d.getSeconds() - i);
    filenames.push(seedNote(dir, tags, `Note body ${i}`, d));
  }
  return filenames;
}

export function seedNavigationFixture(dir: string): string[] {
  return seedRecentNotes(dir, 5);
}

export function readNoteFromDisk(dir: string, filename: string): string {
  return fs.readFileSync(path.join(dir, filename), "utf-8");
}

export function listNotesOnDisk(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => FILENAME_REGEX.test(f))
    .sort()
    .reverse();
}

export function writeTestConfig(dir: string, notesDir: string): void {
  const configPath = path.join(dir, "config.json");
  fs.writeFileSync(
    configPath,
    JSON.stringify({ notes_directory: notesDir }),
    "utf-8"
  );
}
