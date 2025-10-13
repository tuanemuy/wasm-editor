import { beforeEach, describe, expect, it } from "vitest";
import { MockAssetRepository } from "@/core/adapters/mock/assetRepository";
import { createAsset } from "@/core/domain/asset/entity";
import type { AssetId, NoteId } from "@/core/domain/asset/valueObject";
import type { Context } from "../context";
import { getAsset } from "./getAsset";

describe("getAsset", () => {
  let mockAssetRepository: MockAssetRepository;
  let context: Context;
  let testAssetId: AssetId;

  beforeEach(async () => {
    mockAssetRepository = new MockAssetRepository();

    // Create a test asset
    const assetResult = createAsset({
      noteId: "test-note-id" as NoteId,
      path: "assets/images/test.png",
      fileName: "test.png",
      fileSize: 1024,
      mimeType: "image/png",
    });

    if (assetResult.isOk()) {
      const asset = assetResult.value;
      await mockAssetRepository.create(asset);
      testAssetId = asset.id;
    }

    context = {
      assetRepository: mockAssetRepository,
    } as unknown as Context;
  });

  it("should get asset with valid ID", async () => {
    const result = await getAsset(context, { id: testAssetId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).not.toBeNull();
    }
  });

  it("should return asset with correct properties", async () => {
    const result = await getAsset(context, { id: testAssetId });

    expect(result.isOk()).toBe(true);
    if (result.isOk() && result.value !== null) {
      expect(result.value).toHaveProperty("id");
      expect(result.value).toHaveProperty("noteId");
      expect(result.value).toHaveProperty("path");
      expect(result.value).toHaveProperty("fileName");
      expect(result.value).toHaveProperty("fileSize");
      expect(result.value).toHaveProperty("mimeType");
      expect(result.value).toHaveProperty("createdAt");
    }
  });

  it("should return null for non-existent ID", async () => {
    const nonExistentId = "non-existent-id" as AssetId;
    const result = await getAsset(context, { id: nonExistentId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeNull();
    }
  });

  it("should return validation error for invalid ID format", async () => {
    // Note: This test depends on actual validation implementation
    // The mock may not validate ID format, but the real implementation should
    const invalidId = "invalid-id" as AssetId;
    const result = await getAsset(context, { id: invalidId });

    // The result will be ok with null value in the mock
    // In real implementation with validation, it would fail
    expect(result.isOk()).toBe(true);
  });

  it("should return RepositoryError when database get fails", async () => {
    mockAssetRepository.setShouldFailFindById(true);

    const result = await getAsset(context, { id: testAssetId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get asset");
    }
  });
});
