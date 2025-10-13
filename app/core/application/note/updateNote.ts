import type { Note } from "@/core/domain/note/entity";
import { updateNoteBody } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";
import { syncNoteTags } from "../tag/syncNoteTags";

export type UpdateNoteInput = {
  id: NoteId;
  body: string;
};

export async function updateNote(
  context: Context,
  input: UpdateNoteInput,
): Promise<Note> {
  // Find existing note
  const existingNote = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.noteRepository.findById(input.id);
    },
  );

  if (!existingNote) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Note not found");
  }

  // Sync tags
  const tags = await syncNoteTags(context, {
    noteId: input.id,
    content: input.body,
  });

  // Update note
  const updatedNote = updateNoteBody(existingNote, {
    body: input.body,
    tags,
  });

  // Save updated note
  const savedNote = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.noteRepository.update(updatedNote);
    },
  );

  return savedNote;
}
