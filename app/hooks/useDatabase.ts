import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getDatabase,
  initializeDatabase,
  closeDatabase,
  type Database,
} from "@/core/adapters/tursoWasm/client";

export const useDatabase = (path: string) => {
  const [database, setDatabase] = useState<Database | null>(null);

  useEffect(() => {
    (async () => {
      if (database) {
        return;
      }

      try {
        const db = await getDatabase(path);
        await initializeDatabase(db);

        setDatabase(db);
      } catch (error) {
        toast.error("Failed to initialize database");
        if (import.meta.env.DEV) {
          console.error("Database initialization failed:", error);
        }
      }
    })();

    return () => {
      if (database) {
        closeDatabase(database);
      }
    };
  }, [path, database]);

  return database;
};
