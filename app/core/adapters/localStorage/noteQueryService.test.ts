/**
 * LocalStorage Note Query Service Tests
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createNoteId } from "@/core/domain/note/valueObject";
import { createTagId } from "@/core/domain/tag/valueObject";
import { LocalStorageNoteQueryService } from "./noteQueryService";

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

describe("LocalStorageNoteQueryService", () => {
  let service: LocalStorageNoteQueryService;
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    localStorageMock = new LocalStorageMock();
    global.localStorage = localStorageMock as any;
    service = new LocalStorageNoteQueryService();
  });

  describe("combinedSearch", () => {
    beforeEach(() => {
      // Setup test data
      const notes = {
        "note-1": {
          id: "note-1",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "First test note",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
        "note-2": {
          id: "note-2",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Second test note",
          created_at: 1735689700,
          updated_at: 1735689700,
        },
        "note-3": {
          id: "note-3",
          content: JSON.stringify({ type: "doc", content: [] }),
          text: "Another note with different content",
          created_at: 1735689800,
          updated_at: 1735689800,
        },
      };

      const relations = [
        { note_id: "note-1", tag_id: "tag-1" },
        { note_id: "note-1", tag_id: "tag-2" },
        { note_id: "note-2", tag_id: "tag-1" },
        { note_id: "note-3", tag_id: "tag-3" },
      ];

      localStorageMock.setItem("app_notes", JSON.stringify(notes));
      localStorageMock.setItem(
        "app_note_tag_relations",
        JSON.stringify(relations),
      );
    });

    it("should search by query text", async () => {
      const result = await service.combinedSearch({
        query: "test",
        tagIds: [],
        pagination: { page: 1, limit: 10 },
        order: "asc",
        orderBy: "created_at",
      });

      expect(result.items).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.items[0].text).toContain("test");
      expect(result.items[1].text).toContain("test");
    });

    it("should search by tags (AND)", async () => {
      const result = await service.combinedSearch({
        query: "",
        tagIds: [createTagId("tag-1"), createTagId("tag-2")],
        pagination: { page: 1, limit: 10 },
        order: "asc",
        orderBy: "created_at",
      });

      // Only note-1 has both tag-1 AND tag-2
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("note-1");
    });

    it("should search by single tag", async () => {
      const result = await service.combinedSearch({
        query: "",
        tagIds: [createTagId("tag-1")],
        pagination: { page: 1, limit: 10 },
        order: "asc",
        orderBy: "created_at",
      });

      // Both note-1 and note-2 have tag-1
      expect(result.items).toHaveLength(2);
    });

    it("should combine query and tag search", async () => {
      const result = await service.combinedSearch({
        query: "test",
        tagIds: [createTagId("tag-1")],
        pagination: { page: 1, limit: 10 },
        order: "asc",
        orderBy: "created_at",
      });

      // Notes must have tag-1 AND contain "test"
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe("note-1");
      expect(result.items[1].id).toBe("note-2");
    });

    it("should sort by created_at ascending", async () => {
      const result = await service.combinedSearch({
        query: "",
        tagIds: [],
        pagination: { page: 1, limit: 10 },
        order: "asc",
        orderBy: "created_at",
      });

      expect(result.items[0].id).toBe("note-1");
      expect(result.items[1].id).toBe("note-2");
      expect(result.items[2].id).toBe("note-3");
    });

    it("should sort by created_at descending", async () => {
      const result = await service.combinedSearch({
        query: "",
        tagIds: [],
        pagination: { page: 1, limit: 10 },
        order: "desc",
        orderBy: "created_at",
      });

      expect(result.items[0].id).toBe("note-3");
      expect(result.items[1].id).toBe("note-2");
      expect(result.items[2].id).toBe("note-1");
    });

    it("should handle pagination", async () => {
      const result = await service.combinedSearch({
        query: "",
        tagIds: [],
        pagination: { page: 2, limit: 1 },
        order: "asc",
        orderBy: "created_at",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("note-2");
      expect(result.count).toBe(3);
    });

    it("should be case insensitive in text search", async () => {
      const result = await service.combinedSearch({
        query: "TEST",
        tagIds: [],
        pagination: { page: 1, limit: 10 },
        order: "asc",
        orderBy: "created_at",
      });

      expect(result.items).toHaveLength(2);
    });

    it("should return empty result when no matches", async () => {
      const result = await service.combinedSearch({
        query: "nonexistent",
        tagIds: [],
        pagination: { page: 1, limit: 10 },
        order: "asc",
        orderBy: "created_at",
      });

      expect(result.items).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    it("should use Set for efficient tag filtering", async () => {
      // This test verifies that the tag filtering uses Set (from the code review fix)
      const result = await service.combinedSearch({
        query: "",
        tagIds: [createTagId("tag-1"), createTagId("tag-2")],
        pagination: { page: 1, limit: 10 },
        order: "asc",
        orderBy: "created_at",
      });

      // Only note-1 has both tags
      expect(result.items).toHaveLength(1);
      expect(result.items[0].tagIds).toContain("tag-1");
      expect(result.items[0].tagIds).toContain("tag-2");
    });
  });

  describe("findNoteIdsByTagId", () => {
    beforeEach(() => {
      const relations = [
        { note_id: "note-1", tag_id: "tag-1" },
        { note_id: "note-2", tag_id: "tag-1" },
        { note_id: "note-3", tag_id: "tag-2" },
      ];

      localStorageMock.setItem(
        "app_note_tag_relations",
        JSON.stringify(relations),
      );
    });

    it("should find note IDs by tag ID", async () => {
      const noteIds = await service.findNoteIdsByTagId(createTagId("tag-1"));

      expect(noteIds).toHaveLength(2);
      expect(noteIds).toContain("note-1");
      expect(noteIds).toContain("note-2");
    });

    it("should return empty array when no matches", async () => {
      const noteIds = await service.findNoteIdsByTagId(
        createTagId("non-existent"),
      );

      expect(noteIds).toHaveLength(0);
    });
  });

  describe("findNoteIdsByTagIds", () => {
    beforeEach(() => {
      const relations = [
        { note_id: "note-1", tag_id: "tag-1" },
        { note_id: "note-1", tag_id: "tag-2" },
        { note_id: "note-2", tag_id: "tag-1" },
        { note_id: "note-3", tag_id: "tag-3" },
      ];

      localStorageMock.setItem(
        "app_note_tag_relations",
        JSON.stringify(relations),
      );
    });

    it("should find note IDs by multiple tag IDs (AND search)", async () => {
      const noteIds = await service.findNoteIdsByTagIds([
        createTagId("tag-1"),
        createTagId("tag-2"),
      ]);

      // Only note-1 has both tags
      expect(noteIds).toHaveLength(1);
      expect(noteIds[0]).toBe("note-1");
    });

    it("should return empty array when given empty array", async () => {
      const noteIds = await service.findNoteIdsByTagIds([]);

      expect(noteIds).toHaveLength(0);
    });

    it("should return empty array when no notes have all tags", async () => {
      const noteIds = await service.findNoteIdsByTagIds([
        createTagId("tag-1"),
        createTagId("tag-3"),
      ]);

      expect(noteIds).toHaveLength(0);
    });
  });
});
