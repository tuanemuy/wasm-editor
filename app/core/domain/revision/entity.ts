import type { Result } from "neverthrow";
import * as z from "zod";
import { type ValidationError, validate } from "@/lib/validation";
import {
  generateRevisionId,
  type NoteContent,
  type NoteId,
  noteContentSchema,
  noteIdSchema,
  type RevisionId,
  revisionIdSchema,
} from "./valueObject";

/**
 * Revision entity
 */
export type Revision = Readonly<{
  id: RevisionId;
  noteId: NoteId;
  content: NoteContent;
  savedAt: Date;
}>;

/**
 * Parameters for creating a new revision
 */
export type CreateRevisionParams = {
  noteId: NoteId;
  content: NoteContent;
};

/**
 * Raw revision data from database
 */
export type RawRevisionData = {
  id: string;
  noteId: string;
  content: string;
  savedAt: Date;
};

/**
 * Create a new revision
 */
export function createRevision(
  params: CreateRevisionParams,
): Result<Revision, ValidationError> {
  return validate(
    z.object({
      noteId: noteIdSchema,
      content: noteContentSchema,
    }),
    params,
  ).map((validated) => {
    return {
      id: generateRevisionId(),
      noteId: validated.noteId,
      content: validated.content,
      savedAt: new Date(),
    } satisfies Revision;
  });
}

/**
 * Reconstruct revision from raw data
 */
export function reconstructRevision(
  data: RawRevisionData,
): Result<Revision, ValidationError> {
  return validate(
    z.object({
      id: revisionIdSchema,
      noteId: noteIdSchema,
      content: noteContentSchema,
      savedAt: z.date(),
    }),
    data,
  );
}
