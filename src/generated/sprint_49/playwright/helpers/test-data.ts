// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 49-1
// @task-title: 下記テストケース一覧のすべてが Playwright で通過
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd propagate

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FILENAME_RE = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

export function getDefaultNotesDir(): string {
  const home = os.homedir();
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'promptnotes', 'notes');
  }
  return path.join(home, '.local', 'share', 'promptnotes', 'notes');
}

export function generateFilename(date: Date = new Date()): string {
  const p = (n: number, len = 2): string => String(n).padStart(len, '0');
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
    `T${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}.md`
  );
}

export function generateFilenameForDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  // Use non-current time to avoid collisions
  d.setHours(10, 0, 0, 0);
  return generateFilename(d);
}

export function buildNoteContent(tags: string[], body: string): string {
  const tagsLine =
    tags.length > 0
      ? `tags:\n${tags.map((t) => `  - ${t}`).join('\n')}`
      : 'tags: []';
  return `---\n${tagsLine}\n---\n\n${body}`;
}

export function createNoteFile(
  notesDir: string,
  filename: string,
  tags: string[],
  body: string,
): string {
  fs.mkdirSync(notesDir, { recursive: true });
  const filePath = path.join(notesDir, filename);
  fs.writeFileSync(filePath, buildNoteContent(tags, body), 'utf-8');
  return filePath;
}

export function deleteNoteFile(notesDir: string, filename: string): void {
  const p = path.join(notesDir, filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function cleanupNoteFiles(notesDir: string, filenames: string[]): void {
  for (const f of filenames) deleteNoteFile(notesDir, f);
}

export function readNoteFile(
  notesDir: string,
  filename: string,
): { frontmatter: string; body: string; raw: string } {
  const raw = fs.readFileSync(path.join(notesDir, filename), 'utf-8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { frontmatter: '', body: raw, raw };
  return { frontmatter: m[1], body: m[2], raw };
}

export function listNoteFiles(notesDir: string): string[] {
  if (!fs.existsSync(notesDir)) return [];
  return fs.readdirSync(notesDir).filter((f) => FILENAME_RE.test(f));
}

export function assertFilenameFormat(filename: string): void {
  if (!FILENAME_RE.test(filename)) {
    throw new Error(`Filename "${filename}" does not match YYYY-MM-DDTHHMMSS.md format`);
  }
}
