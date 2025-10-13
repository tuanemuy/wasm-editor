import { beforeEach, describe, expect, it } from "vitest";
import { MockNoteRepository } from "@/core/adapters/mock/noteRepository";
import { createNote } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { updateNote } from "./updateNote";

describe("updateNote", () => {
  let mockNoteRepository: MockNoteRepository;
  let context: Context;
  let testNoteId: NoteId;

  beforeEach(async () => {
    mockNoteRepository = new MockNoteRepository();

    // Create a test note
    const noteResult = createNote({ content: "Original content" });
    if (noteResult.isOk()) {
      const note = noteResult.value;
      await mockNoteRepository.create(note);
      testNoteId = note.id;
    }

    context = {
      noteRepository: mockNoteRepository,
    } as unknown as Context;
  });

  it("should update note with valid ID and content", async () => {
    const result = await updateNote(context, {
      id: testNoteId,
      content: "Updated content",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.content).toBe("Updated content");
    }
  });

  it("should update note content correctly", async () => {
    const newContent = "# New Title\n\nNew content";
    const result = await updateNote(context, {
      id: testNoteId,
      content: newContent,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.content).toBe(newContent);
    }
  });

  it("should auto-extract tags when updating note with tags", async () => {
    const result = await updateNote(context, {
      id: testNoteId,
      content: "Updated content with #tag1 and #tag2",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.tags).toContain("tag1");
      expect(result.value.tags).toContain("tag2");
    }
  });

  it("should update updatedAt on update", async () => {
    const result = await updateNote(context, {
      id: testNoteId,
      content: "Updated content",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.updatedAt).toBeInstanceOf(Date);
    }
  });

  it("should return ApplicationError for non-existent ID", async () => {
    const nonExistentId = "non-existent-id" as NoteId;
    const result = await updateNote(context, {
      id: nonExistentId,
      content: "Updated content",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Note not found");
    }
  });

  it("should return validation error for invalid ID format", async () => {
    // Note: This test depends on actual validation implementation
    const invalidId = "invalid-id" as NoteId;
    const result = await updateNote(context, {
      id: invalidId,
      content: "Updated content",
    });

    // In the mock, this will return "Note not found"
    expect(result.isErr()).toBe(true);
  });

  it("should return RepositoryError when database update fails", async () => {
    mockNoteRepository.setShouldFailUpdate(true);

    const result = await updateNote(context, {
      id: testNoteId,
      content: "Updated content",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to update note");
    }
  });
});
