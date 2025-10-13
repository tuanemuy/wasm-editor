import { beforeEach, describe, expect, it } from "vitest";
import { MockNoteRepository } from "@/core/adapters/mock/noteRepository";
import type { Context } from "../context";
import { createNote } from "./createNote";

describe("createNote", () => {
  let mockNoteRepository: MockNoteRepository;
  let context: Context;

  beforeEach(() => {
    mockNoteRepository = new MockNoteRepository();

    context = {
      noteRepository: mockNoteRepository,
    } as unknown as Context;
  });

  it("should create note with empty content", async () => {
    const result = await createNote(context, { content: "" });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.content).toBe("");
    }
  });

  it("should create note with valid Markdown content", async () => {
    const content = "# Title\n\nThis is a test note.";
    const result = await createNote(context, { content });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.content).toBe(content);
    }
  });

  it("should create note with tags and auto-extract tags from content", async () => {
    const content = "Test note with #tag1";
    const result = await createNote(context, { content });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.tags).toContain("tag1");
    }
  });

  it("should create note with multiple tags and extract all tags", async () => {
    const content = "Test note with #tag1 and #tag2 and #tag3";
    const result = await createNote(context, { content });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.tags.length).toBeGreaterThanOrEqual(3);
      expect(result.value.tags).toContain("tag1");
      expect(result.value.tags).toContain("tag2");
      expect(result.value.tags).toContain("tag3");
    }
  });

  it("should auto-generate UUID v7 ID on creation", async () => {
    const result = await createNote(context, { content: "Test" });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBeDefined();
      expect(typeof result.value.id).toBe("string");
      expect(result.value.id.length).toBeGreaterThan(0);
    }
  });

  it("should auto-set createdAt and updatedAt on creation", async () => {
    const result = await createNote(context, { content: "Test" });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.createdAt).toBeInstanceOf(Date);
      expect(result.value.updatedAt).toBeInstanceOf(Date);
    }
  });

  it("should create note with long content (10000+ characters)", async () => {
    const longContent = "a".repeat(10000);
    const result = await createNote(context, { content: longContent });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.content.length).toBe(10000);
    }
  });

  it("should return RepositoryError when database save fails", async () => {
    mockNoteRepository.setShouldFailCreate(true);

    const result = await createNote(context, { content: "Test" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to create note");
    }
  });
});
