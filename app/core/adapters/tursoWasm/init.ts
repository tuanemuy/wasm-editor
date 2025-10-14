/**
 * Turso WASM Database Initialization
 *
 * Creates tables and indexes for the application.
 */

import type { Database } from "./client";

/**
 * Initialize database schema
 *
 * Creates all tables and indexes if they don't exist.
 *
 * @param db - Database instance
 */
export async function initializeDatabase(db: Database): Promise<void> {
  // Execute schema initialization SQL
  await db.exec(`
    -- notes テーブル
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
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
    CREATE INDEX IF NOT EXISTS notes_content_idx ON notes(content);
    CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at);
    CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at);
    CREATE INDEX IF NOT EXISTS tags_name_idx ON tags(name);
    CREATE INDEX IF NOT EXISTS note_tag_relations_note_id_idx ON note_tag_relations(note_id);
    CREATE INDEX IF NOT EXISTS note_tag_relations_tag_id_idx ON note_tag_relations(tag_id);
  `);
}
