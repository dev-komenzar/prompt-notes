<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- Sprint 21 — CopyButton: 1クリッククリップボードコピー（核心UX） -->
<script lang="ts">
  export let getContent: () => string;

  let copied = false;
  let errorFlash = false;

  async function handleCopy() {
    try {
      const text = getContent();
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => { copied = false; }, 1500);
    } catch {
      errorFlash = true;
      setTimeout(() => { errorFlash = false; }, 500);
    }
  }
</script>

<button
  class="copy-button"
  class:copied
  class:error={errorFlash}
  on:click={handleCopy}
  aria-label="本文をクリップボードにコピー"
  title="コピー"
>
  {#if copied}
    ✓
  {:else}
    📋
  {/if}
</button>

<style>
  .copy-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: var(--copy-btn-bg, #4a5568);
    color: white;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    transition: background 0.15s, transform 0.1s;
    z-index: 100;
  }

  .copy-button:hover {
    background: var(--copy-btn-hover-bg, #2d3748);
    transform: scale(1.05);
  }

  .copy-button.copied {
    background: #48bb78;
  }

  .copy-button.error {
    background: #fc8181;
  }
</style>
