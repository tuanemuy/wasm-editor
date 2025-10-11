import { v7 as uuidv7 } from "uuid";
import * as z from "zod";

/**
 * Revision ID (UUID v7)
 */
export const revisionIdSchema = z.string().uuid().brand<"RevisionId">();
export type RevisionId = z.infer<typeof revisionIdSchema>;

export function generateRevisionId(): RevisionId {
  return uuidv7() as RevisionId;
}

/**
 * Note ID (referenced from Note domain)
 */
export const noteIdSchema = z.string().uuid().brand<"NoteId">();
export type NoteId = z.infer<typeof noteIdSchema>;

/**
 * Note content (referenced from Note domain)
 */
export const noteContentSchema = z.string();
export type NoteContent = z.infer<typeof noteContentSchema>;
