// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @generated-by: codd implement --sprint 13

import { vi } from 'vitest';

export const VALID_NOTE_ID = '2026-04-11T143052';
export const VALID_FILENAME = `${VALID_NOTE_ID}.md`;

export const mockNoteMetadata = {
  id: VALID_NOTE_ID,
  tags: ['rust', 'tauri'],
  created_at: '2026-04-11T14:30:52',
  preview: 'This is a sample prompt note for testing purposes.',
};

export const mockNote = {
  id: VALID_NOTE_ID,
  frontmatter: { tags: ['rust', 'tauri'] },
  body: 'This is a sample prompt note for testing purposes.',
  created_at: '2026-04-11T14:30:52',
};

export const mockAppConfig = {
  notes_dir: '/home/user/.local/share/promptnotes/notes',
};

export const mockNoteFilter = {
  tags: ['rust'],
  date_from: '2026-04-04',
  date_to: '2026-04-11',
};

export function setupInvokeMock() {
  const mockInvoke = vi.fn();
  vi.mock('@tauri-apps/api/core', () => ({ invoke: mockInvoke }));
  return mockInvoke;
}
