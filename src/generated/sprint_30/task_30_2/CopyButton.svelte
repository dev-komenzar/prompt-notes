<script lang="ts">
  import type { EditorView } from '@codemirror/view';

  export let editorView: EditorView;

  let copied = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function extractBody(doc: string): string {
    const match = doc.match(/^---\n[\s\S]*?\n---\n/);
    return match ? doc.slice(match[0].length) : doc;
  }

  async function handleCopy() {
    const fullText = editorView.state.doc.toString();
    const body = extractBody(fullText);
    await navigator.clipboard.writeText(body);
    copied = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<button class="copy-button" on:click={handleCopy} aria-label="本文をコピー">
  {copied ? '✓ コピー済み' : 'コピー'}
</button>

<style>
  .copy-button {
    position: fixed;
    top: 12px;
    right: 16px;
    padding: 6px 14px;
    background: #1e293b;
    color: #f1f5f9;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    z-index: 100;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .copy-button:hover {
    background: #334155;
  }
</style>
