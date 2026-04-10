// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: グリッドビュー → エディタ → 自動保存 → グリッドビューに戻り変更が反映されるエンドツーエンドのワークフロー確認
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface NoteFileContent {
  frontmatter: { tags: string[] };
  body: string;
}

export interface CreateNoteOptions {
  tags?: string[];
  body?: string;
  timestampOverride?: Date;
}

function getNotesDir(): string {
  const custom = process.env.PROMPTNOTES_TEST_NOTES_DIR;
  if (custom) return custom;

  if (process.platform === 'linux') {
    return path.join(os.homedir(), '.local', 'share', 'promptnotes', 'notes');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'promptnotes', 'notes');
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

export function generateTimestampFilename(date = new Date()): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${mo}-${d}T${h}${mi}${s}.md`;
}

function buildFileContent(tags: string[], body: string): string {
  const tagList = tags.map((t) => `  - ${t}`).join('\n');
  const fm = tags.length > 0 ? `---\ntags:\n${tagList}\n---\n\n` : `---\ntags: []\n---\n\n`;
  return `${fm}${body}`;
}

export async function createTestNoteFile(options: CreateNoteOptions = {}): Promise<string> {
  const { tags = [], body = 'テスト本文', timestampOverride } = options;
  const notesDir = getNotesDir();
  await fs.mkdir(notesDir, { recursive: true });

  const filename = generateTimestampFilename(timestampOverride ?? new Date());
  const filepath = path.join(notesDir, filename);
  await fs.writeFile(filepath, buildFileContent(tags, body), 'utf-8');
  return filename;
}

export async function cleanupTestNotes(filenames: string[]): Promise<void> {
  const notesDir = getNotesDir();
  await Promise.allSettled(
    filenames.map((f) => fs.unlink(path.join(notesDir, f)))
  );
}

export async function parseNoteFile(filename: string): Promise<NoteFileContent> {
  const notesDir = getNotesDir();
  const content = await fs.readFile(path.join(notesDir, filename), 'utf-8');

  if (!content.startsWith('---\n')) {
    return { frontmatter: { tags: [] }, body: content };
  }

  const endIdx = content.indexOf('\n---\n', 4);
  if (endIdx === -1) {
    return { frontmatter: { tags: [] }, body: content };
  }

  const fmRaw = content.slice(4, endIdx);
  const body = content.slice(endIdx + 5);

  const tagsMatch = fmRaw.match(/^tags:\s*\[([^\]]*)\]/m);
  const tagsListMatch = fmRaw.match(/^tags:\n((?:\s+-\s+.+\n?)*)/m);

  let tags: string[] = [];
  if (tagsMatch) {
    tags = tagsMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  } else if (tagsListMatch) {
    tags = tagsListMatch[1]
      .split('\n')
      .map((l) => l.replace(/^\s+-\s+/, '').trim())
      .filter(Boolean);
  }

  return { frontmatter: { tags }, body };
}

export async function createOldTestNoteFile(daysAgo: number, options: CreateNoteOptions = {}): Promise<string> {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return createTestNoteFile({ ...options, timestampOverride: date });
}
