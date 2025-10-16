/**
 * URL parameter type definitions
 */

import type { SortField, SortOrder } from "@/lib/sort-utils";

/**
 * Home page search parameters
 */
export interface HomeSearchParams {
  q?: string; // Search query
  order_by?: SortField; // Sort field
  order?: SortOrder; // Sort order
  tags?: string; // Comma-separated tag IDs
}

/**
 * Memo detail page search parameters
 * Reserved for future use (e.g., editing mode, preview mode)
 */
export type MemoSearchParams = Record<string, never>;

/**
 * Settings page search parameters
 * Reserved for future use (e.g., section anchor)
 */
export type SettingsSearchParams = Record<string, never>;
