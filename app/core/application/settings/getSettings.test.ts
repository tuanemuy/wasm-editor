import { beforeEach, describe, expect, it } from "vitest";
import { MockSettingsRepository } from "@/core/adapters/mock/settingsRepository";
import type { Context } from "../context";
import { getSettings } from "./getSettings";

describe("getSettings", () => {
  let mockSettingsRepository: MockSettingsRepository;
  let context: Context;

  beforeEach(() => {
    mockSettingsRepository = new MockSettingsRepository();
    context = {
      settingsRepository: mockSettingsRepository,
    } as unknown as Context;
  });

  it("should get application settings", async () => {
    const result = await getSettings(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeDefined();
    }
  });

  it("should return settings with correct properties", async () => {
    const result = await getSettings(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveProperty("defaultSortBy");
      expect(result.value).toHaveProperty("autoSaveInterval");
      expect(result.value).toHaveProperty("revisionInterval");
      expect(result.value).toHaveProperty("editorFontSize");
      expect(result.value).toHaveProperty("editorTheme");
      expect(result.value).toHaveProperty("updatedAt");
    }
  });

  it("should return default settings when settings do not exist", async () => {
    const result = await getSettings(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.defaultSortBy).toBe("updated_desc");
      expect(result.value.autoSaveInterval).toBe(2000);
      expect(result.value.revisionInterval).toBe(600000);
      expect(result.value.editorFontSize).toBe(16);
      expect(result.value.editorTheme).toBe("light");
    }
  });

  it("should return default settings with defaultSortBy 'updated_desc'", async () => {
    const result = await getSettings(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.defaultSortBy).toBe("updated_desc");
    }
  });

  it("should return default settings with autoSaveInterval 2000", async () => {
    const result = await getSettings(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.autoSaveInterval).toBe(2000);
    }
  });

  it("should return default settings with revisionInterval 600000", async () => {
    const result = await getSettings(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.revisionInterval).toBe(600000);
    }
  });

  it("should return default settings with editorFontSize 16", async () => {
    const result = await getSettings(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.editorFontSize).toBe(16);
    }
  });

  it("should return default settings with editorTheme 'light'", async () => {
    const result = await getSettings(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.editorTheme).toBe("light");
    }
  });

  it("should return RepositoryError when database get fails", async () => {
    mockSettingsRepository.setShouldFail(true);

    const result = await getSettings(context);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get settings");
    }
  });
});
