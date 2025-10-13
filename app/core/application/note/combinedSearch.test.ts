import { beforeEach, describe, expect, it } from "vitest";
import { MockNoteRepository } from "@/core/adapters/mock/noteRepository";
import { createNote } from "@/core/domain/note/entity";
import type { TagName } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { combinedSearch } from "./combinedSearch";

describe("combinedSearch", () => {
  let mockNoteRepository: MockNoteRepository;
  let context: Context;

  beforeEach(async () => {
    mockNoteRepository = new MockNoteRepository();

    // Create test notes with different content and tags
    const note1Result = createNote({
      content: "Apple pie with #recipe and #dessert",
    });
    const note2Result = createNote({ content: "Banana smoothie with #recipe" });
    const note3Result = createNote({ content: "Apple crumble with #dessert" });
    const note4Result = createNote({ content: "Orange juice with #drink" });

    if (note1Result.isOk()) {
      await mockNoteRepository.create(note1Result.value);
    }
    if (note2Result.isOk()) {
      await mockNoteRepository.create(note2Result.value);
    }
    if (note3Result.isOk()) {
      await mockNoteRepository.create(note3Result.value);
    }
    if (note4Result.isOk()) {
      await mockNoteRepository.create(note4Result.value);
    }

    context = {
      noteRepository: mockNoteRepository,
    } as unknown as Context;
  });

  it("should search notes by query and tags combined", async () => {
    const result = await combinedSearch(context, {
      query: "apple",
      tags: ["dessert" as TagName],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(Array.isArray(result.value.items)).toBe(true);
    }
  });

  it("should return notes matching both query and tags", async () => {
    const result = await combinedSearch(context, {
      query: "apple",
      tags: ["dessert" as TagName],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBeGreaterThan(0);
      for (const note of result.value.items) {
        expect(note.content.toLowerCase()).toContain("apple");
        expect(note.tags).toContain("dessert");
      }
    }
  });

  it("should search by query only when tags are empty", async () => {
    const result = await combinedSearch(context, {
      query: "apple",
      tags: [],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBe(2);
    }
  });

  it("should search by tags only when query is empty", async () => {
    const result = await combinedSearch(context, {
      query: "",
      tags: ["recipe" as TagName],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBe(2);
    }
  });

  it("should paginate combined search results correctly", async () => {
    const result = await combinedSearch(context, {
      query: "apple",
      tags: [],
      pagination: { page: 1, limit: 1 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBe(1);
      expect(result.value.count).toBe(2);
    }
  });

  it("should return empty results when no notes match both criteria", async () => {
    const result = await combinedSearch(context, {
      query: "banana",
      tags: ["dessert" as TagName],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items).toEqual([]);
      expect(result.value.count).toBe(0);
    }
  });

  it("should return RepositoryError when database search fails", async () => {
    mockNoteRepository.setShouldFailCombinedSearch(true);

    const result = await combinedSearch(context, {
      query: "apple",
      tags: ["dessert" as TagName],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to perform combined search");
    }
  });
});
