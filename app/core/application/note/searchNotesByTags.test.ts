import { beforeEach, describe, expect, it } from "vitest";
import { MockNoteRepository } from "@/core/adapters/mock/noteRepository";
import { createNote } from "@/core/domain/note/entity";
import type { TagName } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { searchNotesByTags } from "./searchNotesByTags";

describe("searchNotesByTags", () => {
  let mockNoteRepository: MockNoteRepository;
  let context: Context;

  beforeEach(async () => {
    mockNoteRepository = new MockNoteRepository();

    // Create test notes with different tags
    const note1Result = createNote({ content: "Note with #tag1 and #tag2" });
    const note2Result = createNote({ content: "Note with #tag1 only" });
    const note3Result = createNote({ content: "Note with #tag2 and #tag3" });

    if (note1Result.isOk()) {
      await mockNoteRepository.create(note1Result.value);
    }
    if (note2Result.isOk()) {
      await mockNoteRepository.create(note2Result.value);
    }
    if (note3Result.isOk()) {
      await mockNoteRepository.create(note3Result.value);
    }

    context = {
      noteRepository: mockNoteRepository,
    } as unknown as Context;
  });

  it("should search notes by single tag", async () => {
    const result = await searchNotesByTags(context, {
      tags: ["tag1" as TagName],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(Array.isArray(result.value.items)).toBe(true);
    }
  });

  it("should return notes matching single tag", async () => {
    const result = await searchNotesByTags(context, {
      tags: ["tag1" as TagName],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBe(2);
      for (const note of result.value.items) {
        expect(note.tags).toContain("tag1");
      }
    }
  });

  it("should search notes by multiple tags (AND search)", async () => {
    const result = await searchNotesByTags(context, {
      tags: ["tag1" as TagName, "tag2" as TagName],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBe(1);
      for (const note of result.value.items) {
        expect(note.tags).toContain("tag1");
        expect(note.tags).toContain("tag2");
      }
    }
  });

  it("should paginate search results correctly", async () => {
    const result = await searchNotesByTags(context, {
      tags: ["tag1" as TagName],
      pagination: { page: 1, limit: 1 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBe(1);
      expect(result.value.count).toBe(2);
    }
  });

  it("should return empty results for non-matching tags", async () => {
    const result = await searchNotesByTags(context, {
      tags: ["nonexistent" as TagName],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items).toEqual([]);
      expect(result.value.count).toBe(0);
    }
  });

  it("should return all notes when tag list is empty", async () => {
    const result = await searchNotesByTags(context, {
      tags: [],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBe(3);
    }
  });

  it("should return RepositoryError when database search fails", async () => {
    mockNoteRepository.setShouldFailFindByTags(true);

    const result = await searchNotesByTags(context, {
      tags: ["tag1" as TagName],
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to search notes by tags");
    }
  });
});
