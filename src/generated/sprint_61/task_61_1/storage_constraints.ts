// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 61-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:61 task:61-1
// @codd-sprint: 61
// @codd-task: 61-1

/**
 * Storage Constraint Validators
 *
 * Runtime validators that enforce storage-layer release-blocking constraints.
 * These are used in tests and in the constraint checklist.
 */

/**
 * RBC-STORAGE-1: ファイル名は YYYY-MM-DDTHHMMSS.md 形式で確定。作成時タイムスタンプで不変。
 */
const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;
const NOTE_ID_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}$/;

export function validateNoteFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename);
}

export function validateNoteId(id: string): boolean {
  return NOTE_ID_REGEX.test(id);
}

export function assertValidNoteFilename(filename: string): void {
  if (!validateNoteFilename(filename)) {
    throw new Error(
      `[STORAGE VIOLATION] ファイル名 "${filename}" は YYYY-MM-DDTHHMMSS.md 形式ではありません。` +
        `RBC-STORAGE-1違反。`,
    );
  }
}

export function assertValidNoteId(id: string): void {
  if (!validateNoteId(id)) {
    throw new Error(
      `[STORAGE VIOLATION] ノートID "${id}" は YYYY-MM-DDTHHMMSS 形式ではありません。` +
        `RBC-STORAGE-1違反。`,
    );
  }
}

/**
 * RBC-STORAGE-2: frontmatter は YAML形式、メタデータは tags のみ。
 * 作成日はファイル名から取得。追加フィールドの導入は要件変更が必要。
 */
export interface ValidatedFrontmatter {
  tags: string[];
}

export function validateFrontmatter(
  fm: Record<string, unknown>,
): fm is ValidatedFrontmatter {
  if (typeof fm !== 'object' || fm === null) return false;
  const keys = Object.keys(fm);
  // Only 'tags' is permitted. No other fields allowed.
  if (keys.some((k) => k !== 'tags')) return false;
  if (!Array.isArray(fm['tags'])) return false;
  return (fm['tags'] as unknown[]).every((t) => typeof t === 'string');
}

export function assertValidFrontmatter(fm: Record<string, unknown>): void {
  const prohibitedFields = Object.keys(fm).filter((k) => k !== 'tags');
  if (prohibitedFields.length > 0) {
    throw new Error(
      `[STORAGE VIOLATION] frontmatter に禁止フィールドが含まれています: [${prohibitedFields.join(', ')}]。` +
        `tags のみ許可されています。RBC-STORAGE-2違反。`,
    );
  }
  if (fm['tags'] !== undefined && !Array.isArray(fm['tags'])) {
    throw new Error(
      `[STORAGE VIOLATION] frontmatter.tags は配列でなければなりません。RBC-STORAGE-2違反。`,
    );
  }
}

/**
 * Parses note ID (filename without extension) to a Date object.
 * RBC-STORAGE-1: 作成日はファイル名から取得。
 */
export function parseNoteIdToDate(id: string): Date {
  assertValidNoteId(id);
  // "2026-04-11T143052" → "2026-04-11T14:30:52"
  const normalized = id.replace(/T(\d{2})(\d{2})(\d{2})$/, 'T$1:$2:$3');
  const date = new Date(normalized);
  if (isNaN(date.getTime())) {
    throw new Error(
      `[STORAGE VIOLATION] ノートID "${id}" から有効な日時を解析できません。RBC-STORAGE-1違反。`,
    );
  }
  return date;
}

/**
 * RBC-STORAGE-4: Default notes directory per platform.
 * The actual resolution is done in Rust; this mirrors the expected values for assertion.
 */
export const EXPECTED_DEFAULT_NOTES_DIRS: Record<'linux' | 'macos', RegExp> = {
  linux: /\.local\/share\/promptnotes\/notes\/?$/,
  macos: /Library\/Application Support\/promptnotes\/notes\/?$/,
};

export function assertDefaultNotesDirMatchesPlatform(
  actualDir: string,
  platform: 'linux' | 'macos',
): void {
  if (!EXPECTED_DEFAULT_NOTES_DIRS[platform].test(actualDir)) {
    throw new Error(
      `[STORAGE VIOLATION] デフォルト保存ディレクトリ "${actualDir}" は ` +
        `${platform} の規定パスと一致しません。RBC-STORAGE-4違反。`,
    );
  }
}
