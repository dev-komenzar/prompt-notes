// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 64-1
// @task-title: —
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=64, task=64-1, module=release_notes
// Dependency: design:system-design (§2.6), governance:adr_tech_stack (ADR-001, ADR-006)

import type { PlatformTarget } from './types';

export const PLATFORM_LINUX: PlatformTarget = {
  platform: 'linux',
  webviewEngine: 'GTK WebKitGTK',
  distributionFormats: ['.AppImage', '.deb', 'Flatpak (Flathub)', 'NixOS package'],
  defaultNotesDir: '~/.local/share/promptnotes/notes/',
  defaultConfigPath: '~/.local/share/promptnotes/config.json',
  newNoteKeybind: 'Ctrl+N',
} as const;

export const PLATFORM_MACOS: PlatformTarget = {
  platform: 'macos',
  webviewEngine: 'WKWebView',
  distributionFormats: ['.dmg', 'Homebrew Cask'],
  defaultNotesDir: '~/Library/Application Support/promptnotes/notes/',
  defaultConfigPath: '~/Library/Application Support/promptnotes/config.json',
  newNoteKeybind: 'Cmd+N',
} as const;

export const SUPPORTED_PLATFORMS: readonly PlatformTarget[] = [
  PLATFORM_LINUX,
  PLATFORM_MACOS,
] as const;

export function getPlatformTarget(platform: 'linux' | 'macos'): PlatformTarget {
  switch (platform) {
    case 'linux':
      return PLATFORM_LINUX;
    case 'macos':
      return PLATFORM_MACOS;
  }
}

export function formatPlatformMatrix(platforms: readonly PlatformTarget[]): string {
  const lines: string[] = [];
  lines.push('| Platform | WebView Engine | Distribution | Default Notes Dir |');
  lines.push('|----------|---------------|-------------|-------------------|');
  for (const p of platforms) {
    lines.push(
      `| ${p.platform} | ${p.webviewEngine} | ${p.distributionFormats.join(', ')} | \`${p.defaultNotesDir}\` |`
    );
  }
  return lines.join('\n');
}
