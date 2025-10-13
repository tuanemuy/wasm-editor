import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type ShouldCreateAutoRevisionInput = {
  noteId: NoteId;
  autoSaveInterval: number; // in minutes
};

export async function shouldCreateAutoRevision(
  context: Context,
  input: ShouldCreateAutoRevisionInput,
): Promise<boolean> {
  const latestRevision = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.revisionRepository.findLatestByNoteId(
        input.noteId,
      );
    },
  );

  // No revision exists, should create
  if (!latestRevision) {
    return true;
  }

  // Calculate time difference
  const now = new Date();
  const lastRevisionTime = latestRevision.createdAt;
  const diffInMinutes =
    (now.getTime() - lastRevisionTime.getTime()) / (1000 * 60);

  // Should create if interval exceeded
  return diffInMinutes >= input.autoSaveInterval;
}
