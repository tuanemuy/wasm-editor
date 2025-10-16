/**
 * Turso WASM Database Client
 *
 * Provides database connection management using Turso WASM API.
 * Note: This does NOT use Drizzle ORM as Turso WASM is not compatible with better-sqlite3.
 *
 * IMPORTANT: Turso WASM can only have ONE active connection per database file.
 * This module implements a singleton pattern to ensure only one connection is created.
 */

import { connect, type Database } from "@tursodatabase/database-wasm/vite";

export type { Database };

// Singleton instance
let dbInstance: Database | null = null;
let dbPath: string | null = null;
let connectionPromise: Promise<Database> | null = null;

/**
 * Get or create a database connection (singleton pattern)
 *
 * @param path - Path to the database file or ":memory:" for in-memory database
 * @returns Promise resolving to the database instance
 */
export async function getDatabase(path: string): Promise<Database> {
  // Return existing instance if already connected to the same path
  if (dbInstance && dbPath === path) {
    return dbInstance;
  }

  // Wait for ongoing connection if in progress
  if (connectionPromise && dbPath === path) {
    return connectionPromise;
  }

  // Close existing connection if path is different
  if (dbInstance && dbPath !== path) {
    dbInstance.close();
    dbInstance = null;
    dbPath = null;
    connectionPromise = null;
  }

  // Create new connection
  dbPath = path;
  connectionPromise = connect(path, {
    timeout: 5000, // busy timeout for handling high-concurrency write cases
  })
    .then((db) => {
      dbInstance = db;
      return db;
    })
    .catch((error) => {
      // Reset state on error
      dbInstance = null;
      dbPath = null;
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    dbPath = null;
  }
}
