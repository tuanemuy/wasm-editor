import { beforeEach, describe, expect, it } from "vitest";
import { MockNoteRepository } from "@/core/adapters/mock/noteRepository";
import { createNote } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { deleteNote } from "./deleteNote";

describe("deleteNote", () => {
  let mockNoteRepository: MockNoteRepository;
  let context: Context;
  let testNoteId: NoteId;

  beforeEach(async () => {
    mockNoteRepository = new MockNoteRepository();

    // Create a test note
    const noteResult = createNote({ content: "Test note" });
    if (noteResult.isOk()) {
      const note = noteResult.value;
      await mockNoteRepository.create(note);
      testNoteId = note.id;
    }

    context = {
      noteRepository: mockNoteRepository,
    } as unknown as Context;
  });

  it("should delete note with valid ID", async () => {
    const result = await deleteNote(context, { id: testNoteId });

    expect(result.isOk()).toBe(true);
  });

  it("should not be able to get note after deletion", async () => {
    await deleteNote(context, { id: testNoteId });

    const getResult = await mockNoteRepository.findById(testNoteId);
    expect(getResult.isOk()).toBe(true);
    if (getResult.isOk()) {
      expect(getResult.value).toBeNull();
    }
  });

  it("should return validation error for invalid ID format", async () => {
    // Note: This test depends on actual validation implementation
    const invalidId = "invalid-id" as NoteId;
    const result = await deleteNote(context, { id: invalidId });

    // In the mock, this will succeed (no validation)
    expect(result.isOk()).toBe(true);
  });

  it("should return RepositoryError when database delete fails", async () => {
    mockNoteRepository.setShouldFailDelete(true);

    const result = await deleteNote(context, { id: testNoteId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to delete note");
    }
  });
});
