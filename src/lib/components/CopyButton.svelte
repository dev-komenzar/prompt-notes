<script lang="ts">
  import { readNote, copyToClipboard } from "$lib/utils/tauri-commands";
  import { extractBody } from "$lib/utils/frontmatter";

  export let filename: string;

  let state: "idle" | "success" | "error" = "idle";
  let copying = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function handleCopy() {
    if (copying) return;
    copying = true;
    try {
      const result = await readNote(filename);
      const body = extractBody(result.content);
      await copyToClipboard(body);
      state = "success";
      timer = setTimeout(() => { state = "idle"; copying = false; }, 2000);
    } catch (e) {
      console.error("Copy failed:", e);
      state = "error";
      timer = setTimeout(() => { state = "idle"; copying = false; }, 3000);
    }
  }
</script>

<button
  class="copy-btn"
  class:success={state === "success"}
  class:error={state === "error"}
  on:click={handleCopy}
  disabled={copying}
  aria-label="Copy note body"
  title="本文をコピー"
>
  {#if state === "success"}✓ Copied{:else if state === "error"}✕ Failed{:else}Copy{/if}
</button>

<style>
  .copy-btn {
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 12px;
    background: var(--surface);
    color: var(--text);
    transition: all 0.15s;
  }
  .copy-btn:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--accent); }
  .copy-btn:disabled { opacity: 0.5; }
  .success { color: var(--success); border-color: var(--success); }
  .error { color: var(--danger); border-color: var(--danger); }
</style>
