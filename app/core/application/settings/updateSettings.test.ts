import { beforeEach, describe, expect, it } from "vitest";
import { MockSettingsRepository } from "@/core/adapters/mock/settingsRepository";
import type { Context } from "../context";
import { updateSettings } from "./updateSettings";

describe("updateSettings", () => {
  let mockSettingsRepository: MockSettingsRepository;
  let context: Context;

  beforeEach(() => {
    mockSettingsRepository = new MockSettingsRepository();
    context = {
      settingsRepository: mockSettingsRepository,
    } as unknown as Context;
  });

  it("should partially update settings", async () => {
    const result = await updateSettings(context, {
      defaultSortBy: "created_asc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.defaultSortBy).toBe("created_asc");
    }
  });

  it("should update only defaultSortBy", async () => {
    const result = await updateSettings(context, {
      defaultSortBy: "created_desc",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.defaultSortBy).toBe("created_desc");
      // Other fields should remain as defaults
      expect(result.value.autoSaveInterval).toBe(2000);
      expect(result.value.revisionInterval).toBe(600000);
      expect(result.value.editorFontSize).toBe(16);
      expect(result.value.editorTheme).toBe("light");
    }
  });

  it("should update only autoSaveInterval", async () => {
    const result = await updateSettings(context, {
      autoSaveInterval: 5000,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.autoSaveInterval).toBe(5000);
      // Other fields should remain as defaults
      expect(result.value.defaultSortBy).toBe("updated_desc");
    }
  });

  it("should update only revisionInterval", async () => {
    const result = await updateSettings(context, {
      revisionInterval: 120000,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.revisionInterval).toBe(120000);
      // Other fields should remain as defaults
      expect(result.value.defaultSortBy).toBe("updated_desc");
    }
  });

  it("should update only editorFontSize", async () => {
    const result = await updateSettings(context, {
      editorFontSize: 20,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.editorFontSize).toBe(20);
      // Other fields should remain as defaults
      expect(result.value.defaultSortBy).toBe("updated_desc");
    }
  });

  it("should update only editorTheme", async () => {
    const result = await updateSettings(context, {
      editorTheme: "dark",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.editorTheme).toBe("dark");
      // Other fields should remain as defaults
      expect(result.value.defaultSortBy).toBe("updated_desc");
    }
  });

  it("should update multiple fields simultaneously", async () => {
    const result = await updateSettings(context, {
      defaultSortBy: "created_asc",
      autoSaveInterval: 3000,
      editorTheme: "dark",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.defaultSortBy).toBe("created_asc");
      expect(result.value.autoSaveInterval).toBe(3000);
      expect(result.value.editorTheme).toBe("dark");
      // Unchanged fields should remain as defaults
      expect(result.value.revisionInterval).toBe(600000);
      expect(result.value.editorFontSize).toBe(16);
    }
  });

  it("should update updatedAt to current time on update", async () => {
    const before = new Date();
    const result = await updateSettings(context, {
      defaultSortBy: "created_asc",
    });
    const after = new Date();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(result.value.updatedAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    }
  });

  it("should update from default settings when settings do not exist", async () => {
    const result = await updateSettings(context, {
      autoSaveInterval: 4000,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.autoSaveInterval).toBe(4000);
      expect(result.value.defaultSortBy).toBe("updated_desc");
      expect(result.value.revisionInterval).toBe(600000);
      expect(result.value.editorFontSize).toBe(16);
      expect(result.value.editorTheme).toBe("light");
    }
  });

  it("should update successfully with autoSaveInterval minimum value (1000)", async () => {
    const result = await updateSettings(context, {
      autoSaveInterval: 1000,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.autoSaveInterval).toBe(1000);
    }
  });

  it("should update successfully with autoSaveInterval maximum value (60000)", async () => {
    const result = await updateSettings(context, {
      autoSaveInterval: 60000,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.autoSaveInterval).toBe(60000);
    }
  });

  it("should update successfully with revisionInterval minimum value (60000)", async () => {
    const result = await updateSettings(context, {
      revisionInterval: 60000,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.revisionInterval).toBe(60000);
    }
  });

  it("should update successfully with revisionInterval maximum value (3600000)", async () => {
    const result = await updateSettings(context, {
      revisionInterval: 3600000,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.revisionInterval).toBe(3600000);
    }
  });

  it("should update successfully with editorFontSize minimum value (10)", async () => {
    const result = await updateSettings(context, {
      editorFontSize: 10,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.editorFontSize).toBe(10);
    }
  });

  it("should update successfully with editorFontSize maximum value (32)", async () => {
    const result = await updateSettings(context, {
      editorFontSize: 32,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.editorFontSize).toBe(32);
    }
  });

  it("should return ValidationError for invalid defaultSortBy", async () => {
    const result = await updateSettings(context, {
      // @ts-expect-error Testing invalid value
      defaultSortBy: "invalid_sort",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
    }
  });

  it("should return ValidationError when autoSaveInterval is below 1000", async () => {
    const result = await updateSettings(context, {
      autoSaveInterval: 999,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
    }
  });

  it("should return ValidationError when autoSaveInterval exceeds 60000", async () => {
    const result = await updateSettings(context, {
      autoSaveInterval: 60001,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
    }
  });

  it("should return ValidationError when revisionInterval is below 60000", async () => {
    const result = await updateSettings(context, {
      revisionInterval: 59999,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
    }
  });

  it("should return ValidationError when revisionInterval exceeds 3600000", async () => {
    const result = await updateSettings(context, {
      revisionInterval: 3600001,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
    }
  });

  it("should return ValidationError when editorFontSize is below 10", async () => {
    const result = await updateSettings(context, {
      editorFontSize: 9,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
    }
  });

  it("should return ValidationError when editorFontSize exceeds 32", async () => {
    const result = await updateSettings(context, {
      editorFontSize: 33,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
    }
  });

  it("should return ValidationError for invalid editorTheme", async () => {
    const result = await updateSettings(context, {
      // @ts-expect-error Testing invalid value
      editorTheme: "invalid_theme",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
    }
  });

  it("should return RepositoryError when database get or save fails", async () => {
    mockSettingsRepository.setShouldFail(true);

    const result = await updateSettings(context, {
      defaultSortBy: "created_asc",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to update settings");
    }
  });
});
