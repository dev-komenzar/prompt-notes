import { register } from "@tauri-apps/plugin-global-shortcut";

export function setupGlobalShortcut(onNewNote: () => void): void {
  register("CmdOrCtrl+N", (event) => {
    if (event.state === "Pressed") {
      onNewNote();
    }
  }).catch((err) => {
    console.warn("Failed to register global shortcut:", err);
  });
}
