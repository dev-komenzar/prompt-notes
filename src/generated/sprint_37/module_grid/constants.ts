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

// sprint:37 task:37-1 module:grid — Configuration constants

import type { MasonryConfig } from './types';

/** Default number of days for the initial grid filter (CONV-GRID-1). */
export const DEFAULT_FILTER_DAYS = 7;

/** Debounce interval for search input in milliseconds (OQ-GRID-001 baseline). */
export const SEARCH_DEBOUNCE_MS = 300;

/** Maximum characters for body preview. Matches module:storage Rust side. */
export const BODY_PREVIEW_MAX_LENGTH = 200;

/**
 * Default masonry layout configuration.
 *
 * OQ-003 resolved: CSS Columns strategy selected for Masonry layout.
 * See masonry.ts for full rationale.
 */
export const DEFAULT_MASONRY_CONFIG: MasonryConfig = {
  columnMinWidth: 280,
  gap: 16,
  minColumns: 1,
  maxColumns: 5,
} as const;

/** CSS custom property names used by the masonry layout. */
export const CSS_VARS = {
  masonryColumns: '--masonry-columns',
  masonryGap: '--masonry-gap',
  cardBorderRadius: '--card-border-radius',
  cardPadding: '--card-padding',
  cardBg: '--card-bg',
  cardBgHover: '--card-bg-hover',
  tagBg: '--tag-badge-bg',
  tagColor: '--tag-badge-color',
} as const;

/** Filename timestamp pattern for validation (matches module:storage regex). */
export const FILENAME_TIMESTAMP_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(?:_\d+)?\.md$/;
