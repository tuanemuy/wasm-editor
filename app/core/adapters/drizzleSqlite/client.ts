import { Database as TursoDatabase } from "@tursodatabase/database-wasm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import {
  type BetterSQLite3Database,
  type BetterSQLiteTransaction,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type Database = BetterSQLite3Database<typeof schema>;
export type Transaction = BetterSQLiteTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
export type Executor = Database | Transaction;

export function getDatabase(path: string): Database {
  return drizzle(new TursoDatabase(path), { schema });
}
