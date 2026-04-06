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

import type { CaskConfig } from "./cask-config";

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationError[];
}

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;
const CASK_TOKEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const URL_PATTERN = /^https?:\/\/.+/;
const DMG_PATTERN = /\.dmg$/;
const APP_PATTERN = /\.app$/;

function validateToken(config: CaskConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config.token) {
    errors.push({
      field: "token",
      message: "Cask token is required",
      severity: "error",
    });
  } else if (!CASK_TOKEN_PATTERN.test(config.token)) {
    errors.push({
      field: "token",
      message: `Cask token "${config.token}" must be lowercase alphanumeric with hyphens only`,
      severity: "error",
    });
  }
  return errors;
}

function validateVersion(config: CaskConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config.version) {
    errors.push({
      field: "version",
      message: "Version is required",
      severity: "error",
    });
  } else if (!SEMVER_PATTERN.test(config.version)) {
    errors.push({
      field: "version",
      message: `Version "${config.version}" does not follow semver (expected X.Y.Z)`,
      severity: "warning",
    });
  }
  return errors;
}

function validateUrls(config: CaskConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config.homepage) {
    errors.push({
      field: "homepage",
      message: "Homepage URL is required",
      severity: "error",
    });
  } else if (!URL_PATTERN.test(config.homepage)) {
    errors.push({
      field: "homepage",
      message: `Homepage "${config.homepage}" is not a valid URL`,
      severity: "error",
    });
  }
  if (!config.artifactBaseUrl) {
    errors.push({
      field: "artifactBaseUrl",
      message: "Artifact base URL is required",
      severity: "error",
    });
  } else if (!URL_PATTERN.test(config.artifactBaseUrl)) {
    errors.push({
      field: "artifactBaseUrl",
      message: `Artifact base URL "${config.artifactBaseUrl}" is not a valid URL`,
      severity: "error",
    });
  }
  return errors;
}

function validateDmgPattern(config: CaskConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config.dmgFilenamePattern) {
    errors.push({
      field: "dmgFilenamePattern",
      message: "DMG filename pattern is required",
      severity: "error",
    });
  } else if (!DMG_PATTERN.test(config.dmgFilenamePattern)) {
    errors.push({
      field: "dmgFilenamePattern",
      message: `DMG filename pattern "${config.dmgFilenamePattern}" must end with .dmg`,
      severity: "error",
    });
  }
  if (
    config.dmgFilenamePattern &&
    !config.dmgFilenamePattern.includes("#{version}")
  ) {
    errors.push({
      field: "dmgFilenamePattern",
      message:
        'DMG filename pattern should contain "#{version}" interpolation placeholder',
      severity: "warning",
    });
  }
  return errors;
}

function validateAppTarget(config: CaskConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config.appTarget.name) {
    errors.push({
      field: "appTarget.name",
      message: "App target name is required",
      severity: "error",
    });
  } else if (!APP_PATTERN.test(config.appTarget.name)) {
    errors.push({
      field: "appTarget.name",
      message: `App target name "${config.appTarget.name}" must end with .app`,
      severity: "error",
    });
  }
  return errors;
}

function validateDescription(config: CaskConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!config.description) {
    errors.push({
      field: "description",
      message: "Description is required",
      severity: "error",
    });
  } else if (config.description.length > 200) {
    errors.push({
      field: "description",
      message: "Description should be concise (under 200 characters)",
      severity: "warning",
    });
  }
  if (config.description && config.description.startsWith("A ")) {
    errors.push({
      field: "description",
      message:
        'Homebrew convention: description should not start with "A " or "An "',
      severity: "warning",
    });
  }
  return errors;
}

function validateZap(config: CaskConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  if (config.zap.trash.length === 0) {
    errors.push({
      field: "zap.trash",
      message:
        "Zap stanza should list at least one path for clean uninstallation",
      severity: "warning",
    });
  }
  for (const path of config.zap.trash) {
    if (!path.startsWith("~/Library/") && !path.startsWith("/")) {
      errors.push({
        field: "zap.trash",
        message: `Zap path "${path}" should start with ~/Library/ or be an absolute path`,
        severity: "warning",
      });
    }
  }
  return errors;
}

export function validateCaskConfig(config: CaskConfig): ValidationResult {
  const allIssues: ValidationError[] = [
    ...validateToken(config),
    ...validateVersion(config),
    ...validateUrls(config),
    ...validateDmgPattern(config),
    ...validateAppTarget(config),
    ...validateDescription(config),
    ...validateZap(config),
  ];

  const errors = allIssues.filter((e) => e.severity === "error");
  const warnings = allIssues.filter((e) => e.severity === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateSha256(hash: string): boolean {
  return SHA256_PATTERN.test(hash);
}

export function validateRenderedCask(content: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!content.startsWith("cask ")) {
    errors.push({
      field: "rendered",
      message: 'Rendered cask must start with "cask" declaration',
      severity: "error",
    });
  }
  if (!content.trimEnd().endsWith("end")) {
    errors.push({
      field: "rendered",
      message: 'Rendered cask must end with "end"',
      severity: "error",
    });
  }
  if (content.includes("SHA256_PLACEHOLDER")) {
    errors.push({
      field: "rendered.sha256",
      message: "SHA256 placeholder has not been replaced with actual hash",
      severity: "error",
    });
  }
  if (!content.includes("version ")) {
    errors.push({
      field: "rendered.version",
      message: "Rendered cask is missing version stanza",
      severity: "error",
    });
  }
  if (!content.includes("url ")) {
    errors.push({
      field: "rendered.url",
      message: "Rendered cask is missing url stanza",
      severity: "error",
    });
  }
  if (!content.includes("sha256 ")) {
    errors.push({
      field: "rendered.sha256",
      message: "Rendered cask is missing sha256 stanza",
      severity: "error",
    });
  }
  if (!content.includes("homepage ")) {
    errors.push({
      field: "rendered.homepage",
      message: "Rendered cask is missing homepage stanza",
      severity: "error",
    });
  }
  if (!content.includes("app ")) {
    errors.push({
      field: "rendered.app",
      message: "Rendered cask is missing app stanza",
      severity: "error",
    });
  }

  return errors;
}
