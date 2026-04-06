// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan > detail:storage_fileformat — CONV-FILENAME, CONV-AUTOSAVE

import type { SmokeCheckResult } from './smoke-types';
import { runCheck, assert, assertDefined, assertMatches } from './check-helpers';
import { createNote, saveNote, readNote, deleteNote, listNotes } from '../ipc-client';
import { FILENAME_PATTERN } from '../types';
import { getDefaultDateRange } from '../date-utils';
import { FRONTMATTER_TEMPLATE } from '../frontmatter';

/**
 * Smoke checks for module:storage.
 * Verifies CRUD operations work end-to-end through Tauri IPC.
 * All file operations are delegated to Rust — frontend never touches the filesystem.
 *
 * Release-blocking checks:
 *   - RBC-3 / AC-ST-01: Filename must be YYYY-MM-DDTHHMMSS.md
 *   - RBC-3 / AC-ED-06: Auto-save path (save_note) must work
 */
export async function runStorageChecks(): Promise<SmokeCheckResult[]> {
  const results: SmokeCheckResult[] = [];
  let testFilename: string | null = null;

  // ST-01: create_note returns valid filename (RBC-3 / FAIL-06)
  results.push(
    await runCheck(
      'ST-01',
      'storage',
      'create_note returns filename matching YYYY-MM-DDTHHMMSS.md pattern',
      async () => {
        const result = await createNote();
        assertDefined(result, 'create_note result');
        assertDefined(result.filename, 'filename');
        assertMatches(result.filename, FILENAME_PATTERN, 'filename format');
        testFilename = result.filename;
      },
    ),
  );

  // ST-02: save_note persists content (auto-save pathway — RBC-3 / FAIL-07)
  results.push(
    await runCheck(
      'ST-02',
      'storage',
      'save_note persists content via IPC (auto-save pathway)',
      async () => {
        assert(testFilename !== null, 'Requires ST-01 to pass first');
        const content = `${FRONTMATTER_TEMPLATE}Smoke test body content — ${new Date().toISOString()}`;
        await saveNote({ filename: testFilename!, content });
      },
    ),
  );

  // ST-03: read_note retrieves saved content
  results.push(
    await runCheck(
      'ST-03',
      'storage',
      'read_note returns previously saved content',
      async () => {
        assert(testFilename !== null, 'Requires ST-01 to pass first');
        const result = await readNote(testFilename!);
        assertDefined(result, 'read_note result');
        assert(typeof result.content === 'string', 'content must be a string');
        assert(result.content.includes('Smoke test body content'), 'content must contain saved text');
      },
    ),
  );

  // ST-04: list_notes returns the created note within default 7-day window (RBC-4 prerequisite)
  results.push(
    await runCheck(
      'ST-04',
      'storage',
      'list_notes (7-day default) includes the newly created note',
      async () => {
        assert(testFilename !== null, 'Requires ST-01 to pass first');
        const { from_date, to_date } = getDefaultDateRange();
        const notes = await listNotes({ from_date, to_date });
        assert(Array.isArray(notes), 'list_notes must return an array');
        const found = notes.some((n) => n.filename === testFilename);
        assert(found, `Created note ${testFilename} must appear in list_notes result`);
      },
    ),
  );

  // ST-05: Cleanup — delete_note removes the test file
  results.push(
    await runCheck(
      'ST-05',
      'storage',
      'delete_note removes the test note',
      async () => {
        assert(testFilename !== null, 'Requires ST-01 to pass first');
        await deleteNote(testFilename!);
        // Verify deletion by listing
        const { from_date, to_date } = getDefaultDateRange();
        const notes = await listNotes({ from_date, to_date });
        const found = notes.some((n) => n.filename === testFilename);
        assert(!found, `Deleted note ${testFilename} must not appear in list_notes result`);
      },
    ),
  );

  return results;
}
