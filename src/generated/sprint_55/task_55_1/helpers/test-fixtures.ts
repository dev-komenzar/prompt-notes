// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — テストフィクスチャ・ユーティリティ
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface TestNoteFixture {
  filename: string;
  content: string;
  tags: string[];
  body: string;
  createdAt: Date;
}

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

export function seedNote(
  notesDir: string,
  date: Date,
  tags: string[],
  body: string,
): TestNoteFixture {
  const filename = generateNoteFilename(date);
  const content = buildNoteContent(tags, body);
  const filePath = path.join(notesDir, 'notes', filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return { filename, content, tags, body, createdAt: date };
}

export function seedMultipleNotes(
  notesDir: string,
  count: number,
  options?: {
    baseDateOffset?: number;
    tagSets?: string[][];
    bodyPrefix?: string;
  },
): TestNoteFixture[] {
  const fixtures: TestNoteFixture[] = [];
  const now = new Date();
  const baseDateOffset = options?.baseDateOffset ?? 0;

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - baseDateOffset - i);
    date.setSeconds(date.getSeconds() - i); // ensure unique filenames

    const tags = options?.tagSets?.[i % (options.tagSets.length)] ?? [`tag${i}`];
    const body = `${options?.bodyPrefix ?? 'Test note'} #${i}\n\nThis is the body of note ${i}.`;

    fixtures.push(seedNote(notesDir, date, tags, body));
  }

  return fixtures;
}

export function seedRecentNotes(
  notesDir: string,
  withinDays: number,
  count: number,
): TestNoteFixture[] {
  return seedMultipleNotes(notesDir, count, {
    baseDateOffset: 0,
    bodyPrefix: `Recent note (within ${withinDays} days)`,
    tagSets: [['recent'], ['gpt', 'coding'], ['memo']],
  });
}

export function seedOldNotes(
  notesDir: string,
  daysAgo: number,
  count: number,
): TestNoteFixture[] {
  return seedMultipleNotes(notesDir, count, {
    baseDateOffset: daysAgo,
    bodyPrefix: `Old note (${daysAgo}+ days ago)`,
    tagSets: [['archive'], ['old']],
  });
}

export function writeTestConfig(baseDir: string, notesDir: string): void {
  const configPath = path.join(baseDir, 'config.json');
  const config = { notes_dir: path.join(notesDir, 'notes') + '/' };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function readNoteFromDisk(notesDir: string, filename: string): string | null {
  const filePath = path.join(notesDir, 'notes', filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

export function listNotesOnDisk(notesDir: string): string[] {
  const dir = path.join(notesDir, 'notes');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => FILENAME_REGEX.test(f))
    .sort()
    .reverse();
}

export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename);
}

export function parseDateFromFilename(filename: string): Date | null {
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  return new Date(
    parseInt(y, 10),
    parseInt(mo, 10) - 1,
    parseInt(d, 10),
    parseInt(h, 10),
    parseInt(mi, 10),
    parseInt(s, 10),
  );
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}
