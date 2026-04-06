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

import {
  type CaskConfig,
  PROMPTNOTES_CASK_DEFAULTS,
  buildArtifactUrl,
  buildDmgFilename,
} from "./cask-config";
import { renderCaskDefinition } from "./cask-template";
import {
  validateCaskConfig,
  validateRenderedCask,
  validateSha256,
} from "./cask-validator";
import { computeSha256FromFile } from "./cask-sha256";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface GenerateCaskInput {
  readonly version: string;
  readonly sha256?: string;
  readonly dmgPath?: string;
  readonly outputDir?: string;
  readonly configOverrides?: Partial<CaskConfig>;
}

export interface GenerateCaskOutput {
  readonly caskContent: string;
  readonly caskFilePath: string;
  readonly sha256: string;
  readonly artifactUrl: string;
  readonly dmgFilename: string;
  readonly version: string;
}

function mergeConfig(
  base: CaskConfig,
  overrides: Partial<CaskConfig> | undefined,
  version: string
): CaskConfig {
  if (!overrides) {
    return { ...base, version };
  }
  return {
    ...base,
    ...overrides,
    version,
    appTarget: {
      ...base.appTarget,
      ...(overrides.appTarget ?? {}),
    },
    zap: {
      trash: overrides.zap?.trash ?? base.zap.trash,
    },
    dependsOn: overrides.dependsOn ?? base.dependsOn,
    livecheck: overrides.livecheck ?? base.livecheck,
    caveats: overrides.caveats ?? base.caveats,
  };
}

export async function generateCask(
  input: GenerateCaskInput
): Promise<GenerateCaskOutput> {
  const config = mergeConfig(
    PROMPTNOTES_CASK_DEFAULTS,
    input.configOverrides,
    input.version
  );

  const validationResult = validateCaskConfig(config);
  if (!validationResult.valid) {
    const errorMessages = validationResult.errors
      .map((e) => `  ${e.field}: ${e.message}`)
      .join("\n");
    throw new Error(
      `Cask configuration validation failed:\n${errorMessages}`
    );
  }

  let sha256 = input.sha256 ?? "";

  if (!sha256 && input.dmgPath) {
    const result = await computeSha256FromFile(input.dmgPath);
    sha256 = result.hash;
  }

  if (sha256 && !validateSha256(sha256)) {
    throw new Error(`Invalid SHA256 hash format: ${sha256}`);
  }

  const caskContent = renderCaskDefinition({
    config,
    sha256: sha256 || undefined,
  });

  if (sha256) {
    const renderedErrors = validateRenderedCask(caskContent);
    const criticalErrors = renderedErrors.filter(
      (e) => e.severity === "error"
    );
    if (criticalErrors.length > 0) {
      const errorMessages = criticalErrors
        .map((e) => `  ${e.field}: ${e.message}`)
        .join("\n");
      throw new Error(
        `Rendered cask validation failed:\n${errorMessages}`
      );
    }
  }

  const outputDir = input.outputDir ?? ".";
  const caskFilePath = join(outputDir, `${config.token}.rb`);

  await mkdir(dirname(caskFilePath), { recursive: true });
  await writeFile(caskFilePath, caskContent, "utf-8");

  const artifactUrl = buildArtifactUrl(config, input.version);
  const dmgFilename = buildDmgFilename(config, input.version);

  return {
    caskContent,
    caskFilePath,
    sha256,
    artifactUrl,
    dmgFilename,
    version: input.version,
  };
}

export async function generateCaskFromDmg(
  dmgPath: string,
  version: string,
  outputDir: string
): Promise<GenerateCaskOutput> {
  return generateCask({
    version,
    dmgPath,
    outputDir,
  });
}
