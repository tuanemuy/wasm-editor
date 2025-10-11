import * as z from "zod";

/**
 * Database file path (local file system path)
 */
export const databasePathSchema = z.string().min(1);
export type DatabasePath = z.infer<typeof databasePathSchema>;
