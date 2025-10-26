/**
 * Cleanup Unused Tags Use Case Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyExportPort } from "@/core/adapters/empty/exportPort";
import { EmptyNoteQueryService } from "@/core/adapters/empty/noteQueryService";
import { EmptySettingsRepository } from "@/core/adapters/empty/settingsRepository";
import { EmptyTagExtractorPort } from "@/core/adapters/empty/tagExtractorPort";
import { EmptyTagQueryService } from "@/core/adapters/empty/tagQueryService";
import { EmptyUnitOfWorkProvider } from "@/core/adapters/empty/unitOfWork";
import { createTag } from "@/core/domain/tag/entity";
import type { Context } from "../context";
import { cleanupUnusedTags } from "./cleanupUnusedTags";

describe("cleanupUnusedTags", () => {
  let context: Context;
  let unitOfWorkProvider: EmptyUnitOfWorkProvider;

  beforeEach(() => {
    unitOfWorkProvider = new EmptyUnitOfWorkProvider();
    context = {
      unitOfWorkProvider,
      noteQueryService: new EmptyNoteQueryService(),
      tagQueryService: new EmptyTagQueryService(),
      exporter: new EmptyExportPort(),
      tagExtractor: new EmptyTagExtractorPort(),
      settingsRepository: new EmptySettingsRepository(),
    };
  });

  it("使用回数が0のタグが削除される", async () => {
    const unusedTag = createTag({ name: "unused" });
    const repositories = unitOfWorkProvider.getRepositories();

    vi.spyOn(context.tagQueryService, "findUnused").mockResolvedValue([
      unusedTag,
    ]);
    const deleteSpy = vi
      .spyOn(repositories.tagRepository, "deleteMany")
      .mockResolvedValue();

    const deletedIds = await cleanupUnusedTags(context);

    expect(deletedIds).toHaveLength(1);
    expect(deletedIds[0]).toBe(unusedTag.id);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith([unusedTag.id]);
  });

  it("使用回数が1以上のタグが削除されない", async () => {
    const repositories = unitOfWorkProvider.getRepositories();

    // 未使用タグが存在しない
    vi.spyOn(context.tagQueryService, "findUnused").mockResolvedValue([]);
    const deleteSpy = vi
      .spyOn(repositories.tagRepository, "deleteMany")
      .mockResolvedValue();

    const deletedIds = await cleanupUnusedTags(context);

    expect(deletedIds).toHaveLength(0);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("複数の未使用タグが一括削除される", async () => {
    const unusedTag1 = createTag({ name: "unused1" });
    const unusedTag2 = createTag({ name: "unused2" });
    const unusedTag3 = createTag({ name: "unused3" });
    const repositories = unitOfWorkProvider.getRepositories();

    vi.spyOn(context.tagQueryService, "findUnused").mockResolvedValue([
      unusedTag1,
      unusedTag2,
      unusedTag3,
    ]);
    const deleteSpy = vi
      .spyOn(repositories.tagRepository, "deleteMany")
      .mockResolvedValue();

    const deletedIds = await cleanupUnusedTags(context);

    expect(deletedIds).toHaveLength(3);
    expect(deletedIds).toContain(unusedTag1.id);
    expect(deletedIds).toContain(unusedTag2.id);
    expect(deletedIds).toContain(unusedTag3.id);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith([
      unusedTag1.id,
      unusedTag2.id,
      unusedTag3.id,
    ]);
  });

  it("未使用タグが存在しない場合はエラーが発生しない", async () => {
    const repositories = unitOfWorkProvider.getRepositories();

    vi.spyOn(context.tagQueryService, "findUnused").mockResolvedValue([]);
    const deleteSpy = vi
      .spyOn(repositories.tagRepository, "deleteMany")
      .mockResolvedValue();

    const deletedIds = await cleanupUnusedTags(context);

    expect(deletedIds).toHaveLength(0);
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
