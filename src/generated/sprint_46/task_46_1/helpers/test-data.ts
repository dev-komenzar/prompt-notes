// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
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

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

export function defaultNotesDir(): string {
  if (process.platform === 'linux') {
    return path.join(os.homedir(), '.local', 'share', 'promptnotes', 'notes');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'promptnotes', 'notes');
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

export function generateFilename(date: Date = new Date()): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const Y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const D = pad(date.getDate());
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${Y}-${M}-${D}T${h}${m}${s}.md`;
}

export function buildNoteContent(tags: string[], body: string): string {
  const tagYaml = tags.length > 0 ? `\n  - ${tags.join('\n  - ')}` : ' []';
  return `---\ntags:${tagYaml}\n---\n\n${body}`;
}

export async function createTestNote(
  notesDir: string,
  opts: { date?: Date; tags?: string[]; body?: string } = {}
): Promise<string> {
  const date = opts.date ?? new Date();
  const tags = opts.tags ?? [];
  const body = opts.body ?? 'Test note body.';
  const filename = generateFilename(date);
  const content = buildNoteContent(tags, body);
  await fs.mkdir(notesDir, { recursive: true });
  await fs.writeFile(path.join(notesDir, filename), content, 'utf-8');
  return filename;
}

export async function deleteTestNote(notesDir: string, filename: string): Promise<void> {
  try {
    await fs.unlink(path.join(notesDir, filename));
  } catch {
    // ignore missing file
  }
}

export async function readTestNote(
  notesDir: string,
  filename: string
): Promise<string> {
  return fs.readFile(path.join(notesDir, filename), 'utf-8');
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
