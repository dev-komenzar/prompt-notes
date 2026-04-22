<script lang="ts">
  import { copyToClipboard } from "$lib/shell/tauri-commands";
  import { handleCommandError } from "$lib/shell/error-handler";

  type CopyState = "idle" | "copying" | "success" | "error";

  interface Props {
    getContent: () => string | Promise<string>;
  }

  let { getContent }: Props = $props();
  let state = $state<CopyState>("idle");

  const SUCCESS_MS = 2000;
  const ERROR_MS = 3000;

  async function handleCopy() {
    if (state !== "idle") return;
    state = "copying";
    try {
      const text = await getContent();
      await copyToClipboard(text);
      state = "success";
      setTimeout(() => {
        if (state === "success") state = "idle";
      }, SUCCESS_MS);
    } catch (error) {
      state = "error";
      handleCommandError(error);
      setTimeout(() => {
        if (state === "error") state = "idle";
      }, ERROR_MS);
    }
  }
</script>

<button
  class="copy-btn"
  class:success={state === "success"}
  class:error={state === "error"}
  onclick={handleCopy}
  disabled={state !== "idle"}
  aria-label="Copy note body to clipboard"
  data-testid="copy-button"
>
  {#if state === "success"}✓ Copied{:else if state === "error"}✕ Failed{:else}Copy{/if}
</button>

<style>
  .copy-btn {
    padding: 4px 10px;
    border-radius: var(--radius);
    font-size: 0.8rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    transition: all 0.15s;
  }
  .copy-btn:hover:not(:disabled) {
    background: var(--surface-secondary);
    border-color: var(--accent);
  }
  .copy-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .copy-btn.success {
    color: var(--success);
    border-color: var(--success);
  }
  .copy-btn.error {
    color: var(--danger);
    border-color: var(--danger);
  }
</style>
