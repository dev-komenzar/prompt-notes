<script lang="ts">
  import { readNote, copyToClipboard } from "../shell/tauri-commands";
  import { extractBody } from "../editor/frontmatter";
  import { handleCommandError } from "../shell/error-handler";

  interface Props {
    filename: string;
  }

  let { filename }: Props = $props();
  let copied = $state(false);

  async function handleCopy(event: MouseEvent) {
    event.stopPropagation();
    try {
      const content = await readNote(filename);
      const body = extractBody(content);
      await copyToClipboard(body);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 1500);
    } catch (err) {
      handleCommandError(err);
    }
  }
</script>

<button
  class="copy-btn"
  class:copied
  data-testid="copy-button"
  on:click={handleCopy}
  title="Copy body to clipboard"
>
  {copied ? "✓" : "📋"}
</button>

<style>
  .copy-btn {
    font-size: 14px;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background var(--transition-fast);
  }

  .copy-btn:hover {
    background: var(--surface-hover);
  }

  .copy-btn.copied {
    color: var(--success);
  }
</style>
