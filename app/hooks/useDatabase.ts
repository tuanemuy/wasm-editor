import { useEffect, useState } from "react";
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
        console.error(
          "Failed to load database module or initialize database:",
          error,
        );
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
