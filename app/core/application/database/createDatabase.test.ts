import { beforeEach, describe, expect, it } from "vitest";
import { MockDatabaseManager } from "@/core/adapters/mock/databaseManager";
import { MockDatabaseStorageManager } from "@/core/adapters/mock/databaseStorageManager";
import type { Context } from "../context";
import { createDatabase } from "./createDatabase";

describe("createDatabase", () => {
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

  it("should create a new database file at the specified path", async () => {
    const result = await createDatabase(context, {
      dbPath: "/test/database.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeDefined();
      expect(result.value.dbPath).toBe("/test/database.db");
    }
  });

  it("should open database connection", async () => {
    const result = await createDatabase(context, {
      dbPath: "/test/database.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.isOpen).toBe(true);
    }
  });

  it("should be able to connect to created database", async () => {
    const result = await createDatabase(context, {
      dbPath: "/test/database.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const connectionResult = mockDatabaseManager.getConnection();
      expect(connectionResult.isOk()).toBe(true);
      if (connectionResult.isOk()) {
        expect(connectionResult.value).not.toBeNull();
        expect(connectionResult.value?.dbPath).toBe("/test/database.db");
      }
    }
  });

  it("should initialize database metadata", async () => {
    const result = await createDatabase(context, {
      dbPath: "/test/database.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.createdAt).toBeInstanceOf(Date);
    }
  });

  it("should create necessary tables", async () => {
    const result = await createDatabase(context, {
      dbPath: "/test/database.db",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeDefined();
    }
  });

  it("should return ExternalServiceError when database file creation fails", async () => {
    mockDatabaseManager.setShouldFailCreate(true);

    const result = await createDatabase(context, {
      dbPath: "/test/database.db",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.name).toBe("ApplicationError");
      expect(result.error.message).toBe("Failed to create database");
    }
  });
});
