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
// Public API for filename collision resolution module (M2-01)

export type {
  ParsedFilename,
  CollisionResolutionResult,
} from './types';

export {
  FilenameValidationError,
  FilenameParseError,
} from './types';

export {
  FILENAME_REGEX,
  PATH_TRAVERSAL_CHARS,
  NOTE_EXTENSION,
  TIMESTAMP_FORMAT,
  MAX_SUFFIX,
  SUFFIX_SEPARATOR,
} from './constants';

export {
  validateFilename,
  isValidFilename,
} from './filename-validator';

export {
  parseFilename,
  extractBaseTimestamp,
  deriveCreatedAt,
} from './filename-parser';

export {
  formatTimestamp,
  formatBaseFilename,
  formatSuffixedFilename,
} from './timestamp-formatter';

export {
  resolveCollision,
  findNextAvailableSuffix,
  findSameSecondFilenames,
} from './collision-resolver';

export {
  compareFilenames,
  sortFilenamesDescending,
  sortFilenamesAscending,
} from './filename-comparator';
