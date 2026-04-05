<!-- @codd:generated sprint_31 task_31-1 module:editor -->
<!-- 1-click copy button — core UX.  Copies body text (frontmatter excluded)
     to the system clipboard.  Release-blocking if missing. -->
<script lang="ts">
  import { copyToClipboard } from './clipboard';

  /** Callback that returns the text to copy (body only, no frontmatter). */
  export let getTextFn: () => string;

  let copied = false;
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  async function handleCopy(): Promise<void> {
    const text = getTextFn();
    const success = await copyToClipboard(text);
    if (success) {
      copied = true;
      if (feedbackTimer !== null) {
        clearTimeout(feedbackTimer);
      }
      feedbackTimer = setTimeout(() => {
        copied = false;
        feedbackTimer = null;
      }, 1500);
    }
  }
</script>

<button
  class="copy-button"
  on:click={handleCopy}
  aria-label="本文をクリップボードにコピー"
  title="本文をクリップボードにコピー"
>
  {#if copied}
    <span class="copy-icon copy-icon--done">✓</span>
  {:else}
    <span class="copy-icon">📋</span>
  {/if}
</button>

<style>
  .copy-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    background: var(--button-bg, #ffffff);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .copy-button:hover {
    background: var(--button-hover-bg, #f3f4f6);
  }

  .copy-button:active {
    background: var(--button-active-bg, #e5e7eb);
  }

  .copy-icon {
    font-size: 16px;
    line-height: 1;
  }

  .copy-icon--done {
    color: var(--success-color, #22c55e);
  }
</style>
