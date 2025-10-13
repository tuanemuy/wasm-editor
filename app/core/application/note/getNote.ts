/**
 * Get Note Use Case
 *
 * Retrieves a single note by ID.
 */
import type { Note } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type GetNoteInput = {
  id: NoteId;
};

export async function getNote(
  context: Context,
  input: GetNoteInput,
): Promise<Note> {
  return context.unitOfWorkProvider.run(async (repositories) => {
    // Find note (will throw NotFoundError if not found)
    return await repositories.noteRepository.findById(input.id);
  });
}
