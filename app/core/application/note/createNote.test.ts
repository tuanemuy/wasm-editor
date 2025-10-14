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
      content: "テストメモ",
    });

    expect(note.content).toBe("テストメモ");
    expect(saveSpy).toHaveBeenCalledWith(note);
  });

  it("空の本文でメモを作成できる", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    const saveSpy = vi
      .spyOn(repositories.noteRepository, "save")
      .mockResolvedValue();

    const note = await createNote(context, {
      content: "",
    });

    expect(note.content).toBe("");
    expect(saveSpy).toHaveBeenCalledWith(note);
  });

  it("100,000文字の本文でメモを作成できる", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    const saveSpy = vi
      .spyOn(repositories.noteRepository, "save")
      .mockResolvedValue();

    const content = "a".repeat(100000);
    const note = await createNote(context, {
      content,
    });

    expect(note.content).toBe(content);
    expect(saveSpy).toHaveBeenCalledWith(note);
  });

  it("100,001文字の本文でメモ作成時に例外が発生する", async () => {
    const content = "a".repeat(100001);

    await expect(
      createNote(context, {
        content,
      }),
    ).rejects.toThrow(BusinessRuleError);

    await expect(
      createNote(context, {
        content,
      }),
    ).rejects.toThrow("Note content exceeds maximum length");
  });

  it("1文字の本文でメモを作成できる", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    const saveSpy = vi
      .spyOn(repositories.noteRepository, "save")
      .mockResolvedValue();

    const note = await createNote(context, {
      content: "a",
    });

    expect(note.content).toBe("a");
    expect(saveSpy).toHaveBeenCalledWith(note);
  });

  it("作成されたメモのIDが自動生成される", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    vi.spyOn(repositories.noteRepository, "save").mockResolvedValue();

    const note = await createNote(context, {
      content: "テストメモ",
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
      content: "テストメモ",
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
      content: "テストメモ",
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
      content: "テストメモ",
    });

    expect(note.tagIds).toEqual([]);
  });

  it("作成されたメモがDBに保存される", async () => {
    const repositories = unitOfWorkProvider.getRepositories();
    const saveSpy = vi
      .spyOn(repositories.noteRepository, "save")
      .mockResolvedValue();

    const note = await createNote(context, {
      content: "テストメモ",
    });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(note);
  });
});
