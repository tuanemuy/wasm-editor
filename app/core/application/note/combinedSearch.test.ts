/**
 * Combined Search Use Case Tests
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
import type { Context } from "../context";
import { combinedSearch } from "./combinedSearch";

describe("combinedSearch", () => {
  let context: Context;
  let unitOfWorkProvider: EmptyUnitOfWorkProvider;

  beforeEach(() => {
    unitOfWorkProvider = new EmptyUnitOfWorkProvider();
    context = {
      unitOfWorkProvider,
      noteQueryService: new EmptyNoteQueryService(),
      tagQueryService: new EmptyTagQueryService(),
      exportPort: new EmptyExportPort(),
      tagExtractorPort: new EmptyTagExtractorPort(),
      settingsRepository: new EmptySettingsRepository(),
    };
  });

  it("全文検索のみで検索できる", async () => {
    const note1 = createNote({ content: "TypeScriptの基礎" });
    const note2 = createNote({ content: "JavaScriptの応用" });
    const _note3 = createNote({ content: "Pythonの入門" });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note1, note2],
        count: 2,
      });

    const result = await combinedSearch(context, {
      query: "Script",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note1, note2]);
    expect(result.count).toBe(2);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "Script",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("タグ検索のみで検索できる", async () => {
    const note1 = createNote({
      content: "TypeScriptメモ",
      tagIds: [createTagId("tech")],
    });
    const _note2 = createNote({
      content: "料理メモ",
      tagIds: [createTagId("cooking")],
    });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note1],
        count: 1,
      });

    const result = await combinedSearch(context, {
      query: "",
      tagIds: [createTagId("tech")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note1]);
    expect(result.count).toBe(1);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "",
      tagIds: [createTagId("tech")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("全文検索とタグ検索のAND検索ができる", async () => {
    const note1 = createNote({
      content: "TypeScriptメモ",
      tagIds: [createTagId("tech")],
    });
    const _note2 = createNote({
      content: "JavaScriptメモ",
      tagIds: [createTagId("tech")],
    });
    const _note3 = createNote({
      content: "料理メモ",
      tagIds: [createTagId("cooking")],
    });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note1],
        count: 1,
      });

    const result = await combinedSearch(context, {
      query: "TypeScript",
      tagIds: [createTagId("tech")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note1]);
    expect(result.count).toBe(1);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "TypeScript",
      tagIds: [createTagId("tech")],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("空のクエリと空のタグリストで全件取得できる", async () => {
    const note1 = createNote({ content: "メモ1" });
    const note2 = createNote({ content: "メモ2" });
    const note3 = createNote({ content: "メモ3" });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note3, note2, note1],
        count: 3,
      });

    const result = await combinedSearch(context, {
      query: "",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note3, note2, note1]);
    expect(result.count).toBe(3);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("部分一致検索ができる", async () => {
    const note1 = createNote({ content: "TypeScriptの基礎知識" });
    const _note2 = createNote({ content: "JavaScriptの基礎" });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note1],
        count: 1,
      });

    const result = await combinedSearch(context, {
      query: "Type",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note1]);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "Type",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("大文字小文字を区別しない検索ができる", async () => {
    const note1 = createNote({ content: "TypeScript Tutorial" });
    const _note2 = createNote({ content: "Python Guide" });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note1],
        count: 1,
      });

    const result = await combinedSearch(context, {
      query: "typescript",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note1]);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "typescript",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("複数タグでAND検索ができる", async () => {
    const note1 = createNote({
      content: "TypeScriptメモ",
      tagIds: [createTagId("tech"), createTagId("programming")],
    });
    const _note2 = createNote({
      content: "料理メモ",
      tagIds: [createTagId("cooking")],
    });
    const _note3 = createNote({
      content: "プログラミングメモ",
      tagIds: [createTagId("programming")],
    });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note1],
        count: 1,
      });

    const result = await combinedSearch(context, {
      query: "",
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

  it("検索結果のソートが正しい", async () => {
    const note1 = createNote({ content: "メモ1" });
    const note2 = createNote({ content: "メモ2" });
    const note3 = createNote({ content: "メモ3" });

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [note1, note2, note3],
        count: 3,
      });

    const result = await combinedSearch(context, {
      query: "メモ",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "asc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note1, note2, note3]);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "メモ",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "asc",
      orderBy: "created_at",
    });
  });

  it("検索結果のページネーションが正しい", async () => {
    const notes = Array.from({ length: 25 }, (_, i) =>
      createNote({ content: `メモ${i + 1}` }),
    );

    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: notes.slice(10, 20),
        count: 25,
      });

    const result = await combinedSearch(context, {
      query: "メモ",
      tagIds: [],
      pagination: { page: 2, limit: 10 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items.length).toBe(10);
    expect(result.count).toBe(25);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "メモ",
      tagIds: [],
      pagination: { page: 2, limit: 10 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("検索結果が空の場合を処理できる", async () => {
    const searchSpy = vi
      .spyOn(context.noteQueryService, "combinedSearch")
      .mockResolvedValue({
        items: [],
        count: 0,
      });

    const result = await combinedSearch(context, {
      query: "存在しない検索語",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([]);
    expect(result.count).toBe(0);
    expect(searchSpy).toHaveBeenCalledWith({
      query: "存在しない検索語",
      tagIds: [],
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });
});
