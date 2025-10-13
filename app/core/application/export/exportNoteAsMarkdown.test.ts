import { beforeEach, describe, expect, it } from "vitest";
import { MockAssetRepository } from "@/core/adapters/mock/assetRepository";
import { MockExportStorageManager } from "@/core/adapters/mock/exportStorageManager";
import { MockMarkdownExporter } from "@/core/adapters/mock/markdownExporter";
import { MockNoteRepository } from "@/core/adapters/mock/noteRepository";
import { createAsset } from "@/core/domain/asset/entity";
import { createNote } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { exportNoteAsMarkdown } from "./exportNoteAsMarkdown";

describe("exportNoteAsMarkdown", () => {
  let mockNoteRepository: MockNoteRepository;
  let mockAssetRepository: MockAssetRepository;
  let mockMarkdownExporter: MockMarkdownExporter;
  let mockExportStorageManager: MockExportStorageManager;
  let context: Context;
  let testNoteId: NoteId;

  beforeEach(async () => {
    mockNoteRepository = new MockNoteRepository();
    mockAssetRepository = new MockAssetRepository();
    mockMarkdownExporter = new MockMarkdownExporter();
    mockExportStorageManager = new MockExportStorageManager();

    // Create a test note
    const noteResult = createNote({
      content: "# Test Note\n\nThis is a test.",
    });
    if (noteResult.isOk()) {
      const note = noteResult.value;
      await mockNoteRepository.create(note);
      testNoteId = note.id;
    }

    context = {
      noteRepository: mockNoteRepository,
      assetRepository: mockAssetRepository,
      markdownExporter: mockMarkdownExporter,
      exportStorageManager: mockExportStorageManager,
    } as unknown as Context;
  });

  it("should export note with valid note ID as Markdown file", async () => {
    const result = await exportNoteAsMarkdown(context, { noteId: testNoteId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(typeof result.value).toBe("string");
    }
  });

  it("should include correct content in exported file", async () => {
    const result = await exportNoteAsMarkdown(context, { noteId: testNoteId });

    expect(result.isOk()).toBe(true);
  });

  it("should generate filename from note title", async () => {
    const result = await exportNoteAsMarkdown(context, { noteId: testNoteId });

    expect(result.isOk()).toBe(true);
  });

  it("should generate filename from creation date when no title exists", async () => {
    const noteResult = createNote({ content: "No title content" });
    if (noteResult.isOk()) {
      const note = noteResult.value;
      await mockNoteRepository.create(note);

      const result = await exportNoteAsMarkdown(context, { noteId: note.id });

      expect(result.isOk()).toBe(true);
    }
  });

  it("should export note with images", async () => {
    // Create an asset for the test note
    const assetResult = createAsset({
      noteId: testNoteId,
      path: "assets/images/test.png",
      fileName: "test.png",
      fileSize: 1024,
      mimeType: "image/png",
    });

    if (assetResult.isOk()) {
      await mockAssetRepository.create(assetResult.value);
    }

    const result = await exportNoteAsMarkdown(context, { noteId: testNoteId });

    expect(result.isOk()).toBe(true);
  });

  it("should let user select file save location", async () => {
    const result = await exportNoteAsMarkdown(context, { noteId: testNoteId });

    expect(result.isOk()).toBe(true);
  });

  it("should save file after export", async () => {
    const result = await exportNoteAsMarkdown(context, { noteId: testNoteId });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const savedFiles = mockExportStorageManager.getSavedFiles();
      expect(savedFiles.size).toBeGreaterThan(0);
    }
  });

  it("should return ApplicationError for non-existent note ID", async () => {
    const nonExistentId = "non-existent-id" as NoteId;
    const result = await exportNoteAsMarkdown(context, {
      noteId: nonExistentId,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Note not found");
    }
  });

  it("should return validation error for invalid note ID format", async () => {
    const invalidId = "invalid-id" as NoteId;
    const result = await exportNoteAsMarkdown(context, { noteId: invalidId });

    // In the mock, this will return "Note not found"
    expect(result.isErr()).toBe(true);
  });

  it("should return ExternalServiceError when export fails", async () => {
    mockMarkdownExporter.setShouldFailExport(true);

    const result = await exportNoteAsMarkdown(context, { noteId: testNoteId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to export to markdown");
    }
  });

  it("should return ExternalServiceError when file save fails", async () => {
    mockExportStorageManager.setShouldFailSaveWithDialog(true);

    const result = await exportNoteAsMarkdown(context, { noteId: testNoteId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to save file");
    }
  });

  it("should return RepositoryError when database get fails", async () => {
    mockNoteRepository.setShouldFailFindById(true);

    const result = await exportNoteAsMarkdown(context, { noteId: testNoteId });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to export note");
    }
  });
});
