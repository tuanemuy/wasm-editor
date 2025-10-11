import type { Result } from "neverthrow";
import * as z from "zod";
import { type ValidationError, validate } from "@/lib/validation";
import {
  generateNoteId,
  type NoteContent,
  type NoteId,
  noteContentSchema,
  noteIdSchema,
  type TagName,
  tagNameSchema,
} from "./valueObject";

/**
 * Note entity
 */
export type Note = Readonly<{
  id: NoteId;
  content: NoteContent;
  tags: TagName[];
  createdAt: Date;
  updatedAt: Date;
}>;

/**
 * Parameters for creating a new note
 */
export type CreateNoteParams = {
  content: NoteContent;
};

/**
 * Raw note data from database
 */
export type RawNoteData = {
  id: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Create a new note
 */
export function createNote(
  params: CreateNoteParams,
): Result<Note, ValidationError> {
  return validate(
    z.object({
      content: noteContentSchema,
    }),
    params,
  ).map((validated) => {
    const now = new Date();
    return {
      id: generateNoteId(),
      content: validated.content,
      tags: [],
      createdAt: now,
      updatedAt: now,
    } satisfies Note;
  });
}

/**
 * Reconstruct note from raw data
 */
export function reconstructNote(
  data: RawNoteData,
): Result<Note, ValidationError> {
  return validate(
    z.object({
      id: noteIdSchema,
      content: noteContentSchema,
      tags: z.array(tagNameSchema),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
    data,
  );
}

/**
 * Update note content and re-extract tags
 */
export function updateNoteContent(
  note: Note,
  newContent: NoteContent,
): Result<Note, ValidationError> {
  return validate(noteContentSchema, newContent).map((validated) => {
    const tags = extractTagsFromContent(validated);
    return {
      ...note,
      content: validated,
      tags,
      updatedAt: new Date(),
    } satisfies Note;
  });
}

/**
 * Extract tags from note content
 * Tags are in the format: #tagName
 */
export function extractTagsFromContent(content: NoteContent): TagName[] {
  // Extract tags in the format: #tagName
  const tagRegex = /#([a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\-_]+)/g;
  const matches = content.matchAll(tagRegex);
  const tags = new Set<string>();

  for (const match of matches) {
    const tag = match[1];
    if (tag) {
      // Validate tag
      const result = tagNameSchema.safeParse(tag);
      if (result.success) {
        tags.add(result.data);
      }
    }
  }

  return Array.from(tags);
}

/**
 * Tag entity
 */
export type Tag = Readonly<{
  name: TagName;
  usageCount: number;
}>;

/**
 * Raw tag data from database
 */
export type RawTagData = {
  name: string;
  usageCount: number;
};

/**
 * Reconstruct tag from raw data
 */
export function reconstructTag(data: RawTagData): Result<Tag, ValidationError> {
  return validate(
    z.object({
      name: tagNameSchema,
      usageCount: z.number().int().nonnegative(),
    }),
    data,
  );
}
