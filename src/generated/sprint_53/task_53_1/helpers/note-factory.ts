// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
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
// @generated-by: codd implement --sprint 53
import * as fs from 'fs';
import * as path from 'path';
import { NOTES_DIR, FILENAME_REGEX, NoteMetadata } from './test-data';

/**
 * 指定の日時・タグ・本文でノートファイルをプログラム的に作成する。
 * ファイル名は YYYY-MM-DDTHHMMSS.md 形式に準拠する (RB-3)。
 */
export function createNoteFile(options: {
  date?: Date;
  tags?: string[];
  body?: string;
}): { filePath: string; id: string } {
  const date = options.date ?? new Date();
  const id = formatNoteId(date);
  const filename = `${id}.md`;
  const filePath = path.join(NOTES_DIR, filename);

  const tags = options.tags ?? [];
  const body = options.body ?? '';
  const tagsYaml = tags.length > 0 ? `tags:\n${tags.map(t => `  - ${t}`).join('\n')}` : 'tags: []';
  const content = `---\n${tagsYaml}\n---\n${body}`;

  fs.mkdirSync(NOTES_DIR, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return { filePath, id };
}

/** 指定ディレクトリ内の全 .md ファイルを削除する (テスト後クリーンアップ用) */
export function cleanNotesDir(dir: string = NOTES_DIR): void {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (FILENAME_REGEX.test(f)) {
      fs.unlinkSync(path.join(dir, f));
    }
  }
}

/** 日付オブジェクトから YYYY-MM-DDTHHMMSS 形式の ID を生成する */
export function formatNoteId(date: Date): string {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` +
    `T${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`
  );
}

/** 特定の日数分を過去に遡った日付のノートを作成する (直近 7 日間フィルタのテスト用) */
export function createNoteFileDaysAgo(
  daysAgo: number,
  options: { tags?: string[]; body?: string } = {}
): { filePath: string; id: string } {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  // 1 秒ずつずらして衝突回避
  date.setSeconds(date.getSeconds() - daysAgo);
  return createNoteFile({ date, ...options });
}

/** ファイルから NoteMetadata を読み取る */
export function readNoteMetadata(filePath: string): Pick<NoteMetadata, 'id' | 'tags' | 'preview'> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);
  const id = filename.replace('.md', '');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
  let tags: string[] = [];
  if (fmMatch) {
    const tagsMatch = fmMatch[1].match(/tags:\s*\[(.*?)\]/s);
    const tagsListMatch = fmMatch[1].match(/tags:\n((?:\s+-\s+.+\n?)*)/);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
    } else if (tagsListMatch) {
      tags = tagsListMatch[1].split('\n').map(t => t.replace(/^\s+-\s+/, '').trim()).filter(Boolean);
    }
  }
  const body = fmMatch ? content.slice(fmMatch[0].length) : content;
  return { id, tags, preview: body.slice(0, 100) };
}
