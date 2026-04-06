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

import { generateCask, type GenerateCaskOutput } from "./cask-generator";
import { computeSha256FromFile, verifySha256 } from "./cask-sha256";
import { updateCaskFile } from "./cask-updater";
import {
  validateCaskConfig,
  validateRenderedCask,
} from "./cask-validator";
import {
  PROMPTNOTES_CASK_DEFAULTS,
  buildArtifactUrl,
} from "./cask-config";
import { existsSync } from "node:fs";

export interface CiReleaseInput {
  readonly version: string;
  readonly dmgPath: string;
  readonly caskOutputDir: string;
  readonly existingCaskPath?: string;
  readonly dryRun?: boolean;
}

export interface CiReleaseResult {
  readonly success: boolean;
  readonly caskFilePath: string;
  readonly sha256: string;
  readonly artifactUrl: string;
  readonly version: string;
  readonly errors: string[];
}

function validateDmgExists(dmgPath: string): string[] {
  if (!existsSync(dmgPath)) {
    return [`DMG file not found: ${dmgPath}`];
  }
  return [];
}

function validateVersionFormat(version: string): string[] {
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    return [`Version "${version}" does not follow expected format (X.Y.Z)`];
  }
  return [];
}

export async function runCaskRelease(
  input: CiReleaseInput
): Promise<CiReleaseResult> {
  const errors: string[] = [];

  errors.push(...validateVersionFormat(input.version));
  errors.push(...validateDmgExists(input.dmgPath));

  if (errors.length > 0) {
    return {
      success: false,
      caskFilePath: "",
      sha256: "",
      artifactUrl: "",
      version: input.version,
      errors,
    };
  }

  const sha256Result = await computeSha256FromFile(input.dmgPath);
  const artifactUrl = buildArtifactUrl(PROMPTNOTES_CASK_DEFAULTS, input.version);

  if (input.dryRun) {
    const config = { ...PROMPTNOTES_CASK_DEFAULTS, version: input.version };
    const configValidation = validateCaskConfig(config);
    if (!configValidation.valid) {
      errors.push(
        ...configValidation.errors.map((e) => `${e.field}: ${e.message}`)
      );
    }
    return {
      success: errors.length === 0,
      caskFilePath: "(dry-run)",
      sha256: sha256Result.hash,
      artifactUrl,
      version: input.version,
      errors,
    };
  }

  let output: GenerateCaskOutput;

  if (input.existingCaskPath && existsSync(input.existingCaskPath)) {
    const updatedContent = await updateCaskFile(input.existingCaskPath, {
      version: input.version,
      sha256: sha256Result.hash,
    });

    const renderedErrors = validateRenderedCask(updatedContent);
    const criticalErrors = renderedErrors.filter(
      (e) => e.severity === "error"
    );
    if (criticalErrors.length > 0) {
      errors.push(
        ...criticalErrors.map((e) => `${e.field}: ${e.message}`)
      );
      return {
        success: false,
        caskFilePath: input.existingCaskPath,
        sha256: sha256Result.hash,
        artifactUrl,
        version: input.version,
        errors,
      };
    }

    return {
      success: true,
      caskFilePath: input.existingCaskPath,
      sha256: sha256Result.hash,
      artifactUrl,
      version: input.version,
      errors: [],
    };
  }

  output = await generateCask({
    version: input.version,
    sha256: sha256Result.hash,
    outputDir: input.caskOutputDir,
  });

  return {
    success: true,
    caskFilePath: output.caskFilePath,
    sha256: output.sha256,
    artifactUrl: output.artifactUrl,
    version: output.version,
    errors: [],
  };
}

export async function verifyCaskArtifact(
  dmgPath: string,
  expectedSha256: string
): Promise<{ verified: boolean; actual: string; expected: string }> {
  const matches = await verifySha256(dmgPath, expectedSha256);
  const actual = (await computeSha256FromFile(dmgPath)).hash;
  return {
    verified: matches,
    actual,
    expected: expectedSha256,
  };
}
