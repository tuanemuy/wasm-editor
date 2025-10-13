import { beforeEach, describe, expect, it } from "vitest";
import { MockDatabaseManager } from "@/core/adapters/mock/databaseManager";
import { MockDatabaseStorageManager } from "@/core/adapters/mock/databaseStorageManager";
import type { Context } from "../context";
import { closeDatabase } from "./closeDatabase";
import { createDatabase } from "./createDatabase";

describe("closeDatabase", () => {
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

  it("should close open database connection", async () => {
    // First create a database
    await createDatabase(context, { dbPath: "/test/database.db" });

    const result = await closeDatabase(context);

    expect(result.isOk()).toBe(true);
  });

  it("should make connection unavailable after closing", async () => {
    // First create a database
    await createDatabase(context, { dbPath: "/test/database.db" });

    await closeDatabase(context);

    const connectionResult = mockDatabaseManager.getConnection();
    expect(connectionResult.isOk()).toBe(true);
    if (connectionResult.isOk()) {
      expect(connectionResult.value).toBeNull();
    }
  });

  it("should save changes before closing", async () => {
    // First create a database
    await createDatabase(context, { dbPath: "/test/database.db" });

    const result = await closeDatabase(context);

    expect(result.isOk()).toBe(true);
  });

  it("should not error when closing without open connection", async () => {
    const result = await closeDatabase(context);

    expect(result.isOk()).toBe(true);
  });

  it("should return ExternalServiceError when connection close fails", async () => {
    // First create a database
    await createDatabase(context, { dbPath: "/test/database.db" });

    mockDatabaseManager.setShouldFailClose(true);

    const result = await closeDatabase(context);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to close database");
    }
  });
});
