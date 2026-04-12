// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: 累計期間
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 63 @task: 63-1

/**
 * 累計期間ユーティリティ
 * グリッドビューのデフォルト直近7日間フィルタおよび日付範囲フィルタに使用する。
 */

export interface DateRange {
  date_from: string; // ISO 8601 date: "YYYY-MM-DD"
  date_to: string;   // ISO 8601 date: "YYYY-MM-DD"
}

/**
 * ISO 8601 date string ("YYYY-MM-DD") を返す。
 */
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * 直近 N 日間の DateRange を返す（today を含む）。
 * グリッドビューのデフォルトフィルタ（直近7日間）に使用する。
 */
export function lastNDays(n: number): DateRange {
  const now = new Date();
  const from = new Date(now.getTime() - (n - 1) * 24 * 60 * 60 * 1000);
  return {
    date_from: toISODate(from),
    date_to: toISODate(now),
  };
}

/**
 * デフォルトフィルタ: 直近7日間。
 * filtersStore の初期値生成に使用する。
 */
export function defaultGridDateRange(): DateRange {
  return lastNDays(7);
}

/**
 * ノートID（"YYYY-MM-DDTHHMMSS"）が DateRange 内に含まれるか判定する。
 * Rust バックエンドが存在しない環境でのローカル検証用。
 */
export function isNoteIdInRange(noteId: string, range: DateRange): boolean {
  const dateStr = noteId.slice(0, 10); // "YYYY-MM-DD"
  return dateStr >= range.date_from && dateStr <= range.date_to;
}

/**
 * 2つの DateRange が重複するか判定する。
 */
export function dateRangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.date_from <= b.date_to && a.date_to >= b.date_from;
}

/**
 * ノートIDからISO 8601形式の作成日時文字列を生成する。
 * "2026-04-11T143052" → "2026-04-11T14:30:52"
 */
export function noteIdToCreatedAt(noteId: string): string {
  const match = noteId.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid note ID format: ${noteId}`);
  }
  const [, date, hh, mm, ss] = match;
  return `${date}T${hh}:${mm}:${ss}`;
}

/**
 * DateRange が有効か（date_from <= date_to）を検証する。
 */
export function isValidDateRange(range: DateRange): boolean {
  return range.date_from <= range.date_to;
}

/**
 * 日付文字列を人間が読みやすい形式に整形する。
 * "2026-04-11" → "2026/04/11"
 */
export function formatDateDisplay(isoDate: string): string {
  return isoDate.replace(/-/g, "/");
}
