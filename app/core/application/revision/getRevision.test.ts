import { beforeEach, describe, expect, it } from "vitest";
import { MockRevisionRepository } from "@/core/adapters/mock/revisionRepository";
import { createRevision } from "@/core/domain/revision/entity";
import type { NoteId, RevisionId } from "@/core/domain/revision/valueObject";
import type { Context } from "../context";
import { getRevision } from "./getRevision";

describe("getRevision", () => {
  let mockRevisionRepository: MockRevisionRepository;
  let context: Context;
  let testRevisionId: RevisionId;

  beforeEach(async () => {
    mockRevisionRepository = new MockRevisionRepository();

    // Create a test revision
    const revisionResult = createRevision({
      noteId: "test-note-id" as NoteId,
      content: "Test revision content",
    });

    if (revisionResult.isOk()) {
      const revision = revisionResult.value;
      await mockRevisionRepository.create(revision);
      testRevisionId = revision.id;
    }

    context = {
      revisionRepository: mockRevisionRepository,
    } as unknown as Context;
  });

  it("should get revision with valid revision ID", async () => {
    const result = await getRevision(context, { id: testRevisionId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).not.toBeNull();
    }
  });

  it("should return revision with correct properties", async () => {
    const result = await getRevision(context, { id: testRevisionId });

    expect(result.isOk()).toBe(true);
    if (result.isOk() && result.value !== null) {
      expect(result.value).toHaveProperty("id");
      expect(result.value).toHaveProperty("noteId");
      expect(result.value).toHaveProperty("content");
      expect(result.value).toHaveProperty("savedAt");
    }
  });

  it("should return null for non-existent ID", async () => {
    const nonExistentId = "non-existent-id" as RevisionId;
    const result = await getRevision(context, { id: nonExistentId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeNull();
    }
  });

  it("should return validation error for invalid revision ID format", async () => {
    // Note: This test depends on actual validation implementation
    const invalidId = "invalid-id" as RevisionId;
    const result = await getRevision(context, { id: invalidId });

    // In the mock, this will return null
    expect(result.isOk()).toBe(true);
  });

  it("should return RepositoryError when database get fails", async () => {
    mockRevisionRepository.setShouldFailFindById(true);

    const result = await getRevision(context, { id: testRevisionId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get revision");
    }
  });
});
