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

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 55

import * as fs from 'fs';
import * as path from 'path';

export const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

export function buildNoteContent(tags: string[], body: string): string {
  const tagsYaml = tags.length > 0 ? `[${tags.join(', ')}]` : '[]';
  return `---\ntags: ${tagsYaml}\n---\n${body}`;
}

export function createNoteFile(dir: string, id: string, tags: string[], body: string): string {
  const filename = `${id}.md`;
  const content = buildNoteContent(tags, body);
  fs.writeFileSync(path.join(dir, filename), content, 'utf-8');
  return filename;
}

export function generateTimestampId(date: Date = new Date()): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${mo}-${d}T${h}${mi}${s}`;
}

export function createRecentNote(dir: string, tags: string[], body: string, offsetMs = 0): string {
  const date = new Date(Date.now() - offsetMs);
  const id = generateTimestampId(date);
  return createNoteFile(dir, id, tags, body);
}

export function parseFrontmatter(content: string): { tags: string[]; body: string } {
  if (!content.startsWith('---\n')) {
    return { tags: [], body: content };
  }
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return { tags: [], body: content };
  const yaml = content.slice(4, end);
  const body = content.slice(end + 5);
  const tagsMatch = yaml.match(/tags:\s*\[([^\]]*)\]/);
  const tags = tagsMatch
    ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean)
    : [];
  return { tags, body };
}
