// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 60-1
// @task-title: パッケージング
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 60 task: 60-1 Cask formula 作成

export interface CaskConfig {
  caskName: string;
  appName: string;
  appDesc: string;
  homepage: string;
  version: string;
  sha256: string;
  downloadUrlTemplate: string;
  binaryName: string;
}

export interface ReleaseArtifact {
  version: string;
  sha256: string;
  dmgFilename: string;
  downloadUrl: string;
}

export const DEFAULT_CASK_CONFIG: Omit<CaskConfig, "version" | "sha256"> = {
  caskName: "promptnotes",
  appName: "PromptNotes",
  appDesc: "Local note-taking app for AI prompts with grid review",
  homepage: "https://github.com/dev-komenzar/promptnotes",
  downloadUrlTemplate:
    "https://github.com/dev-komenzar/promptnotes/releases/download/v#{version}/PromptNotes_#{version}_aarch64.dmg",
  binaryName: "PromptNotes",
};
