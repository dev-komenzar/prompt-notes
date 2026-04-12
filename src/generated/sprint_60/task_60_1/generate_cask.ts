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

import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { CaskConfig, ReleaseArtifact } from "./cask_config";
import { DEFAULT_CASK_CONFIG } from "./cask_config";

export function buildCaskFormula(config: CaskConfig): string {
  return `# typed: false
# frozen_string_literal: true

cask "${config.caskName}" do
  version "${config.version}"
  sha256 "${config.sha256}"

  url "${config.downloadUrlTemplate
    .replace("#{version}", config.version)
    .replace("#{version}", config.version)}"
  name "${config.appName}"
  desc "${config.appDesc}"
  homepage "${config.homepage}"

  depends_on macos: ">= :monterey"

  app "${config.binaryName}.app"

  zap trash: [
    "~/Library/Application Support/promptnotes",
    "~/Library/Logs/promptnotes",
    "~/Library/Preferences/com.promptnotes.plist",
    "~/Library/Saved Application State/com.promptnotes.savedState",
  ]
end
`;
}

export function computeSha256(filePath: string): string {
  const fileBuffer = readFileSync(filePath);
  return createHash("sha256").update(fileBuffer).digest("hex");
}

export function generateCaskFile(
  artifact: ReleaseArtifact,
  outputPath: string
): void {
  const config: CaskConfig = {
    ...DEFAULT_CASK_CONFIG,
    version: artifact.version,
    sha256: artifact.sha256,
  };

  const formula = buildCaskFormula(config);
  writeFileSync(outputPath, formula, "utf-8");
}

export function buildReleaseArtifact(
  version: string,
  dmgPath: string
): ReleaseArtifact {
  const sha256 = computeSha256(dmgPath);
  const dmgFilename = `PromptNotes_${version}_aarch64.dmg`;
  const downloadUrl = DEFAULT_CASK_CONFIG.downloadUrlTemplate
    .replace("#{version}", version)
    .replace("#{version}", version);

  return { version, sha256, dmgFilename, downloadUrl };
}

if (require.main === module) {
  const [, , version, dmgPath, outputDir] = process.argv;

  if (!version || !dmgPath || !outputDir) {
    console.error(
      "Usage: ts-node generate_cask.ts <version> <dmg-path> <output-dir>"
    );
    process.exit(1);
  }

  const artifact = buildReleaseArtifact(version, dmgPath);
  const outputPath = join(outputDir, `${DEFAULT_CASK_CONFIG.caskName}.rb`);
  generateCaskFile(artifact, outputPath);

  console.log(`Generated Cask formula: ${outputPath}`);
  console.log(`  version: ${artifact.version}`);
  console.log(`  sha256:  ${artifact.sha256}`);
  console.log(`  url:     ${artifact.downloadUrl}`);
}
