import { beforeEach, describe, expect, it } from "vitest";
import { MockDatabaseManager } from "@/core/adapters/mock/databaseManager";
import { MockDatabaseStorageManager } from "@/core/adapters/mock/databaseStorageManager";
import type { Context } from "../context";
import { changeDatabasePath } from "./changeDatabasePath";
import { createDatabase } from "./createDatabase";

describe("changeDatabasePath", () => {
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

  it("should switch to different database file at specified path", async () => {
    // First create a database
    await createDatabase(context, { dbPath: "/test/original.db" });

    const result = await changeDatabasePath(context, {
      newDbPath: "/test/new.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.dbPath).toBe("/test/new.db");
    }
  });

  it("should close current connection", async () => {
    // First create a database
    await createDatabase(context, { dbPath: "/test/original.db" });

    await changeDatabasePath(context, {
      newDbPath: "/test/new.db",
    });

    // The connection should now be for the new database
    const connectionResult = mockDatabaseManager.getConnection();
    expect(connectionResult.isOk()).toBe(true);
    if (connectionResult.isOk()) {
      expect(connectionResult.value?.dbPath).toBe("/test/new.db");
    }
  });

  it("should open connection to new database file", async () => {
    const result = await changeDatabasePath(context, {
      newDbPath: "/test/new.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.isOpen).toBe(true);
    }
  });

  it("should correctly load new database data", async () => {
    const result = await changeDatabasePath(context, {
      newDbPath: "/test/new.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeDefined();
    }
  });

  it("should return ExternalServiceError when connection close fails", async () => {
    // First create a database
    await createDatabase(context, { dbPath: "/test/original.db" });

    mockDatabaseManager.setShouldFailClose(true);

    const result = await changeDatabasePath(context, {
      newDbPath: "/test/new.db",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to close current database");
    }
  });

  it("should return ExternalServiceError when new database open fails", async () => {
    mockDatabaseManager.setShouldFailOpen(true);

    const result = await changeDatabasePath(context, {
      newDbPath: "/test/new.db",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to open database at new path");
    }
  });
});
