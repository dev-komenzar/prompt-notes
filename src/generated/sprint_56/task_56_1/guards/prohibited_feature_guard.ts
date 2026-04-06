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
 * Prohibited Feature Guard
 *
 * Runtime guards that can be embedded in the application to
 * assert that prohibited features are not active at runtime.
 *
 * These guards throw immediately on violation, providing
 * fail-fast behavior during development and testing.
 */

import {
  PROHIBITED_FEATURES,
  type ProhibitedFeature,
} from '../scope_manifest';

class ScopeViolationError extends Error {
  public readonly featureId: ProhibitedFeature | string;
  public readonly failureId: string;

  constructor(
    featureId: ProhibitedFeature | string,
    failureId: string,
    message: string,
  ) {
    super(`[SCOPE VIOLATION ${failureId}] ${message}`);
    this.name = 'ScopeViolationError';
    this.featureId = featureId;
    this.failureId = failureId;
  }
}

/**
 * Guard: Asserts no IndexedDB usage in the application.
 * Detects attempts to open IndexedDB databases.
 */
export function guardNoIndexedDB(): void {
  if (typeof indexedDB !== 'undefined') {
    const originalOpen = indexedDB.open;
    indexedDB.open = function (...args: Parameters<typeof originalOpen>) {
      throw new ScopeViolationError(
        'database',
        'FAIL-31',
        `IndexedDB.open("${args[0]}") が呼び出されました。DB利用は禁止です（CONV-3）。`,
      );
    };
  }
}

/**
 * Guard: Asserts no fetch to external APIs that suggest cloud sync or AI.
 */
export function guardNoExternalAPIFetch(): void {
  if (typeof globalThis.fetch !== 'undefined') {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = function (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input instanceof Request
              ? input.url
              : '';

      const prohibitedPatterns = [
        { pattern: /api\.openai\.com/i, feature: 'ai_calling' as const },
        { pattern: /api\.anthropic\.com/i, feature: 'ai_calling' as const },
        { pattern: /generativelanguage\.googleapis\.com/i, feature: 'ai_calling' as const },
        { pattern: /api\.cohere\.ai/i, feature: 'ai_calling' as const },
        { pattern: /api\.together\.xyz/i, feature: 'ai_calling' as const },
        { pattern: /api\.groq\.com/i, feature: 'ai_calling' as const },
        { pattern: /api\.mistral\.ai/i, feature: 'ai_calling' as const },
        { pattern: /api\.replicate\.com/i, feature: 'ai_calling' as const },
        { pattern: /sync\..*\.com/i, feature: 'cloud_sync' as const },
        { pattern: /s3\.amazonaws\.com/i, feature: 'cloud_sync' as const },
        { pattern: /storage\.googleapis\.com/i, feature: 'cloud_sync' as const },
        { pattern: /firestore\.googleapis\.com/i, feature: 'cloud_sync' as const },
        { pattern: /supabase\.(co|com)/i, feature: 'cloud_sync' as const },
      ];

      for (const { pattern, feature } of prohibitedPatterns) {
        if (pattern.test(url)) {
          throw new ScopeViolationError(
            feature,
            feature === 'ai_calling' ? 'FAIL-30' : 'FAIL-31',
            `禁止された外部APIへのfetchが検出されました: "${url}"`,
          );
        }
      }

      return originalFetch.call(globalThis, input, init);
    };
  }
}

/**
 * Guard: Asserts no WebSocket connections to external services.
 */
export function guardNoExternalWebSocket(): void {
  if (typeof WebSocket !== 'undefined') {
    const OriginalWebSocket = WebSocket;
    (globalThis as Record<string, unknown>)['WebSocket'] = class extends OriginalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        const urlStr = typeof url === 'string' ? url : url.href;
        const prohibitedPatterns = [
          /api\.openai\.com/i,
          /realtime.*openai/i,
          /sync\./i,
          /ws\..*cloud/i,
        ];

        for (const pattern of prohibitedPatterns) {
          if (pattern.test(urlStr)) {
            throw new ScopeViolationError(
              'cloud_sync',
              'FAIL-31',
              `禁止された外部WebSocket接続が検出されました: "${urlStr}"`,
            );
          }
        }

        super(url, protocols);
      }
    };
  }
}

/**
 * Installs all runtime guards.
 * Call this once at application startup during development/testing.
 */
export function installAllProhibitedFeatureGuards(): void {
  guardNoIndexedDB();
  guardNoExternalAPIFetch();
  guardNoExternalWebSocket();
}
