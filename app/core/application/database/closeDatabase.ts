import type { Context } from "../context";

export async function closeDatabase(context: Context): Promise<void> {
  if (context.databaseConnectionPort.isConnected()) {
    await context.databaseConnectionPort.disconnect();
  }
}
