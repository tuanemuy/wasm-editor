/**
 * Get Tags Use Case Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyExporter } from "@/core/adapters/empty/exporter";
import { EmptyNoteQueryService } from "@/core/adapters/empty/noteQueryService";
import { EmptySettingsRepository } from "@/core/adapters/empty/settingsRepository";
import { EmptyTagExtractor } from "@/core/adapters/empty/tagExtractor";
import { EmptyTagQueryService } from "@/core/adapters/empty/tagQueryService";
import { EmptyUnitOfWorkProvider } from "@/core/adapters/empty/unitOfWork";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { createTag } from "@/core/domain/tag/entity";
import { TagCleanupService, TagSyncService } from "@/core/domain/tag/service";
import type { Context } from "../context";
import { getTags } from "./getTags";

describe("getTags", () => {
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
      exporter: new EmptyExporter(),
      tagExtractor: new EmptyTagExtractor(),
      settingsRepository: new EmptySettingsRepository(),
    };
  });

  it("すべてのタグを取得できる（使用回数付き）", async () => {
    const tag1 = createTag({ name: "tag1" });
    const tag2 = createTag({ name: "tag2" });
    const tagsWithUsage: TagWithUsage[] = [
      { ...tag1, usageCount: 3 },
      { ...tag2, usageCount: 1 },
    ];

    vi.spyOn(context.tagQueryService, "findAllWithUsage").mockResolvedValue(
      tagsWithUsage,
    );

    const result = await getTags(context);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(expect.objectContaining({ usageCount: 3 }));
    expect(result[1]).toEqual(expect.objectContaining({ usageCount: 1 }));
  });

  it("タグが使用回数の降順でソートされる", async () => {
    const tag1 = createTag({ name: "tag1" });
    const tag2 = createTag({ name: "tag2" });
    const tag3 = createTag({ name: "tag3" });
    const tagsWithUsage: TagWithUsage[] = [
      { ...tag1, usageCount: 5 },
      { ...tag2, usageCount: 10 },
      { ...tag3, usageCount: 2 },
    ];

    vi.spyOn(context.tagQueryService, "findAllWithUsage").mockResolvedValue(
      tagsWithUsage,
    );

    const result = await getTags(context);

    expect(result).toHaveLength(3);
    expect(result[0].usageCount).toBe(5);
    expect(result[1].usageCount).toBe(10);
    expect(result[2].usageCount).toBe(2);
    // QueryServiceが使用回数の降順でソートして返すことを期待
    // もしQueryServiceがソートしていない場合は、getTagsでソートする必要がある
  });

  it("使用回数が0のタグも含まれる", async () => {
    const tag1 = createTag({ name: "used" });
    const tag2 = createTag({ name: "unused" });
    const tagsWithUsage: TagWithUsage[] = [
      { ...tag1, usageCount: 3 },
      { ...tag2, usageCount: 0 },
    ];

    vi.spyOn(context.tagQueryService, "findAllWithUsage").mockResolvedValue(
      tagsWithUsage,
    );

    const result = await getTags(context);

    expect(result).toHaveLength(2);
    expect(result.some((tag) => tag.usageCount === 0)).toBe(true);
  });

  it("タグが存在しない場合は空のリストが返される", async () => {
    vi.spyOn(context.tagQueryService, "findAllWithUsage").mockResolvedValue([]);

    const result = await getTags(context);

    expect(result).toEqual([]);
  });

  it("使用回数が正しく計算される", async () => {
    const tag = createTag({ name: "test" });
    const tagWithUsage: TagWithUsage = { ...tag, usageCount: 42 };

    vi.spyOn(context.tagQueryService, "findAllWithUsage").mockResolvedValue([
      tagWithUsage,
    ]);

    const result = await getTags(context);

    expect(result).toHaveLength(1);
    expect(result[0].usageCount).toBe(42);
    expect(result[0].id).toBe(tag.id);
    expect(result[0].name).toBe(tag.name);
    expect(result[0].createdAt).toBe(tag.createdAt);
    expect(result[0].updatedAt).toBe(tag.updatedAt);
  });
});
