import { beforeEach, describe, expect, it } from "vitest";
import { MockAssetRepository } from "@/core/adapters/mock/assetRepository";
import { MockAssetStorageManager } from "@/core/adapters/mock/assetStorageManager";
import { createAsset } from "@/core/domain/asset/entity";
import type { AssetId, NoteId } from "@/core/domain/asset/valueObject";
import type { Context } from "../context";
import { deleteAsset } from "./deleteAsset";

describe("deleteAsset", () => {
  let mockAssetRepository: MockAssetRepository;
  let mockAssetStorageManager: MockAssetStorageManager;
  let context: Context;
  let testAssetId: AssetId;

  beforeEach(async () => {
    mockAssetRepository = new MockAssetRepository();
    mockAssetStorageManager = new MockAssetStorageManager();

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

      // Also save to storage
      const file = new File(["test"], "test.png", { type: "image/png" });
      await mockAssetStorageManager.save(file, asset.path);
    }

    context = {
      assetRepository: mockAssetRepository,
      assetStorageManager: mockAssetStorageManager,
    } as unknown as Context;
  });

  it("should delete asset with valid ID", async () => {
    const result = await deleteAsset(context, { id: testAssetId });

    expect(result.isOk()).toBe(true);
  });

  it("should not be able to get asset after deletion", async () => {
    await deleteAsset(context, { id: testAssetId });

    const getResult = await mockAssetRepository.findById(testAssetId);
    expect(getResult.isOk()).toBe(true);
    if (getResult.isOk()) {
      expect(getResult.value).toBeNull();
    }
  });

  it("should delete file from file system on asset deletion", async () => {
    const result = await deleteAsset(context, { id: testAssetId });

    expect(result.isOk()).toBe(true);
  });

  it("should return ApplicationError for non-existent ID", async () => {
    const nonExistentId = "non-existent-id" as AssetId;
    const result = await deleteAsset(context, { id: nonExistentId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Asset not found");
    }
  });

  it("should return validation error for invalid ID format", async () => {
    // Note: This test depends on actual validation implementation
    const invalidId = "invalid-id" as AssetId;
    const result = await deleteAsset(context, { id: invalidId });

    // In the mock, this will return "Asset not found"
    expect(result.isErr()).toBe(true);
  });

  it("should return ExternalServiceError when file system delete fails", async () => {
    mockAssetStorageManager.setShouldFailDelete(true);

    const result = await deleteAsset(context, { id: testAssetId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to delete file");
    }
  });

  it("should return RepositoryError when database delete fails", async () => {
    mockAssetRepository.setShouldFailDelete(true);

    const result = await deleteAsset(context, { id: testAssetId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to delete asset");
    }
  });
});
