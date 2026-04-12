// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 57-1
// @task-title: パッケージング
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 57
// @codd-task: 57-1
// @codd-source: docs/design/system_design.md § 2.9

export const FLATPAK_APP_ID = 'io.github.dev_komenzar.PromptNotes';
export const APP_NAME = 'PromptNotes';
export const APP_VERSION = '0.1.0';

export const FLATPAK_RUNTIME = 'org.gnome.Platform';
export const FLATPAK_RUNTIME_VERSION = '46';
export const FLATPAK_SDK = 'org.gnome.Sdk';

export const SDK_EXTENSIONS = [
  'org.freedesktop.Sdk.Extension.rust-stable',
  'org.freedesktop.Sdk.Extension.node20',
] as const;

/** Tauri v2 + WebKitGTK requires these finish args on Linux */
export const FINISH_ARGS = [
  '--share=ipc',
  '--socket=fallback-x11',
  '--socket=wayland',
  '--device=dri',
  '--filesystem=home',
  '--talk-name=org.freedesktop.portal.Desktop',
  '--talk-name=org.freedesktop.portal.FileChooser',
] as const;

export const BUILD_ENV: Record<string, string> = {
  CARGO_HOME: '/run/build/promptnotes/cargo',
  npm_config_nodedir: '/usr/lib/sdk/node20',
  WEBKIT_DISABLE_COMPOSITING_MODE: '1',
};

export const BUILD_PATH_APPEND =
  '/usr/lib/sdk/rust-stable/bin:/usr/lib/sdk/node20/bin';

/** Default notes directory per AC-STOR-03 */
export const DEFAULT_NOTES_DIR_LINUX = '$HOME/.local/share/promptnotes/notes';
