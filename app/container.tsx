import { createContext, useContext } from "react";
import { BrowserExportPort } from "@/core/adapters/browser/exportPort";
import { BrowserSettingsRepository } from "@/core/adapters/browser/settingsRepository";
import { BrowserTagExtractorPort } from "@/core/adapters/browser/tagExtractorPort";
import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import { DrizzleSqliteNoteQueryService } from "@/core/adapters/drizzleSqlite/noteQueryService";
import { DrizzleSqliteTagQueryService } from "@/core/adapters/drizzleSqlite/tagQueryService";
import { DrizzleSqliteUnitOfWorkProvider } from "@/core/adapters/drizzleSqlite/unitOfWork";
import type { Context } from "@/core/application/context";

export type Container = Context;

export const ContainerContext = createContext<Container>({} as Container);

export const useContainer = () => {
  return useContext(ContainerContext);
};

function createContainer(): Context {
  const databasePath = process.env.VITE_APP_DATABASE_PATH;
  if (!databasePath) {
    throw new Error("VITE_APP_DATABASE_PATH is not defined");
  }

  const db = getDatabase(databasePath);

  const container: Context = {
    unitOfWorkProvider: new DrizzleSqliteUnitOfWorkProvider(db),
    noteQueryService: new DrizzleSqliteNoteQueryService(db),
    tagQueryService: new DrizzleSqliteTagQueryService(db),
    exportPort: new BrowserExportPort(),
    tagExtractorPort: new BrowserTagExtractorPort(),
    settingsRepository: new BrowserSettingsRepository(),
  };

  return container;
}

export function ContainerProvider({ children }: { children: React.ReactNode }) {
  const container = createContainer();

  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
}
