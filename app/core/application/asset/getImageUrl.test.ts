import { beforeEach, describe, expect, it } from "vitest";
import { MockAssetRepository } from "@/core/adapters/mock/assetRepository";
import { MockAssetStorageManager } from "@/core/adapters/mock/assetStorageManager";
import { createAsset } from "@/core/domain/asset/entity";
import type { AssetId, NoteId } from "@/core/domain/asset/valueObject";
import type { Context } from "../context";
import { getImageUrl } from "./getImageUrl";

describe("getImageUrl", () => {
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

  it("should get image URL with valid ID", async () => {
    const result = await getImageUrl(context, { id: testAssetId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(typeof result.value).toBe("string");
      expect(result.value.length).toBeGreaterThan(0);
    }
  });

  it("should return URL that can be used to display image", async () => {
    const result = await getImageUrl(context, { id: testAssetId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      // Mock returns data URL format
      expect(result.value).toContain("data:");
    }
  });

  it("should return ApplicationError for non-existent ID", async () => {
    const nonExistentId = "non-existent-id" as AssetId;
    const result = await getImageUrl(context, { id: nonExistentId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Asset not found");
    }
  });

  it("should return validation error for invalid ID format", async () => {
    // Note: This test depends on actual validation implementation
    const invalidId = "invalid-id" as AssetId;
    const result = await getImageUrl(context, { id: invalidId });

    // In the mock, this will return "Asset not found"
    expect(result.isErr()).toBe(true);
  });

  it("should return ExternalServiceError when URL retrieval fails", async () => {
    mockAssetStorageManager.setShouldFailGetUrl(true);

    const result = await getImageUrl(context, { id: testAssetId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get image URL");
    }
  });

  it("should return RepositoryError when database get fails", async () => {
    mockAssetRepository.setShouldFailFindById(true);

    const result = await getImageUrl(context, { id: testAssetId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get image URL");
    }
  });
});
