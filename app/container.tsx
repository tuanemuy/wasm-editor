import { createContext, useContext, useMemo } from "react";
import { createDatabaseStorageAdapter } from "@/core/adapters/browser/databaseStorageAdapter";
import { createExportAdapter } from "@/core/adapters/browser/exportAdapter";
import { createFileSystemAccessAdapter } from "@/core/adapters/browser/fileSystemAccessAdapter";
import { createImageProcessingAdapter } from "@/core/adapters/browser/imageProcessingAdapter";
import { createImageStorageAdapter } from "@/core/adapters/browser/imageStorageAdapter";
import { createDatabaseConnectionAdapter } from "@/core/adapters/drizzleSqlite/databaseConnectionAdapter";
import { DrizzleSqliteUnitOfWorkProvider } from "@/core/adapters/drizzleSqlite/unitOfWork";
import type { Context } from "@/core/application/context";
import type { UnitOfWorkProvider } from "@/core/application/unitOfWork";

// DI container type (same as application Context)
export type Container = Context;

export const ContainerContext = createContext<Container>({} as Container);

export const useContainer = () => {
  return useContext(ContainerContext);
};

export function ContainerProvider({ children }: { children: React.ReactNode }) {
  const container: Context = useMemo(() => {
    // Create singleton instances of adapters
    const databaseConnectionPort = createDatabaseConnectionAdapter();
    const fileSystemAccessPort = createFileSystemAccessAdapter();
    const databaseStoragePort = createDatabaseStorageAdapter();
    const exportPort = createExportAdapter();
    const imageStoragePort = createImageStorageAdapter();
    const imageProcessingPort = createImageProcessingAdapter();

    // Create a unit of work provider that dynamically uses the current database connection
    const unitOfWorkProvider: UnitOfWorkProvider = {
      async run<T>(fn: Parameters<UnitOfWorkProvider["run"]>[0]): Promise<T> {
        // biome-ignore lint/suspicious/noExplicitAny: getDb is not part of the port interface
        const db = (databaseConnectionPort as any).getDb();
        if (!db) {
          throw new Error("Database is not connected");
        }
        const provider = new DrizzleSqliteUnitOfWorkProvider(db);
        return provider.run(fn) as Promise<T>;
      },
    };

    return {
      unitOfWorkProvider,
      exportPort,
      imageStoragePort,
      imageProcessingPort,
      databaseConnectionPort,
      databaseStoragePort,
      fileSystemAccessPort,
    };
  }, []);

  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
}
