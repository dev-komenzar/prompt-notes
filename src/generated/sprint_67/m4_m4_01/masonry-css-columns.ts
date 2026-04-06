// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 67-1
// @task-title: M4（M4-01）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=67, task=67-1, module=grid, oq=OQ-003
// CSS Columns masonry — style generation.
// Selected over CSS Grid masonry (Firefox-only) and JS libraries.
// Stable in WebKitGTK (Linux) and WKWebView (macOS).

import type { ResolvedMasonryLayout, NoteCardStyleTokens } from './types';
import { CSS_CLASS_PREFIX } from './masonry-config';

/**
 * Generate inline style string for the masonry container element.
 *
 * Uses CSS `column-count` and `column-gap` — the core of the
 * CSS Columns masonry approach chosen in OQ-003.
 */
export function containerStyle(layout: ResolvedMasonryLayout): string {
  return [
    `column-count: ${layout.columns}`,
    `column-gap: ${layout.columnGap}px`,
    'column-fill: balance',
  ].join('; ');
}

/**
 * Generate inline style string for a single masonry item (card wrapper).
 *
 * `break-inside: avoid` prevents a card from being split across columns.
 * `margin-bottom` provides the vertical gap between cards within a column.
 */
export function itemStyle(rowGap: number): string {
  return [
    'break-inside: avoid',
    '-webkit-column-break-inside: avoid',
    `margin-bottom: ${rowGap}px`,
    'display: inline-block',
    'width: 100%',
  ].join('; ');
}

/**
 * Build a complete CSS stylesheet string for the masonry grid system.
 *
 * This can be injected once via a `<style>` tag. Responsive behaviour
 * is driven by JavaScript (ResizeObserver) updating `column-count`
 * on the container rather than media queries — because the relevant
 * dimension is the container width inside the Tauri WebView, not
 * the viewport.
 */
export function buildMasonryStylesheet(
  cardTokens: NoteCardStyleTokens,
): string {
  const p = CSS_CLASS_PREFIX;
  return `
.${p}-container {
  column-fill: balance;
  width: 100%;
  box-sizing: border-box;
}

.${p}-item {
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
}

.${p}-card {
  border-radius: ${cardTokens.borderRadius};
  padding: ${cardTokens.padding};
  background-color: ${cardTokens.backgroundColor};
  cursor: pointer;
  transition: background-color 0.15s ease;
  box-sizing: border-box;
}

.${p}-card:hover {
  background-color: ${cardTokens.hoverBackgroundColor};
}

.${p}-card:focus-visible {
  outline: 2px solid var(--focus-ring, #4c8bf5);
  outline-offset: 2px;
}

.${p}-card-preview {
  font-size: ${cardTokens.previewFontSize};
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-primary, #2e3440);
}

.${p}-card-meta {
  margin-top: 8px;
  font-size: ${cardTokens.metaFontSize};
  color: var(--text-secondary, #6b7280);
}

.${p}-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.${p}-tag-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: ${cardTokens.metaFontSize};
  background-color: ${cardTokens.tagBadgeBg};
  color: ${cardTokens.tagBadgeColor};
  white-space: nowrap;
}
`.trim();
}

/**
 * Apply resolved layout to a container element by setting
 * `column-count` and `column-gap` directly.
 *
 * This is the runtime update path invoked from the ResizeObserver callback.
 */
export function applyLayoutToContainer(
  container: HTMLElement,
  layout: ResolvedMasonryLayout,
): void {
  container.style.columnCount = String(layout.columns);
  container.style.columnGap = `${layout.columnGap}px`;
}
