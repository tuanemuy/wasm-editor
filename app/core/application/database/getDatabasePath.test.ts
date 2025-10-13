import { beforeEach, describe, expect, it } from "vitest";
import { MockDatabaseManager } from "@/core/adapters/mock/databaseManager";
import { MockDatabaseStorageManager } from "@/core/adapters/mock/databaseStorageManager";
import type { Context } from "../context";
import { createDatabase } from "./createDatabase";
import { getDatabasePath } from "./getDatabasePath";

describe("getDatabasePath", () => {
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

  it("should get current database file path", async () => {
    // First create a database
    await createDatabase(context, { dbPath: "/test/database.db" });

    const result = await getDatabasePath(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe("/test/database.db");
    }
  });

  it("should return null when connection does not exist", async () => {
    const result = await getDatabasePath(context);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeNull();
    }
  });

  it("should return ExternalServiceError when connection get fails", async () => {
    mockDatabaseManager.setShouldFailGetConnection(true);

    const result = await getDatabasePath(context);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to get database connection");
    }
  });
});
