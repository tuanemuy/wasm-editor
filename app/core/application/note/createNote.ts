import type { Note } from "@/core/domain/note/entity";
import { createNote as createNoteEntity } from "@/core/domain/note/entity";
import type { Context } from "../context";
import { extractTagsFromContent } from "../tag/extractTagsFromContent";
import { syncNoteTags } from "../tag/syncNoteTags";

export type CreateNoteInput = {
  body?: string;
};

export async function createNote(
  context: Context,
  input: CreateNoteInput,
): Promise<Note> {
  const note = createNoteEntity({ body: input.body });

  // Extract tags from content and sync with note
  const _tagNames = extractTagsFromContent(note.body);
  const tags = await syncNoteTags(context, {
    noteId: note.id,
    content: note.body,
  });

  // Save note with tags
  const savedNote = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.noteRepository.create({
        ...note,
        tags,
      });
    },
  );

  return savedNote;
}
