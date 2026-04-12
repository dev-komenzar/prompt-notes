<!-- @traceability: detail:editor_clipboard §3.4, §4.3 (RB-1) -->
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
    background: var(--accent, #4f46e5);
    color: white;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: background 0.15s, transform 0.1s;
    z-index: 100;
  }
  .copy-btn:hover {
    background: var(--accent-hover, #4338ca);
    transform: scale(1.05);
  }
  .copy-btn.copied {
    background: #16a34a;
  }
  .copy-btn.error {
    background: #dc2626;
  }
</style>
