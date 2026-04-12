<script lang="ts">
  // @generated-from: docs/detailed_design/editor_clipboard_design.md §2.3, §4.3
  // Sprint 33 target: copy-operation ≤ 50 ms
  // Release-blocking: 1-click clipboard copy is core UX (RB-1, AC-EDIT-04, FC-EDIT-03)

  import { perfMark, perfMeasure } from './perf';

  // Callback provided by EditorView — returns body text only (no frontmatter).
  export let getContent: () => string;

  type State = 'idle' | 'copied' | 'error';
  let state: State = 'idle';

  async function handleCopy(): Promise<void> {
    perfMark('copy-start');
    try {
      const text = getContent();
      await navigator.clipboard.writeText(text);
      perfMeasure('copy-start', 'copy-end', 'copy-operation');
      state = 'copied';
      setTimeout(() => { state = 'idle'; }, 1500);
    } catch {
      state = 'error';
      setTimeout(() => { state = 'idle'; }, 500);
    }
  }
</script>

<button
  class="copy-btn"
  class:copied={state === 'copied'}
  class:error={state === 'error'}
  type="button"
  aria-label="本文をクリップボードにコピー"
  on:click={handleCopy}
>
  {#if state === 'copied'}
    ✓
  {:else if state === 'error'}
    ✗
  {:else}
    📋
  {/if}
</button>

<style>
  .copy-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: #4a5568;
    color: #ffffff;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    transition: background 0.15s, transform 0.1s;
    z-index: 100;
  }

  .copy-btn:hover {
    background: #2d3748;
    transform: scale(1.05);
  }

  .copy-btn:active {
    transform: scale(0.97);
  }

  /* Success: green for 1.5 s */
  .copy-btn.copied {
    background: #38a169;
  }

  /* Error: red flash for 500 ms */
  .copy-btn.error {
    background: #e53e3e;
  }
</style>
