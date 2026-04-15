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
>
  {#if state === "success"}✓{:else if state === "error"}✕{:else}📋{/if}
</button>

<style>
  .copy-btn {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.15s;
  }
  .copy-btn:hover:not(:disabled) { background: var(--surface-hover); }
  .copy-btn:disabled { opacity: 0.5; }
  .success { color: var(--success); }
  .error { color: var(--danger); }
</style>
