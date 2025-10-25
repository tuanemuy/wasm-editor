/**
 * LocalStorage Note Repository Tests
 */
import { beforeEach, describe, expect, it } from "vitest";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { Note } from "@/core/domain/note/entity";
import { createNoteId } from "@/core/domain/note/valueObject";
import { createTagId } from "@/core/domain/tag/valueObject";
import { LocalStorageNoteRepository } from "./noteRepository";

// Mock localStorage for testing
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  clear(): void {
    this.store = {};
  }

  removeItem(key: string): void {
    delete this.store[key];
  }
}

describe("LocalStorageNoteRepository", () => {
  let repository: LocalStorageNoteRepository;
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    localStorageMock = new LocalStorageMock();
    global.localStorage = localStorageMock as any;
    repository = new LocalStorageNoteRepository();
  });

  describe("save", () => {
    it("should save a note successfully", async () => {
      const note: Note = {
        id: createNoteId("test-id-1"),
        content: { type: "doc", content: [] },
        text: "Test note",
        tagIds: [],
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-01-01T00:00:00Z"),
      };

      await repository.save(note);

      const stored = localStorageMock.getItem("app_notes");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed["test-id-1"]).toBeDefined();
      expect(parsed["test-id-1"].text).toBe("Test note");
      // Verify timestamps are in seconds
      expect(parsed["test-id-1"].created_at).toBe(1735689600);
      expect(parsed["test-id-1"].updated_at).toBe(1735689600);
    });

    it("should save note with tags", async () => {
      const note: Note = {
        id: createNoteId("test-id-1"),
        content: { type: "doc", content: [] },
        text: "Test note",
        tagIds: [createTagId("tag-1"), createTagId("tag-2")],
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-01-01T00:00:00Z"),
      };

      await repository.save(note);

      const relations = localStorageMock.getItem("app_note_tag_relations");
      expect(relations).toBeTruthy();
      const parsed = JSON.parse(relations!);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual({ note_id: "test-id-1", tag_id: "tag-1" });
      expect(parsed[1]).toEqual({ note_id: "test-id-1", tag_id: "tag-2" });
    });

    it("should handle QuotaExceededError", async () => {
      const note: Note = {
        id: createNoteId("test-id-1"),
        content: { type: "doc", content: [] },
        text: "Test note",
        tagIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock setItem to throw QuotaExceededError
      localStorageMock.setItem = () => {
        const error = new DOMException(
          "QuotaExceededError",
          "QuotaExceededError",
        );
        (error as any).name = "QuotaExceededError";
        throw error;
      };

      await expect(repository.save(note)).rejects.toThrow(SystemError);
      await expect(repository.save(note)).rejects.toThrow(
        "Storage quota exceeded",
      );
    });
  });

  describe("findById", () => {
    it("should find a note by ID", async () => {
      // Setup test data
      const testData = {
        "test-id-1": {
          id: "test-id-1",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Test note",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_notes", JSON.stringify(testData));
      localStorageMock.setItem("app_note_tag_relations", JSON.stringify([]));

      const note = await repository.findById(createNoteId("test-id-1"));

      expect(note.id).toBe("test-id-1");
      expect(note.text).toBe("Test note");
      expect(note.createdAt).toEqual(new Date("2025-01-01T00:00:00Z"));
      expect(note.updatedAt).toEqual(new Date("2025-01-01T00:00:00Z"));
    });

    it("should throw NotFoundError when note does not exist", async () => {
      localStorageMock.setItem("app_notes", JSON.stringify({}));

      await expect(
        repository.findById(createNoteId("non-existent")),
      ).rejects.toThrow(NotFoundError);
    });

    it("should load note with tags", async () => {
      const testData = {
        "test-id-1": {
          id: "test-id-1",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Test note",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_notes", JSON.stringify(testData));
      localStorageMock.setItem(
        "app_note_tag_relations",
        JSON.stringify([
          { note_id: "test-id-1", tag_id: "tag-1" },
          { note_id: "test-id-1", tag_id: "tag-2" },
        ]),
      );

      const note = await repository.findById(createNoteId("test-id-1"));

      expect(note.tagIds).toHaveLength(2);
      expect(note.tagIds).toContain("tag-1");
      expect(note.tagIds).toContain("tag-2");
    });

    it("should handle malformed JSON content", async () => {
      const testData = {
        "test-id-1": {
          id: "test-id-1",
          content: "invalid json",
          text: "Test note",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_notes", JSON.stringify(testData));
      localStorageMock.setItem("app_note_tag_relations", JSON.stringify([]));

      await expect(
        repository.findById(createNoteId("test-id-1")),
      ).rejects.toThrow(SystemError);
    });
  });

  describe("findAll", () => {
    it("should return all notes with pagination", async () => {
      const testData = {
        "test-id-1": {
          id: "test-id-1",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Note 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
        "test-id-2": {
          id: "test-id-2",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Note 2",
          created_at: 1735689700,
          updated_at: 1735689700,
        },
      };
      localStorageMock.setItem("app_notes", JSON.stringify(testData));
      localStorageMock.setItem("app_note_tag_relations", JSON.stringify([]));

      const result = await repository.findAll({
        pagination: { page: 1, limit: 10 },
        order: "asc",
        orderBy: "created_at",
      });

      expect(result.items).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.items[0].id).toBe("test-id-1");
      expect(result.items[1].id).toBe("test-id-2");
    });

    it("should sort notes in descending order", async () => {
      const testData = {
        "test-id-1": {
          id: "test-id-1",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Note 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
        "test-id-2": {
          id: "test-id-2",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Note 2",
          created_at: 1735689700,
          updated_at: 1735689700,
        },
      };
      localStorageMock.setItem("app_notes", JSON.stringify(testData));
      localStorageMock.setItem("app_note_tag_relations", JSON.stringify([]));

      const result = await repository.findAll({
        pagination: { page: 1, limit: 10 },
        order: "desc",
        orderBy: "created_at",
      });

      expect(result.items[0].id).toBe("test-id-2");
      expect(result.items[1].id).toBe("test-id-1");
    });

    it("should handle pagination correctly", async () => {
      const testData = {
        "test-id-1": {
          id: "test-id-1",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Note 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
        "test-id-2": {
          id: "test-id-2",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Note 2",
          created_at: 1735689700,
          updated_at: 1735689700,
        },
      };
      localStorageMock.setItem("app_notes", JSON.stringify(testData));
      localStorageMock.setItem("app_note_tag_relations", JSON.stringify([]));

      const result = await repository.findAll({
        pagination: { page: 2, limit: 1 },
        order: "asc",
        orderBy: "created_at",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("test-id-2");
      expect(result.count).toBe(2);
    });
  });

  describe("delete", () => {
    it("should delete a note", async () => {
      const testData = {
        "test-id-1": {
          id: "test-id-1",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Note 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_notes", JSON.stringify(testData));
      localStorageMock.setItem("app_note_tag_relations", JSON.stringify([]));

      await repository.delete(createNoteId("test-id-1"));

      const stored = localStorageMock.getItem("app_notes");
      const parsed = JSON.parse(stored!);
      expect(parsed["test-id-1"]).toBeUndefined();
    });

    it("should delete note and its tag relations", async () => {
      const testData = {
        "test-id-1": {
          id: "test-id-1",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Note 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_notes", JSON.stringify(testData));
      localStorageMock.setItem(
        "app_note_tag_relations",
        JSON.stringify([
          { note_id: "test-id-1", tag_id: "tag-1" },
          { note_id: "test-id-2", tag_id: "tag-2" },
        ]),
      );

      await repository.delete(createNoteId("test-id-1"));

      const relations = localStorageMock.getItem("app_note_tag_relations");
      const parsed = JSON.parse(relations!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].note_id).toBe("test-id-2");
    });

    it("should throw NotFoundError when deleting non-existent note", async () => {
      localStorageMock.setItem("app_notes", JSON.stringify({}));

      await expect(
        repository.delete(createNoteId("non-existent")),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("exists", () => {
    it("should return true when note exists", async () => {
      const testData = {
        "test-id-1": {
          id: "test-id-1",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Note 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_notes", JSON.stringify(testData));

      const exists = await repository.exists(createNoteId("test-id-1"));

      expect(exists).toBe(true);
    });

    it("should return false when note does not exist", async () => {
      localStorageMock.setItem("app_notes", JSON.stringify({}));

      const exists = await repository.exists(createNoteId("non-existent"));

      expect(exists).toBe(false);
    });
  });
});
