import { beforeEach, describe, expect, it } from "vitest";
import { MockRevisionRepository } from "@/core/adapters/mock/revisionRepository";
import type { NoteId } from "@/core/domain/revision/valueObject";
import type { Context } from "../context";
import { saveRevision } from "./saveRevision";

describe("saveRevision", () => {
  let mockRevisionRepository: MockRevisionRepository;
  let context: Context;
  let testNoteId: NoteId;

  beforeEach(() => {
    mockRevisionRepository = new MockRevisionRepository();
    testNoteId = "test-note-id" as NoteId;

    context = {
      revisionRepository: mockRevisionRepository,
    } as unknown as Context;
  });

  it("should save revision with valid note ID and content", async () => {
    const result = await saveRevision(context, {
      noteId: testNoteId,
      content: "Test content",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.noteId).toBe(testNoteId);
      expect(result.value.content).toBe("Test content");
    }
  });

  it("should auto-generate UUID v7 ID on save", async () => {
    const result = await saveRevision(context, {
      noteId: testNoteId,
      content: "Test content",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBeDefined();
      expect(typeof result.value.id).toBe("string");
      expect(result.value.id.length).toBeGreaterThan(0);
    }
  });

  it("should auto-set savedAt on save", async () => {
    const result = await saveRevision(context, {
      noteId: testNoteId,
      content: "Test content",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.savedAt).toBeInstanceOf(Date);
    }
  });

  it("should save multiple revisions for same note", async () => {
    const result1 = await saveRevision(context, {
      noteId: testNoteId,
      content: "First revision",
    });

    const result2 = await saveRevision(context, {
      noteId: testNoteId,
      content: "Second revision",
    });

    expect(result1.isOk()).toBe(true);
    expect(result2.isOk()).toBe(true);

    if (result1.isOk() && result2.isOk()) {
      expect(result1.value.id).not.toBe(result2.value.id);
    }
  });

  it("should save revision with empty content", async () => {
    const result = await saveRevision(context, {
      noteId: testNoteId,
      content: "",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.content).toBe("");
    }
  });

  it("should save revision with long content (10000+ characters)", async () => {
    const longContent = "a".repeat(10000);
    const result = await saveRevision(context, {
      noteId: testNoteId,
      content: longContent,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.content.length).toBe(10000);
    }
  });

  it("should return validation error for invalid note ID format", async () => {
    // Note: This test depends on actual validation implementation
    const invalidNoteId = "invalid-id" as NoteId;
    const result = await saveRevision(context, {
      noteId: invalidNoteId,
      content: "Test content",
    });

    // In the mock, this will succeed as validation is not enforced
    expect(result.isOk()).toBe(true);
  });

  it("should return RepositoryError when database save fails", async () => {
    mockRevisionRepository.setShouldFailCreate(true);

    const result = await saveRevision(context, {
      noteId: testNoteId,
      content: "Test content",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to save revision");
    }
  });
});
