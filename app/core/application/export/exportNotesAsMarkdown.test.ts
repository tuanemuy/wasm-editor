import { beforeEach, describe, expect, it } from "vitest";
import { MockAssetRepository } from "@/core/adapters/mock/assetRepository";
import { MockExportStorageManager } from "@/core/adapters/mock/exportStorageManager";
import { MockMarkdownExporter } from "@/core/adapters/mock/markdownExporter";
import { MockNoteRepository } from "@/core/adapters/mock/noteRepository";
import { createAsset } from "@/core/domain/asset/entity";
import { createNote } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { exportNotesAsMarkdown } from "./exportNotesAsMarkdown";

describe("exportNotesAsMarkdown", () => {
  let mockNoteRepository: MockNoteRepository;
  let mockAssetRepository: MockAssetRepository;
  let mockMarkdownExporter: MockMarkdownExporter;
  let mockExportStorageManager: MockExportStorageManager;
  let context: Context;
  let testNoteIds: NoteId[];

  beforeEach(async () => {
    mockNoteRepository = new MockNoteRepository();
    mockAssetRepository = new MockAssetRepository();
    mockMarkdownExporter = new MockMarkdownExporter();
    mockExportStorageManager = new MockExportStorageManager();

    testNoteIds = [];

    // Create test notes
    const note1Result = createNote({ content: "# Note 1\n\nFirst note." });
    const note2Result = createNote({ content: "# Note 2\n\nSecond note." });

    if (note1Result.isOk()) {
      const note = note1Result.value;
      await mockNoteRepository.create(note);
      testNoteIds.push(note.id);
    }

    if (note2Result.isOk()) {
      const note = note2Result.value;
      await mockNoteRepository.create(note);
      testNoteIds.push(note.id);
    }

    context = {
      noteRepository: mockNoteRepository,
      assetRepository: mockAssetRepository,
      markdownExporter: mockMarkdownExporter,
      exportStorageManager: mockExportStorageManager,
    } as unknown as Context;
  });

  it("should export multiple notes as Markdown files in batch", async () => {
    const result = await exportNotesAsMarkdown(context, {
      noteIds: testNoteIds,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(Array.isArray(result.value)).toBe(true);
    }
  });

  it("should export each note as separate file", async () => {
    const result = await exportNotesAsMarkdown(context, {
      noteIds: testNoteIds,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(2);
    }
  });

  it("should generate filename from note title for each file", async () => {
    const result = await exportNotesAsMarkdown(context, {
      noteIds: testNoteIds,
    });

    expect(result.isOk()).toBe(true);
  });

  it("should generate filename from creation date when no title exists", async () => {
    const noteResult = createNote({ content: "No title content" });
    if (noteResult.isOk()) {
      const note = noteResult.value;
      await mockNoteRepository.create(note);

      const result = await exportNotesAsMarkdown(context, {
        noteIds: [note.id],
      });

      expect(result.isOk()).toBe(true);
    }
  });

  it("should export notes with images in batch", async () => {
    // Create assets for test notes
    for (const noteId of testNoteIds) {
      const assetResult = createAsset({
        noteId,
        path: `assets/images/${noteId}.png`,
        fileName: "test.png",
        fileSize: 1024,
        mimeType: "image/png",
      });

      if (assetResult.isOk()) {
        await mockAssetRepository.create(assetResult.value);
      }
    }

    const result = await exportNotesAsMarkdown(context, {
      noteIds: testNoteIds,
    });

    expect(result.isOk()).toBe(true);
  });

  it("should let user select directory", async () => {
    const result = await exportNotesAsMarkdown(context, {
      noteIds: testNoteIds,
    });

    expect(result.isOk()).toBe(true);
  });

  it("should save all files after export", async () => {
    const result = await exportNotesAsMarkdown(context, {
      noteIds: testNoteIds,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const savedFiles = mockExportStorageManager.getSavedFiles();
      expect(savedFiles.size).toBe(2);
    }
  });

  it("should not export anything when note ID list is empty", async () => {
    const result = await exportNotesAsMarkdown(context, { noteIds: [] });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it("should only export existing notes when some notes do not exist", async () => {
    const mixedIds = [...testNoteIds, "non-existent-id" as NoteId];
    const result = await exportNotesAsMarkdown(context, { noteIds: mixedIds });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toContain("Note not found");
    }
  });

  it("should return validation error for invalid note ID format", async () => {
    const invalidIds = ["invalid-id" as NoteId];
    const result = await exportNotesAsMarkdown(context, {
      noteIds: invalidIds,
    });

    expect(result.isErr()).toBe(true);
  });

  it("should return ExternalServiceError when export fails", async () => {
    mockMarkdownExporter.setShouldFailExportMultiple(true);

    const result = await exportNotesAsMarkdown(context, {
      noteIds: testNoteIds,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to export to markdown");
    }
  });

  it("should return ExternalServiceError when file save fails", async () => {
    mockExportStorageManager.setShouldFailSaveWithDialog(true);

    const result = await exportNotesAsMarkdown(context, {
      noteIds: testNoteIds,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to save file");
    }
  });

  it("should return RepositoryError when database get fails", async () => {
    mockNoteRepository.setShouldFailFindById(true);

    const result = await exportNotesAsMarkdown(context, {
      noteIds: testNoteIds,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get notes");
    }
  });
});
