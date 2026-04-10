// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md
// @generated-by: codd generate --wave 10

export type SupportedPlatform = 'linux' | 'macos';

export interface PlatformValidationResult {
  readonly platform: SupportedPlatform | 'unsupported';
  readonly defaultNotesDir: string;
  readonly defaultConfigDir: string;
  readonly supported: boolean;
}

const PLATFORM_DEFAULTS: Record<
  SupportedPlatform,
  { notesDir: string; configDir: string }
> = {
  linux: {
    notesDir: '~/.local/share/promptnotes/notes/',
    configDir: '~/.config/promptnotes/',
  },
  macos: {
    notesDir: '~/Library/Application Support/promptnotes/notes/',
    configDir: '~/Library/Application Support/promptnotes/',
  },
};

export function detectPlatform(
  navigatorPlatform: string,
): SupportedPlatform | 'unsupported' {
  const upper = navigatorPlatform.toUpperCase();
  if (upper.indexOf('MAC') >= 0) {
    return 'macos';
  }
  if (upper.indexOf('LINUX') >= 0) {
    return 'linux';
  }
  return 'unsupported';
}

export function validatePlatform(
  navigatorPlatform: string,
): PlatformValidationResult {
  const platform = detectPlatform(navigatorPlatform);

  if (platform === 'unsupported') {
    return {
      platform: 'unsupported',
      defaultNotesDir: '',
      defaultConfigDir: '',
      supported: false,
    };
  }

  const defaults = PLATFORM_DEFAULTS[platform];
  return {
    platform,
    defaultNotesDir: defaults.notesDir,
    defaultConfigDir: defaults.configDir,
    supported: true,
  };
}

export function expandHomePath(
  path: string,
  homeDir: string,
): string {
  if (path.startsWith('~/')) {
    return homeDir + path.slice(1);
  }
  return path;
}
