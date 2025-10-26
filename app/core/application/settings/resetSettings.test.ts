/**
 * Reset Settings Use Case Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../context";
import { createTestContext } from "../test-helpers";
import { resetSettings } from "./resetSettings";

describe("resetSettings", () => {
  let context: Context;

  beforeEach(() => {
    ({ context } = createTestContext());
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
