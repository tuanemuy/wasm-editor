/**
 * Get Settings Use Case Tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "@/core/domain/settings/entity";
import { createAutoSaveInterval } from "@/core/domain/settings/valueObject";
import type { Context } from "../context";
import { createTestContext } from "../test-helpers";
import { getSettings } from "./getSettings";

describe("getSettings", () => {
  let context: Context;

  beforeEach(() => {
    ({ context } = createTestContext());
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
