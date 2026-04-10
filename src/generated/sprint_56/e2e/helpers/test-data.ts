// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-2
// @task-title: 全 E2E テスト通過
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
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import type { Page } from '@playwright/test';
import { invokeTauriCommand } from './app-launch';

export const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}(\.md)?$/;

export function generateTimestampFilename(date = new Date()): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.md`
  );
}

export function buildNoteContent(tags: string[], body: string): string {
  const tagYaml = tags.length > 0 ? `tags:\n${tags.map((t) => `  - ${t}`).join('\n')}` : 'tags: []';
  return `---\n${tagYaml}\n---\n\n${body}`;
}

export function getDefaultNotesDir(): string {
  if (process.platform === 'linux') {
    return path.join(os.homedir(), '.local', 'share', 'promptnotes', 'notes');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'promptnotes', 'notes');
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

export function writeTestNote(notesDir: string, filename: string, tags: string[], body: string): void {
  fs.mkdirSync(notesDir, { recursive: true });
  fs.writeFileSync(path.join(notesDir, filename), buildNoteContent(tags, body), 'utf-8');
}

export function deleteTestNote(notesDir: string, filename: string): void {
  const filePath = path.join(notesDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function daysAgoFilename(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return generateTimestampFilename(d);
}

export function listNotesDir(notesDir: string): string[] {
  if (!fs.existsSync(notesDir)) return [];
  return fs.readdirSync(notesDir).filter((f) => f.endsWith('.md'));
}

export async function createNoteViaIpc(page: Page): Promise<string> {
  const result = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
  return result.filename;
}

export async function deleteNoteViaIpc(page: Page, filename: string): Promise<void> {
  await invokeTauriCommand(page, 'delete_note', { filename });
}

export interface CleanupHandle {
  filenames: string[];
  notesDir: string;
  cleanup(): void;
}

export function makeCleanup(notesDir: string): CleanupHandle {
  const filenames: string[] = [];
  return {
    filenames,
    notesDir,
    cleanup() {
      for (const f of filenames) {
        deleteTestNote(notesDir, f);
      }
    },
  };
}
