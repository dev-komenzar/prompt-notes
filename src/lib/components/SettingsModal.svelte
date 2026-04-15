<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { open } from "@tauri-apps/plugin-dialog";
  import { getConfig, setConfig, moveNotes, listNotes } from "$lib/utils/tauri-commands";
  import { config } from "$lib/stores/config";
  import { notes } from "$lib/stores/notes";
  import { filters } from "$lib/stores/filters";

  const dispatch = createEventDispatcher();
  let currentDir = "";
  let saving = false;
  let error = "";
  let moveResult = "";

  onMount(async () => {
    try {
      const cfg = await getConfig();
      currentDir = cfg.notes_dir;
      config.set(cfg);
    } catch (e) {
      console.error("Failed to load config:", e);
    }
  });

  async function chooseDirectory() {
    const selected = await open({ directory: true });
    if (selected && typeof selected === "string") {
      const oldDir = currentDir;
      saving = true;
      error = "";
      moveResult = "";
      try {
        await setConfig(selected);
        currentDir = selected;
        config.set({ notes_dir: selected });

        const doMove = confirm("ノートを新しいディレクトリに移動しますか？");
        if (doMove) {
          const result = await moveNotes(oldDir, selected);
          moveResult = `${result.moved}件移動、${result.skipped}件スキップ`;
        }

        // Refresh feed
        const f = { ...(await new Promise<any>((r) => filters.subscribe(r)())) };
        const res = await listNotes({ from_date: f.fromDate, to_date: f.toDate, tags: f.tags });
        notes.set(res.notes);
      } catch (e) {
        error = String(e);
      } finally {
        saving = false;
      }
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="modal-overlay" on:click|self={() => dispatch("close")} role="dialog">
  <div class="modal">
    <div class="modal-header">
      <h2>Settings</h2>
      <button class="close-btn" on:click={() => dispatch("close")}>✕</button>
    </div>
    <div class="modal-body">
      <label class="field">
        <span class="label">Notes Directory</span>
        <div class="dir-row">
          <input type="text" value={currentDir} readonly />
          <button class="btn-choose" on:click={chooseDirectory} disabled={saving}>
            {saving ? "..." : "Choose"}
          </button>
        </div>
      </label>
      {#if error}
        <div class="error">{error}</div>
      {/if}
      {#if moveResult}
        <div class="info">{moveResult}</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }
  .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    width: 500px;
    max-width: 90vw;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  h2 { font-size: 16px; }
  .close-btn { font-size: 18px; }
  .modal-body { padding: 20px; }
  .field { display: block; }
  .label {
    display: block;
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 6px;
  }
  .dir-row { display: flex; gap: 8px; }
  .dir-row input {
    flex: 1;
    padding: 6px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .btn-choose {
    padding: 6px 16px;
    background: var(--accent);
    color: white;
    border-radius: 6px;
  }
  .btn-choose:hover:not(:disabled) { background: var(--accent-hover); }
  .error {
    margin-top: 12px;
    color: var(--danger);
    font-size: 13px;
  }
  .info {
    margin-top: 12px;
    color: var(--success);
    font-size: 13px;
  }
</style>
