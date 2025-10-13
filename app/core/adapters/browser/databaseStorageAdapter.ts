import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { DatabaseStoragePort } from "@/core/domain/database/ports/databaseStoragePort";

const DB_NAME = "wasm-editor-db-metadata";
const STORE_NAME = "database-info";
const LAST_OPENED_KEY = "last-opened-handle";
const RECENT_DATABASES_KEY = "recent-databases";

export class DatabaseStorageAdapter implements DatabaseStoragePort {
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async saveLastOpenedHandle(handle: FileSystemFileHandle): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.put(handle, LAST_OPENED_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Failed to save handle"));
      });

      db.close();
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseStorageError,
        error instanceof Error
          ? error.message
          : "Failed to save last opened handle",
      );
    }
  }

  async getLastOpenedHandle(): Promise<FileSystemFileHandle | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);

      const handle = await new Promise<FileSystemFileHandle | null>(
        (resolve, reject) => {
          const request = store.get(LAST_OPENED_KEY);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(new Error("Failed to get handle"));
        },
      );

      db.close();
      return handle;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseStorageError,
        error instanceof Error
          ? error.message
          : "Failed to get last opened handle",
      );
    }
  }

  async clearLastOpenedHandle(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(LAST_OPENED_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Failed to clear handle"));
      });

      db.close();
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseStorageError,
        error instanceof Error
          ? error.message
          : "Failed to clear last opened handle",
      );
    }
  }

  async saveRecentDatabase(info: {
    name: string;
    path: string;
  }): Promise<void> {
    try {
      const recentDatabases = await this.getRecentDatabases();

      // Remove duplicate if exists
      const filtered = recentDatabases.filter((db) => db.path !== info.path);

      // Add new entry at the beginning
      filtered.unshift(info);

      // Keep only the last 10 entries
      const updated = filtered.slice(0, 10);

      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.put(updated, RECENT_DATABASES_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(new Error("Failed to save recent database"));
      });

      db.close();
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseStorageError,
        error instanceof Error
          ? error.message
          : "Failed to save recent database",
      );
    }
  }

  async getRecentDatabases(): Promise<Array<{ name: string; path: string }>> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);

      const databases = await new Promise<
        Array<{ name: string; path: string }>
      >((resolve, reject) => {
        const request = store.get(RECENT_DATABASES_KEY);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () =>
          reject(new Error("Failed to get recent databases"));
      });

      db.close();
      return databases;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseStorageError,
        error instanceof Error
          ? error.message
          : "Failed to get recent databases",
      );
    }
  }
}

export const createDatabaseStorageAdapter = (): DatabaseStoragePort => {
  return new DatabaseStorageAdapter();
};
