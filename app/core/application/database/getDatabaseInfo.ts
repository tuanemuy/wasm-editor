import type { Context } from "../context";
import { SystemError, SystemErrorCode } from "../error";

export type DatabaseInfo = {
  name: string;
  path: string;
  noteCount: number;
  tagCount: number;
  revisionCount: number;
  fileSize?: number;
};

export async function getDatabaseInfo(context: Context): Promise<DatabaseInfo> {
  // Check if database is connected
  if (!context.databaseConnectionPort.isConnected()) {
    throw new SystemError(
      SystemErrorCode.DatabaseError,
      "No database connection",
    );
  }

  const connection = context.databaseConnectionPort.getCurrentConnection();
  if (!connection) {
    throw new SystemError(
      SystemErrorCode.DatabaseError,
      "Failed to get current connection",
    );
  }

  // Get database statistics
  const [noteCount, tagCount, revisionCount] =
    await context.unitOfWorkProvider.run(async (repositories) => {
      const noteCount = await repositories.noteRepository.count();
      const tagCount = (await repositories.tagRepository.findAll()).length;
      // Count all revisions (we can add a method to RevisionRepository if needed)
      // For now, we'll set it to 0 or implement a count method
      const revisionCount = 0;

      return [noteCount, tagCount, revisionCount] as const;
    });

  // Get file info
  const name = context.fileSystemAccessPort.getFileName(connection.handle);
  const path =
    (await context.fileSystemAccessPort.getFilePath(connection.handle)) || "";

  let fileSize: number | undefined;
  try {
    const file = await connection.handle.getFile();
    fileSize = file.size;
  } catch (_error) {
    // File size may not be available
  }

  return {
    name,
    path,
    noteCount,
    tagCount,
    revisionCount,
    fileSize,
  };
}
