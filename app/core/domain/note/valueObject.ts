import { v7 as uuidv7 } from "uuid";
import * as z from "zod";

/**
 * Note ID (UUID v7)
 */
export const noteIdSchema = z.string().uuid().brand<"NoteId">();
export type NoteId = z.infer<typeof noteIdSchema>;

export function generateNoteId(): NoteId {
  return uuidv7() as NoteId;
}

/**
 * Note content (Markdown format)
 */
export const noteContentSchema = z.string();
export type NoteContent = z.infer<typeof noteContentSchema>;

/**
 * Tag name
 * - 1-50 characters
 * - Alphanumeric, hiragana, katakana, kanji, hyphen, underscore only
 */
export const tagNameSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\-_]+$/);
export type TagName = z.infer<typeof tagNameSchema>;

/**
 * Sort order for notes
 */
export const sortBySchema = z.enum([
  "created_asc",
  "created_desc",
  "updated_asc",
  "updated_desc",
]);
export type SortBy = z.infer<typeof sortBySchema>;
