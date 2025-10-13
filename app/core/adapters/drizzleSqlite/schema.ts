import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/**
 * Notes table
 * Stores the main note information
 */
export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * Tags table
 * Stores tag master information
 */
export const tags = sqliteTable("tags", {
  name: text("name").primaryKey(),
});

/**
 * Note-Tags relationship table
 * Many-to-many relationship between notes and tags
 */
export const noteTags = sqliteTable(
  "note_tags",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagName: text("tag_name")
      .notNull()
      .references(() => tags.name, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.noteId, table.tagName] }),
  }),
);

/**
 * Revisions table
 * Stores note revision history
 */
export const revisions = sqliteTable(
  "revisions",
  {
    id: text("id").primaryKey(),
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    savedAt: integer("saved_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    noteIdIdx: index("revisions_note_id_idx").on(table.noteId),
  }),
);

/**
 * Assets table
 * Stores information about file assets (images, etc.)
 */
export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    noteIdIdx: index("assets_note_id_idx").on(table.noteId),
  }),
);

/**
 * Settings table
 * Stores application settings (singleton pattern - always one row with id = 1)
 */
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey().default(1),
  defaultSortBy: text("default_sort_by").notNull().default("updated_desc"),
  autoSaveInterval: integer("auto_save_interval").notNull().default(2000),
  revisionInterval: integer("revision_interval").notNull().default(600000),
  editorFontSize: integer("editor_font_size").notNull().default(16),
  editorTheme: text("editor_theme").notNull().default("light"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * Database metadata table
 * Stores database metadata
 */
export const databaseMetadata = sqliteTable("database_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});
