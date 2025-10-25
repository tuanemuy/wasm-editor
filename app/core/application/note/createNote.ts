/**
 * Create Note Use Case
 *
 * Creates a new note with the provided content.
 */

import type { Note } from "@/core/domain/note/entity";
import { createNote as createNoteEntity } from "@/core/domain/note/entity";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type CreateNoteInput = {
  content: StructuredContent;
  text: string;
};

export async function createNote(
  context: Context,
  input: CreateNoteInput,
): Promise<Note> {
  // Create note entity (validates content and text)
  const note = createNoteEntity({
    content: input.content,
    text: input.text,
  });

  // Save note to repository
  await context.unitOfWorkProvider.run(async (repositories) => {
    await repositories.noteRepository.save(note);
  });

  return note;
}
