// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 76-1
// @task-title: M4（M4-05）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

/**
 * Default constants for tag filter configuration.
 * module:grid — OQ-GRID-002
 */

import type { TagFilterConfig, TagFilterMode, MultiTagCombinator } from './types';

/** Default tag filter mode: single selection (current IPC-compatible). */
export const DEFAULT_TAG_FILTER_MODE: TagFilterMode = 'single';

/**
 * Default combinator when multi-tag mode is enabled.
 * 'OR' is the least-surprising default: show notes matching any selected tag.
 */
export const DEFAULT_MULTI_TAG_COMBINATOR: MultiTagCombinator = 'OR';

/** Default tag filter configuration. */
export const DEFAULT_TAG_FILTER_CONFIG: Readonly<TagFilterConfig> = {
  mode: DEFAULT_TAG_FILTER_MODE,
  combinator: DEFAULT_MULTI_TAG_COMBINATOR,
} as const;

/**
 * Maximum number of tags rendered in the filter UI chip list
 * before collapsing into a "+N more" indicator.
 */
export const TAG_DISPLAY_LIMIT = 30;
