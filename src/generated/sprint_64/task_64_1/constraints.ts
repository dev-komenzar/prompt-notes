// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 64-1
// @task-title: —
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=64, task=64-1, module=release_notes
// Dependency: test:acceptance_criteria (§3)

import type { ReleaseBlockingConstraint, ScopeExclusion } from './types';

export const RELEASE_BLOCKING_CONSTRAINTS: readonly ReleaseBlockingConstraint[] = [
  {
    id: 'RBC-1',
    targets: ['module:editor'],
    description:
      'Cmd+N / Ctrl+N instant new note creation and 1-click copy button are core UX. Unimplemented means release blocked.',
    failureIds: ['FAIL-01', 'FAIL-02'],
  },
  {
    id: 'RBC-2',
    targets: ['module:editor'],
    description:
      'CodeMirror 6 required. Title input field prohibited. Markdown preview (rendering) prohibited. Violation means release blocked.',
    failureIds: ['FAIL-03', 'FAIL-04', 'FAIL-05'],
  },
  {
    id: 'RBC-3',
    targets: ['module:storage'],
    description:
      'Filename rule YYYY-MM-DDTHHMMSS.md and auto-save are finalized. Violation means release blocked.',
    failureIds: ['FAIL-06', 'FAIL-07'],
  },
  {
    id: 'RBC-4',
    targets: ['module:grid'],
    description:
      'Default 7-day filter, tag/date filter, and full-text search are mandatory. Unimplemented means release blocked.',
    failureIds: ['FAIL-08', 'FAIL-09', 'FAIL-10', 'FAIL-11'],
  },
] as const;

export const SCOPE_EXCLUSIONS: readonly ScopeExclusion[] = [
  {
    item: 'AI invocation (LLM API calls, chat UI, prompt submission)',
    reason: 'Explicitly out of scope. Related to CONV-3.',
  },
  {
    item: 'Cloud sync (remote server data transmission/synchronization)',
    reason: 'CONV-3 violation. Local-only storage is mandatory.',
  },
  {
    item: 'Database usage (SQLite, IndexedDB, PostgreSQL, etc.)',
    reason: 'CONV-3 violation. Data stored as local .md files only.',
  },
  {
    item: 'Title input field',
    reason: 'RBC-2 violation. Body-only editor screen.',
  },
  {
    item: 'Markdown preview (HTML rendering)',
    reason: 'RBC-2 violation. Plain-text syntax highlighting only.',
  },
  {
    item: 'Mobile support (iOS / Android)',
    reason: 'Out of scope.',
  },
  {
    item: 'Windows build and distribution',
    reason: 'Future target. Currently out of scope.',
  },
] as const;

export const FAILURE_CRITERIA = {
  releaseBlocking: [
    { id: 'FAIL-01', description: 'Cmd+N (macOS) or Ctrl+N (Linux) does not instantly create a new note', module: 'editor' },
    { id: 'FAIL-02', description: '1-click copy button missing or does not copy full body text to clipboard', module: 'editor' },
    { id: 'FAIL-03', description: 'Editor engine is not CodeMirror 6', module: 'editor' },
    { id: 'FAIL-04', description: 'Title input field exists on editor screen', module: 'editor' },
    { id: 'FAIL-05', description: 'Markdown preview (rendering) feature is implemented', module: 'editor' },
    { id: 'FAIL-06', description: 'Filename does not conform to YYYY-MM-DDTHHMMSS.md format', module: 'storage' },
    { id: 'FAIL-07', description: 'Auto-save not functional; edits not persisted without manual save', module: 'storage' },
    { id: 'FAIL-08', description: 'Grid view default display not filtered to last 7 days', module: 'grid' },
    { id: 'FAIL-09', description: 'Tag filtering not available', module: 'grid' },
    { id: 'FAIL-10', description: 'Date filtering not available', module: 'grid' },
    { id: 'FAIL-11', description: 'Full-text search not available', module: 'grid' },
  ],
  functional: [
    { id: 'FAIL-20', description: 'Markdown syntax highlighting not applied', module: 'editor' },
    { id: 'FAIL-21', description: 'Frontmatter region not visually distinguished by background color', module: 'editor' },
    { id: 'FAIL-22', description: 'Card click does not navigate to editor screen', module: 'grid' },
    { id: 'FAIL-23', description: 'Cannot change save directory from settings', module: 'settings' },
    { id: 'FAIL-24', description: 'Linux default save path is not ~/.local/share/promptnotes/notes/', module: 'storage' },
    { id: 'FAIL-25', description: 'macOS default save path is not ~/Library/Application Support/promptnotes/notes/', module: 'storage' },
    { id: 'FAIL-26', description: 'Saved .md files cannot be opened in Obsidian or VSCode', module: 'storage' },
  ],
  scopeViolation: [
    { id: 'FAIL-30', description: 'AI invocation feature (LLM API calls) included', module: 'shell' },
    { id: 'FAIL-31', description: 'Cloud sync feature included', module: 'shell' },
    { id: 'FAIL-32', description: 'Mobile build or dedicated UI included', module: 'shell' },
  ],
  platformRequirement: [
    { id: 'FAIL-40', description: 'Application does not launch or function correctly on Linux', module: 'shell' },
    { id: 'FAIL-41', description: 'Application does not launch or function correctly on macOS', module: 'shell' },
    { id: 'FAIL-42', description: 'Application not built on Tauri framework', module: 'shell' },
  ],
} as const;
