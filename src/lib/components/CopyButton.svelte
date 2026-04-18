<script lang="ts">
  import { copyToClipboard } from "$lib/utils/tauri-commands";
  import { handleCommandError } from "$lib/utils/error-handler";

  interface Props {
    getContent: () => string;
  }

  let { getContent }: Props = $props();
  let copied = $state(false);

  async function handleCopy() {
    try {
      const text = getContent();
      await copyToClipboard(text);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    } catch (error) {
      handleCommandError(error);
    }
  }
</script>

<button
  class="copy-btn"
  onclick={handleCopy}
  aria-label="Copy note body to clipboard"
  data-testid="copy-button"
>
  {copied ? "Copied!" : "Copy Body"}
</button>

<style>
  .copy-btn {
    padding: 4px 10px;
    border-radius: var(--radius);
    font-size: 0.8rem;
    border: 1px solid var(--border);
    transition: background 0.15s;
  }
  .copy-btn:hover {
    background: var(--surface-secondary);
  }
</style>
