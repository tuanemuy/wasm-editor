import type { Database } from "@tursodatabase/database-wasm/vite";

export type { Database };

let cachedModule: typeof import("@tursodatabase/database-wasm/vite") | null =
  null;
let cachedDatabase: { path: string; database: Database } | null = null;

export async function getDatabaseModule() {
  if (!cachedModule) {
    cachedModule = await import("@tursodatabase/database-wasm/vite");
  }
  return cachedModule;
}

export async function getDatabase(path: string) {
  if (cachedDatabase && cachedDatabase.path === path) {
    return cachedDatabase.database;
  }

  if (cachedDatabase && cachedDatabase.path !== path) {
    cachedDatabase.database.close();
  }

  const { connect } = await getDatabaseModule();

  const database = await connect(path, {
    timeout: 1000,
  });
  await initializeDatabase(database);

  cachedDatabase = { path, database };
  return database;
}

/**
 * Close the database connection
 */
export function closeDatabase(database: Database) {
  database.close();
}

/**
 * Initialize database schema
 *
 * Creates all tables and indexes if they don't exist.
 * Handles migrations from older schema versions.
 *
 * @param db - Database instance
 */
export async function initializeDatabase(db: Database): Promise<void> {
  // Create schema_version table for migration tracking
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  // Get current schema version
  const versionResult = await db
    .prepare("SELECT version FROM schema_version ORDER BY version DESC LIMIT 1")
    .get();
  const currentVersion = versionResult
    ? (versionResult as { version: number }).version
    : 0;

  // Create initial schema (v1 or migrate from v1 to v2)
  if (currentVersion === 0) {
    // Fresh install - create latest schema (v2)
    await db.exec(`
      -- notes テーブル
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      -- tags テーブル
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      -- noteTagRelations テーブル
      CREATE TABLE IF NOT EXISTS note_tag_relations (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      -- インデックス作成
      CREATE INDEX IF NOT EXISTS notes_text_idx ON notes(text);
      CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at);
      CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at);
      CREATE INDEX IF NOT EXISTS tags_name_idx ON tags(name);
      CREATE INDEX IF NOT EXISTS note_tag_relations_note_id_idx ON note_tag_relations(note_id);
      CREATE INDEX IF NOT EXISTS note_tag_relations_tag_id_idx ON note_tag_relations(tag_id);

      -- Mark as v2
      INSERT INTO schema_version (version) VALUES (2);
    `);
  } else if (currentVersion === 1) {
    // Migrate from v1 to v2: Add text column and update indexes
    await db.exec(`
      -- Add text column (nullable first)
      ALTER TABLE notes ADD COLUMN text TEXT;

      -- Populate text from content JSON (extract plain text)
      -- For structured content, use empty string as placeholder
      -- Users will need to re-edit notes to populate text properly
      UPDATE notes SET text = '' WHERE text IS NULL;

      -- Now make text NOT NULL via recreation (SQLite limitation)
      CREATE TABLE notes_new (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      INSERT INTO notes_new (id, content, text, created_at, updated_at)
      SELECT id, content, COALESCE(text, ''), created_at, updated_at FROM notes;

      DROP TABLE notes;
      ALTER TABLE notes_new RENAME TO notes;

      -- Drop old index and create new one
      DROP INDEX IF EXISTS notes_content_idx;
      CREATE INDEX IF NOT EXISTS notes_text_idx ON notes(text);
      CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at);
      CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at);

      -- Mark as v2
      INSERT INTO schema_version (version) VALUES (2);
    `);
  }
}
