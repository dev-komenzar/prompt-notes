// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — プラットフォーム検出
import * as os from 'os';
import * as path from 'path';

export type SupportedPlatform = 'linux' | 'macos';

export interface PlatformConfig {
  platform: SupportedPlatform;
  projectName: string;
  defaultNotesDir: string;
  defaultConfigPath: string;
  modKey: 'Meta' | 'Control';
  tauriBinaryPath: string;
  useOptions: Record<string, unknown>;
}

export function detectPlatform(): SupportedPlatform {
  const p = os.platform();
  if (p === 'linux') return 'linux';
  if (p === 'darwin') return 'macos';
  throw new Error(
    `Unsupported platform: ${p}. PromptNotes targets linux and macos only. Windows is out of scope.`,
  );
}

export function resolvePlatformConfig(): PlatformConfig {
  const platform = detectPlatform();
  const homeDir = os.homedir();

  if (platform === 'linux') {
    const dataDir = path.join(homeDir, '.local', 'share', 'promptnotes');
    return {
      platform,
      projectName: 'linux-gtk-webkitgtk',
      defaultNotesDir: path.join(dataDir, 'notes'),
      defaultConfigPath: path.join(dataDir, 'config.json'),
      modKey: 'Control',
      tauriBinaryPath: resolveTauriBinary('linux'),
      useOptions: {},
    };
  }

  // macOS
  const dataDir = path.join(homeDir, 'Library', 'Application Support', 'promptnotes');
  return {
    platform,
    projectName: 'macos-wkwebview',
    defaultNotesDir: path.join(dataDir, 'notes'),
    defaultConfigPath: path.join(dataDir, 'config.json'),
    modKey: 'Meta',
    tauriBinaryPath: resolveTauriBinary('macos'),
    useOptions: {},
  };
}

function resolveTauriBinary(platform: SupportedPlatform): string {
  const projectRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');
  if (platform === 'linux') {
    return path.join(
      projectRoot,
      'src-tauri',
      'target',
      'release',
      'promptnotes',
    );
  }
  return path.join(
    projectRoot,
    'src-tauri',
    'target',
    'release',
    'bundle',
    'macos',
    'PromptNotes.app',
    'Contents',
    'MacOS',
    'PromptNotes',
  );
}

export function getNewNoteShortcut(platform: SupportedPlatform): string {
  return platform === 'macos' ? 'Meta+n' : 'Control+n';
}

export function formatExpectedNotesDir(platform: SupportedPlatform): string {
  const home = os.homedir();
  if (platform === 'linux') {
    return path.join(home, '.local', 'share', 'promptnotes', 'notes');
  }
  return path.join(home, 'Library', 'Application Support', 'promptnotes', 'notes');
}
