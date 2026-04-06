// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 58-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 58 — Linux バイナリビルド（.AppImage, .deb）
// CoDD trace: plan:implementation_plan > task:58-1
// Convention: framework:tauri — Tauri build pipeline; platform:linux — Linux targets only

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { BuildTarget, BuildResult, BuildPipelineConfig } from './types';
import { APP_METADATA } from './app-metadata';
import { validateBuildPrerequisites } from './platform-detect';
import { validateAllArtifacts } from './build-artifacts-validator';
import { generateTauriConfJson } from './tauri-linux-config';

export function createDefaultPipelineConfig(outputDir: string): BuildPipelineConfig {
  const { createDefaultLinuxBundleConfig } = require('./tauri-linux-config');

  return {
    targets: [
      { platform: 'linux', format: 'appimage', arch: 'x86_64' },
      { platform: 'linux', format: 'deb', arch: 'x86_64' },
    ],
    metadata: APP_METADATA,
    linuxConfig: createDefaultLinuxBundleConfig(),
    outputDir,
    verbose: false,
    skipValidation: false,
  };
}

export function runBuildPipeline(config: BuildPipelineConfig): BuildPipelineResult {
  const startTime = Date.now();
  const results: BuildResult[] = [];
  const pipelineErrors: string[] = [];
  const pipelineWarnings: string[] = [];

  if (!config.skipValidation) {
    const prereqs = validateBuildPrerequisites();
    if (!prereqs.passed) {
      return {
        success: false,
        results: [],
        errors: prereqs.errors.map((e) => `Prerequisite check failed: ${e}`),
        warnings: [...prereqs.warnings],
        totalDuration: Date.now() - startTime,
      };
    }
    pipelineWarnings.push(...prereqs.warnings);
  }

  if (!existsSync(config.outputDir)) {
    mkdirSync(config.outputDir, { recursive: true });
  }

  emitTauriConfig(config);

  for (const target of config.targets) {
    if (target.platform !== 'linux') {
      pipelineWarnings.push(`Skipping non-Linux target: ${target.platform}/${target.format}`);
      continue;
    }

    const result = buildTarget(target, config);
    results.push(result);

    if (!result.success) {
      pipelineErrors.push(
        `Build failed for ${target.format} (${target.arch}): ${result.errors.join('; ')}`,
      );
    }
  }

  if (!config.skipValidation) {
    const validations = validateAllArtifacts(config.outputDir, config.metadata.version);
    for (const validation of validations) {
      if (!validation.valid) {
        pipelineErrors.push(...validation.errors);
      }
      pipelineWarnings.push(...validation.warnings);
    }
  }

  return {
    success: pipelineErrors.length === 0 && results.every((r) => r.success),
    results,
    errors: pipelineErrors,
    warnings: pipelineWarnings,
    totalDuration: Date.now() - startTime,
  };
}

export interface BuildPipelineResult {
  readonly success: boolean;
  readonly results: readonly BuildResult[];
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly totalDuration: number;
}

function buildTarget(target: BuildTarget, config: BuildPipelineConfig): BuildResult {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  const bundleFlag = target.format === 'appimage' ? 'appimage' : 'deb';
  const command = `cargo tauri build --bundles ${bundleFlag}`;

  if (config.verbose) {
    process.stdout.write(`[build] Running: ${command}\n`);
  }

  try {
    execSync(command, {
      encoding: 'utf-8',
      stdio: config.verbose ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        TAURI_BUNDLE_TARGET: bundleFlag,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`cargo tauri build failed for ${bundleFlag}: ${message}`);
  }

  const artifactValidations = validateAllArtifacts(config.outputDir, config.metadata.version);
  const matchingArtifacts = artifactValidations
    .filter((v) => v.artifact !== null && v.artifact.format === target.format)
    .map((v) => v.artifact!);

  return {
    success: errors.length === 0,
    artifacts: matchingArtifacts,
    errors,
    warnings,
    duration: Date.now() - startTime,
    target,
  };
}

function emitTauriConfig(config: BuildPipelineConfig): void {
  const tauriConf = generateTauriConfJson();

  const confPath = `${config.outputDir}/tauri.conf.generated.json`;
  writeFileSync(confPath, JSON.stringify(tauriConf, null, 2), 'utf-8');

  if (config.verbose) {
    process.stdout.write(`[build] Generated Tauri config: ${confPath}\n`);
  }
}

export function generateChecksumFile(outputDir: string, version: string): string {
  const validations = validateAllArtifacts(outputDir, version);
  const lines: string[] = [];

  for (const validation of validations) {
    if (validation.artifact) {
      const filename = validation.artifact.path.split('/').pop() || validation.artifact.path;
      lines.push(`${validation.artifact.sha256}  ${filename}`);
    }
  }

  const content = lines.join('\n') + '\n';
  const checksumPath = `${outputDir}/SHA256SUMS`;
  writeFileSync(checksumPath, content, 'utf-8');

  return checksumPath;
}
