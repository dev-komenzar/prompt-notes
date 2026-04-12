<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- @generated-by: codd implement --sprint 52 -->
<script lang="ts">
  export let getContent: () => string;

  let copied = false;
  let errorFlash = false;

  async function handleCopy() {
    try {
      const text = getContent();
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 1500);
    } catch {
      errorFlash = true;
      setTimeout(() => {
        errorFlash = false;
      }, 500);
    }
  }
</script>

<button
  class="copy-btn"
  class:copied
  class:error={errorFlash}
  on:click={handleCopy}
  title="本文をクリップボードにコピー"
  aria-label="本文をクリップボードにコピー"
>
  {#if copied}
    ✓
  {:else}
    📋
  {/if}
</button>

<style>
  .copy-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: var(--btn-bg, #4a5568);
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: background 0.15s ease, transform 0.1s ease;
    z-index: 100;
  }

  .copy-btn:hover {
    background: var(--btn-hover-bg, #2d3748);
    transform: scale(1.05);
  }

  .copy-btn.copied {
    background: #38a169;
  }

  .copy-btn.error {
    background: #e53e3e;
  }
</style>
