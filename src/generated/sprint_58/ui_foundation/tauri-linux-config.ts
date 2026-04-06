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
// Convention: framework:tauri — Tauri (Rust + WebView) confirmed framework

import type {
  TauriBundleLinuxConfig,
  DebBundleConfig,
  AppImageBundleConfig,
} from './types';
import { APP_METADATA } from './app-metadata';

const WEBKIT2GTK_DEP = 'libwebkit2gtk-4.1-0';
const GTK3_DEP = 'libgtk-3-0';
const GLIB_DEP = 'libglib2.0-0';
const JAVASCRIPTCORE_DEP = 'libjavascriptcoregtk-4.1-0';
const LIBAYATANA_DEP = 'libayatana-appindicator3-1';

export function createDefaultDebConfig(): DebBundleConfig {
  return {
    section: 'utils',
    priority: 'optional',
    depends: [
      WEBKIT2GTK_DEP,
      GTK3_DEP,
      GLIB_DEP,
      JAVASCRIPTCORE_DEP,
    ],
    recommends: [
      LIBAYATANA_DEP,
    ],
    provides: [APP_METADATA.name],
    conflicts: [],
    replaces: [],
    desktopTemplate: null,
  };
}

export function createDefaultAppImageConfig(): AppImageBundleConfig {
  return {
    bundleMediaFramework: false,
    files: {},
  };
}

export function createDefaultLinuxBundleConfig(): TauriBundleLinuxConfig {
  return {
    deb: createDefaultDebConfig(),
    appimage: createDefaultAppImageConfig(),
    icon: [
      'icons/32x32.png',
      'icons/64x64.png',
      'icons/128x128.png',
      'icons/256x256.png',
      'icons/icon.png',
    ],
    desktopEntry: {
      name: APP_METADATA.productName,
      genericName: 'Note Editor',
      comment: APP_METADATA.description,
      exec: `${APP_METADATA.name} %U`,
      icon: APP_METADATA.name,
      type: 'Application',
      categories: ['Utility', 'TextEditor', 'Office'],
      mimeType: ['text/markdown', 'text/x-markdown', 'text/plain'],
      startupNotify: true,
      startupWmClass: APP_METADATA.productName,
      terminal: false,
      actions: [],
    },
  };
}

export interface TauriConfJson {
  readonly $schema: string;
  readonly productName: string;
  readonly version: string;
  readonly identifier: string;
  readonly build: TauriConfBuild;
  readonly app: TauriConfApp;
  readonly bundle: TauriConfBundle;
}

export interface TauriConfBuild {
  readonly beforeDevCommand: string;
  readonly devUrl: string;
  readonly beforeBuildCommand: string;
  readonly frontendDist: string;
}

export interface TauriConfApp {
  readonly windows: readonly TauriConfWindow[];
  readonly security: TauriConfSecurity;
}

export interface TauriConfWindow {
  readonly title: string;
  readonly width: number;
  readonly height: number;
  readonly minWidth: number;
  readonly minHeight: number;
  readonly resizable: boolean;
}

export interface TauriConfSecurity {
  readonly csp: string;
  readonly dangerousDisableAssetCspModification: boolean;
}

export interface TauriConfBundle {
  readonly active: boolean;
  readonly targets: readonly string[];
  readonly icon: readonly string[];
  readonly linux: TauriConfBundleLinux;
}

export interface TauriConfBundleLinux {
  readonly deb: TauriConfBundleDeb;
  readonly appimage: TauriConfBundleAppImage;
}

export interface TauriConfBundleDeb {
  readonly section: string;
  readonly priority: string;
  readonly depends: readonly string[];
}

export interface TauriConfBundleAppImage {
  readonly bundleMediaFramework: boolean;
}

export function generateTauriConfJson(): TauriConfJson {
  const linuxConfig = createDefaultLinuxBundleConfig();

  return {
    $schema: 'https://raw.githubusercontent.com/nicegui-org/nicegui/main/nicegui/static/tauri-v2.schema.json',
    productName: APP_METADATA.productName,
    version: APP_METADATA.version,
    identifier: APP_METADATA.identifier,
    build: {
      beforeDevCommand: 'npm run dev',
      devUrl: 'http://localhost:5173',
      beforeBuildCommand: 'npm run build',
      frontendDist: '../dist',
    },
    app: {
      windows: [
        {
          title: APP_METADATA.productName,
          width: 1024,
          height: 768,
          minWidth: 640,
          minHeight: 480,
          resizable: true,
        },
      ],
      security: {
        csp: "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'",
        dangerousDisableAssetCspModification: false,
      },
    },
    bundle: {
      active: true,
      targets: ['deb', 'appimage'],
      icon: [...linuxConfig.icon],
      linux: {
        deb: {
          section: linuxConfig.deb.section,
          priority: linuxConfig.deb.priority,
          depends: [...linuxConfig.deb.depends],
        },
        appimage: {
          bundleMediaFramework: linuxConfig.appimage.bundleMediaFramework,
        },
      },
    },
  };
}
