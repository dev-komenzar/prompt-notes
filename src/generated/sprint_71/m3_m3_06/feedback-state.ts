// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 71-1
// @task-title: M3（M3-06）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=71 task=71-1 module=m3_m3_06
// @codd:trace detail:editor_clipboard OQ-E01
// Feedback state machine for CopyButton.
// Resolves OQ-E01: both icon change AND tooltip are used.
//   idle  → (copy success) → copied  → (timeout 1.5s) → idle
//   idle  → (copy error)   → error   → (timeout 1.5s) → idle

import type {
  CopyButtonState,
  CopyFeedbackConfig,
  CopyFeedbackPhase,
  OnStateChange,
} from './types';
import {
  FEEDBACK_DURATION_MS,
  FEEDBACK_TOOLTIP_TEXT,
  COPY_BUTTON_ARIA_LABEL,
  ICON_CLIPBOARD,
  ICON_CHECK,
} from './constants';

function buildState(phase: CopyFeedbackPhase, config: CopyFeedbackConfig, busy: boolean): CopyButtonState {
  switch (phase) {
    case 'copied':
      return {
        phase: 'copied',
        icon: ICON_CHECK,
        showTooltip: true,
        tooltipText: config.tooltipText,
        ariaLabel: config.ariaLabel,
        busy: false,
      };
    case 'error':
      return {
        phase: 'error',
        icon: ICON_CLIPBOARD,
        showTooltip: true,
        tooltipText: 'コピーに失敗しました',
        ariaLabel: config.ariaLabel,
        busy: false,
      };
    case 'idle':
    default:
      return {
        phase: 'idle',
        icon: ICON_CLIPBOARD,
        showTooltip: false,
        tooltipText: '',
        ariaLabel: config.ariaLabel,
        busy,
      };
  }
}

/**
 * Creates a feedback state controller that manages CopyButton visual state
 * transitions: idle → copied → idle (with timeout).
 *
 * OQ-E01 resolution: BOTH icon change (clipboard → check) and tooltip
 * ("コピーしました") are shown simultaneously for 1.5 seconds.
 */
export function createFeedbackController(
  onChange: OnStateChange,
  config: Partial<CopyFeedbackConfig> = {},
) {
  const resolvedConfig: CopyFeedbackConfig = {
    feedbackDurationMs: config.feedbackDurationMs ?? FEEDBACK_DURATION_MS,
    tooltipText: config.tooltipText ?? FEEDBACK_TOOLTIP_TEXT,
    ariaLabel: config.ariaLabel ?? COPY_BUTTON_ARIA_LABEL,
  };

  let currentPhase: CopyFeedbackPhase = 'idle';
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  function emit(phase: CopyFeedbackPhase, busy: boolean = false): void {
    if (disposed) return;
    currentPhase = phase;
    onChange(buildState(phase, resolvedConfig, busy));
  }

  function clearTimer(): void {
    if (feedbackTimer !== null) {
      clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }
  }

  function scheduleReset(): void {
    clearTimer();
    feedbackTimer = setTimeout(() => {
      feedbackTimer = null;
      emit('idle');
    }, resolvedConfig.feedbackDurationMs);
  }

  return {
    /**
     * Signal that copying is in progress (button was clicked).
     */
    markBusy(): void {
      clearTimer();
      emit('idle', true);
    },

    /**
     * Transition to the 'copied' feedback phase.
     * Automatically returns to 'idle' after the configured duration.
     */
    markCopied(): void {
      clearTimer();
      emit('copied');
      scheduleReset();
    },

    /**
     * Transition to the 'error' feedback phase.
     * Automatically returns to 'idle' after the configured duration.
     */
    markError(): void {
      clearTimer();
      emit('error');
      scheduleReset();
    },

    /**
     * Force return to idle state (e.g., on component unmount).
     */
    reset(): void {
      clearTimer();
      emit('idle');
    },

    /**
     * Get current phase for testing or conditional logic.
     */
    getPhase(): CopyFeedbackPhase {
      return currentPhase;
    },

    /**
     * Get the initial state snapshot (for component initialization).
     */
    getInitialState(): CopyButtonState {
      return buildState('idle', resolvedConfig, false);
    },

    /**
     * Dispose the controller, clearing any pending timers.
     * Must be called on component destroy (Svelte onDestroy).
     */
    dispose(): void {
      disposed = true;
      clearTimer();
    },
  };
}

export type FeedbackController = ReturnType<typeof createFeedbackController>;
