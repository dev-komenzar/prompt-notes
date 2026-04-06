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
 * AI Feature Scope Validator
 *
 * Validates that NO AI calling features are present anywhere in the application.
 * Referenced by: AC-EX-01, FAIL-30
 *
 * AI呼び出し機能（LLM APIコール、チャットUI、プロンプト送信機能）が
 * 存在しないことを確認する。
 */

import type {
  ScopeComplianceResult,
  ScopeViolation,
} from '../scope_manifest';

/**
 * AI-related package names that must NOT be present.
 */
const PROHIBITED_AI_PACKAGES = [
  'openai',
  '@openai/api',
  '@anthropic-ai/sdk',
  'anthropic',
  'langchain',
  '@langchain/core',
  '@langchain/openai',
  '@langchain/anthropic',
  'cohere-ai',
  'ai',
  '@ai-sdk/openai',
  '@ai-sdk/anthropic',
  'ollama',
  'llamaindex',
  'gpt-3-encoder',
  'gpt-tokenizer',
  'tiktoken',
  '@huggingface/inference',
  'replicate',
  'together-ai',
  'groq-sdk',
  '@mistralai/mistralai',
  'google-generativeai',
  '@google/generative-ai',
] as const;

/**
 * Source code patterns that indicate AI feature implementation.
 */
const AI_SOURCE_PATTERNS = [
  {
    pattern: /ChatCompletion/i,
    label: 'ChatCompletion API reference',
  },
  {
    pattern: /createCompletion/i,
    label: 'OpenAI completion API reference',
  },
  {
    pattern: /anthropic\.(messages|completions)/i,
    label: 'Anthropic API reference',
  },
  {
    pattern: /\.chat\s*\.\s*completions/i,
    label: 'Chat completions API call',
  },
  {
    pattern: /llm[_-]?api|llm[_-]?call|llm[_-]?request/i,
    label: 'LLM API call pattern',
  },
  {
    pattern: /prompt[_-]?send|send[_-]?prompt/i,
    label: 'Prompt sending function',
  },
  {
    pattern: /ai[_-]?chat|chat[_-]?bot|chatbot/i,
    label: 'AI chat UI component',
  },
  {
    pattern: /embedding[_-]?(create|generate|compute)/i,
    label: 'Embedding generation',
  },
  {
    pattern: /vector[_-]?(store|db|search|index)/i,
    label: 'Vector store/search',
  },
] as const;

export function validateNoAIDependencies(
  installedPackages: ReadonlySet<string>,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  for (const pkg of PROHIBITED_AI_PACKAGES) {
    if (installedPackages.has(pkg)) {
      violations.push({
        featureId: 'ai_calling',
        failureId: 'FAIL-30',
        severity: 'release_blocking',
        message:
          `AI関連パッケージが検出されました: "${pkg}"。` +
          `AI呼び出し機能の実装は禁止されています。`,
        location: 'package.json / node_modules',
      });
    }
  }

  return {
    module: 'all',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}

export function validateNoAISourcePatterns(
  sourceCode: string,
  filePath: string,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  for (const { pattern, label } of AI_SOURCE_PATTERNS) {
    if (pattern.test(sourceCode)) {
      violations.push({
        featureId: 'ai_calling',
        failureId: 'FAIL-30',
        severity: 'release_blocking',
        message:
          `AI機能のソースコードパターンが検出されました: "${label}"。` +
          `AI呼び出し機能の実装は禁止されています。`,
        location: filePath,
      });
    }
  }

  return {
    module: 'all',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}
