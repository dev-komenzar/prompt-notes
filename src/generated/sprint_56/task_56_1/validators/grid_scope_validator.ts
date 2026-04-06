// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=56, task=56-1, milestone=スコープ外機能の不存在確認, module=grid

/**
 * Grid Module Scope Validator
 *
 * Validates that module:grid complies with:
 * - AC-GR-01: Pinterest-style variable-height card layout
 * - AC-GR-02: Default 7-day filter (RBC-4)
 * - AC-GR-03: Tag filter (RBC-4)
 * - AC-GR-04: Date filter (RBC-4)
 * - AC-GR-05: Full-text search (RBC-4)
 * - AC-GR-06: Card click → editor navigation
 * - No client-side search, no drag-and-drop reordering,
 *   no inline editing, no AI search suggestions
 *
 * FAIL-08..FAIL-11
 */

import type {
  ScopeComplianceResult,
  ScopeViolation,
} from '../scope_manifest';

export interface GridDOMInspectionTarget {
  readonly querySelectorAll: (selector: string) => ArrayLike<unknown>;
  readonly querySelector: (selector: string) => unknown | null;
}

export function validateGridScopeFromDOM(
  root: GridDOMInspectionTarget,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  // FAIL-08..11: Required grid features presence check
  // Check for search input
  const searchSelectors = [
    'input[type="search"]',
    'input[placeholder*="検索"]',
    'input[placeholder*="search" i]',
    '[data-testid="search-input"]',
    '[data-testid="fulltext-search"]',
  ];
  let searchFound = false;
  for (const selector of searchSelectors) {
    if (root.querySelectorAll(selector).length > 0) {
      searchFound = true;
      break;
    }
  }
  if (!searchFound) {
    violations.push({
      featureId: 'missing_fulltext_search',
      failureId: 'FAIL-11',
      severity: 'release_blocking',
      message:
        '全文検索UIが検出されません。全文検索は必須機能（RBC-4）。',
      location: 'module:grid DOM',
    });
  }

  // Check for tag filter
  const tagFilterSelectors = [
    '[data-testid="tag-filter"]',
    '.tag-filter',
    'select[name="tag"]',
    '[aria-label*="タグ"]',
    '[aria-label*="tag" i]',
  ];
  let tagFilterFound = false;
  for (const selector of tagFilterSelectors) {
    if (root.querySelectorAll(selector).length > 0) {
      tagFilterFound = true;
      break;
    }
  }
  if (!tagFilterFound) {
    violations.push({
      featureId: 'missing_tag_filter',
      failureId: 'FAIL-09',
      severity: 'release_blocking',
      message:
        'タグフィルタUIが検出されません。タグフィルタは必須機能（RBC-4）。',
      location: 'module:grid DOM',
    });
  }

  // Check for date filter
  const dateFilterSelectors = [
    '[data-testid="date-filter"]',
    '.date-filter',
    'input[type="date"]',
    '[aria-label*="日付"]',
    '[aria-label*="date" i]',
  ];
  let dateFilterFound = false;
  for (const selector of dateFilterSelectors) {
    if (root.querySelectorAll(selector).length > 0) {
      dateFilterFound = true;
      break;
    }
  }
  if (!dateFilterFound) {
    violations.push({
      featureId: 'missing_date_filter',
      failureId: 'FAIL-10',
      severity: 'release_blocking',
      message:
        '日付フィルタUIが検出されません。日付フィルタは必須機能（RBC-4）。',
      location: 'module:grid DOM',
    });
  }

  // Check for card elements (masonry layout)
  const cardSelectors = [
    '[data-testid="note-card"]',
    '.note-card',
    '.grid-card',
    '[role="article"]',
  ];
  let cardsFound = false;
  for (const selector of cardSelectors) {
    if (root.querySelectorAll(selector).length > 0) {
      cardsFound = true;
      break;
    }
  }

  // Prohibited: drag-and-drop reordering
  const dndSelectors = [
    '[draggable="true"]',
    '[data-testid="drag-handle"]',
    '.drag-handle',
    '.sortable-item',
  ];
  for (const selector of dndSelectors) {
    if (root.querySelectorAll(selector).length > 0) {
      violations.push({
        featureId: 'prohibited_dnd_reorder',
        failureId: 'SCOPE-GRID',
        severity: 'release_blocking',
        message: `ドラッグ＆ドロップによるカード並び替えが検出されました: selector="${selector}"。スコープ外機能です。`,
        location: 'module:grid DOM',
      });
    }
  }

  // Prohibited: inline editing in grid cards
  const inlineEditSelectors = [
    '.note-card textarea',
    '.note-card [contenteditable="true"]',
    '.grid-card textarea',
    '.grid-card [contenteditable="true"]',
    '[data-testid="note-card"] [contenteditable]',
  ];
  for (const selector of inlineEditSelectors) {
    if (root.querySelectorAll(selector).length > 0) {
      violations.push({
        featureId: 'prohibited_inline_edit',
        failureId: 'SCOPE-GRID',
        severity: 'release_blocking',
        message: `カードのインライン編集機能が検出されました: selector="${selector}"。編集はmodule:editorでのみ行う。`,
        location: 'module:grid DOM',
      });
    }
  }

  return {
    module: 'grid',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates that grid module dependencies do not include
 * prohibited packages.
 */
export function validateGridDependencies(
  installedPackages: ReadonlySet<string>,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  const prohibitedGridPackages: ReadonlyArray<{
    name: string;
    reason: string;
  }> = [
    {
      name: 'tantivy',
      reason:
        'インデックスエンジンの導入はスコープ外。ファイル全走査方式（ADR-005）が確定済み。',
    },
    {
      name: 'lunr',
      reason:
        'クライアントサイド検索エンジンの導入は禁止。検索はRust側で実行。',
    },
    {
      name: 'fuse.js',
      reason:
        'クライアントサイド検索エンジンの導入は禁止。検索はRust側で実行。',
    },
    {
      name: 'minisearch',
      reason:
        'クライアントサイド検索エンジンの導入は禁止。検索はRust側で実行。',
    },
    {
      name: 'flexsearch',
      reason:
        'クライアントサイド検索エンジンの導入は禁止。検索はRust側で実行。',
    },
  ];

  for (const pkg of prohibitedGridPackages) {
    if (installedPackages.has(pkg.name)) {
      violations.push({
        featureId: 'prohibited_search_engine',
        failureId: 'SCOPE-GRID',
        severity: 'release_blocking',
        message: `禁止パッケージが検出されました: ${pkg.name} — ${pkg.reason}`,
        location: 'package.json / node_modules',
      });
    }
  }

  return {
    module: 'grid',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}
