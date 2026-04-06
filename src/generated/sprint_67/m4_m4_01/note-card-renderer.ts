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
// Card data preparation and formatting for masonry grid items.

import type { NoteEntry } from './types';

/** Formatted card data ready for display in the masonry grid. */
export interface FormattedNoteCard {
  readonly filename: string;
  readonly preview: string;
  readonly tags: readonly string[];
  readonly createdLabel: string;
  readonly ariaLabel: string;
}

/**
 * Parse `created_at` (ISO-ish string from filename) into a
 * human-readable date-time label.
 *
 * Input format from Rust: "2026-04-04T14:30:52" or "2026-04-04T143052"
 */
export function formatCreatedAt(createdAt: string): string {
  // Normalise compact format YYYY-MM-DDTHHMMSS → YYYY-MM-DDTHH:MM:SS
  const normalised = createdAt.replace(
    /^(\d{4}-\d{2}-\d{2})T(\d{2})(\d{2})(\d{2})$/,
    '$1T$2:$3:$4',
  );
  const d = new Date(normalised);
  if (Number.isNaN(d.getTime())) {
    return createdAt; // fallback: return raw string
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Transform a raw NoteEntry into display-ready card data.
 */
export function formatNoteCard(entry: NoteEntry): FormattedNoteCard {
  const createdLabel = formatCreatedAt(entry.created_at);
  const tagsSummary = entry.tags.length > 0 ? ` — tags: ${entry.tags.join(', ')}` : '';
  return {
    filename: entry.filename,
    preview: entry.body_preview,
    tags: entry.tags,
    createdLabel,
    ariaLabel: `Note created ${createdLabel}${tagsSummary}. Click to open in editor.`,
  };
}

/**
 * Sort note entries by `created_at` descending (newest first).
 *
 * The Rust backend already returns sorted results, but this
 * utility is provided as a safety net if client needs re-sorting.
 */
export function sortEntriesDescending(entries: readonly NoteEntry[]): NoteEntry[] {
  return [...entries].sort((a, b) => {
    if (a.created_at > b.created_at) return -1;
    if (a.created_at < b.created_at) return 1;
    return 0;
  });
}
