// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=56, task=56-1, milestone=スコープ外機能の不存在確認, module=all

/**
 * Scope Manifest — Defines all prohibited features, required features,
 * and scope boundaries for PromptNotes release validation.
 *
 * Referenced by: AC-EX-01, FAIL-30..FAIL-32, FAIL-04, FAIL-05
 */

export const PROHIBITED_FEATURES = [
  'ai_calling',
  'cloud_sync',
  'database',
  'title_input_field',
  'markdown_preview',
  'mobile_support',
  'windows_build',
] as const;

export type ProhibitedFeature = typeof PROHIBITED_FEATURES[number];

export interface ProhibitedFeatureDefinition {
  readonly id: ProhibitedFeature;
  readonly label: string;
  readonly failureId: string;
  readonly description: string;
  readonly detectionPatterns: readonly string[];
}

export const PROHIBITED_FEATURE_DEFINITIONS: ReadonlyMap<
  ProhibitedFeature,
  ProhibitedFeatureDefinition
> = new Map([
  [
    'ai_calling',
    {
      id: 'ai_calling',
      label: 'AI呼び出し機能',
      failureId: 'FAIL-30',
      description:
        'LLM API コール、チャット UI、プロンプト送信機能が存在しないこと',
      detectionPatterns: [
        'openai',
        'anthropic',
        'ChatCompletion',
        'llm',
        'chatbot',
        'ai-chat',
        'prompt-send',
        'gpt-api',
        'claude-api',
      ],
    },
  ],
  [
    'cloud_sync',
    {
      id: 'cloud_sync',
      label: 'クラウド同期',
      failureId: 'FAIL-31',
      description:
        'リモートサーバーへのデータ送信・同期機能が存在しないこと',
      detectionPatterns: [
        'cloud-sync',
        'remote-sync',
        's3-upload',
        'google-drive',
        'dropbox',
        'icloud',
        'sync-server',
        'websocket-sync',
      ],
    },
  ],
  [
    'database',
    {
      id: 'database',
      label: 'データベース利用',
      failureId: 'FAIL-31',
      description:
        'SQLite・IndexedDB・PostgreSQL等のDB利用が存在しないこと',
      detectionPatterns: [
        'sqlite',
        'indexeddb',
        'postgresql',
        'mysql',
        'mongodb',
        'prisma',
        'typeorm',
        'sequelize',
        'knex',
        'better-sqlite3',
        'sql.js',
      ],
    },
  ],
  [
    'title_input_field',
    {
      id: 'title_input_field',
      label: 'タイトル入力欄',
      failureId: 'FAIL-04',
      description:
        'エディタ画面にタイトル専用フィールドが存在しないこと',
      detectionPatterns: [
        'title-input',
        'note-title',
        'titleField',
        'titleInput',
        'TitleEditor',
      ],
    },
  ],
  [
    'markdown_preview',
    {
      id: 'markdown_preview',
      label: 'Markdownプレビュー（レンダリング）',
      failureId: 'FAIL-05',
      description:
        'MarkdownをHTMLに変換して表示する機能が存在しないこと',
      detectionPatterns: [
        'markdown-it',
        'marked',
        'remark-html',
        'rehype',
        'showdown',
        'markdown-preview',
        'MarkdownPreview',
        'renderMarkdown',
        'innerHTML',
        'dangerouslySetInnerHTML',
      ],
    },
  ],
  [
    'mobile_support',
    {
      id: 'mobile_support',
      label: 'モバイル対応',
      failureId: 'FAIL-32',
      description:
        'iOS / Android 向けビルドやレスポンシブモバイルレイアウトが含まれないこと',
      detectionPatterns: [
        'capacitor',
        'cordova',
        'react-native',
        'expo',
        'ionic',
        'tauri-mobile',
        'android-manifest',
        'ios-plist',
      ],
    },
  ],
  [
    'windows_build',
    {
      id: 'windows_build',
      label: 'Windowsビルド・配布',
      failureId: 'FAIL-40',
      description:
        'Windows向けビルドターゲットやインストーラー設定が含まれないこと',
      detectionPatterns: [
        'windows-target',
        'win32',
        'msi-installer',
        'nsis',
        'wix',
      ],
    },
  ],
]);

export const REQUIRED_MODULES = [
  'editor',
  'grid',
  'storage',
  'settings',
] as const;

export type RequiredModule = typeof REQUIRED_MODULES[number];

export const SUPPORTED_PLATFORMS = ['linux', 'macos'] as const;
export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];

export const REQUIRED_FRAMEWORK = 'tauri' as const;
export const REQUIRED_EDITOR_ENGINE = 'codemirror6' as const;
export const REQUIRED_STORAGE_FORMAT = 'local_md' as const;

export interface ScopeComplianceResult {
  readonly module: string;
  readonly passed: boolean;
  readonly violations: readonly ScopeViolation[];
  readonly timestamp: string;
}

export interface ScopeViolation {
  readonly featureId: ProhibitedFeature | string;
  readonly failureId: string;
  readonly severity: 'release_blocking' | 'warning';
  readonly message: string;
  readonly location?: string;
}
