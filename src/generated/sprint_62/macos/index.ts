// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 62-1
// @task-title: macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from sprint 62 – macOS Homebrew Cask 定義作成
// CoDD trace: plan:implementation_plan > 62-1

export type {
  CaskConfig,
  CaskArtifact,
  CaskBinary,
  CaskAppTarget,
  CaskZap,
  CaskCaveats,
  CaskDependsOn,
  CaskArch,
  CaskLivecheck,
} from "./cask-config";

export {
  PROMPTNOTES_CASK_DEFAULTS,
  buildArtifactUrl,
  buildDmgFilename,
} from "./cask-config";

export { renderCaskDefinition } from "./cask-template";
export type { RenderCaskOptions } from "./cask-template";

export {
  validateCaskConfig,
  validateSha256,
  validateRenderedCask,
} from "./cask-validator";
export type {
  ValidationError,
  ValidationResult,
} from "./cask-validator";

export {
  computeSha256FromFile,
  computeSha256FromBuffer,
  verifySha256,
} from "./cask-sha256";
export type { Sha256Result } from "./cask-sha256";

export {
  generateCask,
  generateCaskFromDmg,
} from "./cask-generator";
export type {
  GenerateCaskInput,
  GenerateCaskOutput,
} from "./cask-generator";

export {
  updateCaskVersion,
  updateCaskSha256,
  updateCaskFields,
  updateCaskFile,
  extractCaskVersion,
  extractCaskSha256,
} from "./cask-updater";
export type { CaskUpdateFields } from "./cask-updater";

export {
  runCaskRelease,
  verifyCaskArtifact,
} from "./cask-ci";
export type {
  CiReleaseInput,
  CiReleaseResult,
} from "./cask-ci";
