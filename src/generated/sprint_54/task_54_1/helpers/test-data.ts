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

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { createNoteFile, cleanAllNoteFiles, type CreatedNote } from './note-factory';

export function resolveDefaultNotesDir(): string {
  if (process.platform === 'linux') {
    return path.join(os.homedir(), '.local', 'share', 'promptnotes', 'notes');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'promptnotes', 'notes');
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

export function resolveTestNotesDir(): string {
  return path.join(os.tmpdir(), 'promptnotes-e2e-test', 'notes');
}

export interface TestDataSet {
  notesDir: string;
  recent: CreatedNote[];     // within last 7 days
  old: CreatedNote[];        // older than 7 days
  tagged: CreatedNote[];     // notes with specific tags
  searchable: CreatedNote[]; // notes with unique body text for search
}

export function setupGridTestData(notesDir: string): TestDataSet {
  cleanAllNoteFiles(notesDir);

  const recent: CreatedNote[] = [];
  const old: CreatedNote[] = [];
  const tagged: CreatedNote[] = [];
  const searchable: CreatedNote[] = [];

  // Recent notes (within 7 days) — varied offsets to ensure ordering
  recent.push(createNoteFile(notesDir, { offsetDays: 0, tags: ['rust', 'tauri'], body: 'Tauri フロントエンド IPC 設計メモ' }));
  recent.push(createNoteFile(notesDir, { offsetDays: -1, tags: ['svelte'], body: 'Svelte ストア設計パターン' }));
  recent.push(createNoteFile(notesDir, { offsetDays: -3, tags: ['rust', 'storage'], body: 'ファイル保存ロジックのメモ' }));
  recent.push(createNoteFile(notesDir, { offsetDays: -6, tags: [], body: 'タグなしのメモ' }));

  // Old notes (older than 7 days)
  old.push(createNoteFile(notesDir, { offsetDays: -8, tags: ['old-tag'], body: '古いノート 8日前' }));
  old.push(createNoteFile(notesDir, { offsetDays: -30, tags: ['archive'], body: '30日前のアーカイブノート' }));

  // Tagged notes for filter tests
  tagged.push(createNoteFile(notesDir, { offsetDays: -2, tags: ['rust', 'codegen'], body: 'コード生成に関するメモ' }));
  tagged.push(createNoteFile(notesDir, { offsetDays: -4, tags: ['codegen'], body: 'codegen のみのタグ' }));

  // Searchable notes with unique text
  searchable.push(createNoteFile(notesDir, { offsetDays: -1, tags: [], body: 'UNIQUE_SEARCH_TOKEN_XYZ123 このノートはユニーク検索用' }));
  searchable.push(createNoteFile(notesDir, { offsetDays: -2, tags: ['search-test'], body: 'もう一つの UNIQUE_SEARCH_TOKEN_XYZ123 ノート' }));

  return { notesDir, recent, old, tagged, searchable };
}

export function teardownTestData(notesDir: string): void {
  cleanAllNoteFiles(notesDir);
}

export function countFilesInDir(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
}
