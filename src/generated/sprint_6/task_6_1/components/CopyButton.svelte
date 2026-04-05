<script lang="ts">
  export let getTextFn: () => string;

  let copied = false;
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  async function handleCopy(): Promise<void> {
    try {
      const text = getTextFn();
      await navigator.clipboard.writeText(text);
      showFeedback();
    } catch {
      fallbackCopy(getTextFn());
    }
  }

  function fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showFeedback();
    } catch {
      // clipboard unavailable
    } finally {
      document.body.removeChild(textarea);
    }
  }

  function showFeedback(): void {
    copied = true;
    if (feedbackTimer !== null) clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      copied = false;
      feedbackTimer = null;
    }, 1500);
  }
</script>

<button
  class="copy-button"
  on:click={handleCopy}
  aria-label="本文をクリップボードにコピー"
  title="本文をクリップボードにコピー"
>
  {#if copied}
    <span class="icon">✓</span>
  {:else}
    <span class="icon">📋</span>
  {/if}
</button>

<style>
  .copy-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    background: var(--button-bg, #ffffff);
    cursor: pointer;
    transition: background-color 0.15s ease;
    flex-shrink: 0;
  }
  .copy-button:hover {
    background: var(--button-hover-bg, #f3f4f6);
  }
  .copy-button:active {
    background: var(--button-active-bg, #e5e7eb);
  }
  .icon {
    font-size: 16px;
    line-height: 1;
  }
</style>
