import { writable } from "svelte/store";

export interface AppError {
  id: number;
  message: string;
  code?: string;
  timestamp: number;
}

let errorId = 0;

export const errors = writable<AppError[]>([]);

export function handleCommandError(error: unknown): void {
  let message = "An unexpected error occurred";
  let code: string | undefined;

  if (typeof error === "string") {
    // Parse Tauri error strings
    if (error.includes("NotFound")) {
      message = "Note not found. It may have been deleted.";
      code = "NOT_FOUND";
    } else if (error.includes("PermissionDenied")) {
      message = "Permission denied. Check file permissions.";
      code = "PERMISSION_DENIED";
    } else if (error.includes("DirectoryNotFound")) {
      message = "Notes directory not found. Check settings.";
      code = "DIR_NOT_FOUND";
    } else if (error.includes("InvalidFrontmatter")) {
      message = "Note has invalid frontmatter format.";
      code = "INVALID_FRONTMATTER";
    } else if (error.includes("TrashNotAvailable")) {
      message = "Trash is not available on this system.";
      code = "TRASH_UNAVAILABLE";
    } else if (error.includes("FilenameCollision")) {
      message = "A note with this timestamp already exists. Try again.";
      code = "COLLISION";
    } else {
      message = error;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  const appError: AppError = {
    id: ++errorId,
    message,
    code,
    timestamp: Date.now(),
  };

  errors.update((list) => [...list, appError]);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    errors.update((list) => list.filter((e) => e.id !== appError.id));
  }, 5000);
}

export function dismissError(id: number): void {
  errors.update((list) => list.filter((e) => e.id !== id));
}
