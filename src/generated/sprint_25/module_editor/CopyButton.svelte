<script lang="ts">
  export let getEditorContent: () => string;

  let copied = false;
  let errorFlash = false;

  async function handleCopy() {
    try {
      const text = getEditorContent();
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
  {:else if errorFlash}
    ✕
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
    background: #3182ce;
    color: white;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    transition: background 0.15s, transform 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .copy-btn:hover {
    background: #2b6cb0;
    transform: scale(1.05);
  }

  .copy-btn:active {
    transform: scale(0.97);
  }

  .copy-btn.copied {
    background: #38a169;
  }

  .copy-btn.error {
    background: #e53e3e;
  }
</style>
