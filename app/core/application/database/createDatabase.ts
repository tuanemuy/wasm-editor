import type { Database } from "@/core/domain/database/entity";
import { createDatabase as createDatabaseEntity } from "@/core/domain/database/entity";
import type { Context } from "../context";

export type CreateDatabaseInput = {
  suggestedName?: string;
};

export async function createDatabase(
  context: Context,
  input: CreateDatabaseInput = {},
): Promise<Database> {
  // Close current connection if exists
  if (context.databaseConnectionPort.isConnected()) {
    await context.databaseConnectionPort.disconnect();
  }

  // Save file picker
  const handle = await context.fileSystemAccessPort.saveFilePicker({
    suggestedName: input.suggestedName || "notes.db",
    types: [
      {
        description: "Database files",
        accept: {
          "application/x-sqlite3": [".db", ".sqlite", ".sqlite3"],
        },
      },
    ],
  });

  // Connect to database
  await context.databaseConnectionPort.connect(handle);

  // Initialize database (create tables)
  await context.databaseConnectionPort.initialize();

  // Get database info
  const name = context.fileSystemAccessPort.getFileName(handle);
  const path = (await context.fileSystemAccessPort.getFilePath(handle)) || "";

  // Create database entity
  const database = createDatabaseEntity({ handle, name, path });

  // Save as last opened
  await context.databaseStoragePort.saveLastOpenedHandle(handle);
  await context.databaseStoragePort.saveRecentDatabase({ name, path });

  return database;
}
