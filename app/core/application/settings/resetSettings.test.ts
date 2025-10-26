/**
 * Reset Settings Use Case Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyExportPort } from "@/core/adapters/empty/exportPort";
import { EmptyNoteQueryService } from "@/core/adapters/empty/noteQueryService";
import { EmptySettingsRepository } from "@/core/adapters/empty/settingsRepository";
import { EmptyTagExtractorPort } from "@/core/adapters/empty/tagExtractorPort";
import { EmptyTagQueryService } from "@/core/adapters/empty/tagQueryService";
import { EmptyUnitOfWorkProvider } from "@/core/adapters/empty/unitOfWork";
import type { Context } from "../context";
import { resetSettings } from "./resetSettings";

describe("resetSettings", () => {
  let context: Context;

  beforeEach(() => {
    context = {
      unitOfWorkProvider: new EmptyUnitOfWorkProvider(),
      noteQueryService: new EmptyNoteQueryService(),
      tagQueryService: new EmptyTagQueryService(),
      exporter: new EmptyExportPort(),
      tagExtractor: new EmptyTagExtractorPort(),
      settingsRepository: new EmptySettingsRepository(),
    };
  });

  it("設定をデフォルト値にリセットできる", async () => {
    const saveSpy = vi
      .spyOn(context.settingsRepository, "save")
      .mockResolvedValue();

    const settings = await resetSettings(context);

    expect(settings.defaultOrder).toBe("desc");
    expect(settings.defaultOrderBy).toBe("created_at");
    expect(settings.autoSaveInterval).toBe(2000);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(settings);
  });

  it('リセット後のデフォルトソート順が"desc"である', async () => {
    vi.spyOn(context.settingsRepository, "save").mockResolvedValue();

    const settings = await resetSettings(context);

    expect(settings.defaultOrder).toBe("desc");
  });

  it('リセット後のデフォルトソート対象が"created_at"である', async () => {
    vi.spyOn(context.settingsRepository, "save").mockResolvedValue();

    const settings = await resetSettings(context);

    expect(settings.defaultOrderBy).toBe("created_at");
  });

  it("リセット後の自動保存間隔が2000msである", async () => {
    vi.spyOn(context.settingsRepository, "save").mockResolvedValue();

    const settings = await resetSettings(context);

    expect(settings.autoSaveInterval).toBe(2000);
  });

  it("リセットされた設定がlocalStorageに保存される", async () => {
    const saveSpy = vi
      .spyOn(context.settingsRepository, "save")
      .mockResolvedValue();

    const settings = await resetSettings(context);

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(settings);
  });
});
