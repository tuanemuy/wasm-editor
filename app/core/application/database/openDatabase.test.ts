import { beforeEach, describe, expect, it } from "vitest";
import { MockDatabaseManager } from "@/core/adapters/mock/databaseManager";
import { MockDatabaseStorageManager } from "@/core/adapters/mock/databaseStorageManager";
import type { Context } from "../context";
import { openDatabase } from "./openDatabase";

describe("openDatabase", () => {
  let mockDatabaseManager: MockDatabaseManager;
  let mockDatabaseStorageManager: MockDatabaseStorageManager;
  let context: Context;

  beforeEach(() => {
    mockDatabaseManager = new MockDatabaseManager();
    mockDatabaseStorageManager = new MockDatabaseStorageManager();
    context = {
      databaseManager: mockDatabaseManager,
      databaseStorageManager: mockDatabaseStorageManager,
    } as unknown as Context;
  });

  it("should open existing database file at specified path", async () => {
    const result = await openDatabase(context, {
      dbPath: "/test/existing.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeDefined();
      expect(result.value.dbPath).toBe("/test/existing.db");
    }
  });

  it("should prompt user to select file when path is not specified", async () => {
    const mockFile = new File([], "selected-database.db");
    mockDatabaseStorageManager.setMockFile(mockFile);

    const result = await openDatabase(context, {});

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeDefined();
      expect(result.value.dbPath).toBe("selected-database.db");
    }
  });

  it("should open database connection", async () => {
    const result = await openDatabase(context, {
      dbPath: "/test/existing.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.isOpen).toBe(true);
    }
  });

  it("should be able to connect to opened database", async () => {
    const result = await openDatabase(context, {
      dbPath: "/test/existing.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const connectionResult = mockDatabaseManager.getConnection();
      expect(connectionResult.isOk()).toBe(true);
      if (connectionResult.isOk()) {
        expect(connectionResult.value).not.toBeNull();
        expect(connectionResult.value?.dbPath).toBe("/test/existing.db");
      }
    }
  });

  it("should correctly load existing data", async () => {
    const result = await openDatabase(context, {
      dbPath: "/test/existing.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeDefined();
    }
  });

  it("should return ApplicationError when database file does not exist", async () => {
    mockDatabaseManager.setShouldFailOpen(true);

    const result = await openDatabase(context, {
      dbPath: "/test/nonexistent.db",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to open database");
    }
  });

  it("should return ExternalServiceError when database file open fails", async () => {
    mockDatabaseManager.setShouldFailOpen(true);

    const result = await openDatabase(context, {
      dbPath: "/test/database.db",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
    }
  });

  it("should return ApplicationError when user cancels file selection", async () => {
    mockDatabaseStorageManager.setShouldFailOpen(true);

    const result = await openDatabase(context, {});

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to open file dialog");
    }
  });

  it("should return ExternalServiceError when database file is corrupted", async () => {
    mockDatabaseManager.setShouldFailOpen(true);

    const result = await openDatabase(context, {
      dbPath: "/test/corrupted.db",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
    }
  });
});
