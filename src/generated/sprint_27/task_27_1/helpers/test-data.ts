// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
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
// @generated-by: codd implement --sprint 27

import { invoke } from '@tauri-apps/api/core';

const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

export function generateTimestampFilename(date: Date = new Date()): string {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  return `${year}-${month}-${day}T${hours}${minutes}${seconds}.md`;
}

export function generateFilenameForDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return generateTimestampFilename(d);
}

export function buildNoteContent(tags: string[], body: string): string {
  const tagList = tags.map((t) => `  - ${t}`).join('\n');
  const frontmatter = tags.length > 0
    ? `---\ntags:\n${tagList}\n---\n\n`
    : `---\ntags: []\n---\n\n`;
  return frontmatter + body;
}

export function isValidFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename);
}

export async function createTestNote(tags: string[] = [], body: string = 'テスト本文'): Promise<string> {
  const result = await invoke<{ filename: string }>('create_note');
  const { filename } = result;
  await invoke('save_note', {
    filename,
    frontmatter: { tags },
    body,
  });
  return filename;
}

export async function deleteTestNote(filename: string): Promise<void> {
  try {
    await invoke('delete_note', { filename });
  } catch {
    // ignore if already deleted
  }
}

export { FILENAME_REGEX };
