/**
 * Get Settings Use Case Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyExporter } from "@/core/adapters/empty/exporter";
import { EmptyNoteQueryService } from "@/core/adapters/empty/noteQueryService";
import { EmptySettingsRepository } from "@/core/adapters/empty/settingsRepository";
import { EmptyTagExtractor } from "@/core/adapters/empty/tagExtractor";
import { EmptyTagQueryService } from "@/core/adapters/empty/tagQueryService";
import { EmptyUnitOfWorkProvider } from "@/core/adapters/empty/unitOfWork";
import { DEFAULT_SETTINGS } from "@/core/domain/settings/entity";
import { createAutoSaveInterval } from "@/core/domain/settings/valueObject";
import { TagCleanupService, TagSyncService } from "@/core/domain/tag/service";
import type { Context } from "../context";
import { getSettings } from "./getSettings";

describe("getSettings", () => {
  let context: Context;

  beforeEach(() => {
    context = {
      unitOfWorkProvider: new EmptyUnitOfWorkProvider(),
      noteQueryService: new EmptyNoteQueryService(),
      tagQueryService: new EmptyTagQueryService(),
      tagCleanupService: new TagCleanupService(),
      tagSyncService: new TagSyncService(),
      exporter: new EmptyExporter(),
      tagExtractor: new EmptyTagExtractor(),
      settingsRepository: new EmptySettingsRepository(),
    };
  });

  it("設定を取得できる", async () => {
    const mockSettings = {
      defaultOrder: "asc" as const,
      defaultOrderBy: "updated_at" as const,
      autoSaveInterval: createAutoSaveInterval(3000),
    };

    const getSpy = vi
      .spyOn(context.settingsRepository, "get")
      .mockResolvedValue(mockSettings);

    const settings = await getSettings(context);

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(settings).toEqual(mockSettings);
  });

  it("設定が存在しない場合はデフォルト設定を返す", async () => {
    const getSpy = vi
      .spyOn(context.settingsRepository, "get")
      .mockResolvedValue(DEFAULT_SETTINGS);

    const settings = await getSettings(context);

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("すべての設定属性が正しい", async () => {
    const mockSettings = {
      defaultOrder: "desc" as const,
      defaultOrderBy: "created_at" as const,
      autoSaveInterval: createAutoSaveInterval(2000),
    };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(mockSettings);

    const settings = await getSettings(context);

    expect(settings).toHaveProperty("defaultOrder");
    expect(settings).toHaveProperty("defaultOrderBy");
    expect(settings).toHaveProperty("autoSaveInterval");
    expect(settings.defaultOrder).toBe("desc");
    expect(settings.defaultOrderBy).toBe("created_at");
    expect(settings.autoSaveInterval).toBe(2000);
  });
});
