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
// Unit tests for CopyButton feedback state machine and copy action.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFeedbackController } from './feedback-state';
import { executeCopyAction } from './copy-action';
import { createCopyButton } from './copy-button';
import { FEEDBACK_DURATION_MS } from './constants';
import type { CopyButtonState, CopyFeedbackPhase } from './types';

describe('createFeedbackController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should emit idle as initial state', () => {
    const states: CopyButtonState[] = [];
    const ctrl = createFeedbackController((s) => states.push(s));
    const initial = ctrl.getInitialState();

    expect(initial.phase).toBe('idle');
    expect(initial.icon).toBe('clipboard');
    expect(initial.showTooltip).toBe(false);
    expect(initial.busy).toBe(false);

    ctrl.dispose();
  });

  it('should transition to copied with check icon and tooltip', () => {
    const states: CopyButtonState[] = [];
    const ctrl = createFeedbackController((s) => states.push(s));

    ctrl.markCopied();

    expect(states).toHaveLength(1);
    expect(states[0].phase).toBe('copied');
    expect(states[0].icon).toBe('check');
    expect(states[0].showTooltip).toBe(true);
    expect(states[0].tooltipText).toBe('コピーしました');

    ctrl.dispose();
  });

  it('should auto-reset to idle after feedback duration', () => {
    const states: CopyButtonState[] = [];
    const ctrl = createFeedbackController((s) => states.push(s));

    ctrl.markCopied();
    expect(states).toHaveLength(1);
    expect(states[0].phase).toBe('copied');

    vi.advanceTimersByTime(FEEDBACK_DURATION_MS);

    expect(states).toHaveLength(2);
    expect(states[1].phase).toBe('idle');
    expect(states[1].icon).toBe('clipboard');
    expect(states[1].showTooltip).toBe(false);

    ctrl.dispose();
  });

  it('should transition to error phase on markError', () => {
    const states: CopyButtonState[] = [];
    const ctrl = createFeedbackController((s) => states.push(s));

    ctrl.markError();

    expect(states[0].phase).toBe('error');
    expect(states[0].showTooltip).toBe(true);
    expect(states[0].tooltipText).toBe('コピーに失敗しました');

    vi.advanceTimersByTime(FEEDBACK_DURATION_MS);
    expect(states[1].phase).toBe('idle');

    ctrl.dispose();
  });

  it('should clear previous timer when markCopied called rapidly', () => {
    const states: CopyButtonState[] = [];
    const ctrl = createFeedbackController((s) => states.push(s));

    ctrl.markCopied();
    vi.advanceTimersByTime(FEEDBACK_DURATION_MS / 2);

    // Second copy before first timeout fires
    ctrl.markCopied();
    vi.advanceTimersByTime(FEEDBACK_DURATION_MS / 2);

    // First timer should NOT have fired (was cleared)
    // Only the second markCopied and its eventual reset
    const phases = states.map((s) => s.phase);
    expect(phases).toEqual(['copied', 'copied']);

    vi.advanceTimersByTime(FEEDBACK_DURATION_MS);
    expect(states[states.length - 1].phase).toBe('idle');

    ctrl.dispose();
  });

  it('should accept custom feedback duration', () => {
    const customDuration = 3000;
    const states: CopyButtonState[] = [];
    const ctrl = createFeedbackController((s) => states.push(s), {
      feedbackDurationMs: customDuration,
    });

    ctrl.markCopied();
    vi.advanceTimersByTime(FEEDBACK_DURATION_MS);

    // Should still be in copied state (custom duration is longer)
    expect(states).toHaveLength(1);
    expect(states[0].phase).toBe('copied');

    vi.advanceTimersByTime(customDuration - FEEDBACK_DURATION_MS);
    expect(states[1].phase).toBe('idle');

    ctrl.dispose();
  });

  it('should not emit after dispose', () => {
    const states: CopyButtonState[] = [];
    const ctrl = createFeedbackController((s) => states.push(s));

    ctrl.markCopied();
    ctrl.dispose();

    vi.advanceTimersByTime(FEEDBACK_DURATION_MS * 2);

    // Only the markCopied emission, no idle reset
    expect(states).toHaveLength(1);
  });

  it('should show busy state via markBusy', () => {
    const states: CopyButtonState[] = [];
    const ctrl = createFeedbackController((s) => states.push(s));

    ctrl.markBusy();

    expect(states[0].phase).toBe('idle');
    expect(states[0].busy).toBe(true);

    ctrl.dispose();
  });

  it('should reset to idle on explicit reset call', () => {
    const states: CopyButtonState[] = [];
    const ctrl = createFeedbackController((s) => states.push(s));

    ctrl.markCopied();
    ctrl.reset();

    expect(states[1].phase).toBe('idle');
    expect(states[1].busy).toBe(false);

    // No further emissions after explicit reset (timer was cleared)
    vi.advanceTimersByTime(FEEDBACK_DURATION_MS * 2);
    expect(states).toHaveLength(2);

    ctrl.dispose();
  });
});

describe('executeCopyAction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call markCopied on successful clipboard write', async () => {
    // Mock navigator.clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const states: CopyButtonState[] = [];
    const ctrl = createFeedbackController((s) => states.push(s));
    const getTextFn = () => 'test document content';

    await executeCopyAction(getTextFn, ctrl);

    expect(writeTextMock).toHaveBeenCalledWith('test document content');
    const phases = states.map((s) => s.phase);
    expect(phases).toContain('copied');

    ctrl.dispose();
  });

  it('should call markError when clipboard write fails', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    // Also suppress execCommand fallback
    vi.spyOn(document, 'execCommand').mockReturnValue(false);

    const states: CopyButtonState[] = [];
    const ctrl = createFeedbackController((s) => states.push(s));
    const getTextFn = () => 'test content';

    await executeCopyAction(getTextFn, ctrl);

    const phases = states.map((s) => s.phase);
    // Should have error (from fallback failing too)
    expect(phases).toContain('error');

    ctrl.dispose();
    vi.restoreAllMocks();
  });
});

describe('createCopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide initialState and handleCopy', () => {
    const getTextFn = () => 'hello';
    const onChange = vi.fn();

    const handle = createCopyButton(getTextFn, onChange);

    expect(handle.initialState.phase).toBe('idle');
    expect(typeof handle.handleCopy).toBe('function');
    expect(typeof handle.dispose).toBe('function');

    handle.dispose();
  });

  it('should invoke onChange on copy action', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const onChange = vi.fn();
    const handle = createCopyButton(() => 'doc text', onChange);

    await handle.handleCopy();

    // Should have been called at least for busy and copied
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.phase).toBe('copied');

    handle.dispose();
  });
});
