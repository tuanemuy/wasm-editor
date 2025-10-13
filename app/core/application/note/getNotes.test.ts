import { beforeEach, describe, expect, it } from "vitest";
import { MockNoteRepository } from "@/core/adapters/mock/noteRepository";
import { createNote } from "@/core/domain/note/entity";
import type { Context } from "../context";
import { getNotes } from "./getNotes";

describe("getNotes", () => {
  let mockNoteRepository: MockNoteRepository;
  let context: Context;

  beforeEach(async () => {
    mockNoteRepository = new MockNoteRepository();

    // Create test notes
    const note1Result = createNote({ content: "First note" });
    const note2Result = createNote({ content: "Second note" });
    const note3Result = createNote({ content: "Third note" });

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

  it("should get note list", async () => {
    const result = await getNotes(context, {
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(Array.isArray(result.value.items)).toBe(true);
      expect(typeof result.value.count).toBe("number");
    }
  });

  it("should paginate correctly", async () => {
    const result = await getNotes(context, {
      pagination: { page: 1, limit: 2 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items.length).toBe(2);
      expect(result.value.count).toBe(3);
    }
  });

  it("should get notes sorted by creation date ascending", async () => {
    const result = await getNotes(context, {
      pagination: { page: 1, limit: 10 },
      sortBy: "created_asc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk() && result.value.items.length > 1) {
      for (let i = 0; i < result.value.items.length - 1; i++) {
        const current = result.value.items[i].createdAt.getTime();
        const next = result.value.items[i + 1].createdAt.getTime();
        expect(current).toBeLessThanOrEqual(next);
      }
    }
  });

  it("should get notes sorted by creation date descending", async () => {
    const result = await getNotes(context, {
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk() && result.value.items.length > 1) {
      for (let i = 0; i < result.value.items.length - 1; i++) {
        const current = result.value.items[i].createdAt.getTime();
        const next = result.value.items[i + 1].createdAt.getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  it("should get notes sorted by update date ascending", async () => {
    const result = await getNotes(context, {
      pagination: { page: 1, limit: 10 },
      sortBy: "updated_asc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk() && result.value.items.length > 1) {
      for (let i = 0; i < result.value.items.length - 1; i++) {
        const current = result.value.items[i].updatedAt.getTime();
        const next = result.value.items[i + 1].updatedAt.getTime();
        expect(current).toBeLessThanOrEqual(next);
      }
    }
  });

  it("should get notes sorted by update date descending", async () => {
    const result = await getNotes(context, {
      pagination: { page: 1, limit: 10 },
      sortBy: "updated_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk() && result.value.items.length > 1) {
      for (let i = 0; i < result.value.items.length - 1; i++) {
        const current = result.value.items[i].updatedAt.getTime();
        const next = result.value.items[i + 1].updatedAt.getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  it("should return correct total count", async () => {
    const result = await getNotes(context, {
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.count).toBe(3);
    }
  });

  it("should return empty array and count=0 when no notes exist", async () => {
    mockNoteRepository.reset();

    const result = await getNotes(context, {
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items).toEqual([]);
      expect(result.value.count).toBe(0);
    }
  });

  it("should return empty array when limit is 0", async () => {
    const result = await getNotes(context, {
      pagination: { page: 1, limit: 0 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items).toEqual([]);
    }
  });

  it("should return empty array when page exceeds total count", async () => {
    const result = await getNotes(context, {
      pagination: { page: 10, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items).toEqual([]);
    }
  });

  it("should return RepositoryError when database get fails", async () => {
    mockNoteRepository.setShouldFailFindAll(true);

    const result = await getNotes(context, {
      pagination: { page: 1, limit: 10 },
      sortBy: "created_desc",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get notes");
    }
  });
});
