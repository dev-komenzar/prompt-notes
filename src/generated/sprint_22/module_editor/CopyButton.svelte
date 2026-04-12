<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- @sprint: 22 — 自動保存パイプライン実装 -->
<!-- Core UX: 1-click copy — release blocking (RB-1) -->
<script lang="ts">
  export let getContent: () => string;

  type ButtonState = 'idle' | 'copied' | 'error';
  let state: ButtonState = 'idle';
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  async function handleCopy() {
    try {
      const text = getContent();
      await navigator.clipboard.writeText(text);
      setState('copied', 1500);
    } catch (err) {
      console.error('[CopyButton] clipboard write failed:', err);
      setState('error', 500);
    }
  }

  function setState(next: ButtonState, durationMs: number) {
    state = next;
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { state = 'idle'; }, durationMs);
  }
</script>

<button
  class="copy-btn"
  class:copied={state === 'copied'}
  class:error={state === 'error'}
  aria-label="本文をクリップボードにコピー"
  on:click={handleCopy}
>
  {#if state === 'copied'}
    ✓ コピーしました
  {:else if state === 'error'}
    コピー失敗
  {:else}
    📋 コピー
  {/if}
</button>

<style>
  .copy-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 8px 16px;
    border-radius: 20px;
    border: none;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    background: #2d3748;
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: background 0.15s ease, transform 0.1s ease;
    z-index: 100;
  }

  .copy-btn:hover {
    background: #1a202c;
    transform: translateY(-1px);
  }

  .copy-btn:active {
    transform: translateY(0);
  }

  .copy-btn.copied {
    background: #38a169;
  }

  .copy-btn.error {
    background: #e53e3e;
  }
</style>
