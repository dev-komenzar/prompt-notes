// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 60-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=60, task=60-1, module=ui_foundation
// Dependency: detail:component_architecture — module:shell, module:storage
// Convention: module:shell, framework:tauri — IPC boundary; no direct FS access from frontend
// Convention: module:storage, module:settings — Config persistence via Rust backend

import type { PlatformPaths } from './platform-paths';
import {
  detectLinuxVariant,
  resolveLinuxPathsWithEnv,
  type LinuxVariant,
} from './platform-paths';

export interface LinuxEnvironmentInfo {
  readonly variant: LinuxVariant;
  readonly paths: PlatformPaths;
  readonly desktopEnvironment: string | undefined;
  readonly xdgSessionType: string | undefined;
  readonly waylandDisplay: string | undefined;
}

/**
 * Gathers Linux environment information from environment variables.
 * This is used for diagnostics and platform-specific behavior,
 * not for direct filesystem operations (which go through Rust IPC).
 */
export function gatherLinuxEnvironment(
  homeDir: string,
  env: Record<string, string | undefined>,
): LinuxEnvironmentInfo {
  const variant = detectLinuxVariant(env);
  const paths = resolveLinuxPathsWithEnv(homeDir, env);

  return {
    variant,
    paths,
    desktopEnvironment: env['XDG_CURRENT_DESKTOP'] ?? env['DESKTOP_SESSION'],
    xdgSessionType: env['XDG_SESSION_TYPE'],
    waylandDisplay: env['WAYLAND_DISPLAY'],
  };
}

/**
 * WebKitGTK environment variables that may affect Tauri WebView behavior.
 * NixOS may require explicit library paths.
 */
export interface WebKitGtkEnvConfig {
  readonly gtkTheme: string | undefined;
  readonly gtkImModule: string | undefined;
  readonly webkitDisableCompositingMode: boolean;
}

export function resolveWebKitGtkConfig(
  env: Record<string, string | undefined>,
): WebKitGtkEnvConfig {
  return {
    gtkTheme: env['GTK_THEME'],
    gtkImModule: env['GTK_IM_MODULE'],
    webkitDisableCompositingMode:
      env['WEBKIT_DISABLE_COMPOSITING_MODE'] === '1',
  };
}

/**
 * NixOS wrapper script environment variables.
 * When running as a Nix package, GIO_EXTRA_MODULES and related
 * paths need to be set for GTK integration.
 */
export interface NixWrapperEnv {
  readonly GIO_EXTRA_MODULES: string;
  readonly GSETTINGS_SCHEMA_DIR: string;
  readonly LD_LIBRARY_PATH: string;
}

export function buildNixWrapperEnvTemplate(nixStorePaths: {
  gioModulesPath: string;
  gsettingsSchemaPath: string;
  libraryPaths: readonly string[];
}): NixWrapperEnv {
  return {
    GIO_EXTRA_MODULES: nixStorePaths.gioModulesPath,
    GSETTINGS_SCHEMA_DIR: nixStorePaths.gsettingsSchemaPath,
    LD_LIBRARY_PATH: nixStorePaths.libraryPaths.join(':'),
  };
}

/**
 * Validates that the runtime environment has the necessary
 * libraries and configuration for the Tauri WebView on Linux.
 * Returns a list of issues found (empty means all checks pass).
 *
 * Note: Actual library presence checks are performed by the Rust backend.
 * This function only validates environment variable configuration.
 */
export function validateLinuxRuntimeEnv(
  env: Record<string, string | undefined>,
): readonly string[] {
  const issues: string[] = [];
  const variant = detectLinuxVariant(env);

  if (variant === 'nixos') {
    if (!env['GIO_EXTRA_MODULES']) {
      issues.push(
        'GIO_EXTRA_MODULES is not set. GTK file dialogs may not function correctly on NixOS.',
      );
    }
  }

  if (!env['DISPLAY'] && !env['WAYLAND_DISPLAY']) {
    issues.push(
      'Neither DISPLAY nor WAYLAND_DISPLAY is set. A graphical session is required.',
    );
  }

  return issues;
}
