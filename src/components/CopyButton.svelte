<!-- Sprint 16 – 1-click copy button component -->
<script lang="ts">
  import { copyToClipboard } from "../lib/clipboard";
  import { addToast } from "../lib/stores";

  /** Function that returns the text to copy */
  export let getContent: () => string;

  let copied = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  async function handleCopy() {
    const text = getContent();
    if (!text) {
      addToast("warning", "Nothing to copy");
      return;
    }
    const ok = await copyToClipboard(text);
    if (ok) {
      copied = true;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        copied = false;
      }, 2000);
    } else {
      addToast("error", "Failed to copy to clipboard");
    }
  }
</script>

<button
  class="copy-btn"
  class:copied
  on:click={handleCopy}
  title="Copy body to clipboard"
>
  {#if copied}
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    <span>Copied!</span>
  {:else}
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
    <span>Copy</span>
  {/if}
</button>

<style>
  .copy-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .copy-btn:hover {
    background-color: var(--bg-surface);
    color: var(--text-primary);
    border-color: var(--text-muted);
  }

  .copy-btn.copied {
    border-color: var(--success-color);
    color: var(--success-color);
  }
</style>
