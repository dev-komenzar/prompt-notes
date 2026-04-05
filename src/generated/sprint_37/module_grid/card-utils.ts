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

// sprint:37 task:37-1 module:grid — Card display utilities

import type { NoteEntry, TagBadge } from './types';
import { BODY_PREVIEW_MAX_LENGTH } from './constants';
import { formatDisplayDate, formatRelativeTime } from './date-utils';

/**
 * Truncates body preview text to the specified maximum length.
 * Respects word boundaries when possible.
 */
export function truncatePreview(text: string, maxLength: number = BODY_PREVIEW_MAX_LENGTH): string {
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '…';
  }
  return truncated + '…';
}

/**
 * Formats the card timestamp for display.
 * Uses relative time for recent notes, absolute time for older ones.
 */
export function formatCardTimestamp(createdAt: string): string {
  return formatRelativeTime(createdAt);
}

/**
 * Formats the card timestamp as an absolute date string for tooltip/title.
 */
export function formatCardTimestampFull(createdAt: string): string {
  return formatDisplayDate(createdAt);
}

/**
 * Builds tag badge data for a note card.
 * @param tags - Tags from the NoteEntry
 * @param activeTag - Currently selected filter tag (if any)
 */
export function buildTagBadges(tags: readonly string[], activeTag?: string): TagBadge[] {
  return tags.map((label) => ({
    label,
    isActive: label === activeTag,
  }));
}

/**
 * Determines if a card has content worth displaying.
 * Empty notes (only frontmatter, no body) may need distinct styling.
 */
export function hasVisibleContent(note: NoteEntry): boolean {
  return note.body_preview.trim().length > 0;
}

/**
 * Computes a stable key for Svelte {#each} blocks.
 * Uses filename as the unique identifier (filename is immutable per CONV-FILENAME).
 */
export function cardKey(note: NoteEntry): string {
  return note.filename;
}
