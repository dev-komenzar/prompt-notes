// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 45-1
// @task-title: `module:grid`, `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:45 task:45-1 module:grid — CSS Columns masonry layout configuration
// CONV: Pinterestスタイル可変高カード必須。
// CSS Columns for cross-platform compatibility with WebKitGTK and WKWebView.

export const MASONRY_CONFIG = {
  minColumnWidth: 280,
  columnGap: 16,
  cardGap: 16,
  defaultColumns: 3,
} as const;

export function calculateColumnCount(
  containerWidth: number,
  minColumnWidth: number = MASONRY_CONFIG.minColumnWidth,
): number {
  if (containerWidth <= 0) return 1;
  return Math.max(1, Math.floor(containerWidth / minColumnWidth));
}

export function getMasonryContainerStyle(columnCount?: number): string {
  const cols = columnCount ?? MASONRY_CONFIG.defaultColumns;
  return `column-count: ${cols}; column-gap: ${MASONRY_CONFIG.columnGap}px`;
}

export function getMasonryItemStyle(): string {
  return `break-inside: avoid; margin-bottom: ${MASONRY_CONFIG.cardGap}px; display: inline-block; width: 100%`;
}
