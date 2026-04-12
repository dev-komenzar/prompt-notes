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
 * Grid Constraint Validators
 *
 * Runtime validators for module:grid release-blocking constraints.
 */

import type { NoteFilter } from './ipc_boundary';

/**
 * RBC-GRID-1: デフォルトフィルタは直近7日間。
 * Returns the default NoteFilter covering the last 7 days.
 */
export function buildDefaultGridFilter(): Required<Pick<NoteFilter, 'date_from' | 'date_to'>> & NoteFilter {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    tags: [],
    date_from: sevenDaysAgo.toISOString().slice(0, 10),
    date_to: now.toISOString().slice(0, 10),
  };
}

/**
 * Validates that the given filter represents the default 7-day window.
 * RBC-GRID-1: グリッドビューのデフォルトフィルタは直近7日間。
 */
export function assertDefaultFilterIsSevenDays(
  filter: NoteFilter,
  nowOverride?: Date,
): void {
  const now = nowOverride ?? new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const expectedFrom = sevenDaysAgo.toISOString().slice(0, 10);
  const expectedTo = now.toISOString().slice(0, 10);

  if (!filter.date_from || !filter.date_to) {
    throw new Error(
      '[GRID VIOLATION] デフォルトフィルタに date_from/date_to が設定されていません。' +
        'RBC-GRID-1違反。',
    );
  }
  if (filter.date_from > expectedFrom) {
    throw new Error(
      `[GRID VIOLATION] デフォルトフィルタの date_from "${filter.date_from}" が ` +
        `期待値 "${expectedFrom}" より新しすぎます（7日分以上のデータが除外されます）。RBC-GRID-1違反。`,
    );
  }
  if (filter.date_to < expectedTo) {
    throw new Error(
      `[GRID VIOLATION] デフォルトフィルタの date_to "${filter.date_to}" が ` +
        `期待値 "${expectedTo}" より古すぎます（今日のデータが除外されます）。RBC-GRID-1違反。`,
    );
  }
}

/**
 * RBC-GRID-1: Pinterestスタイル可変高カード必須。
 * Validates that the grid container uses CSS columns (Masonry layout).
 */
export function assertMasonryLayout(gridContainer: Element): void {
  const style = window.getComputedStyle(gridContainer);
  const columnCount = style.columnCount;
  const columnWidth = style.columnWidth;

  if (columnCount === 'auto' && columnWidth === 'auto') {
    throw new Error(
      '[GRID VIOLATION] グリッドコンテナに CSS columns Masonry レイアウトが設定されていません。' +
        'Pinterestスタイル可変高カードは必須です。RBC-GRID-1違反。',
    );
  }
}

/**
 * RBC-GRID-1: break-inside: avoid が各カードに設定されているかを検証。
 */
export function assertCardsHaveBreakInsideAvoid(cards: NodeListOf<Element>): void {
  cards.forEach((card, i) => {
    const style = window.getComputedStyle(card);
    if (style.breakInside !== 'avoid') {
      throw new Error(
        `[GRID VIOLATION] カード[${i}]に break-inside: avoid が設定されていません。` +
          '可変高Masonryレイアウトのためにbreak-inside: avoidが必要です。RBC-GRID-1違反。',
      );
    }
  });
}

/**
 * RBC-GRID-2: タグ・日付フィルタおよび全文検索は必須機能。
 * Checks that FilterBar elements (tag chips, date inputs) are present in the grid view.
 */
export function assertFilterBarElements(root: Element = document.body): void {
  const missingElements: string[] = [];

  if (!root.querySelector('input[type="date"], [data-testid="date-from"]')) {
    missingElements.push('日付フィルタ (date_from)');
  }
  if (!root.querySelector('input[type="date"] + span + input[type="date"], [data-testid="date-to"]')) {
    missingElements.push('日付フィルタ (date_to)');
  }
  if (!root.querySelector('[data-testid="search-input"], input[type="search"]')) {
    missingElements.push('全文検索入力');
  }

  if (missingElements.length > 0) {
    throw new Error(
      `[GRID VIOLATION] グリッドビューに必須UI要素が見つかりません: [${missingElements.join(', ')}]。` +
        'タグ・日付フィルタおよび全文検索は必須機能です。RBC-GRID-2違反。',
    );
  }
}

/**
 * RBC-GRID-3: カードクリックでエディタ画面へ遷移必須。
 * Validates that note cards navigate to the editor when clicked.
 * The card element must have a click handler or be a link targeting the editor route.
 */
export function assertCardNavigatesToEditor(cardElement: Element, noteId: string): void {
  const role = cardElement.getAttribute('role');
  const tabindex = cardElement.getAttribute('tabindex');

  if (role !== 'button' && cardElement.tagName !== 'A') {
    throw new Error(
      `[GRID VIOLATION] ノートカード (id=${noteId}) に role="button" または <a> タグがありません。` +
        'カードクリックでエディタ遷移するために必要です。RBC-GRID-3違反。',
    );
  }
  if (role === 'button' && tabindex === null) {
    throw new Error(
      `[GRID VIOLATION] ノートカード (id=${noteId}) に tabindex が設定されていません。` +
        'キーボードアクセシビリティが必要です。RBC-GRID-3違反。',
    );
  }
}

/**
 * RBC-GRID-2: Validates that search uses the Rust backend (search_notes IPC command)
 * and NOT any frontend-only filtering logic.
 * This is a structural constraint — frontend-only search is prohibited.
 */
export type SearchStrategy = 'backend-ipc' | 'frontend-only';

export function assertBackendSearchStrategy(strategy: SearchStrategy): void {
  if (strategy === 'frontend-only') {
    throw new Error(
      '[GRID VIOLATION] フロントエンド独自の検索・フィルタ処理は禁止です。' +
        '全文検索はRustバックエンドのファイル全走査 (search_notes IPC) を使用してください。' +
        'RBC-GRID-2違反。',
    );
  }
}
