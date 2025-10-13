import * as z from "zod";

/**
 * Database file path (storage path)
 */
export const databasePathSchema = z.string().min(1);
export type DatabasePath = z.infer<typeof databasePathSchema>;
