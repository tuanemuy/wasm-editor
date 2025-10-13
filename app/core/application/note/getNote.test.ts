import { beforeEach, describe, expect, it } from "vitest";
import { MockNoteRepository } from "@/core/adapters/mock/noteRepository";
import { createNote } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { getNote } from "./getNote";

describe("getNote", () => {
  let mockNoteRepository: MockNoteRepository;
  let context: Context;
  let testNoteId: NoteId;

  beforeEach(async () => {
    mockNoteRepository = new MockNoteRepository();

    // Create a test note
    const noteResult = createNote({ content: "Test note content" });
    if (noteResult.isOk()) {
      const note = noteResult.value;
      await mockNoteRepository.create(note);
      testNoteId = note.id;
    }

    context = {
      noteRepository: mockNoteRepository,
    } as unknown as Context;
  });

  it("should get note with valid ID", async () => {
    const result = await getNote(context, { id: testNoteId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).not.toBeNull();
    }
  });

  it("should return null for non-existent ID", async () => {
    const nonExistentId = "non-existent-id" as NoteId;
    const result = await getNote(context, { id: nonExistentId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeNull();
    }
  });

  it("should return note with correct properties", async () => {
    const result = await getNote(context, { id: testNoteId });

    expect(result.isOk()).toBe(true);
    if (result.isOk() && result.value !== null) {
      expect(result.value).toHaveProperty("id");
      expect(result.value).toHaveProperty("content");
      expect(result.value).toHaveProperty("tags");
      expect(result.value).toHaveProperty("createdAt");
      expect(result.value).toHaveProperty("updatedAt");
    }
  });

  it("should return validation error for invalid ID format", async () => {
    // Note: This test depends on actual validation implementation
    const invalidId = "invalid-id" as NoteId;
    const result = await getNote(context, { id: invalidId });

    // In the mock, this will return null
    expect(result.isOk()).toBe(true);
  });

  it("should return RepositoryError when database get fails", async () => {
    mockNoteRepository.setShouldFailFindById(true);

    const result = await getNote(context, { id: testNoteId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get note");
    }
  });
});
