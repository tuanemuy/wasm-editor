import { beforeEach, describe, expect, it } from "vitest";
import { MockAssetRepository } from "@/core/adapters/mock/assetRepository";
import { MockAssetStorageManager } from "@/core/adapters/mock/assetStorageManager";
import { MockNoteRepository } from "@/core/adapters/mock/noteRepository";
import type { NoteId } from "@/core/domain/asset/valueObject";
import { MAX_FILE_SIZE } from "@/core/domain/asset/valueObject";
import { createNote } from "@/core/domain/note/entity";
import type { Context } from "../context";
import { uploadImage } from "./uploadImage";

describe("uploadImage", () => {
  let mockAssetRepository: MockAssetRepository;
  let mockAssetStorageManager: MockAssetStorageManager;
  let mockNoteRepository: MockNoteRepository;
  let context: Context;
  let testNoteId: NoteId;

  beforeEach(async () => {
    mockAssetRepository = new MockAssetRepository();
    mockAssetStorageManager = new MockAssetStorageManager();
    mockNoteRepository = new MockNoteRepository();

    // Create a test note
    const noteResult = createNote({ content: "Test note" });
    if (noteResult.isOk()) {
      const note = noteResult.value;
      await mockNoteRepository.create(note);
      testNoteId = note.id;
    }

    context = {
      assetRepository: mockAssetRepository,
      assetStorageManager: mockAssetStorageManager,
      noteRepository: mockNoteRepository,
    } as unknown as Context;
  });

  it("should upload valid PNG image file", async () => {
    const file = new File(["test"], "test.png", { type: "image/png" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.mimeType).toBe("image/png");
    }
  });

  it("should upload valid JPEG image file", async () => {
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.mimeType).toBe("image/jpeg");
    }
  });

  it("should upload valid GIF image file", async () => {
    const file = new File(["test"], "test.gif", { type: "image/gif" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.mimeType).toBe("image/gif");
    }
  });

  it("should upload valid WebP image file", async () => {
    const file = new File(["test"], "test.webp", { type: "image/webp" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.mimeType).toBe("image/webp");
    }
  });

  it("should upload valid SVG image file", async () => {
    const file = new File(["test"], "test.svg", { type: "image/svg+xml" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.mimeType).toBe("image/svg+xml");
    }
  });

  it("should auto-generate UUID v7 ID on upload", async () => {
    const file = new File(["test"], "test.png", { type: "image/png" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBeDefined();
      expect(typeof result.value.id).toBe("string");
      expect(result.value.id.length).toBeGreaterThan(0);
    }
  });

  it("should auto-generate file path on upload", async () => {
    const file = new File(["test"], "test.png", { type: "image/png" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.path).toBeDefined();
      expect(result.value.path).toContain("assets/images/");
    }
  });

  it("should auto-set createdAt on upload", async () => {
    const file = new File(["test"], "test.png", { type: "image/png" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.createdAt).toBeInstanceOf(Date);
    }
  });

  it("should save file to local file system", async () => {
    const file = new File(["test"], "test.png", { type: "image/png" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isOk()).toBe(true);
  });

  it("should save asset to database", async () => {
    const file = new File(["test"], "test.png", { type: "image/png" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const assetResult = await mockAssetRepository.findById(result.value.id);
      expect(assetResult.isOk()).toBe(true);
      if (assetResult.isOk()) {
        expect(assetResult.value).not.toBeNull();
      }
    }
  });

  it("should upload image with file size up to 10MB", async () => {
    const file = new File([new ArrayBuffer(MAX_FILE_SIZE)], "test.png", {
      type: "image/png",
    });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isOk()).toBe(true);
  });

  it("should return ValidationError for file larger than 10MB", async () => {
    const file = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], "test.png", {
      type: "image/png",
    });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toContain("Failed to create asset");
    }
  });

  it("should return ValidationError for non-image file", async () => {
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toContain("Failed to create asset");
    }
  });

  it("should return ExternalServiceError when file system save fails", async () => {
    mockAssetStorageManager.setShouldFailSave(true);

    const file = new File(["test"], "test.png", { type: "image/png" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to save file");
    }
  });

  it("should return RepositoryError when database save fails", async () => {
    mockAssetRepository.setShouldFailCreate(true);

    const file = new File(["test"], "test.png", { type: "image/png" });
    const result = await uploadImage(context, { noteId: testNoteId, file });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to upload image");
    }
  });
});
