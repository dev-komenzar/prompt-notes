// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
// @task-title: `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=21 task=21-1 module=settings
//
// Tauri native directory picker wrapper.
// Uses `@tauri-apps/api/dialog` to display an OS-native directory chooser.
// The selected path is returned as a string; actual path validation and
// persistence is handled by the Rust backend via `set_config`.

import { open } from '@tauri-apps/api/dialog';
import { DirectoryPickerCancelledError } from './errors';

/**
 * Open the native directory selection dialog.
 *
 * @param currentDir - Optional path to pre-select in the dialog.
 * @returns The absolute path of the selected directory.
 * @throws {DirectoryPickerCancelledError} when the user dismisses the dialog
 *         without selecting a directory.
 */
export async function openDirectoryPicker(
  currentDir?: string,
): Promise<string> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select notes directory',
    defaultPath: currentDir,
  });

  // `open` returns `string | string[] | null`.
  // With `multiple: false`, it returns `string | null`.
  if (typeof selected === 'string' && selected.length > 0) {
    return selected;
  }

  throw new DirectoryPickerCancelledError();
}
