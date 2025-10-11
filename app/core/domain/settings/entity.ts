import type { Result } from "neverthrow";
import * as z from "zod";
import { type ValidationError, validate } from "@/lib/validation";
import {
  type AutoSaveInterval,
  autoSaveIntervalSchema,
  DEFAULT_SETTINGS,
  type EditorFontSize,
  type EditorTheme,
  editorFontSizeSchema,
  editorThemeSchema,
  type RevisionInterval,
  revisionIntervalSchema,
  type SortBy,
  sortBySchema,
} from "./valueObject";

/**
 * Settings entity
 */
export type Settings = Readonly<{
  defaultSortBy: SortBy;
  autoSaveInterval: AutoSaveInterval;
  revisionInterval: RevisionInterval;
  editorFontSize: EditorFontSize;
  editorTheme: EditorTheme;
  updatedAt: Date;
}>;

/**
 * Partial settings updates
 */
export type SettingsUpdates = Partial<{
  defaultSortBy: SortBy;
  autoSaveInterval: AutoSaveInterval;
  revisionInterval: RevisionInterval;
  editorFontSize: EditorFontSize;
  editorTheme: EditorTheme;
}>;

/**
 * Raw settings data from database
 */
export type RawSettingsData = {
  defaultSortBy: string;
  autoSaveInterval: number;
  revisionInterval: number;
  editorFontSize: number;
  editorTheme: string;
  updatedAt: Date;
};

/**
 * Create default settings
 */
export function createDefaultSettings(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    updatedAt: new Date(),
  };
}

/**
 * Reconstruct settings from raw data
 */
export function reconstructSettings(
  data: RawSettingsData,
): Result<Settings, ValidationError> {
  return validate(
    z.object({
      defaultSortBy: sortBySchema,
      autoSaveInterval: autoSaveIntervalSchema,
      revisionInterval: revisionIntervalSchema,
      editorFontSize: editorFontSizeSchema,
      editorTheme: editorThemeSchema,
      updatedAt: z.date(),
    }),
    data,
  );
}

/**
 * Update settings with partial updates
 */
export function updateSettings(
  settings: Settings,
  updates: SettingsUpdates,
): Result<Settings, ValidationError> {
  const updated = {
    ...settings,
    ...updates,
    updatedAt: new Date(),
  };

  return validate(
    z.object({
      defaultSortBy: sortBySchema,
      autoSaveInterval: autoSaveIntervalSchema,
      revisionInterval: revisionIntervalSchema,
      editorFontSize: editorFontSizeSchema,
      editorTheme: editorThemeSchema,
      updatedAt: z.date(),
    }),
    updated,
  );
}
