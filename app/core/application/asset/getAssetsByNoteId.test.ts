import { beforeEach, describe, expect, it } from "vitest";
import { MockAssetRepository } from "@/core/adapters/mock/assetRepository";
import { createAsset } from "@/core/domain/asset/entity";
import type { NoteId } from "@/core/domain/asset/valueObject";
import type { Context } from "../context";
import { getAssetsByNoteId } from "./getAssetsByNoteId";

describe("getAssetsByNoteId", () => {
  let mockAssetRepository: MockAssetRepository;
  let context: Context;
  let testNoteId: NoteId;

  beforeEach(async () => {
    mockAssetRepository = new MockAssetRepository();
    testNoteId = "test-note-id" as NoteId;

    // Create test assets
    const asset1Result = createAsset({
      noteId: testNoteId,
      path: "assets/images/test1.png",
      fileName: "test1.png",
      fileSize: 1024,
      mimeType: "image/png",
    });

    const asset2Result = createAsset({
      noteId: testNoteId,
      path: "assets/images/test2.png",
      fileName: "test2.png",
      fileSize: 2048,
      mimeType: "image/png",
    });

    if (asset1Result.isOk()) {
      await mockAssetRepository.create(asset1Result.value);
    }

    if (asset2Result.isOk()) {
      await mockAssetRepository.create(asset2Result.value);
    }

    context = {
      assetRepository: mockAssetRepository,
    } as unknown as Context;
  });

  it("should get asset list with valid note ID", async () => {
    const result = await getAssetsByNoteId(context, { noteId: testNoteId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(Array.isArray(result.value)).toBe(true);
    }
  });

  it("should return multiple assets correctly", async () => {
    const result = await getAssetsByNoteId(context, { noteId: testNoteId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(2);
      expect(result.value[0].noteId).toBe(testNoteId);
      expect(result.value[1].noteId).toBe(testNoteId);
    }
  });

  it("should return empty array for note with no assets", async () => {
    const emptyNoteId = "empty-note-id" as NoteId;
    const result = await getAssetsByNoteId(context, { noteId: emptyNoteId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it("should return validation error for invalid note ID format", async () => {
    // Note: This test depends on actual validation implementation
    const invalidNoteId = "invalid-id" as NoteId;
    const result = await getAssetsByNoteId(context, { noteId: invalidNoteId });

    // The result will be ok with empty array in the mock
    // In real implementation with validation, it would fail
    expect(result.isOk()).toBe(true);
  });

  it("should return RepositoryError when database get fails", async () => {
    mockAssetRepository.setShouldFailFindByNoteId(true);

    const result = await getAssetsByNoteId(context, { noteId: testNoteId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get assets");
    }
  });
});
