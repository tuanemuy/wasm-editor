/**
 * Get Tags by Note Use Case Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyExportPort } from "@/core/adapters/empty/exportPort";
import { EmptyNoteQueryService } from "@/core/adapters/empty/noteQueryService";
import { EmptySettingsRepository } from "@/core/adapters/empty/settingsRepository";
import { EmptyTagExtractorPort } from "@/core/adapters/empty/tagExtractorPort";
import { EmptyTagQueryService } from "@/core/adapters/empty/tagQueryService";
import { EmptyUnitOfWorkProvider } from "@/core/adapters/empty/unitOfWork";
import { createNote } from "@/core/domain/note/entity";
import { createNoteId } from "@/core/domain/note/valueObject";
import { createTag } from "@/core/domain/tag/entity";
import type { Context } from "../context";
import { createTestContent } from "../note/test-helpers";
import { getTagsByNote } from "./getTagsByNote";

describe("getTagsByNote", () => {
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

  it("有効なメモIDでタグ一覧を取得できる", async () => {
    const tag1 = createTag({ name: "tag1" });
    const tag2 = createTag({ name: "tag2" });
    const note = createNote({
      content: createTestContent("テストメモ"),
      text: "テストメモ",
    });
    const noteWithTags = { ...note, tagIds: [tag1.id, tag2.id] };
    const repositories = unitOfWorkProvider.getRepositories();

    vi.spyOn(repositories.noteRepository, "findById").mockResolvedValue(
      noteWithTags,
    );
    vi.spyOn(repositories.tagRepository, "findByIds").mockResolvedValue([
      tag1,
      tag2,
    ]);

    const result = await getTagsByNote(context, { noteId: note.id });

    expect(result).toHaveLength(2);
    expect(result).toContain(tag1);
    expect(result).toContain(tag2);
  });

  it("存在しないメモIDで取得時に例外が発生する", async () => {
    const nonExistentId = createNoteId("non-existent-id");
    const repositories = unitOfWorkProvider.getRepositories();

    const error = new Error("Note not found");
    error.name = "NotFoundError";
    vi.spyOn(repositories.noteRepository, "findById").mockRejectedValue(error);

    await expect(
      getTagsByNote(context, { noteId: nonExistentId }),
    ).rejects.toThrow("Note not found");
  });

  it("タグがタグ名のアルファベット順でソートされる", async () => {
    const tagA = createTag({ name: "apple" });
    const tagB = createTag({ name: "banana" });
    const tagC = createTag({ name: "cherry" });
    const note = createNote({
      content: createTestContent("テストメモ"),
      text: "テストメモ",
    });
    const noteWithTags = {
      ...note,
      tagIds: [tagC.id, tagA.id, tagB.id],
    };
    const repositories = unitOfWorkProvider.getRepositories();

    vi.spyOn(repositories.noteRepository, "findById").mockResolvedValue(
      noteWithTags,
    );
    // repositoryがソートして返すことを期待
    vi.spyOn(repositories.tagRepository, "findByIds").mockResolvedValue([
      tagA,
      tagB,
      tagC,
    ]);

    const result = await getTagsByNote(context, { noteId: note.id });

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("apple");
    expect(result[1].name).toBe("banana");
    expect(result[2].name).toBe("cherry");
  });

  it("タグが関連付けられていないメモで空のリストが返される", async () => {
    const note = createNote({
      content: createTestContent("タグなしメモ"),
      text: "タグなしメモ",
    });
    const repositories = unitOfWorkProvider.getRepositories();

    vi.spyOn(repositories.noteRepository, "findById").mockResolvedValue(note);
    const findByIdsSpy = vi
      .spyOn(repositories.tagRepository, "findByIds")
      .mockResolvedValue([]);

    const result = await getTagsByNote(context, { noteId: note.id });

    expect(result).toEqual([]);
    expect(findByIdsSpy).not.toHaveBeenCalled();
  });

  it("すべてのタグ属性が正しい", async () => {
    const tag = createTag({ name: "testtag" });
    const note = createNote({
      content: createTestContent("テストメモ"),
      text: "テストメモ",
    });
    const noteWithTags = { ...note, tagIds: [tag.id] };
    const repositories = unitOfWorkProvider.getRepositories();

    vi.spyOn(repositories.noteRepository, "findById").mockResolvedValue(
      noteWithTags,
    );
    vi.spyOn(repositories.tagRepository, "findByIds").mockResolvedValue([tag]);

    const result = await getTagsByNote(context, { noteId: note.id });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    });
  });
});
