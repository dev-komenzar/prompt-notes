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

import { execSync } from 'child_process';
import { existsSync, statSync, readFileSync } from 'fs';
import { createHash } from 'crypto';
import type { BuildArtifact, LinuxBundleFormat, Architecture } from './types';
import { APP_METADATA } from './app-metadata';

export interface ArtifactValidationResult {
  readonly valid: boolean;
  readonly artifact: BuildArtifact | null;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export function validateArtifact(
  path: string,
  format: LinuxBundleFormat,
  arch: Architecture,
): ArtifactValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(path)) {
    return {
      valid: false,
      artifact: null,
      errors: [`Artifact not found: ${path}`],
      warnings: [],
    };
  }

  const stats = statSync(path);
  if (stats.size === 0) {
    return {
      valid: false,
      artifact: null,
      errors: [`Artifact is empty (0 bytes): ${path}`],
      warnings: [],
    };
  }

  if (format === 'appimage') {
    const appimageErrors = validateAppImage(path);
    errors.push(...appimageErrors);
  } else if (format === 'deb') {
    const debErrors = validateDeb(path);
    errors.push(...debErrors);
  }

  const minSizeBytes = 1024 * 1024;
  if (stats.size < minSizeBytes) {
    warnings.push(
      `Artifact size (${formatBytes(stats.size)}) is suspiciously small. Expected at least 1 MB for a Tauri binary.`,
    );
  }

  const maxSizeBytes = 200 * 1024 * 1024;
  if (stats.size > maxSizeBytes) {
    warnings.push(
      `Artifact size (${formatBytes(stats.size)}) exceeds 200 MB. This is unusually large for a Tauri application.`,
    );
  }

  const sha256 = computeSha256(path);

  const artifact: BuildArtifact = {
    path,
    format,
    arch,
    size: stats.size,
    sha256,
    createdAt: stats.mtime.toISOString(),
  };

  return {
    valid: errors.length === 0,
    artifact,
    errors,
    warnings,
  };
}

export function validateAllArtifacts(
  outputDir: string,
  version: string,
): readonly ArtifactValidationResult[] {
  const results: ArtifactValidationResult[] = [];

  const appImagePath = `${outputDir}/${APP_METADATA.name}_${version}_x86_64.AppImage`;
  if (existsSync(appImagePath)) {
    results.push(validateArtifact(appImagePath, 'appimage', 'x86_64'));
  }

  const altAppImagePath = `${outputDir}/${APP_METADATA.name}_${version}_amd64.AppImage`;
  if (existsSync(altAppImagePath)) {
    results.push(validateArtifact(altAppImagePath, 'appimage', 'x86_64'));
  }

  const debPath = `${outputDir}/${APP_METADATA.name}_${version}_amd64.deb`;
  if (existsSync(debPath)) {
    results.push(validateArtifact(debPath, 'deb', 'x86_64'));
  }

  if (results.length === 0) {
    results.push({
      valid: false,
      artifact: null,
      errors: [`No build artifacts found in ${outputDir} for version ${version}.`],
      warnings: [],
    });
  }

  return results;
}

function validateAppImage(path: string): string[] {
  const errors: string[] = [];

  if (!path.endsWith('.AppImage')) {
    errors.push(`AppImage file should have .AppImage extension, got: ${path}`);
  }

  try {
    const fd = readFileSync(path, { encoding: null });
    const header = fd.subarray(0, 4);
    const elfMagic = Buffer.from([0x7f, 0x45, 0x4c, 0x46]);
    if (!header.equals(elfMagic)) {
      errors.push('AppImage does not have a valid ELF header. The file may be corrupted.');
    }
  } catch {
    errors.push(`Failed to read AppImage header: ${path}`);
  }

  try {
    const output = execSync(`file "${path}"`, { encoding: 'utf-8' }).trim();
    if (!output.includes('ELF') && !output.includes('executable')) {
      errors.push(`AppImage does not appear to be a valid executable: ${output}`);
    }
  } catch {
    // file command not available, skip this check
  }

  return errors;
}

function validateDeb(path: string): string[] {
  const errors: string[] = [];

  if (!path.endsWith('.deb')) {
    errors.push(`Debian package should have .deb extension, got: ${path}`);
  }

  try {
    const fd = readFileSync(path, { encoding: null });
    const header = fd.subarray(0, 8).toString('ascii');
    if (!header.startsWith('!<arch>')) {
      errors.push('Debian package does not have a valid ar archive header. The file may be corrupted.');
    }
  } catch {
    errors.push(`Failed to read .deb header: ${path}`);
  }

  try {
    const output = execSync(`dpkg-deb --info "${path}" 2>&1`, { encoding: 'utf-8' });
    if (!output.includes('Package:')) {
      errors.push('Debian package metadata is missing or malformed.');
    }

    const packageNameMatch = output.match(/Package:\s*(.+)/);
    if (packageNameMatch && packageNameMatch[1].trim() !== APP_METADATA.name) {
      errors.push(
        `Debian package name "${packageNameMatch[1].trim()}" does not match expected "${APP_METADATA.name}".`,
      );
    }
  } catch {
    // dpkg-deb not available, skip deep validation
  }

  return errors;
}

function computeSha256(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
