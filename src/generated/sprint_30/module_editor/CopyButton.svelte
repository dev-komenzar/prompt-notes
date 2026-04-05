<!--
  sprint:30 | module:editor | CoDD trace: detail:editor_clipboard (CONV-3)
  1-click copy button — core UX. Release-blocking if absent.
  Copies body text (frontmatter excluded) to system clipboard.
  Uses navigator.clipboard.writeText with execCommand fallback.
  Child component of Editor.svelte; not reused outside module:editor.
-->
<script lang="ts">
  import { writeToClipboard } from './clipboard';

  /** Callback supplied by parent (Editor.svelte) to retrieve copy text. */
  export let getTextFn: () => string;

  let copied = false;
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  async function handleCopy(): Promise<void> {
    const text = getTextFn();
    const success = await writeToClipboard(text);

    if (success) {
      copied = true;
      if (feedbackTimer !== null) {
        clearTimeout(feedbackTimer);
      }
      feedbackTimer = setTimeout(() => {
        copied = false;
        feedbackTimer = null;
      }, 1500);
    } else {
      console.error('[CopyButton] clipboard write failed');
    }
  }
</script>

<button
  class="copy-button"
  on:click={handleCopy}
  aria-label="本文をクリップボードにコピー"
  title="本文をクリップボードにコピー"
  type="button"
>
  {#if copied}
    <span class="copy-icon copy-icon--success" aria-hidden="true">✓</span>
  {:else}
    <span class="copy-icon" aria-hidden="true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </span>
  {/if}
</button>

<style>
  .copy-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    background: var(--button-bg, #ffffff);
    color: var(--button-fg, #374151);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease,
      color 0.15s ease;
    padding: 0;
    flex-shrink: 0;
  }

  .copy-button:hover {
    background: var(--button-hover-bg, #f3f4f6);
    border-color: var(--button-hover-border, #9ca3af);
  }

  .copy-button:active {
    background: var(--button-active-bg, #e5e7eb);
  }

  .copy-button:focus-visible {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: 2px;
  }

  .copy-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .copy-icon--success {
    color: var(--success-color, #22c55e);
    font-size: 18px;
    font-weight: 700;
  }
</style>
