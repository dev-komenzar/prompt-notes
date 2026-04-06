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
 * Validation utilities for tag filter inputs.
 *
 * module:grid — OQ-GRID-002
 *
 * Validates user-supplied tag strings and filter state
 * before dispatching to IPC or updating state.
 */

import type { TagFilterState, TagFilterConfig, TagFilterMode, MultiTagCombinator } from './types';

/** Maximum length for a single tag string. */
const MAX_TAG_LENGTH = 100;

/** Pattern for allowed tag characters: alphanumeric, hyphen, underscore, CJK. */
const TAG_PATTERN = /^[\p{L}\p{N}\-_]+$/u;

/**
 * Normalises and validates a single tag string.
 * Returns the normalised tag or null if invalid.
 */
export function validateTag(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === '') return null;
  if (trimmed.length > MAX_TAG_LENGTH) return null;
  if (!TAG_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/**
 * Validates an array of tag strings, returning only valid ones.
 * Preserves order, deduplicates.
 */
export function validateTags(rawTags: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of rawTags) {
    const tag = validateTag(raw);
    if (tag !== null && !seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
    }
  }
  return result;
}

/** Type guard for TagFilterMode. */
export function isValidMode(value: unknown): value is TagFilterMode {
  return value === 'single' || value === 'multi';
}

/** Type guard for MultiTagCombinator. */
export function isValidCombinator(value: unknown): value is MultiTagCombinator {
  return value === 'AND' || value === 'OR';
}

/** Validates a TagFilterConfig object. */
export function isValidConfig(config: unknown): config is TagFilterConfig {
  if (config === null || typeof config !== 'object') return false;
  const c = config as Record<string, unknown>;
  return isValidMode(c.mode) && isValidCombinator(c.combinator);
}

/**
 * Validates that a TagFilterState is internally consistent.
 * - In single mode, selectedTags must have 0 or 1 entries.
 * - All selected tags must pass tag validation.
 */
export function isValidState(state: TagFilterState): boolean {
  if (!isValidConfig(state.config)) return false;

  if (
    state.config.mode === 'single' &&
    state.selectedTags.length > 1
  ) {
    return false;
  }

  for (const tag of state.selectedTags) {
    if (validateTag(tag) === null) return false;
  }

  return true;
}
