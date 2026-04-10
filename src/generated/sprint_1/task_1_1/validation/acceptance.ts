// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd generate --sprint 1 --task 1-1

import { DEFAULT_FILTER_DAYS } from '../constants/conventions';

/**
 * Acceptance criteria identifiers.
 * Each ID maps to a specific testable criterion from docs/test/acceptance_criteria.md.
 */
export const ACCEPTANCE_CRITERIA = {
  // Editor (module:editor)
  'AC-ED-01': 'CodeMirror 6 with Markdown syntax highlighting, no rendering',
  'AC-ED-02': 'No title input field; body editor and frontmatter only',
  'AC-ED-03': 'Frontmatter with background color distinction, tags-only YAML',
  'AC-ED-04': 'Cmd+N / Ctrl+N instant new note creation with focus',
  'AC-ED-05': '1-click copy button copies body (excluding frontmatter) to clipboard',
  'AC-ED-06': 'Auto-save without explicit save action',

  // Storage (module:storage)
  'AC-ST-01': 'Filename format YYYY-MM-DDTHHMMSS.md',
  'AC-ST-02': 'YAML frontmatter (tags only) + body file structure',
  'AC-ST-03': 'Default directories: Linux ~/.local/share/promptnotes/notes/, macOS ~/Library/Application Support/promptnotes/notes/',
  'AC-ST-04': 'Configurable storage directory from settings',

  // Grid (module:grid)
  'AC-GR-01': 'Pinterest-style masonry layout with variable-height cards',
  'AC-GR-02': 'Default filter: last 7 days only',
  'AC-GR-03': 'Tag and date filtering',
  'AC-GR-04': 'Full-text search (file scan)',
  'AC-GR-05': 'Card click navigates to editor',

  // Settings
  'AC-CF-01': 'Storage directory changeable from settings',

  // Distribution
  'AC-DI-01': 'Linux: binary, Flatpak, NixOS',
  'AC-DI-02': 'macOS: binary, Homebrew Cask',

  // Development
  'AC-DV-01': 'README.md with Download, Usage, Local Development sections',
  'AC-DV-02': 'direnv + nix flake development environment',
} as const;

export type AcceptanceCriterionId = keyof typeof ACCEPTANCE_CRITERIA;

/**
 * Failure criteria identifiers — any match is a release blocker.
 */
export const FAILURE_CRITERIA = {
  // Editor
  'FC-ED-01': 'Editor uses non-CodeMirror-6 engine',
  'FC-ED-02': 'Title input or Markdown preview/rendering exists',
  'FC-ED-03': 'Cmd+N / Ctrl+N does not create note or move focus',
  'FC-ED-04': 'Copy button missing or non-functional',
  'FC-ED-05': 'Frontmatter not visually distinguished by background',

  // Storage
  'FC-ST-01': 'Filename does not follow YYYY-MM-DDTHHMMSS.md',
  'FC-ST-02': 'Auto-save non-functional',
  'FC-ST-03': 'Frontmatter auto-inserts fields other than tags',

  // Grid
  'FC-GR-01': 'Default view not filtered to last 7 days',
  'FC-GR-02': 'Tag or date filter not implemented',
  'FC-GR-03': 'Full-text search not implemented',
  'FC-GR-04': 'Card click does not navigate to editor',

  // Scope
  'FC-SC-01': 'AI invocation feature implemented',
  'FC-SC-02': 'Cloud sync feature implemented',
  'FC-SC-03': 'Mobile support included',

  // General
  'FC-GN-01': 'Application fails to launch on Linux or macOS',
  'FC-GN-02': 'README.md missing or incomplete',
} as const;

export type FailureCriterionId = keyof typeof FAILURE_CRITERIA;

/**
 * Computes the default date range for grid view (last 7 days).
 * NNC-G1 / AC-GR-02: Default filter is last 7 days.
 *
 * @param now - Current date (defaults to new Date())
 * @returns Object with date_from and date_to in YYYY-MM-DD format
 */
export function computeDefaultDateRange(now: Date = new Date()): {
  date_from: string;
  date_to: string;
} {
  const dateTo = now.toISOString().slice(0, 10);
  const from = new Date(now);
  from.setDate(from.getDate() - DEFAULT_FILTER_DAYS);
  const dateFrom = from.toISOString().slice(0, 10);
  return { date_from: dateFrom, date_to: dateTo };
}
