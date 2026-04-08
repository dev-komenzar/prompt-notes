<!-- Sprint 21 – Settings view for configuration -->
<script lang="ts">
  import { onMount } from "svelte";
  import { config, addToast, goToGrid } from "../lib/stores";
  import { getConfig, setConfig } from "../lib/api";
  import type { Config } from "../lib/types";

  let notesDirectory: string = "";
  let defaultFilterDays: number = 7;
  let saving = false;
  let hasChanges = false;

  // Subscribe to config store
  const unsubConfig = config.subscribe((cfg) => {
    notesDirectory = cfg.notes_directory;
    defaultFilterDays = cfg.default_filter_days;
  });

  async function handlePickDirectory() {
    try {
      // Use Tauri dialog plugin to pick a directory
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        title: "Select Notes Directory",
      });
      if (selected && typeof selected === "string") {
        notesDirectory = selected;
        hasChanges = true;
      }
    } catch (e) {
      addToast("error", `Failed to open directory picker: ${e}`);
    }
  }

  function handleFilterDaysChange(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val > 0) {
      defaultFilterDays = val;
      hasChanges = true;
    }
  }

  async function handleSave() {
    saving = true;
    try {
      const newConfig: Partial<Config> = {
        notes_directory: notesDirectory,
        default_filter_days: defaultFilterDays,
      };
      await setConfig(newConfig);
      config.update((c) => ({ ...c, ...newConfig }));
      hasChanges = false;
      addToast("success", "Settings saved");
    } catch (e) {
      addToast("error", `Failed to save settings: ${e}`);
    } finally {
      saving = false;
    }
  }

  onMount(async () => {
    try {
      const cfg = await getConfig();
      config.set(cfg);
    } catch (e) {
      addToast("error", `Failed to load settings: ${e}`);
    }

    return () => unsubConfig();
  });
</script>

<div class="settings-view">
  <div class="settings-container">
    <h2 class="settings-title">Settings</h2>

    <div class="setting-group">
      <label class="setting-label" for="notes-dir">Notes Directory</label>
      <p class="setting-description">
        The local folder where your .md note files are stored.
      </p>
      <div class="directory-picker">
        <input
          id="notes-dir"
          type="text"
          class="setting-input"
          value={notesDirectory}
          readonly
          placeholder="No directory selected"
        />
        <button class="pick-dir-btn" on:click={handlePickDirectory}>
          Browse...
        </button>
      </div>
    </div>

    <div class="setting-group">
      <label class="setting-label" for="filter-days">Default Filter (days)</label>
      <p class="setting-description">
        Number of days to show in the grid view by default. (Default: 7)
      </p>
      <input
        id="filter-days"
        type="number"
        class="setting-input small"
        value={defaultFilterDays}
        min="1"
        max="365"
        on:change={handleFilterDaysChange}
      />
    </div>

    <div class="settings-actions">
      <button
        class="save-btn"
        on:click={handleSave}
        disabled={!hasChanges || saving}
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
      <button class="cancel-btn" on:click={goToGrid}>
        Back to Grid
      </button>
    </div>
  </div>
</div>

<style>
  .settings-view {
    display: flex;
    justify-content: center;
    height: 100%;
    overflow-y: auto;
    padding: 32px 16px;
  }

  .settings-container {
    width: 100%;
    max-width: 560px;
  }

  .settings-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 24px;
  }

  .setting-group {
    margin-bottom: 24px;
  }

  .setting-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .setting-description {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .setting-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--bg-surface);
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .setting-input:focus {
    border-color: var(--accent-color);
  }

  .setting-input.small {
    width: 100px;
  }

  .setting-input[readonly] {
    cursor: default;
  }

  .directory-picker {
    display: flex;
    gap: 8px;
  }

  .directory-picker .setting-input {
    flex: 1;
  }

  .pick-dir-btn {
    padding: 8px 16px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--bg-surface);
    color: var(--text-primary);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .pick-dir-btn:hover {
    border-color: var(--accent-color);
    background-color: var(--bg-secondary);
  }

  .settings-actions {
    display: flex;
    gap: 12px;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid var(--border-color);
  }

  .save-btn {
    padding: 8px 20px;
    border: none;
    border-radius: 6px;
    background-color: var(--accent-color);
    color: var(--bg-primary);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .save-btn:hover:not(:disabled) {
    background-color: var(--accent-hover);
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .cancel-btn {
    padding: 8px 20px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .cancel-btn:hover {
    border-color: var(--text-muted);
    color: var(--text-primary);
  }
</style>
