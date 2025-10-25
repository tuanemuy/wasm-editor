/**
 * LocalStorage Tag Repository Tests
 */
import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, SystemError } from "@/core/application/error";
import type { Tag } from "@/core/domain/tag/entity";
import { createTagId, createTagName } from "@/core/domain/tag/valueObject";
import { LocalStorageTagRepository } from "./tagRepository";

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

describe("LocalStorageTagRepository", () => {
  let repository: LocalStorageTagRepository;
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    localStorageMock = new LocalStorageMock();
    global.localStorage = localStorageMock as unknown as Storage;
    repository = new LocalStorageTagRepository();
  });

  describe("save", () => {
    it("should save a tag successfully", async () => {
      const tag: Tag = {
        id: createTagId("tag-1"),
        name: createTagName("TestTag"),
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-01-01T00:00:00Z"),
      };

      await repository.save(tag);

      const stored = localStorageMock.getItem("app_tags");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored as string);
      expect(parsed["tag-1"]).toBeDefined();
      expect(parsed["tag-1"].name).toBe("TestTag");
      // Verify timestamps are in seconds
      expect(parsed["tag-1"].created_at).toBe(1735689600);
      expect(parsed["tag-1"].updated_at).toBe(1735689600);
    });

    it("should handle QuotaExceededError", async () => {
      const tag: Tag = {
        id: createTagId("tag-1"),
        name: createTagName("TestTag"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock setItem to throw QuotaExceededError
      localStorageMock.setItem = () => {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      };

      await expect(repository.save(tag)).rejects.toThrow(SystemError);
      await expect(repository.save(tag)).rejects.toThrow(
        "Storage quota exceeded",
      );
    });
  });

  describe("findById", () => {
    it("should find a tag by ID", async () => {
      const testData = {
        "tag-1": {
          id: "tag-1",
          name: "TestTag",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_tags", JSON.stringify(testData));

      const tag = await repository.findById(createTagId("tag-1"));

      expect(tag.id).toBe("tag-1");
      expect(tag.name).toBe("TestTag");
      expect(tag.createdAt).toEqual(new Date("2025-01-01T00:00:00Z"));
      expect(tag.updatedAt).toEqual(new Date("2025-01-01T00:00:00Z"));
    });

    it("should throw NotFoundError when tag does not exist", async () => {
      localStorageMock.setItem("app_tags", JSON.stringify({}));

      await expect(
        repository.findById(createTagId("non-existent")),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("findByName", () => {
    it("should find a tag by name", async () => {
      const testData = {
        "tag-1": {
          id: "tag-1",
          name: "TestTag",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_tags", JSON.stringify(testData));

      const tag = await repository.findByName(createTagName("TestTag"));

      expect(tag).toBeTruthy();
      expect(tag?.id).toBe("tag-1");
      expect(tag?.name).toBe("TestTag");
    });

    it("should return null when tag does not exist", async () => {
      localStorageMock.setItem("app_tags", JSON.stringify({}));

      const tag = await repository.findByName(createTagName("Nonexistent"));

      expect(tag).toBeNull();
    });
  });

  describe("findByIds", () => {
    it("should find tags by IDs", async () => {
      const testData = {
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
      localStorageMock.setItem("app_tags", JSON.stringify(testData));

      const tags = await repository.findByIds([
        createTagId("tag-1"),
        createTagId("tag-2"),
      ]);

      expect(tags).toHaveLength(2);
      expect(tags[0].id).toBe("tag-1");
      expect(tags[1].id).toBe("tag-2");
    });

    it("should return empty array when given empty array", async () => {
      const tags = await repository.findByIds([]);

      expect(tags).toEqual([]);
    });

    it("should skip non-existent tags", async () => {
      const testData = {
        "tag-1": {
          id: "tag-1",
          name: "Tag 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_tags", JSON.stringify(testData));

      const tags = await repository.findByIds([
        createTagId("tag-1"),
        createTagId("non-existent"),
      ]);

      expect(tags).toHaveLength(1);
      expect(tags[0].id).toBe("tag-1");
    });
  });

  describe("findAll", () => {
    it("should return all tags", async () => {
      const testData = {
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
      localStorageMock.setItem("app_tags", JSON.stringify(testData));

      const tags = await repository.findAll();

      expect(tags).toHaveLength(2);
    });

    it("should return empty array when no tags exist", async () => {
      localStorageMock.setItem("app_tags", JSON.stringify({}));

      const tags = await repository.findAll();

      expect(tags).toEqual([]);
    });
  });

  describe("delete", () => {
    it("should delete a tag", async () => {
      const testData = {
        "tag-1": {
          id: "tag-1",
          name: "Tag 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_tags", JSON.stringify(testData));
      localStorageMock.setItem("app_note_tag_relations", JSON.stringify([]));

      await repository.delete(createTagId("tag-1"));

      const stored = localStorageMock.getItem("app_tags");
      const parsed = JSON.parse(stored as string);
      expect(parsed["tag-1"]).toBeUndefined();
    });

    it("should delete tag and its relations", async () => {
      const testData = {
        "tag-1": {
          id: "tag-1",
          name: "Tag 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_tags", JSON.stringify(testData));
      localStorageMock.setItem(
        "app_note_tag_relations",
        JSON.stringify([
          { note_id: "note-1", tag_id: "tag-1" },
          { note_id: "note-2", tag_id: "tag-2" },
        ]),
      );

      await repository.delete(createTagId("tag-1"));

      const relations = localStorageMock.getItem("app_note_tag_relations");
      const parsed = JSON.parse(relations as string);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].tag_id).toBe("tag-2");
    });
  });

  describe("deleteMany", () => {
    it("should delete multiple tags", async () => {
      const testData = {
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
        "tag-3": {
          id: "tag-3",
          name: "Tag 3",
          created_at: 1735689800,
          updated_at: 1735689800,
        },
      };
      localStorageMock.setItem("app_tags", JSON.stringify(testData));
      localStorageMock.setItem("app_note_tag_relations", JSON.stringify([]));

      await repository.deleteMany([createTagId("tag-1"), createTagId("tag-2")]);

      const stored = localStorageMock.getItem("app_tags");
      const parsed = JSON.parse(stored as string);
      expect(parsed["tag-1"]).toBeUndefined();
      expect(parsed["tag-2"]).toBeUndefined();
      expect(parsed["tag-3"]).toBeDefined();
    });

    it("should delete tags and their relations", async () => {
      const testData = {
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
      localStorageMock.setItem("app_tags", JSON.stringify(testData));
      localStorageMock.setItem(
        "app_note_tag_relations",
        JSON.stringify([
          { note_id: "note-1", tag_id: "tag-1" },
          { note_id: "note-2", tag_id: "tag-2" },
          { note_id: "note-3", tag_id: "tag-3" },
        ]),
      );

      await repository.deleteMany([createTagId("tag-1"), createTagId("tag-2")]);

      const relations = localStorageMock.getItem("app_note_tag_relations");
      const parsed = JSON.parse(relations as string);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].tag_id).toBe("tag-3");
    });

    it("should handle empty array", async () => {
      const testData = {
        "tag-1": {
          id: "tag-1",
          name: "Tag 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_tags", JSON.stringify(testData));

      await repository.deleteMany([]);

      const stored = localStorageMock.getItem("app_tags");
      const parsed = JSON.parse(stored as string);
      expect(parsed["tag-1"]).toBeDefined();
    });
  });

  describe("exists", () => {
    it("should return true when tag exists", async () => {
      const testData = {
        "tag-1": {
          id: "tag-1",
          name: "Tag 1",
          created_at: 1735689600,
          updated_at: 1735689600,
        },
      };
      localStorageMock.setItem("app_tags", JSON.stringify(testData));

      const exists = await repository.exists(createTagId("tag-1"));

      expect(exists).toBe(true);
    });

    it("should return false when tag does not exist", async () => {
      localStorageMock.setItem("app_tags", JSON.stringify({}));

      const exists = await repository.exists(createTagId("non-existent"));

      expect(exists).toBe(false);
    });
  });
});
