import { beforeEach, describe, expect, it } from "vitest";
import { MockNoteRepository } from "@/core/adapters/mock/noteRepository";
import { createNote } from "@/core/domain/note/entity";
import type { Context } from "../context";
import { searchNotes } from "./searchNotes";

describe("searchNotes", () => {
  let mockNoteRepository: MockNoteRepository;
  let context: Context;

  beforeEach(async () => {
    mockNoteRepository = new MockNoteRepository();

    // Create test notes with different content
    const note1Result = createNote({ content: "Apple pie recipe" });
    const note2Result = createNote({ content: "Banana smoothie instructions" });
    const note3Result = createNote({ content: "Apple crumble dessert" });

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

  it("should search notes by query text", async () => {
    const result = await searchNotes(context, {
      query: "apple",
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(Array.isArray(result.value.items)).toBe(true);
    }
  });

  it("should return matching notes for search query", async () => {
    const result = await searchNotes(context, {
      query: "apple",
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBe(2);
      expect(result.value.count).toBe(2);
    }
  });

  it("should paginate search results correctly", async () => {
    const result = await searchNotes(context, {
      query: "apple",
      pagination: { page: 1, limit: 1 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBe(1);
      expect(result.value.count).toBe(2);
    }
  });

  it("should return empty results for non-matching query", async () => {
    const result = await searchNotes(context, {
      query: "nonexistent",
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items).toEqual([]);
      expect(result.value.count).toBe(0);
    }
  });

  it("should search case-insensitively", async () => {
    const result = await searchNotes(context, {
      query: "APPLE",
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBeGreaterThan(0);
    }
  });

  it("should return RepositoryError when database search fails", async () => {
    mockNoteRepository.setShouldFailSearch(true);

    const result = await searchNotes(context, {
      query: "apple",
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to search notes");
    }
  });
});
