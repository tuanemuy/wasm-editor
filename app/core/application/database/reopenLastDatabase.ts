import type { Database } from "@/core/domain/database/entity";
import { createDatabase } from "@/core/domain/database/entity";
import type { Context } from "../context";

export async function reopenLastDatabase(
  context: Context,
): Promise<Database | null> {
  // Get last opened handle
  const handle = await context.databaseStoragePort.getLastOpenedHandle();
  if (!handle) {
    return null;
  }

  // Verify permission
  const hasPermission = await context.fileSystemAccessPort.verifyPermission(
    handle,
    "readwrite",
  );
  if (!hasPermission) {
    // Permission denied, clear last opened handle
    await context.databaseStoragePort.clearLastOpenedHandle();
    return null;
  }

  // Connect to database
  await context.databaseConnectionPort.connect(handle);

  // Get database info
  const name = context.fileSystemAccessPort.getFileName(handle);
  const path = (await context.fileSystemAccessPort.getFilePath(handle)) || "";

  // Create database entity
  return createDatabase({ handle, name, path });
}
