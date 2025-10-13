import { Database as TursoDatabase } from "@tursodatabase/database-wasm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { err, ok, type Result } from "neverthrow";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createDatabaseConnection,
  type DatabaseConnection,
} from "@/core/domain/database/entity";
import type { DatabaseManager as IDatabaseManager } from "@/core/domain/database/ports/databaseManager";
import type { DatabasePath } from "@/core/domain/database/valueObject";
import { ExternalServiceError } from "@/core/error/adapter";

/**
 * Database Manager implementation using Turso Database WASM
 *
 * Manages SQLite WASM database instances in the browser using:
 * - @tursodatabase/database-wasm for SQLite WASM
 * - File System Access API for persistence
 * - Drizzle ORM for schema management
 */
export class TursoDatabaseManager implements IDatabaseManager {
  private connection: DatabaseConnection | null = null;
  private dbInstance: TursoDatabase | null = null;

  async create(
    dbPath: DatabasePath,
  ): Promise<Result<DatabaseConnection, ExternalServiceError>> {
    try {
      // Create a new in-memory SQLite WASM database
      this.dbInstance = new TursoDatabase(":memory:");

      // Initialize Drizzle ORM with the database instance
      const db = drizzle(this.dbInstance, { schema });

      // Create tables using schema
      await this.initializeSchema(db);

      // Create database connection entity
      const connectionResult = createDatabaseConnection({
        dbPath,
        isOpen: true,
      });

      if (connectionResult.isErr()) {
        return err(
          new ExternalServiceError(
            "Failed to create database connection",
            connectionResult.error,
          ),
        );
      }

      this.connection = connectionResult.value;

      return ok(connectionResult.value);
    } catch (error) {
      return err(new ExternalServiceError("Failed to create database", error));
    }
  }

  async open(
    dbPath: DatabasePath,
  ): Promise<Result<DatabaseConnection, ExternalServiceError>> {
    try {
      // For browser environment, we create a new in-memory database
      return await this.create(dbPath);
    } catch (error) {
      return err(new ExternalServiceError("Failed to open database", error));
    }
  }

  async close(): Promise<Result<void, ExternalServiceError>> {
    try {
      if (!this.connection) {
        return err(new ExternalServiceError("No database connection to close"));
      }

      // Close the database instance
      if (this.dbInstance) {
        this.dbInstance.close();
        this.dbInstance = null;
      }

      this.connection = null;

      return ok(undefined);
    } catch (error) {
      return err(new ExternalServiceError("Failed to close database", error));
    }
  }

  getConnection(): Result<DatabaseConnection | null, ExternalServiceError> {
    return ok(this.connection);
  }

  isOpen(): boolean {
    return this.connection?.isOpen ?? false;
  }

  /**
   * Initialize database schema
   * Creates all required tables based on the Drizzle schema
   */
  private async initializeSchema(
    db: ReturnType<typeof drizzle>,
  ): Promise<void> {
    // Create tables by executing SQL from the schema
    // Drizzle doesn't provide a direct way to create tables without migrations
    // So we'll use raw SQL based on the schema definition

    await db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        name TEXT PRIMARY KEY
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        tag_name TEXT NOT NULL REFERENCES tags(name) ON DELETE CASCADE,
        PRIMARY KEY (note_id, tag_name)
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS revisions (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        saved_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS revisions_note_id_idx ON revisions(note_id)
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS assets_note_id_idx ON assets(note_id)
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        default_sort_by TEXT NOT NULL DEFAULT 'updated_desc',
        auto_save_interval INTEGER NOT NULL DEFAULT 2000,
        revision_interval INTEGER NOT NULL DEFAULT 600000,
        editor_font_size INTEGER NOT NULL DEFAULT 16,
        editor_theme TEXT NOT NULL DEFAULT 'light',
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS database_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    // Insert default settings if not exists
    await db.run(`
      INSERT OR IGNORE INTO settings (id) VALUES (1)
    `);
  }
}
