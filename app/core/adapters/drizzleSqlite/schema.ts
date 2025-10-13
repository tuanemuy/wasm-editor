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
 */
export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    body: text("body").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    createdAtIdx: index("idx_notes_created_at").on(table.createdAt),
    updatedAtIdx: index("idx_notes_updated_at").on(table.updatedAt),
  }),
);

/**
 * Tags table
 */
export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  usageCount: integer("usage_count").notNull().default(0),
});

/**
 * Note-Tag relation table
 */
export const noteTags = sqliteTable(
  "note_tags",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.noteId, table.tagId] }),
    noteIdIdx: index("idx_note_tags_note_id").on(table.noteId),
    tagIdIdx: index("idx_note_tags_tag_id").on(table.tagId),
  }),
);

/**
 * Revisions table
 */
export const revisions = sqliteTable(
  "revisions",
  {
    id: text("id").primaryKey(),
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    content: text("content").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    noteIdIdx: index("idx_revisions_note_id").on(table.noteId),
    createdAtIdx: index("idx_revisions_created_at").on(table.createdAt),
    noteCreatedIdx: index("idx_revisions_note_created").on(
      table.noteId,
      table.createdAt,
    ),
  }),
);

/**
 * Images table
 */
export const images = sqliteTable(
  "images",
  {
    id: text("id").primaryKey(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    storagePath: text("storage_path").notNull(),
    uploadedAt: integer("uploaded_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    uploadedAtIdx: index("idx_images_uploaded_at").on(table.uploadedAt),
  }),
);

/**
 * Settings table (singleton pattern)
 */
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().default("default"),
  general: text("general", { mode: "json" }).notNull(),
  editor: text("editor", { mode: "json" }).notNull(),
  revision: text("revision", { mode: "json" }).notNull(),
  image: text("image", { mode: "json" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdate(() => new Date()),
});
