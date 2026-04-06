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

// CoDD Traceability: sprint=56, task=56-1, milestone=スコープ外機能の不存在確認, module=storage

/**
 * Storage Module Scope Validator
 *
 * Validates that module:storage complies with:
 * - AC-ST-01: Filename format YYYY-MM-DDTHHMMSS.md (RBC-3)
 * - AC-ST-02: File format (.md with YAML frontmatter, tags only)
 * - AC-ST-03: Default directories
 * - AC-ST-04: Obsidian compatibility
 * - CONV-FILENAME, CONV-FRONTMATTER, CONV-AUTOSAVE, CONV-DIRECTORY
 * - No database, no cloud storage, no AI calling
 *
 * FAIL-06, FAIL-07
 */

import type {
  ScopeComplianceResult,
  ScopeViolation,
} from '../scope_manifest';

/**
 * Regex for valid PromptNotes filenames.
 * Format: YYYY-MM-DDTHHMMSS.md or YYYY-MM-DDTHHMMSS_N.md (collision suffix)
 */
export const FILENAME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/**
 * Validates that a filename conforms to the required format.
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}

/**
 * Validates that a filename does not contain path traversal sequences.
 */
export function isPathTraversalSafe(filename: string): boolean {
  if (filename.includes('..')) return false;
  if (filename.includes('/')) return false;
  if (filename.includes('\\')) return false;
  if (filename.startsWith('.')) return false;
  return true;
}

/**
 * Combined filename validation: format + path traversal safety.
 */
export function validateFilename(
  filename: string,
): { valid: true } | { valid: false; reason: string } {
  if (!isPathTraversalSafe(filename)) {
    return {
      valid: false,
      reason: `パストラバーサルの疑い: "${filename}" — "..", "/", "\\" を含むファイル名は拒否されます`,
    };
  }
  if (!isValidNoteFilename(filename)) {
    return {
      valid: false,
      reason: `ファイル名規則違反 (FAIL-06): "${filename}" — YYYY-MM-DDTHHMMSS.md 形式に準拠していません`,
    };
  }
  return { valid: true };
}

/**
 * Validates that no prohibited storage dependencies are present.
 */
export function validateStorageDependencies(
  installedPackages: ReadonlySet<string>,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  const prohibitedStoragePackages: ReadonlyArray<{
    name: string;
    failureId: string;
    featureId: string;
    reason: string;
  }> = [
    {
      name: 'better-sqlite3',
      failureId: 'FAIL-31',
      featureId: 'database',
      reason: 'SQLite利用は禁止（CONV-3）。ローカル.mdファイル保存が確定済み。',
    },
    {
      name: 'sql.js',
      failureId: 'FAIL-31',
      featureId: 'database',
      reason: 'SQLite利用は禁止（CONV-3）。',
    },
    {
      name: 'sqlite3',
      failureId: 'FAIL-31',
      featureId: 'database',
      reason: 'SQLite利用は禁止（CONV-3）。',
    },
    {
      name: '@prisma/client',
      failureId: 'FAIL-31',
      featureId: 'database',
      reason: 'ORM/DB利用は禁止（CONV-3）。',
    },
    {
      name: 'prisma',
      failureId: 'FAIL-31',
      featureId: 'database',
      reason: 'ORM/DB利用は禁止（CONV-3）。',
    },
    {
      name: 'typeorm',
      failureId: 'FAIL-31',
      featureId: 'database',
      reason: 'ORM/DB利用は禁止（CONV-3）。',
    },
    {
      name: 'sequelize',
      failureId: 'FAIL-31',
      featureId: 'database',
      reason: 'ORM/DB利用は禁止（CONV-3）。',
    },
    {
      name: 'knex',
      failureId: 'FAIL-31',
      featureId: 'database',
      reason: 'DB利用は禁止（CONV-3）。',
    },
    {
      name: 'mongoose',
      failureId: 'FAIL-31',
      featureId: 'database',
      reason: 'MongoDB利用は禁止（CONV-3）。',
    },
    {
      name: 'aws-sdk',
      failureId: 'FAIL-31',
      featureId: 'cloud_sync',
      reason: 'クラウドストレージ利用は禁止（CONV-3）。',
    },
    {
      name: '@aws-sdk/client-s3',
      failureId: 'FAIL-31',
      featureId: 'cloud_sync',
      reason: 'S3利用は禁止（CONV-3）。',
    },
    {
      name: 'googleapis',
      failureId: 'FAIL-31',
      featureId: 'cloud_sync',
      reason: 'Google Drive同期は禁止（CONV-3）。',
    },
    {
      name: 'dropbox',
      failureId: 'FAIL-31',
      featureId: 'cloud_sync',
      reason: 'Dropbox同期は禁止（CONV-3）。',
    },
    {
      name: 'firebase',
      failureId: 'FAIL-31',
      featureId: 'cloud_sync',
      reason: 'Firebase利用は禁止（CONV-3）。',
    },
    {
      name: 'supabase',
      failureId: 'FAIL-31',
      featureId: 'cloud_sync',
      reason: 'Supabase利用は禁止（CONV-3）。',
    },
  ];

  for (const pkg of prohibitedStoragePackages) {
    if (installedPackages.has(pkg.name)) {
      violations.push({
        featureId: pkg.featureId,
        failureId: pkg.failureId,
        severity: 'release_blocking',
        message: `禁止パッケージが検出されました: ${pkg.name} — ${pkg.reason}`,
        location: 'package.json / node_modules',
      });
    }
  }

  return {
    module: 'storage',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates the content structure of a note file.
 * Checks that frontmatter only contains 'tags' field.
 */
export function validateNoteContent(content: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const lines = content.split('\n');

  if (lines.length === 0) {
    return { valid: true, warnings: ['空ファイル'] };
  }

  // Check frontmatter structure
  if (lines[0]?.trim() === '---') {
    let frontmatterEndIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        frontmatterEndIndex = i;
        break;
      }
    }

    if (frontmatterEndIndex > 0) {
      const frontmatterLines = lines.slice(1, frontmatterEndIndex);
      for (const line of frontmatterLines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#')) continue;

        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmed.substring(0, colonIndex).trim();
          if (key !== 'tags') {
            warnings.push(
              `frontmatterに未認識フィールドが含まれています: "${key}"。` +
                `module:storageが認識するフィールドはtagsのみです。` +
                `追加フィールドの公式サポートには要件変更が必要です。`,
            );
          }
        }
      }
    }
  }

  return {
    valid: true,
    warnings,
  };
}

/**
 * Validates default directory paths match platform requirements.
 */
export function validateDefaultDirectory(
  platform: 'linux' | 'macos',
  actualPath: string,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  const expectedSuffix =
    platform === 'linux'
      ? '.local/share/promptnotes/notes'
      : 'Library/Application Support/promptnotes/notes';

  const normalizedPath = actualPath.replace(/\/+$/, '');

  if (!normalizedPath.endsWith(expectedSuffix)) {
    const failureId = platform === 'linux' ? 'FAIL-24' : 'FAIL-25';
    violations.push({
      featureId: 'incorrect_default_directory',
      failureId,
      severity: 'release_blocking',
      message:
        `${platform}のデフォルト保存先が不正です。` +
        `期待: */${expectedSuffix}, 実際: ${actualPath}`,
      location: 'module:storage config',
    });
  }

  return {
    module: 'storage',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}
