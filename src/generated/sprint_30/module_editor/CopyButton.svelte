<script lang="ts">
  // @sprint: 30
  // @task: 30-1
  // @module: editor
  // @implements: CopyButton — 1クリッククリップボードコピー (RB-1, AC-EDIT-04)
  // このコンポーネントが navigator.clipboard.writeText() を呼び出す唯一の実行者
  export let getContent: () => string;

  type State = 'idle' | 'copied' | 'error';
  let state: State = 'idle';
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  async function handleCopy() {
    const text = getContent();
    try {
      await navigator.clipboard.writeText(text);
      setState('copied', 1500);
    } catch (err) {
      console.error('Clipboard write failed:', err);
      setState('error', 500);
    }
  }

  function setState(next: State, durationMs: number) {
    state = next;
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      state = 'idle';
    }, durationMs);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopy();
    }
  }

  const labels: Record<State, string> = {
    idle: '📋 コピー',
    copied: '✓ コピー完了',
    error: '✗ 失敗',
  };
</script>

<button
  class="copy-btn"
  class:copied={state === 'copied'}
  class:error={state === 'error'}
  on:click={handleCopy}
  on:keydown={handleKeydown}
  aria-label="本文全体をクリップボードにコピー"
  title="本文をコピー (frontmatter を除く)"
>
  {labels[state]}
</button>

<style>
  .copy-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 10px 20px;
    background: #4299e1;
    color: #fff;
    border: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: background 0.15s ease, transform 0.1s ease;
    z-index: 100;
  }

  .copy-btn:hover {
    background: #3182ce;
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
    animation: flash 0.5s ease;
  }

  @keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .copy-btn:focus-visible {
    outline: 3px solid #90cdf4;
    outline-offset: 2px;
  }
</style>
