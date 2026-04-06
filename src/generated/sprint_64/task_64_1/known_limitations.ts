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
// Dependency: detail:storage_fileformat (§4.3), detail:grid_search (§4.7)

import type { KnownLimitation } from './types';

export const KNOWN_LIMITATIONS: readonly KnownLimitation[] = [
  {
    id: 'LIM-001',
    description:
      'Full-text search uses file full-scan (str::contains) without an index engine. Response time may degrade with very large note collections.',
    threshold: '5,000 notes',
    mitigation:
      'Monitor response time at scale. Tantivy (Rust full-text search engine) introduction planned when threshold is exceeded.',
  },
  {
    id: 'LIM-002',
    description:
      'Filename collision within the same second is resolved by appending _1, _2 suffixes rather than using millisecond precision.',
    threshold: 'Multiple notes created within the same second',
    mitigation:
      'Suffix-based collision avoidance. Evaluate millisecond-precision timestamps (YYYY-MM-DDTHHMMSS.SSS.md) based on user feedback.',
  },
  {
    id: 'LIM-003',
    description:
      'Changing the notes directory does not migrate existing notes. Users must manually move files to the new directory.',
    threshold: 'Any directory change',
    mitigation:
      'Document manual migration steps. Evaluate migration assistance feature based on user feedback.',
  },
  {
    id: 'LIM-004',
    description:
      'Tag filter supports single tag selection only. AND/OR multi-tag filtering requires IPC interface changes.',
    threshold: 'Users needing multi-tag intersection queries',
    mitigation:
      'Evaluate multi-tag support based on user feedback. Requires list_notes IPC parameter expansion.',
  },
  {
    id: 'LIM-005',
    description:
      'No pagination or infinite scroll for grid view. All matching notes are loaded at once.',
    threshold: '5,000+ notes in filtered result set',
    mitigation:
      'Re-evaluate when note counts exceed threshold. Consider virtual scrolling or pagination.',
  },
  {
    id: 'LIM-006',
    description:
      'Windows platform is not supported in this release. Only Linux and macOS are targeted.',
    threshold: 'N/A',
    mitigation:
      'Windows support planned for a future release. Tauri supports Windows builds natively.',
  },
  {
    id: 'LIM-007',
    description:
      'Frontmatter parse errors are silently recovered as tags: []. No user notification is displayed.',
    threshold: 'Malformed YAML in frontmatter',
    mitigation:
      'Evaluate toast notification for parse errors based on UX prototype testing.',
  },
  {
    id: 'LIM-008',
    description:
      'Auto-save debounce interval is fixed at 500ms. No user-configurable option is provided.',
    threshold: 'N/A',
    mitigation:
      'Debounce interval may be adjusted based on prototype user testing results.',
  },
] as const;
