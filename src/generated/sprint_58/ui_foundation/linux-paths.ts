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
// Convention: module:storage, module:settings — default dirs Linux: ~/.local/share/promptnotes/notes/

import type { XdgPaths } from './types';
import { APP_METADATA } from './app-metadata';

const FALLBACK_DATA_HOME = '.local/share';
const FALLBACK_CONFIG_HOME = '.config';
const FALLBACK_CACHE_HOME = '.cache';
const FALLBACK_STATE_HOME = '.local/state';

export function resolveXdgPaths(homeDir: string, env: Record<string, string | undefined>): XdgPaths {
  return {
    dataHome: env['XDG_DATA_HOME'] || joinPath(homeDir, FALLBACK_DATA_HOME),
    configHome: env['XDG_CONFIG_HOME'] || joinPath(homeDir, FALLBACK_CONFIG_HOME),
    cacheHome: env['XDG_CACHE_HOME'] || joinPath(homeDir, FALLBACK_CACHE_HOME),
    stateHome: env['XDG_STATE_HOME'] || joinPath(homeDir, FALLBACK_STATE_HOME),
  };
}

export function getDefaultNotesDir(homeDir: string, env: Record<string, string | undefined>): string {
  const xdg = resolveXdgPaths(homeDir, env);
  return joinPath(xdg.dataHome, APP_METADATA.name, 'notes');
}

export function getDefaultConfigPath(homeDir: string, env: Record<string, string | undefined>): string {
  const xdg = resolveXdgPaths(homeDir, env);
  return joinPath(xdg.dataHome, APP_METADATA.name, 'config.json');
}

export function getDefaultCacheDir(homeDir: string, env: Record<string, string | undefined>): string {
  const xdg = resolveXdgPaths(homeDir, env);
  return joinPath(xdg.cacheHome, APP_METADATA.name);
}

export function getInstallPaths(): LinuxInstallPaths {
  return {
    binary: `/usr/bin/${APP_METADATA.name}`,
    desktopFile: `/usr/share/applications/${APP_METADATA.identifier}.desktop`,
    iconBaseDir: '/usr/share/icons/hicolor',
    icons: {
      '32x32': `/usr/share/icons/hicolor/32x32/apps/${APP_METADATA.name}.png`,
      '64x64': `/usr/share/icons/hicolor/64x64/apps/${APP_METADATA.name}.png`,
      '128x128': `/usr/share/icons/hicolor/128x128/apps/${APP_METADATA.name}.png`,
      '256x256': `/usr/share/icons/hicolor/256x256/apps/${APP_METADATA.name}.png`,
      scalable: `/usr/share/icons/hicolor/scalable/apps/${APP_METADATA.name}.svg`,
    },
    metainfo: `/usr/share/metainfo/${APP_METADATA.identifier}.metainfo.xml`,
  };
}

export interface LinuxInstallPaths {
  readonly binary: string;
  readonly desktopFile: string;
  readonly iconBaseDir: string;
  readonly icons: Record<string, string>;
  readonly metainfo: string;
}

function joinPath(...segments: string[]): string {
  return segments
    .map((s, i) => (i === 0 ? s : s.replace(/^\/+/, '')))
    .join('/')
    .replace(/\/+/g, '/');
}
