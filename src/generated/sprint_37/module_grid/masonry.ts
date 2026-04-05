// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:37 task:37-1 module:grid — Masonry Layout Engine (CSS Columns)
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │ OQ-003 RESOLUTION: CSS Columns selected for Masonry layout.       │
// │                                                                     │
// │ Decision Rationale:                                                 │
// │ • CSS Grid `grid-template-rows: masonry` is experimental and NOT    │
// │   supported in WebKitGTK (Linux) or WKWebView (macOS) — the two    │
// │   target WebView engines for Tauri on supported platforms.          │
// │ • CSS Columns (`column-count` / `column-width`) has stable,         │
// │   production-ready support across both WebKitGTK and WKWebView.     │
// │ • JavaScript layout libraries (svelte-masonry, etc.) add DOM        │
// │   manipulation overhead and layout-shift risk that CSS Columns      │
// │   avoids entirely.                                                  │
// │                                                                     │
// │ Trade-off:                                                          │
// │ CSS Columns flow items top→bottom→next-column rather than           │
// │ left→right→next-row. For a date-descending note grid this means    │
// │ the newest note is top-left and fills downward. This ordering is    │
// │ acceptable for visual scanning of recent prompts.                   │
// │                                                                     │
// │ Rejected:                                                           │
// │ • CSS Grid Masonry — no target-platform support                     │
// │ • JS libraries — unnecessary complexity for this use case           │
// └─────────────────────────────────────────────────────────────────────┘

import type { MasonryConfig, MasonryLayout } from './types';
import { DEFAULT_MASONRY_CONFIG } from './constants';

/** The resolved masonry strategy identifier. */
export const MASONRY_STRATEGY = 'css-columns' as const;

/**
 * Calculates the optimal column count for a given container width.
 *
 * @param containerWidth - Available width in pixels
 * @param config - Masonry configuration (column width, gap, min/max columns)
 * @returns Clamped column count within [minColumns, maxColumns]
 */
export function calculateColumnCount(
  containerWidth: number,
  config: MasonryConfig = DEFAULT_MASONRY_CONFIG,
): number {
  if (containerWidth <= 0) return config.minColumns;

  const effectiveWidth = containerWidth + config.gap;
  const rawCount = Math.floor(effectiveWidth / (config.columnMinWidth + config.gap));
  return Math.max(config.minColumns, Math.min(rawCount, config.maxColumns));
}

/**
 * Generates inline CSS properties for the masonry container element.
 * These properties drive the CSS Columns layout.
 *
 * Usage in Svelte:
 *   <div style={styleMapToString(layout.containerStyle)}>
 */
export function createContainerStyles(
  columnCount: number,
  config: MasonryConfig = DEFAULT_MASONRY_CONFIG,
): Record<string, string> {
  return {
    'column-count': String(columnCount),
    'column-gap': `${config.gap}px`,
    'column-fill': 'balance',
  };
}

/**
 * Generates inline CSS properties for each masonry item (card).
 * `break-inside: avoid` prevents cards from splitting across columns.
 */
export function createItemStyles(
  config: MasonryConfig = DEFAULT_MASONRY_CONFIG,
): Record<string, string> {
  return {
    'break-inside': 'avoid',
    'margin-bottom': `${config.gap}px`,
  };
}

/**
 * Computes the full masonry layout descriptor from container width.
 * This is the primary entry point for layout calculation.
 *
 * @param containerWidth - Container width in pixels
 * @param config - Optional masonry configuration override
 */
export function computeMasonryLayout(
  containerWidth: number,
  config: MasonryConfig = DEFAULT_MASONRY_CONFIG,
): MasonryLayout {
  const columnCount = calculateColumnCount(containerWidth, config);
  return {
    columnCount,
    containerStyle: createContainerStyles(columnCount, config),
    itemStyle: createItemStyles(config),
  };
}

/**
 * Converts a style record to an inline style string for DOM binding.
 *
 * @param styles - CSS property-value pairs
 * @returns Semicolon-delimited inline style string
 */
export function styleMapToString(styles: Readonly<Record<string, string>>): string {
  return Object.entries(styles)
    .map(([prop, val]) => `${prop}: ${val}`)
    .join('; ');
}

/**
 * Static CSS rules for the masonry grid.
 * Embed in a Svelte <style> block or inject via a <style> element.
 *
 * CSS custom properties allow theming without modifying core layout.
 */
export const MASONRY_CSS = `
.masonry-grid {
  column-gap: var(--masonry-gap, 16px);
  column-fill: balance;
  width: 100%;
}

.masonry-card {
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  margin-bottom: var(--masonry-gap, 16px);
  display: inline-block;
  width: 100%;
  border-radius: var(--card-border-radius, 8px);
  background: var(--card-bg, #ffffff);
  padding: var(--card-padding, 16px);
  cursor: pointer;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.masonry-card:hover {
  background: var(--card-bg-hover, #f8f9fa);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.masonry-card:focus-visible {
  outline: 2px solid var(--focus-ring-color, #3b82f6);
  outline-offset: 2px;
}

.masonry-card__preview {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-secondary, #4b5563);
  word-break: break-word;
  white-space: pre-wrap;
}

.masonry-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.masonry-card__tag {
  display: inline-block;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 9999px;
  background: var(--tag-badge-bg, #e5e7eb);
  color: var(--tag-badge-color, #374151);
}

.masonry-card__tag--active {
  background: var(--tag-badge-active-bg, #3b82f6);
  color: var(--tag-badge-active-color, #ffffff);
}

.masonry-card__date {
  font-size: 0.75rem;
  color: var(--text-tertiary, #9ca3af);
  margin-top: 8px;
}
`.trim();

/**
 * CSS rules for the grid toolbar (filter bar, search box).
 */
export const TOOLBAR_CSS = `
.grid-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  margin-bottom: 8px;
}

.grid-toolbar__search {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  font-size: 0.9rem;
  background: var(--input-bg, #ffffff);
  color: var(--text-primary, #111827);
}

.grid-toolbar__search:focus {
  outline: none;
  border-color: var(--focus-ring-color, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.grid-empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--text-tertiary, #9ca3af);
  font-size: 1rem;
}
`.trim();
