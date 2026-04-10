// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 52-1
// @task-title: Flatpak でインストール・起動可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

export interface FlatpakModule {
  name: string;
  buildsystem?: string;
  "build-options"?: Record<string, unknown>;
  sources?: FlatpakSource[];
  modules?: FlatpakModule[];
  "no-autogen"?: boolean;
  "cmake-options"?: string[];
  config?: string[];
  "make-args"?: string[];
  "make-install-args"?: string[];
  "run-tests"?: boolean;
  cleanup?: string[];
  "post-install"?: string[];
  "build-commands"?: string[];
  "install-rule"?: string;
  subdir?: string;
}

export interface FlatpakSource {
  type: "git" | "archive" | "file" | "dir" | "patch" | "shell" | "script";
  url?: string;
  tag?: string;
  commit?: string;
  branch?: string;
  sha256?: string;
  path?: string;
  dest?: string;
  "dest-filename"?: string;
  commands?: string[];
  "strip-components"?: number;
}

export interface FlatpakFinishArgs {
  filesystem?: string[];
  socket?: string[];
  device?: string[];
  share?: string[];
  talk?: string[];
  own?: string[];
  env?: string[];
  allow?: string[];
}

export interface FlatpakManifest {
  id: string;
  runtime: string;
  "runtime-version": string;
  sdk: string;
  command: string;
  "finish-args": string[];
  "build-options"?: {
    "append-path"?: string;
    "build-args"?: string[];
    env?: Record<string, string>;
    "prepend-path"?: string;
  };
  cleanup?: string[];
  "cleanup-commands"?: string[];
  modules: FlatpakModule[];
}

export interface FlatpakBuildConfig {
  appId: string;
  manifestPath: string;
  repoPath: string;
  bundlePath: string;
  gpgKey?: string;
  installUser?: boolean;
}
