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

/**
 * Base error class for settings-related failures.
 */
export class SettingsError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SettingsError';
  }
}

/**
 * Thrown when `get_config` IPC command fails.
 */
export class GetConfigError extends SettingsError {
  constructor(cause?: unknown) {
    super('Failed to retrieve application configuration', cause);
    this.name = 'GetConfigError';
  }
}

/**
 * Thrown when `set_config` IPC command fails.
 * Typical reasons: directory does not exist, insufficient write permissions,
 * or backend serialisation failure.
 */
export class SetConfigError extends SettingsError {
  constructor(
    public readonly notesDir: string,
    cause?: unknown,
  ) {
    super(
      `Failed to update notes directory to "${notesDir}"`,
      cause,
    );
    this.name = 'SetConfigError';
  }
}

/**
 * Thrown when the user cancels the directory picker dialog.
 * This is a non-fatal condition; callers may choose to silently ignore it.
 */
export class DirectoryPickerCancelledError extends SettingsError {
  constructor() {
    super('Directory selection was cancelled by the user');
    this.name = 'DirectoryPickerCancelledError';
  }
}
