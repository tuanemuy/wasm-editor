import type { Database } from "@/core/domain/database/entity";
import { createDatabase } from "@/core/domain/database/entity";
import type { Context } from "../context";

export async function getCurrentDatabase(
  context: Context,
): Promise<Database | null> {
  const connection = context.databaseConnectionPort.getCurrentConnection();
  if (!connection) {
    return null;
  }

  // Build Database entity from connection
  const name = context.fileSystemAccessPort.getFileName(connection.handle);
  const path =
    (await context.fileSystemAccessPort.getFilePath(connection.handle)) || "";

  return createDatabase({
    handle: connection.handle,
    name,
    path,
  });
}
