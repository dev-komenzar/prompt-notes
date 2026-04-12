// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/test/acceptance_criteria.md
// @generated-by: codd propagate

import * as fs from 'fs';
import * as path from 'path';

export interface NoteSpec {
  offsetDays?: number;   // negative = past (e.g. -3 = 3 days ago)
  tags?: string[];
  body?: string;
  customDate?: Date;
}

export interface CreatedNote {
  id: string;
  filename: string;
  filepath: string;
  tags: string[];
  body: string;
  created_at: Date;
}

export function formatTimestamp(d: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

export function buildNoteContent(tags: string[], body: string): string {
  const tagsYaml = tags.length > 0 ? `[${tags.join(', ')}]` : '[]';
  return `---\ntags: ${tagsYaml}\n---\n${body}`;
}

export function createNoteFile(notesDir: string, spec: NoteSpec): CreatedNote {
  fs.mkdirSync(notesDir, { recursive: true });

  const now = spec.customDate ?? new Date();
  if (spec.offsetDays !== undefined && !spec.customDate) {
    now.setDate(now.getDate() + spec.offsetDays);
  }

  const id = formatTimestamp(now);
  let filename = `${id}.md`;
  let filepath = path.join(notesDir, filename);

  // collision guard: increment seconds
  let attempt = 0;
  while (fs.existsSync(filepath) && attempt < 10) {
    attempt++;
    const adjusted = new Date(now.getTime() + attempt * 1000);
    const newId = formatTimestamp(adjusted);
    filename = `${newId}.md`;
    filepath = path.join(notesDir, filename);
  }

  const tags = spec.tags ?? [];
  const body = spec.body ?? 'テスト本文';
  const content = buildNoteContent(tags, body);
  fs.writeFileSync(filepath, content, 'utf-8');

  return { id: filename.replace('.md', ''), filename, filepath, tags, body, created_at: now };
}

export function cleanNoteFiles(notesDir: string, ids: string[]): void {
  for (const id of ids) {
    const p = path.join(notesDir, `${id}.md`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

export function cleanAllNoteFiles(notesDir: string): void {
  if (!fs.existsSync(notesDir)) return;
  for (const f of fs.readdirSync(notesDir)) {
    if (/^\d{4}-\d{2}-\d{2}T\d{6}\.md$/.test(f)) {
      fs.unlinkSync(path.join(notesDir, f));
    }
  }
}
