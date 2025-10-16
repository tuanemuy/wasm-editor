/**
 * UI-related type definitions
 */

import type { SortField, SortOrder } from "@/lib/sort-utils";

/**
 * Save status for auto-save functionality
 */
export type SaveStatus = "saved" | "saving" | "unsaved";

/**
 * Dialog state
 */
export interface DialogState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Re-export sort types for convenience
 */
export type { SortField, SortOrder };
