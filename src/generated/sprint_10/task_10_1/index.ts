// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:10 task:10-1 module:ci-pipeline
// Public API barrel export for CI pipeline modules

export type {
  Platform,
  ModuleName,
  DistributionFormat,
  BuildTarget,
  ArtifactDescriptor,
  ModuleTestResult,
  BuildResult,
  PipelineResult,
  CIEnvironment,
  ReleaseBlocker,
  ReleaseBlockerResult,
} from "./types";

export { ALL_MODULES, REQUIRED_MODULES, SUPPORTED_PLATFORMS } from "./types";

export {
  detectPlatform,
  getBuildTarget,
  getAllBuildTargets,
  detectCIEnvironment,
  validatePlatform,
  assertNotWindows,
} from "./platform";

export {
  generateBuildMatrix,
  getMatrixEntry,
  generateGitHubActionsMatrix,
  getLinuxSystemDeps,
  getMacOSDeps,
  getSystemDeps,
} from "./build-matrix";

export type { MatrixEntry } from "./build-matrix";

export {
  getArtifactFileName,
  getTauriBundleOutputDir,
  getExpectedArtifactPaths,
  computeChecksum,
  collectArtifacts,
  validateArtifacts,
} from "./artifact-config";

export type { ArtifactNamingConfig } from "./artifact-config";

export {
  createReleaseBlockers,
  runAllReleaseBlockerChecks,
} from "./release-blocker-check";

export {
  runEnvironmentCheck,
  formatEnvironmentReport,
  checkProjectStructure,
} from "./env-check";

export {
  runAllModuleTests,
  createDefaultTestConfig,
  runRustTests,
  runFrontendTests,
  formatTestResults,
} from "./test-orchestrator";

export type { TestSuiteConfig, TestOrchestratorResult } from "./test-orchestrator";

export {
  executeBuild,
  createDefaultBuildConfig,
  formatBuildResult,
} from "./build-executor";

export type { BuildConfig } from "./build-executor";

export {
  getFlatpakManifest,
  getHomebrewCaskConfig,
  getNixPackageConfig,
  getDistributionFormats,
  generateFlatpakManifestJson,
  generateHomebrewCaskFormula,
  generateNixDerivation,
} from "./distribution-config";

export {
  validateTauriConf,
  validateCargoToml,
  formatValidationResult,
} from "./tauri-conf-validator";

export type { TauriConfValidationResult } from "./tauri-conf-validator";

export {
  generateCIWorkflow,
  generateReleaseWorkflow,
  serializeWorkflow,
} from "./github-actions-generator";

export type { WorkflowDefinition } from "./github-actions-generator";

export {
  runCIPipeline,
  formatPipelineResult,
  createDefaultPipelineConfig,
} from "./ci-pipeline";

export type { PipelineConfig } from "./ci-pipeline";
