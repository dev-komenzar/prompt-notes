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
//
// Static Cask formula template (placeholder sha256/version for CI substitution).
// Substitute %%VERSION%% and %%SHA256%% in the release pipeline before publishing.

export const CASK_FORMULA_TEMPLATE = `# typed: false
# frozen_string_literal: true

cask "promptnotes" do
  version "%%VERSION%%"
  sha256 "%%SHA256%%"

  url "https://github.com/dev-komenzar/promptnotes/releases/download/v%%VERSION%%/PromptNotes_%%VERSION%%_aarch64.dmg"
  name "PromptNotes"
  desc "Local note-taking app for AI prompts with grid review"
  homepage "https://github.com/dev-komenzar/promptnotes"

  depends_on macos: ">= :monterey"

  app "PromptNotes.app"

  zap trash: [
    "~/Library/Application Support/promptnotes",
    "~/Library/Logs/promptnotes",
    "~/Library/Preferences/com.promptnotes.plist",
    "~/Library/Saved Application State/com.promptnotes.savedState",
  ]
end
`;

export function renderCaskTemplate(version: string, sha256: string): string {
  return CASK_FORMULA_TEMPLATE.replaceAll("%%VERSION%%", version).replaceAll(
    "%%SHA256%%",
    sha256
  );
}
