import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// ============================================================================
// notes テーブル
// ============================================================================

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    contentIdx: index("notes_content_idx").on(table.content),
    createdAtIdx: index("notes_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("notes_updated_at_idx").on(table.updatedAt),
  }),
);

// ============================================================================
// tags テーブル
// ============================================================================

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("tags_name_idx").on(table.name),
  }),
);

// ============================================================================
// noteTagRelations テーブル (中間テーブル)
// ============================================================================

export const noteTagRelations = sqliteTable(
  "note_tag_relations",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.noteId, table.tagId] }),
    noteIdIdx: index("note_tag_relations_note_id_idx").on(table.noteId),
    tagIdIdx: index("note_tag_relations_tag_id_idx").on(table.tagId),
  }),
);
