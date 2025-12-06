import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Database, getDatabase } from "@/core/adapters/tursoWasm/client";

export const useDatabase = (path: string) => {
  const [database, setDatabase] = useState<Database | null>(null);

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      try {
        const db = await getDatabase(path);

        if (!isCancelled) {
          setDatabase(db);
        }
      } catch (error) {
        if (!isCancelled) {
          toast.error("Failed to initialize database");
          if (import.meta.env.DEV) {
            console.error("Database initialization failed:", error);
          }
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [path]);

  return database;
};
