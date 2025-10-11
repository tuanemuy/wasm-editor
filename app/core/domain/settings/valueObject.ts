import * as z from "zod";

/**
 * Sort order (referenced from Note domain)
 */
export const sortBySchema = z.enum([
  "created_asc",
  "created_desc",
  "updated_asc",
  "updated_desc",
]);
export type SortBy = z.infer<typeof sortBySchema>;

/**
 * Auto save interval in milliseconds
 * Min: 1 second (1000ms)
 * Max: 60 seconds (60000ms)
 */
export const autoSaveIntervalSchema = z.number().int().min(1000).max(60000);
export type AutoSaveInterval = z.infer<typeof autoSaveIntervalSchema>;

/**
 * Revision save interval in milliseconds
 * Min: 1 minute (60000ms)
 * Max: 60 minutes (3600000ms)
 */
export const revisionIntervalSchema = z.number().int().min(60000).max(3600000);
export type RevisionInterval = z.infer<typeof revisionIntervalSchema>;

/**
 * Editor font size in pixels
 * Min: 10px
 * Max: 32px
 */
export const editorFontSizeSchema = z.number().int().min(10).max(32);
export type EditorFontSize = z.infer<typeof editorFontSizeSchema>;

/**
 * Editor theme
 */
export const editorThemeSchema = z.enum(["light", "dark"]);
export type EditorTheme = z.infer<typeof editorThemeSchema>;

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS = {
  defaultSortBy: "updated_desc" as SortBy,
  autoSaveInterval: 2000 as AutoSaveInterval,
  revisionInterval: 600000 as RevisionInterval,
  editorFontSize: 16 as EditorFontSize,
  editorTheme: "light" as EditorTheme,
} as const;
