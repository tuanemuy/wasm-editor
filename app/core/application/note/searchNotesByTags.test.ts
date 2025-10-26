/**
 * Search Notes by Tags Use Case Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyExportPort } from "@/core/adapters/empty/exportPort";
import { EmptyNoteQueryService } from "@/core/adapters/empty/noteQueryService";
import { EmptySettingsRepository } from "@/core/adapters/empty/settingsRepository";
import { EmptyTagExtractorPort } from "@/core/adapters/empty/tagExtractorPort";
import { EmptyTagQueryService } from "@/core/adapters/empty/tagQueryService";
import { EmptyUnitOfWorkProvider } from "@/core/adapters/empty/unitOfWork";
import { createNote } from "@/core/domain/note/entity";
import { createTagId } from "@/core/domain/tag/valueObject";
import { TagCleanupService, TagSyncService } from "@/core/domain/tag/service";
import type { Context } from "../context";
import { searchNotesByTags } from "./searchNotesByTags";
import { createTestContent } from "./test-helpers";

describe("searchNotesByTags", () => {
  let context: Context;
  let unitOfWorkProvider: EmptyUnitOfWorkProvider;

  beforeEach(() => {
    unitOfWorkProvider = new EmptyUnitOfWorkProvider();
    context = {
      unitOfWorkProvider,
      noteQueryService: new EmptyNoteQueryService(),
      tagQueryService: new EmptyTagQueryService(),
      tagCleanupService: new TagCleanupService(),
      tagSyncService: new TagSyncService(),
      exportPort: new EmptyExportPort(),
      tagExtractorPort: new EmptyTagExtractorPort(),
      settingsRepository: new EmptySettingsRepository(),
    };
  });

  it("複数のタグ名でメモを検索できる（AND検索）", async () => {
    const note1 = createNote({
      content: createTestContent("TypeScriptメモ"),
      text: "TypeScriptメモ",
      tagIds: [createTagId("tech"), createTagId("programming")],
    });
    const _note2 = createNote({
      content: createTestContent("料理メモ"),
      text: "料理メモ",
      tagIds: [createTagId("cooking")],
    });
    const _note3 = createNote({
      content: createTestContent("プログラミングメモ"),
      text: "プログラミングメモ",
      tagIds: [createTagId("programming")],
    });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note1],
        count: 1,
      });

    const result = await searchNotesByTags(context, {
      tagIds: [createTagId("tech"), createTagId("programming")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note1]);
    expect(result.count).toBe(1);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "",
      tagIds: [createTagId("tech"), createTagId("programming")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("すべてのタグを持つメモのみが返される", async () => {
    const note1 = createNote({
      content: createTestContent("メモ1"),
      text: "メモ1",
      tagIds: [createTagId("tag1"), createTagId("tag2"), createTagId("tag3")],
    });
    const _note2 = createNote({
      content: createTestContent("メモ2"),
      text: "メモ2",
      tagIds: [createTagId("tag1"), createTagId("tag2")],
    });
    const _note3 = createNote({
      content: createTestContent("メモ3"),
      text: "メモ3",
      tagIds: [createTagId("tag1")],
    });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note1],
        count: 1,
      });

    const result = await searchNotesByTags(context, {
      tagIds: [createTagId("tag1"), createTagId("tag2"), createTagId("tag3")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note1]);
    expect(result.count).toBe(1);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "",
      tagIds: [createTagId("tag1"), createTagId("tag2"), createTagId("tag3")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("いずれかのタグが存在しない場合は空の結果が返される", async () => {
    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [],
        count: 0,
      });

    const result = await searchNotesByTags(context, {
      tagIds: [createTagId("existing-tag"), createTagId("non-existent-tag")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([]);
    expect(result.count).toBe(0);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "",
      tagIds: [createTagId("existing-tag"), createTagId("non-existent-tag")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("大文字小文字を区別して検索される", async () => {
    const _note1 = createNote({
      content: createTestContent("メモ1"),
      text: "メモ1",
      tagIds: [createTagId("Tech"), createTagId("Web")],
    });
    const note2 = createNote({
      content: createTestContent("メモ2"),
      text: "メモ2",
      tagIds: [createTagId("tech"), createTagId("web")],
    });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note2],
        count: 1,
      });

    const result = await searchNotesByTags(context, {
      tagIds: [createTagId("tech"), createTagId("web")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note2]);
    expect(result.count).toBe(1);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "",
      tagIds: [createTagId("tech"), createTagId("web")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("検索結果のソートが正しい", async () => {
    const note1 = createNote({
      content: createTestContent("メモ1"),
      text: "メモ1",
      tagIds: [createTagId("tech"), createTagId("programming")],
    });
    const note2 = createNote({
      content: createTestContent("メモ2"),
      text: "メモ2",
      tagIds: [createTagId("tech"), createTagId("programming")],
    });
    const note3 = createNote({
      content: createTestContent("メモ3"),
      text: "メモ3",
      tagIds: [createTagId("tech"), createTagId("programming")],
    });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note1, note2, note3],
        count: 3,
      });

    const result = await searchNotesByTags(context, {
      tagIds: [createTagId("tech"), createTagId("programming")],
      pagination: { page: 1, limit: 20 },
      order: "asc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note1, note2, note3]);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "",
      tagIds: [createTagId("tech"), createTagId("programming")],
      pagination: { page: 1, limit: 20 },
      order: "asc",
      orderBy: "created_at",
    });
  });

  it("検索結果のページネーションが正しい", async () => {
    const notes = Array.from({ length: 25 }, (_, i) =>
      createNote({
        content: createTestContent(`メモ${i + 1}`),
        text: `メモ${i + 1}`,
        tagIds: [createTagId("tech"), createTagId("programming")],
      }),
    );

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: notes.slice(10, 20),
        count: 25,
      });

    const result = await searchNotesByTags(context, {
      tagIds: [createTagId("tech"), createTagId("programming")],
      pagination: { page: 2, limit: 10 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items.length).toBe(10);
    expect(result.count).toBe(25);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "",
      tagIds: [createTagId("tech"), createTagId("programming")],
      pagination: { page: 2, limit: 10 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("空のタグ名リストで空の結果が返される", async () => {
    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [],
        count: 0,
      });

    const result = await searchNotesByTags(context, {
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([]);
    expect(result.count).toBe(0);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });
});
