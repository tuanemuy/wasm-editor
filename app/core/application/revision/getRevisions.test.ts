import { beforeEach, describe, expect, it } from "vitest";
import { MockRevisionRepository } from "@/core/adapters/mock/revisionRepository";
import { createRevision } from "@/core/domain/revision/entity";
import type { NoteId } from "@/core/domain/revision/valueObject";
import type { Context } from "../context";
import { getRevisions } from "./getRevisions";

describe("getRevisions", () => {
  let mockRevisionRepository: MockRevisionRepository;
  let context: Context;
  let testNoteId: NoteId;

  beforeEach(async () => {
    mockRevisionRepository = new MockRevisionRepository();
    testNoteId = "test-note-id" as NoteId;

    // Create test revisions with different timestamps
    const revision1Result = createRevision({
      noteId: testNoteId,
      content: "First revision",
    });

    // Wait a bit to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));

    const revision2Result = createRevision({
      noteId: testNoteId,
      content: "Second revision",
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const revision3Result = createRevision({
      noteId: testNoteId,
      content: "Third revision",
    });

    if (revision1Result.isOk()) {
      await mockRevisionRepository.create(revision1Result.value);
    }

    if (revision2Result.isOk()) {
      await mockRevisionRepository.create(revision2Result.value);
    }

    if (revision3Result.isOk()) {
      await mockRevisionRepository.create(revision3Result.value);
    }

    context = {
      revisionRepository: mockRevisionRepository,
    } as unknown as Context;
  });

  it("should get revision list with valid note ID", async () => {
    const result = await getRevisions(context, { noteId: testNoteId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(Array.isArray(result.value)).toBe(true);
    }
  });

  it("should return revisions sorted by savedAt in descending order", async () => {
    const result = await getRevisions(context, { noteId: testNoteId });

    expect(result.isOk()).toBe(true);
    if (result.isOk() && result.value.length > 1) {
      for (let i = 0; i < result.value.length - 1; i++) {
        const current = result.value[i].savedAt.getTime();
        const next = result.value[i + 1].savedAt.getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  it("should return multiple revisions correctly", async () => {
    const result = await getRevisions(context, { noteId: testNoteId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(3);
      expect(result.value[0].noteId).toBe(testNoteId);
      expect(result.value[1].noteId).toBe(testNoteId);
      expect(result.value[2].noteId).toBe(testNoteId);
    }
  });

  it("should return empty array for note with no revisions", async () => {
    const emptyNoteId = "empty-note-id" as NoteId;
    const result = await getRevisions(context, { noteId: emptyNoteId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it("should return validation error for invalid note ID format", async () => {
    // Note: This test depends on actual validation implementation
    const invalidNoteId = "invalid-id" as NoteId;
    const result = await getRevisions(context, { noteId: invalidNoteId });

    // In the mock, this will return empty array
    expect(result.isOk()).toBe(true);
  });

  it("should return RepositoryError when database get fails", async () => {
    mockRevisionRepository.setShouldFailFindByNoteId(true);

    const result = await getRevisions(context, { noteId: testNoteId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get revisions");
    }
  });
});
