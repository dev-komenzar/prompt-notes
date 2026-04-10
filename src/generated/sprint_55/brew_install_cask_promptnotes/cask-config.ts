// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: `brew install --cask promptnotes` でインストール・起動可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md, docs/governance/adr_tech_stack.md

export interface CaskConfig {
  caskName: string;
  version: string;
  sha256: string;
  urlTemplate: string;
  appName: string;
  description: string;
  homepage: string;
  zapTrash: string[];
}

export const CASK_DEFAULTS = {
  caskName: "promptnotes",
  appName: "PromptNotes.app",
  description: "Local Markdown note-taking app for AI prompts",
  homepage: "https://github.com/dev-komenzar/promptnotes",
  // macOS: ~/Library/Application Support/promptnotes/
  // config: ~/Library/Application Support/promptnotes/config.json
  zapTrash: [
    "~/Library/Application Support/promptnotes",
    "~/Library/Preferences/com.promptnotes.PromptNotes.plist",
    "~/Library/Saved Application State/com.promptnotes.PromptNotes.savedState",
  ],
  artifactFilename: (version: string) =>
    `promptnotes_${version}_universal.dmg`,
  urlTemplate: (version: string) =>
    `https://github.com/dev-komenzar/promptnotes/releases/download/v${version}/promptnotes_${version}_universal.dmg`,
} as const;
