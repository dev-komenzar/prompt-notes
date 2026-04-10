// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/acceptance_criteria.md
// @generated-by: codd propagate
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

export function getDefaultNotesDir(): string {
  const platform = process.platform;
  const home = os.homedir();
  if (platform === 'linux') {
    return path.join(home, '.local', 'share', 'promptnotes', 'notes');
  } else if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'promptnotes', 'notes');
  }
  throw new Error(`Unsupported platform: ${platform}`);
}

export function generateTimestampFilename(date = new Date()): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d}T${h}${mi}${s}.md`;
}

export function buildNoteContent(tags: string[], body: string): string {
  const tagsYaml =
    tags.length > 0
      ? `tags:\n${tags.map((t) => `  - ${t}`).join('\n')}`
      : 'tags: []';
  return `---\n${tagsYaml}\n---\n\n${body}`;
}

export function createTestNote(notesDir: string, opts: { daysAgo?: number; tags?: string[]; body?: string } = {}): string {
  const { daysAgo = 0, tags = [], body = 'test note body' } = opts;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  // Avoid same-second collision in tests
  date.setSeconds(date.getSeconds() + Math.floor(Math.random() * 59));
  const filename = generateTimestampFilename(date);
  const content = buildNoteContent(tags, body);
  fs.mkdirSync(notesDir, { recursive: true });
  fs.writeFileSync(path.join(notesDir, filename), content, 'utf-8');
  return filename;
}

export function deleteTestNote(notesDir: string, filename: string): void {
  const filePath = path.join(notesDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function readNoteFile(notesDir: string, filename: string): string {
  return fs.readFileSync(path.join(notesDir, filename), 'utf-8');
}

export function listNoteFiles(notesDir: string): string[] {
  if (!fs.existsSync(notesDir)) return [];
  return fs.readdirSync(notesDir).filter((f) => f.endsWith('.md') && FILENAME_REGEX.test(f));
}

export function cleanupTestNotes(notesDir: string, filenames: string[]): void {
  for (const f of filenames) {
    deleteTestNote(notesDir, f);
  }
}
