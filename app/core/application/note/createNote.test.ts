/**
 * Create Note Use Case Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyExportPort } from "@/core/adapters/empty/exportPort";
import { EmptyNoteQueryService } from "@/core/adapters/empty/noteQueryService";
import { EmptySettingsRepository } from "@/core/adapters/empty/settingsRepository";
import { EmptyTagExtractorPort } from "@/core/adapters/empty/tagExtractorPort";
import { EmptyTagQueryService } from "@/core/adapters/empty/tagQueryService";
import { EmptyUnitOfWorkProvider } from "@/core/adapters/empty/unitOfWork";
import { BusinessRuleError } from "@/core/domain/error";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { TagCleanupService, TagSyncService } from "@/core/domain/tag/service";
import type { Context } from "../context";
import { createNote } from "./createNote";

describe("createNote", () => {
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

  it("有効な本文でメモを作成できる", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    const saveSpy = vi
      .spyOn(repositories.noteRepository, "save")
      .mockResolvedValue();

    const note = await createNote(context, {
      content: { type: "doc", content: [] },
      text: "テストメモ",
    });

    expect(note.text).toBe("テストメモ");
    expect(saveSpy).toHaveBeenCalledWith(note);
  });

  it("空のテキストでメモを作成できる（UX改善のため）", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    const saveSpy = vi
      .spyOn(repositories.noteRepository, "save")
      .mockResolvedValue();

    const note = await createNote(context, {
      content: { type: "doc", content: [] },
      text: "",
    });

    expect(note.text).toBe("");
    expect(saveSpy).toHaveBeenCalledWith(note);
  });

  it("100,000文字のテキストでメモを作成できる", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    const saveSpy = vi
      .spyOn(repositories.noteRepository, "save")
      .mockResolvedValue();

    const text = "a".repeat(100000);
    const note = await createNote(context, {
      content: { type: "doc", content: [] },
      text,
    });

    expect(note.text).toBe(text);
    expect(saveSpy).toHaveBeenCalledWith(note);
  });

  it("100,001文字のテキストでメモ作成時に例外が発生する", async () => {
    const text = "a".repeat(100001);

    await expect(
      createNote(context, {
        content: { type: "doc", content: [] },
        text,
      }),
    ).rejects.toThrow(BusinessRuleError);

    await expect(
      createNote(context, {
        content: { type: "doc", content: [] },
        text,
      }),
    ).rejects.toThrow("Note text exceeds maximum length");
  });

  it("1文字のテキストでメモを作成できる", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    const saveSpy = vi
      .spyOn(repositories.noteRepository, "save")
      .mockResolvedValue();

    const note = await createNote(context, {
      content: { type: "doc", content: [] },
      text: "a",
    });

    expect(note.text).toBe("a");
    expect(saveSpy).toHaveBeenCalledWith(note);
  });

  it("作成されたメモのIDが自動生成される", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    vi.spyOn(repositories.noteRepository, "save").mockResolvedValue();

    const note = await createNote(context, {
      content: { type: "doc", content: [] },
      text: "テストメモ",
    });

    expect(note.id).toBeDefined();
    expect(typeof note.id).toBe("string");
    expect(note.id.length).toBeGreaterThan(0);
  });

  it("作成されたメモのcreatedAtが設定される", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    vi.spyOn(repositories.noteRepository, "save").mockResolvedValue();

    const before = new Date();
    const note = await createNote(context, {
      content: { type: "doc", content: [] },
      text: "テストメモ",
    });
    const after = new Date();

    expect(note.createdAt).toBeInstanceOf(Date);
    expect(note.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(note.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("作成されたメモのupdatedAtが設定される", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    vi.spyOn(repositories.noteRepository, "save").mockResolvedValue();

    const before = new Date();
    const note = await createNote(context, {
      content: { type: "doc", content: [] },
      text: "テストメモ",
    });
    const after = new Date();

    expect(note.updatedAt).toBeInstanceOf(Date);
    expect(note.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(note.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("作成されたメモのtagIdsが空配列である", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    vi.spyOn(repositories.noteRepository, "save").mockResolvedValue();

    const note = await createNote(context, {
      content: { type: "doc", content: [] },
      text: "テストメモ",
    });

    expect(note.tagIds).toEqual([]);
  });

  it("作成されたメモがDBに保存される", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    const saveSpy = vi
      .spyOn(repositories.noteRepository, "save")
      .mockResolvedValue();

    const note = await createNote(context, {
      content: { type: "doc", content: [] },
      text: "テストメモ",
    });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(note);
  });

  it("無効なcontentでメモ作成時に例外が発生する（typeフィールドなし）", async () => {
    await expect(
      createNote(context, {
        content: { content: [] } as unknown as StructuredContent,
        text: "テストメモ",
      }),
    ).rejects.toThrow(BusinessRuleError);

    await expect(
      createNote(context, {
        content: { content: [] } as unknown as StructuredContent,
        text: "テストメモ",
      }),
    ).rejects.toThrow("Note content must have required field 'type'");
  });

  it("contentがnullの場合に例外が発生する", async () => {
    await expect(
      createNote(context, {
        content: null as unknown as StructuredContent,
        text: "テストメモ",
      }),
    ).rejects.toThrow(BusinessRuleError);

    await expect(
      createNote(context, {
        content: null as unknown as StructuredContent,
        text: "テストメモ",
      }),
    ).rejects.toThrow("Note content must be a valid JSON object");
  });
});
