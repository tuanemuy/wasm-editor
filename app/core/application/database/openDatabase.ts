import type { Database } from "@/core/domain/database/entity";
import { createDatabase } from "@/core/domain/database/entity";
import type { Context } from "../context";

export async function openDatabase(context: Context): Promise<Database> {
  // Close current connection if exists
  if (context.databaseConnectionPort.isConnected()) {
    await context.databaseConnectionPort.disconnect();
  }

  // Open file picker
  const handle = await context.fileSystemAccessPort.openFilePicker({
    accept: {
      "application/x-sqlite3": [".db", ".sqlite", ".sqlite3"],
    },
  });

  // Verify permission
  const hasPermission = await context.fileSystemAccessPort.verifyPermission(
    handle,
    "readwrite",
  );
  if (!hasPermission) {
    throw new Error("Permission denied");
  }

  // Connect to database
  await context.databaseConnectionPort.connect(handle);

  // Get database info
  const name = context.fileSystemAccessPort.getFileName(handle);
  const path = (await context.fileSystemAccessPort.getFilePath(handle)) || "";

  // Create database entity
  const database = createDatabase({ handle, name, path });

  // Save as last opened
  await context.databaseStoragePort.saveLastOpenedHandle(handle);
  await context.databaseStoragePort.saveRecentDatabase({ name, path });

  return database;
}
