// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 47-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:47 task:47-1 module:grid
// Masonry layout utilities using CSS Columns (primary approach per design).
// CSS Grid masonry (grid-template-rows: masonry) is experimental and not
// reliably supported in WebKitGTK / WKWebView as of 2026-04 (OQ-003).

import { MASONRY_COLUMN_MIN_WIDTH_PX, MASONRY_GAP_PX } from './constants';

/**
 * CSS custom properties for the masonry container.
 *
 * Apply these as inline style on the grid container element.
 * The companion CSS class `.pn-masonry` (below) consumes them.
 *
 * ```svelte
 * <div class="pn-masonry" style={masonryContainerStyle()}>
 *   {#each notes as note}
 *     <NoteCard {note} />
 *   {/each}
 * </div>
 * ```
 */
export function masonryContainerStyle(
  columnMinWidth: number = MASONRY_COLUMN_MIN_WIDTH_PX,
  gap: number = MASONRY_GAP_PX,
): string {
  return `--pn-masonry-col-width:${columnMinWidth}px;--pn-masonry-gap:${gap}px`;
}

/**
 * Static CSS rules for the masonry container and cards.
 *
 * Intended to be injected via `<style>` or a shared stylesheet.
 * Uses CSS Columns for Pinterest-style variable-height card layout
 * with stable support in WebKitGTK (Linux) and WKWebView (macOS).
 */
export const MASONRY_CSS = `
.pn-masonry {
  column-width: var(--pn-masonry-col-width, ${MASONRY_COLUMN_MIN_WIDTH_PX}px);
  column-gap: var(--pn-masonry-gap, ${MASONRY_GAP_PX}px);
  column-fill: balance;
}

.pn-masonry-card {
  break-inside: avoid;
  margin-bottom: var(--pn-masonry-gap, ${MASONRY_GAP_PX}px);
  display: inline-block;
  width: 100%;
  cursor: pointer;
}
` as const;
