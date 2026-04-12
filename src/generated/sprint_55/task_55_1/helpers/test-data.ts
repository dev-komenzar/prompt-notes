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
import * as os from 'os';

export const TEST_NOTES_DIR_A = path.join(os.tmpdir(), `promptnotes-test-dir-a-${process.pid}`);
export const TEST_NOTES_DIR_B = path.join(os.tmpdir(), `promptnotes-test-dir-b-${process.pid}`);

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function cleanupDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function setupTestDirs(): void {
  ensureDir(TEST_NOTES_DIR_A);
  ensureDir(TEST_NOTES_DIR_B);
}

export function teardownTestDirs(): void {
  cleanupDir(TEST_NOTES_DIR_A);
  cleanupDir(TEST_NOTES_DIR_B);
}

export function listMdFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md'));
}

export function readNoteFile(dir: string, filename: string): string {
  return fs.readFileSync(path.join(dir, filename), 'utf-8');
}

export function noteExistsInDir(dir: string, id: string): boolean {
  return fs.existsSync(path.join(dir, `${id}.md`));
}
