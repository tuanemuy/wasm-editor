import { Database as TursoDatabase } from "@tursodatabase/database-wasm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type {
  DatabaseConnection,
  DatabaseConnectionPort,
} from "@/core/domain/database/ports/databaseConnectionPort";
import type { Database } from "./client";
import * as schema from "./schema";

export class DatabaseConnectionAdapter implements DatabaseConnectionPort {
  private connection: DatabaseConnection | null = null;
  private db: Database | null = null;
  private tursoDb: TursoDatabase | null = null;

  async connect(handle: FileSystemFileHandle): Promise<void> {
    try {
      // Read the database file
      const file = await handle.getFile();
      const arrayBuffer = await file.arrayBuffer();

      // Create a temporary file path for Turso Database
      // Note: Turso Database WASM expects a file path or URL, not an ArrayBuffer
      // We need to use a different approach - store the file in OPFS and pass the path
      const fileName = handle.name;

      // Store in OPFS
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(arrayBuffer);
      await writable.close();

      // Create Turso database instance with file path
      // For now, we'll use the file name as the path
      this.tursoDb = new TursoDatabase(fileName);
      this.db = drizzle(this.tursoDb, { schema });

      this.connection = {
        handle,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseConnectionError,
        error instanceof Error
          ? error.message
          : "Failed to connect to database",
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.tursoDb) {
        // Save database before closing
        if (this.connection?.handle) {
          await this.saveDatabase();
        }

        this.tursoDb.close();
        this.tursoDb = null;
      }

      this.db = null;
      this.connection = null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseDisconnectionError,
        error instanceof Error
          ? error.message
          : "Failed to disconnect from database",
      );
    }
  }

  isConnected(): boolean {
    return this.connection !== null && this.db !== null;
  }

  getCurrentConnection(): DatabaseConnection | null {
    return this.connection;
  }

  async initialize(): Promise<void> {
    if (!this.db) {
      throw new SystemError(
        SystemErrorCode.DatabaseNotConnected,
        "Database is not connected",
      );
    }

    // Create tables using Drizzle migrations
    // Note: You may need to implement proper migration logic here
    // For now, we'll assume the schema is already created
  }

  async migrate(targetVersion: number): Promise<void> {
    if (!this.db) {
      throw new SystemError(
        SystemErrorCode.DatabaseNotConnected,
        "Database is not connected",
      );
    }

    try {
      // Implement migration logic here
      // This will depend on your migration strategy
      console.log(`Migrating to version ${targetVersion}`);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseMigrationError,
        error instanceof Error ? error.message : "Failed to migrate database",
      );
    }
  }

  getDb(): Database | null {
    return this.db;
  }

  private async saveDatabase(): Promise<void> {
    if (!this.tursoDb || !this.connection?.handle) {
      return;
    }

    try {
      // Turso Database WASM doesn't have an export method in the standard way
      // We need to copy the file from OPFS back to the original file handle
      const fileName = this.connection.handle.name;
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();

      // Write to original file handle
      const writable = await this.connection.handle.createWritable();
      await writable.write(arrayBuffer);
      await writable.close();
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseSaveError,
        error instanceof Error ? error.message : "Failed to save database",
      );
    }
  }

  async flush(): Promise<void> {
    if (!this.connection?.handle) {
      throw new SystemError(
        SystemErrorCode.DatabaseNotConnected,
        "Database is not connected",
      );
    }

    await this.saveDatabase();
  }
}

export const createDatabaseConnectionAdapter = (): DatabaseConnectionPort => {
  return new DatabaseConnectionAdapter();
};
