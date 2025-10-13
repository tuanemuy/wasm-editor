import type { Context } from "../context";

export type RecentDatabase = {
  name: string;
  path: string;
};

export async function getRecentDatabases(
  context: Context,
): Promise<RecentDatabase[]> {
  const databases = await context.databaseStoragePort.getRecentDatabases();
  // Return max 10 recent databases
  return databases.slice(0, 10);
}
