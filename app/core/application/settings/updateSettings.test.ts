/**
 * Update Settings Use Case Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyExportPort } from "@/core/adapters/empty/exportPort";
import { EmptyNoteQueryService } from "@/core/adapters/empty/noteQueryService";
import { EmptySettingsRepository } from "@/core/adapters/empty/settingsRepository";
import { EmptyTagExtractorPort } from "@/core/adapters/empty/tagExtractorPort";
import { EmptyTagQueryService } from "@/core/adapters/empty/tagQueryService";
import { EmptyUnitOfWorkProvider } from "@/core/adapters/empty/unitOfWork";
import { BusinessRuleError } from "@/core/domain/error";
import { DEFAULT_SETTINGS } from "@/core/domain/settings/entity";
import { createAutoSaveInterval } from "@/core/domain/settings/valueObject";
import { TagCleanupService, TagSyncService } from "@/core/domain/tag/service";
import type { Context } from "../context";
import { updateSettings } from "./updateSettings";

describe("updateSettings", () => {
  let context: Context;

  beforeEach(() => {
    context = {
      unitOfWorkProvider: new EmptyUnitOfWorkProvider(),
      noteQueryService: new EmptyNoteQueryService(),
      tagQueryService: new EmptyTagQueryService(),
      tagCleanupService: new TagCleanupService(),
      tagSyncService: new TagSyncService(),
      exportPort: new EmptyExportPort(),
      tagExtractorPort: new EmptyTagExtractorPort(),
      settingsRepository: new EmptySettingsRepository(),
    };
  });

  it("デフォルトソート順を更新できる", async () => {
    const currentSettings = { ...DEFAULT_SETTINGS };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );
    const saveSpy = vi
      .spyOn(context.settingsRepository, "save")
      .mockResolvedValue();

    const updatedSettings = await updateSettings(context, {
      defaultOrder: "asc",
    });

    expect(updatedSettings.defaultOrder).toBe("asc");
    expect(updatedSettings.defaultOrderBy).toBe(currentSettings.defaultOrderBy);
    expect(updatedSettings.autoSaveInterval).toBe(
      currentSettings.autoSaveInterval,
    );
    expect(saveSpy).toHaveBeenCalledWith(updatedSettings);
  });

  it("デフォルトソート対象を更新できる", async () => {
    const currentSettings = { ...DEFAULT_SETTINGS };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );
    const saveSpy = vi
      .spyOn(context.settingsRepository, "save")
      .mockResolvedValue();

    const updatedSettings = await updateSettings(context, {
      defaultOrderBy: "updated_at",
    });

    expect(updatedSettings.defaultOrderBy).toBe("updated_at");
    expect(updatedSettings.defaultOrder).toBe(currentSettings.defaultOrder);
    expect(updatedSettings.autoSaveInterval).toBe(
      currentSettings.autoSaveInterval,
    );
    expect(saveSpy).toHaveBeenCalledWith(updatedSettings);
  });

  it("自動保存間隔を更新できる", async () => {
    const currentSettings = { ...DEFAULT_SETTINGS };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );
    const saveSpy = vi
      .spyOn(context.settingsRepository, "save")
      .mockResolvedValue();

    const updatedSettings = await updateSettings(context, {
      autoSaveInterval: 5000,
    });

    expect(updatedSettings.autoSaveInterval).toBe(5000);
    expect(updatedSettings.defaultOrder).toBe(currentSettings.defaultOrder);
    expect(updatedSettings.defaultOrderBy).toBe(currentSettings.defaultOrderBy);
    expect(saveSpy).toHaveBeenCalledWith(updatedSettings);
  });

  it("複数のフィールドを同時に更新できる", async () => {
    const currentSettings = { ...DEFAULT_SETTINGS };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );
    const saveSpy = vi
      .spyOn(context.settingsRepository, "save")
      .mockResolvedValue();

    const updatedSettings = await updateSettings(context, {
      defaultOrder: "asc",
      defaultOrderBy: "updated_at",
      autoSaveInterval: 3000,
    });

    expect(updatedSettings.defaultOrder).toBe("asc");
    expect(updatedSettings.defaultOrderBy).toBe("updated_at");
    expect(updatedSettings.autoSaveInterval).toBe(3000);
    expect(saveSpy).toHaveBeenCalledWith(updatedSettings);
  });

  it("指定されていないフィールドは現在の値を保持する（部分更新）", async () => {
    const currentSettings = {
      defaultOrder: "asc" as const,
      defaultOrderBy: "updated_at" as const,
      autoSaveInterval: createAutoSaveInterval(3000),
    };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );
    const saveSpy = vi
      .spyOn(context.settingsRepository, "save")
      .mockResolvedValue();

    const updatedSettings = await updateSettings(context, {
      defaultOrder: "desc",
    });

    expect(updatedSettings.defaultOrder).toBe("desc");
    expect(updatedSettings.defaultOrderBy).toBe("updated_at");
    expect(updatedSettings.autoSaveInterval).toBe(3000);
    expect(saveSpy).toHaveBeenCalledWith(updatedSettings);
  });

  it("無効なソート順で更新時に例外が発生する", async () => {
    const currentSettings = { ...DEFAULT_SETTINGS };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );

    await expect(
      updateSettings(context, {
        defaultOrder: "invalid",
      }),
    ).rejects.toThrow(BusinessRuleError);

    await expect(
      updateSettings(context, {
        defaultOrder: "invalid",
      }),
    ).rejects.toThrow('Invalid sort order: invalid. Must be "asc" or "desc"');
  });

  it("無効なソート対象で更新時に例外が発生する", async () => {
    const currentSettings = { ...DEFAULT_SETTINGS };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );

    await expect(
      updateSettings(context, {
        defaultOrderBy: "invalid",
      }),
    ).rejects.toThrow(BusinessRuleError);

    await expect(
      updateSettings(context, {
        defaultOrderBy: "invalid",
      }),
    ).rejects.toThrow(
      'Invalid order by field: invalid. Must be "created_at" or "updated_at"',
    );
  });

  it("自動保存間隔が短すぎる（500ms未満）場合に例外が発生する", async () => {
    const currentSettings = { ...DEFAULT_SETTINGS };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );

    await expect(
      updateSettings(context, {
        autoSaveInterval: 499,
      }),
    ).rejects.toThrow(BusinessRuleError);

    await expect(
      updateSettings(context, {
        autoSaveInterval: 499,
      }),
    ).rejects.toThrow("Auto-save interval must be at least 500 milliseconds");
  });

  it("自動保存間隔が長すぎる（10000ms超）場合に例外が発生する", async () => {
    const currentSettings = { ...DEFAULT_SETTINGS };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );

    await expect(
      updateSettings(context, {
        autoSaveInterval: 10001,
      }),
    ).rejects.toThrow(BusinessRuleError);

    await expect(
      updateSettings(context, {
        autoSaveInterval: 10001,
      }),
    ).rejects.toThrow("Auto-save interval must not exceed 10000 milliseconds");
  });

  it("自動保存間隔が500msで更新できる", async () => {
    const currentSettings = { ...DEFAULT_SETTINGS };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );
    const saveSpy = vi
      .spyOn(context.settingsRepository, "save")
      .mockResolvedValue();

    const updatedSettings = await updateSettings(context, {
      autoSaveInterval: 500,
    });

    expect(updatedSettings.autoSaveInterval).toBe(500);
    expect(saveSpy).toHaveBeenCalledWith(updatedSettings);
  });

  it("自動保存間隔が10000msで更新できる", async () => {
    const currentSettings = { ...DEFAULT_SETTINGS };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );
    const saveSpy = vi
      .spyOn(context.settingsRepository, "save")
      .mockResolvedValue();

    const updatedSettings = await updateSettings(context, {
      autoSaveInterval: 10000,
    });

    expect(updatedSettings.autoSaveInterval).toBe(10000);
    expect(saveSpy).toHaveBeenCalledWith(updatedSettings);
  });

  it("更新された設定がlocalStorageに保存される", async () => {
    const currentSettings = { ...DEFAULT_SETTINGS };

    vi.spyOn(context.settingsRepository, "get").mockResolvedValue(
      currentSettings,
    );
    const saveSpy = vi
      .spyOn(context.settingsRepository, "save")
      .mockResolvedValue();

    const updatedSettings = await updateSettings(context, {
      defaultOrder: "asc",
      autoSaveInterval: 5000,
    });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(updatedSettings);
  });
});
