// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 62-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 62
// @task: 62-1 全モジュール 非機能要件計測

export type {
  BenchmarkResult,
  BenchmarkSuite,
  MemorySample,
  LatencySample,
  SearchBenchmarkConfig,
  NoteCreationBenchmarkConfig,
} from './types';

export { now, measure, measureAsync, percentile, mean } from './timing';

export {
  benchmarkNoteCreation,
  measureSingleNoteCreation,
} from './note_creation_benchmark';

export {
  createDebounce,
  measureDebounceFiringDelay,
  measureDebounceReset,
  benchmarkAutosaveDebounce,
} from './autosave_benchmark';

export {
  benchmarkSearch,
  benchmarkGridDefaultLoad,
} from './search_benchmark';

export {
  benchmarkIdleMemory,
  sampleMemoryOverTime,
} from './memory_monitor';

export {
  createBinarySizeResult,
  binarySizeNotMeasurable,
  BINARY_SIZE_TARGETS,
} from './binary_size_checker';

export {
  runAllBenchmarks,
  printBenchmarkSuite,
} from './benchmark_runner';

export {
  generateMarkdownReport,
  generateJsonReport,
  extractFailures,
  generateHtmlSummary,
} from './report_generator';
