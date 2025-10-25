/**
 * LocalStorage Tag Query Service Tests
 */
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageTagQueryService } from "./tagQueryService";

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

describe("LocalStorageTagQueryService", () => {
  let service: LocalStorageTagQueryService;
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    localStorageMock = new LocalStorageMock();
    global.localStorage = localStorageMock as unknown as Storage;
    service = new LocalStorageTagQueryService();
  });

  describe("findUnused", () => {
    it("should find tags with no notes", async () => {
      const tags = {
        "tag-1": {
          id: "tag-1",
          name: "Used Tag",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
        "tag-2": {
          id: "tag-2",
          name: "Unused Tag",
          created_at: 1735689700,
          updated_at: 1735689700,
        },
      };

      const relations = [{ note_id: "note-1", tag_id: "tag-1" }];

      localStorageMock.setItem("app_tags", JSON.stringify(tags));
      localStorageMock.setItem(
        "app_note_tag_relations",
        JSON.stringify(relations),
      );

      const unusedTags = await service.findUnused();

      expect(unusedTags).toHaveLength(1);
      expect(unusedTags[0].id).toBe("tag-2");
      expect(unusedTags[0].name).toBe("Unused Tag");
    });

    it("should return empty array when all tags are used", async () => {
      const tags = {
        "tag-1": {
          id: "tag-1",
          name: "Tag 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
        "tag-2": {
          id: "tag-2",
          name: "Tag 2",
          created_at: 1735689700,
          updated_at: 1735689700,
        },
      };

      const relations = [
        { note_id: "note-1", tag_id: "tag-1" },
        { note_id: "note-2", tag_id: "tag-2" },
      ];

      localStorageMock.setItem("app_tags", JSON.stringify(tags));
      localStorageMock.setItem(
        "app_note_tag_relations",
        JSON.stringify(relations),
      );

      const unusedTags = await service.findUnused();

      expect(unusedTags).toHaveLength(0);
    });

    it("should return all tags when no notes exist", async () => {
      const tags = {
        "tag-1": {
          id: "tag-1",
          name: "Tag 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
        "tag-2": {
          id: "tag-2",
          name: "Tag 2",
          created_at: 1735689700,
          updated_at: 1735689700,
        },
      };

      localStorageMock.setItem("app_tags", JSON.stringify(tags));
      localStorageMock.setItem("app_note_tag_relations", JSON.stringify([]));

      const unusedTags = await service.findUnused();

      expect(unusedTags).toHaveLength(2);
    });

    it("should handle empty tags", async () => {
      localStorageMock.setItem("app_tags", JSON.stringify({}));
      localStorageMock.setItem("app_note_tag_relations", JSON.stringify([]));

      const unusedTags = await service.findUnused();

      expect(unusedTags).toHaveLength(0);
    });
  });

  describe("findAllWithUsage", () => {
    it("should find all tags with usage count", async () => {
      const tags = {
        "tag-1": {
          id: "tag-1",
          name: "Popular Tag",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
        "tag-2": {
          id: "tag-2",
          name: "Less Popular Tag",
          created_at: 1735689700,
          updated_at: 1735689700,
        },
        "tag-3": {
          id: "tag-3",
          name: "Unused Tag",
          created_at: 1735689800,
          updated_at: 1735689800,
        },
      };

      const relations = [
        { note_id: "note-1", tag_id: "tag-1" },
        { note_id: "note-2", tag_id: "tag-1" },
        { note_id: "note-3", tag_id: "tag-1" },
        { note_id: "note-4", tag_id: "tag-2" },
      ];

      localStorageMock.setItem("app_tags", JSON.stringify(tags));
      localStorageMock.setItem(
        "app_note_tag_relations",
        JSON.stringify(relations),
      );

      const tagsWithUsage = await service.findAllWithUsage();

      expect(tagsWithUsage).toHaveLength(3);

      // Should be sorted by usage count descending
      expect(tagsWithUsage[0].id).toBe("tag-1");
      expect(tagsWithUsage[0].usageCount).toBe(3);

      expect(tagsWithUsage[1].id).toBe("tag-2");
      expect(tagsWithUsage[1].usageCount).toBe(1);

      expect(tagsWithUsage[2].id).toBe("tag-3");
      expect(tagsWithUsage[2].usageCount).toBe(0);
    });

    it("should return empty array when no tags exist", async () => {
      localStorageMock.setItem("app_tags", JSON.stringify({}));
      localStorageMock.setItem("app_note_tag_relations", JSON.stringify([]));

      const tagsWithUsage = await service.findAllWithUsage();

      expect(tagsWithUsage).toHaveLength(0);
    });
  });
});
