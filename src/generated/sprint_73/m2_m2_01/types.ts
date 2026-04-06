// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 73-1
// @task-title: M2（M2-01）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// tracer: sprint_73/m2_m2_01 | OQ-SF-001 | suffix-based collision resolution
// convention: module:storage — ファイル名は YYYY-MM-DDTHHMMSS.md 形式で確定。作成時タイムスタンプで不変。

/**
 * Parsed components of a PromptNotes filename.
 * Supports both base filenames (2026-04-04T143052.md)
 * and suffixed filenames (2026-04-04T143052_1.md).
 */
export interface ParsedFilename {
  /** Full filename including extension, e.g. "2026-04-04T143052_1.md" */
  readonly filename: string;
  /** Date portion YYYY-MM-DD, e.g. "2026-04-04" */
  readonly datePart: string;
  /** Time portion HHMMSS, e.g. "143052" */
  readonly timePart: string;
  /** Collision suffix number, or null if base filename */
  readonly suffix: number | null;
  /** ISO 8601 datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  readonly createdAt: string;
  /** Original timestamp string without suffix, e.g. "2026-04-04T143052" */
  readonly baseTimestamp: string;
}

/**
 * Result of a collision resolution attempt.
 */
export interface CollisionResolutionResult {
  /** The resolved filename that does not collide */
  readonly filename: string;
  /** Whether a suffix was applied to avoid collision */
  readonly suffixApplied: boolean;
  /** The suffix number, or null if no collision occurred */
  readonly suffix: number | null;
}

/**
 * Error indicating an invalid PromptNotes filename.
 */
export class FilenameValidationError extends Error {
  constructor(
    public readonly invalidFilename: string,
    message: string,
  ) {
    super(message);
    this.name = 'FilenameValidationError';
  }
}

/**
 * Error indicating a filename parse failure.
 */
export class FilenameParseError extends Error {
  constructor(
    public readonly invalidFilename: string,
    message: string,
  ) {
    super(message);
    this.name = 'FilenameParseError';
  }
}
