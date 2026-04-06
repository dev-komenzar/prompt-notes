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
 * Pure functions for tag filter state management.
 * Designed to be wrapped by Svelte stores or reactive variables.
 *
 * module:grid — OQ-GRID-002: single vs multi-tag selection state.
 * No side-effects, no IPC calls, no client-side filtering.
 */

import type {
  TagFilterConfig,
  TagFilterState,
  TagFilterMode,
  MultiTagCombinator,
  TagChangeEvent,
} from './types';
import { DEFAULT_TAG_FILTER_CONFIG } from './constants';

/** Creates a fresh initial tag filter state with the given config. */
export function createTagFilterState(
  config: TagFilterConfig = DEFAULT_TAG_FILTER_CONFIG,
): TagFilterState {
  return { config, selectedTags: [] };
}

/**
 * Returns a new state with the given tag toggled.
 *
 * - In 'single' mode, selecting a tag replaces any existing selection.
 *   Re-selecting the same tag deselects it (toggle off).
 * - In 'multi' mode, the tag is added if absent or removed if present.
 */
export function toggleTag(
  state: TagFilterState,
  tag: string,
): TagFilterState {
  const normalised = tag.trim().toLowerCase();
  if (normalised === '') return state;

  if (state.config.mode === 'single') {
    const isAlreadySelected =
      state.selectedTags.length === 1 && state.selectedTags[0] === normalised;
    return {
      ...state,
      selectedTags: isAlreadySelected ? [] : [normalised],
    };
  }

  // Multi mode: toggle presence
  const idx = state.selectedTags.indexOf(normalised);
  if (idx >= 0) {
    return {
      ...state,
      selectedTags: [
        ...state.selectedTags.slice(0, idx),
        ...state.selectedTags.slice(idx + 1),
      ],
    };
  }
  return {
    ...state,
    selectedTags: [...state.selectedTags, normalised],
  };
}

/** Returns a new state with a specific set of tags selected (replaces). */
export function setSelectedTags(
  state: TagFilterState,
  tags: readonly string[],
): TagFilterState {
  const normalised = tags
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t !== '');

  if (state.config.mode === 'single') {
    return {
      ...state,
      selectedTags: normalised.length > 0 ? [normalised[0]] : [],
    };
  }

  // Multi: deduplicate while preserving order
  const unique = [...new Set(normalised)];
  return { ...state, selectedTags: unique };
}

/** Clears all selected tags, returning to unfiltered state. */
export function clearSelectedTags(state: TagFilterState): TagFilterState {
  if (state.selectedTags.length === 0) return state;
  return { ...state, selectedTags: [] };
}

/** Switches mode (single ↔ multi), resetting selection to avoid inconsistency. */
export function switchMode(
  state: TagFilterState,
  mode: TagFilterMode,
): TagFilterState {
  if (state.config.mode === mode) return state;

  const newConfig: TagFilterConfig = { ...state.config, mode };

  // When switching to single, keep at most the first selected tag.
  const newSelected =
    mode === 'single' && state.selectedTags.length > 1
      ? [state.selectedTags[0]]
      : [...state.selectedTags];

  return { config: newConfig, selectedTags: newSelected };
}

/** Updates the multi-tag combinator (AND / OR). No effect in single mode. */
export function setCombinator(
  state: TagFilterState,
  combinator: MultiTagCombinator,
): TagFilterState {
  if (state.config.combinator === combinator) return state;
  return {
    ...state,
    config: { ...state.config, combinator },
  };
}

/** Returns true when the state has at least one tag selected. */
export function hasActiveFilter(state: TagFilterState): boolean {
  return state.selectedTags.length > 0;
}

/** Builds a TagChangeEvent payload from current state (for Svelte dispatch). */
export function toTagChangeEvent(state: TagFilterState): TagChangeEvent {
  return {
    selectedTags: state.selectedTags,
    mode: state.config.mode,
    combinator: state.config.combinator,
  };
}
