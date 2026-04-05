// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_44 / task 44-1 / module:grid
// design-ref: detail:grid_search §4.3, OQ-003

import {
  MASONRY_COLUMN_MIN_WIDTH_PX,
  MASONRY_MAX_COLUMNS,
  MASONRY_COLUMN_GAP_PX,
} from './constants';

/**
 * CSS-Columns–based Masonry layout configuration.
 *
 * CSS Columns is chosen over CSS Grid `masonry` (Firefox-only experimental)
 * and over JavaScript layout libraries for these reasons
 * (detail:grid_search §4.3):
 *   1. Stable support in both WebKitGTK (Linux) and WKWebView (macOS).
 *   2. Zero-JS layout calculation → no reflow jank.
 *   3. Sufficient for Pinterest-style variable-height card arrangement.
 *
 * Card order is top→down→next-column, which is acceptable for a
 * chronologically-sorted list where the newest card appears top-left.
 */

/** Inline styles for the Masonry container element. */
export interface MasonryContainerStyle {
  readonly columnWidth: string;
  readonly columnCount: number;
  readonly columnGap: string;
}

export function getMasonryContainerStyle(): MasonryContainerStyle {
  return {
    columnWidth: `${MASONRY_COLUMN_MIN_WIDTH_PX}px`,
    columnCount: MASONRY_MAX_COLUMNS,
    columnGap: `${MASONRY_COLUMN_GAP_PX}px`,
  };
}

/**
 * Generate the CSS string for the masonry container.
 * Can be applied via Svelte `style:` directive or a class.
 */
export function getMasonryContainerCss(): string {
  return [
    `column-width: ${MASONRY_COLUMN_MIN_WIDTH_PX}px`,
    `column-count: ${MASONRY_MAX_COLUMNS}`,
    `column-gap: ${MASONRY_COLUMN_GAP_PX}px`,
  ].join('; ');
}

/**
 * CSS class string for individual card items inside the masonry container.
 * `break-inside: avoid` prevents a card from being split across columns.
 */
export function getMasonryItemCss(): string {
  return 'break-inside: avoid; margin-bottom: 16px; display: inline-block; width: 100%';
}
