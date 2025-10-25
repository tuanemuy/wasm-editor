/**
 * Get Notes Use Case Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyExportPort } from "@/core/adapters/empty/exportPort";
import { EmptyNoteQueryService } from "@/core/adapters/empty/noteQueryService";
import { EmptySettingsRepository } from "@/core/adapters/empty/settingsRepository";
import { EmptyTagExtractorPort } from "@/core/adapters/empty/tagExtractorPort";
import { EmptyTagQueryService } from "@/core/adapters/empty/tagQueryService";
import { EmptyUnitOfWorkProvider } from "@/core/adapters/empty/unitOfWork";
import type { Note } from "@/core/domain/note/entity";
import { createNote } from "@/core/domain/note/entity";
import type { PaginationResult } from "@/lib/pagination";
import type { Context } from "../context";
import { getNotes } from "./getNotes";

describe("getNotes", () => {
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

  it("デフォルトのソート順（降順）でメモ一覧を取得できる", async () => {
    const note1 = createNote({ content: "メモ1" });
    const note2 = createNote({ content: "メモ2" });
    const note3 = createNote({ content: "メモ3" });

    const repositories = unitOfWorkProvider.getRepositories();
    const findAllSpy = vi
      .spyOn(repositories.noteRepository, "findAll")
      .mockResolvedValue({
        items: [note3, note2, note1],
        count: 3,
      });

    const result = await getNotes(context, {
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note3, note2, note1]);
    expect(findAllSpy).toHaveBeenCalledWith({
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("デフォルトのソート対象（作成日時）でメモ一覧を取得できる", async () => {
    const note1 = createNote({ content: "メモ1" });
    const note2 = createNote({ content: "メモ2" });

    const repositories = unitOfWorkProvider.getRepositories();
    const findAllSpy = vi
      .spyOn(repositories.noteRepository, "findAll")
      .mockResolvedValue({
        items: [note2, note1],
        count: 2,
      });

    await getNotes(context, {
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(findAllSpy).toHaveBeenCalledWith({
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("昇順でメモ一覧を取得できる", async () => {
    const note1 = createNote({ content: "メモ1" });
    const note2 = createNote({ content: "メモ2" });
    const note3 = createNote({ content: "メモ3" });

    const repositories = unitOfWorkProvider.getRepositories();
    const findAllSpy = vi
      .spyOn(repositories.noteRepository, "findAll")
      .mockResolvedValue({
        items: [note1, note2, note3],
        count: 3,
      });

    const result = await getNotes(context, {
      pagination: { page: 1, limit: 20 },
      order: "asc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note1, note2, note3]);
    expect(findAllSpy).toHaveBeenCalledWith({
      pagination: { page: 1, limit: 20 },
      order: "asc",
      orderBy: "created_at",
    });
  });

  it("降順でメモ一覧を取得できる", async () => {
    const note1 = createNote({ content: "メモ1" });
    const note2 = createNote({ content: "メモ2" });
    const note3 = createNote({ content: "メモ3" });

    const repositories = unitOfWorkProvider.getRepositories();
    const findAllSpy = vi
      .spyOn(repositories.noteRepository, "findAll")
      .mockResolvedValue({
        items: [note3, note2, note1],
        count: 3,
      });

    const result = await getNotes(context, {
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([note3, note2, note1]);
    expect(findAllSpy).toHaveBeenCalledWith({
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("作成日時でソートしたメモ一覧を取得できる", async () => {
    const note1 = createNote({ content: "メモ1" });
    const note2 = createNote({ content: "メモ2" });

    const repositories = unitOfWorkProvider.getRepositories();
    const findAllSpy = vi
      .spyOn(repositories.noteRepository, "findAll")
      .mockResolvedValue({
        items: [note2, note1],
        count: 2,
      });

    await getNotes(context, {
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(findAllSpy).toHaveBeenCalledWith({
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("更新日時でソートしたメモ一覧を取得できる", async () => {
    const note1 = createNote({ content: "メモ1" });
    const note2 = createNote({ content: "メモ2" });

    const repositories = unitOfWorkProvider.getRepositories();
    const findAllSpy = vi
      .spyOn(repositories.noteRepository, "findAll")
      .mockResolvedValue({
        items: [note2, note1],
        count: 2,
      });

    await getNotes(context, {
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "updated_at",
    });

    expect(findAllSpy).toHaveBeenCalledWith({
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "updated_at",
    });
  });

  it("ページネーション付きでメモ一覧を取得できる", async () => {
    const notes: Note[] = [];
    for (let i = 0; i < 25; i++) {
      notes.push(createNote({ content: `メモ${i + 1}` }));
    }

    const repositories = unitOfWorkProvider.getRepositories();
    const findAllSpy = vi
      .spyOn(repositories.noteRepository, "findAll")
      .mockResolvedValue({
        items: notes.slice(10, 20),
        count: 25,
      });

    const result = await getNotes(context, {
      pagination: { page: 2, limit: 10 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items.length).toBe(10);
    expect(result.count).toBe(25);
    expect(findAllSpy).toHaveBeenCalledWith({
      pagination: { page: 2, limit: 10 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("デフォルトのページサイズ（20件）でメモ一覧を取得できる", async () => {
    const notes: Note[] = [];
    for (let i = 0; i < 20; i++) {
      notes.push(createNote({ content: `メモ${i + 1}` }));
    }

    const repositories = unitOfWorkProvider.getRepositories();
    const findAllSpy = vi
      .spyOn(repositories.noteRepository, "findAll")
      .mockResolvedValue({
        items: notes,
        count: 25,
      });

    const result = await getNotes(context, {
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items.length).toBe(20);
    expect(findAllSpy).toHaveBeenCalledWith({
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });
  });

  it("空のメモ一覧を取得できる", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    vi.spyOn(repositories.noteRepository, "findAll").mockResolvedValue({
      items: [],
      count: 0,
    });

    const result = await getNotes(context, {
      pagination: { page: 1, limit: 20 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items).toEqual([]);
    expect(result.count).toBe(0);
  });

  it("ページネーション情報が正しい", async () => {
    const notes: Note[] = [];
    for (let i = 0; i < 15; i++) {
      notes.push(createNote({ content: `メモ${i + 1}` }));
    }

    const repositories = unitOfWorkProvider.getRepositories();
    vi.spyOn(repositories.noteRepository, "findAll").mockResolvedValue({
      items: notes.slice(0, 10),
      count: 15,
    });

    const result: PaginationResult<Note> = await getNotes(context, {
      pagination: { page: 1, limit: 10 },
      order: "desc",
      orderBy: "created_at",
    });

    expect(result.items.length).toBe(10);
    expect(result.count).toBe(15);
    // Total pages should be 2 (15 items, 10 per page)
    // First page should have 10 items
  });
});
